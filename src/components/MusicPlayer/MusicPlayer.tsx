import { useState } from 'react';
import './index.css';
import { DIRECT_VIDEO_ID_PATTERN, RECENT_TRACK_LIMIT } from '../../constants';
import { CurrentSelection } from './CurrentSelection/CurrentSelection';

export interface InputStateMap {
  idle: 'idle';
  ready: 'ready';
  error: 'error';
}

export interface Track {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  sourceLabel: string;
}

interface PlayerVideoData {
  author?: string;
  title?: string;
  video_id?: string;
}

interface PlayerWithVideoData {
  getVideoData?: () => PlayerVideoData;
}

export interface PlayerReadyEvent {
  target: unknown;
}

export const INPUT_STATES: InputStateMap = {
  idle: 'idle',
  ready: 'ready',
  error: 'error',
};

const extractVideoId = (value: string) => {
  const trimmedValue = value.trim();

  if (DIRECT_VIDEO_ID_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (hostname.endsWith('youtube.com')) {
      const directVideoId = parsedUrl.searchParams.get('v');

      if (directVideoId) {
        return directVideoId;
      }

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathSegments[0] === 'embed' || pathSegments[0] === 'shorts') {
        return pathSegments[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const createTrackFromInput = (value: string, videoId: string): Track => {
  const trimmedValue = value.trim();
  const isUrlInput = /^https?:\/\//i.test(trimmedValue);

  return {
    id: videoId,
    title: `YouTube video ${videoId}`,
    channelTitle: isUrlInput
      ? 'Loaded from pasted link'
      : 'Loaded from video ID',
    description: isUrlInput ? trimmedValue : `Video ID: ${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    sourceLabel: isUrlInput ? 'Pasted link' : 'Video ID',
  };
};

const upsertTrack = (list: Track[], track: Track) => {
  return [track, ...list.filter((item) => item.id !== track.id)].slice(
    0,
    RECENT_TRACK_LIMIT,
  );
};

const enrichTrack = (track: Track, title?: string, channelTitle?: string) => {
  return {
    ...track,
    title: title || track.title,
    channelTitle: channelTitle || track.channelTitle,
  };
};

export const MusicPlayer = () => {
  const [query, setQuery] = useState('');
  const [inputState, setInputState] = useState<keyof InputStateMap>(
    INPUT_STATES.idle,
  );
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState(
    'Paste a YouTube link or 11-character video ID to load a track for free.',
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const playbackLabel = isPlaying ? 'Now playing' : 'Ready to play';

  const syncTrackMetadata = (
    videoId: string,
    title?: string,
    channelTitle?: string,
  ) => {
    if (!title && !channelTitle) {
      return;
    }

    setSelectedTrack((currentTrack) =>
      currentTrack && currentTrack.id === videoId
        ? enrichTrack(currentTrack, title, channelTitle)
        : currentTrack,
    );

    setRecentTracks((currentTracks) =>
      currentTracks.map((track) =>
        track.id === videoId ? enrichTrack(track, title, channelTitle) : track,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setInputState(INPUT_STATES.error);
      setFeedbackMessage('Paste a YouTube link or video ID to get started.');
      return;
    }

    const videoId = extractVideoId(trimmedQuery);

    if (!videoId) {
      setInputState(INPUT_STATES.error);
      setFeedbackMessage(
        'That does not look like a valid YouTube link or 11-character video ID.',
      );
      return;
    }

    const nextTrack = createTrackFromInput(trimmedQuery, videoId);

    setSelectedTrack(nextTrack);
    setRecentTracks((currentTracks) => upsertTrack(currentTracks, nextTrack));
    setInputState(INPUT_STATES.ready);
    setIsPlaying(false);
    setFeedbackMessage(
      'Video loaded. Press play in the player or paste another link.',
    );
    setQuery('');
  };

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setIsPlaying(false);
    setInputState(INPUT_STATES.ready);
    setFeedbackMessage('Video loaded from your recent picks.');
  };

  const handlePlayerReady = (event: PlayerReadyEvent) => {
    const player = event.target as PlayerWithVideoData;
    const videoData = player.getVideoData?.();
    const videoId =
      typeof videoData?.video_id === 'string' && videoData.video_id
        ? videoData.video_id
        : selectedTrack?.id;

    if (!videoId) {
      return;
    }

    const title = videoData?.title?.trim();
    const channelTitle = videoData?.author?.trim();

    syncTrackMetadata(videoId, title, channelTitle);
  };

  return (
    <section className="music-player" aria-labelledby="music-player-title">
      <div className="music-player-intro">
        <p className="music-player-eyebrow">Seal Soundcheck</p>
        <div className="music-player-heading">
          <div>
            <h2 id="music-player-title">Paste a link and play a track</h2>
          </div>
          <span
            className={`music-player-status music-player-status-${isPlaying ? 'live' : 'idle'}`}
          >
            {playbackLabel}
          </span>
        </div>
      </div>

      <form className="music-player-form" onSubmit={handleSubmit}>
        <label className="music-player-label" htmlFor="song-search">
          YouTube link or video ID
        </label>
        <div className="music-player-form-row">
          <input
            id="song-search"
            name="song-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="music-player-input"
            placeholder="https://www.youtube.com/watch?v=... or dQw4w9WgXcQ"
            autoComplete="off"
          />
          <button type="submit" className="music-player-submit">
            Load video
          </button>
        </div>
      </form>

      <p
        className={`music-player-feedback music-player-feedback-${inputState}`}
        aria-live="polite"
      >
        {feedbackMessage}
      </p>

      <div className="music-player-layout">
        <div className="music-player-picks-panel">
          <div className="music-player-picks-header">
            <h3>Recent picks</h3>
            <span>{recentTracks.length} saved</span>
          </div>

          {recentTracks.length > 0 ? (
            <div className="music-player-picks" role="list">
              {recentTracks.map((track) => {
                const isSelected = selectedTrack?.id === track.id;

                return (
                  <button
                    key={track.id}
                    type="button"
                    className={`music-player-pick ${isSelected ? 'music-player-pick-selected' : ''}`}
                    onClick={() => handleSelectTrack(track)}
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
                );
              })}
            </div>
          ) : (
            <div className="music-player-empty">
              <p>Loaded videos will appear here.</p>
            </div>
          )}
        </div>

        <CurrentSelection
          selectedTrack={selectedTrack}
          setIsPlaying={setIsPlaying}
          handlePlayerReady={handlePlayerReady}
          setInputState={setInputState}
          setFeedbackMessage={setFeedbackMessage}
        />
      </div>
    </section>
  );
};
