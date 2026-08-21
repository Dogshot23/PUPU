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
  translations: {}, // { [card.sourceId]: { [langCode]: { sections: [[line0, line1?], [line0]] } } } -- see loadTranslations()
};

const bubbleEl = document.getElementById("bubble");
const languageToggleEl = document.getElementById("language-toggle");
const statusEl = document.getElementById("status");
const pupuCircle = document.getElementById("pupu-circle");
const pupuButton = document.getElementById("pupu-button");
const eyes = document.getElementById("pupu-eyes");
const mouth = document.getElementById("pupu-mouth");
const hatEl = document.getElementById("pupu-hat");
const itemEl = document.getElementById("pupu-item");
const effectEl = document.getElementById("pupu-effect");
const bodyEl = document.getElementById("pupu-body");
const armLeftEl = document.getElementById("pupu-arm-left");
const armRightEl = document.getElementById("pupu-arm-right");
const shadowEl = document.getElementById("pupu-shadow");
const ghostBodyEl = document.getElementById("pupu-body-ghost");
const ghostOverlayEl = document.getElementById("ghost-overlay");

// ---------- Artwork ----------
const EYES_OPEN_SRC = "images/pupu/eyes/eyes_open.png";
const EYES_CLOSED_SRC = "images/pupu/eyes/eyes_closed.png";
const EYES_SMILING_SRC = "images/pupu/eyes/eyes_smiling.png";
const EYES_DOTS_SRC = "images/pupu/eyes/eyes_dots.png";
const EYES_SLITS_SRC = "images/pupu/eyes/eyes_slits.png";
const EYES_CIRCLES_SRC = "images/pupu/eyes/eyes_circles.png";
const EYES_PUPU_SRC = "images/pupu/eyes/eyes_pupu.png";
const BUTTON_UNPRESSED_SRC = "images/pupu/buttons/button_unpressed.png";
const BUTTON_PRESSED_SRC = "images/pupu/buttons/button_pressed.png";
const BODY_NORMAL_SRC = "images/pupu/body/body.png";
const MOUTH_NORMAL_SRC = "images/pupu/mouths/mouth_neutral.png";
const MOUTH_SMILE_SRC = "images/pupu/mouths/mouth_smile.png";
const MOUTH_BLOW_SRC = "images/pupu/mouths/mouth_blow.png";
// Used by the idle chatter mouth cycle (see CHATTER_MOUTH_SEQUENCE).
const MOUTH_OH_SRC = "images/pupu/mouths/mouth_oh.png";
const MOUTH_WIDE_SRC = "images/pupu/mouths/mouth_wide.png";
const MOUTH_LIPS_SRC = "images/pupu/mouths/mouth_lips.png";
const MOUTH_TONGUE_SRC = "images/pupu/mouths/mouth_tongue.png";
const MOUTH_SHOUT_SRC = "images/pupu/mouths/mouth_shout.png";
const MOUTH_CLOSED_SMILE_SRC = "images/pupu/mouths/mouth_closed_smile.png";
const MOUTH_SING_SRC = "images/pupu/mouths/mouth_sing.png";
const MOUTH_SAD_SRC = "images/pupu/mouths/mouth_sad.png";

// Maps an animation identifier (behaviour.animation, reaction.animation,
// or an event's id) to the mouth expression that should show while it
// plays. Ported verbatim from script.js's MOUTH_BY_ANIMATION, plus
// "silly-dance" -> "lips" added this pass (see the expressiveness
// proposal) so the love/silly-dance reaction shows an affectionate
// mouth instead of falling back to "normal".
const MOUTH_BY_ANIMATION = {
  bounce: "smile",
  excited: "smile",
  laugh: "smile",
  sneeze: "blow",
  blow: "blow",
  yawn: "wide",
  surprised: "oh",
  "wake-up": "oh",
  "silly-dance": "lips"
};

// Sets the mouth artwork for a given expression; anything
// unrecognised falls back to "normal". Restored from script.js's
// setMouth(), extended this pass with lips/tongue/shout/closedSmile/
// sing/sad for the new expressiveness pairings.
function setMouth(expression) {
  if (expression === "smile") {
    mouth.src = MOUTH_SMILE_SRC;
  } else if (expression === "blow") {
    mouth.src = MOUTH_BLOW_SRC;
  } else if (expression === "oh") {
    mouth.src = MOUTH_OH_SRC;
  } else if (expression === "wide") {
    mouth.src = MOUTH_WIDE_SRC;
  } else if (expression === "lips") {
    mouth.src = MOUTH_LIPS_SRC;
  } else if (expression === "tongue") {
    mouth.src = MOUTH_TONGUE_SRC;
  } else if (expression === "shout") {
    mouth.src = MOUTH_SHOUT_SRC;
  } else if (expression === "closedSmile") {
    mouth.src = MOUTH_CLOSED_SMILE_SRC;
  } else if (expression === "sing") {
    mouth.src = MOUTH_SING_SRC;
  } else if (expression === "sad") {
    mouth.src = MOUTH_SAD_SRC;
  } else {
    mouth.src = MOUTH_NORMAL_SRC;
  }
}

// Maps the same animation identifiers to an eyes expression, mirroring
// MOUTH_BY_ANIMATION exactly -- only the four "obvious" pairings from
// the expressiveness proposal are included (surprise/curious/sleepy);
// anything else keeps the plain open eyes it always had.
const EYES_BY_ANIMATION = {
  "wake-up": "circles",
  surprised: "circles",
  "look-around": "dots",
  sleepy: "slits"
};

// Tracks the current *base* eyes expression (i.e. what the eyes should
// show when not mid-blink), so blink()/gestureBlink() can restore the
// correct expression afterward instead of always hardcoding back to
// plain open eyes -- needed now that eyes can be something other than
// open/closed. Updated only by setEyes(); the closeEyes event path
// (playEvent()) deliberately bypasses setEyes()/this variable, same as
// before this pass -- see the comment there.
let currentEyesSrc = EYES_OPEN_SRC;

// Sets the eyes artwork for a given expression; anything unrecognised
// falls back to "normal" (plain open eyes). Mirrors setMouth() above.
function setEyes(expression) {
  if (expression === "smiling") {
    currentEyesSrc = EYES_SMILING_SRC;
  } else if (expression === "dots") {
    currentEyesSrc = EYES_DOTS_SRC;
  } else if (expression === "slits") {
    currentEyesSrc = EYES_SLITS_SRC;
  } else if (expression === "circles") {
    currentEyesSrc = EYES_CIRCLES_SRC;
  } else if (expression === "pupu") {
    currentEyesSrc = EYES_PUPU_SRC;
  } else {
    currentEyesSrc = EYES_OPEN_SRC;
  }
  eyes.src = currentEyesSrc;
}

// ---------- Visual-effects layer system ----------
// A generic, reusable stack of overlay layers -- see index.html's
// #pupu-hat/#pupu-item/#pupu-effect (each a plain <img class="pupu-layer">,
// hidden by default via style.css's .pupu-layer { display: none }) and
// the images/pupu/<folder>/ asset library. This intentionally does NOT
// touch the existing body/eyes/mouth system above (still its own
// direct .src assignments) -- those already work, so they're left
// alone; this registry exists so *new* layers/assets never need new
// one-off code, only a new entry here (or, for a single asset within
// an existing category, no code at all -- just the file on disk).
//
// Nothing calls setLayer()/showLayerTemporarily() yet. This step only
// builds the reusable plumbing; deciding *when* a hat, item, or effect
// should actually appear is future work (see the folder-per-category
// asset library under images/pupu/).
const LAYERS = {
  hat: { el: hatEl, folder: "hats" },
  item: { el: itemEl, folder: "items" },
  effect: { el: effectEl, folder: "effects" },
};

// One pending auto-hide timer per layer, keyed by layer name, so
// re-triggering the same layer (or explicitly clearing it) can cancel
// any timer already running for it without touching the other layers.
const layerHideTimeouts = {};

// Shows `assetName` (its filename without the .png extension) on the
// given layer immediately, replacing whatever that layer was
// showing -- stays visible until clearLayer() or
// showLayerTemporarily() is called again for that same layer. Layers
// are independent of each other, so e.g. a hat and an item can both
// be visible at once without affecting one another.
function setLayer(layer, assetName) {
  const { el, folder } = LAYERS[layer];
  if (layerHideTimeouts[layer]) {
    clearTimeout(layerHideTimeouts[layer]);
    layerHideTimeouts[layer] = null;
  }
  el.classList.remove("pupu-layer-fading"); // cancel any in-progress fade (see fadeOutLayer()) if this layer is reused before it finished
  el.src = `images/pupu/${folder}/${assetName}.png`;
  el.classList.add("pupu-layer-visible");
}

// Hides the given layer and cancels any pending auto-hide timer for
// it. Clearing `src` (rather than just hiding) avoids briefly showing
// a stale image the next time this layer is shown before its new
// `src` finishes loading.
function clearLayer(layer) {
  const { el } = LAYERS[layer];
  if (layerHideTimeouts[layer]) {
    clearTimeout(layerHideTimeouts[layer]);
    layerHideTimeouts[layer] = null;
  }
  el.classList.remove("pupu-layer-visible");
  el.classList.remove("pupu-layer-fading");
  el.removeAttribute("src");
}

// Shows `assetName` on the given layer, then automatically hides it
// again after `durationMs` -- for transient overlays like the comic-
// style effects (fart/shock/exclamation/love/question/dazed) rather
// than persistent ones like hats/items. Safe to call again on the
// same layer before it's finished: setLayer() above already cancels
// any previous pending hide, so back-to-back calls always restart
// cleanly instead of the earlier timer hiding the newer image early.
// Optional `fadeMs`: instead of vanishing instantly once `durationMs`
// elapses, the layer fades out over `fadeMs` first (see fadeOutLayer()
// below) before actually being hidden/reset. Omitted (undefined) for
// every existing caller except the fart effect, so every other
// hat/item/effect keeps its exact current instant-hide behaviour.
function showLayerTemporarily(layer, assetName, durationMs, fadeMs) {
  setLayer(layer, assetName);
  layerHideTimeouts[layer] = setTimeout(() => {
    if (fadeMs) {
      fadeOutLayer(layer, fadeMs);
    } else {
      clearLayer(layer);
    }
  }, durationMs);
}

// Fades a layer's opacity to 0 over `fadeMs` (via the .pupu-layer-fading
// CSS transition), then fully hides/resets it once the fade finishes --
// a slower alternative to clearLayer()'s instant hide. Only reached via
// showLayerTemporarily()'s optional fadeMs above.
function fadeOutLayer(layer, fadeMs) {
  const { el } = LAYERS[layer];
  void el.offsetWidth; // force reflow so the fade restarts cleanly on repeat triggers
  el.classList.add("pupu-layer-fading");
  layerHideTimeouts[layer] = setTimeout(() => {
    clearLayer(layer);
  }, fadeMs);
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
  { id: "excited", message: "I have an idea!", animation: "excited", duration: 1400, item: "item_shades", itemDuration: 4000, chance: 0.15 },
  { id: "sleepy", message: "Oops... I nearly fell asleep.", animation: "sleepy", duration: 1600, sound: "sleeping" },
  { id: "laugh", message: "Hehehe!", animation: "laugh", duration: 1200 }
];

// ---------- Between-bubble reactions ----------
// A separate, smaller pool from BEHAVIOURS above -- played by
// playBubbleReaction() (defined further below, near
// advanceBubbleSequence()) each time the child advances from box 1 to
// box 2, so PUPU feels like it's reacting to the interaction instead
// of just standing there. Kept as its own array/system rather than
// merged into BEHAVIOURS so the existing, already-tuned belly-press
// sequence stays untouched. Reuses "bounce" and "sleepy" (existing
// animations above) and "soft-wobble" (existing idle-gesture
// animation) alongside 8 new short flourishes.
const BUBBLE_REACTIONS = [
  { id: "spin", animation: "spin", duration: 700 },
  { id: "puff", animation: "puff", duration: 900, sound: "fart", effect: "effect_fart", effectDuration: 1500, effectFadeMs: 1800, chance: 0.25 },
  { id: "lookAround", animation: "look-around", duration: 800, effect: "effect_question", effectDuration: 1500 },
  { id: "yawn", animation: "yawn", duration: 1300, sound: "breathIn" },
  { id: "surprised", animation: "surprised", duration: 550, effect: "effect_exclamation", effectDuration: 1200 },
  { id: "sillyDance", animation: "silly-dance", duration: 1400, sound: "celebration", effect: "effect_love", effectDuration: 1800 },
  { id: "wakeUp", animation: "wake-up", duration: 700, effect: "effect_shock", effectDuration: 1300 },
  { id: "exaggeratedFloat", animation: "exaggerated-float", duration: 1200 },
  { id: "bounce", animation: "bounce", duration: 600 },
  { id: "wobble", animation: "soft-wobble", duration: 500, sound: "wobble" },
  { id: "sleepy", animation: "sleepy", duration: 1400, sound: "sleeping" }
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
  { id: "distracted", message: "Oh...", bodyClass: "pupu-distracted", closeEyes: false, duration: 700, effect: "effect_dazed", effectDuration: 1300 },
  { id: "sleep", message: "Zzz...", bodyClass: null, closeEyes: true, duration: 1000, sound: "sleeping" }
];

// Restored from brain.js's EVENT_CHANCE: chance a special event happens
// before thinking, rolled once per belly press.
const EVENT_CHANCE = 0.2;

const FINISH_DURATION_MS = 350; // must match the CSS finish animation length
const HOLD_MESSAGE_MS = 900; // how long the finished message stays before idle

// ---------- Broken belly button (hidden easter egg) ----------
// Restored verbatim from script.js (values unchanged): after a normal
// successful belly press, there's a small chance the belly button
// "jams" for the next two presses (no reaction, just a dull sound),
// then pays off on the third press with an exaggerated inflate/
// deflate and a soft finishing wobble. Progressive chance: starts low,
// climbs by a fixed step after every successful normal press that
// doesn't trigger it (capped), and resets back to the start value the
// instant the broken state actually begins. See brokenButtonChance /
// maybeStartBrokenButton() further below.
const BROKEN_BUTTON_CHANCE_START = 0.02; // 2% to begin with, and what it resets to once broken state starts
const BROKEN_BUTTON_CHANCE_STEP = 0.02; // +2 percentage points per successful normal press that doesn't trigger it
const BROKEN_BUTTON_CHANCE_MAX = 0.15; // hard cap at 15%
// NOTE: script.js (the original) sets this to 2, but combined with the
// decrement-before-check in handleBrokenButtonPress() below, that only
// ever produces ONE dud press before the payoff (not two), despite its
// own comment above describing "the next two presses" jamming. Set to
// 3 here so the actual behaviour matches that documented intent: two
// dud presses, then the payoff on the third.
const BROKEN_BUTTON_DUD_PRESSES = 3; // how many "no reaction" presses happen before the payoff

// "Jammed" dud-press feel: the button presses in instantly, stays
// fully pressed for a short hold, then eases back up slowly. The
// easing itself is done in CSS (see .pupu-button-jammed in
// style.css) -- these two constants only control the JS-side timing
// of when to add/remove that class.
const BROKEN_BUTTON_JAM_HOLD_MS = 250; // how long the button stays fully pressed before releasing
const BROKEN_BUTTON_JAM_RELEASE_MS = 600; // must match the CSS transition duration on .pupu-button

const BROKEN_BUTTON_PAYOFF_PAUSE_MS = 150; // comedic beat of silence before the payoff sound/animation starts

const BROKEN_BUTTON_INFLATE_MS = 200; // rapid inflate phase
const BROKEN_BUTTON_HOLD_MS = 350; // hold at peak size
const BROKEN_BUTTON_DEFLATE_MS = 350; // deflate back to normal
// Total payoff duration -- must match the CSS .pupu-broken-payoff
// animation length (0.9s), and its keyframe stops (22.2% / 61.1%) are
// sized to the three phases above. Keep all four in sync if changed.
const BROKEN_BUTTON_PAYOFF_DURATION_MS =
  BROKEN_BUTTON_INFLATE_MS + BROKEN_BUTTON_HOLD_MS + BROKEN_BUTTON_DEFLATE_MS;
const BROKEN_BUTTON_WOBBLE_MS = 500; // must match the CSS .pupu-soft-wobble animation length

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
  BUBBLE_REACTIONS.forEach((reaction) => {
    pupuCircle.classList.remove(`pupu-${reaction.animation}`);
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
    eyes.src = currentEyesSrc; // restore whichever expression was active, not always plain open
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
  "sounds/squish/sqush344.wav",
];

function playSquish() {
  playRandomSound(SQUISH_SOUND_FILES, "squish");
}

// ---------- Idle sounds/chatter sound categories ----------
// Full variation lists for every category in the expanded sound
// library (see sounds/ -- same 22 categories sound-manager.js already
// names at the repo root, just with far more variations per category
// than that file's older, smaller list). Two known files are
// deliberately left out of their category's array below rather than
// deleted from disk, so a future pass can still use them:
// - typing/typing1.wav..typing4.wav are ~20s each (every other typing
//   file is ~1s) -- clearly a different use case, not a per-character
//   tick. Only the ~1s variations are listed in TYPING_SOUND_FILES.
// - masticating/masticating.mp3 is ~14s vs. its sibling's 8s; only the
//   shorter .wav is listed in EATING_SOUND_FILES.
// button/button_broken.wav has no home here either (a root-app-only
// "broken belly button" Easter egg this MVP never built) and isn't
// listed anywhere.
const BUBBLES_SOUND_FILES = [
  "sounds/bubbles/bubble2222222.wav",
  "sounds/bubbles/bubbles00000.wav",
  "sounds/bubbles/bubbles1.wav",
  "sounds/bubbles/bubbles2.wav",
  "sounds/bubbles/bubbles223.wav",
  "sounds/bubbles/bubbles2848.wav",
  "sounds/bubbles/bubbles3.wav",
  "sounds/bubbles/bubbles332.wav",
  "sounds/bubbles/bubbles332323345.wav",
  "sounds/bubbles/bubbles333221.wav",
  "sounds/bubbles/bubbles3333334.wav",
  "sounds/bubbles/bubbles34567893.wav",
  "sounds/bubbles/bubbles666767.wav",
  "sounds/bubbles/bubbles82837373.wav",
  "sounds/bubbles/bubbles8888989898.wav",
  "sounds/bubbles/bubbles928347.wav",
  "sounds/bubbles/bubbles9876.wav",
  "sounds/bubbles/bubbles99827222.wav",
  "sounds/bubbles/bubbles99873.wav",
  "sounds/bubbles/bubbles998888.wav",
  "sounds/bubbles/bubbles9988888.wav",
];
const WOBBLE_SOUND_FILES = [
  "sounds/wobble/wobble1.wav",
  "sounds/wobble/wobble2222222222223.wav",
  "sounds/wobble/wobble2332233445.wav",
  "sounds/wobble/wobble384857.wav",
  "sounds/wobble/wobble38934857.wav",
  "sounds/wobble/wobble393847.mp3",
];
const PUPU_SOUND_FILES = [
  "sounds/pupu/pupu.wav",
  "sounds/pupu/pupu1.wav",
  "sounds/pupu/pupu2.wav",
  "sounds/pupu/pupu3455.wav",
  "sounds/pupu/pupu383737.wav",
  "sounds/pupu/pupu38374.wav",
  "sounds/pupu/pupu38474.wav",
  "sounds/pupu/pupu38475.wav",
  "sounds/pupu/pupu485475.wav",
  "sounds/pupu/pupu524243536.wav",
  "sounds/pupu/pupu74465.wav",
  "sounds/pupu/pupu8.wav",
  "sounds/pupu/pupu83884.wav",
  "sounds/pupu/pupu8882.wav",
  "sounds/pupu/pupu89929.wav",
];
const DROPLET_SOUND_FILES = ["sounds/droplet/droplet1.wav"];
const CHATTER_SOUND_FILES = [
  "sounds/chatter/chatter1.wav",
  "sounds/chatter/chatter2.wav",
  "sounds/chatter/chatter3.wav",
  "sounds/chatter/chatter3333.wav",
  "sounds/chatter/chatter4.wav",
  "sounds/chatter/chatter5.wav",
  "sounds/chatter/chatter6.wav",
  "sounds/chatter/chatter7.wav",
  "sounds/chatter/chatter88383.wav",
  "sounds/chatter/chatter89828.wav",
  "sounds/chatter/chatterx.wav",
  "sounds/chatter/chatterxx.wav",
];
const IDLE_VOCAL_SOUND_FILES = [
  "sounds/idle/idle004.wav",
  "sounds/idle/idle1.wav",
  "sounds/idle/idle2.wav",
  "sounds/idle/idle22333.wav",
  "sounds/idle/idle29283.wav",
  "sounds/idle/idle2974.wav",
  "sounds/idle/idle3332.wav",
  "sounds/idle/idle33444.wav",
  "sounds/idle/idle345678.wav",
  "sounds/idle/idle45554.wav",
  "sounds/idle/idle8272625.wav",
  "sounds/idle/idle92826354.wav",
  "sounds/idle/idle928383.wav",
  "sounds/idle/idle9838383.wav",
  "sounds/idle/idle98784.wav",
  "sounds/idle/idle992826.wav",
  "sounds/idle/idle9982.wav",
];
const WET_SOUND_FILES = [
  "sounds/wet/wet1.mp3",
  "sounds/wet/wet49483.wav",
  "sounds/wet/wet882.wav",
  "sounds/wet/wet88883.wav",
  "sounds/wet/wet9909.wav",
  "sounds/wet/wet9999.wav",
];
const BREATH_IN_SOUND_FILES = ["sounds/breath_in/breath_in.wav"];
const CRACKLE_SOUND_FILES = [
  "sounds/crackle/crackle.wav",
  "sounds/crackle/crackle1.wav",
  "sounds/crackle/crackle3333.wav",
  "sounds/crackle/crackle394854.wav",
];
const JOY_SOUND_FILES = [
  "sounds/joy/joy1.wav",
  "sounds/joy/joy8283844.wav",
  "sounds/joy/joy837374.wav",
  "sounds/joy/joy8882.wav",
];
const SAD_SOUND_FILES = [
  "sounds/sad/sad1.wav",
  "sounds/sad/sad2.wav",
  "sounds/sad/sad29292929.wav",
  "sounds/sad/sad384847.wav",
  "sounds/sad/sad48463.wav",
];
// "Surprise character event" categories -- deliberately kept much
// rarer than the ambient categories above, see IDLE_SOUND_CHANCES.
const FART_SOUND_FILES = [
  "sounds/fart/fart1.wav",
  "sounds/fart/fart2.wav",
  "sounds/fart/fart3.wav",
  "sounds/fart/fart34884.wav",
  "sounds/fart/fart37374.wav",
  "sounds/fart/fart38475.wav",
  "sounds/fart/fart3994.wav",
  "sounds/fart/fart834754.wav",
  "sounds/fart/fart83873.wav",
  "sounds/fart/fart9484745.wav",
  "sounds/fart/fart958573.wav",
];
const BURP_SOUND_FILES = [
  "sounds/burp/burp1.wav",
  "sounds/burp/burp2.wav",
  "sounds/burp/burp2938.wav",
  "sounds/burp/burp3.wav",
  "sounds/burp/burp4.wav",
  "sounds/burp/burpx.wav",
  "sounds/burp/burpxx.wav",
  "sounds/burp/burpxxx.wav",
  "sounds/burp/burpxxxxxxx.wav",
];
// eating + masticating share one pool -- same "chewing" character,
// and masticating only contributes one usable (non-20s) file anyway.
const EATING_SOUND_FILES = [
  "sounds/eating/eating1.wav",
  "sounds/eating/eating2.wav",
  "sounds/eating/eating3.wav",
  "sounds/eating/eating4.wav",
  "sounds/eating/eating5.wav",
  "sounds/eating/eating6.wav",
  "sounds/masticating/masticating83882.wav",
];
const CELEBRATION_SOUND_FILES = [
  "sounds/celebration/celebration1.wav",
  "sounds/celebration/celebration2.wav",
  "sounds/celebration/celebration3.wav",
];
const FLIP_SOUND_FILES = ["sounds/flip/flip1.wav", "sounds/flip/flip2.wav"];
const SPLASH_SOUND_FILES = ["sounds/splash/splash1.wav", "sounds/splash/splash2.wav"];

// Interaction-sound categories (see playBubbleTapSound()/typing tick
// further below). BUBBLE_TAP_SOUND_FILES is deliberately limited to
// these 6 button/*.wav files only -- key_tap was tried here initially
// but sounded wrong for a button press, so it was removed.
// button_broken.wav is deliberately NOT in this pool -- it's reserved
// exclusively for the broken-button easter egg (see
// BUTTON_BROKEN_SOUND_FILES / playBrokenButtonDud() further below).
const BUBBLE_TAP_SOUND_FILES = [
  "sounds/button/button82882.wav",
  "sounds/button/button82883.wav",
  "sounds/button/button233.wav",
  "sounds/button/button2223.wav",
  "sounds/button/button2344.wav",
  "sounds/button/button29484.wav",
];
const BUTTON_BROKEN_SOUND_FILES = ["sounds/button/button_broken.wav"];
const TYPING_SOUND_FILES = [
  "sounds/typing/typing.wav",
  "sounds/typing/typing38347.wav",
  "sounds/typing/typing385.wav",
  "sounds/typing/typing39938282.wav",
  "sounds/typing/typing82828282.wav",
  "sounds/typing/typing8373.wav",
  "sounds/typing/typing8838.wav",
  "sounds/typing/typing9837.wav",
];
const SLEEPING_SOUND_FILES = [
  "sounds/sleeping/sleeping1.wav",
  "sounds/sleeping/sleeping2.wav",
  "sounds/sleeping/sleeping3.wav",
  "sounds/sleeping/sleeping3322.wav",
  "sounds/sleeping/sleeping88282.wav",
  "sounds/sleeping/sleeping887.wav",
  "sounds/sleeping/sleeping88828.wav",
  "sounds/sleeping/sleeping909.wav",
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

function playIdleVocal() {
  playRandomSound(IDLE_VOCAL_SOUND_FILES, "idle");
}

function playWet() {
  playRandomSound(WET_SOUND_FILES, "wet");
}

function playBreathIn() {
  playRandomSound(BREATH_IN_SOUND_FILES, "breath_in");
}

function playCrackle() {
  playRandomSound(CRACKLE_SOUND_FILES, "crackle");
}

function playJoy() {
  playRandomSound(JOY_SOUND_FILES, "joy");
}

function playSad() {
  playRandomSound(SAD_SOUND_FILES, "sad");
}

// How long the joy/sad idle-vocal expressions below hold before
// reverting to normal.
const IDLE_VOCAL_EXPRESSION_MS = 900;

// Pairs the existing playJoy()/playSad() ambient idle vocals (see
// IDLE_SOUND_CHANCES below) with a matching face -- previously these
// sounds played with no expression at all. Reuses idleGestureActive as
// its guard/lock: setting it true here means the playIdleGesture()
// call right after chance.action() in runIdleSoundCheck() sees it's
// already busy and cleanly skips itself, so this never collides with an
// unrelated random gesture. Skipped (sound plays, face doesn't) if
// PUPU is busy, chattering, or already mid-gesture, same guard every
// other idle flourish uses.
function playJoyWithExpression() {
  playJoy();
  if (isBusy || chatterInProgress || idleGestureActive) return;

  idleGestureActive = true;
  setMouth("sing");
  setEyes("smiling");
  setTimeout(() => {
    setMouth("normal");
    setEyes("normal");
    idleGestureActive = false;
  }, IDLE_VOCAL_EXPRESSION_MS);
}

function playSadWithExpression() {
  playSad();
  if (isBusy || chatterInProgress || idleGestureActive) return;

  idleGestureActive = true;
  setMouth("sad");
  setTimeout(() => {
    setMouth("normal");
    idleGestureActive = false;
  }, IDLE_VOCAL_EXPRESSION_MS);
}

function playFart() {
  playRandomSound(FART_SOUND_FILES, "fart");
}

function playBurp() {
  playRandomSound(BURP_SOUND_FILES, "burp");
}

function playEating() {
  playRandomSound(EATING_SOUND_FILES, "eating");
}

function playCelebration() {
  playRandomSound(CELEBRATION_SOUND_FILES, "celebration");
}

function playFlip() {
  playRandomSound(FLIP_SOUND_FILES, "flip");
}

function playSplash() {
  playRandomSound(SPLASH_SOUND_FILES, "splash");
}

function playBubbleTapSound() {
  playRandomSound(BUBBLE_TAP_SOUND_FILES, "bubble-tap");
}

function playButtonBroken() {
  playRandomSound(BUTTON_BROKEN_SOUND_FILES, "button-broken");
}

function playSleeping() {
  playRandomSound(SLEEPING_SOUND_FILES, "sleeping");
}

// Looked up by category name from BEHAVIOURS/EVENTS/BUBBLE_REACTIONS
// entries' optional `.sound` field (see playBehaviourExtras() below) --
// one shared table instead of a switch/if-chain at each of the three
// trigger sites.
const SOUND_CATEGORY_PLAYERS = {
  sleeping: playSleeping,
  wobble: playWobble,
  breathIn: playBreathIn,
  celebration: playCelebration,
  fart: playFart,
};

// Plays whichever sound/effect/item are attached to a
// BEHAVIOURS/EVENTS/BUBBLE_REACTIONS entry via its optional `.sound`/
// `.effect`/`.item` fields -- a no-op for any field that isn't
// present, which is most entries on purpose (not every animation
// needs paired extras; see the "Do not invent an animation purely
// because an image exists" rule these fields were added under).
//
// `.chance` (0-1, omitted = always) gates the WHOLE bundle as a
// single roll, so a combo like puff's fart pairing either happens
// completely (sound + effect together) or not at all -- never just
// half of it from two independent rolls landing differently.
//
// `.effect`/`.item` are exact asset basenames (e.g. "effect_love",
// "item_shades") passed straight to showLayerTemporarily(), which
// already handles cancelling/restarting its own timer cleanly on
// repeat triggers -- nothing extra needed here for that.
function playBehaviourExtras(item) {
  if (item.chance !== undefined && Math.random() >= item.chance) return;

  const soundPlayer = item.sound && SOUND_CATEGORY_PLAYERS[item.sound];
  if (soundPlayer) soundPlayer();

  if (item.effect) showLayerTemporarily("effect", item.effect, item.effectDuration || 1500, item.effectFadeMs);
  if (item.item) showLayerTemporarily("item", item.item, item.itemDuration || 4000);
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

// Cumulative probability thresholds (roll is a random 0-1 value). Only
// one category (or nothing) ever plays per check, and checks are
// naturally spaced IDLE_SOUND_CHECK_MIN/MAX_MS apart -- that's what
// keeps ambient sounds from ever overlapping each other. The last 7
// entries (fart..splash) are the "surprise character event" sounds --
// kept substantially rarer (1-1.5% each) than the regular ambient
// categories (2-10% each) so they read as an occasional surprise, not
// background noise.
const IDLE_SOUND_CHANCES = [
  { upTo: 0.50, action: null },
  { upTo: 0.61, action: () => playBubbles() },
  { upTo: 0.68, action: () => playIdleVocal() },
  { upTo: 0.74, action: () => playWobble() },
  { upTo: 0.79, action: () => playPupuSound() },
  { upTo: 0.83, action: () => playWet() },
  { upTo: 0.86, action: () => playBreathIn() },
  { upTo: 0.89, action: () => playCrackle() },
  { upTo: 0.91, action: () => playDroplet() },
  { upTo: 0.925, action: () => playJoyWithExpression() },
  { upTo: 0.935, action: () => playSadWithExpression() },
  { upTo: 0.945, action: () => playFart() },
  { upTo: 0.955, action: () => playBurp() },
  { upTo: 0.965, action: () => playEating() },
  { upTo: 0.975, action: () => playCelebration() },
  { upTo: 0.985, action: () => playFlip() },
  { upTo: 1.00, action: () => playSplash() }
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
const IDLE_GESTURE_CONTENT_SMILE_MS = 400; // brief content-smile duration, same length as the smile flash above
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
    eyes.src = currentEyesSrc; // restore whichever expression was active, not always plain open
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

// Softer, quieter cousin of gestureSmile() above -- a brief content/
// pleased look (mouth_closed_smile, one of the previously-unused
// assets) rather than the bigger open smile. Same shape as
// gestureSmile(), just a different expression and asset.
function gestureContentSmile() {
  setMouth("closedSmile");
  setTimeout(() => {
    setMouth("normal");
    idleGestureActive = false;
  }, IDLE_GESTURE_CONTENT_SMILE_MS);
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
// already used by IDLE_SOUND_CHANCES above. gestureContentSmile was
// added this pass by carving a slice out of the existing weights
// (wobble 40->35, blink 30->25, smile unchanged at 20, +15 new) rather
// than changing the overall IDLE_GESTURE_SKIP_CHANCE above -- so the
// total rate of "something happens" during an idle check is unchanged,
// only the mix of what that something can be.
const IDLE_GESTURES = [
  { upTo: 0.35, gesture: gestureWobble },
  { upTo: 0.60, gesture: gestureBlink },
  { upTo: 0.80, gesture: gestureSmile },
  { upTo: 0.95, gesture: gestureContentSmile },
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
  } else {
    setEyes(EYES_BY_ANIMATION[event.id]);
  }
  setMouth(MOUTH_BY_ANIMATION[event.id]);
  playBehaviourExtras(event);

  bubbleEl.innerHTML = "";
  appendBubbleLine(event.message);
  replayAnimation(bubbleEl, "pupu-inflate", 500);

  await wait(event.duration);

  clearBehaviourAnimations();
  if (event.closeEyes) {
    eyes.src = EYES_OPEN_SRC;
  } else {
    setEyes("normal");
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

// ---------- Language / translation system ----------
// Static, reviewed translations only (see translations.json) -- no
// external translation API. A missing/failed load just leaves
// state.translations empty, which getSectionLines() below already
// treats as "no translation available" and falls back to English, so
// this can never break card rendering.
async function loadTranslations() {
  try {
    const response = await fetch("translations.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.translations = await response.json();
  } catch (error) {
    console.error("PUPU MVP: failed to load translations.json", error);
  }
}

// True if a mission's own wording references one of the card's topics
// (e.g. topicTag "Animals" matching mission text ".. animal fact .."),
// so a category pool that mixes topic-specific and generic missions
// (like "strange": animal/body-specific missions alongside a fully
// generic one) can be steered toward the ones that actually relate to
// this card instead of a flat coin flip across the whole pool.
function missionMatchesTopics(mission, topicTags) {
  const text = mission.text.toLowerCase();
  return topicTags.some((tag) =>
    tag
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 3 && text.includes(word.replace(/s$/, "")))
  );
}

// Picks a mission from the given conversationType's pool, preferring
// ones that relate to the card's own topicTags when any exist in the
// pool -- otherwise falls back to a plain random pick across the whole
// pool (the original behaviour), same as when the category doesn't
// exist or is empty, so an unmapped or sparsely populated category can
// never leave a card without a mission.
function pickMission(conversationType, topicTags) {
  const pool = state.missions[conversationType];
  if (pool && pool.length > 0) {
    const topicMatches = pool.filter((mission) => missionMatchesTopics(mission, topicTags));
    return pickRandomFrom(topicMatches.length > 0 ? topicMatches : pool);
  }
  return pickRandomFrom(Object.values(state.missions).flat());
}

// ---------- Content-type weighting for pickCard() ----------
// Weighted by type (not by raw card count) so the mix stays correct
// regardless of how many cards exist per type -- previously pickCard()
// picked uniformly across the whole array, which meant the type with
// the most cards (fact, 100 of 120) dominated by sheer volume. Percent
// values are relative to each other, not required to sum to 100.
// "question" cards share "story"'s slice since both are situational
// prompts; any type missing from this table (or with an empty pool
// right now) falls back to "fact"'s slice below.
const CARD_TYPE_WEIGHTS = {
  wyr: 30,
  joke: 20,
  riddle: 15,
  story: 15,
  challenge: 5,
  mystery: 5,
  fact: 7,
  moment: 3,
};
const CARD_TYPE_WEIGHT_ALIASES = { question: "story" };

function cardWeightType(card) {
  const type = card.type || "fact";
  return CARD_TYPE_WEIGHT_ALIASES[type] || type;
}

function pickWeightedCardType() {
  const totalWeight = Object.values(CARD_TYPE_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  for (const [type, weight] of Object.entries(CARD_TYPE_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "fact";
}

function pickCard() {
  const chosenType = pickWeightedCardType();
  const typePool = state.cards.filter((card) => cardWeightType(card) === chosenType);
  const pool = typePool.length > 0 ? typePool : state.cards;

  const notRecentlyShown = pool.filter((card) => !state.recent.includes(card.sourceId));
  const finalPool = notRecentlyShown.length > 0 ? notRecentlyShown : pool;
  const card = finalPool[Math.floor(Math.random() * finalPool.length)];

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

// ---------- Speech bubble typewriter + click-to-advance ----------
// Each section's text types character by character (instead of
// appearing all at once), and the whole reveal is one small state
// machine (bubbleSequence) instead of several independent timers -- so
// a tap on the bubble always has exactly one thing to cancel-and-
// replace: whichever single timer is currently running, be that
// "typing the next character" or "waiting before the next section."
// SECTION_FADE_DURATION_MS must match the animation-duration on
// .bubble-section in style.css (kept in sync manually; see the
// comment there).
const SECTION_REVEAL_DELAY_MS = 10000;
const SECTION_FADE_DURATION_MS = 1800;
const TYPE_CHAR_DELAY_MS = 28; // per-character typing speed (25-35ms range)

// null until the first card is shown. Otherwise: { sections,
// stageIndex, phase, timerId, lineEls, lineIndex, charIndex }.
// phase is "typing" (a section's text is still being typed), "waiting"
// (a section finished typing and the next one is scheduled to appear
// automatically), or "done" (the last section finished -- tapping the
// bubble here is a no-op; only PUPU's belly starts a new card).
let bubbleSequence = null;

function stopBubbleSequenceTimer() {
  if (bubbleSequence && bubbleSequence.timerId !== null) {
    clearTimeout(bubbleSequence.timerId);
    bubbleSequence.timerId = null;
  }
}

// Very quiet, occasional typing tick -- uses the dedicated "typing"
// category (short ~1s variations only; see TYPING_SOUND_FILES) at a
// much lower volume than that category's other uses, and only every
// few characters rather than every character, so it reads as a soft
// typing texture instead of a loud per-keystroke click.
// Fire-and-forget: a blocked/failed play() (e.g.
// autoplay restrictions before any user gesture has happened yet)
// only logs a warning via playRandomSound()'s existing rejection
// handling -- it never touches the typing timer chain, so the
// typewriter effect itself is entirely unaffected either way.
const TYPE_SOUND_VOLUME = 0.16;
const TYPE_SOUND_MIN_CHARS = 3;
const TYPE_SOUND_MAX_CHARS = 5;
let charsUntilNextTypeSound = 0;

function resetTypeSoundCounter() {
  charsUntilNextTypeSound =
    TYPE_SOUND_MIN_CHARS + Math.floor(Math.random() * (TYPE_SOUND_MAX_CHARS - TYPE_SOUND_MIN_CHARS + 1));
}

function maybePlayTypeTick() {
  charsUntilNextTypeSound--;
  if (charsUntilNextTypeSound > 0) return;
  resetTypeSoundCounter();

  const file = TYPING_SOUND_FILES[Math.floor(Math.random() * TYPING_SOUND_FILES.length)];
  const audio = new Audio(file);
  audio.volume = TYPE_SOUND_VOLUME;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Autoplay/user-activation restrictions or a missing asset --
      // silently skip. The typewriter timing itself never depends on
      // this resolving.
    });
  }
}

// Creates one section's DOM immediately -- label plus one empty <p>
// per line, so the existing .bubble-section CSS fade/slide-in
// animation still plays on insertion exactly as before -- then starts
// typing its lines in order.
function startTypingSection(section) {
  bubbleEl.classList.remove("bubble-waiting");

  const el = document.createElement("div");
  el.className = `bubble-section bubble-section-${section.modifier}`;

  const labelEl = document.createElement("p");
  labelEl.className = "bubble-label";
  labelEl.textContent = section.label;
  el.appendChild(labelEl);

  const lineEls = section.lines.map((line) => {
    const p = document.createElement("p");
    p.className = "beat";
    el.appendChild(p);
    return { el: p, text: line };
  });

  bubbleEl.appendChild(el);

  bubbleSequence.phase = "typing";
  bubbleSequence.lineEls = lineEls;
  bubbleSequence.lineIndex = 0;
  bubbleSequence.charIndex = 0;
  updateLanguageToggleEnabled(); // inert while typing -- see setLanguage()
  resetTypeSoundCounter();

  typeNextChar();
}

function typeNextChar() {
  const { lineEls } = bubbleSequence;
  if (bubbleSequence.lineIndex >= lineEls.length) {
    finishTypingSection();
    return;
  }

  const current = lineEls[bubbleSequence.lineIndex];
  bubbleSequence.charIndex++;
  current.el.textContent = current.text.slice(0, bubbleSequence.charIndex);
  maybePlayTypeTick();

  if (bubbleSequence.charIndex >= current.text.length) {
    bubbleSequence.lineIndex++;
    bubbleSequence.charIndex = 0;
  }

  bubbleSequence.timerId = setTimeout(typeNextChar, TYPE_CHAR_DELAY_MS);
}

// Instantly fills in whatever text hasn't been typed yet in the
// current section, then proceeds exactly as if typing had finished
// naturally -- used when the user taps to skip ahead mid-type.
function completeCurrentSectionText() {
  bubbleSequence.lineEls.forEach(({ el, text }) => {
    el.textContent = text;
  });
  finishTypingSection();
}

// Types whose second section (the punchline/answer) should stay hidden
// behind an explicit tap instead of auto-revealing after
// SECTION_REVEAL_DELAY_MS -- real classroom testing showed the answer
// appearing on its own before anyone had a chance to guess. Every other
// type keeps the original auto-advance behaviour untouched.
const MANUAL_REVEAL_TYPES = ["riddle", "joke"];

function finishTypingSection() {
  bubbleSequence.timerId = null;

  const isLastSection = bubbleSequence.stageIndex >= bubbleSequence.sections.length - 1;
  if (isLastSection) {
    bubbleSequence.phase = "done";
    updateLanguageToggleEnabled();
    return;
  }

  bubbleSequence.phase = "waiting";
  updateLanguageToggleEnabled();
  bubbleEl.classList.add("bubble-waiting"); // subtle pulse hinting the bubble can be tapped

  if (MANUAL_REVEAL_TYPES.includes(bubbleSequence.cardType)) {
    showRevealHint();
    return; // no auto-advance timer here -- only an explicit tap reveals section 2
  }

  bubbleSequence.timerId = setTimeout(advanceBubbleSequence, SECTION_REVEAL_DELAY_MS);
}

// Placeholder shown in place of the still-hidden second section for
// MANUAL_REVEAL_TYPES -- reuses the exact .bubble-section/.bubble-label
// markup (and its existing fade-in animation) a real section already
// gets, just with no lines yet, so it's visually indistinguishable from
// the box it's standing in for. Removed the moment the real section is
// revealed (see advanceBubbleSequence()).
function showRevealHint() {
  const el = document.createElement("div");
  el.className = "bubble-section bubble-section-mission bubble-reveal-hint";

  const labelEl = document.createElement("p");
  labelEl.className = "bubble-label";
  labelEl.textContent = "💬 TAP TO REVEAL";
  el.appendChild(labelEl);

  bubbleEl.appendChild(el);
  bubbleSequence.revealHintEl = el;
}

// Fire-and-forget: picks a random BUBBLE_REACTIONS entry and plays it
// on PUPU, then cleans itself up after its own duration. Never
// awaited by its caller and never touches `isBusy` itself (only reads
// it, to bail out) -- so it can never delay or block advancing the
// bubble sequence. Skipped entirely while `isBusy` is true so it can
// never interrupt or get interrupted by the belly-press behaviour
// sequence, which owns pupuCircle's animation during that window.
let bubbleReactionTimeoutId = null;

// Card-type-aware weighting for playBubbleReaction() below: each
// type's favoured reaction ids get extra entries in the pool they're
// picked from (rather than a full weighting engine), so PUPU's
// between-bubble reaction leans toward reactions that actually suit
// what's on screen -- a joke gets more bounce/silly-dance, a riddle or
// question gets more curious look-around/spin, a story gets more
// wide-eyed surprised/wake-up -- instead of a flat uniform pick every
// time. "fact" (the original/default type) and any unrecognised type
// intentionally have no entry here, so they keep using the plain
// unweighted pool exactly as before this pass.
const CONTENT_TYPE_FAVOURED_REACTIONS = {
  joke: ["bounce", "sillyDance"],
  riddle: ["lookAround", "spin"],
  question: ["lookAround", "spin"],
  story: ["surprised", "wakeUp"]
};
const FAVOURED_REACTION_EXTRA_WEIGHT = 2; // how many extra times a favoured reaction appears in the weighted pool

function pickBubbleReaction(cardType) {
  const favouredIds = CONTENT_TYPE_FAVOURED_REACTIONS[cardType];
  if (!favouredIds) return pickRandomFrom(BUBBLE_REACTIONS);

  const pool = BUBBLE_REACTIONS.slice();
  BUBBLE_REACTIONS.forEach((reaction) => {
    if (favouredIds.includes(reaction.id)) {
      for (let i = 0; i < FAVOURED_REACTION_EXTRA_WEIGHT; i++) pool.push(reaction);
    }
  });
  return pickRandomFrom(pool);
}

function playBubbleReaction() {
  if (isBusy) return;

  const cardType = bubbleSequence ? bubbleSequence.cardType : undefined;
  const reaction = pickBubbleReaction(cardType);

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so back-to-back reactions always restart cleanly
  pupuCircle.classList.add(`pupu-${reaction.animation}`);
  setMouth(MOUTH_BY_ANIMATION[reaction.animation]);
  setEyes(EYES_BY_ANIMATION[reaction.animation]);
  playBehaviourExtras(reaction);

  if (bubbleReactionTimeoutId !== null) clearTimeout(bubbleReactionTimeoutId);
  bubbleReactionTimeoutId = setTimeout(() => {
    pupuCircle.classList.remove(`pupu-${reaction.animation}`);
    setMouth("normal");
    setEyes("normal");
    bubbleReactionTimeoutId = null;
  }, reaction.duration);
}

function advanceBubbleSequence() {
  bubbleSequence.timerId = null;
  if (bubbleSequence.revealHintEl) {
    bubbleSequence.revealHintEl.remove();
    bubbleSequence.revealHintEl = null;
  }
  bubbleSequence.stageIndex++;
  const section = bubbleSequence.sections[bubbleSequence.stageIndex];
  // Refreshed against currentLanguage (not whatever renderCard() built
  // it with) so a language switch made during the "waiting" phase of
  // the first section carries through to the second one too.
  section.lines = getSectionLines(bubbleSequence.card, bubbleSequence.mission, bubbleSequence.stageIndex, currentLanguage);
  startTypingSection(section);
  playBubbleReaction();
}

// The single entry point for tapping/clicking (or Enter/Space-ing) the
// bubble. Finishes the current section instantly if it's still typing
// (does NOT advance yet); skips the 10s wait and starts the next
// section immediately if the current one already finished; does
// nothing once the whole card is done -- PUPU's belly remains the
// only way to start a new card, so tapping a finished bubble can never
// race a fresh belly press.
function handleBubbleAdvance() {
  if (!bubbleSequence) return;
  if (bubbleSequence.phase === "done") return;

  playBubbleTapSound();
  stopBubbleSequenceTimer();

  if (bubbleSequence.phase === "typing") {
    completeCurrentSectionText();
  } else if (bubbleSequence.phase === "waiting") {
    advanceBubbleSequence();
  }
}

// Per-type box labels for the two-bubble sequence. "fact" is the
// original/default type -- the existing 100 cards have no `type`
// field at all, so they fall back to it below. The other four types
// reuse the exact same two-box mechanic, just with english[0]/
// english[1] as a plain setup/payoff pair instead of a fact+share
// prompt pair (no mission involved).
const CONTENT_TYPE_LABELS = {
  fact: { box1: "💡 DID YOU KNOW?", box2: "🗣️ SHARE IT!" },
  joke: { box1: "😂 JOKE TIME!", box2: "😂 THE PUNCHLINE" },
  riddle: { box1: "🤔 CAN YOU GUESS?", box2: "💡 THE ANSWER" },
  story: { box1: "📖 STORY TIME", box2: "❓ WHAT HAPPENS NEXT?" },
  question: { box1: "💭 YOUR TURN", box2: "🗣️ TELL ME MORE" },
  wyr: { box1: "🤔 WOULD YOU RATHER?", box2: "❓ WHY?" },
  challenge: { box1: "🎯 YOUR CHALLENGE", box2: "🎬 GO!" },
  mystery: { box1: "🕵️ WHAT HAPPENED?", box2: "❓ WHY?" },
  moment: { box1: "👀 PUPU MOMENT", box2: "🤷 THAT'S IT" },
};

// ---------- Language toggle ----------
// Config-driven on purpose: adding Chinese/Spanish/Japanese later means
// adding an entry here plus supplying translations in translations.json
// -- buildLanguageToggle() and getSectionLines() below both just
// iterate/look up by code, no rendering-logic changes needed.
const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ko", label: "한국어", flag: "" }
];

// Resets to "en" at the start of every renderCard() (a new output
// always starts in English); otherwise only changed by the student
// tapping the toggle. Not persisted (no localStorage) -- this app has
// no existing settings mechanism to extend, per the brief.
let currentLanguage = "en";

// Card-type-aware box shapes (label/modifier) -- these never translate,
// only the lines inside them do (see the "what should be translated"
// scope: fact text + Share It prompt, not the box labels).
function getSectionShapes(card) {
  const type = card.type || "fact";
  const labels = CONTENT_TYPE_LABELS[type];
  return [
    { modifier: "fact", label: labels.box1 },
    { modifier: "mission", label: labels.box2 },
  ];
}

// English is always read straight from cards.json/missions.json --
// never duplicated into translations.json -- so it's both the default
// language and the fallback for anything untranslated. Restored
// verbatim from renderCard()'s old inline ternary.
function getEnglishLines(card, mission, sectionIndex) {
  const type = card.type || "fact";
  if (type === "fact") {
    return sectionIndex === 0 ? card.english.slice(0, 2) : [card.sharePrompt || mission.text];
  }
  return [card.english[sectionIndex]];
}

// The single place that decides what text actually renders for a given
// section + language. Falls back to English whenever the requested
// language has no translations at all for this card, or no entry for
// this specific section -- so a missing translation can never show
// blank/broken text. A translations.json entry looks like
// { "ko": { "sections": [ [line0, line1?], [line0] ] } } -- sections[i]
// mirrors getEnglishLines()'s own shape exactly (one line-array per
// section), so this same lookup works unchanged for every content type
// (fact's 2-line fact + 1-line share prompt, or joke/riddle/story/
// question's 1-line + 1-line setup/answer) with no per-type branching.
function getSectionLines(card, mission, sectionIndex, lang) {
  const englishLines = getEnglishLines(card, mission, sectionIndex);
  if (lang === "en") return englishLines;

  const entry = state.translations[card.sourceId] && state.translations[card.sourceId][lang];
  const lines = entry && entry.sections && entry.sections[sectionIndex];
  return Array.isArray(lines) && lines.length > 0 ? lines : englishLines;
}

// Reflects which language is currently active on the toggle buttons
// themselves (bold/filled pill -- see .lang-active in style.css).
function updateLanguageToggleUI() {
  languageToggleEl.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("lang-active", btn.dataset.lang === currentLanguage);
  });
}

// The toggle is inert (dimmed, not clickable) while a section is
// actively typing -- see setLanguage()'s own guard below -- so
// switching language can never race the typewriter effect's own
// character-by-character writes into the same .beat elements.
function updateLanguageToggleEnabled() {
  const disabled = !bubbleSequence || bubbleSequence.phase === "typing";
  languageToggleEl.classList.toggle("language-toggle-disabled", disabled);
}

// Built once at startup from SUPPORTED_LANGUAGES; the buttons
// themselves never need rebuilding per-card, only their active state
// does (see renderCard()/updateLanguageToggleUI()).
function buildLanguageToggle() {
  SUPPORTED_LANGUAGES.forEach((lang, i) => {
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "lang-sep";
      sep.textContent = "|";
      languageToggleEl.appendChild(sep);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-btn";
    btn.dataset.lang = lang.code;
    btn.textContent = lang.flag ? `${lang.flag} ${lang.label}` : lang.label;
    btn.addEventListener("click", (event) => {
      event.stopPropagation(); // the toggle sits outside #bubble, but this keeps it inert to any future ancestor handlers too
      setLanguage(lang.code);
    });
    languageToggleEl.appendChild(btn);
  });
  updateLanguageToggleUI();
  updateLanguageToggleEnabled();
}

// Swaps the currently-displayed section(s) to `lang` in place -- same
// text area, no re-typing, no touch of bubbleSequence's phase/timerId/
// lineIndex/charIndex, so it can never interfere with the typing/
// auto-advance state machine. A no-op while typing (see
// updateLanguageToggleEnabled() above) or before any card has rendered.
function setLanguage(lang) {
  if (lang === currentLanguage) return;
  if (!bubbleSequence || bubbleSequence.phase === "typing") return;

  currentLanguage = lang;

  const sectionEls = bubbleEl.querySelectorAll(".bubble-section");
  sectionEls.forEach((sectionEl, i) => {
    const localizedLines = getSectionLines(bubbleSequence.card, bubbleSequence.mission, i, lang);
    bubbleSequence.sections[i].lines = localizedLines; // keep in sync so a later advance/tap types the right language too
    const lineEls = sectionEl.querySelectorAll(".beat");
    lineEls.forEach((el, j) => {
      el.textContent = localizedLines[j] || "";
    });
  });

  updateLanguageToggleUI();
}

// renderCard() itself stays a plain (non-async) function that returns
// immediately -- callers that don't await it (see handleBellyPress)
// are unaffected. It only ever kicks off the first section; the rest
// of the sequence runs itself via bubbleSequence above.
function renderCard(card, mission) {
  stopBubbleSequenceTimer();
  bubbleEl.classList.remove("bubble-waiting");
  bubbleEl.innerHTML = "";

  currentLanguage = "en"; // a new output always starts in English
  updateLanguageToggleUI();

  const type = card.type || "fact";
  const sections = getSectionShapes(card).map((shape, i) => ({
    ...shape,
    lines: getSectionLines(card, mission, i, currentLanguage),
  }));

  bubbleSequence = { sections, stageIndex: 0, phase: "typing", timerId: null, lineEls: [], lineIndex: 0, charIndex: 0, cardType: type, card, mission, revealHintEl: null };
  startTypingSection(sections[0]);

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

// 0 = normal button behaviour. Any positive number = broken state
// active, counting down the dud presses remaining before the payoff.
let brokenButtonDudsLeft = 0;

// Current roll chance for the next successful normal press -- climbs
// toward BROKEN_BUTTON_CHANCE_MAX over time and resets back to
// BROKEN_BUTTON_CHANCE_START the instant the broken state begins.
let brokenButtonChance = BROKEN_BUTTON_CHANCE_START;

// ---------- Engagement tracking (milestone / streak reactions) ----------
// Two small, content-aware reactions that respond to what the user is
// actually doing during this sitting, rather than a flat percentage
// roll -- see the expressiveness proposal. Both piggyback on
// handleBellyPress()'s existing normal-press path below rather than
// adding a new system: sessionPressCount/lastIdleTime/fastPressStreak
// are the only new state this pass introduces.
let sessionPressCount = 0; // successful normal presses this sitting (browser session)
let lastIdleTime = 0; // Date.now() the moment PUPU last became idle again
let fastPressStreak = 0; // consecutive presses that started within STREAK_WINDOW_MS of the previous idle moment

const MILESTONE_INTERVAL = 10; // every 10th successful press gets the flourish -- earned, not random
const MILESTONE_EYES_MS = 1200;

// Rare "proud" flourish for sustained engagement: eyes_pupu (previously
// unused) plus the existing celebration sound. Fire-and-forget, called
// alongside maybeShowHat()/maybeStartBrokenButton() at the very end of
// a normal press -- see handleBellyPress().
function maybeShowMilestone() {
  if (sessionPressCount === 0 || sessionPressCount % MILESTONE_INTERVAL !== 0) return;

  playCelebration();
  setEyes("pupu");
  setTimeout(() => {
    setEyes("normal");
  }, MILESTONE_EYES_MS);
}

const STREAK_WINDOW_MS = 4000; // a press starting within this long after PUPU went idle counts as "fast"
const STREAK_THRESHOLD = 3; // this many fast presses in a row sparks a guaranteed happy reaction
// The "happy family" of BEHAVIOURS -- reused, not reinvented, for the
// streak spark below.
const HAPPY_BEHAVIOURS = BEHAVIOURS.filter((behaviour) =>
  ["bounce", "excited", "laugh"].includes(behaviour.animation)
);

// Hats have no obvious existing-behaviour match (no "pirate"/"santa"/
// "wizard" reaction exists, nor should one be invented just to host
// them -- see the visual-asset rules this was built under), so unlike
// every other new asset this session, they're not attached to any
// BEHAVIOURS/EVENTS/BUBBLE_REACTIONS entry. Instead they're a genuinely
// rare, independent spontaneous event rolled once per normal belly
// press (same call site as the broken-button easter egg below), so
// they stay a surprise rather than becoming predictable or attached
// to any one mood.
const HAT_ASSETS = ["hat_pirate", "hat_santa", "hat_wizard"];
const HAT_CHANCE = 0.04; // ~1 in 25 belly presses
const HAT_MIN_DURATION_MS = 3000; // how long the hat stays fully visible, same range as before
const HAT_MAX_DURATION_MS = 5000;
// Must match style.css's .pupu-hat-growing/.pupu-hat-popping animation
// lengths (0.35s / 0.3s) -- these are how long the grow-in/pop-out
// transforms themselves take, separate from HAT_MIN/MAX_DURATION_MS
// above, which is the hold time in between.
const HAT_GROW_MS = 350;
const HAT_POP_MS = 300;

// Two hat-specific timers (grow-hold -> start pop, and pop -> actually
// hide), kept separate from the generic layerHideTimeouts used by
// showLayerTemporarily() -- hats no longer go through that generic
// instant show/hide path at all, see showHatWithAnimation() below.
let hatPopTimeoutId = null;
let hatHideTimeoutId = null;

// Shows a hat with a rapid "grows onto PUPU's head" scale-up (0 ->
// slight overshoot -> 1, via .pupu-hat-growing), holds it fully
// visible for `holdMs`, then plays a matching "pops off" scale-down
// (1 -> slight overshoot -> 0, via .pupu-hat-popping) before actually
// hiding the layer -- unlike item/effect, which just appear/disappear
// instantly. Re-triggering mid-sequence (grow, hold, or pop) cancels
// whatever was pending and restarts the grow cleanly, the same
// stale-timer-safety every other layer already has.
function showHatWithAnimation(asset, holdMs) {
  if (hatPopTimeoutId !== null) {
    clearTimeout(hatPopTimeoutId);
    hatPopTimeoutId = null;
  }
  if (hatHideTimeoutId !== null) {
    clearTimeout(hatHideTimeoutId);
    hatHideTimeoutId = null;
  }

  setLayer("hat", asset); // sets src + reveals the layer (display:block)
  hatEl.classList.remove("pupu-hat-popping");
  void hatEl.offsetWidth; // force reflow so the grow animation restarts cleanly on repeat triggers
  hatEl.classList.add("pupu-hat-growing");

  hatPopTimeoutId = setTimeout(() => {
    hatPopTimeoutId = null;
    hatEl.classList.remove("pupu-hat-growing");
    void hatEl.offsetWidth; // force reflow so the pop animation always plays
    hatEl.classList.add("pupu-hat-popping");

    hatHideTimeoutId = setTimeout(() => {
      hatHideTimeoutId = null;
      clearLayer("hat");
      hatEl.classList.remove("pupu-hat-popping");
    }, HAT_POP_MS);
  }, HAT_GROW_MS + holdMs);
}

function maybeShowHat() {
  if (Math.random() >= HAT_CHANCE) return;
  const asset = pickRandomFrom(HAT_ASSETS);
  showHatWithAnimation(asset, randomRange(HAT_MIN_DURATION_MS, HAT_MAX_DURATION_MS));
}

// ---------- Ghost PUPU (rare spooky special event) ----------
// Like hats, this has no matching BEHAVIOURS/EVENTS/BUBBLE_REACTIONS
// entry to attach to and isn't given one -- it's a fully independent,
// coordinated multi-layer sequence (background tint + normal-PUPU
// fade + ghost-body fade + hold + reverse), rolled once per
// successful normal belly press at the same call site as the hat/
// broken-button rare-event rolls (see handleBellyPress() below).
//
// Unlike hats (fire-and-forget), maybeShowGhost() is `await`-ed by
// handleBellyPress() before it re-enables the belly button/resumes
// idle sounds+chatter -- so isBusy (and pauseIdleSounds()/
// pauseIdleChatter(), already active from the normal sequence that
// just finished) stay in effect for the entire ghost sequence too.
// That's also what makes this automatically interrupt-safe for free:
// a new belly press can never reach this function while a previous
// ghost event is still running, because isBusy already blocks it --
// the exact same guarantee the broken-button system already relies
// on, reused rather than reinvented.
const GHOST_CHANCE = 0.02; // ~2% per successful normal belly press
const GHOST_COOLDOWN_MS = 30000; // minimum real time between ghost events, measured from when the previous one finished
const GHOST_HOLD_MIN_MS = 2000;
const GHOST_HOLD_MAX_MS = 4000;
// Must match style.css's corresponding transition/animation durations.
const GHOST_OVERLAY_LEAD_MS = 150; // background starts darkening just before PUPU begins fading
const GHOST_NORMAL_FADE_MS = 450; // normal PUPU (body/arms/eyes/mouth/button) + shadow fade out/in -- matches their transition: opacity rules
const GHOST_BODY_FADE_MS = 500; // ghost body fade in/out -- matches .pupu-body-ghost's transition
const GHOST_OVERLAY_FADE_MS = 600; // purple overlay fade in/out -- matches .ghost-overlay's transition

// The "normal PUPU" group that fades out/in together as one unit --
// deliberately includes the belly button and arms (not just body/
// eyes/mouth) so nothing is left floating disconnected over the ghost.
const GHOST_NORMAL_GROUP = [bodyEl, armLeftEl, armRightEl, eyes, mouth, pupuButton];

// Timestamp (ms) the most recent ghost event finished at, so the next
// one can't roll until GHOST_COOLDOWN_MS has genuinely elapsed --
// independent of (and in addition to) the isBusy re-entrancy
// guarantee above, which only prevents *overlapping* events, not
// closely-spaced ones.
let lastGhostEventEndTime = 0;

async function maybeShowGhost() {
  if (Math.random() >= GHOST_CHANCE) return;
  if (Date.now() - lastGhostEventEndTime < GHOST_COOLDOWN_MS) return;

  // 1. Background gradually becomes dark purple.
  ghostOverlayEl.classList.add("ghost-overlay-active");
  await wait(GHOST_OVERLAY_LEAD_MS);

  // 2. Normal PUPU (including eyes, mouth, arms, belly button) and
  //    the ground shadow fade away together.
  shadowEl.classList.add("pupu-ghost-hidden");
  GHOST_NORMAL_GROUP.forEach((el) => el.classList.add("pupu-ghost-hidden"));
  await wait(GHOST_NORMAL_FADE_MS);

  // 3. Ghost PUPU fades in (and starts its own subtle bob via the
  //    same class, see .pupu-body-ghost-visible in style.css).
  ghostBodyEl.classList.add("pupu-body-ghost-visible");
  await wait(GHOST_BODY_FADE_MS);

  // 4. Hold, floating/bobbing, for a few seconds.
  await wait(randomRange(GHOST_HOLD_MIN_MS, GHOST_HOLD_MAX_MS));

  // 5. Reverse it all: ghost fades out, then normal PUPU + shadow
  //    fade back in, then the background clears last -- mirroring the
  //    entry order so nothing pops in/out abruptly.
  ghostBodyEl.classList.remove("pupu-body-ghost-visible");
  await wait(GHOST_BODY_FADE_MS);

  GHOST_NORMAL_GROUP.forEach((el) => el.classList.remove("pupu-ghost-hidden"));
  shadowEl.classList.remove("pupu-ghost-hidden");
  await wait(GHOST_NORMAL_FADE_MS);

  ghostOverlayEl.classList.remove("ghost-overlay-active");
  await wait(GHOST_OVERLAY_FADE_MS);

  lastGhostEventEndTime = Date.now();
}

// Rolls the small chance of starting the broken state. Only ever
// called after a normal reaction finishes, and only takes effect if
// the broken state isn't already running (so it can't restack).
function maybeStartBrokenButton() {
  if (brokenButtonDudsLeft > 0) return;

  if (Math.random() < brokenButtonChance) {
    brokenButtonDudsLeft = BROKEN_BUTTON_DUD_PRESSES;
    brokenButtonChance = BROKEN_BUTTON_CHANCE_START; // reset the instant the broken state begins
  } else {
    brokenButtonChance = Math.min(brokenButtonChance + BROKEN_BUTTON_CHANCE_STEP, BROKEN_BUTTON_CHANCE_MAX);
  }
}

// A single "dud" press: the button visually presses and releases,
// and a dull sound plays -- no reaction, no behaviour, no card.
async function playBrokenButtonDud() {
  pupuButton.src = BUTTON_PRESSED_SRC;
  pupuButton.classList.add("pupu-button-jammed"); // instant "stuck" press -- see .pupu-button-jammed in style.css
  playButtonBroken();
  setMouth("tongue"); // a teasing tongue-out look while the button stays jammed on the user

  await wait(BROKEN_BUTTON_JAM_HOLD_MS);

  pupuButton.classList.remove("pupu-button-jammed"); // removing it lets the base CSS transition ease it back slowly
  await wait(BROKEN_BUTTON_JAM_RELEASE_MS);

  pupuButton.src = BUTTON_UNPRESSED_SRC;

  // Small comedic flinch once the jam finally lets go -- reuses the
  // same wobble class/duration the payoff already uses below.
  void pupuCircle.offsetWidth; // force reflow so the wobble can restart cleanly
  pupuCircle.classList.add("pupu-soft-wobble");
  await wait(BROKEN_BUTTON_WOBBLE_MS);
  pupuCircle.classList.remove("pupu-soft-wobble");
  setMouth("normal");
}

// Personality/unpredictability for the payoff animation itself -- which
// of these plays is the only thing this varies. The dud/payoff press
// counting, trigger frequency, sound, mouth, and finishing wobble below
// are all untouched. Each variant is its own CSS class+keyframe pair
// (see style.css) that starts and ends at PUPU's exact normal scale/
// rotation, so nothing can accumulate across repeated triggers -- same
// cumulative-weight-threshold pattern already used by IDLE_SOUND_CHANCES/
// IDLE_GESTURES above. durationMs must match each variant's own CSS
// animation length.
const BROKEN_BUTTON_PAYOFF_VARIANTS = [
  { upTo: 0.35, className: "pupu-broken-payoff", durationMs: BROKEN_BUTTON_PAYOFF_DURATION_MS }, // existing inflate, unchanged
  { upTo: 0.6, className: "pupu-broken-payoff-shrink", durationMs: 700 },
  { upTo: 0.8, className: "pupu-broken-payoff-spin", durationMs: 800 },
  { upTo: 1.0, className: "pupu-broken-payoff-squash", durationMs: 700 }
];

function pickBrokenButtonPayoffVariant() {
  const roll = Math.random();
  return BROKEN_BUTTON_PAYOFF_VARIANTS.find((variant) => roll < variant.upTo);
}

// The payoff on the third press: celebratory sound, one randomly-picked
// scale/rotation flourish (see BROKEN_BUTTON_PAYOFF_VARIANTS above),
// then a soft finishing wobble. Uses the same clear -> reflow -> add
// class -> wait -> remove class pattern every existing reaction/event
// already uses.
async function playBrokenButtonPayoff() {
  pupuButton.src = BUTTON_PRESSED_SRC;

  await wait(BROKEN_BUTTON_PAYOFF_PAUSE_MS); // comedic beat before the payoff lands

  playCelebration();
  setMouth("shout"); // startled "whoa!" face for the big inflate payoff

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  const payoffVariant = pickBrokenButtonPayoffVariant();
  pupuCircle.classList.add(payoffVariant.className);
  await wait(payoffVariant.durationMs);
  pupuCircle.classList.remove(payoffVariant.className);

  void pupuCircle.offsetWidth; // force reflow so the wobble can restart cleanly
  pupuCircle.classList.add("pupu-soft-wobble");
  await wait(BROKEN_BUTTON_WOBBLE_MS);
  pupuCircle.classList.remove("pupu-soft-wobble");
  setMouth("normal");

  pupuButton.src = BUTTON_UNPRESSED_SRC;
}

// Handles a single press while the broken state is active. Disables
// the button for whichever sub-animation plays (dud or payoff), just
// like a normal reaction does, so it can't be interrupted or stacked
// -- then re-enables it. Once brokenButtonDudsLeft reaches 0 (the
// payoff press), the broken state has already ended by construction.
async function handleBrokenButtonPress() {
  isBusy = true;
  pupuButton.classList.add("pupu-button-disabled");
  pauseIdleSounds();
  pauseIdleChatter();

  brokenButtonDudsLeft--;

  if (brokenButtonDudsLeft > 0) {
    await playBrokenButtonDud();
  } else {
    await playBrokenButtonPayoff();
  }

  isBusy = false;
  pupuButton.classList.remove("pupu-button-disabled");
  resumeIdleSounds();
  resumeIdleChatter();
}

async function handleBellyPress() {
  if (isBusy || state.cards.length === 0 || Object.keys(state.missions).length === 0) return;

  if (brokenButtonDudsLeft > 0) {
    await handleBrokenButtonPress();
    return;
  }
  isBusy = true;
  sessionPressCount++;

  // Streak spark: several presses in quick succession (each one
  // starting within STREAK_WINDOW_MS of PUPU's last idle moment) reads
  // as enthusiasm, so the next behaviour is guaranteed from the happy
  // family instead of a flat random pick -- see HAPPY_BEHAVIOURS above.
  // A press that isn't fast resets the count to 0 (not counted) so an
  // ordinary slow press never inherits a stale streak; hitting the
  // threshold sparks immediately and resets so it takes a fresh streak
  // to spark again.
  const isFastPress = Date.now() - lastIdleTime < STREAK_WINDOW_MS;
  fastPressStreak = isFastPress ? fastPressStreak + 1 : 0;
  const isStreakSpark = fastPressStreak >= STREAK_THRESHOLD;
  if (isStreakSpark) fastPressStreak = 0;

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
  const behaviour = isStreakSpark ? pickRandomFrom(HAPPY_BEHAVIOURS) : pickRandomFrom(BEHAVIOURS);
  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add(`pupu-${behaviour.animation}`);
  setMouth(MOUTH_BY_ANIMATION[behaviour.animation]);
  setEyes(isStreakSpark ? "smiling" : EYES_BY_ANIMATION[behaviour.animation]);
  playBehaviourExtras(behaviour);

  // The card is picked first so its conversationType can steer which
  // mission pool pickMission() draws from -- see the Mission Engine
  // section above. renderCard() itself still just receives (card,
  // mission), same as before.
  const card = pickCard();
  renderCard(card, pickMission(card.conversationType, card.topicTags));
  replayAnimation(bubbleEl, "pupu-inflate", 500);

  // Holds the behaviour's own body animation for its own duration (see
  // the BEHAVIOURS comment above), then plays the finishing nod. This
  // is independent of the bubble's own typewriter sequence started by
  // renderCard() just above, which keeps running itself on its own
  // timers regardless of how long this animation takes.
  await wait(behaviour.duration);

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-finish");
  setMouth("normal");
  setEyes("normal");
  await wait(FINISH_DURATION_MS);

  await wait(HOLD_MESSAGE_MS);

  clearBehaviourAnimations();
  pupuButton.src = BUTTON_UNPRESSED_SRC;

  // Rare surprise: small independent chance of a full ghost-
  // transformation sequence. Awaited (unlike maybeShowHat() below) so
  // isBusy and the paused idle systems stay in effect for its entire
  // duration -- see maybeShowGhost()'s own comment for why that's also
  // what makes it interrupt-safe. Resolves almost instantly on the
  // (overwhelming majority of) presses where it doesn't trigger.
  await maybeShowGhost();

  pupuButton.classList.remove("pupu-button-disabled");
  isBusy = false;
  lastIdleTime = Date.now(); // marks the moment PUPU became idle again, for the streak spark above

  // Restored from script.js's playReaction(): only now that PUPU is
  // idle again do idle sounds/gestures and idle chatter resume.
  resumeIdleSounds();
  resumeIdleChatter();
  maybeShowHat(); // rare surprise: small independent chance of a temporary hat
  maybeStartBrokenButton(); // hidden easter egg: small chance the button "jams" for the next couple of presses
  maybeShowMilestone(); // earned surprise: a proud flourish every MILESTONE_INTERVAL-th press
}

// PUPU's belly starts a new card (the separate "Press PUPU" button was
// removed); keydown handles Enter/Space since the button is exposed as
// role="button" for accessibility, matching how the main app's belly
// button already works (see script.js).
pupuButton.addEventListener("click", handleBellyPress);
pupuButton.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleBellyPress();
  }
});

// Tapping/clicking the bubble drives handleBubbleAdvance() above.
// bubbleEl is a stable element that's never replaced (renderCard()
// only ever clears/rebuilds its contents), so this listener is
// attached once here rather than re-attached on every render. Keydown
// gives the same behaviour to keyboard users, matching the belly
// button's own role="button"/tabindex="0" pattern above.
bubbleEl.addEventListener("click", handleBubbleAdvance);
bubbleEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleBubbleAdvance();
  }
});

scheduleNextBlink();
loadCards();
loadMissions();
loadTranslations();
buildLanguageToggle();

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
