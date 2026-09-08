let ctx: AudioContext | null = null;
let theme: HTMLAudioElement | null = null;
let musicOn = false;
let playToken = 0;

/** cache-bust so browsers don't reuse an old looping audio element behavior */
const THEME_SRC = `${import.meta.env.BASE_URL || '/'}blow-theme.mp3?v=once2`;

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
    theme.preload = 'auto';
    theme.volume = 0.85;
    theme.loop = false;
    theme.setAttribute('loop', 'false');
    theme.removeAttribute('loop');
    theme.addEventListener('ended', () => {
      musicOn = false;
      if (theme) {
        theme.pause();
        theme.currentTime = 0;
        theme.loop = false;
      }
    });
  }
  theme.loop = false;
  return theme;
}

export function startMusic() {
  ensureAudio();
  const audio = ensureTheme();
  audio.loop = false;

  // already playing this one-shot — don't restart
  if (musicOn && !audio.paused && !audio.ended) return;

  const token = ++playToken;
  audio.currentTime = 0;
  void audio.play().then(() => {
    if (token !== playToken) return;
    audio.loop = false;
    musicOn = true;
  }).catch(() => {
    if (token !== playToken) return;
    musicOn = false;
  });
  musicOn = true;
}

export function stopMusic() {
  playToken += 1;
  if (theme) {
    theme.loop = false;
    theme.pause();
    theme.currentTime = 0;
  }
  musicOn = false;
}

export function isMusicOn() {
  return musicOn && !!theme && !theme.paused && !theme.ended;
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
