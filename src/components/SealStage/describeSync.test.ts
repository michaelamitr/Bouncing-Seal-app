import assert from 'node:assert/strict';
import { test } from 'node:test';

import { INITIAL_PLAYBACK_SNAPSHOT } from '../../audio/types.ts';
import { describeSync } from './describeSync.ts';

test('describeSync explains each beat state', () => {
  assert.deepEqual(describeSync(INITIAL_PLAYBACK_SNAPSHOT), {
    label: 'Waiting for a song',
    tone: 'idle',
  });
  assert.equal(
    describeSync({ ...INITIAL_PLAYBACK_SNAPSHOT, sync: 'locked', bpm: 124 })
      .label,
    'Locked to the beat · 124 BPM',
  );
  assert.equal(
    describeSync({ ...INITIAL_PLAYBACK_SNAPSHOT, sync: 'tap-needed' }).tone,
    'action',
  );
  assert.equal(
    describeSync({
      ...INITIAL_PLAYBACK_SNAPSHOT,
      status: 'error',
      sync: 'locked',
    }).label,
    'Playback problem',
  );
});
