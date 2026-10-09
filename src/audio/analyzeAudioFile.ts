import {
  type BeatGrid,
  estimateBeatGrid,
  refineBeatGrid,
} from './dsp/beatGrid.ts';
import { computeOnsetEnvelope } from './dsp/onsetEnvelope.ts';

/**
 * Beats live below ~5 kHz, so analysing at a quarter of CD rate is plenty and
 * makes a whole song take well under a second.
 */
const ANALYSIS_SAMPLE_RATE = 11025;

const mixToMono = (buffer: AudioBuffer): Float32Array => {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }

  const mono = new Float32Array(buffer.length);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);

    for (let index = 0; index < data.length; index += 1) {
      mono[index] += data[index] / buffer.numberOfChannels;
    }
  }

  return mono;
};

/**
 * Decodes a whole audio file and maps its beats before playback starts.
 * Resolves to `null` when the audio has no clear pulse (ambient, speech…).
 */
export const analyzeAudioFile = async (
  file: Blob,
): Promise<BeatGrid | null> => {
  const data = await file.arrayBuffer();
  // Decoding through a low-rate offline context resamples for us.
  const context = new OfflineAudioContext(1, 1, ANALYSIS_SAMPLE_RATE);
  const buffer = await context.decodeAudioData(data);
  const { values, frameRate, startTime } = computeOnsetEnvelope(
    mixToMono(buffer),
    buffer.sampleRate,
  );
  const grid = estimateBeatGrid(values, frameRate, { startTime });

  return grid ? refineBeatGrid(values, frameRate, grid, startTime) : null;
};
