# Architecture & design notes

This document records the analysis of the original code base, the options
that were considered and why the current design was chosen.

## 1. Where the project started

The original app (React 19 + TypeScript + Vite) had a polished glass-morphism
look and a working YouTube embed:

- `MusicPlayer` – one component holding all state (query, input state, recent
  picks, selected track, feedback message, playing flag) plus the YouTube
  metadata syncing.
- `TrackForm`, `CurrentSelection`, `YouTubePlayer`, `RecentPicks` – small,
  presentational and accessible (labels, `aria-live`, `aria-invalid`).
- `Seal.tsx` – a text placeholder; the stage itself was commented out in
  `App.tsx`.
- Colours defined as tokens in `:root`, hex only (see `AGENTS.md`).

What blocked the actual goal:

| Finding                                                            | Impact                                                                                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Music came only from a YouTube `<iframe>`.                         | Browsers never expose cross-origin iframe audio, so **beat detection was impossible**. The core feature could not be built on this architecture. |
| No seal and no animation system.                                   | Nothing to sync to the music.                                                                                                                    |
| All state in one component.                                        | Hard to add a second player (or a beat engine) without growing it further.                                                                       |
| Recent picks lived in memory only (limit 6).                       | Lost on reload — see the TODO question about cookies.                                                                                            |
| Favicons sat in the project root, `type="image/svg+xml"` on a PNG. | Vite only copies `public/` into the build, so the icon would 404 in production. The photo was also a harp-seal pup, not a harbor seal.           |
| Template README, no tests.                                         | —                                                                                                                                                |

## 2. Where the music comes from

The seal can only dance to what the page can _hear_: decoded audio samples
reachable by the Web Audio API (same origin or CORS-enabled).

| Option                                | Full songs    | Page can analyse audio  | Free, no key                 | Verdict                                                                                                  |
| ------------------------------------- | ------------- | ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| YouTube iframe                        | ✅            | ❌ cross-origin iframe  | ✅                           | Kept, with **tap tempo**                                                                                 |
| “Download from YouTube” (yt-dlp etc.) | ✅            | ✅                      | ❌ needs a server            | Rejected: needs a backend to host and maintain, breaks often and goes against YouTube's Terms of Service |
| Spotify Web API / SDK                 | Premium only  | ❌                      | ❌                           | Rejected: playback needs Premium; audio-analysis endpoints are no longer available to new apps           |
| Deezer / iTunes previews              | ❌ 30 s       | uncertain CORS          | ✅                           | Rejected: clips only                                                                                     |
| Jamendo API                           | ✅ (CC music) | ✅                      | needs a registered client id | Good fallback candidate                                                                                  |
| **Audius API**                        | ✅            | ✅ CORS-enabled streams | ✅ no key, no account        | **Chosen** – also publishes a BPM per track                                                              |
| **Local files**                       | ✅            | ✅                      | ✅                           | **Chosen** – best accuracy, private                                                                      |

If an Audius content node ever responds without CORS headers, the engine
replays the stream on a plain `<audio>` element and uses the published BPM
(“tap to align”), so the music never just fails silently.

## 3. How to draw and move the seal

| Option                            | Tempo-synced?  | Notes                                                                                                                   |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GIF / video loop                  | ❌ fixed speed | Can't follow 87 vs. 128 BPM, can't phase-lock                                                                           |
| CSS keyframes                     | ≈              | Can set duration, but can't stay phase-locked to a drifting clock                                                       |
| Lottie                            | ✅             | Needs an After Effects source and a runtime library                                                                     |
| Canvas                            | ✅             | Pixel output, harder to theme and to make accessible                                                                    |
| **SVG + `requestAnimationFrame`** | ✅             | **Chosen** – crisp at any size, coloured by CSS tokens, each body part is a `<g>` with its own pivot, zero dependencies |

The seal is an original illustration built to look like _Phoca vitulina_:
spotted silver-grey coat, rounded “puppy” head without ear flaps, short muzzle
with beaded whiskers and the species’ V-shaped nostrils, short clawed fore
flippers and fan-shaped hind flippers. Coat spots are pre-generated so the
pattern is stable.

Every animation frame `useSealAnimation` reads the current beat, calls the
pure `computeSealPose()` and writes SVG `transform` attributes directly, so a
60 fps dance causes **zero React re-renders**.

## 4. Module map

```
App
├─ createAudioEngine()  ─┐  both implement PlaybackSource:
├─ createYouTubeDriver() ─┘  getBeatFrame · getSnapshot · subscribe · tap · togglePlayback · pause
├─ SealStage(source)          ← useSealAnimation → computeSealPose → SVG
│   └─ NowPlaying(source)     ← play/pause, seek (audio only), TapBeatButton
└─ MusicPanel
    ├─ SourceTabs: CatalogSearch (Audius) · FileSource · YouTubeSource
    ├─ YouTubeVideo (only while a YouTube track is current)
    └─ RecentPicks (localStorage)
```

- **Imperative systems stay outside React.** The audio engine and the YouTube
  driver are plain factories with a tiny observable store (`lib/createStore`).
  Components subscribe with `useSyncExternalStore`, so only what changed
  re-renders (the seek bar subscribes to its own progress store).
- **One interface for the stage.** `PlaybackSource` hides whether the beat
  comes from live analysis, a pre-analysed file or the user's taps.
- **Pure, testable core.** DSP, beat tracking, tap tempo, media clock, seal
  pose, API mapping and link parsing are framework-free modules covered by
  `node --test` (no test framework dependency; Node runs the TypeScript
  directly). Those modules import siblings with explicit `.ts` extensions so
  Node can resolve them.

## 5. Beat detection pipeline

| Stage         | File                   | Detail                                                                                                                                           |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spectrum      | `createAudioEngine.ts` | `AnalyserNode`, FFT 2048, no smoothing, sampled every animation frame                                                                            |
| Onsets        | `dsp/onsetEnvelope.ts` | log-compressed spectral flux, bins up to 5 kHz, ×3 weight below 220 Hz                                                                           |
| Tempo         | `dsp/beatGrid.ts`      | autocorrelation + half weight at 2× lag, log-Gaussian preference around 120 BPM, half-tempo rescue up to 150 BPM, parabolic sub-frame refinement |
| Phase         | `dsp/beatGrid.ts`      | comb filter over recent onsets, newer beats weigh more                                                                                           |
| Whole file    | `analyzeAudioFile.ts`  | decode at 11 025 Hz, global grid, then least-squares fit of every beat to pin the tempo to ±0.1 BPM over minutes                                 |
| Live tracking | `beatTracker.ts`       | 8 s window every 0.5 s, octave-aware voting for tempo changes, PLL-style phase correction, history cleared on seek                               |
| Timing        | `mediaClock.ts`        | smooths coarse player clocks; output latency is subtracted so motion matches what you hear                                                       |

Measured in headless Chromium with a synthetic 124 BPM stream: the seal locks
within ~4 s (instantly for local files) and lands within roughly ±15 ms of the
audible beat. Unit tests cover 84–140 BPM loops, tempo changes, octave priors,
seeking, noise rejection and long-track drift.

## 6. Answers to the questions in `TODO.md`

1. **Components and structure** – see sections 1 and 4.
2. **Recent picks: why an upper bound, cookies?** A bound keeps the list
   scannable and the stored payload tiny. Cookies are sent to the server with
   every request, which this static app doesn't need; `localStorage` is the
   right tool. Picks are saved under `bouncing-seal:recent-tracks`, validated
   on read (old or corrupted data is ignored) and capped at 8. Local files are
   never saved – they can't be reopened after a reload.
3. **YouTube player parameters** – documented inline in
   `YouTubeVideo.tsx`: `autoplay` starts the video right after it is picked,
   `playsinline` keeps it inline on iOS, `rel: 0` limits related videos to the
   same channel, `fs: 0` hides fullscreen (it would hide the seal) and
   `origin` tells the IFrame API which page is allowed to control the player.

## 7. Limitations and ideas

- YouTube needs tapping. That is a browser security rule, not a bug.
- Songs without a steady pulse (rubato, ambient, speech) give a low
  confidence; the seal then hops more gently.
- Audius availability varies by region and over time; errors are shown and
  local files always work.
- Ideas: a Jamendo source behind the same `CatalogTrack` shape, a share link
  for the current song, more seal moves (a roll on drops, a clap on snares),
  and moving whole-file analysis to a Web Worker for hour-long mixes.
