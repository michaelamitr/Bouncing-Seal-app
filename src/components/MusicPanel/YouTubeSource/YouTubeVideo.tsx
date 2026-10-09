import { useEffect } from 'react';
import YouTube, { type YouTubeEvent, type YouTubeProps } from 'react-youtube';

import {
  isYouTubeIframePlayer,
  type YouTubeDriver,
} from '../../../audio/createYouTubeDriver.ts';
import type { YouTubeTrack } from '../../../types/track.ts';

interface YouTubeVideoProps {
  track: YouTubeTrack;
  driver: YouTubeDriver;
  onMetadata: (title: string, author: string) => void;
}

interface VideoData {
  title?: unknown;
  author?: unknown;
}

/** https://developers.google.com/youtube/player_parameters */
const PLAYER_OPTIONS: YouTubeProps['opts'] = {
  width: '100%',
  height: '100%',
  playerVars: {
    autoplay: 1, // start right after the user picked the video
    playsinline: 1, // stay inline on iOS instead of going fullscreen
    rel: 0, // related videos only from the same channel
    fs: 0, // fullscreen would hide the seal
    origin: window.location.origin, // lets the IFrame API verify who controls it
  },
};

const readVideoData = (player: unknown): VideoData => {
  const getVideoData = (player as { getVideoData?: () => VideoData })
    .getVideoData;
  return typeof getVideoData === 'function' ? getVideoData.call(player) : {};
};

export const YouTubeVideo = ({
  track,
  driver,
  onMetadata,
}: YouTubeVideoProps) => {
  useEffect(() => () => driver.attachPlayer(null), [driver]);

  const handleReady = (event: YouTubeEvent) => {
    // react-youtube passes the IFrame API's synchronous player object.
    const player: unknown = event.target;
    driver.attachPlayer(isYouTubeIframePlayer(player) ? player : null);

    const { title, author } = readVideoData(player);

    if (typeof title === 'string' && title.trim()) {
      onMetadata(
        title.trim(),
        typeof author === 'string' && author.trim() ? author.trim() : 'YouTube',
      );
    }
  };

  return (
    <div className="youtube-video">
      <YouTube
        videoId={track.videoId}
        opts={PLAYER_OPTIONS}
        className="youtube-video-frame"
        iframeClassName="youtube-video-iframe"
        title={track.title}
        onReady={handleReady}
        onStateChange={(event: YouTubeEvent<number>) =>
          driver.handleStateChange(event.data)
        }
        onError={() => driver.handleError()}
      />
    </div>
  );
};
