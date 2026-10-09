import { createRef, useEffect, useState } from 'react';

import type { PlaybackSource } from '../../audio/types.ts';
import type { SealPartRefs } from './Seal';
import { computeSealPose, toSealTransforms } from './sealPose.ts';

const BEATS_PER_BAR = 4;

const createPartRefs = (): SealPartRefs => ({
  figure: createRef<SVGGElement>(),
  head: createRef<SVGGElement>(),
  tail: createRef<SVGGElement>(),
  flipper: createRef<SVGGElement>(),
  shadow: createRef<SVGEllipseElement>(),
  leftEye: createRef<SVGGElement>(),
  rightEye: createRef<SVGGElement>(),
});

/**
 * Drives the seal from a `requestAnimationFrame` loop. Transforms are written
 * straight to the SVG nodes, so a 60 fps dance never re-renders React.
 * The stage element also receives `data-beat` (0–3) and `--beat-pulse`
 * (1 on the beat, fading to 0) for beat-synced styling.
 */
export const useSealAnimation = (
  source: PlaybackSource,
  reducedMotion: boolean,
) => {
  const [parts] = useState(createPartRefs);
  const [stageRef] = useState(() => createRef<HTMLDivElement>());

  useEffect(() => {
    let frameId = 0;
    let lastBeatInBar = '';

    const setTransform = (element: SVGElement | null, transform: string) => {
      element?.setAttribute('transform', transform);
    };

    const render = () => {
      frameId = requestAnimationFrame(render);

      const isPlaying = source.getSnapshot().status === 'playing';
      const beat = isPlaying ? source.getBeatFrame() : null;
      const pose = computeSealPose({
        beat,
        isPlaying,
        time: performance.now() / 1000,
        reducedMotion,
      });
      const transforms = toSealTransforms(pose);

      setTransform(parts.figure.current, transforms.figure);
      setTransform(parts.head.current, transforms.head);
      setTransform(parts.tail.current, transforms.tail);
      setTransform(parts.flipper.current, transforms.flipper);
      setTransform(parts.shadow.current, transforms.shadow);
      setTransform(parts.leftEye.current, transforms.eyeScale);
      setTransform(parts.rightEye.current, transforms.eyeScale);
      parts.shadow.current?.setAttribute('opacity', String(pose.shadowOpacity));

      const stage = stageRef.current;

      if (stage) {
        const beatInBar = beat
          ? String(
              ((beat.beatIndex % BEATS_PER_BAR) + BEATS_PER_BAR) %
                BEATS_PER_BAR,
            )
          : '';

        if (beatInBar !== lastBeatInBar) {
          lastBeatInBar = beatInBar;
          stage.dataset.beat = beatInBar;
        }

        const pulse = beat ? Math.exp(-beat.phase / 0.12) : 0;
        stage.style.setProperty('--beat-pulse', pulse.toFixed(3));
      }
    };

    frameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId);
  }, [source, reducedMotion, parts, stageRef]);

  return { parts, stageRef };
};
