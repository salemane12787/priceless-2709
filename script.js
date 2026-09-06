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
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25,
};

/** Happy Birthday — soft music-box style, loops */
const BIRTHDAY_SONG = [
  [NOTE.C4, 0.35], [NOTE.C4, 0.35], [NOTE.D4, 0.7], [NOTE.C4, 0.7], [NOTE.F4, 0.7], [NOTE.E4, 1.2],
  [NOTE.C4, 0.35], [NOTE.C4, 0.35], [NOTE.D4, 0.7], [NOTE.C4, 0.7], [NOTE.G4, 0.7], [NOTE.F4, 1.2],
  [NOTE.C4, 0.35], [NOTE.C4, 0.35], [NOTE.C5, 0.7], [NOTE.A4, 0.7], [NOTE.F4, 0.7], [NOTE.E4, 0.7], [NOTE.D4, 1.2],
  [NOTE.Bb4, 0.35], [NOTE.Bb4, 0.35], [NOTE.A4, 0.7], [NOTE.F4, 0.7], [NOTE.G4, 0.7], [NOTE.F4, 1.6],
];

function playTone(ctx, dest, freq, start, dur) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc2.type = "sine";
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.08, start + dur * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  const mix = ctx.createGain();
  mix.gain.value = 0.55;
  const mix2 = ctx.createGain();
  mix2.gain.value = 0.12;
  osc.connect(mix);
  osc2.connect(mix2);
  mix.connect(gain);
  mix2.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc2.start(start);
  osc.stop(start + dur + 0.05);
  osc2.stop(start + dur + 0.05);
}

function scheduleBirthday(ctx, master, when) {
  let t = when;
  BIRTHDAY_SONG.forEach(([freq, dur]) => {
    playTone(ctx, master, freq, t, dur * 0.92);
    t += dur;
  });
  return t - when;
}

function startMusic() {
  const ctx = ensureAudio();
  if (musicNodes) return;

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  // Soft warm pad under the melody
  const padGain = ctx.createGain();
  padGain.gain.value = 0.035;
  padGain.connect(master);
  const padOscs = [174.61, 220, 261.63].map((f) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(padGain);
    o.start();
    return o;
  });

  const loopMs = scheduleBirthday(ctx, master, ctx.currentTime + 0.15) * 1000 + 600;
  musicTimer = window.setInterval(() => {
    if (!musicOn || !audioCtx) return;
    scheduleBirthday(audioCtx, master, audioCtx.currentTime + 0.05);
  }, loopMs);

  musicNodes = { master, padOscs, padGain };
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
  musicNodes.padOscs.forEach((o) => {
    try { o.stop(); } catch (_) {}
  });
  try {
    musicNodes.master.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
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
}

blowBtn.addEventListener("click", () => {
  blowBtn.disabled = true;
  cake.classList.add("blown");
  heroHint.textContent = "opening…";
  try {
    whoosh();
    startMusic();
  } catch (_) {}
  fireConfetti();
  window.setTimeout(openHub, 900);
});

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
