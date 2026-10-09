import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createDrumLoop } from '../../test-utils/drumLoop.ts';
import { estimateBeatGrid, refineBeatGrid } from './beatGrid.ts';
import { computeOnsetEnvelope } from './onsetEnvelope.ts';

const SAMPLE_RATE = 11025;

/** Distance (in beats) between a grid's beats and the true beats, 0–0.5. */
const phaseError = (anchor: number, trueOffset: number, bpm: number) => {
  const beats = (anchor - trueOffset) / (60 / bpm);
  return Math.abs(beats - Math.round(beats));
};

describe('estimateBeatGrid', () => {
  for (const bpm of [84, 100, 123, 128, 140]) {
    test(`locks onto a ${bpm} BPM drum loop`, () => {
      const offset = 0.37;
      const samples = createDrumLoop({
        bpm,
        seconds: 12,
        offset,
        jitter: 0.004,
      });
      const { values, frameRate, startTime } = computeOnsetEnvelope(
        samples,
        SAMPLE_RATE,
      );
      const grid = estimateBeatGrid(values, frameRate, { startTime });

      assert.ok(grid, 'expected a beat grid');
      assert.ok(
        Math.abs(grid.bpm - bpm) / bpm < 0.02,
        `tempo ${grid.bpm.toFixed(2)} too far from ${bpm}`,
      );
      assert.ok(
        phaseError(grid.anchor, offset, bpm) < 0.06,
        `phase off by ${phaseError(grid.anchor, offset, bpm).toFixed(3)} beats`,
      );
      assert.ok(grid.confidence > 0.3, `confidence ${grid.confidence}`);
    });
  }

  test('respects a metadata tempo prior', () => {
    const samples = createDrumLoop({ bpm: 87, seconds: 10 });
    const { values, frameRate } = computeOnsetEnvelope(samples, SAMPLE_RATE);
    const grid = estimateBeatGrid(values, frameRate, {
      prior: { bpm: 174, tolerance: 0.04 },
    });

    assert.ok(grid);
    assert.ok(Math.abs(grid.bpm - 174) < 3, `got ${grid.bpm}`);
  });

  test('reports the anchor on the caller clock', () => {
    const samples = createDrumLoop({ bpm: 120, seconds: 8, offset: 0.25 });
    const { values, frameRate, startTime } = computeOnsetEnvelope(
      samples,
      SAMPLE_RATE,
    );
    const grid = estimateBeatGrid(values, frameRate, {
      startTime: 100 + startTime,
    });

    assert.ok(grid);
    assert.ok(phaseError(grid.anchor, 100.25, 120) < 0.06);
  });

  test('gives low confidence for noise', () => {
    const samples = createDrumLoop({
      bpm: 120,
      seconds: 8,
      noiseLevel: 0.5,
      offset: 999,
    });
    const { values, frameRate } = computeOnsetEnvelope(samples, SAMPLE_RATE);
    const grid = estimateBeatGrid(values, frameRate);

    assert.ok(
      !grid || grid.confidence < 0.25,
      `confidence ${grid?.confidence}`,
    );
  });

  test('returns null for too little audio', () => {
    assert.equal(estimateBeatGrid(new Float32Array(50), 100), null);
  });
});

describe('refineBeatGrid', () => {
  test('pins the tempo precisely over a long track', () => {
    const bpm = 126.3;
    const offset = 0.52;
    const samples = createDrumLoop({ bpm, seconds: 90, offset, jitter: 0.003 });
    const { values, frameRate, startTime } = computeOnsetEnvelope(
      samples,
      SAMPLE_RATE,
    );
    const rough = estimateBeatGrid(values, frameRate, { startTime });

    assert.ok(rough);

    const refined = refineBeatGrid(values, frameRate, rough, startTime);
    const period = 60 / refined.bpm;
    const lastBeat =
      refined.anchor + period * Math.floor((89 - refined.anchor) / period);
    const endDrift = phaseError(lastBeat, offset, bpm);

    assert.ok(Math.abs(refined.bpm - bpm) < 0.1, `refined ${refined.bpm}`);
    assert.ok(endDrift < 0.05, `drift at the end ${endDrift}`);
  });
});
