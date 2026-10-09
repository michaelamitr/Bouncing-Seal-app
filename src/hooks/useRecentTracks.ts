import { useCallback, useEffect, useState } from 'react';

import type { SavedTrack } from '../types/track.ts';
import { addRecentTrack, parseRecentTracks } from '../utils/recentTracks.ts';

const STORAGE_KEY = 'bouncing-seal:recent-tracks';

const readStorage = () => {
  try {
    return parseRecentTracks(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be disabled (privacy mode); recents then live in memory only.
    return [];
  }
};

/** Recently played catalogue tracks and videos, remembered across visits. */
export const useRecentTracks = () => {
  const [tracks, setTracks] = useState<SavedTrack[]>(readStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch {
      // Quota or privacy errors are not worth interrupting the music for.
    }
  }, [tracks]);

  const remember = useCallback((track: SavedTrack) => {
    setTracks((current) => addRecentTrack(current, track));
  }, []);

  const update = useCallback(
    (key: string, patch: Partial<Pick<SavedTrack, 'title' | 'artist'>>) => {
      setTracks((current) =>
        current.map((track) =>
          track.key === key ? { ...track, ...patch } : track,
        ),
      );
    },
    [],
  );

  const clear = useCallback(() => setTracks([]), []);

  return { tracks, remember, update, clear };
};
