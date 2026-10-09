import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createYouTubeTrack } from '../services/youtube.ts';
import type { CatalogTrack } from '../types/track.ts';
import { addRecentTrack, parseRecentTracks } from './recentTracks.ts';

const catalogTrack: CatalogTrack = {
  source: 'audius',
  key: 'audius:1',
  trackId: '1',
  title: 'Song',
  artist: 'Artist',
  artworkUrl: null,
  durationSeconds: 180,
  bpmHint: 120,
  pageUrl: null,
};

describe('addRecentTrack', () => {
  test('puts the newest first without duplicates', () => {
    const video = createYouTubeTrack('dQw4w9WgXcQ');
    const list = addRecentTrack(
      addRecentTrack([catalogTrack], video),
      catalogTrack,
    );

    assert.deepEqual(
      list.map((track) => track.key),
      ['audius:1', 'youtube:dQw4w9WgXcQ'],
    );
  });

  test('caps the list', () => {
    const list = Array.from({ length: 5 }, (_, index) =>
      createYouTubeTrack(`video_${index}abcd`),
    ).reduce(
      (tracks, track) => addRecentTrack(tracks, track, 3),
      [] as ReturnType<typeof addRecentTrack>,
    );

    assert.equal(list.length, 3);
    assert.equal(list[0].key, 'youtube:video_4abcd');
  });
});

describe('parseRecentTracks', () => {
  test('round-trips saved tracks', () => {
    const tracks = [catalogTrack, createYouTubeTrack('dQw4w9WgXcQ')];

    assert.deepEqual(parseRecentTracks(JSON.stringify(tracks)), tracks);
  });

  test('ignores broken or foreign data', () => {
    assert.deepEqual(parseRecentTracks(null), []);
    assert.deepEqual(parseRecentTracks('{oops'), []);
    assert.deepEqual(parseRecentTracks('{"a":1}'), []);
    // Shape of the previous app version — no `key`/`source`.
    assert.deepEqual(
      parseRecentTracks(
        '[{"id":"x","title":"t","channelTitle":"","thumbnailUrl":""}]',
      ),
      [],
    );
  });
});
