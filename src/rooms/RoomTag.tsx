import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { burst } from '../lib/confetti';
import { chime } from '../lib/audio';

interface Props {
  onComplete: () => void;
}

export default function RoomTag({ onComplete }: Props) {
  const [ripped, setRipped] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number } | null>(null);

  const done = useRef(false);

  const rip = () => {
    if (done.current) return;
    done.current = true;
    setRipped(true);
    burst();
    chime();
    window.setTimeout(onComplete, 1100);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (ripped) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current || ripped) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setOffset({ x: dx, y: dy });
    if (Math.hypot(dx, dy) > 110) {
      setOffset({ x: dx * 1.4, y: dy * 1.4 });
      rip();
    }
  };

  const onPointerUp = () => {
    if (ripped) return;
    start.current = null;
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <p className="kicker">1 / 7</p>
      <h2>You’re not for sale</h2>
      <p className="lead">This gift has a fake $999 tag. Drag it off, or tap it.</p>

      {!ripped ? (
        <button
          type="button"
          className="price-tag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={rip}
          aria-label="Remove the fake price tag"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)` }}
        >
          <div className="amount">$999</div>
          <div className="sub">drag or tap →</div>
        </button>
      ) : (
        <motion.div
          className="revealed-tag"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          PRICELESS
        </motion.div>
      )}

      <p className="hint">{ripped ? 'yeah. that’s you.' : 'drag the tag, or tap it'}</p>
    </motion.div>
  );
}
