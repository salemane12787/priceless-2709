let ctx: AudioContext | null = null;
let musicNodes: {
  master: GainNode;
  padOscs: { o: OscillatorNode; lfo: OscillatorNode }[];
  bus: GainNode;
} | null = null;
let musicTimer: number | null = null;
let musicOn = false;

const NOTE = {
  F3: 174.61, A3: 220.0, Bb3: 233.08, C4: 261.63, D4: 293.66,
  E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25,
};

const BEAT = 0.38;
const SONG: [number, number, number | null, number | null][] = [
  [NOTE.C4, 0.75, NOTE.A3, NOTE.F3], [NOTE.C4, 0.25, null, null],
  [NOTE.D4, 1, NOTE.Bb3, null], [NOTE.C4, 1, NOTE.A3, null],
  [NOTE.F4, 1, NOTE.C4, null], [NOTE.E4, 2, NOTE.C4, NOTE.C4],
  [NOTE.C4, 0.75, NOTE.A3, NOTE.F3], [NOTE.C4, 0.25, null, null],
  [NOTE.D4, 1, NOTE.Bb3, null], [NOTE.C4, 1, NOTE.A3, null],
  [NOTE.G4, 1, NOTE.E4, null], [NOTE.F4, 2, NOTE.C4, NOTE.F3],
  [NOTE.C4, 0.75, NOTE.A3, NOTE.F3], [NOTE.C4, 0.25, null, null],
  [NOTE.C5, 1, NOTE.F4, null], [NOTE.A4, 1, NOTE.F4, null],
  [NOTE.F4, 1, NOTE.C4, null], [NOTE.E4, 1, NOTE.C4, null], [NOTE.D4, 2, NOTE.Bb3, NOTE.Bb3],
  [NOTE.Bb4, 0.75, NOTE.F4, NOTE.F3], [NOTE.Bb4, 0.25, null, null],
  [NOTE.A4, 1, NOTE.F4, null], [NOTE.F4, 1, NOTE.C4, null],
  [NOTE.G4, 1, NOTE.E4, null], [NOTE.F4, 2.5, NOTE.C4, NOTE.F3],
];

function ensureAudio() {
  if (!ctx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function playVoice(
  audio: AudioContext,
  dest: AudioNode,
  freq: number | null,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  harm = 0,
) {
  if (!freq) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const attack = Math.min(0.04, dur * 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(peak * 0.55, start + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur - 0.001);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);
  if (harm > 0) {
    const o2 = audio.createOscillator();
    const g2 = audio.createGain();
    o2.type = 'sine';
    o2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0.0001, start);
    g2.gain.exponentialRampToValueAtTime(peak * harm, start + attack);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.85);
    o2.connect(g2);
    g2.connect(dest);
    o2.start(start);
    o2.stop(start + dur + 0.02);
  }
}

function scheduleBirthday(audio: AudioContext, bus: GainNode, when: number) {
  let t = when;
  SONG.forEach(([mel, beats, harm, bass]) => {
    const dur = beats * BEAT;
    const noteLen = dur * 0.9;
    playVoice(audio, bus, mel, t, noteLen, 'triangle', 0.2, 0.28);
    playVoice(audio, bus, mel, t, noteLen * 0.95, 'sine', 0.09, 0);
    if (harm) playVoice(audio, bus, harm, t, noteLen * 1.05, 'sine', 0.06, 0);
    if (bass) playVoice(audio, bus, bass, t, noteLen * 1.15, 'sine', 0.1, 0);
    t += dur;
  });
  return t - when;
}

export function startMusic() {
  const audio = ensureAudio();
  if (musicNodes) return;
  const master = audio.createGain();
  master.gain.value = 0.0001;
  master.gain.exponentialRampToValueAtTime(0.55, audio.currentTime + 0.4);

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2600;

  const delay = audio.createDelay(1);
  delay.delayTime.value = 0.22;
  const delayGain = audio.createGain();
  delayGain.gain.value = 0.2;
  const feedback = audio.createGain();
  feedback.gain.value = 0.25;

  const bus = audio.createGain();
  bus.connect(filter);
  filter.connect(master);
  filter.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(master);
  delay.connect(feedback);
  feedback.connect(delay);
  master.connect(audio.destination);

  const padGain = audio.createGain();
  padGain.gain.value = 0.025;
  padGain.connect(filter);
  const padOscs = [NOTE.F3, NOTE.A3, NOTE.C4].map((f, i) => {
    const o = audio.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.value = 0.12 + i * 0.03;
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);
    o.connect(padGain);
    o.start();
    lfo.start();
    return { o, lfo };
  });

  const songLen = scheduleBirthday(audio, bus, audio.currentTime + 0.2);
  musicTimer = window.setInterval(() => {
    if (!musicOn || !ctx || !musicNodes) return;
    scheduleBirthday(ctx, musicNodes.bus, ctx.currentTime + 0.08);
  }, songLen * 1000 + 900);

  musicNodes = { master, padOscs, bus };
  musicOn = true;
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!musicNodes || !ctx) {
    musicOn = false;
    return;
  }
  musicNodes.padOscs.forEach(({ o, lfo }) => {
    try { o.stop(); } catch { /* */ }
    try { lfo.stop(); } catch { /* */ }
  });
  try {
    musicNodes.master.gain.cancelScheduledValues(ctx.currentTime);
    musicNodes.master.gain.setValueAtTime(Math.max(musicNodes.master.gain.value, 0.001), ctx.currentTime);
    musicNodes.master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
  } catch { /* */ }
  musicNodes = null;
  musicOn = false;
}

export function isMusicOn() {
  return musicOn;
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
