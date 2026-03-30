import { RECENT_TRACK_LIMIT } from '../constants';
import type { Track } from '../types';

export const createTrackFromInput = (value: string, videoId: string): Track => {
  const trimmedValue = value.trim();
  const isUrlInput = /^https?:\/\//i.test(trimmedValue);

  return {
    id: videoId,
    title: `YouTube video ${videoId}`,
    channelTitle: isUrlInput ? 'Loaded from pasted link' : 'Loaded from video ID',
    description: isUrlInput ? trimmedValue : `Video ID: ${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    sourceLabel: isUrlInput ? 'Pasted link' : 'Video ID',
  };
};

export const upsertTrack = (tracks: Track[], track: Track) => {
  return [track, ...tracks.filter((item) => item.id !== track.id)].slice(
    0,
    RECENT_TRACK_LIMIT,
  );
};

export const enrichTrack = (
  track: Track,
  title?: string,
  channelTitle?: string,
): Track => {
  return {
    ...track,
    title: title || track.title,
    channelTitle: channelTitle || track.channelTitle,
  };
};
