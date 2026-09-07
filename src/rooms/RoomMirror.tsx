import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { normalize } from '../types';
import { burst } from '../lib/confetti';
import { chime } from '../lib/audio';

interface Props {
  onComplete: () => void;
}

export default function RoomMirror({ onComplete }: Props) {
  const [value, setValue] = useState('');
  const [clear, setClear] = useState(false);
  const [react, setReact] = useState('');
  const [bad, setBad] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (clear) return;
    const v = normalize(value);
    if (v.includes('salmane') || v.includes('salman')) {
      setClear(true);
      setReact('Fog lifted.');
      setBad(false);
      burst();
      chime();
      window.setTimeout(onComplete, 1200);
    } else {
      setReact('Hmm… wipe again (starts with S)');
      setBad(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <motion.div
      className={`room ${shake ? 'shake' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="kicker">Aisle 4 · Fitting room</p>
      <h2>Wipe the fog</h2>
      <p className="lead">The boy who built this shop is behind the glass. Type his name.</p>

      <div className={`mirror ${clear ? 'clear' : ''}`}>
        <div className="fog" />
        <div className="whisper">{clear ? 'Still here. — Salmane' : 'Who is he?'}</div>
      </div>

      {!clear && (
        <form className="mirror-form" onSubmit={submit}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="his name…"
            autoCapitalize="off"
            autoComplete="off"
          />
          <button type="submit" className="primary-btn">Clear the mirror</button>
        </form>
      )}
      <p className={`react-line ${bad ? 'bad' : ''}`}>{react}</p>
    </motion.div>
  );
}
