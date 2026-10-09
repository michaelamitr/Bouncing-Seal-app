import { type DragEvent, useId, useState } from 'react';

import type { FileTrack } from '../../../types/track.ts';
import { Icon } from '../../Icon/Icon';
import { createFileTrack, isAudioFile } from './createFileTrack.ts';
import './index.css';

interface FileSourceProps {
  onSelect: (track: FileTrack) => void;
}

export const FileSource = ({ onSelect }: FileSourceProps) => {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!isAudioFile(file)) {
      setError(`“${file.name}” doesn't look like an audio file.`);
      return;
    }

    setError(null);
    onSelect(createFileTrack(file));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    accept(event.dataTransfer.files[0]);
  };

  return (
    <div className="file-source">
      <label
        htmlFor={inputId}
        className={`drop-zone${isDragging ? ' drop-zone-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="drop-zone-icon">
          <Icon name="upload" size={26} />
        </span>
        <span className="drop-zone-title">Drop a song here</span>
        <span className="drop-zone-hint">
          or click to choose MP3, M4A, WAV, OGG or FLAC
        </span>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac"
          onChange={(event) => {
            accept(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>

      {error ? (
        <p className="file-source-error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="file-source-note">
        Your file never leaves this device. The seal maps the whole song before
        it starts, so it is on the beat from the very first hop.
      </p>
    </div>
  );
};
