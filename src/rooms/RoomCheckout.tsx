import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sideCannons, burst } from '../lib/confetti';

interface Props {
  onRestart?: () => void;
}

export default function RoomCheckout({ onRestart }: Props) {
  const [stage, setStage] = useState<'receipt' | 'letter'>('receipt');

  useEffect(() => {
    sideCannons();
    const t = window.setTimeout(() => setStage('letter'), 1600);
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
      <p className="kicker">Checkout</p>
      <h2>{stage === 'receipt' ? 'Printing receipt…' : 'Your only free thing'}</h2>

      {stage === 'receipt' ? (
        <motion.div
          className="receipt"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="shop-name">PRICELESS</div>
          <div>1× heart (long distance edition)</div>
          <div style={{ opacity: 0.6, marginTop: 6 }}>SKU: 27-09-2026</div>
          <div className="line">
            <span>TOTAL</span>
            <span>priceless</span>
          </div>
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
              Happy birthday, my priceless girl. I’m glad it was you. I’m not going anywhere.
            </p>
            <p className="sign">Salmane</p>
            <p className="sign-note">written by salmane not a fucking dumb ai</p>
          </motion.article>

          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            <button type="button" className="primary-btn" onClick={() => sideCannons()}>
              Throw more confetti
            </button>
            {onRestart && (
              <button type="button" className="ghost-btn" onClick={onRestart}>
                Walk the shop again
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
