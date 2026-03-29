import './globals.css';
import { BackgroundMesh } from './components/Background/Background';
import { Seal } from './components/Seal';

export default function App() {
  return (
    <>
      <BackgroundMesh />
      <main className="content-container">
        Seal Bounce App 🦭
        <Seal />
      </main>
    </>
  );
}
