import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopMusic } from '../lib/audio';

interface Props {
  onRestart?: () => void;
}

function filmSrc() {
  const base = import.meta.env.BASE_URL || '/';
  return new URL('film.mp4', window.location.origin + base).href;
}

export default function RoomFilm({ onRestart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [playHint, setPlayHint] = useState('');
  const src = filmSrc();

  useEffect(() => {
    stopMusic();
  }, []);

  const play = async () => {
    const v = videoRef.current;
    if (!v) return;
    setPlayHint('');
    try {
      if (v.error) {
        setLoadError(true);
        return;
      }
      v.currentTime = 0;
      setEnded(false);
      await v.play();
      setReady(true);
    } catch {
      // Autoplay policies can block until a second tap; not a missing file.
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
      <p className="kicker">Private screening</p>
      <h2>The film</h2>
      <p className="lead">Shop unlock complete. Press play — music stays locked to every frame.</p>

      <div className="film-frame">
        <video
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
          onError={() => setLoadError(true)}
        />
        <div className="film-scan" aria-hidden />
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14, width: 'min(100%, 360px)' }}>
        <button type="button" className="primary-btn" onClick={play} disabled={loadError && !ready}>
          {ended ? 'Play again' : ready ? 'Play film' : 'Loading film…'}
        </button>
        {loadError && (
          <p className="react-line bad">Film file missing on the server. Refresh in a minute.</p>
        )}
        {playHint && !loadError && <p className="react-line">{playHint}</p>}
        <a className="ghost-btn" href={src} target="_blank" rel="noreferrer" style={{ textAlign: 'center' }}>
          Open film in a new tab
        </a>
        {onRestart && (
          <button type="button" className="ghost-btn" onClick={onRestart}>
            Back to the shop
          </button>
        )}
      </div>
    </motion.div>
  );
}
