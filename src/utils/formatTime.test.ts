import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatTime } from './formatTime.ts';

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65.9), '1:05');
  assert.equal(formatTime(3410), '56:50');
  assert.equal(formatTime(3725), '1:02:05');
  assert.equal(formatTime(Number.NaN), '0:00');
  assert.equal(formatTime(-3), '0:00');
});
