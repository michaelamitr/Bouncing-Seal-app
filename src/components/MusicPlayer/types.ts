export type InputState = 'idle' | 'ready' | 'error';

export interface Track {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  sourceLabel: string;
}

export interface PlayerVideoData {
  author?: string;
  title?: string;
  video_id?: string;
}

export interface PlayerWithVideoData {
  getVideoData?: () => PlayerVideoData;
}
