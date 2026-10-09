# Bouncing Seal 🦭

Pick a song and watch Pebble, a cartoon harbor seal (_Phoca vitulina_), bounce
on its belly to the beat.

- **Discover** – search free music from independent artists on
  [Audius](https://audius.co) (no account, no API key). The seal listens to the
  audio and finds the beat live.
- **Your file** – drop any MP3/M4A/WAV/OGG/FLAC from your computer. The whole
  song is analysed before it starts, so the seal is on the beat from the first
  hop. The file never leaves the device.
- **YouTube** – paste a link. Browsers don't let a page hear a YouTube player,
  so you tap the beat (button or <kbd>T</kbd>) and the seal follows the
  video's clock.

Everything runs in the browser — no backend, no paid services.

## Getting started

Requires Node.js 22.18 or newer (the unit tests use Node's built-in
TypeScript support).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload                   |
| `npm run build`     | Type-check and build to `dist/`                   |
| `npm run preview`   | Serve the production build locally                |
| `npm test`          | Unit tests (`node --test`, no extra dependencies) |
| `npm run typecheck` | TypeScript project references, app + tests        |
| `npm run lint`      | ESLint                                            |

## How it works

```
 Audius stream / local file ─► <audio> ─► AnalyserNode ─► spectral flux ─► beat tracker ─┐
 local file ─► decode @11 kHz ─► onset envelope ─► tempo + phase (whole song) ─► seed ───┤
 YouTube iframe clock ─► your taps ─► tap tempo ───────────────────────────────────────┤
                                                                                        ▼
                                   PlaybackSource.getBeatFrame()  (phase, beat #, energy)
                                                                                        ▼
                         requestAnimationFrame ─► computeSealPose() ─► SVG transforms
```

1. **Onset detection** – log-compressed, half-wave-rectified spectral flux
   with extra weight below 220 Hz (kick drums and bass drive a bounce).
2. **Tempo** – autocorrelation of the onset envelope, boosted at twice the
   period and weighted towards ~120 BPM, with a half-tempo correction. Audius
   publishes a BPM for most tracks; it narrows the search to ±4 %.
3. **Phase** – a comb of predicted beats is slid across the recent onsets; the
   offset that collects the most energy wins.
4. **Tracking** – every 0.5 s the last 8 s are re-analysed. Tempo changes need
   three agreeing votes; the phase is nudged gently (like a PLL) so the seal
   never jumps. Output latency is compensated, so the seal moves with what you
   _hear_, not with what is being decoded.
5. **Motion** – a pure function turns `(phase, beat number, energy)` into a
   pose: the seal lands (squash, flipper slap) exactly on each beat, springs up
   between beats, nods left/right on alternate beats and hops every other beat
   above 140 BPM. It breathes and blinks when idle and tones down for
   `prefers-reduced-motion`.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the analysis of the
original project, the design decisions and the module map.

## Project layout

```
src/
  audio/              Web Audio engine, YouTube driver, beat tracking (framework-free)
    dsp/              FFT, onset envelope, tempo & phase estimation
  components/
    SealStage/        the seal SVG, its pose model and animation loop
    NowPlaying/       transport: play/pause, seek bar, tap button
    MusicPanel/       source tabs: Discover (Audius), Your file, YouTube, recent picks
    Background/  Icon/  Artwork/
  hooks/              React glue (external stores, search, local storage)
  services/           Audius API client, YouTube link parsing
  lib/  utils/  types/
```

## Credits

Music search and streaming by the [Audius API](https://docs.audius.co).
The seal is an original SVG illustration made for this project.
