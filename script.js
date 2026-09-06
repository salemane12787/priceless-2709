const gate = document.getElementById("gate");
const story = document.getElementById("story");
const openGift = document.getElementById("openGift");
const typeLine = document.getElementById("typeLine");

function makePetals() {
  const layer = document.querySelector(".petals");
  const marks = ["🌸", "✦", "·"];
  for (let i = 0; i < 18; i += 1) {
    const el = document.createElement("span");
    el.className = "petal";
    el.textContent = marks[i % marks.length];
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${10 + Math.random() * 14}s`;
    el.style.animationDelay = `${-Math.random() * 12}s`;
    el.style.fontSize = `${12 + Math.random() * 16}px`;
    layer.appendChild(el);
  }
}

function typeText(el, text) {
  el.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, i + 1);
    i += 1;
    if (i >= text.length) clearInterval(timer);
  }, 70);
}

function openStory() {
  gate.hidden = true;
  story.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
  typeText(typeLine, "Whereee rrr uuu  ·  right here");
}

openGift.addEventListener("click", () => {
  gate.classList.add("leave");
  window.setTimeout(openStory, 520);
});

document.querySelectorAll(".env").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
  });
});

makePetals();

if (new URLSearchParams(window.location.search).has("open")) {
  openStory();
}
