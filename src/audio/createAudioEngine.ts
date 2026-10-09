import { createStore } from '../lib/createStore.ts';
import { analyzeAudioFile } from './analyzeAudioFile.ts';
import { createBeatTracker } from './beatTracker.ts';
import { createSpectralFlux, type SpectralFlux } from './dsp/onsetEnvelope.ts';
import { createMediaClock } from './mediaClock.ts';
import { createTapTempo } from './tapTempo.ts';
import {
  type BeatFrame,
  type PlaybackSource,
  INITIAL_PLAYBACK_SNAPSHOT,
  type PlaybackSnapshot,
  type SyncStatus,
} from './types.ts';

export type AudioInput =
  | { kind: 'stream'; url: string; bpmHint: number | null }
  | { kind: 'file'; file: Blob };

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
}

export interface AudioEngine extends PlaybackSource {
  load: (input: AudioInput) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getProgress: () => PlaybackProgress;
  subscribeProgress: (listener: () => void) => () => void;
}

interface AnalysisGraph {
  context: AudioContext;
  analyser: AnalyserNode;
  spectrum: Float32Array<ArrayBuffer>;
  magnitudes: Float64Array;
  usedBins: number;
  lowBins: number;
  flux: SpectralFlux;
  /** The analyser window ends "now"; onsets sit at its centre. */
  windowCenterDelay: number;
}

const FFT_SIZE = 2048;
const MAX_ANALYSIS_FREQUENCY = 5000;
const LOW_BAND_FREQUENCY = 150;
const DEFAULT_ENERGY = 0.7;
const METADATA_TEMPO_TOLERANCE = 0.04;
const SILENT_DECIBELS = -200;
const MAX_SAMPLE_GAP_SECONDS = 0.1;
const DISPLAY_HINT_TOLERANCE = 0.015;

const createAudioElement = (allowAnalysis: boolean) => {
  const element = new Audio();
  element.preload = 'auto';

  if (allowAnalysis) {
    // Required for Web Audio to read samples from other origins (Audius CDN).
    element.crossOrigin = 'anonymous';
  }

  return element;
};

const createAnalysisGraph = (element: HTMLAudioElement): AnalysisGraph => {
  const context = new AudioContext({ latencyHint: 'interactive' });
  const source = context.createMediaElementSource(element);
  const analyser = context.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);
  analyser.connect(context.destination);

  const binFrequency = context.sampleRate / FFT_SIZE;
  const usedBins = Math.min(
    analyser.frequencyBinCount,
    Math.ceil(MAX_ANALYSIS_FREQUENCY / binFrequency) + 1,
  );

  return {
    context,
    analyser,
    spectrum: new Float32Array(analyser.frequencyBinCount),
    magnitudes: new Float64Array(usedBins),
    usedBins,
    lowBins: Math.max(2, Math.round(LOW_BAND_FREQUENCY / binFrequency)),
    flux: createSpectralFlux(usedBins, binFrequency, {
      maxFrequency: MAX_ANALYSIS_FREQUENCY,
    }),
    windowCenterDelay: FFT_SIZE / 2 / context.sampleRate,
  };
};

/**
 * Plays Audius streams and local files through Web Audio and detects the beat
 * live. Local files are additionally analysed up front for an instant lock.
 * Implements `PlaybackSource`, so the seal stage can follow it. One engine
 * lives for the whole page (a media element can only feed one AudioContext).
 */
export const createAudioEngine = (): AudioEngine => {
  const store = createStore<PlaybackSnapshot>(INITIAL_PLAYBACK_SNAPSHOT);
  const progressStore = createStore<PlaybackProgress>({
    currentTime: 0,
    duration: 0,
  });
  const tracker = createBeatTracker();
  const tapTempo = createTapTempo();
  const clock = createMediaClock();

  const analysedElement = createAudioElement(true);
  let plainElement: HTMLAudioElement | null = null;
  let element = analysedElement;
  let graph: AnalysisGraph | null = null;
  let input: AudioInput | null = null;
  let objectUrl: string | null = null;
  let loadId = 0;
  let frameId: number | null = null;
  let lastSampleTime = 0;
  let isBuffering = false;
  let shortTermLevel = 0;
  let peakLevel = 0;
  let energy = DEFAULT_ENERGY;

  const setSync = (sync: SyncStatus, bpm?: number | null) => {
    if (bpm === undefined) {
      store.set({ sync });
    } else {
      store.set({ sync, bpm: bpm === null ? null : Math.round(bpm) });
    }
  };

  const isAnalysing = () => graph !== null && element === analysedElement;

  const latency = () =>
    isAnalysing() && graph
      ? graph.context.outputLatency || graph.context.baseLatency || 0
      : 0;

  /** Media time of what the listener is hearing right now. */
  const audibleTime = () =>
    clock.read({
      mediaTime: element.currentTime,
      wallTime: performance.now(),
      isPlaying: !element.paused && !isBuffering,
      playbackRate: element.playbackRate,
    }) - latency();

  const updateEnergy = (lowLevel: number) => {
    shortTermLevel += (lowLevel - shortTermLevel) * 0.08;
    peakLevel = Math.max(shortTermLevel, peakLevel * 0.998);
    energy =
      peakLevel > 0 ? Math.min(1, shortTermLevel / peakLevel) : DEFAULT_ENERGY;
  };

  const reportTrackerTempo = () => {
    const bpm = tracker.getBpm();
    const { sync } = store.get();

    if (bpm === null || sync === 'analyzing') {
      return;
    }

    // Show the catalogue's tempo when the live estimate agrees with it, so
    // the badge and the track list don't disagree by a rounding step.
    const hint = input?.kind === 'stream' ? input.bpmHint : null;
    const shownBpm =
      hint && Math.abs(bpm / hint - 1) < DISPLAY_HINT_TOLERANCE ? hint : bpm;
    setSync(sync === 'tapped' ? 'tapped' : 'locked', shownBpm);
  };

  const sampleAudio = () => {
    frameId = requestAnimationFrame(sampleAudio);

    if (!graph || !isAnalysing() || element.paused) {
      return;
    }

    const { analyser, spectrum, magnitudes, usedBins, lowBins, flux } = graph;
    analyser.getFloatFrequencyData(spectrum);
    let lowLevel = 0;

    for (let bin = 0; bin < usedBins; bin += 1) {
      const decibels = spectrum[bin];
      const magnitude =
        Number.isFinite(decibels) && decibels > SILENT_DECIBELS
          ? 10 ** (decibels / 20)
          : 0;
      magnitudes[bin] = magnitude;

      if (bin > 0 && bin < lowBins) {
        lowLevel += magnitude;
      }
    }

    // Flux measures what changed since the previous frame, so the onset most
    // likely happened halfway between the two readings (matters at low fps).
    const now = element.currentTime;
    const since = now - lastSampleTime;
    const onsetTime =
      since > 0 && since < MAX_SAMPLE_GAP_SECONDS ? now - since / 2 : now;
    lastSampleTime = now;
    tracker.push(onsetTime - graph.windowCenterDelay, flux.next(magnitudes));
    updateEnergy(lowLevel / (lowBins - 1));
    reportTrackerTempo();
  };

  const startSampling = () => {
    if (frameId === null) {
      frameId = requestAnimationFrame(sampleAudio);
    }
  };

  const stopSampling = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  const resetAnalysis = () => {
    tracker.reset();
    tapTempo.reset();
    clock.reset();
    graph?.flux.reset();
    lastSampleTime = 0;
    isBuffering = false;
    shortTermLevel = 0;
    peakLevel = 0;
    energy = DEFAULT_ENERGY;
  };

  const updateProgress = () => {
    progressStore.set({
      currentTime: element.currentTime,
      duration: Number.isFinite(element.duration) ? element.duration : 0,
    });
  };

  /** Without audio analysis the seal uses the published tempo, or asks for taps. */
  const followWithoutAnalysis = () => {
    const bpmHint = input?.kind === 'stream' ? input.bpmHint : null;

    if (bpmHint) {
      tracker.seed({ bpm: bpmHint, anchor: 0, confidence: 0.3 });
      setSync('estimated', bpmHint);
    } else {
      setSync('tap-needed', null);
    }
  };

  /** Some hosts don't send CORS headers: play without analysis instead of failing. */
  const fallBackToPlainPlayback = () => {
    if (!input || input.kind !== 'stream') {
      return;
    }

    if (!plainElement) {
      plainElement = createAudioElement(false);
      bindElement(plainElement);
    }

    element = plainElement;
    element.src = input.url;
    element.load();
    followWithoutAnalysis();
    void startPlayback();
  };

  const startPlayback = async () => {
    try {
      await element.play();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';

      if (name === 'NotAllowedError') {
        // Autoplay blocked: the user just has to press play.
        store.set({ status: 'ready' });
      }
      // Other failures surface through the element's `error` event, and an
      // AbortError only means a newer load() interrupted this play().
    }
  };

  const handleError = () => {
    if (element === analysedElement && input?.kind === 'stream') {
      fallBackToPlainPlayback();
      return;
    }

    stopSampling();
    store.set({
      status: 'error',
      errorMessage: 'This track could not be played. Try another one.',
    });
  };

  const bindElement = (target: HTMLAudioElement) => {
    const on = (type: string, handler: () => void) => {
      const listener = () => {
        if (target === element) {
          handler();
        }
      };
      target.addEventListener(type, listener);
    };

    on('playing', () => {
      isBuffering = false;
      store.set({ status: 'playing', errorMessage: null });
      startSampling();
    });
    on('waiting', () => {
      // Stalled on the network: freeze the clock instead of dancing ahead.
      isBuffering = true;
    });
    on('pause', () => {
      // load() also pauses; only a pause during playback is a user pause.
      if (store.get().status === 'playing' && !element.ended) {
        store.set({ status: 'paused' });
      }
      stopSampling();
    });
    on('ended', () => {
      store.set({ status: 'ended' });
      stopSampling();
    });
    on('canplay', () => {
      if (store.get().status === 'loading') {
        store.set({ status: 'ready' });
      }
    });
    on('seeking', () => {
      tracker.clearHistory();
      clock.reset();
      graph?.flux.reset();
      lastSampleTime = 0;
    });
    on('error', handleError);
    on('timeupdate', updateProgress);
    on('durationchange', updateProgress);
    on('emptied', updateProgress);
  };

  bindElement(analysedElement);

  const load = (nextInput: AudioInput) => {
    loadId += 1;
    const currentLoad = loadId;

    stopSampling();
    analysedElement.pause();
    plainElement?.pause();
    plainElement?.removeAttribute('src');

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    input = nextInput;
    element = analysedElement;
    resetAnalysis();

    if (nextInput.kind === 'stream') {
      tracker.setPrior(
        nextInput.bpmHint
          ? { bpm: nextInput.bpmHint, tolerance: METADATA_TEMPO_TOLERANCE }
          : null,
      );
      element.src = nextInput.url;
      store.set({
        status: 'loading',
        sync: 'listening',
        bpm: nextInput.bpmHint ? Math.round(nextInput.bpmHint) : null,
        errorMessage: null,
      });
    } else {
      tracker.setPrior(null);
      objectUrl = URL.createObjectURL(nextInput.file);
      element.src = objectUrl;
      store.set({
        status: 'loading',
        sync: 'analyzing',
        bpm: null,
        errorMessage: null,
      });

      analyzeAudioFile(nextInput.file)
        .then((grid) => {
          if (currentLoad !== loadId) {
            return;
          }

          if (grid) {
            tracker.seed(grid, { lockTempo: true });
            setSync('locked', grid.bpm);
          } else {
            setSync('listening');
          }
        })
        .catch(() => {
          if (currentLoad === loadId) {
            setSync('listening');
          }
        });
    }

    element.load();
    updateProgress();
  };

  const play = async () => {
    if (!input) {
      return;
    }

    if (element === analysedElement && !graph) {
      try {
        graph = createAnalysisGraph(analysedElement);
      } catch {
        // No Web Audio: the music still plays, the beat comes from metadata or taps.
        graph = null;
        followWithoutAnalysis();
      }
    }

    // Start playback synchronously so it stays inside the user's gesture.
    const playback = startPlayback();
    void graph?.context.resume();
    await playback;
  };

  const pause = () => {
    element.pause();
  };

  const getBeatFrame = (): BeatFrame | null => {
    const snapshot = tracker.getBeatAt(audibleTime());

    if (!snapshot) {
      return null;
    }

    return { ...snapshot, energy: isAnalysing() ? energy : DEFAULT_ENERGY };
  };

  const tap = () => {
    const grid = tapTempo.tap(audibleTime());

    if (grid) {
      tracker.seed(grid);
      setSync('tapped', grid.bpm);
    }

    return tapTempo.getTapCount();
  };

  return {
    load,
    play,
    pause,
    togglePlayback: () => {
      if (element.paused) {
        void play();
      } else {
        pause();
      }
    },
    seek: (time: number) => {
      if (Number.isFinite(time)) {
        element.currentTime = Math.max(0, time);
      }
    },
    getProgress: progressStore.get,
    subscribeProgress: progressStore.subscribe,
    getBeatFrame,
    getSnapshot: store.get,
    subscribe: store.subscribe,
    tap,
  };
};
