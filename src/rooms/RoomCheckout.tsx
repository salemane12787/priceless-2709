import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sideCannons, burst } from '../lib/confetti';

interface Props {
  onContinue?: () => void;
  onRestart?: () => void;
}

export default function RoomCheckout({ onContinue, onRestart }: Props) {
  const [stage, setStage] = useState<'receipt' | 'letter'>('receipt');

  useEffect(() => {
    sideCannons();
    const t = window.setTimeout(() => setStage('letter'), 4200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage === 'letter') burst(true);
  }, [stage]);

  return (
    <motion.div
      className="room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ justifyContent: 'flex-start', overflowY: 'auto', paddingTop: 72 }}
    >
      <p className="kicker">7 / 7</p>
      <h2>{stage === 'receipt' ? 'What you unlocked' : 'A letter for you'}</h2>

      {stage === 'receipt' ? (
        <motion.div
          className="receipt"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55 }}
        >
          <div className="shop-name">FOR FIRDAOUS</div>
          <p className="receipt-meta">from Salmane · 27.09.2026</p>
          <div className="receipt-rule" />

          <div className="receipt-row">
            <span>you’re priceless</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>we met on TikTok</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>1 + 1 = 3</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>my name is Salmane</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>long distance, still us</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>three little notes</span>
            <span>✓</span>
          </div>
          <div className="receipt-row">
            <span>one short film</span>
            <span>✓</span>
          </div>

          <div className="receipt-rule" />
          <div className="line">
            <span>TOTAL</span>
            <span>just you</span>
          </div>
          <p className="receipt-foot">No money. No returns. I’m staying.</p>
        </motion.div>
      ) : (
        <>
          <motion.article
            className="letter"
            initial={{ y: 24, opacity: 0, rotate: -1 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
          >
            <p>Firdaous,</p>
            <p>
              No box. No address. Just this: you became the softest part of my days from far away.
            </p>
            <p>
              I still think about how random it was. TikTok. A hello. Then somehow you stayed in my head like you belonged there. I didn’t plan you. I just found you — and I didn’t want to let that go.
            </p>
            <p>
              Even with the distance, you feel close. When I ask where you are, when we talk for too long, when you make me smile for no reason… that’s you. That’s us. 1 + 1 = 3, remember? Logic never stood a chance.
            </p>
            <p>
              You’re my priceless girl. Not because it’s a cute word — because nothing I could buy would ever match what you are to me. No receipt. No price. Just you.
            </p>
            <p>
              Happy birthday, Firdaous. I wish I could be there to say it to your face. Until then, take this: I’m glad it was you. I’m still here. And I’m not going anywhere.
            </p>
            <p className="sign">Salmane</p>
            <p className="sign-note">written by salmane not a fucking dumb ai</p>
          </motion.article>

          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {onContinue && (
              <button type="button" className="primary-btn" onClick={onContinue}>
                Watch the film →
              </button>
            )}
            <button type="button" className="ghost-btn" onClick={() => sideCannons()}>
              More confetti
            </button>
            {onRestart && (
              <button type="button" className="ghost-btn" onClick={onRestart}>
                Start over
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
