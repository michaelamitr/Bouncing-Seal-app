import type { YouTubeTrack } from '../types/track.ts';

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const asVideoId = (value: string | null | undefined) =>
  value && VIDEO_ID_PATTERN.test(value) ? value : null;

/**
 * Accepts a bare 11-character ID or any common YouTube URL shape:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/ and music.youtube.com.
 */
export const extractVideoId = (input: string): string | null => {
  const value = input.trim();

  if (VIDEO_ID_PATTERN.test(value)) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value.includes('://') ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, '');
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    return asVideoId(segments[0]);
  }

  if (
    host === 'youtube.com' ||
    host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com'
  ) {
    const fromQuery = asVideoId(url.searchParams.get('v'));

    if (fromQuery) {
      return fromQuery;
    }

    if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) {
      return asVideoId(segments[1]);
    }
  }

  return null;
};

export const createYouTubeTrack = (videoId: string): YouTubeTrack => ({
  source: 'youtube',
  key: `youtube:${videoId}`,
  videoId,
  title: 'YouTube video',
  artist: 'YouTube',
  artworkUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  durationSeconds: null,
});
