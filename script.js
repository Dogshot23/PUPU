// PUPU - Step 8
// All random decision-making lives in brain.js -- this file asks the
// global Brain object what should happen (which behaviour, which
// mission, whether/which special event, how long to think, when to
// blink next) and focuses purely on state management, animation
// control, timing, button handling, and the typewriter effect.
// The reaction sequence is now: event (maybe) -> thinking -> a random
// behaviour's animation plays -> a random mission is typed into the
// speech bubble (replacing the old behaviour message) -> idle. The
// button stays disabled for the entire sequence and is only
// re-enabled at the end.

console.log("PUPU script loaded.");

// ---------- Element references ----------
const pupuCircle = document.getElementById("pupu-circle");
const eyes = document.getElementById("pupu-eyes");
const mouth = document.getElementById("pupu-mouth");
const pupuButton = document.getElementById("pupu-button");
const speechBubble = document.querySelector(".speech-bubble");
const speechTextEn = document.getElementById("speech-text-en");
const speechTextKo = document.getElementById("speech-text-ko");
const surpriseBtn = document.getElementById("surprise-btn");

// ---------- Config ----------
// Decision parameters (event odds, thinking/blink timing ranges) now
// live in brain.js -- script.js only keeps fixed, non-random timings
// that exist purely to match CSS animation lengths or hold state.
const BLINK_DURATION_MS = 180; // how long the closed-eyes artwork is shown for

// Eyes artwork -- swapped in place of the old CSS-drawn blink animation.
const EYES_OPEN_SRC = "images/pupu/eyes/eyes_open.png";
const EYES_CLOSED_SRC = "images/pupu/eyes/eyes_closed.png";

// Mouth artwork -- swapped in place of the old CSS-drawn mouth. Which
// expression shows is driven entirely by the animation identifier a
// behaviour or event already carries (behaviour.animation / event.id),
// so no changes to brain.js, missions.js, or behaviors.js are needed.
const MOUTH_NORMAL_SRC = "images/pupu/mouths/mouth_neutral.png";
const MOUTH_SMILE_SRC = "images/pupu/mouths/mouth_smile.png";
const MOUTH_BLOW_SRC = "images/pupu/mouths/mouth_blow.png";
// Added for the idle-chatter mouth cycle below -- existing assets,
// previously unused by script.js.
const MOUTH_OH_SRC = "images/pupu/mouths/mouth_oh.png";
const MOUTH_WIDE_SRC = "images/pupu/mouths/mouth_wide.png";

// Chest button artwork -- swapped in place of the old CSS-drawn button
// state. Pressed the instant the Surprise button is clicked, held
// through thinking, released back to unpressed once PUPU is idle again.
const BUTTON_UNPRESSED_SRC = "images/pupu/buttons/button_unpressed.png";
const BUTTON_PRESSED_SRC = "images/pupu/buttons/button_pressed.png";

// Maps an animation identifier (behaviour.animation, or an event's id)
// to the mouth expression that should show while it plays. Anything
// not listed here (distracted, sleepy, thinking, finish, sleep, etc.)
// simply falls back to the normal mouth.
const MOUTH_BY_ANIMATION = {
  bounce: "smile",   // happy
  excited: "smile",
  laugh: "smile",
  sneeze: "blow",
  blow: "blow"
};

// Sets the mouth artwork for a given expression ("normal", "smile", or
// "blow"); anything unrecognised falls back to "normal".
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

const FINISH_DURATION_MS = 350; // must match the CSS finish animation length
const HOLD_MESSAGE_MS = 900; // how long the finished message stays before idle

// ---------- Broken belly button (hidden behaviour) ----------
// A rare, self-contained easter egg: after a normal successful button
// interaction, there's a small chance the belly button "jams" for the
// next two presses (no reaction, just a dull sound), then pays off on
// the third press with an exaggerated inflate/deflate and a soft
// finishing wobble. All timings kept together here for easy tuning.
// Progressive chance: starts low, climbs by a fixed step after every
// successful normal press that doesn't trigger it (capped), and
// resets back to the start value the instant the broken state
// actually begins. See brokenButtonChance / maybeStartBrokenButton().
const BROKEN_BUTTON_CHANCE_START = 0.02; // 2% to begin with, and what it resets to once broken state starts
const BROKEN_BUTTON_CHANCE_STEP = 0.02; // +2 percentage points per successful normal press that doesn't trigger it
const BROKEN_BUTTON_CHANCE_MAX = 0.15; // hard cap at 15%
const BROKEN_BUTTON_DUD_PRESSES = 2; // how many "no reaction" presses happen before the payoff

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

const IDLE_TEXT = "Hi, I'm PUPU!";
const TYPEWRITER_SPEED_MS = 40; // delay between each revealed character
const KEY_TAP_CHANCE = 0.35; // odds of a key-tap sound on any given (non-space) character

// ---------- Idle sound system ----------
// While PUPU is idle (not thinking, typing, showing an event, or
// mid-reaction), an occasional small random sound plays. Paused for
// the entire reaction sequence and resumed automatically once PUPU
// returns to idle -- see pauseIdleSounds() / resumeIdleSounds().
const IDLE_SOUND_CHECK_MIN_MS = 10000; // 10s
const IDLE_SOUND_CHECK_MAX_MS = 80000; // 80s

// Cumulative probability thresholds (roll is a random 0-1 value):
// 50% nothing, 30% bubbles, 10% wobble, 7% pupu, 3% droplet.
const IDLE_SOUND_CHANCES = [
  { upTo: 0.50, action: null },
  { upTo: 0.80, action: () => SoundManager.playBubbles() },
  { upTo: 0.90, action: () => SoundManager.playWobble() },
  { upTo: 0.97, action: () => SoundManager.playPupu() },
  { upTo: 1.00, action: () => SoundManager.playDroplet() }
];

// ---------- Special event data ----------
// Special events can happen BEFORE the thinking state, with a small
// random chance per button press. Each event describes:
// - id:        unique identifier for the event
// - message:   brief text shown in the speech bubble
// - bodyClass: CSS class added to the PUPU circle (or null if none)
// - closeEyes: whether the eyes should show closed (via the same
//              open/closed artwork swap used for blinking) while this
//              event plays
// - duration:  how long the event plays before the sequence continues
//              into the normal thinking state
// (The chance of an event happening, EVENT_CHANCE, is a decision
// parameter and now lives in brain.js alongside the Brain functions
// that use it.)
const EVENTS = [
  {
    id: "sneeze",
    message: "Achoo!",
    bodyClass: "pupu-sneeze",
    closeEyes: false,
    duration: 500
  },
  {
    id: "laugh",
    message: "Hehehe!",
    bodyClass: "pupu-laugh",
    closeEyes: false,
    duration: 600
  },
  {
    id: "distracted",
    message: "Oh...",
    bodyClass: "pupu-distracted",
    closeEyes: false,
    duration: 700
  },
  {
    id: "sleep",
    message: "Zzz...",
    bodyClass: null,
    closeEyes: true,
    duration: 1000
  }
];

// ---------- Behaviour data ----------
// Behaviour content (id, message, animation, duration) now lives in
// behaviors.js, loaded before this file (see index.html). It defines
// the global BEHAVIOURS constant used below. script.js stays focused
// on state management, animation control, timing, button handling,
// and the typewriter effect -- not behaviour content.

// ---------- Small helper: Promise-based delay ----------
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Blinking ----------
// Triggers a single quick blink by swapping in the closed-eyes artwork,
// then schedules the next one. Timing is unchanged from before.
function blink() {
  eyes.src = EYES_CLOSED_SRC;

  setTimeout(() => {
    eyes.src = EYES_OPEN_SRC;
  }, BLINK_DURATION_MS);

  scheduleNextBlink();
}

// Asks the Brain for the next blink delay and queues the next blink.
function scheduleNextBlink() {
  const delay = Brain.getNextBlinkDelay();
  setTimeout(blink, delay);
}

// ---------- Idle sound system ----------
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
  if (surpriseBtn.disabled) return;

  const roll = Math.random();
  const chance = IDLE_SOUND_CHANCES.find((entry) => roll < entry.upTo);
  if (chance && chance.action) {
    chance.action();
    playIdleGesture(); // small chance of a tiny involuntary movement alongside the sound
  }

  scheduleNextIdleSoundCheck();
}

// ---------- Idle gestures ----------
// A tiny, self-contained flourish layered on top of the idle sound
// system: whenever an idle sound actually plays, there's a chance
// PUPU also makes one small involuntary movement, just to feel a
// little more alive while otherwise motionless. Reuses existing
// assets/classes wherever one already fits (blink artwork, the smile
// mouth, and the same .pupu-soft-wobble class the broken-belly-button
// flinch/payoff already uses) -- the only new CSS is a subtle
// brightness pulse, since nothing existing does a filter-based pulse.
const IDLE_GESTURE_SKIP_CHANCE = 0.5; // 50% chance of doing nothing
const IDLE_GESTURE_SMILE_MS = 400; // brief smile-flash duration
const IDLE_GESTURE_BRIGHTNESS_MS = 500; // must match .pupu-idle-brightness-pulse in style.css

// Guards against two idle gestures overlapping, and against a gesture
// overlapping the idle-chatter mouth cycle (which isn't covered by
// surpriseBtn.disabled -- see chatterInProgress below).
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
// already used for the broken-belly-button flinch/payoff.
function gestureWobble() {
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-soft-wobble");
  setTimeout(() => {
    pupuCircle.classList.remove("pupu-soft-wobble");
    idleGestureActive = false;
  }, BROKEN_BUTTON_WOBBLE_MS);
}

// Subtle brightness pulse -- the one genuinely new visual, since no
// existing system does a CSS filter pulse. Kept small and self-
// contained (see .pupu-idle-brightness-pulse in style.css).
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
// if PUPU is busy (reaction/event/thinking/typing/broken-button --
// all covered by surpriseBtn.disabled), if idle chatter is currently
// mid-cycle, or if a gesture is already in progress.
function playIdleGesture() {
  if (surpriseBtn.disabled || chatterInProgress || idleGestureActive) return;
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
// A small, self-contained "flavour" behaviour: every so often while
// PUPU is otherwise completely idle, he makes a bit of cute nonsense
// chatter -- a chatter sound plays while the mouth cycles rapidly
// through a few existing expressions, then settles back to normal.
// This never touches the speech bubble, the mission/behaviour system,
// or brain.js -- it's a mouth + sound flourish layered on top, gated
// by the exact same "is PUPU busy?" check the idle-sound system
// already uses. surpriseBtn.disabled already covers typing, button
// presses, and any reaction/behaviour animation in progress, since
// playReaction() disables it for the entire sequence -- so that one
// flag is all three of the required exclusions.
const IDLE_CHATTER_CHECK_MIN_MS = 120000; // 2 minutes
const IDLE_CHATTER_CHECK_MAX_MS = 300000; // 5 minutes
const CHATTER_MIN_DURATION_MS = 2000; // 2 seconds
const CHATTER_MAX_DURATION_MS = 4000; // 4 seconds
const CHATTER_MOUTH_FRAME_MS = 140; // how often the mouth swaps during chatter

// Expressions cycled through while chattering, reusing the same
// setMouth() vocabulary used everywhere else in the app. To add a
// new mouth pose to the cycle later, add its case to setMouth() and
// its name here -- nothing else about this system needs to change.
const CHATTER_MOUTH_SEQUENCE = ["normal", "smile", "oh", "wide", "blow"];

let idleChatterTimeoutId = null;

// Tracks whether a chatter flourish is currently mid-cycle. Idle
// chatter isn't gated by surpriseBtn.disabled (it can run alongside
// an otherwise-idle PUPU), so idle gestures check this flag too,
// avoiding a mouth-swap gesture clashing with chatter's own mouth
// cycle. Set true right before chatter() starts swapping the mouth,
// false right after it settles back to normal.
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
//
// Sync note: SoundManager.playChatter() is a fire-and-forget one-shot
// by design (see sound-manager.js) and doesn't hand back the clip's
// real duration, so the mouth cycle runs for its own randomly chosen
// 2-4s window rather than being locked to the exact audio length.
// The chatter clips are short one-shots, so this reads as in-sync in
// practice without requiring any change to SoundManager's public API.
function chatter() {
  return new Promise((resolve) => {
    chatterInProgress = true;
    SoundManager.playChatter();

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
// busy (typing, button press, or any reaction/animation already in
// progress -- all of which disable surpriseBtn), this simply
// reschedules and tries again later rather than queuing or forcing
// the chatter in.
async function runIdleChatterCheck() {
  idleChatterTimeoutId = null;

  if (surpriseBtn.disabled) {
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

// ---------- Behaviour engine ----------
// Behaviour selection itself is a Brain decision (see Brain.getRandomBehavior);
// this section just plays whatever behaviour it's given.

// Reveals `text` in `element` one character at a time.
// Returns a Promise that resolves once every character has been typed,
// so callers can await the full reveal before moving on.
function typeWriter(element, text) {
  element.textContent = "";
  SoundManager.playTyping(); // one ambience sound for this message; not restarted per character

  return new Promise((resolve) => {
    let charIndex = 0;

    function typeNextChar() {
      if (charIndex < text.length) {
        const char = text.charAt(charIndex);
        element.textContent += char;
        charIndex++;

        if (char !== " " && Math.random() < KEY_TAP_CHANCE) {
          SoundManager.playKeyTap();
        }

        setTimeout(typeNextChar, TYPEWRITER_SPEED_MS);
      } else {
        SoundManager.stopTyping();
        resolve();
      }
    }

    typeNextChar();
  });
}

// Sets (or clears) the Korean line under the English text. Hidden via
// a CSS class whenever there's nothing to show, so no empty gap
// appears under single-language content (idle text, special events).
function setKoreanText(text) {
  if (text) {
    speechTextKo.textContent = text;
    speechTextKo.classList.remove("speech-text-ko-hidden");
  } else {
    speechTextKo.textContent = "";
    speechTextKo.classList.add("speech-text-ko-hidden");
  }
}

// Removes any previously applied behaviour animation classes from PUPU,
// so a new behaviour's class can be added cleanly (and so re-triggering
// the same behaviour restarts its animation).
function clearBehaviourAnimations() {
  BEHAVIOURS.forEach((behaviour) => {
    pupuCircle.classList.remove(`pupu-${behaviour.animation}`);
  });
  pupuCircle.classList.remove("pupu-thinking");
  pupuCircle.classList.remove("pupu-finish");

  // Also clear any special-event body classes left over on the circle.
  EVENTS.forEach((event) => {
    if (event.bodyClass) {
      pupuCircle.classList.remove(event.bodyClass);
    }
  });
}

// ---------- Special event system ----------
// Plays a single special event: applies its classes, briefly shows its
// message in the bubble, waits for its duration, then cleans up.
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

  speechBubble.classList.remove("pupu-inflate");
  void speechBubble.offsetWidth; // force reflow so the animation can restart
  speechBubble.classList.add("pupu-inflate");
  speechTextEn.textContent = event.message;
  setKoreanText(""); // events are single-language messages, no Korean line

  await wait(event.duration);

  clearBehaviourAnimations();
  if (event.closeEyes) {
    eyes.src = EYES_OPEN_SRC;
  }
  setMouth("normal");
  speechBubble.classList.remove("pupu-inflate");
  speechTextEn.textContent = IDLE_TEXT;
}

// Asks the Brain whether a special event should happen. If so, asks
// the Brain which one and plays it before resolving. Otherwise
// resolves immediately, so the calling sequence can simply
// `await maybeTriggerEvent()` regardless of whether anything happened.
async function maybeTriggerEvent() {
  if (Brain.shouldTriggerSpecialEvent()) {
    const event = Brain.getRandomEvent();
    await playEvent(event);
  }
}

// ---------- Thinking state ----------
// PUPU looks thoughtful: eyes look up, head tilts, tiny body wobble.
// Lasts however long the Brain decides to think for.
async function think() {
  pupuCircle.classList.add("pupu-thinking");
  eyes.classList.add("pupu-thinking-eye");
  setMouth("normal");

  const thinkTime = Brain.getThinkingDuration();
  await wait(thinkTime);

  pupuCircle.classList.remove("pupu-thinking");
  eyes.classList.remove("pupu-thinking-eye");
}

// ---------- Broken belly button (hidden behaviour) ----------
// Entirely self-contained: this section doesn't call into, modify,
// or share state with playReaction(), clearBehaviourAnimations(), or
// any existing behaviour/event content. It only ever intercepts a
// button press at the handleBellyButtonClick() gate (see below),
// exactly the same way the existing surpriseBtn.disabled gate already
// does -- and it's started by a single additive line at the very end
// of a normal playReaction() (see maybeStartBrokenButton() call
// there).
//
// 0 = normal button behaviour. Any positive number = broken state
// active, counting down the dud presses remaining before the payoff.
let brokenButtonDudsLeft = 0;

// Current roll chance for the next successful normal press -- climbs
// toward BROKEN_BUTTON_CHANCE_MAX over time and resets back to
// BROKEN_BUTTON_CHANCE_START the instant the broken state begins.
let brokenButtonChance = BROKEN_BUTTON_CHANCE_START;

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
// and a dull sound plays -- no reaction, no behaviour, no mission.
async function playBrokenButtonDud() {
  pupuButton.src = BUTTON_PRESSED_SRC;
  pupuButton.classList.add("pupu-button-jammed"); // instant "stuck" press -- see .pupu-button-jammed in style.css
  SoundManager.playButtonBroken();

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
}

// The payoff on the third press: celebratory sound, rapid
// inflate/hold/deflate, then a soft finishing wobble. Uses the same
// clear -> reflow -> add class -> wait -> remove class pattern every
// existing reaction/event already uses.
async function playBrokenButtonPayoff() {
  pupuButton.src = BUTTON_PRESSED_SRC;

  await wait(BROKEN_BUTTON_PAYOFF_PAUSE_MS); // comedic beat before the payoff lands

  SoundManager.playCelebration();

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-broken-payoff");
  await wait(BROKEN_BUTTON_PAYOFF_DURATION_MS);
  pupuCircle.classList.remove("pupu-broken-payoff");

  void pupuCircle.offsetWidth; // force reflow so the wobble can restart cleanly
  pupuCircle.classList.add("pupu-soft-wobble");
  await wait(BROKEN_BUTTON_WOBBLE_MS);
  pupuCircle.classList.remove("pupu-soft-wobble");

  pupuButton.src = BUTTON_UNPRESSED_SRC;
}

// Handles a single press while the broken state is active. Disables
// the button for whichever sub-animation plays (dud or payoff), just
// like a normal reaction does, so it can't be interrupted or stacked
// -- then re-enables it. Once brokenButtonDudsLeft reaches 0 (the
// payoff press), the broken state has already ended by construction.
async function handleBrokenButtonPress() {
  surpriseBtn.disabled = true;
  pupuButton.classList.add("pupu-button-disabled");
  pauseIdleSounds();
  pauseIdleChatter();

  brokenButtonDudsLeft--;

  if (brokenButtonDudsLeft > 0) {
    await playBrokenButtonDud();
  } else {
    await playBrokenButtonPayoff();
  }

  surpriseBtn.disabled = false;
  pupuButton.classList.remove("pupu-button-disabled");
  resumeIdleSounds();
  resumeIdleChatter();
}

// ---------- Full reaction sequence ----------
// Button Press -> thinking -> behaviour animation plays + bubble inflates ->
// typewriter mission text -> finishing reaction -> idle.
// The button stays disabled for the entire sequence.
async function playReaction() {
  surpriseBtn.disabled = true;
  pupuButton.classList.add("pupu-button-disabled");
  pupuButton.src = BUTTON_PRESSED_SRC;
  pauseIdleSounds();
  pauseIdleChatter();

  // 1. A random special event may happen first (20% chance).
  await maybeTriggerEvent();

  // 2. PUPU notices the click and thinks for a moment.
  await think();

  // 3. The Brain chooses a behaviour; its animation + speech bubble begin.
  //    The Brain also chooses a mission -- the behaviour's animation
  //    still plays, but the speech bubble shows the mission text
  //    instead of the behaviour's own message.
  const behaviour = Brain.getRandomBehavior();
  const mission = Brain.getRandomMission();

  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add(`pupu-${behaviour.animation}`);
  setMouth(MOUTH_BY_ANIMATION[behaviour.animation]);

  speechBubble.classList.remove("pupu-inflate");
  void speechBubble.offsetWidth; // force reflow so the animation can restart
  speechBubble.classList.add("pupu-inflate");
  setKoreanText(""); // hide any leftover Korean line while English types out

  // 4. The mission text is typed out; wait for it to finish. Supports
  //    either a bilingual mission ({ en, ko }) or the older single-
  //    language ({ text }) shape -- mission data/selection itself is
  //    untouched, this just decides which field to read for display.
  const missionEn = mission.en ?? mission.text;
  const missionKo = mission.ko ?? "";
  await typeWriter(speechTextEn, missionEn);

  // Korean appears directly underneath once the English line is fully
  // typed out, rather than typing simultaneously.
  setKoreanText(missionKo);

  // 5. A small finishing reaction plays once the message is fully shown.
  clearBehaviourAnimations();
  void pupuCircle.offsetWidth; // force reflow so the animation can restart
  pupuCircle.classList.add("pupu-finish");
  setMouth("normal");
  await wait(FINISH_DURATION_MS);

  // 6. Hold the finished message briefly, then return to idle.
  await wait(HOLD_MESSAGE_MS);

  clearBehaviourAnimations();
  speechBubble.classList.remove("pupu-inflate");
  pupuButton.src = BUTTON_UNPRESSED_SRC;

  // 7. Only now are the buttons re-enabled.
  surpriseBtn.disabled = false;
  pupuButton.classList.remove("pupu-button-disabled");
  resumeIdleSounds();
  resumeIdleChatter();
  maybeStartBrokenButton(); // hidden easter egg: small chance the button "jams" for the next couple of presses
}

// Called when the "Surprise Me" button is pressed.
function handleSurpriseClick() {
  playReaction();
}

// Called when PUPU's belly button is pressed. Reuses the exact same
// handler as the "Surprise Me" button -- same sequence, same timings,
// same logic -- just gated on the same disabled state so it can't
// stack a second reaction on top of one already playing.
function handleBellyButtonClick() {
  if (surpriseBtn.disabled) return;

  if (brokenButtonDudsLeft > 0) {
    handleBrokenButtonPress();
    return;
  }

  SoundManager.playSquish();
  handleSurpriseClick();
}

// Lets the belly button be pressed with the keyboard (Enter or Space),
// matching how a native <button> would behave, since it's exposed as
// role="button" for accessibility.
function handleBellyButtonKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleBellyButtonClick();
  }
}

// ---------- Init ----------
// Startup now waits for ContentLoader.load() to finish before the app
// begins normal operation (blinking, button handlers). Nothing yet
// reads what ContentLoader loads -- brain.js still only knows about
// the old MISSIONS constant -- so this is purely a sequencing change,
// not a behaviour change. If loading fails (e.g. no content/ files
// served, or a network error), the failure is caught and logged here
// so startup still proceeds, matching current behaviour where PUPU
// always becomes interactive regardless of content-loading concerns.
async function init() {
  try {
    await ContentLoader.load();
  } catch (error) {
    console.warn("Content loader: failed to load content at startup", error);
  }

  scheduleNextBlink();
  surpriseBtn.addEventListener("click", handleSurpriseClick);
  pupuButton.addEventListener("click", handleBellyButtonClick);
  pupuButton.addEventListener("keydown", handleBellyButtonKeydown);
  resumeIdleSounds();
  resumeIdleChatter();
}

init();
