import type { YouTubeProps } from 'react-youtube';
import type { Track } from '../types';
import { YouTubePlayer } from '../YouTubePlayer/YouTubePlayer';
import './index.css';

interface CurrentSelectionProps {
  selectedTrack: Track | null;
  onPlaybackChange: (isPlaying: boolean) => void;
  onPlayerError: () => void;
  onPlayerReady: NonNullable<YouTubeProps['onReady']>;
}

export const CurrentSelection = ({
  selectedTrack,
  onPlaybackChange,
  onPlayerError,
  onPlayerReady,
}: CurrentSelectionProps) => {
  return (
    <div className="music-player-view-panel">
      <div className="music-player-view-header">
        <div>
          <p className="music-player-panel-label">Current selection</p>
          <h3>{selectedTrack?.title ?? 'No track selected yet'}</h3>
        </div>
        {selectedTrack ? (
          <p className="music-player-channel">{selectedTrack.channelTitle}</p>
        ) : null}
      </div>

      {selectedTrack ? (
        <YouTubePlayer
          track={selectedTrack}
          onPlaybackChange={onPlaybackChange}
          onPlayerError={onPlayerError}
          onPlayerReady={onPlayerReady}
        />
      ) : (
        <div className="music-player-placeholder">
          <p>Paste a YouTube link or video ID to load the player here.</p>
        </div>
      )}
    </div>
  );
};
