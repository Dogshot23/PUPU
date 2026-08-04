// PUPU MVP -- single-purpose app: press button, get a random card, avoid
// recent repeats, display it. Deliberately not the main PUPU app (see
// README.md in this folder for why, and for the explicit, user-approved
// decision to use Generated-state (not yet Approved) cards for this
// development build).

const RECENT_MEMORY_SIZE = 10; // how many just-shown cards to avoid repeating

const state = {
  cards: [],
  recent: [], // sourceIds of the most recently shown cards, oldest first
};

const bubbleEl = document.getElementById("bubble");
const statusEl = document.getElementById("status");
const pupuImageEl = document.getElementById("pupu-image");
const pupuVisualEl = document.getElementById("pupu-visual");

// ---------- Sound ----------
// Restored from the main app's SoundManager "squish" category (see
// sound-manager.js at the repo root) -- a minimal, MVP-scoped version:
// one category, no preloading/mute API, just a random variation played
// on each belly press.
const SQUISH_SOUND_FILES = [
  "sounds/squish/squish1.wav",
  "sounds/squish/squish2.wav",
  "sounds/squish/squish3.wav",
];

function playSquish() {
  const file = SQUISH_SOUND_FILES[Math.floor(Math.random() * SQUISH_SOUND_FILES.length)];
  const audio = new Audio(file);
  audio.volume = 0.7;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn("PUPU MVP: squish sound playback failed", error);
    });
  }
}

async function loadCards() {
  try {
    const response = await fetch("cards.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.cards = await response.json();
    statusEl.textContent = `${state.cards.length} cards loaded (Generated -- not yet reviewed)`;
  } catch (error) {
    statusEl.textContent = "Could not load cards.";
    console.error("PUPU MVP: failed to load cards.json", error);
  }
}

function pickCard() {
  const notRecentlyShown = state.cards.filter(
    (card) => !state.recent.includes(card.sourceId)
  );
  const pool = notRecentlyShown.length > 0 ? notRecentlyShown : state.cards;
  const card = pool[Math.floor(Math.random() * pool.length)];

  state.recent.push(card.sourceId);
  if (state.recent.length > RECENT_MEMORY_SIZE) {
    state.recent.shift();
  }

  return card;
}

function renderCard(card) {
  bubbleEl.innerHTML = "";
  card.english.forEach((line) => {
    const p = document.createElement("p");
    p.className = "beat";
    p.textContent = line;
    bubbleEl.appendChild(p);
  });
  statusEl.textContent = `${card.sourceId} · ${card.engine} · Generated (not yet reviewed)`;
}

// Re-triggers a CSS animation class even if it's already present (e.g.
// from a rapid repeat press) by removing it, forcing reflow, then
// re-adding it -- otherwise the browser would just no-op on an
// unchanged class list and the animation wouldn't restart.
function replayAnimation(el, className, durationMs) {
  el.classList.remove(className);
  void el.offsetWidth; // force reflow
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), durationMs);
}

function handleBellyPress() {
  if (state.cards.length === 0) return;
  renderCard(pickCard());

  playSquish();

  // Restored from the main app: the belly-press bounce (see
  // .pupu-visual.pupu-bounce) and the bubble's inflate pop (see
  // .bubble.pupu-inflate) in style.css.
  replayAnimation(pupuVisualEl, "pupu-bounce", 600);
  replayAnimation(bubbleEl, "pupu-inflate", 500);

  // Tiny decorative squash-on-press cue, layered on top of the bounce
  // above since it lives on the innermost image element.
  pupuImageEl.style.transform = "scale(0.94)";
  setTimeout(() => {
    pupuImageEl.style.transform = "scale(1)";
  }, 120);
}

// PUPU's belly is the only primary interaction now (the separate
// "Press PUPU" button was removed); keydown handles Enter/Space since
// the image is exposed as role="button" for accessibility, matching
// how the main app's belly button already works (see script.js).
pupuImageEl.addEventListener("click", handleBellyPress);
pupuImageEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleBellyPress();
  }
});

loadCards();

// ---------- PWA install prompt ----------
let deferredInstallPrompt = null;
const installButtonEl = document.getElementById("install-button");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButtonEl.hidden = false;
});

installButtonEl.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButtonEl.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installButtonEl.hidden = true;
});

// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("PUPU MVP: service worker registration failed", error);
    });
  });
}
