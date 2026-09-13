import confetti from 'canvas-confetti';

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const colors = ['#c8102e', '#f4c430', '#004d98', '#fff6ea', '#ffe58a'];

export function burst(big = false) {
  if (reducedMotion()) return;
  const count = big ? 36 : 22;
  confetti({
    particleCount: count,
    angle: 60,
    spread: 46,
    origin: { x: 0.08, y: 0.78 },
    colors,
    zIndex: 6,
    disableForReducedMotion: true,
    ticks: 120,
  });
  confetti({
    particleCount: count,
    angle: 120,
    spread: 46,
    origin: { x: 0.92, y: 0.78 },
    colors,
    zIndex: 6,
    disableForReducedMotion: true,
    ticks: 120,
  });
}

export function sideCannons() {
  if (reducedMotion()) return;
  const end = Date.now() + 700;
  const palette = ['#c8102e', '#f4c430', '#004d98', '#fff6ea'];
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 55,
      spread: 42,
      origin: { x: 0, y: 0.72 },
      colors: palette,
      zIndex: 6,
      disableForReducedMotion: true,
      ticks: 90,
    });
    confetti({
      particleCount: 3,
      angle: 125,
      spread: 42,
      origin: { x: 1, y: 0.72 },
      colors: palette,
      zIndex: 6,
      disableForReducedMotion: true,
      ticks: 90,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
