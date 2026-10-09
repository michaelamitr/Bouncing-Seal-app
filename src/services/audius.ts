import type { CatalogTrack } from '../types/track.ts';

/**
 * Audius is a free, open music catalogue with a public REST API: no key, no
 * account, and its audio is served with CORS headers, which is what lets the
 * browser analyse the beat. https://docs.audius.co
 */
const API_BASE_URL = 'https://api.audius.co/v1';
const APP_NAME = 'bouncing-seal';
const RESULT_LIMIT = 20;

interface AudiusTrackResponse {
  id?: unknown;
  title?: unknown;
  duration?: unknown;
  bpm?: unknown;
  permalink?: unknown;
  is_streamable?: unknown;
  is_delete?: unknown;
  is_stream_gated?: unknown;
  artwork?: Record<string, unknown> | null;
  user?: { name?: unknown; handle?: unknown; is_deactivated?: unknown } | null;
}

const asString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const asPositiveNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null;

const withAppName = (path: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries({ ...params, app_name: APP_NAME }).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return url.toString();
};

export const getAudiusStreamUrl = (trackId: string) =>
  withAppName(`/tracks/${encodeURIComponent(trackId)}/stream`);

/** Validates one API item; returns `null` for tracks that can't be streamed. */
export const toCatalogTrack = (value: unknown): CatalogTrack | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const raw = value as AudiusTrackResponse;
  const trackId = asString(raw.id);
  const title = asString(raw.title);
  const isUnavailable =
    raw.is_streamable === false ||
    raw.is_delete === true ||
    raw.is_stream_gated === true ||
    raw.user?.is_deactivated === true;

  if (!trackId || !title || isUnavailable) {
    return null;
  }

  const permalink = asString(raw.permalink);

  return {
    source: 'audius',
    key: `audius:${trackId}`,
    trackId,
    title,
    artist:
      asString(raw.user?.name) ??
      asString(raw.user?.handle) ??
      'Unknown artist',
    artworkUrl:
      asString(raw.artwork?.['480x480']) ?? asString(raw.artwork?.['150x150']),
    durationSeconds: asPositiveNumber(raw.duration),
    bpmHint: asPositiveNumber(raw.bpm),
    pageUrl: permalink ? `https://audius.co${permalink}` : null,
  };
};

const fetchTracks = async (url: string, signal?: AbortSignal) => {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Audius responded with ${response.status}`);
  }

  const body: unknown = await response.json();
  const items =
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { data?: unknown }).data)
      ? (body as { data: unknown[] }).data
      : [];

  return items
    .map(toCatalogTrack)
    .filter((track): track is CatalogTrack => track !== null);
};

export const searchAudiusTracks = (query: string, signal?: AbortSignal) =>
  fetchTracks(
    withAppName('/tracks/search', { query, limit: String(RESULT_LIMIT) }),
    signal,
  );

export const getTrendingAudiusTracks = (signal?: AbortSignal) =>
  fetchTracks(
    withAppName('/tracks/trending', { limit: String(RESULT_LIMIT) }),
    signal,
  );
