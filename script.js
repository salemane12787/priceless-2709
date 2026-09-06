const lock = document.getElementById("lock");
const phone = document.getElementById("phone");
const openChat = document.getElementById("openChat");
const chat = document.getElementById("chat");
const lastText = document.getElementById("lastText");
const typing = document.getElementById("typing");
const chatStatus = document.getElementById("chatStatus");

const LAST_MESSAGE =
  "Happy birthday Firdaous.\n\nI don't know your street. I wasn't in the year before October. Then I was.\n\nNo box. No address. No price. Just this chat — and I'm still here.";

function initParticles() {
  if (typeof particlesJS !== "function") return;
  particlesJS("particles-js", {
    particles: {
      number: { value: 45, density: { enable: true, value_area: 800 } },
      color: { value: ["#25d366", "#f5d0a9", "#8696a0"] },
      shape: { type: "circle" },
      opacity: { value: 0.35, random: true },
      size: { value: 2.5, random: true },
      line_linked: {
        enable: true,
        distance: 120,
        color: "#25d366",
        opacity: 0.12,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: "none",
        random: true,
        out_mode: "out",
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: false },
        resize: true,
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 0.25 } },
      },
    },
    retina_detect: true,
  });
}

function revealOnScroll() {
  const nodes = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -24px 0px" }
  );
  nodes.forEach((el) => io.observe(el));
}

function typeLastMessage() {
  return new Promise((resolve) => {
    typing.hidden = false;
    chatStatus.textContent = "typing…";
    chat.scrollTop = chat.scrollHeight;

    window.setTimeout(() => {
      typing.hidden = true;
      chatStatus.textContent = "online";
      lastText.textContent = "";
      const bubble = document.getElementById("lastBubble");
      bubble.classList.add("visible");

      let i = 0;
      const timer = setInterval(() => {
        lastText.textContent = LAST_MESSAGE.slice(0, i + 1);
        i += 1;
        chat.scrollTop = chat.scrollHeight;
        if (i >= LAST_MESSAGE.length) {
          clearInterval(timer);
          resolve();
        }
      }, 28);
    }, 1400);
  });
}

function openStory() {
  lock.hidden = true;
  phone.hidden = false;
  const canvas = document.querySelector("#particles-js canvas");
  if (canvas) canvas.style.opacity = "0.25";
  window.scrollTo({ top: 0, behavior: "instant" });
  revealOnScroll();

  const lastBubble = document.getElementById("lastBubble");
  const endNote = document.querySelector(".end-note");
  const lastIo = new IntersectionObserver(
    async (entries) => {
      if (!entries[0].isIntersecting) return;
      lastIo.disconnect();
      await typeLastMessage();
      endNote.classList.add("visible");
    },
    { threshold: 0.4 }
  );
  lastIo.observe(lastBubble);
}

openChat.addEventListener("click", () => {
  lock.classList.add("leave");
  window.setTimeout(openStory, 480);
});

initParticles();

if (new URLSearchParams(window.location.search).has("open")) {
  openStory();
}
