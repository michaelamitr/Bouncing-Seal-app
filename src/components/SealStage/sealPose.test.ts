import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { BeatFrame } from '../../audio/types.ts';
import { computeSealPose, toSealTransforms } from './sealPose.ts';

const beat = (overrides: Partial<BeatFrame> = {}): BeatFrame => ({
  bpm: 120,
  phase: 0,
  beatIndex: 0,
  confidence: 1,
  energy: 1,
  ...overrides,
});

const pose = (overrides: Partial<Parameters<typeof computeSealPose>[0]> = {}) =>
  computeSealPose({
    beat: beat(),
    isPlaying: true,
    time: 1,
    reducedMotion: false,
    ...overrides,
  });

describe('computeSealPose', () => {
  test('lands (squashes) on the beat and is highest between beats', () => {
    const onBeat = pose({ beat: beat({ phase: 0 }) });
    const midHop = pose({ beat: beat({ phase: 0.5 }) });

    assert.ok(Math.abs(onBeat.hop) < 1e-9);
    assert.ok(onBeat.scaleY < 0.9);
    assert.ok(midHop.hop < -15);
    assert.ok(midHop.shadowScale < onBeat.shadowScale);
  });

  test('nods to alternating sides on alternating beats', () => {
    const even = pose({ beat: beat({ phase: 0.5, beatIndex: 2 }) });
    const odd = pose({ beat: beat({ phase: 0.5, beatIndex: 3 }) });

    assert.ok(even.headTilt > 0 && odd.headTilt < 0);
  });

  test('hops every other beat for fast songs', () => {
    const fast = (beatIndex: number, phase: number) =>
      pose({ beat: beat({ bpm: 174, beatIndex, phase }) });

    assert.ok(Math.abs(fast(0, 0).hop) < 1e-9);
    assert.ok(fast(1, 0).hop < -15, 'mid-hop on the off beat');
  });

  test('quieter music and reduced motion mean smaller hops', () => {
    const loud = pose({ beat: beat({ phase: 0.5 }) });
    const quiet = pose({ beat: beat({ phase: 0.5, energy: 0 }) });
    const reduced = pose({ beat: beat({ phase: 0.5 }), reducedMotion: true });

    assert.ok(quiet.hop > loud.hop);
    assert.ok(reduced.hop > quiet.hop);
  });

  test('rests and breathes when paused', () => {
    const resting = pose({ isPlaying: false });

    assert.equal(resting.hop, 0);
    assert.ok(Math.abs(resting.scaleY - 1) < 0.05);
  });

  test('blinks now and then', () => {
    assert.ok(pose({ time: 4.3 * 3 + 0.08 }).eyeOpen < 0.2);
    assert.equal(pose({ time: 2 }).eyeOpen, 1);
  });
});

test('toSealTransforms produces SVG transform strings', () => {
  const transforms = toSealTransforms(pose({ beat: beat({ phase: 0.5 }) }));

  assert.match(
    transforms.figure,
    /^translate\(0 -[\d.]+\) translate\(185 232\) scale\(/,
  );
  assert.match(transforms.tail, /^rotate\([\d.]+ 80 196\)$/);
});
