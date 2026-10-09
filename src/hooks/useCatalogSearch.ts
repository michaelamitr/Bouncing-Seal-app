import { useEffect, useState } from 'react';

import {
  getTrendingAudiusTracks,
  searchAudiusTracks,
} from '../services/audius.ts';
import type { CatalogTrack } from '../types/track.ts';
import { useDebouncedValue } from './useDebouncedValue';

export type CatalogSearchStatus = 'loading' | 'success' | 'error';

interface SearchResult {
  /** The query these results belong to; `null` before the first response. */
  query: string | null;
  status: Exclude<CatalogSearchStatus, 'loading'>;
  tracks: CatalogTrack[];
}

const SEARCH_DELAY_MS = 350;

/**
 * Searches Audius as the user types (debounced, stale requests aborted).
 * An empty query shows what is trending.
 */
export const useCatalogSearch = (query: string) => {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DELAY_MS);
  const [result, setResult] = useState<SearchResult>({
    query: null,
    status: 'success',
    tracks: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    const request = debouncedQuery
      ? searchAudiusTracks(debouncedQuery, controller.signal)
      : getTrendingAudiusTracks(controller.signal);

    request
      .then((tracks) =>
        setResult({ query: debouncedQuery, status: 'success', tracks }),
      )
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Audius request failed', error);
          setResult({ query: debouncedQuery, status: 'error', tracks: [] });
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const isSettled =
    result.query === debouncedQuery && debouncedQuery === query.trim();

  return {
    status: isSettled ? result.status : ('loading' as const),
    tracks: result.tracks,
    isTrending: !debouncedQuery,
  };
};
