import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getAudiusStreamUrl, toCatalogTrack } from './audius.ts';

const apiTrack = {
  id: 'GEG9ZWx',
  title: 'CLAWN (Original Mix)',
  duration: 210,
  bpm: 123,
  permalink: '/rowsfred/clawn',
  is_streamable: true,
  artwork: {
    '150x150': 'https://cdn.example/150.jpg',
    '480x480': 'https://cdn.example/480.jpg',
  },
  user: { name: 'ROWSFRED', handle: 'rowsfred', is_deactivated: false },
};

describe('toCatalogTrack', () => {
  test('maps an Audius track', () => {
    assert.deepEqual(toCatalogTrack(apiTrack), {
      source: 'audius',
      key: 'audius:GEG9ZWx',
      trackId: 'GEG9ZWx',
      title: 'CLAWN (Original Mix)',
      artist: 'ROWSFRED',
      artworkUrl: 'https://cdn.example/480.jpg',
      durationSeconds: 210,
      bpmHint: 123,
      pageUrl: 'https://audius.co/rowsfred/clawn',
    });
  });

  test('tolerates missing optional fields', () => {
    const track = toCatalogTrack({
      id: 'a1',
      title: 'Untitled',
      bpm: null,
      artwork: null,
    });

    assert.ok(track);
    assert.equal(track.artist, 'Unknown artist');
    assert.equal(track.bpmHint, null);
    assert.equal(track.artworkUrl, null);
  });

  test('drops tracks that cannot be streamed', () => {
    assert.equal(toCatalogTrack({ ...apiTrack, is_streamable: false }), null);
    assert.equal(toCatalogTrack({ ...apiTrack, is_stream_gated: true }), null);
    assert.equal(
      toCatalogTrack({ ...apiTrack, user: { is_deactivated: true } }),
      null,
    );
    assert.equal(toCatalogTrack({ title: 'no id' }), null);
    assert.equal(toCatalogTrack('nope'), null);
  });
});

test('builds an encoded stream URL with the app name', () => {
  assert.equal(
    getAudiusStreamUrl('a/b'),
    'https://api.audius.co/v1/tracks/a%2Fb/stream?app_name=bouncing-seal',
  );
});
