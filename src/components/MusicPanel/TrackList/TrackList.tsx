import type { Track } from '../../../types/track.ts';
import { Artwork } from '../../Artwork/Artwork';
import { formatTime } from '../../../utils/formatTime.ts';
import './index.css';

interface TrackListProps<T extends Track> {
  tracks: T[];
  currentTrackKey: string | null;
  onSelect: (track: T) => void;
  label: string;
}

const describeTrack = (track: Track) =>
  [
    track.durationSeconds ? formatTime(track.durationSeconds) : null,
    track.source === 'audius' && track.bpmHint
      ? `${Math.round(track.bpmHint)} BPM`
      : null,
    track.source === 'youtube' ? 'YouTube' : null,
  ]
    .filter(Boolean)
    .join(' · ');

export const TrackList = <T extends Track>({
  tracks,
  currentTrackKey,
  onSelect,
  label,
}: TrackListProps<T>) => (
  <ul className="track-list" aria-label={label}>
    {tracks.map((track) => {
      const isCurrent = track.key === currentTrackKey;

      return (
        <li key={track.key}>
          <button
            type="button"
            className={`track-row${isCurrent ? ' track-row-current' : ''}`}
            onClick={() => onSelect(track)}
            aria-current={isCurrent ? 'true' : undefined}
          >
            <Artwork src={track.artworkUrl} size="small" />
            <span className="track-row-text">
              <span className="track-row-title">{track.title}</span>
              <span className="track-row-artist">{track.artist}</span>
            </span>
            <span className="track-row-meta">
              {isCurrent ? (
                <span className="track-row-badge">Playing</span>
              ) : (
                describeTrack(track)
              )}
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);
