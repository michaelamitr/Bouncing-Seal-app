import { type FormEvent, useId, useState } from 'react';

import {
  createYouTubeTrack,
  extractVideoId,
} from '../../../services/youtube.ts';
import type { YouTubeTrack } from '../../../types/track.ts';
import './index.css';

interface YouTubeSourceProps {
  onSelect: (track: YouTubeTrack) => void;
}

export const YouTubeSource = ({ onSelect }: YouTubeSourceProps) => {
  const inputId = useId();
  const feedbackId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const videoId = extractVideoId(value);

    if (!videoId) {
      setError(
        value.trim()
          ? 'That is not a YouTube link or 11-character video ID.'
          : 'Paste a YouTube link first.',
      );
      return;
    }

    setError(null);
    setValue('');
    onSelect(createYouTubeTrack(videoId));
  };

  return (
    <div className="youtube-source">
      <form className="youtube-form" onSubmit={handleSubmit} noValidate>
        <label className="youtube-label" htmlFor={inputId}>
          YouTube link or video ID
        </label>
        <div className="youtube-form-row">
          <input
            id={inputId}
            className="text-input"
            type="text"
            inputMode="url"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error !== null}
            aria-describedby={feedbackId}
          />
          <button type="submit" className="button button-primary">
            Load video
          </button>
        </div>
        <p
          id={feedbackId}
          className={
            error
              ? 'youtube-feedback youtube-feedback-error'
              : 'youtube-feedback'
          }
          aria-live="polite"
        >
          {error ??
            'Any song on YouTube works — the seal just needs your help with the beat.'}
        </p>
      </form>

      <div className="youtube-note">
        <p className="youtube-note-title">Why tapping?</p>
        <p>
          Browsers keep a YouTube player’s sound private, so the seal can’t hear
          it. Tap the beat button (or press <kbd>T</kbd>) a few times in rhythm
          and it will dance along with the video — even after pausing or
          seeking.
        </p>
      </div>
    </div>
  );
};
