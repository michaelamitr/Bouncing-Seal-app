import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  createYouTubeDriver,
  isYouTubeIframePlayer,
  YOUTUBE_PLAYER_STATE,
} from './createYouTubeDriver.ts';

const createFakePlayer = () => {
  const fake = {
    time: 0,
    playing: false,
    getCurrentTime: () => fake.time,
    getPlaybackRate: () => 1,
    playVideo: () => {
      fake.playing = true;
    },
    pauseVideo: () => {
      fake.playing = false;
    },
  };
  return fake;
};

describe('createYouTubeDriver', () => {
  test('recognises a usable iframe player', () => {
    assert.ok(isYouTubeIframePlayer(createFakePlayer()));
    assert.equal(isYouTubeIframePlayer({ getCurrentTime: 1 }), false);
    assert.equal(isYouTubeIframePlayer(null), false);
  });

  test('asks for taps until the beat is known, then follows the video clock', () => {
    const driver = createYouTubeDriver();
    const player = createFakePlayer();
    driver.prepare();
    driver.attachPlayer(player);
    // Paused, so the driver reads the raw video time (deterministic).
    driver.handleStateChange(YOUTUBE_PLAYER_STATE.paused);

    assert.equal(driver.getSnapshot().sync, 'tap-needed');
    assert.equal(driver.getBeatFrame(), null);

    for (const time of [10, 10.5, 11]) {
      player.time = time;
      driver.tap();
    }

    assert.equal(driver.getSnapshot().sync, 'tapped');
    assert.equal(driver.getSnapshot().bpm, 120);

    player.time = 11.25;
    const frame = driver.getBeatFrame();

    assert.ok(frame);
    assert.ok(Math.abs(frame.phase - 0.5) < 1e-6, `phase ${frame.phase}`);
  });

  test('maps player states and toggles playback', () => {
    const driver = createYouTubeDriver();
    const player = createFakePlayer();
    driver.prepare();
    driver.attachPlayer(player);
    assert.equal(driver.getSnapshot().status, 'ready');

    driver.togglePlayback();
    assert.equal(player.playing, true);

    driver.handleStateChange(YOUTUBE_PLAYER_STATE.playing);
    assert.equal(driver.getSnapshot().status, 'playing');

    driver.togglePlayback();
    assert.equal(player.playing, false);

    driver.handleError();
    assert.equal(driver.getSnapshot().status, 'error');
  });
});
