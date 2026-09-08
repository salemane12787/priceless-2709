let ctx: AudioContext | null = null;
let theme: HTMLAudioElement | null = null;
let musicOn = false;

const THEME_SRC = `${import.meta.env.BASE_URL || '/'}blow-theme.mp3`;

function ensureAudio() {
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function ensureTheme() {
  if (!theme) {
    theme = new Audio(THEME_SRC);
    theme.loop = false;
    theme.preload = 'auto';
    theme.volume = 0.85;
    theme.addEventListener('ended', () => {
      musicOn = false;
    });
  }
  return theme;
}

export function startMusic() {
  ensureAudio();
  const audio = ensureTheme();
  if (musicOn && !audio.paused) return;
  void audio.play().then(() => {
    musicOn = true;
  }).catch(() => {
    musicOn = false;
  });
  musicOn = true;
}

export function stopMusic() {
  if (theme) {
    theme.pause();
    theme.currentTime = 0;
  }
  musicOn = false;
}

export function isMusicOn() {
  return musicOn && !!theme && !theme.paused;
}

export function whoosh() {
  const audio = ensureAudio();
  const bufferSize = audio.sampleRate * 0.35;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  const gain = audio.createGain();
  gain.gain.value = 0.14;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  noise.start();
}

export function chime() {
  const audio = ensureAudio();
  const t = audio.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.5);
    o.connect(g);
    g.connect(audio.destination);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.55);
  });
}
