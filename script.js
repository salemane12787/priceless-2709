const hero = document.getElementById("hero");
const hub = document.getElementById("hub");
const blowBtn = document.getElementById("blowBtn");
const cake = document.getElementById("cake");
const muteBtn = document.getElementById("muteBtn");
const heroHint = document.getElementById("heroHint");
const dots = document.getElementById("dots");

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
  muteBtn.textContent = "Mute";
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!musicNodes || !audioCtx) {
    musicOn = false;
    muteBtn.textContent = "Music";
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
  muteBtn.textContent = "Music";
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

function fireConfetti(big = false) {
  if (typeof confetti !== "function") return;
  const end = Date.now() + (big ? 2200 : 1400);
  (function frame() {
    confetti({
      particleCount: big ? 7 : 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ff7a6b", "#ffb4a8", "#fff6ea", "#34d399"],
    });
    confetti({
      particleCount: big ? 7 : 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ff7a6b", "#ffb4a8", "#fff6ea", "#34d399"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function popConfetti() {
  if (typeof confetti !== "function") return;
  confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
}

function openHub() {
  hero.hidden = true;
  hub.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
  showLevel(0);
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
  heroHint.textContent = "game loading…";
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

blowBtn.addEventListener("click", () => blowCandles());

hero.addEventListener(
  "pointerdown",
  () => {
    if (!candlesOut && !micStream) startMicListen();
  },
  { passive: true }
);

startMicListen();

muteBtn.addEventListener("click", () => {
  if (musicOn) stopMusic();
  else startMusic();
});

/* —— GAME —— */
function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function showLevel(n) {
  document.querySelectorAll(".level").forEach((el) => {
    const match = Number(el.getAttribute("data-level")) === n;
    el.hidden = !match;
    if (match) {
      el.classList.remove("show");
      void el.offsetWidth;
      el.classList.add("show");
    }
  });

  if (dots) {
    const items = [...dots.querySelectorAll("i")];
    items.forEach((dot, i) => {
      dot.classList.toggle("on", i === Math.min(n, 4));
      dot.classList.toggle("done", i < Math.min(n, 5));
    });
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (n === 5) fireConfetti(true);
}

document.querySelectorAll("[data-next]").forEach((btn) => {
  btn.addEventListener("click", () => {
    showLevel(Number(btn.getAttribute("data-next")));
    popConfetti();
  });
});

function wireChoices(levelEl, reactId, okMsg, badMsg) {
  const react = document.getElementById(reactId);
  const next = levelEl.querySelector("[data-next]");
  levelEl.querySelectorAll(".choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (levelEl.dataset.done === "1") return;
      const ok = btn.getAttribute("data-ok") === "1";
      if (ok) {
        levelEl.dataset.done = "1";
        btn.classList.add("correct");
        levelEl.querySelectorAll(".choice").forEach((b) => { b.disabled = true; });
        if (react) {
          react.hidden = false;
          react.classList.remove("bad");
          react.textContent = okMsg;
        }
        if (next) next.hidden = false;
        popConfetti();
      } else {
        btn.classList.remove("wrong");
        void btn.offsetWidth;
        btn.classList.add("wrong");
        hub.classList.remove("shake-screen");
        void hub.offsetWidth;
        hub.classList.add("shake-screen");
        if (react) {
          react.hidden = false;
          react.classList.add("bad");
          react.textContent = badMsg;
        }
      }
    });
  });
}

wireChoices(
  document.querySelector('[data-level="1"]'),
  "react1",
  "Correct. Random app. Real friendship.",
  "Nope. Try again 💀"
);

wireChoices(
  document.querySelector('[data-level="2"]'),
  "react2",
  "YES. 1+1=3. Math who?",
  "Too logical. Be unserious."
);

wireChoices(
  document.querySelector('[data-level="4"]'),
  "react4",
  "27. The whole point of this page.",
  "Wrong day. Wrong universe."
);

document.getElementById("nameForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const level = document.querySelector('[data-level="3"]');
  if (level.dataset.done === "1") return;
  const val = normalize(document.getElementById("nameInput").value);
  const react = document.getElementById("react3");
  const next = level.querySelector("[data-next]");
  if (val.includes("salmane") || val.includes("salman")) {
    level.dataset.done = "1";
    react.hidden = false;
    react.classList.remove("bad");
    react.textContent = "Okay you know me. Respect.";
    next.hidden = false;
    popConfetti();
  } else {
    react.hidden = false;
    react.classList.add("bad");
    react.textContent = "Hmm… try again (hint: starts with S)";
    hub.classList.remove("shake-screen");
    void hub.offsetWidth;
    hub.classList.add("shake-screen");
  }
});

document.getElementById("replayFx").addEventListener("click", () => fireConfetti(true));

document.getElementById("openWhenBtn").addEventListener("click", () => {
  showLevel(6);
});

document.getElementById("bonusForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = normalize(document.getElementById("bonusInput").value);
  const ok =
    val.includes("tiktok") ||
    val.includes("online") ||
    val.includes("internet") ||
    val === "app";
  if (ok) {
    document.getElementById("bonusOpen").hidden = false;
    document.getElementById("bonusForm").hidden = true;
    fireConfetti(true);
  } else {
    hub.classList.remove("shake-screen");
    void hub.offsetWidth;
    hub.classList.add("shake-screen");
  }
});

if (new URLSearchParams(window.location.search).has("open")) {
  openHub();
}
