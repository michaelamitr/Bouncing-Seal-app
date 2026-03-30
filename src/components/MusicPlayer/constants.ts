export const DIRECT_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
export const RECENT_TRACK_LIMIT = 6;

export const INPUT_STATES = {
  idle: 'idle',
  ready: 'ready',
  error: 'error',
} as const;

export const DEFAULT_FEEDBACK_MESSAGE =
  'Paste a YouTube link or 11-character video ID to load a track for free.';
export const EMPTY_QUERY_FEEDBACK_MESSAGE =
  'Paste a YouTube link or video ID to get started.';
export const INVALID_TRACK_FEEDBACK_MESSAGE =
  'That does not look like a valid YouTube link or 11-character video ID.';
export const TRACK_LOADED_FEEDBACK_MESSAGE =
  'Video loaded. Press play in the player or paste another link.';
export const RECENT_PICK_FEEDBACK_MESSAGE =
  'Video loaded from your recent picks.';
export const PLAYER_ERROR_FEEDBACK_MESSAGE =
  'This video could not be embedded. Try a different YouTube link.';
