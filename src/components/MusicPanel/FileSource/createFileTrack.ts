import type { FileTrack } from '../../../types/track.ts';

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i;

export const isAudioFile = (file: Pick<File, 'type' | 'name'>) =>
  file.type.startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name);

export const createFileTrack = (file: File): FileTrack => ({
  source: 'file',
  key: `file:${file.name}:${file.size}:${file.lastModified}`,
  file,
  title: file.name.replace(/\.[^.]+$/, '') || file.name,
  artist: 'From your device',
  artworkUrl: null,
  durationSeconds: null,
});
