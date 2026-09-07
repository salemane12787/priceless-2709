const hero = document.getElementById("hero");
const hub = document.getElementById("hub");
const blowBtn = document.getElementById("blowBtn");
const cake = document.getElementById("cake");
const muteBtn = document.getElementById("muteBtn");
const heroHint = document.getElementById("heroHint");

let audioCtx = null;
let musicNodes = null;
let musicOn = false;
let musicTimer = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

const NOTE = {
  F3: 174.61, A3: 220.0, Bb3: 233.08, C4: 261.63, D4: 293.66,
  E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25,
};

/**
 * Happy Birthday — warmer arrangement:
 * melody + soft harmony + gentle bass, with light sparkle.
 * Each entry: [melodyHz, durationBeats, harmonyHz|null, bassHz|null]
 */
const BEAT = 0.38;
const BIRTHDAY_SONG = [
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

function playVoice(ctx, dest, freq, start, dur, type, peak, harm = 0) {
  if (!freq) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const attack = Math.min(0.04, dur * 0.12);
  const release = Math.min(0.22, dur * 0.35);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(peak * 0.55, start + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur - 0.001);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);

  if (harm > 0) {
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
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

function scheduleBirthday(ctx, bus, when) {
  let t = when;
  BIRTHDAY_SONG.forEach(([mel, beats, harm, bass]) => {
    const dur = beats * BEAT;
    const noteLen = dur * 0.9;
    playVoice(ctx, bus, mel, t, noteLen, "triangle", 0.22, 0.28);
    playVoice(ctx, bus, mel, t, noteLen * 0.95, "sine", 0.1, 0);
    if (harm) playVoice(ctx, bus, harm, t, noteLen * 1.05, "sine", 0.07, 0);
    if (bass) playVoice(ctx, bus, bass, t, noteLen * 1.15, "sine", 0.11, 0);
    // tiny high sparkle on longer notes
    if (beats >= 1) playVoice(ctx, bus, mel * 3, t + 0.02, noteLen * 0.35, "sine", 0.025, 0);
    t += dur;
  });
  return t - when;
}

function startMusic() {
  const ctx = ensureAudio();
  if (musicNodes) return;

  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.4);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2800;
  filter.Q.value = 0.7;

  // Soft room echo
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const delayGain = ctx.createGain();
  delayGain.gain.value = 0.22;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;

  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(filter);
  filter.connect(master);
  filter.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(master);
  delay.connect(feedback);
  feedback.connect(delay);
  master.connect(ctx.destination);

  // Warm moving pad (F major-ish)
  const padGain = ctx.createGain();
  padGain.gain.value = 0.028;
  padGain.connect(filter);
  const padOscs = [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12 + i * 0.03;
    lfoGain.gain.value = 2.5;
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);
    o.connect(padGain);
    o.start();
    lfo.start();
    return { o, lfo };
  });

  const songLen = scheduleBirthday(ctx, bus, ctx.currentTime + 0.2);
  const loopMs = songLen * 1000 + 900;
  musicTimer = window.setInterval(() => {
    if (!musicOn || !audioCtx || !musicNodes) return;
    scheduleBirthday(audioCtx, musicNodes.bus, audioCtx.currentTime + 0.08);
  }, loopMs);

  musicNodes = { master, padOscs, padGain, bus, delay, feedback };
  musicOn = true;
  muteBtn.hidden = false;
  muteBtn.textContent = "Mute music";
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!musicNodes || !audioCtx) {
    musicOn = false;
    muteBtn.textContent = "Play music";
    return;
  }
  musicNodes.padOscs.forEach(({ o, lfo }) => {
    try { o.stop(); } catch (_) {}
    try { lfo.stop(); } catch (_) {}
  });
  try {
    musicNodes.master.gain.cancelScheduledValues(audioCtx.currentTime);
    musicNodes.master.gain.setValueAtTime(Math.max(musicNodes.master.gain.value, 0.001), audioCtx.currentTime);
    musicNodes.master.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
  } catch (_) {}
  musicNodes = null;
  musicOn = false;
  muteBtn.textContent = "Play music";
}

function whoosh() {
  const ctx = ensureAudio();
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

function fireConfetti() {
  if (typeof confetti !== "function") return;
  const end = Date.now() + 1800;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ff7a6b", "#ffb4a8", "#fff6ea", "#f5d0a9"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ff7a6b", "#ffb4a8", "#fff6ea", "#34d399"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function openHub() {
  hero.hidden = true;
  hub.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });

  const hint = document.getElementById("scrollHint");
  const finale = document.getElementById("finale");
  if (hint) hint.hidden = false;

  const updateHint = () => {
    if (!hint || !finale) return;
    const rect = finale.getBoundingClientRect();
    const nearLetter = rect.top < window.innerHeight * 0.75;
    hint.hidden = nearLetter;
    if (nearLetter) window.removeEventListener("scroll", updateHint);
  };
  window.addEventListener("scroll", updateHint, { passive: true });
}

let candlesOut = false;
let micStream = null;
let micRaf = 0;
let blowStreak = 0;

function stopMicListen() {
  if (micRaf) {
    cancelAnimationFrame(micRaf);
    micRaf = 0;
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  cake.classList.remove("wind");
}

function blowCandles() {
  if (candlesOut) return;
  candlesOut = true;
  stopMicListen();
  blowBtn.disabled = true;
  cake.classList.remove("wind");
  cake.classList.add("blown");
  heroHint.textContent = "opening…";
  try {
    whoosh();
    startMusic();
  } catch (_) {}
  fireConfetti();
  window.setTimeout(openHub, 900);
}

async function startMicListen() {
  if (candlesOut || micStream || !navigator.mediaDevices?.getUserMedia) {
    if (!navigator.mediaDevices?.getUserMedia) {
      heroHint.textContent = "mic unavailable — tap the button";
    }
    return;
  }

  try {
    heroHint.textContent = "allow microphone…";
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (_) {
    heroHint.textContent = "mic blocked — tap the button instead";
    return;
  }

  if (candlesOut) {
    stopMicListen();
    return;
  }

  const ctx = ensureAudio();
  const source = ctx.createMediaStreamSource(micStream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.3;
  source.connect(analyser);

  const time = new Uint8Array(analyser.fftSize);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  heroHint.textContent = "blow into your mic now";

  const tick = () => {
    if (candlesOut || !micStream) return;

    analyser.getByteTimeDomainData(time);
    let sum = 0;
    for (let i = 0; i < time.length; i += 1) {
      const v = (time[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / time.length);

    analyser.getByteFrequencyData(freq);
    let total = 0;
    let low = 0;
    const third = Math.floor(freq.length / 3);
    for (let i = 0; i < freq.length; i += 1) {
      total += freq[i];
      if (i < third) low += freq[i];
    }
    const avg = total / freq.length;
    const lowRatio = low / (total || 1);

    // Blow = noisy/airy burst: loud + energy across spectrum (not a single speech peak)
    const isBlow = rms > 0.085 && avg > 28 && lowRatio > 0.28;

    if (rms > 0.045) cake.classList.add("wind");
    else cake.classList.remove("wind");

    if (isBlow) {
      blowStreak += 1;
      heroHint.textContent = "keep blowing…";
      if (blowStreak >= 10) {
        blowCandles();
        return;
      }
    } else {
      blowStreak = Math.max(0, blowStreak - 2);
      if (blowStreak === 0) heroHint.textContent = "blow into your mic now";
    }

    micRaf = requestAnimationFrame(tick);
  };

  micRaf = requestAnimationFrame(tick);
}

blowBtn.addEventListener("click", () => {
  blowCandles();
});

// Enable mic on first touch (needed on iPhone / some browsers)
hero.addEventListener(
  "pointerdown",
  () => {
    if (!candlesOut && !micStream) startMicListen();
  },
  { passive: true }
);

// Try early when the browser allows it without a gesture
startMicListen();

muteBtn.addEventListener("click", () => {
  if (musicOn) stopMusic();
  else startMusic();
});

/* Accordion */
document.querySelectorAll(".acc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const panel = btn.nextElementSibling;
    const open = panel.classList.contains("show");
    document.querySelectorAll(".acc-panel").forEach((p) => p.classList.remove("show"));
    document.querySelectorAll(".acc-btn").forEach((b) => {
      b.classList.remove("open");
      b.querySelector("span").textContent = "+";
    });
    if (!open) {
      panel.classList.add("show");
      btn.classList.add("open");
      btn.querySelector("span").textContent = "−";
    }
  });
});

/* Flip polaroids */
document.querySelectorAll(".flip-card").forEach((card) => {
  card.addEventListener("click", () => card.classList.toggle("flipped"));
});

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* Vault answers — simple & logical */
const ANSWERS = [
  (v) => {
    const t = normalize(v);
    return t.includes("online") || t.includes("tiktok") || t.includes("internet") || t === "app";
  },
  (v) => {
    const t = normalize(v);
    return t.includes("salmane") || t.includes("salman");
  },
  (v) => {
    const t = normalize(v);
    return t === "yes" || t === "y" || t.includes("yeah") || t.includes("yep") || t.includes("oui") || t.includes("distance") || t.includes("far");
  },
  (v) => {
    const t = normalize(v);
    return t === "27" || t.includes("twenty seven") || t.includes("twentyseven");
  },
];

document.querySelectorAll(".vault-card").forEach((card) => {
  const idx = Number(card.getAttribute("data-vault"));
  const input = card.querySelector("input");
  const btn = card.querySelector(".unlock-btn");
  const err = card.querySelector(".vault-err");
  const locked = card.querySelector(".vault-locked");
  const open = card.querySelector(".vault-open");

  function tryUnlock(e) {
    if (e) e.preventDefault();
    const val = normalize(input.value);
    if (ANSWERS[idx](val)) {
      err.hidden = true;
      locked.hidden = true;
      open.hidden = false;
      card.classList.add("unlocked");
      if (typeof confetti === "function") {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }
    } else {
      err.hidden = false;
      input.focus();
    }
  }

  btn.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock(e);
  });
});

/* Deep link for preview */
if (new URLSearchParams(window.location.search).has("open")) {
  openHub();
}
