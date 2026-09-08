import { FormEvent, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { normalize } from '../types';
import { burst } from '../lib/confetti';

interface Props {
  onComplete: () => void;
}

export default function RoomParcels({ onComplete }: Props) {
  const [opened, setOpened] = useState({ miss: false, laugh: false, bday: false });
  const [holdPct, setHoldPct] = useState(0);
  const [bdayVal, setBdayVal] = useState('');
  const [err, setErr] = useState('');
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef(0);

  const allOpen = opened.miss && opened.laugh && opened.bday;

  const markOpen = (key: 'miss' | 'laugh' | 'bday') => {
    setOpened((prev) => {
      const next = { ...prev, [key]: true };
      if (next.miss && next.laugh && next.bday) {
        burst(true);
        window.setTimeout(onComplete, 900);
      }
      return next;
    });
  };

  const openMiss = (choice: string) => {
    if (opened.miss) return;
    if (choice === 'tiktok') {
      setErr('');
      burst();
      markOpen('miss');
    } else {
      setErr('Nope. Think about how we met.');
    }
  };

  const startHold = () => {
    if (opened.laugh) return;
    holdStart.current = Date.now();
    holdTimer.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / 1200) * 100);
      setHoldPct(pct);
      if (pct >= 100) {
        if (holdTimer.current) clearInterval(holdTimer.current);
        setHoldPct(100);
        burst();
        markOpen('laugh');
      }
    }, 40);
  };

  const endHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (!opened.laugh) setHoldPct(0);
  };

  const submitBday = (e: FormEvent) => {
    e.preventDefault();
    if (opened.bday) return;
    const v = normalize(bdayVal);
    if (v === '27' || v.includes('twenty seven')) {
      setErr('');
      burst();
      markOpen('bday');
    } else {
      setErr('Wrong day. Hint: your birthday date.');
    }
  };

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ justifyContent: 'flex-start', overflowY: 'auto' }}
    >
      <p className="kicker">6 / 7</p>
      <h2>Three little notes</h2>
      <p className="lead">Open all three. Each one works differently.</p>

      <div className="parcel-list">
        <article className="parcel">
          <h3>When you miss me</h3>
          {!opened.miss ? (
            <>
              <p>Where did we first meet?</p>
              <div className="choice-row">
                <button type="button" onClick={() => openMiss('mall')}>The mall</button>
                <button type="button" onClick={() => openMiss('tiktok')}>TikTok</button>
                <button type="button" onClick={() => openMiss('bus')}>The bus</button>
              </div>
            </>
          ) : (
            <p className="note">I’m still here. Different city, same me. Text me — even just “hru.”</p>
          )}
        </article>

        <article className="parcel">
          <h3>When you need a laugh</h3>
          {!opened.laugh ? (
            <>
              <p>Press and hold to open.</p>
              <button
                type="button"
                className="hold-btn"
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                onPointerCancel={endHold}
              >
                <div className="fill" style={{ width: `${holdPct}%` }} />
                <span>{holdPct >= 100 ? 'Opened' : 'Hold…'}</span>
              </button>
            </>
          ) : (
            <p className="note">Send me the dumbest meme you have. I’ll send one back.</p>
          )}
        </article>

        <article className="parcel">
          <h3>On your birthday</h3>
          {!opened.bday ? (
            <form onSubmit={submitBday} style={{ display: 'grid', gap: 8 }}>
              <p>What day of the month is your birthday?</p>
              <input
                value={bdayVal}
                onChange={(e) => setBdayVal(e.target.value)}
                placeholder="27"
                style={{
                  border: '1px solid var(--line)',
                  background: '#3a2a36',
                  color: 'var(--ink)',
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              />
              <button type="submit" className="primary-btn">Open</button>
            </form>
          ) : (
            <p className="note">Happy birthday. Glad we found each other across the distance. Today is yours.</p>
          )}
        </article>
      </div>

      <p className={`react-line ${err ? 'bad' : ''}`}>
        {err || (allOpen ? 'All open. One last thing…' : `${Number(opened.miss) + Number(opened.laugh) + Number(opened.bday)}/3 opened`)}
      </p>
    </motion.div>
  );
}
