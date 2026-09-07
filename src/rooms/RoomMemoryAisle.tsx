import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { burst } from '../lib/confetti';

interface Props {
  onComplete: () => void;
}

const PRODUCTS = [
  { id: 'mall', label: 'Random mall meetup', joke: 'Wrong aisle, babe.' },
  { id: 'tiktok', label: 'TikTok hello', joke: '', correct: true },
  { id: 'school', label: 'School cafeteria romance', joke: 'Cute. False.' },
];

export default function RoomAisle({ onComplete }: Props) {
  const [react, setReact] = useState('');
  const [bad, setBad] = useState(false);
  const [inBasket, setInBasket] = useState<string | null>(null);
  const [hot, setHot] = useState(false);
  const basketRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    if (inBasket) return;
    dragId.current = id;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId.current || !basketRef.current) return;
    const rect = basketRef.current.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    setHot(inside);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragId.current || !basketRef.current) return;
    const id = dragId.current;
    dragId.current = null;
    const rect = basketRef.current.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    setHot(false);
    if (!inside) return;

    const product = PRODUCTS.find((p) => p.id === id)!;
    if (product.correct) {
      setInBasket(product.label);
      setReact('Origin secured. Receipt updated.');
      setBad(false);
      burst();
      window.setTimeout(onComplete, 1000);
    } else {
      setReact(product.joke);
      setBad(true);
    }
  };

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <p className="kicker">Aisle 2 · Origins</p>
      <h2>Drop the real start</h2>
      <p className="lead">Drag the true first hello into the basket.</p>

      <div className="aisle-grid">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className="product-card"
            onPointerDown={onPointerDown(p.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { dragId.current = null; setHot(false); }}
            style={{ opacity: inBasket && p.id !== 'tiktok' ? 0.45 : 1 }}
          >
            <div className="sku">SKU · MEMORY</div>
            {p.label}
          </div>
        ))}
      </div>

      <div
        ref={basketRef}
        className={`basket ${hot ? 'hot' : ''} ${inBasket ? 'filled' : ''}`}
      >
        {inBasket || 'drop here'}
      </div>
      <p className={`react-line ${bad ? 'bad' : ''}`}>{react}</p>
    </motion.div>
  );
}
