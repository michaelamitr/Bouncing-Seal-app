import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { PlaybackSource } from '../../audio/types.ts';
import { Icon } from '../Icon/Icon';

interface TapBeatButtonProps {
  source: PlaybackSource;
  disabled: boolean;
  /** Draws attention when the seal needs taps to find the beat. */
  highlighted: boolean;
}

const TAP_KEY = 't';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Tap along to the music (or press T) to set the beat by hand. */
export const TapBeatButton = ({
  source,
  disabled,
  highlighted,
}: TapBeatButtonProps) => {
  const [tapCount, setTapCount] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeout = useRef<number | undefined>(undefined);

  const tap = () => {
    setTapCount(source.tap());
    setIsFlashing(true);
    window.clearTimeout(flashTimeout.current);
    flashTimeout.current = window.setTimeout(() => setIsFlashing(false), 120);
  };

  const onTapKey = useEffectEvent(tap);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === TAP_KEY &&
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        onTapKey();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  useEffect(() => () => window.clearTimeout(flashTimeout.current), []);

  const hint =
    tapCount > 0 && tapCount < 3 ? `${3 - tapCount} more…` : 'Tap beat';

  return (
    <button
      type="button"
      className={[
        'button',
        highlighted ? 'button-primary' : 'button-ghost',
        'tap-button',
        isFlashing ? 'tap-button-flash' : '',
      ].join(' ')}
      onClick={tap}
      disabled={disabled}
      aria-keyshortcuts="T"
      title="Tap along with the music, or press T"
    >
      <Icon name="tap" size={18} />
      {hint}
    </button>
  );
};
