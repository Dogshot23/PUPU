// PUPU MVP -- single-purpose app: press button, get a random card, avoid
// recent repeats, display it. Deliberately not the main PUPU app (see
// README.md in this folder for why, and for the explicit, user-approved
// decision to use Generated-state (not yet Approved) cards for this
// development build).

const RECENT_MEMORY_SIZE = 10; // how many just-shown cards to avoid repeating

const state = {
  cards: [],
  recent: [], // sourceIds of the most recently shown cards, oldest first
  missions: {}, // grouped by conversationType, e.g. { "guess": [...] }
};

const bubbleEl = document.getElementById("bubble");
const statusEl = document.getElementById("status");
const pupuCircle = document.getElementById("pupu-circle");
const pupuButton = document.getElementById("pupu-button");
const eyes = document.getElementById("pupu-eyes");
const mouth = document.getElementById("pupu-mouth");

// ---------- Artwork ----------
const EYES_OPEN_SRC = "images/pupu/eyes/eyes_open.png";
const EYES_CLOSED_SRC = "images/pupu/eyes/eyes_closed.png";
const BUTTON_UNPRESSED_SRC = "images/pupu/buttons/button_unpressed.png";
const BUTTON_PRESSED_SRC = "images/pupu/buttons/button_pressed.png";
const MOUTH_NORMAL_SRC = "images/pupu/mouths/mouth_neutral.png";
const MOUTH_SMILE_SRC = "images/pupu/mouths/mouth_smile.png";
const MOUTH_BLOW_SRC = "images/pupu/mouths/mouth_blow.png";
// Used by the idle chatter mouth cycle (see CHATTER_MOUTH_SEQUENCE).
const MOUTH_OH_SRC = "images/pupu/mouths/mouth_oh.png";
const MOUTH_WIDE_SRC = "images/pupu/mouths/mouth_wide.png";

// Maps an animation identifier (behaviour.animation, or an event's id)
// to the mouth expression that should show while it plays. Ported
// verbatim from script.js's MOUTH_BY_ANIMATION.
const MOUTH_BY_ANIMATION = {
  bounce: "smile",
  excited: "smile",
  laugh: "smile",
  sneeze: "blow",
  blow: "blow"
};

// Sets the mouth artwork for a given expression; anything
// unrecognised falls back to "normal". Restored from script.js's
// setMouth().
function setMouth(expression) {
  if (expression === "smile") {
    mouth.src = MOUTH_SMILE_SRC;
  } else if (expression === "blow") {
    mouth.src = MOUTH_BLOW_SRC;
  } else if (expression === "oh") {
    mouth.src = MOUTH_OH_SRC;
  } else if (expression === "wide") {
    mouth.src = MOUTH_WIDE_SRC;
  } else {
    mouth.src = MOUTH_NORMAL_SRC;
  }
}

// ---------- Behaviour data ----------
// Restored verbatim from behaviors.js. `message` is kept for fidelity
// but, same as in the original app, is never displayed -- the speech
// bubble always shows the card engine's text instead (mission text in
// the original, card text here). `duration` is used below as a
// temporary bridge for how long the behaviour animation stays visible
// before the finishing nod, standing in for the original's typewriter
// duration until that's restored.
const BEHAVIOURS = [
  { id: "hello", message: "Hello!", animation: "bounce", duration: 1200 },
  { id: "excited", message: "I have an idea!", animation: "excited", duration: 1400 },
  { id: "sleepy", message: "Oops... I nearly fell asleep.", animation: "sleepy", duration: 1600 },
  { id: "laugh", message: "Hehehe!", animation: "laugh", duration: 1200 }
];

// ---------- Special event data ----------
// Restored verbatim from script.js's EVENTS: a small random chance of
// one of these playing BEFORE the thinking state on any given press.
// This whole system (this data, EVENT_CHANCE, and maybeTriggerEvent/
// playEvent below) was the piece left out when behaviours were first
// ported to this file -- see Checkpoint 3.
const EVENTS = [
  { id: "sneeze", message: "Achoo!", bodyClass: "pupu-sneeze", closeEyes: false, duration: 500 },
  { id: "laugh", message: "Hehehe!", bodyClass: "pupu-laugh", closeEyes: false, duration: 600 },
  { id: "distracted", message: "Oh...", bodyClass: "pupu-distracted", closeEyes: false, duration: 700 },
  { id: "sleep", message: "Zzz...", bodyClass: null, closeEyes: true, duration: 1000 }
];

// Restored from brain.js's EVENT_CHANCE: chance a special event happens
// before thinking, rolled once per belly press.
const EVENT_CHANCE = 0.2;

const FINISH_DURATION_MS = 350; // must match the CSS finish animation length
const HOLD_MESSAGE_MS = 900; // how long the finished message stays before idle

// ---------- Small helpers (restored from script.js / brain.js) ----------
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Removes any previously applied behaviour animation class from PUPU,
// so a new one can be added cleanly (and so re-triggering the same
// behaviour restarts its animation). Restored from script.js's
// clearBehaviourAnimations().
function clearBehaviourAnimations() {
  BEHAVIOURS.forEach((behaviour) => {
    pupuCircle.classList.remove(`pupu-${behaviour.animation}`);
  });
  pupuCircle.classList.remove("pupu-thinking");
  pupuCircle.classList.remove("pupu-finish");

  // Also clear any special-event body classes left over on the circle.
  // Restored from script.js's clearBehaviourAnimations().
  EVENTS.forEach((event) => {
    if (event.bodyClass) {
      pupuCircle.classList.remove(event.bodyClass);
    }
  });
}

// ---------- Blinking ----------
// Restored from script.js's blink()/scheduleNextBlink(): triggers a
// single quick blink by swapping in the closed-eyes artwork, then
// schedules the next one at a random delay.
const BLINK_DURATION_MS = 180;
const BLINK_MIN_MS = 3000;
const BLINK_MAX_MS = 8000;

function blink() {
  eyes.src = EYES_CLOSED_SRC;
  setTimeout(() => {
    eyes.src = EYES_OPEN_SRC;
  }, BLINK_DURATION_MS);

  scheduleNextBlink();
}

function scheduleNextBlink() {
  setTimeout(blink, randomRange(BLINK_MIN_MS, BLINK_MAX_MS));
}

// ---------- Thinking state ----------
// Restored from script.js's think(): PUPU looks thoughtful (head tilt
// + tiny body wobble via .pupu-thinking) for a random duration before
// the reaction plays. eyes.classList "pupu-thinking-eye" is ported
// as-is from the main app too, even though style.css there has no
// rule for it either -- a harmless no-op in the original, not
// something to invent a visual for here.
const THINK_MIN_MS = 500;
const THINK_MAX_MS = 1500;

async function think() {
  pupuCircle.classList.add("pupu-thinking");
  eyes.classList.add("pupu-thinking-eye");

  await wait(randomRange(THINK_MIN_MS, THINK_MAX_MS));

  pupuCircle.classList.remove("pupu-thinking");
  eyes.classList.remove("pupu-thinking-eye");
}

// ---------- Sound ----------
// Restored from the main app's SoundManager categories (see
// sound-manager.js at the repo root) -- a minimal, MVP-scoped version:
// only the categories this app actually uses, no preloading/mute API,
// just a random variation played per call. playRandomSound() is the
// shared "pick a random variation, play it, warn quietly on failure"
// logic every category below needs; SoundManager gets the same
// behaviour from its generic play(category) -- this is that same
// pattern inlined per-category rather than as a lookup table, since
// this file was already using a hand-written playSquish() before this
// checkpoint and the categories being added here follow that.
function playRandomSound(files, label) {
  const file = files[Math.floor(Math.random() * files.length)];
  const audio = new Audio(file);
  audio.volume = 0.7;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn(`PUPU MVP: ${label} sound playback failed`, error);
    });
  }
}

const SQUISH_SOUND_FILES = [
  "sounds/squish/squish1.wav",
  "sounds/squish/squish2.wav",
  "sounds/squish/squish3.wav",
];

function playSquish() {
  playRandomSound(SQUISH_SOUND_FILES, "squish");
}

// ---------- Idle sounds/chatter sound categories ----------
// Restored verbatim (same files, same categories) from SOUND_FILES in
// sound-manager.js -- only the 5 categories the idle systems below
// actually call (bubbles, wobble, pupu, droplet, chatter). The many
// other SoundManager categories (burp, eating, fart, etc.) belong to
// systems this MVP doesn't have (idle chatter's mouth cycle aside) and
// aren't pulled in.
const BUBBLES_SOUND_FILES = [
  "sounds/bubbles/bubbles1.wav",
  "sounds/bubbles/bubbles2.wav",
  "sounds/bubbles/bubbles3.wav",
];
const WOBBLE_SOUND_FILES = ["sounds/wobble/wobble1.wav"];
const PUPU_SOUND_FILES = ["sounds/pupu/pupu1.wav", "sounds/pupu/pupu2.wav"];
const DROPLET_SOUND_FILES = ["sounds/droplet/droplet1.wav"];
const CHATTER_SOUND_FILES = [
  "sounds/chatter/chatter1.wav",
  "sounds/chatter/chatter2.wav",
  "sounds/chatter/chatter3.wav",
  "sounds/chatter/chatter4.wav",
  "sounds/chatter/chatter5.wav",
  "sounds/chatter/chatter6.wav",
  "sounds/chatter/chatter7.wav",
];

function playBubbles() {
  playRandomSound(BUBBLES_SOUND_FILES, "bubbles");
}

function playWobble() {
  playRandomSound(WOBBLE_SOUND_FILES, "wobble");
}

function playPupuSound() {
  playRandomSound(PUPU_SOUND_FILES, "pupu");
}

function playDroplet() {
  playRandomSound(DROPLET_SOUND_FILES, "droplet");
}

function playChatterSound() {
  playRandomSound(CHATTER_SOUND_FILES, "chatter");
}

// ---------- Idle sound system ----------
// Restored from script.js's idle sound system: while PUPU is idle (not
// thinking, typing, showing an event, or mid-reaction), an occasional
// small random sound plays. Paused for the entire reaction sequence
// and resumed automatically once PUPU returns to idle -- see
// pauseIdleSounds()/resumeIdleSounds(). `isBusy` (declared further
// below, alongside handleBellyPress) is this file's equivalent of the
// original's `surpriseBtn.disabled` busy flag.
const IDLE_SOUND_CHECK_MIN_MS = 10000; // 10s
const IDLE_SOUND_CHECK_MAX_MS = 80000; // 80s

// Cumulative probability thresholds (roll is a random 0-1 value):
// 50% nothing, 30% bubbles, 10% wobble, 7% pupu, 3% droplet.
const IDLE_SOUND_CHANCES = [
  { upTo: 0.50, action: null },
  { upTo: 0.80, action: () => playBubbles() },
  { upTo: 0.90, action: () => playWobble() },
  { upTo: 0.97, action: () => playPupuSound() },
  { upTo: 1.00, action: () => playDroplet() }
];

// Only one idle-sound timer may exist at a time; this holds its id so
// it can be cancelled cleanly (pauseIdleSounds()) instead of letting
// timers accumulate.
let idleSoundTimeoutId = null;

// Picks a random delay within the configured idle-check range.
function getRandomIdleSoundDelay() {
  return IDLE_SOUND_CHECK_MIN_MS + Math.random() * (IDLE_SOUND_CHECK_MAX_MS - IDLE_SOUND_CHECK_MIN_MS);
}

// Queues the next idle-sound check after a random delay.
function scheduleNextIdleSoundCheck() {
  idleSoundTimeoutId = setTimeout(runIdleSoundCheck, getRandomIdleSoundDelay());
}

// Rolls the dice for this idle check: usually nothing happens, and
// rarely a small random sound plays. Always reschedules itself
// afterward so the checks continue for as long as PUPU stays idle.
function runIdleSoundCheck() {
  idleSoundTimeoutId = null;

  // Safety net: reaction sequences pause this system at the source
  // (see pauseIdleSounds()), so this should rarely be reachable while
  // busy -- but never play if it somehow is.
  if (isBusy) return;

  const roll = Math.random();
  const chance = IDLE_SOUND_CHANCES.find((entry) => roll < entry.upTo);
  if (chance && chance.action) {
    chance.action();
    playIdleGesture(); // small chance of a tiny involuntary movement alongside the sound
  }

  scheduleNextIdleSoundCheck();
}

// ---------- Idle gestures ----------
// Restored from script.js's idle gesture system: a tiny, self-contained
// flourish layered on top of the idle sound system -- whenever an idle
// sound actually plays, there's a chance PUPU also makes one small
// involuntary movement. Reuses existing assets/classes wherever one
// already fits (blink artwork, the smile mouth, and the same
// .pupu-soft-wobble class the pwa's finish/thinking states don't use)
// -- and the .pupu-idle-brightness-pulse class, both already present
// in style.css.
const IDLE_GESTURE_SKIP_CHANCE = 0.5; // 50% chance of doing nothing
const IDLE_GESTURE_SMILE_MS = 400; // brief smile-flash duration
const IDLE_GESTURE_BRIGHTNESS_MS = 500; // must match .pupu-idle-brightness-pulse in style.css
// Must match .pupu-soft-wobble in style.css. Named independently of
// the original's BROKEN_BUTTON_WOBBLE_MS (same value, 500ms) since the
// broken-belly-button easter egg it was borrowed from isn't restored
// here -- this checkpoint is idle behaviour only.
const IDLE_GESTURE_WOBBLE_MS = 500;

// Guards against two idle gestures overlapping, and against a gesture
// overlapping the idle-chatter mouth cycle (which isn't covered by
// isBusy -- see chatterInProgress below).
let idleGestureActive = false;

// A standalone quick blink for gestures only. Reuses the same eyes
// artwork/timing as the real blink() cycle, but deliberately doesn't
// call scheduleNextBlink() -- that loop is already running on its own
// schedule and shouldn't be double-scheduled by a gesture.
function gestureBlink() {
  eyes.src = EYES_CLOSED_SRC;
  setTimeout(() => {
    eyes.src = EYES_OPEN_SRC;
    idleGestureActive = false;
  }, BLINK_DURATION_MS);
}

// Brief smile flash, reusing the existing mouth-swap helper.
function gestureSmile() {
  setMouth("smile");
  setTimeout(() => {
    setMouth("normal");
    idleGestureActive = false;
  }, IDLE_GESTURE_SMILE_MS);
}

// Tiny body wobble -- reuses the exact .pupu-soft-wobble class/timing
// already used for the broken-belly-button flinch/payoff in the main app.
function gestureWobble() {
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-soft-wobble");
  setTimeout(() => {
    pupuCircle.classList.remove("pupu-soft-wobble");
    idleGestureActive = false;
  }, IDLE_GESTURE_WOBBLE_MS);
}

// Subtle brightness pulse -- the one genuinely new visual in the
// original's idle gesture system, since no existing system there did a
// CSS filter pulse. Kept small and self-contained (see
// .pupu-idle-brightness-pulse in style.css).
function gestureBrightnessPulse() {
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-idle-brightness-pulse");
  setTimeout(() => {
    pupuCircle.classList.remove("pupu-idle-brightness-pulse");
    idleGestureActive = false;
  }, IDLE_GESTURE_BRIGHTNESS_MS);
}

// Weighted so the selection feels more natural (small movements more
// likely than the brightness pulse). Same cumulative-threshold pattern
// already used by IDLE_SOUND_CHANCES above.
const IDLE_GESTURES = [
  { upTo: 0.40, gesture: gestureWobble },
  { upTo: 0.70, gesture: gestureBlink },
  { upTo: 0.90, gesture: gestureSmile },
  { upTo: 1.00, gesture: gestureBrightnessPulse }
];

// Called right after an idle sound plays. ~50% chance of doing
// nothing; otherwise plays one small, random gesture. Skipped entirely
// if PUPU is busy (reaction/event/thinking -- covered by isBusy), if
// idle chatter is currently mid-cycle, or if a gesture is already in
// progress.
function playIdleGesture() {
  if (isBusy || chatterInProgress || idleGestureActive) return;
  if (Math.random() < IDLE_GESTURE_SKIP_CHANCE) return;

  idleGestureActive = true;
  const gestureRoll = Math.random();
  const picked = IDLE_GESTURES.find((entry) => gestureRoll < entry.upTo);
  picked.gesture();
}

// Cancels any pending idle-sound check. Called the instant a reaction
// sequence begins, so idle sounds never overlap thinking/typing/events.
function pauseIdleSounds() {
  if (idleSoundTimeoutId !== null) {
    clearTimeout(idleSoundTimeoutId);
    idleSoundTimeoutId = null;
  }
}

// Starts a fresh idle-sound check cycle. Called once at startup and
// again every time PUPU returns to idle after a reaction.
function resumeIdleSounds() {
  scheduleNextIdleSoundCheck();
}

// ---------- Idle chatter system ----------
// Restored from script.js's idle chatter system: a small, self-
// contained "flavour" behaviour -- every so often while PUPU is
// otherwise completely idle, he makes a bit of cute nonsense chatter: a
// chatter sound plays while the mouth cycles rapidly through a few
// existing expressions, then settles back to normal. This never
// touches the speech bubble or the behaviour/event system -- it's a
// mouth + sound flourish layered on top, gated by the same "is PUPU
// busy?" check (isBusy) the idle-sound system already uses.
const IDLE_CHATTER_CHECK_MIN_MS = 120000; // 2 minutes
const IDLE_CHATTER_CHECK_MAX_MS = 300000; // 5 minutes
const CHATTER_MIN_DURATION_MS = 2000; // 2 seconds
const CHATTER_MAX_DURATION_MS = 4000; // 4 seconds
const CHATTER_MOUTH_FRAME_MS = 140; // how often the mouth swaps during chatter

// Expressions cycled through while chattering, reusing the same
// setMouth() vocabulary used everywhere else in this file. This is
// what MOUTH_OH_SRC/MOUTH_WIDE_SRC (declared near the top of this
// file) were being held for.
const CHATTER_MOUTH_SEQUENCE = ["normal", "smile", "oh", "wide", "blow"];

let idleChatterTimeoutId = null;

// Tracks whether a chatter flourish is currently mid-cycle. Idle
// chatter isn't gated by isBusy (it can run alongside an otherwise-
// idle PUPU), so idle gestures check this flag too, avoiding a
// mouth-swap gesture clashing with chatter's own mouth cycle. Set true
// right before chatter() starts swapping the mouth, false right after
// it settles back to normal.
let chatterInProgress = false;

// Picks a random delay within the configured 2-5 minute idle-chatter range.
function getRandomIdleChatterDelay() {
  return IDLE_CHATTER_CHECK_MIN_MS + Math.random() * (IDLE_CHATTER_CHECK_MAX_MS - IDLE_CHATTER_CHECK_MIN_MS);
}

// Queues the next idle-chatter check after a random delay.
function scheduleNextIdleChatterCheck() {
  idleChatterTimeoutId = setTimeout(runIdleChatterCheck, getRandomIdleChatterDelay());
}

// Plays one chatter flourish: a random chatter sound plus a rapid
// mouth cycle for roughly 2-4 seconds, then rests the mouth back to
// normal. Returns a Promise so the idle-chatter loop can simply await
// it before scheduling the next check.
function chatter() {
  return new Promise((resolve) => {
    chatterInProgress = true;
    playChatterSound();

    const duration = CHATTER_MIN_DURATION_MS + Math.random() * (CHATTER_MAX_DURATION_MS - CHATTER_MIN_DURATION_MS);
    let frame = 0;

    const mouthCycleId = setInterval(() => {
      setMouth(CHATTER_MOUTH_SEQUENCE[frame % CHATTER_MOUTH_SEQUENCE.length]);
      frame++;
    }, CHATTER_MOUTH_FRAME_MS);

    setTimeout(() => {
      clearInterval(mouthCycleId);
      setMouth("normal");
      chatterInProgress = false;
      resolve();
    }, duration);
  });
}

// Rolls the dice for this idle-chatter check. If PUPU is currently
// busy, this simply reschedules and tries again later rather than
// queuing or forcing the chatter in.
async function runIdleChatterCheck() {
  idleChatterTimeoutId = null;

  if (isBusy) {
    scheduleNextIdleChatterCheck();
    return;
  }

  await chatter();
  scheduleNextIdleChatterCheck();
}

// Cancels any pending idle-chatter check. Called the instant a
// reaction sequence begins, mirroring pauseIdleSounds().
function pauseIdleChatter() {
  if (idleChatterTimeoutId !== null) {
    clearTimeout(idleChatterTimeoutId);
    idleChatterTimeoutId = null;
  }
}

// Starts a fresh idle-chatter check cycle. Called once at startup and
// again every time PUPU returns to idle after a reaction, mirroring
// resumeIdleSounds().
function resumeIdleChatter() {
  scheduleNextIdleChatterCheck();
}

// ---------- Special event system ----------
// Restored from script.js's playEvent(): applies the event's classes,
// briefly shows its own message in the bubble (unlike a behaviour's
// message, an event's message IS shown -- it plays before the card is
// picked, so nothing else is competing for the bubble yet), waits for
// its duration, then cleans up. Displays the message using this file's
// existing <p class="beat"> bubble markup (see renderCard) rather than
// the main app's separate English/Korean speech-text elements, since
// this MVP has no Korean line to show or hide.
async function playEvent(event) {
  clearBehaviourAnimations();

  if (event.bodyClass) {
    void pupuCircle.offsetWidth; // force reflow so the animation can restart
    pupuCircle.classList.add(event.bodyClass);
  }
  if (event.closeEyes) {
    eyes.src = EYES_CLOSED_SRC;
  }
  setMouth(MOUTH_BY_ANIMATION[event.id]);

  bubbleEl.innerHTML = "";
  appendBubbleLine(event.message);
  replayAnimation(bubbleEl, "pupu-inflate", 500);

  await wait(event.duration);

  clearBehaviourAnimations();
  if (event.closeEyes) {
    eyes.src = EYES_OPEN_SRC;
  }
  setMouth("normal");
}

// Restored from script.js's maybeTriggerEvent(): rolls the Brain's
// EVENT_CHANCE; if it hits, picks and plays a random event before
// resolving. Otherwise resolves immediately, so the calling sequence
// can simply `await maybeTriggerEvent()` regardless of outcome.
async function maybeTriggerEvent() {
  if (Math.random() < EVENT_CHANCE) {
    const event = pickRandomFrom(EVENTS);
    await playEvent(event);
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

// ---------- Mission Engine ----------
// Missions are grouped by conversationType (missions.json is now an
// object keyed by category, e.g. { "guess": [...], "opinion": [...] })
// rather than one flat pool, so a mission can be picked to match the
// kind of conversation the card's fact naturally invites -- see
// pickMission() below. Still fetched once at startup, still a plain
// uniform random choice within whichever pool is used, minus the
// recent-avoidance memory (not asked for here, so not added).
async function loadMissions() {
  try {
    const response = await fetch("missions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.missions = await response.json();
  } catch (error) {
    console.error("PUPU MVP: failed to load missions.json", error);
  }
}

// Picks a random mission from the given conversationType's pool. Falls
// back to picking from every mission across all categories if that
// category doesn't exist or is empty, so an unmapped or sparsely
// populated category can never leave a card without a mission.
function pickMission(conversationType) {
  const pool = state.missions[conversationType];
  if (pool && pool.length > 0) {
    return pickRandomFrom(pool);
  }
  return pickRandomFrom(Object.values(state.missions).flat());
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

// Appends one line to the speech bubble using the existing .beat
// paragraph style -- used by playEvent() further up for its one-off
// messages, so there's one place that creates a bare bubble line.
function appendBubbleLine(text) {
  const p = document.createElement("p");
  p.className = "beat";
  p.textContent = text;
  bubbleEl.appendChild(p);
}

// Appends one labelled, visually separated section to the speech
// bubble (used by renderCard() below). Presentation only -- card.english
// and mission.text are unchanged data, just grouped and labelled so a
// child can scan "the fact" vs. "PUPU's reaction" vs. "the mission" at
// a glance instead of reading one long block.
function appendBubbleSection(modifier, label, lines) {
  const section = document.createElement("div");
  section.className = `bubble-section bubble-section-${modifier}`;

  const labelEl = document.createElement("p");
  labelEl.className = "bubble-label";
  labelEl.textContent = label;
  section.appendChild(labelEl);

  lines.forEach((line) => {
    const p = document.createElement("p");
    p.className = "beat";
    p.textContent = line;
    section.appendChild(p);
  });

  bubbleEl.appendChild(section);
}

// Presentation-only timing for renderCard()'s staggered reveal below.
// Deliberately slow -- PUPU should read as "thinking of the next
// thing to say," not as a UI transition -- so the gap between
// sections is several seconds, not a snappy stagger.
// SECTION_FADE_DURATION_MS must match the animation-duration on
// .bubble-section in style.css (kept in sync manually; see the
// comment there).
const SECTION_REVEAL_DELAY_MS = 10000;
const SECTION_FADE_DURATION_MS = 1800;

// Timer IDs for a section reveal still in flight. A belly press that
// lands before all three sections have appeared must cancel these
// before scheduling its own, otherwise the old card's still-pending
// timers would fire later and append its sections into the new
// card's bubble.
let pendingRevealTimerIds = [];

function cancelPendingReveal() {
  pendingRevealTimerIds.forEach((id) => clearTimeout(id));
  pendingRevealTimerIds = [];
}

// card.english is always 4 lines: a fact headline + detail, then two
// short lines of PUPU's own reaction to it (see cards.json). Splitting
// the array in half groups those into "the fact" vs. "PUPU's reaction"
// sections below without inventing any new content or touching the
// card data structure.
//
// The three sections are appended one at a time via setTimeout rather
// than all at once -- and never removed, so the bubble grows instead
// of replacing what's already shown. renderCard() itself stays a
// plain (non-async) function that returns immediately -- callers that
// don't await it (see handleBellyPress) are unaffected.
function renderCard(card, mission) {
  cancelPendingReveal();
  bubbleEl.innerHTML = "";

  const sections = [
    { modifier: "fact", label: "💡 DID YOU KNOW?", lines: card.english.slice(0, 2) },
    { modifier: "weird", label: "😊 I THINK...", lines: card.english.slice(2) },
    { modifier: "mission", label: "🗣️ PUPU HAS AN IDEA...", lines: [mission.text] },
  ];

  sections.forEach((section, index) => {
    const timerId = setTimeout(() => {
      appendBubbleSection(section.modifier, section.label, section.lines);
    }, index * SECTION_REVEAL_DELAY_MS);
    pendingRevealTimerIds.push(timerId);
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

// Restored from script.js's surpriseBtn.disabled gate: true for the
// entire press-to-idle sequence, so a second press can't stack a new
// sequence on top of one already playing.
let isBusy = false;

async function handleBellyPress() {
  if (isBusy || state.cards.length === 0 || Object.keys(state.missions).length === 0) return;
  isBusy = true;

  playSquish();

  // Restored from script.js's playReaction(): the belly button's own
  // pressed artwork, held through thinking, and disabled so it can't
  // be pressed again mid-sequence.
  pupuButton.classList.add("pupu-button-disabled");
  pupuButton.src = BUTTON_PRESSED_SRC;

  // Restored from script.js's playReaction(): idle sounds/gestures and
  // idle chatter are paused for the entire reaction sequence so they
  // never overlap thinking/typing/events.
  pauseIdleSounds();
  pauseIdleChatter();

  // Restored from script.js's playReaction(): a random special event
  // may happen first (20% chance), before PUPU starts thinking.
  await maybeTriggerEvent();

  await think();

  // Restored from script.js's playReaction(): the Brain (here, a
  // plain random pick) chooses a behaviour; its animation plays --
  // triggering the matching arm animation via the CSS selectors on
  // .pupu-circle.pupu-<animation> .pupu-arm-left/right -- and the
  // mouth expression that goes with it.
  const behaviour = pickRandomFrom(BEHAVIOURS);
  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add(`pupu-${behaviour.animation}`);
  setMouth(MOUTH_BY_ANIMATION[behaviour.animation]);

  // The card is picked first so its conversationType can steer which
  // mission pool pickMission() draws from -- see the Mission Engine
  // section above. renderCard() itself still just receives (card,
  // mission), same as before.
  const card = pickCard();
  renderCard(card, pickMission(card.conversationType));
  replayAnimation(bubbleEl, "pupu-inflate", 500);

  // Bridge until the typewriter effect is restored: hold the
  // behaviour's animation for its own duration (see the BEHAVIOURS
  // comment above), then play the finishing nod.
  await wait(behaviour.duration);

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-finish");
  setMouth("normal");
  await wait(FINISH_DURATION_MS);

  await wait(HOLD_MESSAGE_MS);

  clearBehaviourAnimations();
  pupuButton.src = BUTTON_UNPRESSED_SRC;
  pupuButton.classList.remove("pupu-button-disabled");
  isBusy = false;

  // Restored from script.js's playReaction(): only now that PUPU is
  // idle again do idle sounds/gestures and idle chatter resume.
  resumeIdleSounds();
  resumeIdleChatter();
}

// PUPU's belly is the only primary interaction now (the separate
// "Press PUPU" button was removed); keydown handles Enter/Space since
// the button is exposed as role="button" for accessibility, matching
// how the main app's belly button already works (see script.js).
pupuButton.addEventListener("click", handleBellyPress);
pupuButton.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleBellyPress();
  }
});

scheduleNextBlink();
loadCards();
loadMissions();

// Restored from script.js's init(): arms both idle loops once at
// startup, same as the belly-press handler re-arms them after every
// reaction (see resumeIdleSounds()/resumeIdleChatter() above).
resumeIdleSounds();
resumeIdleChatter();

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
