import { useCallback, useEffect, useState } from 'react';

import { createAudioEngine } from './audio/createAudioEngine.ts';
import { createYouTubeDriver } from './audio/createYouTubeDriver.ts';
import { BackgroundMesh } from './components/Background/Background';
import { MusicPanel } from './components/MusicPanel/MusicPanel';
import { NowPlaying } from './components/NowPlaying/NowPlaying';
import { SealStage } from './components/SealStage/SealStage';
import { useRecentTracks } from './hooks/useRecentTracks';
import { getAudiusStreamUrl } from './services/audius.ts';
import { isSavedTrack, type Track } from './types/track.ts';

const App = () => {
  // Players live for the whole page; useState keeps one instance per mount.
  const [audioEngine] = useState(createAudioEngine);
  const [youTubeDriver] = useState(createYouTubeDriver);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const recent = useRecentTracks();

  const isYouTube = currentTrack?.source === 'youtube';
  const activeSource = isYouTube ? youTubeDriver : audioEngine;

  useEffect(() => () => audioEngine.pause(), [audioEngine]);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);

    if (isSavedTrack(track)) {
      recent.remember(track);
    }

    if (track.source === 'youtube') {
      // The embedded player starts on its own once it has loaded the video.
      audioEngine.pause();
      youTubeDriver.prepare();
      return;
    }

    youTubeDriver.pause();
    audioEngine.load(
      track.source === 'audius'
        ? {
            kind: 'stream',
            url: getAudiusStreamUrl(track.trackId),
            bpmHint: track.bpmHint,
          }
        : { kind: 'file', file: track.file },
    );
    // Called inside the click handler, so the browser allows audio to start.
    void audioEngine.play();
  };

  const { update: updateRecent } = recent;
  const handleYouTubeMetadata = useCallback(
    (key: string, title: string, artist: string) => {
      setCurrentTrack((track) =>
        track?.key === key ? { ...track, title, artist } : track,
      );
      updateRecent(key, { title, artist });
    },
    [updateRecent],
  );

  return (
    <>
      <BackgroundMesh />
      <main className="app-shell">
        <header className="hero">
          <p className="eyebrow">Bouncing Seal</p>
          <h1>Pick a song. Watch a harbor seal bounce to the beat.</h1>
          <p className="hero-lead">
            Search free music, drop in your own track or bring a YouTube video.
            The seal listens, finds the rhythm and galumphs along on its belly.
          </p>
        </header>

        <div className="app-grid">
          <SealStage source={activeSource}>
            <NowPlaying
              track={currentTrack}
              source={activeSource}
              audioEngine={isYouTube ? null : audioEngine}
            />
          </SealStage>

          <MusicPanel
            currentTrack={currentTrack}
            recentTracks={recent.tracks}
            youTubeDriver={youTubeDriver}
            onPlay={playTrack}
            onClearRecent={recent.clear}
            onYouTubeMetadata={handleYouTubeMetadata}
          />
        </div>

        <footer className="app-footer">
          <p>
            Music search by{' '}
            <a href="https://audius.co" target="_blank" rel="noreferrer">
              Audius
            </a>
            . Beat detection runs entirely in your browser.
          </p>
        </footer>
      </main>
    </>
  );
};

export default App;
