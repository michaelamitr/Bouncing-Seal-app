export interface BeatGrid {
  bpm: number;
  /** Time (seconds, same clock as the envelope) of one beat. */
  anchor: number;
  /** 0–1, how periodic the analysed onsets were. */
  confidence: number;
}

export interface TempoPrior {
  bpm: number;
  /** Allowed relative deviation, e.g. 0.04 = ±4 %. */
  tolerance: number;
}

export interface TempoEstimate {
  bpm: number;
  confidence: number;
}

export interface TempoOptions {
  minBpm?: number;
  maxBpm?: number;
  prior?: TempoPrior | null;
}

const DEFAULT_MIN_BPM = 60;
const DEFAULT_MAX_BPM = 190;
/** Most popular music sits around 120 BPM; used to break octave ties. */
const NEUTRAL_TEMPO_CENTER = 120;
const NEUTRAL_TEMPO_SPREAD_OCTAVES = 1;
/** Fastest tempo the half-tempo correction may jump to. */
const PREFERRED_MAX_BPM = 150;

export const bpmToPeriod = (bpm: number) => 60 / bpm;

const movingAverage = (values: ArrayLike<number>, radius: number) => {
  const result = new Float64Array(values.length);
  let sum = 0;
  let count = 0;
  let left = 0;
  let right = -1;

  for (let index = 0; index < values.length; index += 1) {
    while (right < Math.min(values.length - 1, index + radius)) {
      right += 1;
      sum += values[right];
      count += 1;
    }

    while (left < index - radius) {
      sum -= values[left];
      count -= 1;
      left += 1;
    }

    result[index] = sum / count;
  }

  return result;
};

/**
 * Removes the slowly varying loudness trend and keeps only the peaks that
 * stand out locally, so quiet intros and loud drops are treated alike.
 */
export const normalizeOnsets = (
  envelope: ArrayLike<number>,
  frameRate: number,
): Float64Array => {
  const trend = movingAverage(envelope, Math.round(frameRate * 0.2));
  const result = new Float64Array(envelope.length);
  let sumSquares = 0;

  for (let index = 0; index < envelope.length; index += 1) {
    const value = Math.max(0, envelope[index] - trend[index]);
    result[index] = value;
    sumSquares += value * value;
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, envelope.length));

  if (rms > 0) {
    for (let index = 0; index < result.length; index += 1) {
      result[index] /= rms;
    }
  }

  return result;
};

const autocorrelate = (signal: Float64Array, maxLag: number) => {
  const length = signal.length;
  let mean = 0;

  for (let index = 0; index < length; index += 1) {
    mean += signal[index];
  }

  mean /= Math.max(1, length);

  const centered = signal.map((value) => value - mean);
  const result = new Float64Array(maxLag + 1);

  for (let lag = 0; lag <= maxLag && lag < length; lag += 1) {
    let sum = 0;

    for (let index = 0; index + lag < length; index += 1) {
      sum += centered[index] * centered[index + lag];
    }

    result[lag] = sum / (length - lag);
  }

  const energy = result[0];

  if (energy > 0) {
    for (let lag = 0; lag < result.length; lag += 1) {
      result[lag] /= energy;
    }
  }

  return result;
};

const interpolate = (values: Float64Array, position: number) => {
  const lower = Math.floor(position);
  const upper = Math.min(values.length - 1, lower + 1);
  const fraction = position - lower;

  if (lower < 0 || lower >= values.length) {
    return 0;
  }

  return values[lower] * (1 - fraction) + values[upper] * fraction;
};

const smooth = (values: Float64Array) =>
  values.map((value, index) => {
    const previous = values[index - 1] ?? value;
    const next = values[index + 1] ?? value;
    return 0.25 * previous + 0.5 * value + 0.25 * next;
  });

const refineLocalMaximum = (score: (lag: number) => number, lag: number) => {
  let best = lag;

  for (const candidate of [lag - 1, lag + 1]) {
    if (candidate > 1 && score(candidate) > score(best)) {
      best = candidate;
    }
  }

  return best;
};

const tempoWeight = (bpm: number, prior: TempoPrior | null | undefined) => {
  if (prior) {
    return Math.abs(bpm / prior.bpm - 1) <= prior.tolerance ? 1 : 0;
  }

  const octaves = Math.log2(bpm / NEUTRAL_TEMPO_CENTER);

  return Math.exp(-0.5 * (octaves / NEUTRAL_TEMPO_SPREAD_OCTAVES) ** 2);
};

/**
 * Estimates the dominant tempo of an onset envelope with a harmonically
 * enhanced, prior-weighted autocorrelation.
 */
export const estimateTempo = (
  onsets: Float64Array,
  frameRate: number,
  {
    minBpm = DEFAULT_MIN_BPM,
    maxBpm = DEFAULT_MAX_BPM,
    prior = null,
  }: TempoOptions = {},
): TempoEstimate | null => {
  // A trusted prior (song metadata, an earlier lock) replaces the open range.
  const lowBpm = prior ? prior.bpm * (1 - prior.tolerance) : minBpm;
  const highBpm = prior ? prior.bpm * (1 + prior.tolerance) : maxBpm;
  const minLag = Math.max(2, Math.floor((60 * frameRate) / highBpm));
  const maxLag = Math.ceil((60 * frameRate) / lowBpm);

  if (minLag >= maxLag || onsets.length < maxLag * 2) {
    return null;
  }

  // Smoothing lets beats that fall between frames still line up.
  const correlation = autocorrelate(
    smooth(smooth(onsets)),
    Math.min(onsets.length - 1, maxLag * 2 + 2),
  );
  // A true beat period is also periodic at twice its length.
  const harmonicScore = (lag: number) =>
    Math.max(0, correlation[lag] + 0.5 * interpolate(correlation, lag * 2));
  let bestLag = -1;
  let bestScore = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    const score =
      harmonicScore(lag) * tempoWeight((60 * frameRate) / lag, prior);

    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  if (bestLag < 0) {
    return null;
  }

  // Drum patterns repeat every two beats (kick / snare), which often makes
  // half tempo win. Prefer the double tempo when it is nearly as periodic and
  // still a comfortable bouncing pace.
  const doubleLag = Math.round(bestLag / 2);
  const doubleBpm = (60 * frameRate) / doubleLag;

  if (
    !prior &&
    doubleBpm <= PREFERRED_MAX_BPM &&
    doubleBpm <= maxBpm &&
    harmonicScore(doubleLag) >= 0.5 * harmonicScore(bestLag)
  ) {
    bestLag = refineLocalMaximum(harmonicScore, doubleLag);
  }

  // Parabolic interpolation gives sub-frame period precision.
  const left = harmonicScore(bestLag - 1);
  const center = harmonicScore(bestLag);
  const right = harmonicScore(bestLag + 1);
  const curvature = left - 2 * center + right;
  const shift =
    curvature < 0
      ? Math.max(-0.5, Math.min(0.5, (0.5 * (left - right)) / curvature))
      : 0;
  const lag = bestLag + shift;

  return {
    bpm: (60 * frameRate) / lag,
    confidence: Math.max(0, Math.min(1, interpolate(correlation, lag))),
  };
};

/**
 * Finds the beat offset (in frames, within one period) whose comb of
 * predicted beats collects the most onset energy. Recent beats count more,
 * which keeps live tracking responsive.
 */
export const findBeatOffset = (
  onsets: Float64Array,
  periodFrames: number,
): number => {
  const smoothed = smooth(onsets);
  const length = smoothed.length;
  let bestOffset = 0;
  let bestScore = -1;

  for (let offset = 0; offset < periodFrames; offset += 0.5) {
    let score = 0;

    for (let position = offset; position < length; position += periodFrames) {
      const weight = 0.5 + 0.5 * (position / length);
      score += interpolate(smoothed, position) * weight;
    }

    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return bestOffset;
};

export interface BeatGridOptions extends TempoOptions {
  /** Clock time of the first envelope frame. */
  startTime?: number;
}

export const estimateBeatGrid = (
  envelope: ArrayLike<number>,
  frameRate: number,
  { startTime = 0, ...tempoOptions }: BeatGridOptions = {},
): BeatGrid | null => {
  const onsets = normalizeOnsets(envelope, frameRate);
  const tempo = estimateTempo(onsets, frameRate, tempoOptions);

  if (!tempo) {
    return null;
  }

  const periodFrames = (60 * frameRate) / tempo.bpm;
  const offset = findBeatOffset(onsets, periodFrames);

  return {
    bpm: tempo.bpm,
    anchor: startTime + offset / frameRate,
    confidence: tempo.confidence,
  };
};

/**
 * Snaps every predicted beat to its nearby onset peak and fits a straight
 * line through them. Over a whole song this pins the tempo to a fraction of a
 * BPM, which keeps the seal in sync minutes later.
 */
export const refineBeatGrid = (
  envelope: ArrayLike<number>,
  frameRate: number,
  grid: BeatGrid,
  startTime = 0,
): BeatGrid => {
  const onsets = smooth(normalizeOnsets(envelope, frameRate));
  let refined = grid;

  for (let pass = 0; pass < 2; pass += 1) {
    const periodFrames = (60 * frameRate) / refined.bpm;
    const anchorFrame = (refined.anchor - startTime) * frameRate;
    const searchRadius = Math.max(1, Math.round(periodFrames * 0.12));
    const firstBeat = Math.ceil(-anchorFrame / periodFrames);
    const points: Array<{ beat: number; frame: number }> = [];

    for (
      let beat = firstBeat;
      anchorFrame + beat * periodFrames < onsets.length;
      beat += 1
    ) {
      const predicted = Math.round(anchorFrame + beat * periodFrames);
      let peakFrame = -1;
      let peakValue = 1; // only peaks above the signal RMS count as beats

      for (
        let frame = Math.max(0, predicted - searchRadius);
        frame <= Math.min(onsets.length - 1, predicted + searchRadius);
        frame += 1
      ) {
        if (onsets[frame] > peakValue) {
          peakValue = onsets[frame];
          peakFrame = frame;
        }
      }

      if (peakFrame >= 0) {
        points.push({ beat, frame: peakFrame });
      }
    }

    if (points.length < 8) {
      return refined;
    }

    const meanBeat =
      points.reduce((sum, point) => sum + point.beat, 0) / points.length;
    const meanFrame =
      points.reduce((sum, point) => sum + point.frame, 0) / points.length;
    let covariance = 0;
    let variance = 0;

    for (const point of points) {
      covariance += (point.beat - meanBeat) * (point.frame - meanFrame);
      variance += (point.beat - meanBeat) ** 2;
    }

    const fittedPeriod = covariance / variance;

    // A large jump means the fit latched onto something else — keep the grid.
    if (
      !Number.isFinite(fittedPeriod) ||
      Math.abs(fittedPeriod / periodFrames - 1) > 0.02
    ) {
      return refined;
    }

    const fittedAnchorFrame = meanFrame - fittedPeriod * meanBeat;

    refined = {
      bpm: (60 * frameRate) / fittedPeriod,
      anchor: startTime + fittedAnchorFrame / frameRate,
      confidence: refined.confidence,
    };
  }

  return refined;
};
