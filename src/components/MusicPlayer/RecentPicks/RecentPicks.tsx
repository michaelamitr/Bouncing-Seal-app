import type { Track } from '../types';
import './index.css';

interface RecentPicksProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (track: Track) => void;
}

export const RecentPicks = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: RecentPicksProps) => {
  return (
    <div className="music-player-picks-panel">
      <div className="music-player-picks-header">
        <h3>Recent picks</h3>
        <span>{tracks.length} saved</span>
      </div>

      {tracks.length > 0 ? (
        <ul className="music-player-picks">
          {tracks.map((track) => {
            const isSelected = selectedTrackId === track.id;

            return (
              <li key={track.id}>
                <button
                  type="button"
                  className={`music-player-pick ${isSelected ? 'music-player-pick-selected' : ''}`}
                  onClick={() => onSelectTrack(track)}
                  aria-pressed={isSelected}
                >
                  <img
                    className="music-player-thumbnail"
                    src={track.thumbnailUrl}
                    alt=""
                  />
                  <div className="music-player-pick-details">
                    <div className="music-player-pick-meta">
                      <span>{track.channelTitle}</span>
                      <span>{track.sourceLabel}</span>
                    </div>
                    <strong>{track.title}</strong>
                    <p>{track.description}</p>
                  </div>
                  <span className="music-player-pick-action">
                    {isSelected ? 'Loaded' : 'Play again'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="music-player-empty">
          <p>Loaded videos will appear here.</p>
        </div>
      )}
    </div>
  );
};
