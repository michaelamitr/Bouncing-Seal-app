import type { InputStateMap, PlayerReadyEvent, Track } from '../MusicPlayer';
import { PlayerIFrame } from '../PlayerIFrame/PlayerIFrame';
import './index.css';

export interface Props {
  selectedTrack: Track | null;
  setIsPlaying: (value: React.SetStateAction<boolean>) => void;
  handlePlayerReady: (event: PlayerReadyEvent) => void;
  setInputState: React.Dispatch<React.SetStateAction<keyof InputStateMap>>;
  setFeedbackMessage: React.Dispatch<React.SetStateAction<string>>;
}

export const CurrentSelection = ({
  selectedTrack,
  setIsPlaying,
  handlePlayerReady,
  setInputState,
  setFeedbackMessage,
}: Props) => {
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
        <PlayerIFrame
          selectedTrack={selectedTrack}
          setIsPlaying={setIsPlaying}
          handlePlayerReady={handlePlayerReady}
          setInputState={setInputState}
          setFeedbackMessage={setFeedbackMessage}
        />
      ) : (
        <div className="music-player-placeholder">
          <p>Paste a YouTube link or video ID to load the player here.</p>
        </div>
      )}
    </div>
  );
};
