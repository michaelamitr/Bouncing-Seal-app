import { BackgroundMesh } from './components/Background/Background';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer';
import { Seal } from './components/Seal';

const App = () => {
  return (
    <>
      <BackgroundMesh />
      <main className="app-shell">
        <section className="app-content">
          <div className="hero-content">
            <p className="hero-eyebrow">Bouncing Seal</p>
            <h1>
              Paste a YouTube link and set the stage for a dancing harbor seal.
            </h1>
          </div>

          <MusicPlayer />

          {/* <section className="seal-stage" aria-labelledby="seal-stage-title">
            <div className="seal-stage-header">
              <div>
                <p className="seal-stage-eyebrow">Seal Stage</p>
                <h2 id="seal-stage-title">Animation placeholder</h2>
              </div>
              <p className="seal-stage-caption">
                The seal component stays in view so the next iteration has a
                clear home.
              </p>
            </div>
            <Seal />
          </section> */}
        </section>
      </main>
    </>
  );
};

export default App;
