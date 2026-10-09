interface TrackBase {
  /** Unique across sources, e.g. `audius:D7KyD` or `youtube:dQw4w9WgXcQ`. */
  key: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSeconds: number | null;
}

export interface CatalogTrack extends TrackBase {
  source: 'audius';
  trackId: string;
  /** Tempo published by Audius; narrows the live beat search. */
  bpmHint: number | null;
  pageUrl: string | null;
}

export interface FileTrack extends TrackBase {
  source: 'file';
  file: File;
}

export interface YouTubeTrack extends TrackBase {
  source: 'youtube';
  videoId: string;
}

export type Track = CatalogTrack | FileTrack | YouTubeTrack;

/** Local files can't be restored after a reload, so they are never saved. */
export type SavedTrack = CatalogTrack | YouTubeTrack;

export const isSavedTrack = (track: Track): track is SavedTrack =>
  track.source !== 'file';
