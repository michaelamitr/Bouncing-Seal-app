import type { BeatGrid } from './dsp/beatGrid.ts';

export interface TapTempo {
  /** Registers a tap at media time `time` (s); returns a grid once 3+ taps line up. */
  tap: (time: number) => BeatGrid | null;
  getTapCount: () => number;
  reset: () => void;
}

export interface TapTempoOptions {
  maxTaps?: number;
  /** A pause longer than this starts a fresh tap sequence. */
  resetAfterSeconds?: number;
  minBpm?: number;
  maxBpm?: number;
}

/**
 * Turns taps into a beat grid with a least-squares line fit, which is far less
 * sensitive to one sloppy tap than averaging the intervals.
 */
export const createTapTempo = ({
  maxTaps = 8,
  resetAfterSeconds = 2.5,
  minBpm = 40,
  maxBpm = 240,
}: TapTempoOptions = {}): TapTempo => {
  let taps: number[] = [];

  const tap = (time: number): BeatGrid | null => {
    const previous = taps.at(-1);

    if (
      previous !== undefined &&
      (time <= previous || time - previous > resetAfterSeconds)
    ) {
      taps = [];
    }

    taps = [...taps, time].slice(-maxTaps);

    if (taps.length < 3) {
      return null;
    }

    const count = taps.length;
    const meanIndex = (count - 1) / 2;
    const meanTime = taps.reduce((sum, value) => sum + value, 0) / count;
    let covariance = 0;
    let variance = 0;

    taps.forEach((value, index) => {
      covariance += (index - meanIndex) * (value - meanTime);
      variance += (index - meanIndex) ** 2;
    });

    const period = covariance / variance;
    const bpm = 60 / period;

    if (!Number.isFinite(bpm) || bpm < minBpm || bpm > maxBpm) {
      return null;
    }

    return {
      bpm,
      anchor: meanTime + period * (count - 1 - meanIndex),
      confidence: 1,
    };
  };

  return {
    tap,
    getTapCount: () => taps.length,
    reset: () => {
      taps = [];
    },
  };
};
