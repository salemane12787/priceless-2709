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
              I couldn’t give you something in person, so I made this instead.
            </p>
            <p>
              still think about how weird it is that we met on tiktok and somehow you just stayed. like i wasn’t looking for anything and then it was you. and i didn’t wanna lose that.
            </p>
            <p>
              even with the distance you feel close. the talks, the dumb jokes, asking where u are for no reason. that’s my favorite part of the day honestly. 1+1=3 and i’m not arguing with that.
            </p>
            <p>
              you’re my priceless girl. not as a nickname only. i mean it. nothing i could buy would feel like you.
            </p>
            <p>
              happy birthday firdaous. i wish i was there to say it to your face. until then, know this: i’m glad it’s you. i’m still here. i’m not going anywhere.
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
