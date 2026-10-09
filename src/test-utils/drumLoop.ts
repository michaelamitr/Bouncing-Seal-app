/**
 * Deterministic synthetic drum loops for unit tests. Not used by the app.
 */

const createRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
};

export interface DrumLoopOptions {
  bpm: number;
  seconds: number;
  sampleRate?: number;
  /** Time of the first downbeat in seconds. */
  offset?: number;
  /** Random timing error per hit in seconds (human drummer feel). */
  jitter?: number;
  noiseLevel?: number;
  seed?: number;
}

/** Kick on every beat, snare on 2 and 4, hi-hats on eighth notes, plus hiss. */
export const createDrumLoop = ({
  bpm,
  seconds,
  sampleRate = 11025,
  offset = 0.1,
  jitter = 0,
  noiseLevel = 0.02,
  seed = 7,
}: DrumLoopOptions): Float32Array => {
  const random = createRandom(seed);
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  const beat = 60 / bpm;

  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (random() * 2 - 1) * noiseLevel;
  }

  const addHit = (
    time: number,
    duration: number,
    render: (t: number) => number,
  ) => {
    const start = Math.round(time * sampleRate);
    const length = Math.round(duration * sampleRate);

    for (
      let index = 0;
      index < length && start + index < samples.length;
      index += 1
    ) {
      if (start + index >= 0) {
        samples[start + index] += render(index / sampleRate);
      }
    }
  };

  for (let step = 0; offset + step * (beat / 2) < seconds; step += 1) {
    const time = offset + step * (beat / 2) + (random() * 2 - 1) * jitter;
    const isBeat = step % 2 === 0;
    const beatIndex = Math.floor(step / 2);

    if (isBeat) {
      addHit(
        time,
        0.18,
        (t) =>
          Math.sin(2 * Math.PI * (55 + 90 * Math.exp(-t * 30)) * t) *
          Math.exp(-t * 18) *
          0.9,
      );

      if (beatIndex % 2 === 1) {
        addHit(time, 0.12, (t) => (random() * 2 - 1) * Math.exp(-t * 30) * 0.5);
      }
    } else {
      addHit(time, 0.04, (t) => (random() * 2 - 1) * Math.exp(-t * 120) * 0.15);
    }
  }

  return samples;
};
