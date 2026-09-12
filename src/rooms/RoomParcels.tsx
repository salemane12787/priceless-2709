import { FormEvent, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { compactText, normalize } from '../types';
import { burst } from '../lib/confetti';
import { ParcelState } from '../lib/progress';

interface Props {
  onComplete: () => void;
  opened: ParcelState;
  onOpenedChange: (next: ParcelState) => void;
}

export default function RoomParcels({ onComplete, opened, onOpenedChange }: Props) {
  const [holdPct, setHoldPct] = useState(opened.laugh ? 100 : 0);
  const [bdayVal, setBdayVal] = useState('');
  const [err, setErr] = useState('');
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef(0);
  const allOpenOnLoad = useRef(opened.miss && opened.laugh && opened.bday);

  const completed = useRef(allOpenOnLoad.current);
  const allOpen = opened.miss && opened.laugh && opened.bday;

  const markOpen = (key: 'miss' | 'laugh' | 'bday') => {
    const next = { ...opened, [key]: true };
    onOpenedChange(next);
    if (next.miss && next.laugh && next.bday && !completed.current) {
      completed.current = true;
      burst(true);
      window.setTimeout(onComplete, 900);
    }
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

  const openLaugh = () => {
    if (opened.laugh) return;
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHoldPct(100);
    burst();
    markOpen('laugh');
  };

  const startHold = () => {
    if (opened.laugh) return;
    holdStart.current = Date.now();
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / 1200) * 100);
      setHoldPct(pct);
      if (pct >= 100) {
        if (holdTimer.current) clearInterval(holdTimer.current);
        openLaugh();
      }
    }, 40);
  };

  const endHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (!opened.laugh) setHoldPct(0);
  };

  const onHoldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLaugh();
    }
  };

  const submitBday = (e: FormEvent) => {
    e.preventDefault();
    if (opened.bday) return;
    const v = normalize(bdayVal);
    const compact = compactText(bdayVal);
    if (compact === '27' || v === '27' || v.includes('twenty seven')) {
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
              <p>Press and hold, or open it the normal way.</p>
              <button
                type="button"
                className="hold-btn"
                aria-label="Hold to open, or press Enter"
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                onPointerCancel={endHold}
                onKeyDown={onHoldKeyDown}
              >
                <div className="fill" style={{ width: `${holdPct}%` }} />
                <span>{holdPct >= 100 ? 'Opened' : `Hold… ${Math.round(holdPct)}%`}</span>
              </button>
              <button type="button" className="ghost-btn" onClick={openLaugh} style={{ marginTop: 8, width: '100%' }}>
                Open
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
                inputMode="numeric"
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
      {allOpenOnLoad.current && (
        <button type="button" className="primary-btn" onClick={onComplete} style={{ marginTop: 8 }}>
          Continue
        </button>
      )}
    </motion.div>
  );
}
