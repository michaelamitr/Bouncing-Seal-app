import { useState, type FormEvent } from 'react';
import type { YouTubeProps } from 'react-youtube';
import {
  DEFAULT_FEEDBACK_MESSAGE,
  EMPTY_QUERY_FEEDBACK_MESSAGE,
  INPUT_STATES,
  INVALID_TRACK_FEEDBACK_MESSAGE,
  PLAYER_ERROR_FEEDBACK_MESSAGE,
  RECENT_PICK_FEEDBACK_MESSAGE,
  TRACK_LOADED_FEEDBACK_MESSAGE,
} from './constants';
import { CurrentSelection } from './CurrentSelection/CurrentSelection';
import { RecentPicks } from './RecentPicks/RecentPicks';
import { TrackForm } from './TrackForm/TrackForm';
import type { InputState, PlayerWithVideoData, Track } from './types';
import { extractVideoId } from './utils/extractVideoId';
import { createTrackFromInput, enrichTrack, upsertTrack } from './utils/track';
import './index.css';

const feedbackId = 'music-player-feedback';

export const MusicPlayer = () => {
  const [query, setQuery] = useState('');
  const [inputState, setInputState] = useState<InputState>(INPUT_STATES.idle);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState(DEFAULT_FEEDBACK_MESSAGE);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setInputState(INPUT_STATES.error);
      setFeedbackMessage(EMPTY_QUERY_FEEDBACK_MESSAGE);
      return;
    }

    const videoId = extractVideoId(trimmedQuery);

    if (!videoId) {
      setInputState(INPUT_STATES.error);
      setFeedbackMessage(INVALID_TRACK_FEEDBACK_MESSAGE);
      return;
    }

    const nextTrack = createTrackFromInput(trimmedQuery, videoId);

    setSelectedTrack(nextTrack);
    setRecentTracks((currentTracks) => upsertTrack(currentTracks, nextTrack));
    setInputState(INPUT_STATES.ready);
    setIsPlaying(false);
    setFeedbackMessage(TRACK_LOADED_FEEDBACK_MESSAGE);
    setQuery('');
  };

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setIsPlaying(false);
    setInputState(INPUT_STATES.ready);
    setFeedbackMessage(RECENT_PICK_FEEDBACK_MESSAGE);
  };

  const handlePlayerReady: NonNullable<YouTubeProps['onReady']> = (event) => {
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

  const handlePlayerError = () => {
    setInputState(INPUT_STATES.error);
    setIsPlaying(false);
    setFeedbackMessage(PLAYER_ERROR_FEEDBACK_MESSAGE);
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

      <TrackForm
        feedbackId={feedbackId}
        hasError={inputState === INPUT_STATES.error}
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
      />

      <p
        id={feedbackId}
        className={`music-player-feedback music-player-feedback-${inputState}`}
        aria-live="polite"
      >
        {feedbackMessage}
      </p>

      <div className="music-player-layout">
        <RecentPicks
          tracks={recentTracks}
          selectedTrackId={selectedTrack?.id ?? null}
          onSelectTrack={handleSelectTrack}
        />

        <CurrentSelection
          selectedTrack={selectedTrack}
          onPlaybackChange={setIsPlaying}
          onPlayerError={handlePlayerError}
          onPlayerReady={handlePlayerReady}
        />
      </div>
    </section>
  );
};
