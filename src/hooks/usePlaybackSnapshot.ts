import { useSyncExternalStore } from 'react';

import type { PlaybackSource, PlaybackSnapshot } from '../audio/types.ts';

export const usePlaybackSnapshot = (source: PlaybackSource): PlaybackSnapshot =>
  useSyncExternalStore(source.subscribe, source.getSnapshot);
