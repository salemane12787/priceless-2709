import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { burst } from '../lib/confetti';

interface Props {
  onComplete: () => void;
}

const PRODUCTS = [
  { id: 'mall', label: 'We met at the mall', joke: 'Nope.' },
  { id: 'tiktok', label: 'We met on TikTok', joke: '', correct: true },
  { id: 'school', label: 'We met at school', joke: 'Wrong.' },
];

export default function RoomAisle({ onComplete }: Props) {
  const [react, setReact] = useState('');
  const [bad, setBad] = useState(false);
  const [inBasket, setInBasket] = useState<string | null>(null);
  const [hot, setHot] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const basketRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const activeId = useRef<string | null>(null);

  const overBasket = (clientX: number, clientY: number) => {
    if (!basketRef.current) return false;
    const rect = basketRef.current.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    if (inBasket) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    activeId.current = id;
    setDragId(id);
    start.current = { x: e.clientX, y: e.clientY };
    setOffset({ x: 0, y: 0 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!activeId.current || !start.current || inBasket) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setOffset({ x: dx, y: dy });
    setHot(overBasket(e.clientX, e.clientY));
  };

  const resetDrag = () => {
    activeId.current = null;
    start.current = null;
    setDragId(null);
    setOffset({ x: 0, y: 0 });
    setHot(false);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!activeId.current) return;
    const id = activeId.current;
    const inside = overBasket(e.clientX, e.clientY);

    if (inside) {
      const product = PRODUCTS.find((p) => p.id === id)!;
      if (product.correct) {
        setInBasket(product.label);
        setReact('Yes. That’s how it started.');
        setBad(false);
        burst();
        resetDrag();
        window.setTimeout(onComplete, 1000);
        return;
      }
      setReact(product.joke);
      setBad(true);
    }

    resetDrag();
  };

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <p className="kicker">2 / 7</p>
      <h2>Where did we meet?</h2>
      <p className="lead">Drag the right answer into the box below.</p>

      <div className="aisle-grid">
        {PRODUCTS.map((p) => {
          const dragging = dragId === p.id;
          return (
            <div
              key={p.id}
              className={`product-card ${dragging ? 'dragging' : ''}`}
              onPointerDown={onPointerDown(p.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={resetDrag}
              style={{
                opacity: inBasket && p.id !== 'tiktok' ? 0.35 : 1,
                transform: dragging
                  ? `translate(${offset.x}px, ${offset.y}px) scale(1.05) rotate(${offset.x * 0.04}deg)`
                  : undefined,
                zIndex: dragging ? 30 : 1,
                position: 'relative',
                transition: dragging ? 'none' : 'transform 0.2s ease',
              }}
            >
              <div className="sku">pick one</div>
              {p.label}
            </div>
          );
        })}
      </div>

      <div
        ref={basketRef}
        className={`basket ${hot ? 'hot' : ''} ${inBasket ? 'filled' : ''}`}
      >
        {inBasket || 'drop the answer here'}
      </div>
      <p className={`react-line ${bad ? 'bad' : ''}`}>{react || 'hold a card and drag it'}</p>
    </motion.div>
  );
}
