import type { SavedTrack } from '../types/track.ts';

export const RECENT_TRACK_LIMIT = 8;

/** Moves `track` to the front, removes duplicates and caps the list length. */
export const addRecentTrack = (
  tracks: SavedTrack[],
  track: SavedTrack,
  limit = RECENT_TRACK_LIMIT,
): SavedTrack[] =>
  [track, ...tracks.filter((item) => item.key !== track.key)].slice(0, limit);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNullable = <T>(value: unknown, guard: (item: unknown) => item is T) =>
  value === null || guard(value);

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isSavedTrack = (value: unknown): value is SavedTrack => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const track = value as Record<string, unknown>;
  const hasBase =
    isString(track.key) &&
    isString(track.title) &&
    isString(track.artist) &&
    isNullable(track.artworkUrl, isString) &&
    isNullable(track.durationSeconds, isNumber);

  if (!hasBase) {
    return false;
  }

  if (track.source === 'youtube') {
    return isString(track.videoId);
  }

  return (
    track.source === 'audius' &&
    isString(track.trackId) &&
    isNullable(track.bpmHint, isNumber) &&
    isNullable(track.pageUrl, isString)
  );
};

/** Reads saved picks defensively — storage may hold anything from old versions. */
export const parseRecentTracks = (json: string | null): SavedTrack[] => {
  if (!json) {
    return [];
  }

  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value)
      ? value.filter(isSavedTrack).slice(0, RECENT_TRACK_LIMIT)
      : [];
  } catch {
    return [];
  }
};
