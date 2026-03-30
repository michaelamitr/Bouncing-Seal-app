import { DIRECT_VIDEO_ID_PATTERN } from '../constants';

export const extractVideoId = (value: string) => {
  const trimmedValue = value.trim();

  if (DIRECT_VIDEO_ID_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (hostname.endsWith('youtube.com')) {
      const directVideoId = parsedUrl.searchParams.get('v');

      if (directVideoId) {
        return directVideoId;
      }

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathSegments[0] === 'embed' || pathSegments[0] === 'shorts') {
        return pathSegments[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
};
