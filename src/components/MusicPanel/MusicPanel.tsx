import { useState } from 'react';

import type { YouTubeDriver } from '../../audio/createYouTubeDriver.ts';
import type { SavedTrack, Track } from '../../types/track.ts';
import { CatalogSearch } from './CatalogSearch/CatalogSearch';
import { FileSource } from './FileSource/FileSource';
import { RecentPicks } from './RecentPicks/RecentPicks';
import { SourceTabs } from './SourceTabs/SourceTabs';
import {
  panelId,
  type SourceTabId,
  tabId,
} from './SourceTabs/sourceTabConfig.ts';
import { YouTubeSource } from './YouTubeSource/YouTubeSource';
import { YouTubeVideo } from './YouTubeSource/YouTubeVideo';
import './index.css';

interface MusicPanelProps {
  currentTrack: Track | null;
  recentTracks: SavedTrack[];
  youTubeDriver: YouTubeDriver;
  onPlay: (track: Track) => void;
  onClearRecent: () => void;
  onYouTubeMetadata: (key: string, title: string, author: string) => void;
}

export const MusicPanel = ({
  currentTrack,
  recentTracks,
  youTubeDriver,
  onPlay,
  onClearRecent,
  onYouTubeMetadata,
}: MusicPanelProps) => {
  const [activeTab, setActiveTab] = useState<SourceTabId>('discover');
  const currentTrackKey = currentTrack?.key ?? null;

  return (
    <section className="music-panel panel" aria-labelledby="music-panel-title">
      <header className="music-panel-header">
        <p className="eyebrow">Soundcheck</p>
        <h2 id="music-panel-title">Choose the music</h2>
      </header>

      {currentTrack?.source === 'youtube' ? (
        <YouTubeVideo
          key={currentTrack.key}
          track={currentTrack}
          driver={youTubeDriver}
          onMetadata={(title, author) =>
            onYouTubeMetadata(currentTrack.key, title, author)
          }
        />
      ) : null}

      <SourceTabs activeTab={activeTab} onChange={setActiveTab} />

      <div
        id={panelId(activeTab)}
        role="tabpanel"
        aria-labelledby={tabId(activeTab)}
        className="music-panel-body"
      >
        {activeTab === 'discover' ? (
          <CatalogSearch currentTrackKey={currentTrackKey} onSelect={onPlay} />
        ) : null}
        {activeTab === 'file' ? <FileSource onSelect={onPlay} /> : null}
        {activeTab === 'youtube' ? <YouTubeSource onSelect={onPlay} /> : null}
      </div>

      <RecentPicks
        tracks={recentTracks}
        currentTrackKey={currentTrackKey}
        onSelect={onPlay}
        onClear={onClearRecent}
      />
    </section>
  );
};
