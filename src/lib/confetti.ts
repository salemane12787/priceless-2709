import confetti from 'canvas-confetti';

export function burst(big = false) {
  confetti({
    particleCount: big ? 120 : 55,
    spread: big ? 80 : 65,
    origin: { y: 0.65 },
    colors: ['#d4a574', '#f0d5b8', '#c4787a', '#fff6ea', '#8b5a6b'],
  });
}

export function sideCannons() {
  const end = Date.now() + 1800;
  const colors = ['#d4a574', '#f0d5b8', '#c4787a', '#fff6ea'];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
