// PUPU MVP -- audio.js
// One shared Web Audio player for every sound in the app. Loaded before
// app.js, which uses the one global this file defines: PupuAudio.
//
// Why: app.js used to create a brand-new `new Audio(file)` element for
// every sound -- including a typing tick every 3-5 letters, i.e. several
// per second. On phones and iPads (iOS especially) each new element has
// to load and start its own decoder, which lags and stutters. Here each
// file is fetched and decoded ONCE into an AudioBuffer; playing it is
// then instant and costs almost nothing.
//
// Browser rules: sound may only start after the user has touched/clicked
// the page. PupuAudio.unlock() runs on every touch/click/key (listeners
// below). Until then, sounds are skipped (as `new Audio().play()` was
// rejected before), except ones played with { whenLocked: "queue" } --
// the belly squish, which then plays the moment the browser allows it.

const PupuAudio = (() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  try {
    ctx = AudioContextClass ? new AudioContextClass() : null;
  } catch (error) {
    ctx = null;
  }

  // iOS: Web Audio follows the ring/silent switch by default, unlike the
  // <audio> elements used before. "playback" keeps the old behaviour
  // (Safari 16.4+; ignored elsewhere).
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch (error) {
    /* not supported -- fine */
  }

  const master = ctx ? ctx.createGain() : null;
  if (master) master.connect(ctx.destination);

  // Decoded sounds, most recently used last. Decoded audio is large
  // (about 4x the WAV file), so rarely used sounds are dropped again once
  // the total passes MAX_DECODED_BYTES; preloaded ("pinned") ones stay.
  const MAX_DECODED_BYTES = 48 * 1024 * 1024;
  const cache = new Map(); // file -> { promise, bytes, pinned }
  let decodedBytes = 0;

  function decode(arrayBuffer) {
    // Callback form: also works on older Safari without the promise form.
    return new Promise((resolve, reject) => ctx.decodeAudioData(arrayBuffer, resolve, reject));
  }

  function evictIfNeeded() {
    for (const [file, entry] of cache) {
      if (decodedBytes <= MAX_DECODED_BYTES) return;
      if (entry.pinned || !entry.bytes) continue;
      cache.delete(file);
      decodedBytes -= entry.bytes;
    }
  }

  function load(file, pinned = false) {
    let entry = cache.get(file);
    if (entry) {
      cache.delete(file); // re-insert: most recently used goes last
      cache.set(file, entry);
      entry.pinned = entry.pinned || pinned;
      return entry.promise;
    }
    entry = { promise: null, bytes: 0, pinned };
    entry.promise = fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(decode)
      .then((buffer) => {
        entry.bytes = buffer.length * buffer.numberOfChannels * 4;
        decodedBytes += entry.bytes;
        evictIfNeeded();
        return buffer;
      })
      .catch((error) => {
        cache.delete(file); // allow a later retry
        throw error;
      });
    cache.set(file, entry);
    return entry.promise;
  }

  // Decodes files ahead of time (one after another, so startup isn't a
  // burst of downloads) and keeps them, so their first play is instant.
  function preload(files) {
    if (!ctx) return Promise.resolve();
    return files.reduce(
      (chain, file) => chain.then(() => load(file, true).catch(() => {})),
      Promise.resolve()
    );
  }

  let unlocked = false;
  function isRunning() {
    return ctx && ctx.state === "running";
  }

  // Called on every user gesture. resume() is allowed only inside one;
  // iOS also wants a sound started inside the gesture the first time.
  function unlock() {
    if (!ctx || isRunning()) return;
    ctx.resume().catch(() => {});
    if (!unlocked) {
      unlocked = true;
      const silence = ctx.createBufferSource();
      silence.buffer = ctx.createBuffer(1, 1, 22050);
      silence.connect(master);
      silence.start(0);
    }
  }
  ["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach((type) =>
    document.addEventListener(type, unlock, { capture: true, passive: true })
  );

  // Fallback for browsers without Web Audio: the old one-element-per-play.
  function playWithElement(file, volume, label) {
    const audio = new Audio(file);
    audio.volume = volume;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        if (label) console.warn(`PUPU MVP: ${label} sound playback failed`, error);
      });
    }
  }

  // Plays one file.
  //   volume      0..1 (default 0.7, the old app-wide value)
  //   whenLocked  "skip" (default) or "queue" -- see the header comment
  //   maxDelayMs  if the file still needs downloading/decoding, give up
  //               when it's ready later than this (stale typing ticks)
  //   label       name used in the console warning on failure
  function play(file, { volume = 0.7, whenLocked = "skip", maxDelayMs = Infinity, label = "" } = {}) {
    if (!ctx) {
      playWithElement(file, volume, label);
      return;
    }
    if (!isRunning() && whenLocked !== "queue") return;

    const requestedAt = performance.now();
    load(file)
      .then((buffer) => {
        if (performance.now() - requestedAt > maxDelayMs) return;
        if (!isRunning() && whenLocked !== "queue") return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(master);
        source.start();
      })
      .catch((error) => {
        if (label) console.warn(`PUPU MVP: ${label} sound playback failed`, error);
      });
  }

  function playRandom(files, options) {
    play(files[Math.floor(Math.random() * files.length)], options);
  }

  return { play, playRandom, preload, unlock };
})();
