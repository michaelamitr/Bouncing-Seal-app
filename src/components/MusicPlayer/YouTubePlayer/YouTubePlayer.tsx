import YouTube, { type YouTubeProps } from 'react-youtube';

import type { Track } from '../types';

import './index.css';

interface YouTubePlayerProps {
  track: Track;
  onPlaybackChange: (isPlaying: boolean) => void;
  onPlayerError: () => void;
  onPlayerReady: NonNullable<YouTubeProps['onReady']>;
}

export const YouTubePlayer = ({
  track,
  onPlaybackChange,
  onPlayerError,
  onPlayerReady,
}: YouTubePlayerProps) => {
  const playerOptions: YouTubeProps['opts'] = {
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
          videoId={track.id}
          opts={playerOptions}
          className="music-player-embed"
          iframeClassName="music-player-iframe"
          title={track.title}
          loading="lazy"
          onReady={onPlayerReady}
          onPlay={() => onPlaybackChange(true)}
          onPause={() => onPlaybackChange(false)}
          onEnd={() => onPlaybackChange(false)}
          onError={() => onPlayerError()}
        />
      </div>
      <p className="music-player-note">
        Paste another link any time or reuse one from your recent picks.
      </p>
    </>
  );
};
