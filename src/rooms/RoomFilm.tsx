import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { stopMusic } from '../lib/audio';

interface Props {
  onRestart?: () => void;
}

export default function RoomFilm({ onRestart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    stopMusic();
  }, []);

  const play = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = 0;
      setEnded(false);
      await v.play();
      setReady(true);
    } catch {
      setError(true);
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
          src={`${import.meta.env.BASE_URL}film.mp4`}
          playsInline
          preload="auto"
          onEnded={() => setEnded(true)}
          onLoadedData={() => setReady(true)}
          onError={() => setError(true)}
        />
        <div className="film-scan" aria-hidden />
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14, width: 'min(100%, 360px)' }}>
        <button type="button" className="primary-btn" onClick={play}>
          {ended ? 'Play again' : ready ? 'Play film' : 'Loading…'}
        </button>
        {error && (
          <p className="react-line bad">Couldn’t load the film. Hard refresh and try again.</p>
        )}
        {onRestart && (
          <button type="button" className="ghost-btn" onClick={onRestart}>
            Back to the shop
          </button>
        )}
      </div>
    </motion.div>
  );
}
