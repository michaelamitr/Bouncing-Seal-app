import type { BeatSnapshot } from './beatTracker.ts';

export interface BeatFrame extends BeatSnapshot {
  /** 0–1 loudness of the low end right now; drives how high the seal hops. */
  energy: number;
}

/**
 * How the current beat is known:
 * - `idle` — nothing loaded
 * - `analyzing` — decoding a file to map its beats up front
 * - `listening` — playing and still detecting the beat live
 * - `locked` — the beat is detected from the audio
 * - `estimated` — tempo is known from metadata but the audio can't be analysed
 * - `tap-needed` — no audio access (YouTube); the user has to tap along
 * - `tapped` — the user set the beat by tapping
 */
export type SyncStatus =
  | 'idle'
  | 'analyzing'
  | 'listening'
  | 'locked'
  | 'estimated'
  | 'tap-needed'
  | 'tapped';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export interface PlaybackSnapshot {
  status: PlaybackStatus;
  sync: SyncStatus;
  bpm: number | null;
  errorMessage: string | null;
}

/**
 * Anything that plays music and can make the seal dance: the Web Audio engine
 * and the YouTube driver both implement it, so the UI does not care where the
 * music comes from.
 */
export interface PlaybackSource {
  /** Called every animation frame — must be cheap and allocation-light. */
  getBeatFrame: () => BeatFrame | null;
  getSnapshot: () => PlaybackSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Registers a tap on the beat; returns how many taps are in the sequence. */
  tap: () => number;
  togglePlayback: () => void;
  pause: () => void;
}

export const INITIAL_PLAYBACK_SNAPSHOT: PlaybackSnapshot = {
  status: 'idle',
  sync: 'idle',
  bpm: null,
  errorMessage: null,
};
