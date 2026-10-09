import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDrumLoop } from '../test-utils/drumLoop.ts';
import { createBeatTracker } from './beatTracker.ts';
import { computeOnsetEnvelope } from './dsp/onsetEnvelope.ts';

const SAMPLE_RATE = 11025;

/** Simulates an animation loop: samples the envelope at ~60 fps with jitter. */
const feedLikeAnimationFrames = (
  tracker: ReturnType<typeof createBeatTracker>,
  samples: Float32Array,
  timeOffset = 0,
) => {
  const { values, frameRate, startTime } = computeOnsetEnvelope(
    samples,
    SAMPLE_RATE,
  );
  let time = startTime;
  let step = 0;

  while (time < startTime + values.length / frameRate) {
    const position = (time - startTime) * frameRate;
    tracker.push(time + timeOffset, values[Math.floor(position)]);
    step += 1;
    time += 1 / 60 + ((step % 3) - 1) * 0.002;
  }
};

const phaseDistance = (phase: number) => Math.min(phase, 1 - phase);

describe('createBeatTracker', () => {
  test('returns nothing before it has heard enough', () => {
    const tracker = createBeatTracker();
    tracker.push(0, 1);
    tracker.push(0.5, 0);

    assert.equal(tracker.getBeatAt(0.5), null);
  });

  test('locks tempo and phase from live samples', () => {
    const bpm = 118;
    const offset = 0.2;
    const tracker = createBeatTracker();
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm, seconds: 10, offset, jitter: 0.004 }),
    );

    const beatTime = offset + 19 * (60 / bpm);
    const snapshot = tracker.getBeatAt(beatTime);

    assert.ok(snapshot);
    assert.ok(Math.abs(snapshot.bpm - bpm) < 2, `bpm ${snapshot.bpm}`);
    assert.ok(phaseDistance(snapshot.phase) < 0.08, `phase ${snapshot.phase}`);
  });

  test('keeps counting beats continuously', () => {
    const tracker = createBeatTracker();
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 120, seconds: 8, offset: 0 }),
    );

    const first = tracker.getBeatAt(7);
    const second = tracker.getBeatAt(7.5);

    assert.ok(first && second);
    assert.equal(second.beatIndex - first.beatIndex, 1);
  });

  test('follows a tempo change after a few seconds', () => {
    const tracker = createBeatTracker();
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 100, seconds: 12, offset: 0.1 }),
    );
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 128, seconds: 14, offset: 0.1, seed: 3 }),
      12,
    );

    assert.ok(
      Math.abs((tracker.getBpm() ?? 0) - 128) < 2.5,
      `bpm ${tracker.getBpm()}`,
    );
  });

  test('uses a metadata prior to pick the right octave', () => {
    const tracker = createBeatTracker();
    tracker.setPrior({ bpm: 172, tolerance: 0.04 });
    feedLikeAnimationFrames(tracker, createDrumLoop({ bpm: 86, seconds: 8 }));

    assert.ok(
      Math.abs((tracker.getBpm() ?? 0) - 172) < 4,
      `bpm ${tracker.getBpm()}`,
    );
  });

  test('a seeded grid works immediately and survives clearing history', () => {
    const tracker = createBeatTracker();
    tracker.seed({ bpm: 120, anchor: 1, confidence: 0.9 });

    const snapshot = tracker.getBeatAt(3.25);
    assert.ok(snapshot);
    assert.equal(snapshot.beatIndex, 4);
    assert.ok(Math.abs(snapshot.phase - 0.5) < 1e-9);

    tracker.clearHistory();
    assert.equal(tracker.getBpm(), 120);

    tracker.reset();
    assert.equal(tracker.getBpm(), null);
  });

  test('a tempo-locked seed only corrects its phase', () => {
    const tracker = createBeatTracker();
    // Grid with the right tempo but a phase 80 ms late.
    tracker.seed(
      { bpm: 120, anchor: 0.18, confidence: 0.9 },
      { lockTempo: true },
    );
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 120, seconds: 10, offset: 0.1 }),
    );

    const snapshot = tracker.getBeatAt(0.1 + 18 * 0.5);

    assert.equal(tracker.getBpm(), 120);
    assert.ok(snapshot);
    assert.ok(phaseDistance(snapshot.phase) < 0.06, `phase ${snapshot.phase}`);
  });

  test('restarts its history when time jumps backwards (seek)', () => {
    const tracker = createBeatTracker();
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 120, seconds: 6 }),
      30,
    );
    const bpmBeforeSeek = tracker.getBpm();
    feedLikeAnimationFrames(
      tracker,
      createDrumLoop({ bpm: 120, seconds: 6 }),
      0,
    );

    assert.ok(bpmBeforeSeek);
    assert.ok(Math.abs((tracker.getBpm() ?? 0) - 120) < 2);
  });
});
