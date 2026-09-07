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
      setRipped(true);
      setOffset({ x: dx * 1.4, y: dy * 1.4 });
      burst();
      chime();
      window.setTimeout(onComplete, 1100);
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
      <p className="kicker">Aisle 1 · Tags</p>
      <h2>Rip the fake price</h2>
      <p className="lead">Drag the tag off the box. Money was never invited.</p>

      {!ripped ? (
        <div
          className="price-tag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)` }}
        >
          <div className="amount">$999</div>
          <div className="sub">drag me away →</div>
        </div>
      ) : (
        <motion.div
          className="revealed-tag"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          PRICELESS
        </motion.div>
      )}

      <p className="hint">{ripped ? 'that’s better' : 'swipe / drag the tag'}</p>
    </motion.div>
  );
}
