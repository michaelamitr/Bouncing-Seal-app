import type { ReactNode } from 'react';

import type { PlaybackSource } from '../../audio/types.ts';
import { usePlaybackSnapshot } from '../../hooks/usePlaybackSnapshot';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { describeSync } from './describeSync.ts';
import { Seal } from './Seal';
import { useSealAnimation } from './useSealAnimation';
import './index.css';
import './seal.css';

interface SealStageProps {
  source: PlaybackSource;
  /** Transport controls rendered under the scene. */
  children?: ReactNode;
}

const BEAT_DOTS = [0, 1, 2, 3];

export const SealStage = ({ source, children }: SealStageProps) => {
  const snapshot = usePlaybackSnapshot(source);
  const reducedMotion = usePrefersReducedMotion();
  const { parts, stageRef } = useSealAnimation(source, reducedMotion);
  const sync = describeSync(snapshot);

  return (
    <section className="seal-stage panel" aria-labelledby="seal-stage-title">
      <header className="seal-stage-header">
        <div>
          <p className="eyebrow">Seal stage</p>
          <h2 id="seal-stage-title">Meet Pebble, the harbor seal</h2>
        </div>
        <p className={`sync-badge sync-badge-${sync.tone}`} aria-live="polite">
          <span className="sync-badge-dot" aria-hidden="true" />
          {sync.label}
        </p>
      </header>

      <div className="seal-scene" ref={stageRef}>
        <div className="seal-scene-glow" aria-hidden="true" />
        <Seal parts={parts} className="seal-svg" />
        <div className="beat-dots" aria-hidden="true">
          {BEAT_DOTS.map((dot) => (
            <span key={dot} className="beat-dot" />
          ))}
        </div>
      </div>

      {children}
    </section>
  );
};
