import {
  type BeatGrid,
  estimateTempo,
  findBeatOffset,
  normalizeOnsets,
  type TempoPrior,
} from './dsp/beatGrid.ts';

export interface BeatSnapshot {
  bpm: number;
  /** Position inside the current beat, 0 (on the beat) to 1. */
  phase: number;
  /** Running beat counter; lets animations alternate between beats. */
  beatIndex: number;
  confidence: number;
}

export interface BeatTracker {
  /** Feeds one onset-strength sample measured at media time `time` (s). */
  push: (time: number, onsetStrength: number) => void;
  getBeatAt: (time: number) => BeatSnapshot | null;
  getBpm: () => number | null;
  /** Narrows tempo search, e.g. to the BPM reported by a music API. */
  setPrior: (prior: TempoPrior | null) => void;
  /**
   * Installs a trusted grid (offline analysis, taps); live data fine-tunes it.
   * With `lockTempo` only the phase may move — for grids fitted over a whole song.
   */
  seed: (grid: BeatGrid, options?: { lockTempo?: boolean }) => void;
  /** Drops onset history but keeps the tempo — use after seeking. */
  clearHistory: () => void;
  reset: () => void;
}

export interface BeatTrackerOptions {
  frameRate?: number;
  windowSeconds?: number;
  minSeconds?: number;
  updateIntervalSeconds?: number;
}

interface TrackedGrid {
  bpm: number;
  anchor: number;
  beatIndexAtAnchor: number;
  confidence: number;
}

const MIN_LOCK_CONFIDENCE = 0.12;
const SAME_TEMPO_TOLERANCE = 0.04;
const TEMPO_SWITCH_VOTES = 3;
const LIVE_PHASE_GAIN = 0.35;
const SEEDED_PHASE_GAIN = 0.15;
const SEEDED_PRIOR_TOLERANCE = 0.03;
const MAX_GAP_SECONDS = 0.5;

const isSameTempo = (a: number, b: number) =>
  Math.abs(a / b - 1) <= SAME_TEMPO_TOLERANCE;

/** Maps `bpm` onto the octave of `reference` when they are 2× apart. */
const toOctaveOf = (bpm: number, reference: number) => {
  for (const factor of [1, 2, 0.5]) {
    if (isSameTempo(bpm * factor, reference)) {
      return bpm * factor;
    }
  }

  return null;
};

/**
 * Real-time beat tracker. Onset samples arrive at an irregular rate (one per
 * animation frame); they are resampled onto a fixed grid, and every
 * `updateIntervalSeconds` the recent window is re-analysed. Tempo changes need
 * several agreeing votes, while the phase is pulled gently towards each new
 * measurement — like a phase-locked loop — so the seal never jumps.
 */
export const createBeatTracker = ({
  frameRate = 100,
  windowSeconds = 8,
  minSeconds = 3,
  updateIntervalSeconds = 0.5,
}: BeatTrackerOptions = {}): BeatTracker => {
  const windowFrames = Math.round(windowSeconds * frameRate);
  const minFrames = Math.round(minSeconds * frameRate);

  let frames: number[] = [];
  let segmentStart: number | null = null;
  let lastPosition = 0;
  let lastValue = 0;
  let nextUpdateTime = -Infinity;

  let grid: TrackedGrid | null = null;
  let externalPrior: TempoPrior | null = null;
  let seededPrior: TempoPrior | null = null;
  let isTempoLocked = false;
  let candidate: { bpm: number; votes: number } | null = null;

  const beatsAt = (state: TrackedGrid, time: number) =>
    state.beatIndexAtAnchor + (time - state.anchor) / (60 / state.bpm);

  const clearHistory = () => {
    frames = [];
    segmentStart = null;
    nextUpdateTime = -Infinity;
  };

  const chooseTempo = (estimate: number) => {
    if (!grid) {
      return { bpm: estimate, switched: true };
    }

    const sameOctave = toOctaveOf(estimate, grid.bpm);

    if (sameOctave !== null) {
      candidate = null;
      return { bpm: grid.bpm + 0.2 * (sameOctave - grid.bpm), switched: false };
    }

    candidate =
      candidate && isSameTempo(candidate.bpm, estimate)
        ? { bpm: estimate, votes: candidate.votes + 1 }
        : { bpm: estimate, votes: 1 };

    if (candidate.votes >= TEMPO_SWITCH_VOTES) {
      candidate = null;
      return { bpm: estimate, switched: true };
    }

    return { bpm: grid.bpm, switched: false };
  };

  const update = () => {
    if (segmentStart === null) {
      return;
    }

    const recent = frames.slice(-windowFrames);
    const windowStart =
      segmentStart + (frames.length - recent.length) / frameRate;
    const windowEnd = windowStart + recent.length / frameRate;
    const onsets = normalizeOnsets(recent, frameRate);
    const prior = seededPrior ?? externalPrior;
    const tempo = estimateTempo(onsets, frameRate, { prior });

    if (!tempo || tempo.confidence < MIN_LOCK_CONFIDENCE) {
      return;
    }

    const { bpm, switched } =
      isTempoLocked && grid
        ? { bpm: grid.bpm, switched: false }
        : chooseTempo(tempo.bpm);
    const period = 60 / bpm;
    const offset = findBeatOffset(onsets, (60 * frameRate) / bpm);
    let measuredBeat = windowStart + offset / frameRate;
    measuredBeat += period * Math.floor((windowEnd - measuredBeat) / period);

    const confidence = grid
      ? 0.8 * grid.confidence + 0.2 * tempo.confidence
      : tempo.confidence;

    if (!grid) {
      grid = { bpm, anchor: measuredBeat, beatIndexAtAnchor: 0, confidence };
      return;
    }

    const predictedBeats = beatsAt(grid, measuredBeat);
    const nearestBeat = Math.round(predictedBeats);

    if (switched) {
      grid = {
        bpm,
        anchor: measuredBeat,
        beatIndexAtAnchor: nearestBeat,
        confidence,
      };
      return;
    }

    // How early (+) or late (−) the measured beat is versus our prediction.
    const errorSeconds = (nearestBeat - predictedBeats) * (60 / grid.bpm);
    const gain = seededPrior ? SEEDED_PHASE_GAIN : LIVE_PHASE_GAIN;

    grid = {
      bpm,
      anchor: measuredBeat + (1 - gain) * errorSeconds,
      beatIndexAtAnchor: nearestBeat,
      confidence,
    };
  };

  const push = (time: number, onsetStrength: number) => {
    const value = Number.isFinite(onsetStrength)
      ? Math.max(0, onsetStrength)
      : 0;

    if (segmentStart !== null) {
      const position = (time - segmentStart) * frameRate;

      if (
        position < lastPosition ||
        position - lastPosition > MAX_GAP_SECONDS * frameRate
      ) {
        clearHistory();
      }
    }

    if (segmentStart === null) {
      segmentStart = time;
      frames = [value];
      lastPosition = 0;
      lastValue = value;
      return;
    }

    const position = (time - segmentStart) * frameRate;

    for (let index = frames.length; index <= Math.floor(position); index += 1) {
      const fraction =
        position === lastPosition
          ? 1
          : (index - lastPosition) / (position - lastPosition);
      frames.push(lastValue + (value - lastValue) * fraction);
    }

    lastPosition = position;
    lastValue = value;

    const overflow = frames.length - windowFrames * 1.5;

    if (overflow > 0) {
      const dropped = frames.length - windowFrames;
      frames.splice(0, dropped);
      segmentStart += dropped / frameRate;
      lastPosition -= dropped;
    }

    if (time >= nextUpdateTime && frames.length >= minFrames) {
      nextUpdateTime = time + updateIntervalSeconds;
      update();
    }
  };

  const getBeatAt = (time: number): BeatSnapshot | null => {
    if (!grid) {
      return null;
    }

    const beats = beatsAt(grid, time);
    const beatIndex = Math.floor(beats);

    return {
      bpm: grid.bpm,
      phase: beats - beatIndex,
      beatIndex,
      confidence: grid.confidence,
    };
  };

  const seed: BeatTracker['seed'] = (trusted, { lockTempo = false } = {}) => {
    grid = {
      bpm: trusted.bpm,
      anchor: trusted.anchor,
      beatIndexAtAnchor: 0,
      confidence: Math.max(0.6, trusted.confidence),
    };
    seededPrior = { bpm: trusted.bpm, tolerance: SEEDED_PRIOR_TOLERANCE };
    isTempoLocked = lockTempo;
    candidate = null;
  };

  const reset = () => {
    clearHistory();
    grid = null;
    seededPrior = null;
    isTempoLocked = false;
    candidate = null;
  };

  return {
    push,
    getBeatAt,
    getBpm: () => grid?.bpm ?? null,
    setPrior: (prior) => {
      externalPrior = prior;
    },
    seed,
    clearHistory,
    reset,
  };
};
