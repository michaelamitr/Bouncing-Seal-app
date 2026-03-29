import YouTube from 'react-youtube';
import type { Props } from '../CurrentSelection/CurrentSelection';
import { INPUT_STATES } from '../MusicPlayer';

export const PlayerIFrame = ({
  selectedTrack,
  setIsPlaying,
  handlePlayerReady,
  setInputState,
  setFeedbackMessage,
}: Props) => {
  const playerOptions: React.ComponentProps<typeof YouTube>['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
      origin:
        typeof window === 'undefined' ? undefined : window.location.origin,
    },
  };
  return (
    <>
      <div className="music-player-frame">
        <YouTube
          videoId={selectedTrack?.id}
          opts={playerOptions}
          className="music-player-embed"
          iframeClassName="music-player-iframe"
          title={selectedTrack?.title}
          loading="lazy"
          onReady={handlePlayerReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnd={() => setIsPlaying(false)}
          onError={() => {
            setInputState(INPUT_STATES.error);
            setIsPlaying(false);
            setFeedbackMessage(
              'This video could not be embedded. Try a different YouTube link.',
            );
          }}
        />
      </div>
      <p className="music-player-note">
        Paste another link any time or reuse one from your recent picks.
      </p>
    </>
  );
};
