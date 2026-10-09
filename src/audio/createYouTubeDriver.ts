import { createStore } from '../lib/createStore.ts';
import type { BeatGrid } from './dsp/beatGrid.ts';
import { createMediaClock } from './mediaClock.ts';
import { createTapTempo } from './tapTempo.ts';
import {
  type BeatFrame,
  type PlaybackSource,
  INITIAL_PLAYBACK_SNAPSHOT,
  type PlaybackSnapshot,
} from './types.ts';

/** The subset of the YouTube IFrame player API this app relies on. */
export interface YouTubeIframePlayer {
  getCurrentTime: () => number;
  getPlaybackRate: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
}

export const isYouTubeIframePlayer = (
  value: unknown,
): value is YouTubeIframePlayer =>
  typeof value === 'object' &&
  value !== null &&
  ['getCurrentTime', 'getPlaybackRate', 'playVideo', 'pauseVideo'].every(
    (method) =>
      typeof (value as Record<string, unknown>)[method] === 'function',
  );

/** https://developers.google.com/youtube/iframe_api_reference#onStateChange */
export const YOUTUBE_PLAYER_STATE = {
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
} as const;

export interface YouTubeDriver extends PlaybackSource {
  /** Call when a new video starts loading. */
  prepare: () => void;
  attachPlayer: (player: YouTubeIframePlayer | null) => void;
  handleStateChange: (state: number) => void;
  handleError: () => void;
  pause: () => void;
}

/** Without audio access the seal can't hear, but it can keep a gentle energy. */
const YOUTUBE_ENERGY = 0.75;

/**
 * Browsers never expose a YouTube iframe's audio, so the beat comes from the
 * user tapping along. The tapped grid is laid over the video's own clock, so
 * pausing and seeking keep the seal in time.
 */
export const createYouTubeDriver = (): YouTubeDriver => {
  const store = createStore<PlaybackSnapshot>(INITIAL_PLAYBACK_SNAPSHOT);
  const tapTempo = createTapTempo();
  const clock = createMediaClock();
  let player: YouTubeIframePlayer | null = null;
  let grid: BeatGrid | null = null;

  const isPlaying = () => store.get().status === 'playing';

  const videoTime = () => {
    if (!player) {
      return null;
    }

    try {
      return clock.read({
        mediaTime: player.getCurrentTime(),
        wallTime: performance.now(),
        isPlaying: isPlaying(),
        playbackRate: player.getPlaybackRate(),
      });
    } catch {
      // The iframe may already be gone while React unmounts it.
      return null;
    }
  };

  const getBeatFrame = (): BeatFrame | null => {
    const time = videoTime();

    if (!grid || time === null) {
      return null;
    }

    const beats = (time - grid.anchor) / (60 / grid.bpm);
    const beatIndex = Math.floor(beats);

    return {
      bpm: grid.bpm,
      phase: beats - beatIndex,
      beatIndex,
      confidence: 1,
      energy: YOUTUBE_ENERGY,
    };
  };

  const tap = () => {
    const time = videoTime();

    if (time === null) {
      return 0;
    }

    const tappedGrid = tapTempo.tap(time);

    if (tappedGrid) {
      grid = tappedGrid;
      store.set({ sync: 'tapped', bpm: Math.round(tappedGrid.bpm) });
    }

    return tapTempo.getTapCount();
  };

  const prepare = () => {
    grid = null;
    tapTempo.reset();
    clock.reset();
    store.set({
      status: 'loading',
      sync: 'tap-needed',
      bpm: null,
      errorMessage: null,
    });
  };

  const handleStateChange = (state: number) => {
    if (state === YOUTUBE_PLAYER_STATE.playing) {
      store.set({ status: 'playing', errorMessage: null });
    } else if (state === YOUTUBE_PLAYER_STATE.paused) {
      store.set({ status: 'paused' });
    } else if (state === YOUTUBE_PLAYER_STATE.ended) {
      store.set({ status: 'ended' });
    }

    clock.reset();
  };

  const pause = () => {
    player?.pauseVideo();
  };

  return {
    prepare,
    attachPlayer: (nextPlayer) => {
      player = nextPlayer;

      if (nextPlayer && store.get().status === 'loading') {
        store.set({ status: 'ready' });
      }
    },
    handleStateChange,
    handleError: () => {
      store.set({
        status: 'error',
        errorMessage: 'This video cannot be embedded. Try a different link.',
      });
    },
    togglePlayback: () => {
      if (isPlaying()) {
        pause();
      } else {
        player?.playVideo();
      }
    },
    pause,
    getBeatFrame,
    getSnapshot: store.get,
    subscribe: store.subscribe,
    tap,
  };
};
