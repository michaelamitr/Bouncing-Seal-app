import type { SavedTrack } from '../../../types/track.ts';
import { Icon } from '../../Icon/Icon';
import { TrackList } from '../TrackList/TrackList';
import './index.css';

interface RecentPicksProps {
  tracks: SavedTrack[];
  currentTrackKey: string | null;
  onSelect: (track: SavedTrack) => void;
  onClear: () => void;
}

export const RecentPicks = ({
  tracks,
  currentTrackKey,
  onSelect,
  onClear,
}: RecentPicksProps) => {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <section className="recent-picks" aria-labelledby="recent-picks-title">
      <div className="recent-picks-header">
        <h3 id="recent-picks-title">
          <Icon name="history" size={18} />
          Recent picks
        </h3>
        <button type="button" className="recent-picks-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <TrackList
        tracks={tracks}
        currentTrackKey={currentTrackKey}
        onSelect={onSelect}
        label="Recent picks"
      />
    </section>
  );
};
