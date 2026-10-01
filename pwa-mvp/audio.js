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

  // ---------- Made-up sound effects (no files) ----------
  // The chaos stunts (motion.js CHAOS) each get a sound built on the spot
  // from oscillators, filtered noise and volume envelopes: servo whines
  // and hydraulic hiss, pitch-bend sweeps, squelches and bubble runs,
  // 8-bit chirps and crackles. Timed to each stunt's motion. Skipped
  // until the page has been touched (browser rule), like other sounds.
  let noiseBuffer = null;
  function noise() {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }
  // A gain envelope: quick rise to `peak` at `at`, then fade over `length` s.
  function envelope(at, length, peak, attack = 0.01) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(length, attack + 0.01));
    gain.connect(sfxBus);
    return gain;
  }
  // A tone gliding from `from` to `to` Hz. Options: wobble (vibrato
  // {rate, depth}), filter ({type, freq, q}), steps (8-bit stairs).
  function tone(type, from, to, at, length, peak, options = {}) {
    to = to || from; // 0 = hold the pitch
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    if (options.steps) {
      for (let i = 1; i <= options.steps; i++) {
        osc.frequency.setValueAtTime(from + ((to - from) * i) / options.steps, at + (length * i) / (options.steps + 1));
      }
    } else {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + length);
    }
    if (options.wobble) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.setValueAtTime(options.wobble.rate, at);
      if (options.wobble.rateTo) lfo.frequency.linearRampToValueAtTime(options.wobble.rateTo, at + length);
      depth.gain.value = options.wobble.depth;
      lfo.connect(depth);
      depth.connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + length + 0.05);
    }
    let out = osc;
    if (options.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = options.filter.type;
      filter.frequency.value = options.filter.freq;
      filter.Q.value = options.filter.q || 1;
      osc.connect(filter);
      out = filter;
    }
    out.connect(envelope(at, length, peak, options.attack));
    osc.start(at);
    osc.stop(at + length + 0.05);
  }
  // Filtered white noise; the filter can sweep from `freq` to `freqTo`.
  function hiss(at, length, peak, type, freq, freqTo = freq, q = 1, attack = 0.01) {
    const source = ctx.createBufferSource();
    source.buffer = noise();
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, at);
    filter.frequency.exponentialRampToValueAtTime(freqTo, at + length);
    source.connect(filter);
    filter.connect(envelope(at, length, peak, attack));
    source.start(at, Math.random() * 0.5);
    source.stop(at + length + 0.05);
  }
  const rand = (min, max) => min + Math.random() * (max - min);

  const SFX = {
    melt(t) { // a wobbly slide down, then a bloop back up
      tone("sine", 520, 90, t, 1.1, 0.3, { wobble: { rate: 7, depth: 25 } });
      hiss(t + 0.1, 0.9, 0.08, "lowpass", 900, 200);
      tone("sine", 180, 560, t + 1.15, 0.22, 0.3);
    },
    "slime-drip"(t) { // squelch, three drips, snap back
      hiss(t, 0.3, 0.25, "lowpass", 1400, 250, 4);
      tone("sine", 160, 90, t, 0.3, 0.2, { wobble: { rate: 18, depth: 30 } });
      [0.45, 0.72, 0.95].forEach((d) => tone("sine", rand(700, 900), rand(1400, 1800), t + d, 0.08, 0.22));
      tone("sine", 200, 620, t + 1.05, 0.18, 0.25);
    },
    "acid-burp"(t) { // a long rumbly burp and a run of bubbles
      tone("sawtooth", 100, 62, t + 0.3, 0.6, 0.32, { wobble: { rate: 28, depth: 14 }, filter: { type: "lowpass", freq: 650, q: 3 }, attack: 0.03 });
      hiss(t + 0.3, 0.5, 0.06, "bandpass", 500, 300, 2);
      for (let i = 0; i < 9; i++) {
        const f = rand(400, 900);
        tone("sine", f, f * rand(1.6, 2.4), t + 0.45 + i * 0.06 + rand(0, 0.03), 0.07, 0.16);
      }
    },
    "eyeball-pop"(t) { // pop pop, boing boing, schlup
      tone("sine", 300, 1200, t, 0.06, 0.3);
      tone("sine", 320, 1300, t + 0.07, 0.06, 0.3);
      tone("triangle", 260, 240, t + 0.1, 0.7, 0.22, { wobble: { rate: 14, depth: 90 } });
      tone("sine", 1200, 260, t + 1.0, 0.09, 0.28);
    },
    "mech-shift"(t) { // servo whines, clanks, hydraulic hiss
      [[0, 140, 280], [0.55, 280, 150], [1.05, 160, 320]].forEach(([d, a, b]) => {
        tone("sawtooth", a, b, t + d, 0.32, 0.12, { filter: { type: "bandpass", freq: 900, q: 4 }, attack: 0.03 });
        tone("square", 70, 55, t + d + 0.33, 0.07, 0.18, { filter: { type: "lowpass", freq: 600 } });
        hiss(t + d + 0.33, 0.05, 0.2, "bandpass", 2000, 1500, 2);
      });
      hiss(t + 0.4, 0.45, 0.14, "highpass", 3000, 5000, 1, 0.02);
      hiss(t + 1.4, 0.4, 0.14, "highpass", 3500, 2500, 1, 0.02);
    },
    "pixel-deconstruct"(t) { // 8-bit chirps scattering, then a rising zip back
      const notes = [523, 659, 784, 1047, 1319, 1568];
      for (let i = 0; i < 14; i++) {
        tone("square", notes[Math.floor(Math.random() * notes.length)], 0, t + i * 0.055, 0.05, 0.08, { steps: 1 });
      }
      tone("square", 200, 1600, t + 1.0, 0.3, 0.09, { steps: 10 });
    },
    "low-battery"(t) { // power-down stairs, crackles, then a reboot jingle
      tone("square", 880, 110, t, 1.1, 0.09, { steps: 12 });
      for (let i = 0; i < 7; i++) hiss(t + rand(0.9, 1.6), 0.03, 0.2, "highpass", 2500);
      [[1.82, 523], [1.92, 659], [2.02, 1047]].forEach(([d, f]) => tone("square", f, 0, t + d, 0.09, 0.09, { steps: 1 }));
    },
    "rocket-thrust"(t) { // roar + whistle up, whistle down, CRASH
      hiss(t + 0.15, 1.0, 0.22, "lowpass", 300, 3000, 1, 0.2);
      tone("sine", 220, 1500, t + 0.2, 0.9, 0.12, { attack: 0.1 });
      tone("sine", 1500, 180, t + 1.1, 0.58, 0.14);
      hiss(t + 1.68, 0.35, 0.35, "lowpass", 900, 200);
      tone("sine", 95, 40, t + 1.68, 0.3, 0.4);
    },
    "over-inflate"(t) { // balloon squeak getting tighter, POP, bloop
      tone("triangle", 260, 900, t, 1.4, 0.14, { wobble: { rate: 6, rateTo: 30, depth: 30 }, attack: 0.2 });
      hiss(t + 1.4, 0.14, 0.45, "highpass", 900, 600);
      tone("sine", 1000, 90, t + 1.4, 0.09, 0.35);
      tone("sine", 400, 820, t + 1.72, 0.12, 0.25);
    },
    shatter(t) { // glass tinkles out, then back in, then a tink
      hiss(t, 0.25, 0.28, "highpass", 4000, 6000);
      for (let i = 0; i < 7; i++) tone("sine", rand(2000, 5000), 0, t + rand(0, 0.15), 0.3, 0.07, { steps: 1 });
      for (let i = 0; i < 5; i++) tone("sine", rand(1800, 3000), rand(3000, 4500), t + 0.6 + i * 0.06, 0.08, 0.06);
      tone("sine", 2600, 0, t + 0.95, 0.4, 0.12, { steps: 1 });
    },
    "rubber-snap"(t, strength = 1) { // the band lets go: a crack and a wobbly twang
      hiss(t, 0.04, 0.12 + 0.25 * strength, "highpass", 2500);
      tone("triangle", 200 + 520 * strength, 85, t, 0.55, 0.08 + 0.2 * strength, { wobble: { rate: 24, rateTo: 5, depth: 25 + 45 * strength } });
      tone("sine", 70 + 60 * strength, 45, t, 0.25, 0.1 + 0.15 * strength);
    },
    "hyper-spin"(t) { // whoosh-whoosh pitch-bend up and back down
      tone("triangle", 200, 1200, t, 0.65, 0.12, { wobble: { rate: 8, rateTo: 30, depth: 60 }, attack: 0.05 });
      tone("triangle", 1200, 200, t + 0.65, 0.6, 0.12, { wobble: { rate: 30, rateTo: 8, depth: 60 } });
      hiss(t, 0.65, 0.12, "bandpass", 400, 2500, 3, 0.1);
      hiss(t + 0.65, 0.6, 0.12, "bandpass", 2500, 400, 3);
    },
  };

  let sfxBus = null;
  function ensureSfxBus() {
    if (!sfxBus) {
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.8;
      sfxBus.connect(master);
    }
  }
  // Plays a made-up sound effect; returns true if `name` has one.
  // `strength` (0..1) scales the ones that take it (rubber-snap).
  function sfx(name, strength) {
    const recipe = SFX[name];
    if (!recipe || !ctx || !isRunning()) return false;
    ensureSfxBus();
    try {
      recipe(ctx.currentTime + 0.01, strength);
    } catch (error) {
      console.warn(`PUPU MVP: sound effect "${name}" failed`, error);
    }
    return true;
  }

  // Rubber-band tension while PUPU is being stretched (vector-pupu.js):
  // a quiet, creaky tone whose pitch, brightness and volume rise with
  // `level` (0..1). Call it every frame of the pull; stretch(null) fades
  // it out on release.
  let tension = null;
  function stretch(level) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (level === null) {
      if (tension) {
        tension.gain.gain.cancelScheduledValues(now);
        tension.gain.gain.setTargetAtTime(0.0001, now, 0.02);
        tension.osc.stop(now + 0.15);
        tension.lfo.stop(now + 0.15);
        tension = null;
      }
      return;
    }
    if (!isRunning()) return;
    if (!tension) {
      ensureSfxBus();
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const lfo = ctx.createOscillator(); // the creak: a fast, shallow wobble
      lfo.frequency.value = 11;
      const depth = ctx.createGain();
      depth.gain.value = 5;
      lfo.connect(depth);
      depth.connect(osc.frequency);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 5;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxBus);
      osc.start(now);
      lfo.start(now);
      tension = { osc, lfo, filter, gain };
    }
    const k = Math.max(0, Math.min(1, level));
    tension.osc.frequency.setTargetAtTime(90 + 560 * k, now, 0.04);
    tension.filter.frequency.setTargetAtTime(500 + 2600 * k, now, 0.04);
    tension.gain.gain.setTargetAtTime(0.015 + 0.075 * k, now, 0.04);
  }

  return { play, playRandom, preload, unlock, sfx, stretch, SFX_NAMES: Object.keys(SFX) };
})();
