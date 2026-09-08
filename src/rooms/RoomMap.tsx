import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { burst } from '../lib/confetti';

interface Props {
  onComplete: () => void;
}

export default function RoomMap({ onComplete }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [her, setHer] = useState({ x: 28, y: 42 });
  const [him] = useState({ x: 72, y: 58 });
  const [react, setReact] = useState('Drag your pin closer to mine.');
  const [done, setDone] = useState(false);
  const dragging = useRef(false);

  const dist = Math.hypot(her.x - him.x, her.y - him.y);

  const toPct = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return {
      x: Math.min(90, Math.max(10, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(90, Math.max(10, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (done) return;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || done || !boardRef.current) return;
    const next = toPct(e.clientX, e.clientY);
    // Soft clamp: can't fully merge
    const d = Math.hypot(next.x - him.x, next.y - him.y);
    if (d < 14) {
      const angle = Math.atan2(next.y - him.y, next.x - him.x);
      next.x = him.x + Math.cos(angle) * 14;
      next.y = him.y + Math.sin(angle) * 14;
    }
    setHer(next);
    const nd = Math.hypot(next.x - him.x, next.y - him.y);
    if (nd < 22) {
      setReact('Closer… but not the same city yet.');
      if (!done) {
        setDone(true);
        burst();
        window.setTimeout(onComplete, 1200);
      }
    } else if (nd < 40) {
      setReact('Getting closer…');
    } else {
      setReact('Drag your pin closer to mine.');
    }
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <p className="kicker">5 / 7</p>
      <h2>We’re far</h2>
      <p className="lead">Drag your pin closer to me. We can’t fully meet yet — that’s long distance.</p>

      <div
        ref={boardRef}
        className="map-board"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="pin him"
          style={{ left: `${him.x}%`, top: `${him.y}%` }}
        >
          <span>him</span>
        </div>
        <div
          className="pin her"
          style={{ left: `${her.x}%`, top: `${her.y}%` }}
          onPointerDown={onPointerDown}
        >
          <span>you</span>
        </div>
      </div>
      <p className="react-line">{react}</p>
      <p className="hint">distance left: {Math.round(dist)}</p>
    </motion.div>
  );
}
