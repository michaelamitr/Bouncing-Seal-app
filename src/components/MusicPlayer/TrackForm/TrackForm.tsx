import type { FormEventHandler } from 'react';
import './index.css';

interface TrackFormProps {
  feedbackId: string;
  hasError: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const TrackForm = ({
  feedbackId,
  hasError,
  query,
  onQueryChange,
  onSubmit,
}: TrackFormProps) => {
  return (
    <form className="music-player-form" onSubmit={onSubmit}>
      <label className="music-player-label" htmlFor="song-search">
        YouTube link or video ID
      </label>
      <div className="music-player-form-row">
        <input
          id="song-search"
          name="song-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="music-player-input"
          placeholder="https://www.youtube.com/watch?v=... or dQw4w9WgXcQ"
          autoComplete="off"
          aria-describedby={feedbackId}
          aria-invalid={hasError}
        />
        <button type="submit" className="music-player-submit">
          Load video
        </button>
      </div>
    </form>
  );
};
