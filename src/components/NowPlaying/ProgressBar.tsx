import { type CSSProperties, useSyncExternalStore } from 'react';

import type { AudioEngine } from '../../audio/createAudioEngine.ts';
import { formatTime } from '../../utils/formatTime.ts';

interface ProgressBarProps {
  engine: AudioEngine;
}

/** Subscribes on its own so only this bar re-renders as the track plays. */
export const ProgressBar = ({ engine }: ProgressBarProps) => {
  const { currentTime, duration } = useSyncExternalStore(
    engine.subscribeProgress,
    engine.getProgress,
  );
  const hasDuration = duration > 0;

  return (
    <div className="progress">
      <span className="progress-time">{formatTime(currentTime)}</span>
      <input
        className="progress-slider"
        type="range"
        min={0}
        max={hasDuration ? duration : 1}
        step={0.1}
        value={hasDuration ? Math.min(currentTime, duration) : 0}
        disabled={!hasDuration}
        onChange={(event) => engine.seek(Number(event.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        style={
          {
            '--progress': hasDuration ? currentTime / duration : 0,
          } as CSSProperties
        }
      />
      <span className="progress-time">{formatTime(duration)}</span>
    </div>
  );
};
