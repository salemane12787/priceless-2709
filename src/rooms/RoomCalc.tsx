import { useState } from 'react';
import { motion } from 'framer-motion';
import { burst } from '../lib/confetti';
import { chime } from '../lib/audio';

interface Props {
  onComplete: () => void;
}

export default function RoomCalc({ onComplete }: Props) {
  const [screen, setScreen] = useState('1 + 1 = _');
  const [react, setReact] = useState('');
  const [bad, setBad] = useState(false);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);

  const press = (n: number) => {
    if (done) return;
    if (n === 3) {
      setScreen('1 + 1 = 3 ✦');
      setReact('Yeah. Us.');
      setBad(false);
      setDone(true);
      burst(true);
      chime();
      window.setTimeout(onComplete, 1100);
      return;
    }
    setScreen(`1 + 1 = ${n} ???`);
    setReact(n === 2 ? 'Boring. Try again.' : 'Nope.');
    setBad(true);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  return (
    <motion.div
      className={`room ${shake ? 'shake' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <p className="kicker">3 / 7</p>
      <h2>1 + 1 = ?</h2>
      <p className="lead">In our world, the answer isn’t 2.</p>

      <div className="calc-shell">
        <div className="calc-screen">{screen}</div>
        <div className="calc-keys">
          <button type="button" onClick={() => press(2)}>2</button>
          <button type="button" className="accent" onClick={() => press(3)}>3</button>
          <button type="button" onClick={() => press(11)}>11</button>
        </div>
      </div>
      <p className={`react-line ${bad ? 'bad' : ''}`}>{react}</p>
    </motion.div>
  );
}
