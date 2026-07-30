// PUPU - Sound Manager
//
// All sound logic lives here. Every other file (script.js, and any
// future behaviour/mission/brain files) should only ever call the
// SoundManager.playX() methods (or the generic SoundManager.play(category))
// exposed at the bottom of this file -- nothing outside this file
// should touch an Audio object, a file path, or a volume directly.
//
// NOTE: this step only builds the reusable manager and preloads its
// sounds. Nothing calls into SoundManager yet -- script.js is
// untouched, and no play calls have been wired into behaviours,
// button handlers, animations, etc. That wiring is a later step.

const SoundManager = (function () {
  "use strict";

  // ---------- Config ----------

  // Base folder all sound files are loaded from.
  const SOUND_BASE_PATH = "sounds/";

  // Every category maps to a list of its exact variation filenames
  // (relative to SOUND_BASE_PATH). At play time one variation is
  // picked at random. To add a variation, just add its filename to
  // the array -- to add a whole new category, add a new key here and
  // a matching play method is generated automatically (see
  // "Public API generation" below), no other code needs to change.
  const SOUND_FILES = {
    breath_in: ["breath_in/breath_in.wav"],
    bubbles: ["bubbles/bubbles1.wav", "bubbles/bubbles2.wav", "bubbles/bubbles3.wav"],
    burp: ["burp/burp1.wav", "burp/burp2.wav", "burp/burp3.wav", "burp/burp4.wav"],
    button_broken: ["button/button_broken.wav"],
    celebration: ["celebration/celebration1.wav", "celebration/celebration2.wav", "celebration/celebration3.wav"],
    chatter: [
      "chatter/chatter1.wav",
      "chatter/chatter2.wav",
      "chatter/chatter3.wav",
      "chatter/chatter4.wav",
      "chatter/chatter5.wav",
      "chatter/chatter6.wav",
      "chatter/chatter7.wav"
    ],
    crackle: ["crackle/crackle1.wav"],
    droplet: ["droplet/droplet1.wav"],
    eating: [
      "eating/eating1.wav",
      "eating/eating2.wav",
      "eating/eating3.wav",
      "eating/eating4.wav",
      "eating/eating5.wav",
      "eating/eating6.wav"
    ],
    fart: ["fart/fart1.wav", "fart/fart2.wav", "fart/fart3.wav"],
    flip: ["flip/flip1.wav", "flip/flip2.wav"],
    idle: ["idle/idle1.wav", "idle/idle2.wav"],
    joy: ["joy/joy1.wav"],
    key_tap: ["key_tap/keytap1.wav", "key_tap/keytap2.wav"],
    masticating: ["masticating/masticating.mp3"],
    pupu: ["pupu/pupu1.wav", "pupu/pupu2.wav"],
    sad: ["sad/sad1.wav", "sad/sad2.wav"],
    sleeping: ["sleeping/sleeping1.wav", "sleeping/sleeping2.wav", "sleeping/sleeping3.wav"],
    splash: ["splash/splash1.wav", "splash/splash2.wav"],
    squish: ["squish/squish1.wav", "squish/squish2.wav", "squish/squish3.wav"],
    typing: ["typing/typing1.wav", "typing/typing2.wav", "typing/typing3.wav", "typing/typing4.wav"],
    wet: ["wet/wet1.mp3"],
    wobble: ["wobble/wobble1.wav"]
  };

  // Flat default volume applied to every sound (0.0 - 1.0). Kept as a
  // single constant to stay simple; a per-category override could be
  // added later (e.g. a SOUND_VOLUMES map) without touching the
  // playback logic below.
  const DEFAULT_VOLUME = 0.7;

  // ---------- State ----------

  let muted = false;

  // The typing category is the one "managed" (as opposed to one-shot)
  // sound: it loops for the duration of a message and needs to be
  // stopped on command. This holds a reference to whichever cloned
  // Audio instance is currently playing as typing ambience, so
  // stopTyping() has something to reach back and fade/pause.
  let currentTypingAudio = null;
  const TYPING_FADE_MS = 250; // how long stopTyping()'s fade-out takes
  const TYPING_FADE_STEP_MS = 25; // how often volume is stepped down during the fade

  // Preloaded "template" Audio objects, keyed by category -> array of
  // Audio objects (same order as SOUND_FILES[category]). Playback
  // never uses these directly -- it clones one, so multiple overlapping
  // plays (even repeats of the same variation) never cut each other
  // off or fight over playback position.
  const preloaded = {};

  // ---------- Preloading ----------

  // Builds a single preloaded Audio object for one file path. Attaches
  // an "error" listener so a missing or broken file just logs a quiet
  // warning instead of throwing or surfacing an unhandled rejection --
  // that file's variation simply won't play.
  function createAudio(relativePath) {
    const audio = new Audio(SOUND_BASE_PATH + relativePath);
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;
    audio.addEventListener("error", () => {
      console.warn(`SoundManager: could not load "${relativePath}" -- skipping this variation.`);
    });
    return audio;
  }

  // Preloads every variation of every category. Runs once, immediately,
  // when this file is loaded.
  function preloadAll() {
    Object.keys(SOUND_FILES).forEach((category) => {
      preloaded[category] = SOUND_FILES[category].map(createAudio);
    });
  }

  // ---------- Playback ----------

  // Returns a random variation's preloaded Audio template for a
  // category, or null if the category doesn't exist or has no
  // variations loaded.
  function pickVariation(category) {
    const variations = preloaded[category];
    if (!variations || variations.length === 0) {
      return null;
    }
    return variations[Math.floor(Math.random() * variations.length)];
  }

  // Plays one random variation from `category`.
  // - Does nothing if muted.
  // - Clones the preloaded template before playing, so this sound can
  //   overlap with itself and with any other currently-playing sound
  //   without either one getting cut off.
  // - Fails gracefully: an unknown category, a missing file, or a
  //   playback error (e.g. browser autoplay restrictions) only ever
  //   produces a console warning, never a thrown error.
  function play(category) {
    if (muted) return;

    const template = pickVariation(category);
    if (!template) {
      console.warn(`SoundManager: no sound loaded for category "${category}".`);
      return;
    }

    const instance = template.cloneNode(true);
    instance.volume = template.volume;

    const playPromise = instance.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn(`SoundManager: playback failed for "${category}".`, error);
      });
    }
  }

  // ---------- Managed looping sound: typing ambience ----------
  // Typing ambience is started once per message and needs to loop
  // until explicitly stopped, unlike every other (one-shot) category.
  // This plays a random "typing" variation on loop and remembers it
  // in currentTypingAudio so stopTyping() can find it later.
  function playTypingManaged() {
    if (muted) return;

    const template = pickVariation("typing");
    if (!template) {
      console.warn('SoundManager: no sound loaded for category "typing".');
      return;
    }

    const instance = template.cloneNode(true);
    instance.volume = template.volume * 0.5; // typing ambience only: 50% of default volume
    instance.loop = true;

    const playPromise = instance.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn('SoundManager: playback failed for "typing".', error);
      });
    }

    currentTypingAudio = instance;
  }

  // Stops the currently playing typing ambience, if any, fading its
  // volume down over ~TYPING_FADE_MS before pausing it. A no-op if
  // nothing is currently playing (safe to call defensively).
  function stopTyping() {
    const instance = currentTypingAudio;
    if (!instance) return;
    currentTypingAudio = null; // claimed immediately so a later playTypingManaged() can't be cut off by this fade

    const startVolume = instance.volume;
    const totalSteps = Math.max(1, Math.round(TYPING_FADE_MS / TYPING_FADE_STEP_MS));
    let step = 0;

    const fadeInterval = setInterval(() => {
      step++;
      instance.volume = Math.max(0, startVolume * (1 - step / totalSteps));
      if (step >= totalSteps) {
        clearInterval(fadeInterval);
        instance.pause();
      }
    }, TYPING_FADE_STEP_MS);
  }

  // ---------- Mute control ----------

  function setMuted(value) {
    muted = Boolean(value);
  }

  function toggleMuted() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  // ---------- Public API generation ----------
  // Rather than hand-writing one playX() function per category (easy
  // to typo or forget to update), a method is generated for every key
  // in SOUND_FILES automatically -- e.g. "key_tap" -> playKeyTap(),
  // "breath_in" -> playBreathIn(). Adding a new category to
  // SOUND_FILES above is enough for its play method to exist; nothing
  // below needs to change.
  function toMethodName(category) {
    const pascalCase = category
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `play${pascalCase}`;
  }

  const categoryMethods = {};
  Object.keys(SOUND_FILES).forEach((category) => {
    categoryMethods[toMethodName(category)] = () => play(category);
  });

  // typing is the one category that needs managed (looping,
  // stoppable) playback instead of the generic one-shot play() --
  // override just that one generated method.
  categoryMethods.playTyping = playTypingManaged;

  // ---------- Init ----------
  preloadAll();

  // ---------- Public API ----------
  // categoryMethods contributes: playBreathIn, playBubbles, playBurp,
  // playCelebration, playChatter, playCrackle, playDroplet, playEating,
  // playFart, playFlip, playIdle, playJoy, playKeyTap, playMasticating,
  // playPupu, playSad, playSleeping, playSplash, playSquish, playTyping,
  // playWet, playWobble.
  return Object.assign(
    {
      play, // generic escape hatch: SoundManager.play("some_category")
      stopTyping,
      setMuted,
      toggleMuted,
      isMuted
    },
    categoryMethods
  );
})();
