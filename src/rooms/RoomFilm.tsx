import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopMusic } from '../lib/audio';

interface Props {
  onRestart?: () => void;
}

function filmCandidates(): string[] {
  const base = import.meta.env.BASE_URL || '/';
  return [
    new URL('film.mp4', window.location.origin + base).href,
    'https://raw.githubusercontent.com/salemane12787/priceless-2709/main/film.mp4',
  ];
}

export default function RoomFilm({ onRestart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [playHint, setPlayHint] = useState('');
  const [srcIndex, setSrcIndex] = useState(0);
  const candidates = filmCandidates();
  const src = candidates[srcIndex];

  useEffect(() => {
    stopMusic();
  }, []);

  const play = async () => {
    const v = videoRef.current;
    if (!v) return;
    setPlayHint('');
    try {
      if (v.error && srcIndex < candidates.length - 1) {
        setSrcIndex((i) => i + 1);
        setReady(false);
        return;
      }
      v.currentTime = 0;
      setEnded(false);
      await v.play();
      setReady(true);
    } catch {
      setPlayHint('Tap play again if it paused.');
      try {
        await v.play();
      } catch {
        setPlayHint('Tap the video, then Play film.');
      }
    }
  };

  return (
    <motion.div
      className="room film-room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ justifyContent: 'flex-start', overflowY: 'auto', paddingTop: 72 }}
    >
      <p className="kicker">bonus</p>
      <h2>A short film for you</h2>
      <p className="lead">Press play when you’re ready.</p>

      <div className="film-frame">
        <video
          key={src}
          ref={videoRef}
          className="film-video"
          src={src}
          playsInline
          controls
          preload="auto"
          onCanPlay={() => {
            setReady(true);
            setLoadError(false);
          }}
          onLoadedData={() => {
            setReady(true);
            setLoadError(false);
          }}
          onEnded={() => setEnded(true)}
          onError={() => {
            if (srcIndex < candidates.length - 1) {
              setSrcIndex((i) => i + 1);
              setReady(false);
              setLoadError(false);
            } else {
              setLoadError(true);
            }
          }}
        />
        <div className="film-scan" aria-hidden />
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14, width: 'min(100%, 360px)' }}>
        <button type="button" className="primary-btn" onClick={play} disabled={loadError && !ready}>
          {ended ? 'Play again' : ready ? 'Play film' : 'Loading film…'}
        </button>
        {loadError && (
          <p className="react-line bad">Film couldn’t load. Try the link below.</p>
        )}
        {playHint && !loadError && <p className="react-line">{playHint}</p>}
        <a className="ghost-btn" href={src} target="_blank" rel="noreferrer" style={{ textAlign: 'center' }}>
          Open film in a new tab
        </a>
        {onRestart && (
          <button type="button" className="ghost-btn" onClick={onRestart}>
            Start over
          </button>
        )}
      </div>
    </motion.div>
  );
}
