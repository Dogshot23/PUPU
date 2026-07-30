// PUPU - Brain module
// This file is the ONLY place in the project that calls Math.random().
// Its job is decisions, not execution: script.js asks the Brain what
// should happen next, and the Brain hands back an answer. script.js
// then does the actual DOM/animation/timing work.
//
// Loaded as a plain <script> after behaviors.js and before script.js
// (see index.html), sharing global scope the same way the rest of this
// project does -- no build step or module system.
//
// Depends on the global BEHAVIOURS constant (behaviors.js), the global
// EVENTS constant (still defined in script.js as event content, same
// as before -- only the decision of WHICH one gets picked moves
// here), and mission content -- preferably via ContentLoader
// (content-loader.js), falling back to the global MISSIONS constant
// (missions.js) if ContentLoader is unavailable or has nothing loaded.
//
// Designed to grow: missions, rarity, seasonal events, unlockables, and
// probability weighting can all be added later by extending the pick*
// helpers below (e.g. giving pool entries a "weight" field) without
// script.js needing to change at all -- it only ever calls Brain.*.

// ---------- Decision config ----------
// Tunable numbers that drive the Brain's choices. Kept here (not in
// script.js) because they're decision parameters, not animation or
// state-management concerns.
const EVENT_CHANCE = 0.2; // chance a special event happens before thinking

const THINK_MIN_MS = 500; // minimum thinking time
const THINK_MAX_MS = 1500; // maximum thinking time

const BLINK_MIN_MS = 3000; // minimum time between blinks
const BLINK_MAX_MS = 8000; // maximum time between blinks

// ---------- Generic random helpers ----------
// Small internal utilities the pick*/get* functions below build on.
// Keeping these separate makes it easy to later swap in weighted
// selection (rarity, unlockables, etc.) in one place.
function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandomFrom(list) {
  return list[randomInt(list.length)];
}

// ---------- Public Brain API ----------
const Brain = {
  // Chooses which behaviour PUPU should perform after thinking.
  // Currently a plain random pick from BEHAVIOURS; this is the spot to
  // later introduce weighting/rarity so some behaviours show up more
  // or less often.
  getRandomBehavior() {
    return pickRandomFrom(BEHAVIOURS);
  },

  // Decides whether a special event should play before the thinking
  // state on this button press.
  shouldTriggerSpecialEvent() {
    return Math.random() < EVENT_CHANCE;
  },

  // Chooses which special event plays, given that one is happening.
  getRandomEvent() {
    return pickRandomFrom(EVENTS);
  },

  // Chooses which mission PUPU hands the child after its behaviour
  // plays. Prefers interactions loaded via ContentLoader; falls back
  // to the old flat MISSIONS array if ContentLoader isn't available
  // (not loaded, or getInteractions isn't a function) or hasn't
  // loaded anything yet, so this can never return undefined. The
  // flat, id+text-ish shape either pool provides means this list can
  // grow to hundreds of entries without this function (or anything
  // calling it) needing to change.
  getRandomMission() {
    const interactions =
      typeof ContentLoader !== "undefined" &&
      typeof ContentLoader.getInteractions === "function"
        ? ContentLoader.getInteractions()
        : [];

    const pool = interactions.length > 0 ? interactions : MISSIONS;

    return pickRandomFrom(pool);
  },

  // Decides how long PUPU should think for, in milliseconds.
  getThinkingDuration() {
    return randomRange(THINK_MIN_MS, THINK_MAX_MS);
  },

  // Decides the delay, in milliseconds, before PUPU's next idle blink.
  getNextBlinkDelay() {
    return randomRange(BLINK_MIN_MS, BLINK_MAX_MS);
  }
};
