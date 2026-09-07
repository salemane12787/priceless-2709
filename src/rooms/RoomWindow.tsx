import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { chime, startMusic, whoosh } from '../lib/audio';
import { sideCannons } from '../lib/confetti';

interface Props {
  onComplete: () => void;
}

export default function RoomWindow({ onComplete }: Props) {
  const [blown, setBlown] = useState(false);
  const [wind, setWind] = useState(false);
  const [hint, setHint] = useState('blow into your mic — or tap');
  const done = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setBlown(true);
    setWind(false);
    setHint('welcome in…');
    try {
      whoosh();
      startMusic();
      chime();
    } catch { /* */ }
    sideCannons();
    window.setTimeout(onComplete, 900);
  };

  useEffect(() => {
    let streak = 0;
    let cancelled = false;

    async function listen() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHint('mic unavailable — tap to open');
        return;
      }
      try {
        setHint('allow microphone…');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled || done.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        if (ctx.state === 'suspended') await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        const time = new Uint8Array(analyser.fftSize);
        const freq = new Uint8Array(analyser.frequencyBinCount);
        setHint('blow into your mic now');

        const tick = () => {
          if (done.current || cancelled) return;
          analyser.getByteTimeDomainData(time);
          let sum = 0;
          for (let i = 0; i < time.length; i += 1) {
            const v = (time[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / time.length);
          analyser.getByteFrequencyData(freq);
          let total = 0;
          let low = 0;
          const third = Math.floor(freq.length / 3);
          for (let i = 0; i < freq.length; i += 1) {
            total += freq[i];
            if (i < third) low += freq[i];
          }
          const avg = total / freq.length;
          const lowRatio = low / (total || 1);
          const isBlow = rms > 0.085 && avg > 28 && lowRatio > 0.28;
          setWind(rms > 0.045);
          if (isBlow) {
            streak += 1;
            setHint('keep blowing…');
            if (streak >= 10) {
              finish();
              return;
            }
          } else {
            streak = Math.max(0, streak - 2);
            if (streak === 0) setHint('blow into your mic now');
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setHint('mic blocked — tap to open');
      }
    }

    void listen();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <p className="kicker">PRICELESS</p>
      <h1>a shop for Firdaous</h1>
      <p className="lead">Nothing here has a price. That’s the point.</p>

      <div className={`cake ${blown ? 'blown' : ''} ${wind ? 'wind' : ''}`} aria-hidden>
        <div className="candle c1"><i className="flame" /></div>
        <div className="candle c2"><i className="flame" /></div>
        <div className="candle c3"><i className="flame" /></div>
        <div className="frost" />
        <div className="layer" />
      </div>

      <button type="button" className="primary-btn" disabled={blown} onClick={finish}>
        Blow out the candles
      </button>
      <p className="hint">{hint}</p>
    </motion.div>
  );
}
