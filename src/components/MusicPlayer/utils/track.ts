import { RECENT_TRACK_LIMIT } from '../constants';
import type { Track } from '../types';

export const createTrackFromInput = (videoId: string): Track => {
  return {
    id: videoId,
    title: 'Loading video details...',
    channelTitle: '',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
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
