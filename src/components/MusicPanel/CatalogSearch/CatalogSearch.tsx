import { useState } from 'react';

import { useCatalogSearch } from '../../../hooks/useCatalogSearch';
import type { CatalogTrack } from '../../../types/track.ts';
import { Icon } from '../../Icon/Icon';
import { TrackList } from '../TrackList/TrackList';
import './index.css';

interface CatalogSearchProps {
  currentTrackKey: string | null;
  onSelect: (track: CatalogTrack) => void;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export const CatalogSearch = ({
  currentTrackKey,
  onSelect,
}: CatalogSearchProps) => {
  const [query, setQuery] = useState('');
  const { status, tracks, isTrending } = useCatalogSearch(query);
  const heading = isTrending ? 'Trending now' : 'Results';

  return (
    <div className="catalog-search">
      <label className="search-field">
        <span className="visually-hidden">Search songs on Audius</span>
        <Icon name="search" className="search-field-icon" />
        <input
          className="text-input search-field-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, genres…"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <div className="catalog-results" aria-busy={status === 'loading'}>
        <p className="eyebrow">{heading}</p>

        {status === 'loading' && tracks.length === 0 ? (
          <ul className="catalog-skeleton" aria-label="Loading songs">
            {SKELETON_ROWS.map((row) => (
              <li key={row} />
            ))}
          </ul>
        ) : null}

        {status === 'error' ? (
          <div className="empty-state" role="alert">
            <p>Audius is not answering right now.</p>
            <p>
              Check your connection, try again in a moment, or play your own
              file.
            </p>
          </div>
        ) : null}

        {status === 'success' && tracks.length === 0 ? (
          <div className="empty-state">
            <p>No streamable songs found for “{query.trim()}”.</p>
          </div>
        ) : null}

        {tracks.length > 0 && status !== 'error' ? (
          <div className={status === 'loading' ? 'catalog-stale' : undefined}>
            <TrackList
              tracks={tracks}
              currentTrackKey={currentTrackKey}
              onSelect={onSelect}
              label={heading}
            />
          </div>
        ) : null}
      </div>

      <p className="catalog-credit">
        Free music from independent artists on{' '}
        <a href="https://audius.co" target="_blank" rel="noreferrer">
          Audius
        </a>
        .
      </p>
    </div>
  );
};
