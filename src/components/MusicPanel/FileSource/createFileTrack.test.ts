import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createFileTrack, isAudioFile } from './createFileTrack.ts';

test('isAudioFile accepts audio by MIME type or extension', () => {
  assert.equal(isAudioFile({ type: 'audio/mpeg', name: 'x' }), true);
  assert.equal(isAudioFile({ type: '', name: 'song.FLAC' }), true);
  assert.equal(isAudioFile({ type: 'image/png', name: 'seal.png' }), false);
});

test('createFileTrack names the track after the file', () => {
  const file = new File(['abc'], 'Seal Shanty.mp3', {
    type: 'audio/mpeg',
    lastModified: 5,
  });
  const track = createFileTrack(file);

  assert.equal(track.title, 'Seal Shanty');
  assert.equal(track.key, 'file:Seal Shanty.mp3:3:5');
});
