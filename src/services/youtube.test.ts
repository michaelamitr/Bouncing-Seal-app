import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createYouTubeTrack, extractVideoId } from './youtube.ts';

describe('extractVideoId', () => {
  const id = 'dQw4w9WgXcQ';

  for (const input of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s&list=PL123`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
    `youtube.com/watch?v=${id}`,
    `  ${id}  `,
  ]) {
    test(`reads ${input.trim()}`, () => {
      assert.equal(extractVideoId(input), id);
    });
  }

  for (const input of [
    '',
    'hello',
    'https://vimeo.com/123',
    'https://www.youtube.com/watch?v=short',
    'https://youtube.com/@channel',
  ]) {
    test(`rejects "${input}"`, () => {
      assert.equal(extractVideoId(input), null);
    });
  }
});

test('createYouTubeTrack builds a keyed track with a thumbnail', () => {
  const track = createYouTubeTrack('dQw4w9WgXcQ');

  assert.equal(track.key, 'youtube:dQw4w9WgXcQ');
  assert.match(track.artworkUrl ?? '', /dQw4w9WgXcQ\/hqdefault\.jpg$/);
});
