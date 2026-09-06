const hero = document.getElementById("hero");
const hub = document.getElementById("hub");
const blowBtn = document.getElementById("blowBtn");
const cake = document.getElementById("cake");
const muteBtn = document.getElementById("muteBtn");
const heroHint = document.getElementById("heroHint");

let audioCtx = null;
let musicNodes = null;
let musicOn = false;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/** Soft looping pad — no external file needed */
function startMusic() {
  const ctx = ensureAudio();
  if (musicNodes) return;

  const master = ctx.createGain();
  master.gain.value = 0.04;
  master.connect(ctx.destination);

  const freqs = [196, 246.94, 293.66, 392];
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = i % 2 ? "sine" : "triangle";
    o.frequency.value = f;
    g.gain.value = 0.2;
    o.connect(g);
    g.connect(master);
    o.start();
    return { o, g };
  });

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();

  musicNodes = { master, oscs, lfo, lfoGain };
  musicOn = true;
  muteBtn.hidden = false;
  muteBtn.textContent = "Mute music";
}

function stopMusic() {
  if (!musicNodes || !audioCtx) return;
  musicNodes.oscs.forEach(({ o }) => {
    try { o.stop(); } catch (_) {}
  });
  try { musicNodes.lfo.stop(); } catch (_) {}
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

/* Vault answers — from real chats */
const ANSWERS = [
  (v) => /tik\s*tok|tt|tiktok/.test(v),
  (v) => v === "3" || /three/.test(v),
  (v) => /sleeping\s*beauty|sleepingbeauty/.test(v),
  (v) => v === "27" || /twenty\s*seven/.test(v),
];

document.querySelectorAll(".vault-card").forEach((card) => {
  const idx = Number(card.dataset.vault);
  const input = card.querySelector("input");
  const btn = card.querySelector(".unlock-btn");
  const err = card.querySelector(".vault-err");
  const locked = card.querySelector(".vault-locked");
  const open = card.querySelector(".vault-open");

  function tryUnlock() {
    const val = (input.value || "").trim().toLowerCase();
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
    if (e.key === "Enter") tryUnlock();
  });
});

/* Deep link for preview */
if (new URLSearchParams(window.location.search).has("open")) {
  openHub();
}
