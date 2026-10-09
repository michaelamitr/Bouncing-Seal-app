import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMediaClock } from './mediaClock.ts';

describe('createMediaClock', () => {
  test('returns the raw time while paused', () => {
    const clock = createMediaClock();

    assert.equal(
      clock.read({ mediaTime: 4, wallTime: 1000, isPlaying: false }),
      4,
    );
    assert.equal(
      clock.read({ mediaTime: 4, wallTime: 5000, isPlaying: false }),
      4,
    );
  });

  test('extrapolates between coarse player updates', () => {
    const clock = createMediaClock();
    clock.read({ mediaTime: 10, wallTime: 0, isPlaying: true });

    const time = clock.read({ mediaTime: 10, wallTime: 100, isPlaying: true });

    assert.ok(Math.abs(time - 10.1) < 1e-9);
  });

  test('eases towards a slightly different report instead of jumping', () => {
    const clock = createMediaClock();
    clock.read({ mediaTime: 10, wallTime: 0, isPlaying: true });

    const time = clock.read({
      mediaTime: 10.2,
      wallTime: 100,
      isPlaying: true,
    });

    assert.ok(time > 10.1 && time < 10.2, `time ${time}`);
  });

  test('keeps running while the player repeats a stale value', () => {
    const clock = createMediaClock();
    clock.read({ mediaTime: 10, wallTime: 0, isPlaying: true });

    const time = clock.read({ mediaTime: 10, wallTime: 600, isPlaying: true });

    assert.ok(Math.abs(time - 10.6) < 1e-9);
  });

  test('snaps to the player after a seek', () => {
    const clock = createMediaClock();
    clock.read({ mediaTime: 10, wallTime: 0, isPlaying: true });

    assert.equal(
      clock.read({ mediaTime: 42, wallTime: 50, isPlaying: true }),
      42,
    );
  });

  test('honours the playback rate', () => {
    const clock = createMediaClock();
    clock.read({ mediaTime: 0, wallTime: 0, isPlaying: true, playbackRate: 2 });

    const time = clock.read({
      mediaTime: 0,
      wallTime: 100,
      isPlaying: true,
      playbackRate: 2,
    });

    assert.ok(Math.abs(time - 0.2) < 1e-9);
  });
});
