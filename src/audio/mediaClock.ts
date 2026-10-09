export interface MediaClockReading {
  /** Raw position reported by the player (s). May update in coarse steps. */
  mediaTime: number;
  /** `performance.now()` at the moment of reading (ms). */
  wallTime: number;
  isPlaying: boolean;
  playbackRate?: number;
}

export interface MediaClock {
  /** Returns a smoothly advancing media time for animation. */
  read: (reading: MediaClockReading) => number;
  reset: () => void;
}

/** Larger differences are treated as a seek and snapped to immediately. */
const SNAP_THRESHOLD_SECONDS = 0.25;
const CORRECTION_GAIN = 0.15;

/**
 * Players such as the YouTube iframe only report their position a few times a
 * second. Animating straight from that value makes the seal stutter, so the
 * clock extrapolates with the wall clock and eases towards each fresh report.
 */
export const createMediaClock = (): MediaClock => {
  let anchorMediaTime: number | null = null;
  let anchorWallTime = 0;
  let lastRawTime: number | null = null;

  const read = ({
    mediaTime,
    wallTime,
    isPlaying,
    playbackRate = 1,
  }: MediaClockReading) => {
    if (!isPlaying || anchorMediaTime === null) {
      anchorMediaTime = mediaTime;
      anchorWallTime = wallTime;
      lastRawTime = mediaTime;
      return mediaTime;
    }

    const predicted =
      anchorMediaTime + ((wallTime - anchorWallTime) / 1000) * playbackRate;

    // An unchanged report is just stale, so only fresh values steer the clock.
    if (mediaTime !== lastRawTime) {
      const error = mediaTime - predicted;
      const isSeek = Math.abs(error) > SNAP_THRESHOLD_SECONDS;

      anchorMediaTime = isSeek
        ? mediaTime
        : predicted + error * CORRECTION_GAIN;
      anchorWallTime = wallTime;
      lastRawTime = mediaTime;
    }

    return (
      anchorMediaTime + ((wallTime - anchorWallTime) / 1000) * playbackRate
    );
  };

  const reset = () => {
    anchorMediaTime = null;
    lastRawTime = null;
  };

  return { read, reset };
};
