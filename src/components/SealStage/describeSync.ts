import type { PlaybackSnapshot } from '../../audio/types.ts';

export type SyncTone = 'idle' | 'working' | 'locked' | 'action';

export interface SyncDescription {
  label: string;
  tone: SyncTone;
}

/** Human-readable beat status for the stage badge. */
export const describeSync = ({
  sync,
  bpm,
  status,
}: PlaybackSnapshot): SyncDescription => {
  const tempo = bpm ? ` · ${bpm} BPM` : '';

  if (status === 'error') {
    return { label: 'Playback problem', tone: 'action' };
  }

  switch (sync) {
    case 'analyzing':
      return { label: 'Mapping the beats…', tone: 'working' };
    case 'listening':
      return { label: `Listening for the beat${tempo}`, tone: 'working' };
    case 'locked':
      return { label: `Locked to the beat${tempo}`, tone: 'locked' };
    case 'estimated':
      return {
        label: `Tempo from track info${tempo} — tap to align`,
        tone: 'action',
      };
    case 'tap-needed':
      return {
        label: 'Tap along so the seal can find the beat',
        tone: 'action',
      };
    case 'tapped':
      return { label: `Following your taps${tempo}`, tone: 'locked' };
    default:
      return { label: 'Waiting for a song', tone: 'idle' };
  }
};
