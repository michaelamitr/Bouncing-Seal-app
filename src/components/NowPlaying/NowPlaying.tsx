import type { AudioEngine } from '../../audio/createAudioEngine.ts';
import type { PlaybackSource } from '../../audio/types.ts';
import { usePlaybackSnapshot } from '../../hooks/usePlaybackSnapshot';
import type { Track } from '../../types/track.ts';
import { Artwork } from '../Artwork/Artwork';
import { Icon } from '../Icon/Icon';
import { ProgressBar } from './ProgressBar';
import { TapBeatButton } from './TapBeatButton';
import './index.css';

interface NowPlayingProps {
  track: Track | null;
  source: PlaybackSource;
  /** Present when the track plays through Web Audio, which supports seeking here. */
  audioEngine: AudioEngine | null;
}

const SOURCE_LABELS: Record<Track['source'], string> = {
  audius: 'Audius',
  file: 'Your file',
  youtube: 'YouTube',
};

export const NowPlaying = ({ track, source, audioEngine }: NowPlayingProps) => {
  const { status, sync, errorMessage } = usePlaybackSnapshot(source);
  const isPlaying = status === 'playing';
  const canControl = track !== null && status !== 'idle' && status !== 'error';
  const needsTaps = sync === 'tap-needed' || sync === 'estimated';

  return (
    <div className="now-playing">
      <div className="now-playing-track">
        <Artwork src={track?.artworkUrl ?? null} size="medium" />
        <div className="now-playing-meta">
          <p className="eyebrow">
            {track
              ? `Now playing · ${SOURCE_LABELS[track.source]}`
              : 'Nothing playing yet'}
          </p>
          <p className="now-playing-title">
            {track?.title ?? 'Pick a song to get started'}
          </p>
          <p className="now-playing-artist">
            {errorMessage ??
              track?.artist ??
              'Search, drop a file or paste a YouTube link.'}
          </p>
        </div>
      </div>

      <div className="now-playing-controls">
        <button
          type="button"
          className="button button-primary play-button"
          onClick={source.togglePlayback}
          disabled={!canControl}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={22} />
        </button>
        <TapBeatButton
          key={track?.key ?? 'none'}
          source={source}
          disabled={!track || !isPlaying}
          highlighted={needsTaps && isPlaying}
        />
      </div>

      {audioEngine && track ? <ProgressBar engine={audioEngine} /> : null}
    </div>
  );
};
