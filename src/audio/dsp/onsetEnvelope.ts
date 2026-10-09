import { createHannWindow, fft } from './fft.ts';

export interface SpectralFluxOptions {
  /** Log compression factor applied to magnitudes before differencing. */
  compression?: number;
  /** Bins above this frequency are ignored (vocals, cymbals add noise). */
  maxFrequency?: number;
  /** Bins below this frequency get `lowWeight` — kicks and bass drive the bounce. */
  lowFrequency?: number;
  lowWeight?: number;
}

export interface SpectralFlux {
  /** Feeds one magnitude spectrum and returns its onset strength (>= 0). */
  next: (magnitudes: ArrayLike<number>) => number;
  reset: () => void;
}

const DEFAULT_FLUX_OPTIONS: Required<SpectralFluxOptions> = {
  compression: 1000,
  maxFrequency: 5000,
  lowFrequency: 220,
  lowWeight: 3,
};

/**
 * Half-wave rectified, log-compressed spectral flux — a robust onset detector
 * that works the same for offline FFT frames and live AnalyserNode spectra.
 */
export const createSpectralFlux = (
  binCount: number,
  binFrequency: number,
  options: SpectralFluxOptions = {},
): SpectralFlux => {
  const { compression, maxFrequency, lowFrequency, lowWeight } = {
    ...DEFAULT_FLUX_OPTIONS,
    ...options,
  };
  const usedBins = Math.max(
    1,
    Math.min(binCount, Math.ceil(maxFrequency / binFrequency)),
  );
  const weights = new Float64Array(usedBins);
  let weightSum = 0;

  for (let bin = 0; bin < usedBins; bin += 1) {
    // Bin 0 is DC and carries no rhythmic information.
    const weight =
      bin === 0 ? 0 : bin * binFrequency < lowFrequency ? lowWeight : 1;
    weights[bin] = weight;
    weightSum += weight;
  }

  let previous = new Float64Array(usedBins);
  let current = new Float64Array(usedBins);
  let hasPrevious = false;

  const next = (magnitudes: ArrayLike<number>): number => {
    let flux = 0;

    for (let bin = 0; bin < usedBins; bin += 1) {
      const magnitude = magnitudes[bin] ?? 0;
      current[bin] = Math.log1p(compression * Math.max(0, magnitude));

      if (hasPrevious) {
        const rise = current[bin] - previous[bin];

        if (rise > 0) {
          flux += rise * weights[bin];
        }
      }
    }

    [previous, current] = [current, previous];
    hasPrevious = true;

    return weightSum > 0 ? flux / weightSum : 0;
  };

  const reset = () => {
    hasPrevious = false;
  };

  return { next, reset };
};

export interface OnsetEnvelope {
  values: Float32Array;
  frameRate: number;
  /** Time (s) represented by the first value — the centre of its window. */
  startTime: number;
}

export interface OnsetEnvelopeOptions extends SpectralFluxOptions {
  frameRate?: number;
}

const nearestPowerOfTwo = (value: number) =>
  2 ** Math.round(Math.log2(Math.max(2, value)));

/**
 * Computes an onset-strength envelope for a mono PCM signal.
 * Frames are ~23 ms long and sampled at `frameRate` (100 Hz by default).
 */
export const computeOnsetEnvelope = (
  samples: Float32Array,
  sampleRate: number,
  { frameRate = 100, ...fluxOptions }: OnsetEnvelopeOptions = {},
): OnsetEnvelope => {
  const frameSize = nearestPowerOfTwo(sampleRate * 0.023);
  const window = createHannWindow(frameSize);
  const real = new Float64Array(frameSize);
  const imag = new Float64Array(frameSize);
  const magnitudes = new Float64Array(frameSize / 2);
  const flux = createSpectralFlux(
    frameSize / 2,
    sampleRate / frameSize,
    fluxOptions,
  );
  const frameCount = Math.max(
    0,
    Math.floor(((samples.length - frameSize) * frameRate) / sampleRate) + 1,
  );
  const values = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = Math.round((frame * sampleRate) / frameRate);

    for (let index = 0; index < frameSize; index += 1) {
      real[index] = (samples[start + index] ?? 0) * window[index];
      imag[index] = 0;
    }

    fft(real, imag);

    for (let bin = 0; bin < magnitudes.length; bin += 1) {
      magnitudes[bin] = Math.hypot(real[bin], imag[bin]) / frameSize;
    }

    values[frame] = flux.next(magnitudes);
  }

  return { values, frameRate, startTime: frameSize / 2 / sampleRate };
};
