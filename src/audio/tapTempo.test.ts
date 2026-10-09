import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createTapTempo } from './tapTempo.ts';

describe('createTapTempo', () => {
  test('needs three taps before it reports a tempo', () => {
    const tapTempo = createTapTempo();

    assert.equal(tapTempo.tap(10), null);
    assert.equal(tapTempo.tap(10.5), null);
    assert.ok(tapTempo.tap(11));
  });

  test('fits tempo and anchor through slightly sloppy taps', () => {
    const tapTempo = createTapTempo();
    const taps = [20, 20.49, 21.02, 21.5, 21.99, 22.51];
    const grid = taps.map((time) => tapTempo.tap(time)).at(-1);

    assert.ok(grid);
    assert.ok(Math.abs(grid.bpm - 120) < 1.5, `bpm ${grid.bpm}`);
    assert.ok(Math.abs(grid.anchor - 22.5) < 0.02, `anchor ${grid.anchor}`);
  });

  test('starts over after a long pause', () => {
    const tapTempo = createTapTempo({ resetAfterSeconds: 2 });
    [1, 1.5, 2].forEach((time) => tapTempo.tap(time));
    tapTempo.tap(10);

    assert.equal(tapTempo.getTapCount(), 1);
  });

  test('starts over when time goes backwards', () => {
    const tapTempo = createTapTempo();
    [5, 5.5, 6].forEach((time) => tapTempo.tap(time));
    tapTempo.tap(1);

    assert.equal(tapTempo.getTapCount(), 1);
  });

  test('ignores impossible tempos', () => {
    const tapTempo = createTapTempo({ maxBpm: 200 });
    [0, 0.1, 0.2].forEach((time) => tapTempo.tap(time));

    assert.equal(tapTempo.tap(0.3), null);
  });
});
