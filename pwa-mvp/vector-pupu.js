// PUPU MVP -- vector-pupu.js
// An alternative way to draw PUPU: instead of moving PNG cut-outs, he is
// drawn every frame on a <canvas> from maths -- Bézier-curve body, spring
// physics, eyes that follow your finger, and faces made of numbers that
// morph smoothly into each other. Loaded before app.js, which decides
// which renderer to use (see "Renderer choice" in app.js); the PNG
// version stays the default.
//
// How it stays in sync with the rest of the app WITHOUT app.js changes:
// it watches what app.js already does to the PNG version and mirrors it.
//   - PupuMotion.play(name)       -> react(name)   (reactions, see REACTIONS)
//   - #pupu-eyes / #pupu-mouth src -> face targets  (blinks, expressions)
//   - #pupu-button src             -> belly button pressed / released
//   - #pupu-effect src             -> a drawn "!" or "?"
//   - .pupu-ghost-hidden on body   -> ghost mode (see-through, lilac)
// So every behaviour, event, blink and easter egg drives both versions.
//
// Coordinates: everything is drawn in the same 1024 x 1024 space as the
// PNG artwork, then scaled to the canvas, so the two line up.

const VectorPupu = (() => {
  // ---------- Look ----------
  const COLORS = {
    outline: "#2b1b54", // the single outer outline (and the mouth)
    bodyStops: [
      [0, "#fff0d4"],   // warm peach centre
      [0.45, "#fccde3"], // pink
      [0.78, "#ebb8ef"], // lilac pink
      [1, "#c9cbfb"],   // blue-lilac rim
    ],
    cheek: ["rgba(246, 150, 210, 0.75)", "rgba(240, 165, 220, 0.4)", "rgba(236, 175, 228, 0)"], // soft blush, fades into the body
    visor: ["#f2cdf2", "#cfc6fb", "#bfe4fb"], // the original's pink > lilac > cyan sheen
    visorEdge: "#a99be0", // soft lilac rim, not a dark line
    visorLid: "#b4a2ea", // eyelid shade coming down over the visor
    glyph: "#2a2775", // the 푸푸 lettering
    mouthInside: "#8c3c66",
    tongue: "#f58fb3",
    buttonRing: "#d8c9f5",
    buttonEdge: "#b6a6e6",
    buttonFace: ["#ffffff", "#e7e0fb"],
    arrow: "#b4a2e6",
    shadow: "rgba(150, 130, 220, 0.55)",
    bang: "#ffd84d",
  };

  // Mutation palettes the body gradient blends towards (see "Mutations").
  const PALETTES = {
    acid: [[0, "#f6ffc8"], [0.45, "#cdf57c"], [0.78, "#94d85a"], [1, "#5ca94b"]], // burp / fart
    charcoal: [[0, "#74748a"], [0.45, "#4c4c5e"], [0.78, "#353542"], [1, "#22222d"]], // glitch / robot
    neon: [[0, "#f2ffb0"], [0.45, "#a8ff3e"], [0.78, "#58e01e"], [1, "#2fa012"]], // acid burp
    metal: [[0, "#f4f7fb"], [0.45, "#c3ccd8"], [0.78, "#8f9bab"], [1, "#5d6878"]], // mech-shift
  };
  const NEON = "#39f3ff";

  // Layout in artwork space (see body.png).
  const ANCHOR = { x: 505, y: 815 }; // between the feet: squash/tilt pivot
  // Taller than the visor reaches, so the crown shows above it.
  const BODY = { cx: 505, cy: 520, rx: 330, top: 362, bottom: 290 };
  const OUTLINE_PX = 3.5; // outer outline width on screen, in CSS pixels
  // The visor band (shorter and lower than the first prototype) and its
  // "푸푸" lettering. Each 푸 is ㅍ over ㅜ, drawn as bold rounded strokes
  // around its own centre (GLYPH is relative to that centre). The letters
  // ARE PUPU's eyes: they look, squint, wink and arch (see drawPu).
  const VISOR = { x: 506, y: 286, w: 352, h: 138, r: 64 };
  const GLYPH = {
    stroke: 19,
    half: 40, // half-width of ㅍ's top/bottom bars
    post: 21, // ㅍ's two upright strokes sit at x ± post
    top: -45, // ㅍ top bar
    bottom: 0, // ㅍ bottom bar (an open, nearly square box, like the original)
    uBar: 23, // ㅜ bar
    uHalf: 47,
    stemEnd: 47, // ㅜ stem
  };
  const EYES = [{ x: 430, y: 286 }, { x: 582, y: 286 }]; // centres of the two 푸, left to right on screen
  const LOOK_SHIFT = { x: 14, y: 7 }; // how far the lettering shifts towards the pointer
  const MOUTH = { x: 506, y: 392 };
  const BUTTON = { x: 520, y: 612, r: 118 };

  // ---------- Springs ----------
  // acceleration = -stiffness * displacement - damping * velocity
  function spring(value, stiffness, damping) {
    return { value, target: value, velocity: 0, stiffness, damping };
  }
  function stepSpring(s, dt) {
    const acceleration = -s.stiffness * (s.value - s.target) - s.damping * s.velocity;
    s.velocity += acceleration * dt;
    s.value += s.velocity * dt;
  }

  const body = {
    squash: spring(0, 260, 11), // scaleY = 1 + squash, scaleX = 1 / scaleY (volume kept)
    hop: spring(0, 170, 13),    // vertical offset, artwork px (negative = up)
    tilt: spring(0, 140, 10),   // radians, around the feet
    pop: spring(1, 220, 14),    // overall size
    chest: spring(0, 120, 12),  // 0..1 upper body pushed out (proud)
    armL: spring(0, 160, 9),    // radians
    armR: spring(0, 160, 9),
    cheek: spring(0, 150, 12),  // cheek puff
    faceY: spring(0, 900, 34),  // the face trails the body (secondary motion)
    faceTilt: spring(0, 900, 34),
    // mutations (see "Mutations" below)
    tint: spring(0, 70, 13),    // 0 normal colours .. 1 fully the mutation palette
    blocky: spring(0, 180, 16), // 0 round blob .. 1 boxy robot
    glitch: spring(0, 500, 32), // 0 .. 1 slice-split + neon outline
    // cheek shape (see drawCheeks)
    cheekSag: spring(0, 90, 9),  // cheeks droop down (melt, slime)
    cheekFlat: spring(0, 160, 14), // cheeks squash flat (spins, blasts)
    // stunts (see "Stunts")
    melt: spring(0, 70, 7),       // 0 .. 1 puddle; low damping = gooey snap-back
    ooze: spring(0, 110, 7),      // slime drip length
    eyePop: spring(0, 130, 5),    // 푸푸 letters out on stalks; very bouncy
    mech: spring(0, 160, 18),     // 0 .. 1 robot panels
    pixel: spring(0, 120, 9),     // 0 .. 1 floating pixel blocks
    battery: spring(0, 300, 30),  // 0 .. 1 low-battery mode
    shatter: spring(0, 110, 8),   // 0 .. 1 shards flying apart
  };
  const face = {
    lidL: spring(0, 600, 34), // 0 open .. 1 closed, below 0 = wide open
    lidR: spring(0, 600, 34),
    happy: spring(0, 300, 26), // 0 round eyes .. 1 happy "^" eyes
    pupil: spring(1, 300, 24), // pupil size
    lookX: spring(0, 520, 40), // pupil offset, artwork px
    lookY: spring(0, 520, 40),
    mouthW: spring(0.5, 320, 28), // 0..1 width
    mouthOpen: spring(0.1, 320, 28), // 0..1
    mouthCurve: spring(0.15, 320, 28), // -1 frown .. 1 smile
    tongue: spring(0, 300, 26),
    bang: spring(0, 260, 20), // "!" / "?" indicator size
    ghost: spring(0, 60, 14),
    buttonDown: spring(0, 700, 30),
    glow: spring(0, 200, 20),
  };
  const ALL_SPRINGS = [...Object.values(body), ...Object.values(face)];

  // ---------- Expressions (parametric) ----------
  // The PNG app's eye/mouth names, as numbers. Changing expression just
  // retargets the springs, so faces morph instead of swapping.
  const EYE_SHAPES = {
    normal: { lid: 0, happy: 0, pupil: 1 },
    pupu: { lid: 0, happy: 0, pupil: 1 },
    closed: { lid: 1, happy: 0, pupil: 1 },
    smiling: { lid: 0, happy: 1, pupil: 1 },
    dots: { lid: 0.15, happy: 0, pupil: 0.55 },
    slits: { lid: 0.72, happy: 0, pupil: 1 },
    circles: { lid: -0.25, happy: 0, pupil: 0.45 },
  };
  const MOUTH_SHAPES = {
    normal: { w: 0.45, open: 0.08, curve: 0.2, tongue: 0 },
    smile: { w: 0.85, open: 0.3, curve: 0.9, tongue: 0 },
    closedSmile: { w: 0.7, open: 0, curve: 0.8, tongue: 0 },
    blow: { w: 0.18, open: 0.45, curve: 0, tongue: 0 },
    oh: { w: 0.32, open: 0.75, curve: 0, tongue: 0 },
    wide: { w: 0.9, open: 0.85, curve: 0.3, tongue: 0 },
    lips: { w: 0.22, open: 0.05, curve: 0.35, tongue: 0 },
    tongue: { w: 0.7, open: 0.35, curve: 0.7, tongue: 1 },
    shout: { w: 0.8, open: 1, curve: -0.2, tongue: 0 },
    sing: { w: 0.45, open: 0.6, curve: 0.4, tongue: 0 },
    sad: { w: 0.6, open: 0.04, curve: -0.85, tongue: 0 },
  };
  let baseEyes = EYE_SHAPES.normal;
  let baseMouth = MOUTH_SHAPES.normal;

  // ---------- Reactions ----------
  // What each motion name (motion.js) does here: impulses kick a spring's
  // velocity (one-off physical hits), and a pose holds spring targets for
  // `ms` (body + face overrides) before PUPU relaxes back to idle.
  const REACTIONS = {
    press: { impulse: { squash: -3.2 } },
    bounce: { impulse: { hop: -900, squash: 2 } },
    excited: { impulse: { hop: -700 }, pose: { ms: 600, armL: -0.6, armR: 0.6 } },
    laugh: { impulse: { tilt: 2.5, squash: -1.5 }, pose: { ms: 600, armL: -0.4, armR: 0.4 } },
    "silly-dance": { impulse: { tilt: 4 }, pose: { ms: 1400, armL: -0.7, armR: 0.7 }, wiggle: 1400 },
    sleepy: { pose: { ms: 1400, squash: -0.06, tilt: 0.08, armL: 0.3, armR: -0.3, face: { lid: 0.75 } } },
    yawn: { pose: { ms: 1300, squash: 0.06, face: { lid: 0.6 } } },
    sneeze: { impulse: { squash: 2.5, hop: -300 } },
    distracted: { pose: { ms: 700, tilt: -0.1 }, face: { look: [-1, -0.3] } },
    spin: { impulse: { tilt: 9 } },
    puff: { pose: { ms: 900, cheek: 1, pop: 1.05 } },
    "look-around": { pose: { ms: 800 }, face: { look: [1, 0] }, sweep: 800 },
    surprised: { impulse: { hop: -500 }, pose: { ms: 550, pop: 1.06, face: { lid: -0.2, pupil: 0.5 } } },
    "wake-up": { impulse: { hop: -500, tilt: -2 } },
    "exaggerated-float": { impulse: { hop: -1100 } },
    "soft-wobble": { impulse: { tilt: 2.2 } },
    finish: { impulse: { squash: -1.2 } },
    thinking: { pose: { ms: 1500, tilt: -0.07, face: { look: [0.6, -0.7] } } },
    "idle-brightness-pulse": { impulse: { glow: 6 } },
    "broken-payoff": { pose: { ms: 600, pop: 1.45 } },
    "broken-payoff-shrink": { pose: { ms: 350, pop: 0.6 } },
    "broken-payoff-spin": { impulse: { tilt: 22 } },
    "broken-payoff-squash": { impulse: { squash: -6 } },
    // Card-category reactions (categories.json).
    "lean-in": { pose: { ms: 900, tilt: -0.13, pop: 1.03, hop: 6, face: { pupil: 0.8, look: [-0.5, 0.2] } } },
    "shock-pop": {
      impulse: { hop: -1100, squash: 3.5 },
      pose: { ms: 650, pop: 1.12, armL: -0.9, armR: 0.9, face: { lid: -0.3, pupil: 0.4, mouth: "oh", bang: 1 } },
    },
    "proud-puff": { pose: { ms: 1100, chest: 1, pop: 1.07, hop: -6, armL: 0.35, armR: -0.35, face: { lid: 0.42, happy: 0, mouth: "closedSmile" } } },
    wink: { impulse: { hop: -250 }, pose: { ms: 700, tilt: -0.16, face: { wink: true, mouth: "tongue" } } },
    // Gross / glitch reactions: physical hits plus a mutation (colour /
    // shape change that fades back) and particles.
    fart: {
      impulse: { squash: -4.2, hop: -260 },
      pose: { ms: 900, face: { happy: 0.6, mouth: "closedSmile" } },
      mutation: { ms: 1100, palette: "acid", tint: 0.85 },
      particles: "fart",
    },
    burp: {
      impulse: { hop: -360, tilt: -1.8 },
      pose: { ms: 700, face: { lid: 0.5, mouth: "wide" } },
      mutation: { ms: 900, palette: "acid", tint: 0.9 },
      particles: "burp",
    },
    glitch: {
      impulse: { tilt: 3 },
      pose: { ms: 800, face: { mouth: "shout", pupil: 0.4 } },
      mutation: { ms: 900, palette: "charcoal", tint: 1, blocky: 1, glitch: 1 },
    },
    // Stunts (see "Stunts"): just the opening kick here; the stunt's own
    // timeline does the rest.
    melt: { impulse: { hop: -200 } },
    "slime-drip": { impulse: { squash: -1 } },
    "acid-burp": { impulse: { hop: -300, tilt: -1.4 }, particles: "burp" },
    "eyeball-pop": { impulse: { hop: -420, squash: 2 } },
    "mech-shift": { impulse: { squash: 1.6 } },
    "pixel-deconstruct": { impulse: { hop: -200 } },
    "low-battery": {},
    "rocket-thrust": {},
    "over-inflate": {},
    shatter: { impulse: { hop: -260, squash: 2.4 } },
    "hyper-spin": { impulse: { hop: -500 } },
  };
  // Hard hits can short-circuit PUPU into robot/glitch mode.
  REACTIONS["shock-pop"].glitchChance = 0.35;
  ["broken-payoff", "broken-payoff-shrink", "broken-payoff-spin", "broken-payoff-squash"].forEach((name) => {
    REACTIONS[name].glitchChance = 0.5;
  });

  let pose = null; // { until, def }
  let wiggleUntil = 0;
  let sweepUntil = 0;
  let lastPokeAt = -1e9;
  let effectMark = null; // "!" | "?" | null

  function react(name) {
    if (STUNT_MS[name]) startStunt(name);
    const def = REACTIONS[name];
    if (!def) return;
    const now = performance.now();
    if (name === "press" && now - lastPokeAt < 150) return; // a poke already squished him
    Object.entries(def.impulse || {}).forEach(([key, kick]) => {
      body[key] ? (body[key].velocity += kick * motionScale) : (face[key].velocity += kick * motionScale);
    });
    if (def.pose) pose = { until: now + def.pose.ms, def };
    if (def.wiggle) wiggleUntil = now + def.wiggle;
    if (def.sweep) sweepUntil = now + def.sweep;
    if (def.mutation) mutate(def.mutation);
    if (def.particles) emit(def.particles);
    if (def.glitchChance && Math.random() < def.glitchChance) mutate(REACTIONS.glitch.mutation);
  }

  // ---------- Mutations ----------
  // A temporary change to what PUPU is made of: his body colours blend
  // into another palette (acid green, charcoal), he can turn boxy like a
  // robot, and in glitch mode his picture splits into jittering slices
  // with a neon outline. One at a time; each fades back by itself.
  let mutation = null; // { until, palette, tint, blocky, glitch }
  let palette = "acid";
  function mutate(def) {
    palette = def.palette;
    mutation = { ...def, until: performance.now() + def.ms };
  }

  // ---------- Stunts ----------
  // Big, short transformations with their own timeline (see stuntFrame):
  // gross (melt, slime-drip, acid-burp, eyeball-pop), robot/tech
  // (mech-shift, pixel-deconstruct, low-battery, rocket-thrust) and
  // physics (over-inflate, shatter, hyper-spin). Each lasts as long as
  // its motion in motion.js, so the PNG version and the sound line up.
  const STUNT_MS = {
    melt: 1800, "slime-drip": 1700, "acid-burp": 1300, "eyeball-pop": 1600,
    "mech-shift": 1800, "pixel-deconstruct": 1700, "low-battery": 2200, "rocket-thrust": 2000,
    "over-inflate": 2000, shatter: 1500, "hyper-spin": 1300,
  };
  let stunt = null; // { name, start, ms, fired: {} }
  function startStunt(name) {
    const ms = (typeof PupuMotion !== "undefined" && PupuMotion.MOTIONS[name] && PupuMotion.MOTIONS[name].duration) || STUNT_MS[name];
    stunt = { name, start: performance.now(), ms, fired: {} };
    if (name === "acid-burp") mutate({ ms: ms * 0.9, palette: "neon", tint: 1 });
    if (name === "low-battery") mutate({ ms: ms * 0.85, palette: "charcoal", tint: 0.9 });
    if (name === "mech-shift") mutate({ ms: ms * 0.8, palette: "metal", tint: 0.9, blocky: 1 });
  }
  const easeIn = (x) => x * x;
  const easeOut = (x) => 1 - (1 - x) * (1 - x);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  // Once-per-stunt events at a point in its timeline.
  function once(key, cond, fn) {
    if (cond && !stunt.fired[key]) {
      stunt.fired[key] = true;
      fn();
    }
  }

  // Per-frame stunt state: spring targets plus direct values for things
  // that follow an exact path (rocket flight, spin angle, inflation).
  const stuntNow = { rocketY: 0, spin: 0, inflate: 1, jitter: 0, hidden: false, speedLines: 0, thrusters: 0, scanlines: 0, flicker: 1 };
  function stuntFrame(now, p) {
    Object.assign(stuntNow, { rocketY: 0, spin: 0, inflate: 1, jitter: 0, hidden: false, speedLines: 0, thrusters: 0, scanlines: 0, flicker: 1 });
    body.melt.target = 0;
    body.ooze.target = 0;
    body.eyePop.target = 0;
    body.mech.target = 0;
    body.pixel.target = 0;
    body.battery.target = 0;
    body.shatter.target = 0;
    body.cheekSag.target = 0;
    body.cheekFlat.target = 0;
    if (!stunt) return;
    const t = (now - stunt.start) / stunt.ms;
    if (t >= 1) {
      stunt = null;
      return;
    }
    const k = motionScale;
    switch (stunt.name) {
      case "melt":
        body.melt.target = t < 0.62 ? 1 : 0;
        body.cheekSag.target = t < 0.62 ? 1 : 0;
        break;
      case "slime-drip":
        body.ooze.target = t < 0.6 ? 1 : 0;
        body.cheekSag.target = t < 0.6 ? 0.8 : 0;
        p.squash = t < 0.6 ? -0.14 : 0;
        once("drop", t > 0.6, () => emit("goo-drop"));
        break;
      case "acid-burp":
        p.cheek = t < 0.55 ? 1.8 : 0;
        p.chest = t < 0.55 ? 1 : undefined;
        p.pop = t < 0.55 ? 1.08 : 1;
        p.face = { mouth: t > 0.25 && t < 0.6 ? "wide" : "closedSmile", lid: 0.4 };
        once("goo", t > 0.28, () => emit("goo"));
        break;
      case "eyeball-pop":
        body.eyePop.target = t < 0.62 ? 1 : 0;
        p.face = { mouth: "oh" };
        break;
      case "mech-shift":
        body.mech.target = t < 0.78 ? 1 : 0;
        p.face = { mouth: "closedSmile", lid: 0.25 };
        break;
      case "pixel-deconstruct":
        body.pixel.target = t < 0.58 ? 1 : 0;
        break;
      case "low-battery": {
        body.battery.target = t < 0.82 ? 1 : 0;
        body.pixel.target = t > 0.64 && t < 0.76 ? 0.55 : 0; // 8-bit crash, then reboot
        stuntNow.scanlines = clamp01(Math.min(t / 0.1, (1 - t) / 0.15));
        const seed = Math.floor(now / 70);
        const r = Math.sin(seed * 91.7) * 43758.5453;
        stuntNow.flicker = t > 0.15 && t < 0.82 && r - Math.floor(r) < 0.18 ? 0.25 : 1;
        p.face = { lid: t < 0.82 ? 0.75 : 0, mouth: "sad" };
        p.squash = t < 0.82 ? -0.05 : 0;
        break;
      }
      case "rocket-thrust": {
        // crouch -> blast off the top of the stage -> fall -> crash
        if (t < 0.12) {
          p.squash = -0.16;
        } else if (t < 0.55) {
          stuntNow.rocketY = -1800 * easeIn((t - 0.12) / 0.43) * k;
        } else if (t < 0.84) {
          stuntNow.rocketY = -1800 * (1 - easeIn((t - 0.55) / 0.29)) * k;
        }
        stuntNow.thrusters = t < 0.62 ? clamp01(t / 0.08) : 0;
        if (t > 0.1 && t < 0.58) emit("flame");
        once("crash", t >= 0.84, () => {
          body.squash.velocity -= 6 * k;
          emit("dust");
        });
        p.face = { mouth: t < 0.84 ? "shout" : "wide", lid: -0.2 };
        break;
      }
      case "over-inflate":
        if (t < 0.7) {
          const g = easeIn(t / 0.7);
          stuntNow.inflate = 1 + 0.55 * g * k;
          stuntNow.jitter = g * g * 10 * k;
          p.cheek = 1.6 * g;
          p.face = { mouth: "blow", lid: -0.3 * g };
        } else if (t < 0.86) {
          stuntNow.hidden = true;
          once("pop", true, () => {
            emit("confetti");
            body.pop.value = 0.12;
            body.pop.velocity = 0;
          });
        }
        break;
      case "shatter":
        body.shatter.target = t < 0.38 ? 1 : 0;
        break;
      case "hyper-spin": {
        stuntNow.spin = easeInOut(t) * Math.PI * 2 * 4 * (reducedMotion ? 0.25 : 1);
        stuntNow.speedLines = Math.sin(Math.PI * t);
        body.cheekFlat.target = Math.sin(Math.PI * t);
        p.face = { lid: 0.5, mouth: "wide" };
        break;
      }
    }
  }

  // Particles: fart clouds (billowing out from low behind him) and burp
  // bubbles (from his mouth).
  const particles = [];
  let lastFartAt = -1e9;
  function emit(kind) {
    const now = performance.now();
    if (kind === "fart") {
      if (now - lastFartAt < 300) return; // the PNG fart cloud and the reaction can arrive together
      lastFartAt = now;
      for (let i = 0; i < 11; i++) {
        const side = i % 2 ? 1 : -1;
        // from low behind him, billowing out past his sides where you can see it
        particles.push({
          kind, behind: false, life: 0, maxLife: 1.1 + Math.random() * 0.5,
          x: ANCHOR.x + side * (230 + Math.random() * 60), y: ANCHOR.y - 40 - Math.random() * 50,
          vx: side * (90 + Math.random() * 150), vy: -(20 + Math.random() * 70), r: 22 + Math.random() * 20,
        });
      }
    } else if (kind === "goo") {
      // acid-burp: big goo bubbles shot right across the stage
      for (let i = 0; i < 12; i++) {
        const side = i % 2 ? 1 : -1;
        particles.push({
          kind, behind: false, life: 0, maxLife: 1 + Math.random() * 0.5, gravity: 900,
          x: MOUTH.x + side * 20, y: MOUTH.y,
          vx: side * (380 + Math.random() * 520), vy: -(250 + Math.random() * 420), r: 14 + Math.random() * 22,
        });
      }
    } else if (kind === "goo-drop") {
      particles.push({ kind: "goo", behind: false, life: 0, maxLife: 0.6, gravity: 1400, x: MOUTH.x, y: 640, vx: 0, vy: 120, r: 22 });
    } else if (kind === "flame") {
      // rocket-thrust: fire from both feet (relative to his current flight height)
      [395, 620].forEach((fx) => {
        for (let i = 0; i < 3; i++) {
          particles.push({
            kind, behind: true, life: 0, maxLife: 0.25 + Math.random() * 0.15, gravity: 0,
            x: fx + (Math.random() - 0.5) * 36, y: ANCHOR.y + 60 + stuntNow.rocketY,
            vx: (Math.random() - 0.5) * 100, vy: 220 + Math.random() * 200, r: 26 + Math.random() * 18,
          });
        }
      });
    } else if (kind === "dust") {
      for (let i = 0; i < 14; i++) {
        const side = i % 2 ? 1 : -1;
        particles.push({
          kind, behind: false, life: 0, maxLife: 0.8 + Math.random() * 0.4, gravity: -60,
          x: ANCHOR.x + side * (120 + Math.random() * 160), y: ANCHOR.y + 20,
          vx: side * (200 + Math.random() * 300), vy: -(40 + Math.random() * 120), r: 20 + Math.random() * 20,
        });
      }
    } else if (kind === "confetti") {
      // over-inflate: POP -- a cloud of PUPU-coloured bits
      const colors = ["#fccde3", "#ebb8ef", "#fff0d4", "#c9cbfb", "#ffd9ec"];
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 400;
        particles.push({
          kind, behind: false, life: 0, maxLife: 0.6 + Math.random() * 0.4, gravity: 300,
          x: BODY.cx, y: BODY.cy - 60, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 200,
          r: 10 + Math.random() * 18, color: colors[i % colors.length],
        });
      }
    } else if (kind === "burp") {
      for (let i = 0; i < 7; i++) {
        particles.push({
          kind, behind: false, life: 0, maxLife: 0.7 + Math.random() * 0.4,
          x: MOUTH.x + (Math.random() - 0.5) * 30, y: MOUTH.y,
          vx: (Math.random() - 0.5) * 120, vy: -(140 + Math.random() * 120), r: 7 + Math.random() * 12,
        });
      }
    }
  }
  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.6 * dt; // air drag
      p.r += (p.kind === "fart" || p.kind === "dust" ? 26 : p.kind === "flame" ? -60 : 4) * dt; // clouds spread, flames shrink
      if (p.r < 1) p.life = p.maxLife;
    }
  }
  function drawParticles(behind) {
    particles.forEach((p) => {
      if (p.behind !== behind) return;
      const fade = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha *= fade * (p.kind === "fart" ? 0.8 : 0.8);
      if (p.kind === "fart" || p.kind === "dust") {
        const c = p.kind === "fart" ? "170, 215, 80" : "205, 190, 230";
        ctx.fillStyle = radial(p.x, p.y, 2, p.r, [[0, `rgba(${c}, 1)`], [0.6, `rgba(${c}, 0.7)`], [1, `rgba(${c}, 0)`]]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "flame") {
        ctx.fillStyle = radial(p.x, p.y, 1, p.r, [[0, "rgba(255, 250, 200, 1)"], [0.4, "rgba(255, 190, 60, 0.95)"], [1, "rgba(255, 90, 40, 0)"]]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "goo") {
        ctx.fillStyle = radial(p.x - p.r * 0.3, p.y - p.r * 0.3, 1, p.r * 1.2, [[0, "#eaffb0"], [0.5, "#9df03a"], [1, "#4fb31c"]]);
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 1.2 * unitsPerPx;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(120, 190, 70, 1)";
        ctx.fillStyle = "rgba(210, 250, 160, 0.5)";
        ctx.lineWidth = 1.4 * unitsPerPx;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // A touch at canvas point (x, y), in artwork space: squish down and lean
  // away from the side that was pressed -- the instant physical answer.
  // Four or more pokes within HARD_TAP_WINDOW_MS count as a hard hit:
  // PUPU short-circuits into glitch mode.
  const HARD_TAP_COUNT = 4;
  const HARD_TAP_WINDOW_MS = 1200;
  let recentPokes = [];
  function poke(x) {
    lastPokeAt = performance.now();
    recentPokes = recentPokes.filter((t) => lastPokeAt - t < HARD_TAP_WINDOW_MS).concat(lastPokeAt);
    if (recentPokes.length >= HARD_TAP_COUNT) {
      recentPokes = [];
      // through PupuMotion, so the PNG motion and its sound play too
      const chaos = typeof PupuMotion !== "undefined" && PupuMotion.CHAOS;
      if (chaos && chaos.length) PupuMotion.play(chaos[Math.floor(Math.random() * chaos.length)]);
      else react("glitch");
    }
    body.squash.velocity -= 3.4 * motionScale;
    body.tilt.velocity += ((x - BODY.cx) / BODY.rx) * 1.6 * motionScale;
    face.lidL.velocity += 6;
    face.lidR.velocity += 6;
  }

  // ---------- Pointer tracking ----------
  let canvas = null;
  let ctx = null;
  let pointer = null; // { x, y, at } in artwork space
  // The canvas is bigger than the stage, so PUPU can grow, melt, inflate
  // and fly without being cut off at its edges: PAD is the extra room on
  // each side, as a fraction of the stage size (style.css .pupu-vector
  // must match: left/right -25%, top -92%, width 150%, height 212%).
  const PAD = { l: 0.25, r: 0.25, t: 0.92, b: 0.2 };
  function toArtwork(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1024 * (1 + PAD.l + PAD.r) - PAD.l * 1024,
      y: ((event.clientY - rect.top) / rect.height) * 1024 * (1 + PAD.t + PAD.b) - PAD.t * 1024,
    };
  }

  // ---------- Rubber-band drag ----------
  // Grab PUPU and pull: his body stretches towards your finger like a
  // rubber toy (up to 2.5x his size, pinned on the side facing away from
  // the pull) while his visor leans towards it. Let go and the stretch
  // is handed to a spring with very little damping, so he snaps back,
  // overshoots into a squash, wobbles and settles. A creaky tension sound
  // rises in pitch as you pull; a twang plays on release (audio.js).
  const DRAG_START_PX = 6;      // movement before a press becomes a drag
  const STRETCH_MAX = 1.5;      // extra length: 1 + 1.5 = 2.5x
  const STRETCH_REACH = 380;    // artwork px of pull for ~63% of the max
  const stretch = spring(0, 260, 5); // signed extra length along `axis` (< 0 = squashed)
  const axis = { ux: 0, uy: -1, px: BODY.cx, py: BODY.cy + BODY.bottom }; // pull direction + pinned point
  let drag = null; // { id, start: {x, y}, startPx: {x, y}, active }
  let stretchLimit = STRETCH_MAX;

  // Points around his outline (arms and feet included), for keeping the
  // stretched body inside the canvas.
  const OUTLINE_SAMPLES = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const sn = Math.sin(a);
    return [BODY.cx + Math.cos(a) * 445, BODY.cy + sn * (sn < 0 ? 375 : 340)];
  });
  const stretchScales = (amount) => {
    const along = amount >= 0 ? 1 + amount : 1 / (1 - amount);
    return [along, 1 / Math.sqrt(along)];
  };
  function stretchPoint([x, y], amount) {
    const [along, across] = stretchScales(amount);
    const dx = x - axis.px;
    const dy = y - axis.py;
    const a = dx * axis.ux + dy * axis.uy;
    const cx = dx - a * axis.ux;
    const cy = dy - a * axis.uy;
    return [axis.px + a * along * axis.ux + cx * across, axis.py + a * along * axis.uy + cy * across];
  }
  // The biggest stretch along the current axis that keeps him on the
  // canvas, in his pose right now (squash, tilt, hop and size included).
  function maxStretchForAxis() {
    const margin = 40; // outline width and cheek shine
    const minX = -PAD.l * 1024 + margin;
    const maxX = 1024 * (1 + PAD.r) - margin;
    const minY = -PAD.t * 1024 + margin;
    const maxY = 1024 * (1 + PAD.b) - margin;
    const sy = (1 + body.squash.value) * body.pop.value;
    const sx = body.pop.value / (1 + body.squash.value);
    const cos = Math.cos(body.tilt.value);
    const sin = Math.sin(body.tilt.value);
    const posed = OUTLINE_SAMPLES.map(([x, y]) => {
      const dx = (x - ANCHOR.x) * sx;
      const dy = (y - ANCHOR.y) * sy;
      return [ANCHOR.x + dx * cos - dy * sin, ANCHOR.y + body.hop.value + dx * sin + dy * cos];
    });
    const fits = (amount) => posed.every((pt) => {
      const [x, y] = stretchPoint(pt, amount);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });
    let lo = 0;
    let hi = STRETCH_MAX;
    if (fits(hi)) return hi;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      fits(mid) ? (lo = mid) : (hi = mid);
    }
    return lo;
  }
  // Point the axis along the pull and pin the far side of his body.
  function aimAxis(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    axis.ux = dx / len;
    axis.uy = dy / len;
    const ry = axis.uy < 0 ? BODY.bottom : BODY.top;
    const r = 1 / Math.hypot(axis.ux / BODY.rx, axis.uy / ry);
    axis.px = BODY.cx - axis.ux * r;
    axis.py = BODY.cy - axis.uy * r;
    stretchLimit = maxStretchForAxis();
  }
  function dragTarget() {
    const dx = pointer.x - drag.start.x;
    const dy = pointer.y - drag.start.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return 0;
    aimAxis(dx, dy);
    const amount = STRETCH_MAX * (1 - Math.exp(-len / STRETCH_REACH)) * (reducedMotion ? 0.4 : 1);
    return Math.min(amount, stretchLimit);
  }
  function stretchSound(level) {
    if (typeof PupuAudio !== "undefined" && PupuAudio.stretch) PupuAudio.stretch(level);
  }
  function startDrag(event, at) {
    drag = { id: event.pointerId, start: at, startPx: { x: event.clientX, y: event.clientY }, active: false };
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startPx.x, event.clientY - drag.startPx.y) >= DRAG_START_PX) {
      drag.active = true;
    }
  }
  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const was = drag.active;
    drag = null;
    if (!was) return;
    stretchSound(null);
    // Release: the spring takes over from the stretched shape (and the
    // speed it was moving at), plus a wobble kick for the rebound.
    const amount = stretch.value;
    stretch.target = 0;
    body.tilt.velocity += -axis.ux * amount * 5 * motionScale;
    body.squash.velocity += amount * 2.5 * motionScale;
    face.lidL.velocity += 8;
    face.lidR.velocity += 8;
    if (amount > 0.05 && typeof PupuAudio !== "undefined" && PupuAudio.sfx) PupuAudio.sfx("rubber-snap", Math.min(1, amount / STRETCH_MAX));
  }
  // Called every frame from update().
  function stepStretch(dt) {
    if (drag && drag.active) {
      const target = dragTarget();
      const before = stretch.value;
      stretch.value += (target - stretch.value) * Math.min(1, dt * 30); // follows the finger closely
      stretch.velocity = dt > 0 ? (stretch.value - before) / dt : 0;
      stretch.target = target;
      stretchSound(Math.min(1, stretch.value / STRETCH_MAX));
    }
  }

  // ---------- The chest button ----------
  // Only a tap within BUTTON_HIT_PX (screen pixels) of the centre of the
  // round arrow button on his chest is a "press" (app.js starts a card
  // from it); everywhere else on him only grabs and stretches him. The
  // centre is where the button was last drawn -- wherever he has moved,
  // squashed or stretched to.
  const BUTTON_HIT_PX = 35;
  function isOnButton(event) {
    if (!canvas || !buttonMatrix) return false;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const centre = buttonMatrix.transformPoint(new DOMPoint(BUTTON.x, BUTTON.y)); // canvas pixels
    const buttonX = rect.left + (centre.x / canvas.width) * rect.width;
    const buttonY = rect.top + (centre.y / canvas.height) * rect.height;
    return Math.hypot(event.clientX - buttonX, event.clientY - buttonY) <= BUTTON_HIT_PX;
  }

  // ---------- Per-frame update ----------
  const reducedMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = reducedMotion ? 0.35 : 1;
  const MAX_LOOK = 16; // how far pupils can move, artwork px

  function setTargets(now) {
    const active = pose && now < pose.until ? pose.def : null;
    if (pose && !active) pose = null;
    // A copy, so a stunt can override parts of the pose for this frame.
    const p = { ...((active && active.pose) || {}) };
    stuntFrame(now, p);
    if (drag && drag.active) p.face = { lid: -0.25, pupil: 0.6, mouth: stretch.value > 0.6 ? "shout" : "oh" };
    const pf = p.face || (active && active.face) || {};
    const t = now / 1000;

    // Idle: gentle sine breathing (volume-preserving), shared by everything.
    const breath = Math.sin(t * ((2 * Math.PI) / 3.2));
    body.squash.target = (p.squash || 0) + breath * 0.018 * motionScale;
    body.chest.target = p.chest !== undefined ? p.chest : 0.08 + breath * 0.06 * motionScale;
    body.hop.target = p.hop || 0;
    body.pop.target = p.pop || 1;
    const m = mutation && now < mutation.until ? mutation : null;
    if (mutation && !m) mutation = null;
    body.tint.target = m ? m.tint || 0 : 0;
    body.blocky.target = m ? m.blocky || 0 : 0;
    body.glitch.target = m ? m.glitch || 0 : 0;
    body.cheek.target = p.cheek || 0;
    body.armL.target = (p.armL || 0) + Math.sin(t * 1.3) * 0.04 * motionScale;
    body.armR.target = (p.armR || 0) - Math.sin(t * 1.3 + 0.8) * 0.04 * motionScale;
    let tilt = p.tilt || 0;
    if (now < wiggleUntil) tilt += Math.sin(t * 14) * 0.12 * motionScale;
    body.tilt.target = tilt;
    // The face aims where the body was a moment ago (it lags, then catches up).
    body.faceY.target = body.hop.value;
    body.faceTilt.target = body.tilt.value;

    // Face: base expression from app.js, overridden by the active pose.
    const eyes = baseEyes;
    const lid = pf.lid !== undefined ? pf.lid : eyes.lid;
    face.lidL.target = pf.wink ? 1 : lid;
    face.lidR.target = lid;
    face.happy.target = pf.happy !== undefined ? pf.happy : pf.wink ? 0 : eyes.happy;
    face.pupil.target = pf.pupil !== undefined ? pf.pupil : eyes.pupil;
    const mouth = pf.mouth ? MOUTH_SHAPES[pf.mouth] : baseMouth;
    face.mouthW.target = mouth.w;
    face.mouthOpen.target = mouth.open;
    face.mouthCurve.target = mouth.curve;
    face.tongue.target = mouth.tongue;
    face.bang.target = pf.bang || (effectMark ? 1 : 0);

    // Eyes follow the pointer (clamped), else drift slowly on their own.
    let lookX;
    let lookY;
    if (pf.look) {
      [lookX, lookY] = pf.look;
      if (now < sweepUntil) lookX = Math.sin(((sweepUntil - now) / 800) * Math.PI * 2);
    } else if (pointer && now - pointer.at < 4000) {
      const dx = pointer.x - (EYES[0].x + EYES[1].x) / 2;
      const dy = pointer.y - EYES[0].y;
      const length = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, length / 260); // nearer the eyes = smaller offset
      lookX = (dx / length) * reach;
      lookY = (dy / length) * reach;
    } else {
      lookX = Math.sin(t * 0.37) * 0.35 * motionScale;
      lookY = Math.sin(t * 0.23 + 1) * 0.2 * motionScale;
    }
    face.lookX.target = lookX * MAX_LOOK;
    face.lookY.target = lookY * MAX_LOOK;
  }

  const STEP = 1 / 120;
  let lastFrame = 0;
  let leftover = 0;
  function update(now) {
    setTargets(now);
    let dt = Math.min((now - lastFrame) / 1000, 1 / 20);
    lastFrame = now;
    leftover += dt;
    stepStretch(dt);
    const dragging = drag && drag.active;
    while (leftover >= STEP) {
      ALL_SPRINGS.forEach((s) => stepSpring(s, STEP));
      if (!dragging) stepSpring(stretch, STEP);
      leftover -= STEP;
    }
    if (Math.abs(stretch.value) > 0.002 || dragging) {
      stretchLimit = maxStretchForAxis();
      stretch.value = Math.max(-0.9, Math.min(stretchLimit, stretch.value));
    }
    // Keep the physics sane even after a huge kick.
    body.squash.value = Math.max(-0.35, Math.min(0.35, body.squash.value));
    stepParticles(dt);
  }

  // ---------- Drawing ----------
  function radial(x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    return g;
  }

  // Colour mixing for mutations: blend two "#rrggbb" colours (t = 0..1),
  // and the body gradient's stops towards the current mutation palette.
  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const [ar, ag, ab] = hexRgb(a);
    const [br, bg, bb] = hexRgb(b);
    const k = Math.max(0, Math.min(1, t));
    return `rgb(${Math.round(ar + (br - ar) * k)}, ${Math.round(ag + (bg - ag) * k)}, ${Math.round(ab + (bb - ab) * k)})`;
  }
  function bodyStops() {
    const t = body.tint.value;
    if (t < 0.01) return COLORS.bodyStops;
    return COLORS.bodyStops.map(([at, color], i) => [at, mix(color, PALETTES[palette][i][1], t)]);
  }

  // Artwork units per CSS pixel right now (the canvas is drawn in the
  // artwork's 1024 space, then scaled to its on-screen size).
  let unitsPerPx = 1024 / 232;

  // A soft lilac edge for the visor and button -- definition without
  // adding dark interior lines.
  function softEdge(color, px) {
    ctx.lineWidth = px * unitsPerPx;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  // The body: four cubic Bézier curves around top / right / bottom / left
  // anchors. `chest` pushes the upper curves outwards (proud puff); the
  // bottom is flatter than the top, like PUPU sitting on his feet.
  // `blocky` (robot mode) pulls every handle out towards the corners, so
  // the blob squares up into a rounded box.
  function bodySegments(chest, blocky = 0) {
    const { cx, cy, rx, top, bottom } = BODY;
    const b = Math.max(0, Math.min(1, blocky));
    const k = 0.56 + 0.4 * b;
    const lowK = 0.62 + 0.33 * b;
    const lowX = 0.64 + 0.31 * b;
    const upper = 1 + chest * 0.1;
    return [
      [[cx, cy - top], [cx + rx * k * (1 + chest * 0.35), cy - top], [cx + rx * upper, cy - top * k], [cx + rx * upper, cy]],
      [[cx + rx * upper, cy], [cx + rx, cy + bottom * lowK], [cx + rx * lowX, cy + bottom], [cx, cy + bottom]],
      [[cx, cy + bottom], [cx - rx * lowX, cy + bottom], [cx - rx, cy + bottom * lowK], [cx - rx * upper, cy]],
      [[cx - rx * upper, cy], [cx - rx * upper, cy - top * k], [cx - rx * k * (1 + chest * 0.35), cy - top], [cx, cy - top]],
    ];
  }
  function bodyPath(chest, blocky = 0) {
    const segments = bodySegments(chest, blocky);
    const path = new Path2D();
    path.moveTo(...segments[0][0]);
    segments.forEach(([, c1, c2, end]) => path.bezierCurveTo(...c1, ...c2, ...end));
    path.closePath();
    return path;
  }

  // Melt: the body flattens into a wide puddle around his feet
  // (scaleY 1 -> 0.1, scaleX 1 -> 2.2) with a wave rolling along its top.
  // Baked into the path (not the canvas transform) so the outline keeps
  // its width instead of being squashed to nothing.
  function meltScale(melt) {
    const m = Math.max(-0.25, Math.min(1, melt)); // < 0: the stretchy snap-back
    return [1 + 1.2 * m, 1 - 0.9 * m];
  }
  function meltedBodyPath(chest, blocky, melt, t) {
    const [sx, sy] = meltScale(melt);
    const wave = 16 * Math.max(0, Math.min(1, melt));
    const path = new Path2D();
    bodySegments(chest, blocky).forEach(([p0, c1, c2, p3], segment) => {
      for (let i = segment ? 1 : 0; i <= 24; i++) {
        const u = i / 24;
        const v = 1 - u;
        let x = v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0];
        let y = v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1];
        const topness = Math.max(0, Math.min(1, (ANCHOR.y - 40 - y) / 260)); // only the upper surface ripples
        x = ANCHOR.x + (x - ANCHOR.x) * sx;
        y = ANCHOR.y + (y - ANCHOR.y) * sy + Math.sin(x * 0.022 - t * 7) * wave * topness;
        if (i === 0 && segment === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    });
    path.closePath();
    return path;
  }

  function drawShadow() {
    const lift = Math.max(0, -body.hop.value - stuntNow.rocketY);
    const sx = 1 / (1 + body.squash.value);
    const w = 330 * sx * body.pop.value * stuntNow.inflate * meltScale(body.melt.value)[0] * (1 - Math.min(lift / 400, 0.4));
    ctx.save();
    ctx.globalAlpha = 1 - Math.min(lift / 500, 0.5);
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(ANCHOR.x, ANCHOR.y + 20, w, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Arms and feet: a path, rotated around its pivot.
  function limbPath(x, y, rx, ry, angle, pivotX, pivotY) {
    const path = new Path2D();
    const m = new DOMMatrix().translate(pivotX, pivotY).rotate((angle * 180) / Math.PI).translate(-pivotX, -pivotY);
    const shape = new Path2D();
    shape.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    path.addPath(shape, m);
    return path;
  }

  // The silhouette -- feet, arms and body -- gets ONE outline: every part
  // is stroked first (at twice the width), then all the fills go on top,
  // so only the outer half of the outside edge shows and there are no
  // lines where the parts meet.
  function drawSilhouette(t) {
    const chest = Math.max(0, body.chest.value);
    const melt = body.melt.value;
    const limbAlpha = clamp01(1 - Math.max(0, melt) * 2.2); // arms and feet sink into the puddle
    const limbs = limbAlpha < 0.01 ? [] : [
      limbPath(395, 800, 72, 42, 0, 395, 800),
      limbPath(620, 800, 72, 42, 0, 620, 800),
      limbPath(170, 585, 52, 84, 0.35 + body.armL.value, 215, 520),
      limbPath(842, 585, 52, 84, -0.35 + body.armR.value, 795, 520),
    ];
    const torso = Math.abs(melt) > 0.01 ? meltedBodyPath(chest, body.blocky.value, melt, t) : bodyPath(chest, body.blocky.value);
    const stops = bodyStops();
    ctx.lineJoin = "round";
    ctx.strokeStyle = body.glitch.value > 0.02 ? mix(COLORS.outline, NEON, body.glitch.value) : COLORS.outline;
    ctx.lineWidth = OUTLINE_PX * 2 * unitsPerPx;
    ctx.save();
    ctx.globalAlpha *= limbAlpha;
    limbs.forEach((part) => ctx.stroke(part));
    ctx.restore();
    ctx.stroke(torso);
    ctx.save();
    ctx.globalAlpha *= limbAlpha;
    limbs.forEach((part, i) => {
      const [x, y, r] = i < 2 ? [i ? 620 : 395, 790, 70] : [i === 2 ? 170 : 842, 560, 90];
      ctx.fillStyle = radial(x, y, 4, r * 1.4, stops);
      ctx.fill(part);
    });
    ctx.restore();
    if (Math.abs(melt) > 0.01) {
      const [sx, sy] = meltScale(melt);
      ctx.fillStyle = radial(ANCHOR.x + (560 - ANCHOR.x) * sx, ANCHOR.y + (420 - ANCHOR.y) * sy, 20, 480 * Math.max(sx, sy), stops);
    } else {
      ctx.fillStyle = radial(560, 420, 20, 480, stops);
    }
    ctx.fill(torso);
    if (face.glow.value > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, face.glow.value * 0.15);
      ctx.fillStyle = "#fff";
      ctx.fill(torso);
      ctx.restore();
    }
  }

  function drawButton() {
    const { x, y, r } = BUTTON;
    const down = Math.max(0, Math.min(1, face.buttonDown.value));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.buttonRing;
    ctx.fill();
    softEdge(COLORS.buttonEdge, 1.6);
    ctx.save();
    ctx.translate(x, y + down * 6);
    ctx.scale(1 - down * 0.06, 1 - down * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, down > 0.5 ? COLORS.buttonFace[1] : COLORS.buttonFace[0]);
    g.addColorStop(1, COLORS.buttonFace[1]);
    ctx.fillStyle = g;
    ctx.fill();
    softEdge(COLORS.buttonEdge, 1.2);
    // the up arrow
    ctx.fillStyle = COLORS.arrow;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(42, -8);
    ctx.lineTo(16, -8);
    ctx.lineTo(16, 18);
    ctx.lineTo(-16, 18);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-42, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-16, 28, 32, 8);
    ctx.fillRect(-16, 44, 32, 8);
    ctx.restore();
  }

  // Cheeks: two big round bulges, as on the original artwork. They sit
  // over the visor's lower corners and swell out past the body's edge.
  // Their contour is tapered: a dark line on the outer-lower side that
  // thins and fades to nothing as it curves into the body, so there are no
  // hard lines inside him. Size and shape follow every state: puff
  // (burps, inflating), sag (melt, slime) and flatten (spins, blasts),
  // and they lag a little behind the face on a jump.
  const CHEEKS = [{ x: 282, y: 418, side: -1 }, { x: 730, y: 418, side: 1 }];
  const CHEEK_STOPS = [[0, "#fff0d4"], [0.4, "#fcc9e6"], [0.75, "#f2b0e4"], [1, "#c3a8f0"]];
  const CHEEK_RIM = "#e2b0ec"; // where the tapered contour fades to

  function cheekShape(cheek) {
    const puff = Math.max(0, body.cheek.value);
    const sag = Math.max(-0.3, body.cheekSag.value);
    const flat = Math.max(-0.3, body.cheekFlat.value);
    const lag = Math.max(-1, Math.min(1, (body.faceY.value - body.hop.value) / 14));
    const r = 120 * (1 + 0.28 * puff);
    return {
      x: cheek.x + cheek.side * (puff * 22 + flat * 18),
      y: cheek.y + sag * 52 + lag * 10 + puff * 6,
      rx: r * (1 + 0.22 * flat - 0.08 * sag),
      ry: r * (1 - 0.42 * flat + 0.22 * sag),
      r,
    };
  }

  // One filled band around the cheek whose width follows how much each
  // point faces outwards (full where the cheek bulges out past the body,
  // nothing on the side facing his middle), shaded from the dark outline
  // to a soft lilac -- one shape, so there are no seams.
  function taperedContour(x, y, rx, ry, side) {
    const N = 72;
    const ox = side * 0.99; // outward: away from his middle, barely down
    const oy = 0.15;
    const maxW = OUTLINE_PX * 1.15 * unitsPerPx;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const f = clamp01((c * ox + sn * oy + 0.1) / 0.6);
      const w = maxW * f * f * (3 - 2 * f); // smoothstep taper
      const px = x + c * rx;
      const py = y + sn * ry;
      // normal of the ellipse at this point
      const nx = c / rx;
      const ny = sn / ry;
      const nl = Math.hypot(nx, ny) || 1;
      outer.push([px + (nx / nl) * w * 0.5, py + (ny / nl) * w * 0.5]);
      inner.push([px - (nx / nl) * w * 0.5, py - (ny / nl) * w * 0.5]);
    }
    ctx.beginPath();
    outer.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - side * rx * 0.3, y - ry * 0.2, x + side * rx, y + ry * 0.15);
    g.addColorStop(0, CHEEK_RIM);
    g.addColorStop(0.55, COLORS.outline);
    g.addColorStop(1, COLORS.outline);
    ctx.fillStyle = g;
    ctx.fill("nonzero");
  }

  // Robot mode: angular metal cheek-guards with rivets.
  function cheekGuard(x, y, r, side, amount) {
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      const px = x + Math.cos(a) * r * 0.9;
      const py = y + Math.sin(a) * r * 0.78;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    PALETTES.metal.forEach(([at, color]) => g.addColorStop(at, color));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = OUTLINE_PX * unitsPerPx;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5 * unitsPerPx;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.45);
    ctx.lineTo(x + r * 0.35, y - r * 0.45);
    ctx.stroke();
    ctx.fillStyle = "#5d6878";
    [[-0.55, 0.1], [0.55, 0.1], [0, 0.5]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(x + dx * r * side, y + dy * r, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawCheeks() {
    const tint = clamp01(body.tint.value);
    const mech = clamp01(body.mech.value);
    const stops = tint < 0.01 ? CHEEK_STOPS : CHEEK_STOPS.map(([at, color], i) => [at, mix(color, PALETTES[palette][i][1], tint * 0.85)]);
    CHEEKS.forEach((cheek) => {
      const { x, y, rx, ry, r } = cheekShape(cheek);
      const side = cheek.side;
      if (mech < 0.99) {
        ctx.save();
        ctx.globalAlpha *= 1 - mech;
        ctx.fillStyle = radial(x - side * rx * 0.35, y - ry * 0.4, 6, Math.max(rx, ry) * 1.45, stops);
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        taperedContour(x, y, rx, ry, side);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; // shine, top-outer
        ctx.beginPath();
        ctx.ellipse(x + side * rx * 0.42, y - ry * 0.5, r * 0.16, r * 0.085, -side * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + side * rx * 0.62, y - ry * 0.3, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (mech > 0.01) cheekGuard(x, y, r, side, mech);
    });
  }

  // Slime: a goo drip hanging from (x, y), `len` long.
  function drawDrip(x, y, len, w) {
    if (len < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.bezierCurveTo(x - w * 0.5, y + len * 0.4, x - w * 0.7, y + len * 0.8, x - w * 0.9, y + len);
    ctx.arc(x, y + len, w * 0.95, Math.PI, 0, true);
    ctx.bezierCurveTo(x + w * 0.7, y + len * 0.8, x + w * 0.5, y + len * 0.4, x + w, y);
    ctx.closePath();
    ctx.fillStyle = radial(x - w * 0.3, y + len * 0.7, 2, len * 0.6 + w * 2, [[0, "#eaffb0"], [0.5, "#b4ef5a"], [1, "#78cc2e"]]);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = OUTLINE_PX * 0.8 * unitsPerPx;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(x - w * 0.35, y + len - w * 0.2, w * 0.22, w * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Robot mode: panel seams and rivets on his body.
  function drawMechPanels(amount) {
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.clip(bodyPath(Math.max(0, body.chest.value), body.blocky.value));
    ctx.lineCap = "round";
    const seams = [[[175, 470], [835, 470]], [[175, 715], [835, 715]], [[300, 470], [300, 715]], [[710, 470], [710, 715]], [[505, 160], [505, 225]]];
    [["rgba(70, 80, 98, 0.85)", 0], ["rgba(255, 255, 255, 0.55)", 1.6]].forEach(([color, dy]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 * unitsPerPx;
      ctx.beginPath();
      seams.forEach(([a, b]) => {
        ctx.moveTo(a[0], a[1] + dy * unitsPerPx);
        ctx.lineTo(b[0], b[1] + dy * unitsPerPx);
      });
      ctx.stroke();
    });
    ctx.fillStyle = "#6c7889";
    [[300, 470], [710, 470], [300, 715], [710, 715], [230, 600], [780, 600], [505, 780]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Rocket boots: metal nozzles under his feet (flames are particles).
  function drawThrusters(amount) {
    [395, 620].forEach((x) => {
      const top = 815;
      const h = 60 * amount;
      ctx.beginPath();
      ctx.moveTo(x - 34, top);
      ctx.lineTo(x + 34, top);
      ctx.lineTo(x + 46, top + h);
      ctx.lineTo(x - 46, top + h);
      ctx.closePath();
      const g = ctx.createLinearGradient(x - 46, 0, x + 46, 0);
      g.addColorStop(0, "#5d6878");
      g.addColorStop(0.45, "#e6ebf2");
      g.addColorStop(1, "#5d6878");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineJoin = "round";
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = OUTLINE_PX * unitsPerPx;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 170, 60, 0.9)";
      ctx.beginPath();
      ctx.ellipse(x, top + h, 40, 9 * amount, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Low battery: a flat battery icon above his head, last bar blinking red.
  function drawBattery(amount, t) {
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.translate(505, 92);
    ctx.lineJoin = "round";
    roundedRect(-70, -32, 140, 64, 12);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = COLORS.outline;
    ctx.fillRect(70, -14, 14, 28);
    if (Math.sin(t * 12) > -0.2) {
      ctx.fillStyle = "#ff4d5e";
      ctx.fillRect(-56, -19, 30, 38);
    }
    ctx.restore();
  }

  // Rounded rectangle path (ctx.roundRect is missing on older Safari).
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- The 푸푸 visor ----------
  // PUPU's name is his face, as on the original artwork: two bold 푸
  // letters on a soft visor band. There are no separate pupils -- the
  // letters themselves are the eyes:
  //   look  -> the lettering shifts a little towards the pointer
  //   lid   -> the letter squints (shorter) under an eyelid shade that
  //            comes down from the top of the visor; a wink does this to
  //            the left 푸 only
  //   happy -> the ㅍ's top bar arches up into a "^"
  //   wide  -> (shock: lid < 0 or small "pupil") the letters grow a bit
  // The letter shapes are never covered, so "푸푸" always reads.

  let glyphTransforms = [null, null]; // where each 푸 was last drawn (for tests)
  let glyphSquints = [1, 1];

  // One bold 푸 around (0, 0): ㅍ over ㅜ. `arch` (0..1) bends ㅍ's top
  // bar; `squint` (0.5..1) makes the letter shorter without thinning its
  // strokes, so a squinting letter stays as bold and crisp as an open one.
  function drawPu(arch, squint = 1) {
    const g = {
      ...GLYPH,
      top: GLYPH.top * squint,
      bottom: GLYPH.bottom * squint,
      uBar: GLYPH.uBar * squint,
      // the ㅜ stem keeps most of its length, so a squinting 푸 still reads
      stemEnd: GLYPH.uBar * squint + (GLYPH.stemEnd - GLYPH.uBar) * Math.max(squint, 0.75),
    };
    ctx.strokeStyle = COLORS.glyph;
    ctx.lineWidth = g.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-g.half, g.top + arch * 6);
    ctx.quadraticCurveTo(0, g.top - arch * 20, g.half, g.top + arch * 6); // ㅍ top bar
    ctx.moveTo(-g.post, g.top + 2);
    ctx.lineTo(-g.post, g.bottom);
    ctx.moveTo(g.post, g.top + 2);
    ctx.lineTo(g.post, g.bottom);
    ctx.moveTo(-g.half, g.bottom);
    ctx.lineTo(g.half, g.bottom); // ㅍ bottom bar
    ctx.moveTo(-g.uHalf, g.uBar);
    ctx.lineTo(g.uHalf, g.uBar); // ㅜ bar
    ctx.moveTo(0, g.uBar);
    ctx.lineTo(0, g.stemEnd); // ㅜ stem
    ctx.stroke();
  }

  function visorPath() {
    const { x, y, w, h, r } = VISOR;
    roundedRect(x - w / 2, y - h / 2, w, h, r);
  }

  // The visor band itself (drawn under the cheeks; the letters go on top).
  function drawVisorBand() {
    const { x, y, w, h } = VISOR;
    visorPath();
    const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    g.addColorStop(0, COLORS.visor[0]);
    g.addColorStop(0.5, COLORS.visor[1]);
    g.addColorStop(1, COLORS.visor[2]);
    ctx.fillStyle = g;
    ctx.fill();
    softEdge(COLORS.visorEdge, 1.4);
    ctx.save();
    visorPath();
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    roundedRect(x - w / 2 + 36, y - h / 2 + 10, w - 160, 12, 6);
    ctx.fill();
    // robot mode: green neon circuit lines behind the letters
    const mech = clamp01(body.mech.value);
    if (mech > 0.01) {
      ctx.globalAlpha *= mech;
      ctx.strokeStyle = "#3dff7a";
      ctx.fillStyle = "#3dff7a";
      ctx.lineWidth = 2.4 * unitsPerPx;
      ctx.lineJoin = "round";
      ctx.shadowColor = "#3dff7a";
      ctx.shadowBlur = 6;
      const traces = [
        [[335, 250], [365, 250], [380, 235], [400, 235]],
        [[335, 320], [372, 320], [388, 336], [470, 336]],
        [[677, 245], [640, 245], [624, 229], [600, 229]],
        [[677, 318], [652, 318], [636, 336], [540, 336]],
        [[506, 225], [506, 262], [490, 278]],
      ];
      traces.forEach((points) => {
        ctx.beginPath();
        points.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
        const [ex, ey] = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
    // eyeball-pop: empty sockets where the letters were
    const out = clamp01(body.eyePop.value);
    if (out > 0.02) {
      ctx.save();
      ctx.globalAlpha *= out;
      ctx.fillStyle = "rgba(60, 40, 110, 0.55)";
      EYES.forEach((eye) => {
        ctx.beginPath();
        ctx.ellipse(eye.x, eye.y, 44, 38, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  // The 푸푸 letters (the eyes), over the cheeks. In eyeball-pop they
  // spring out of the visor on stalks, dangle, and snap back.
  function drawGlyphs(t) {
    const { y, h } = VISOR;
    const out = Math.max(0, body.eyePop.value);
    const inVisor = out < 0.02;
    ctx.save();
    if (inVisor) {
      visorPath();
      ctx.clip();
    }
    ctx.globalAlpha *= stuntNow.flicker * (1 - clamp01(body.battery.value) * 0.45);
    const shiftX = (face.lookX.value / MAX_LOOK) * LOOK_SHIFT.x;
    const shiftY = (face.lookY.value / MAX_LOOK) * LOOK_SHIFT.y;
    const wide = Math.max(0, -Math.min(face.lidL.value, face.lidR.value)) * 0.35 + Math.max(0, 1 - face.pupil.value) * 0.14;
    const happy = Math.max(0, Math.min(1, face.happy.value));
    // EYES[0] is the 푸 on screen-left; a wink closes that one (lidL).
    [face.lidL.value, face.lidR.value].forEach((lid, i) => {
      const eye = EYES[i];
      const closed = Math.max(0, Math.min(1, lid));
      const squint = 1 - closed * 0.5; // letters never collapse: still readable at full blink
      const grow = 1 + wide;
      const side = i ? 1 : -1;
      const popX = side * out * 70 + Math.sin(t * 7 + i * 2) * Math.min(out, 1) * 14;
      const popY = -out * 165;
      const gx = eye.x + shiftX + popX;
      const gy = eye.y + shiftY + closed * 6 + popY;
      if (!inVisor) {
        // the stalk, then the eyeball the letter sits on
        const ball = 60 * Math.min(1, out);
        ctx.lineCap = "round";
        const stalk = new Path2D();
        stalk.moveTo(eye.x, eye.y + 8);
        stalk.quadraticCurveTo(eye.x + side * 8, eye.y - 60 * out, gx, gy + ball * 0.6);
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 18 + OUTLINE_PX * 2 * unitsPerPx;
        ctx.stroke(stalk);
        ctx.strokeStyle = "#f4a9d8";
        ctx.lineWidth = 18;
        ctx.stroke(stalk);
        ctx.fillStyle = radial(gx - ball * 0.3, gy - ball * 0.3, 2, ball * 1.2, [[0, "#ffffff"], [0.7, "#f3eefe"], [1, "#d8cdf6"]]);
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = OUTLINE_PX * unitsPerPx;
        ctx.beginPath();
        ctx.arc(gx, gy, ball, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // eyelid shade, from the visor top down to just above the letter:
      // a soft gradient with a rounded lower edge
      if (inVisor && closed > 0.01) {
        const visorTop = y - h / 2;
        const letterTop = gy + (GLYPH.top - GLYPH.stroke / 2) * squint * grow;
        const lidBottom = visorTop + (letterTop - 4 - visorTop) * Math.min(1, closed * 1.15);
        const half = GLYPH.uHalf + 20;
        const shade = ctx.createLinearGradient(0, visorTop, 0, lidBottom + 10);
        shade.addColorStop(0, COLORS.visorLid);
        shade.addColorStop(1, "rgba(180, 162, 234, 0.55)");
        ctx.save();
        ctx.globalAlpha *= Math.min(1, closed * 1.4);
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.moveTo(gx - half, visorTop - 2);
        ctx.lineTo(gx + half, visorTop - 2);
        ctx.lineTo(gx + half, lidBottom - 14);
        ctx.bezierCurveTo(gx + half * 0.55, lidBottom + 10, gx - half * 0.55, lidBottom + 10, gx - half, lidBottom - 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(gx, gy);
      if (!inVisor) ctx.rotate(Math.sin(t * 9 + i * 1.7) * 0.35 * Math.min(out, 1)); // dangling
      ctx.scale(grow, grow);
      glyphTransforms[i] = ctx.getTransform();
      glyphSquints[i] = squint;
      drawPu(happy, squint);
      ctx.restore();
    });
    ctx.restore();
  }

  // Mouth: corners rise with `curve` (smile) and fall when it's negative
  // (frown); the upper and lower lips are cubic Bézier curves pulled
  // out towards the corners, so the gap (`open`) is rounded -- a narrow,
  // very open mouth becomes an "O", a wide one a big grin.
  function drawMouth() {
    const { x, y } = MOUTH;
    const width = face.mouthW.value;
    const half = 14 + 46 * width;
    const open = Math.max(0, face.mouthOpen.value) * 56;
    const curve = face.mouthCurve.value;
    const cornerY = y - curve * 14;
    // a narrow mouth opens upwards more too, so it rounds into an "O"
    const upperY = y + curve * 8 - open * (0.45 + 0.4 * Math.max(0, 1 - width * 2));
    const lowerY = y + curve * 18 + open * 1.05;
    const pull = 0.1 + Math.min(1, open / 30) * 0.45; // how round the ends get
    const lips = new Path2D();
    lips.moveTo(x - half, cornerY);
    lips.bezierCurveTo(x - half * (1 - pull), upperY, x + half * (1 - pull), upperY, x + half, cornerY);
    if (open > 2) {
      lips.bezierCurveTo(x + half * (1 + pull * 0.2), lowerY, x - half * (1 + pull * 0.2), lowerY, x - half, cornerY);
      lips.closePath();
      ctx.fillStyle = COLORS.mouthInside;
      ctx.fill(lips);
      if (face.tongue.value > 0.02) {
        ctx.save();
        ctx.clip(lips);
        ctx.fillStyle = COLORS.tongue;
        ctx.beginPath();
        ctx.ellipse(x + half * 0.2, lowerY - 6, half * 0.45, 18 * face.tongue.value + 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = OUTLINE_PX * 0.9 * unitsPerPx;
    ctx.stroke(lips);
  }

  function drawMark() {
    const size = Math.max(0, face.bang.value);
    if (size < 0.02) return;
    const mark = effectMark === "?" ? "?" : "!";
    ctx.save();
    ctx.translate(820, 170);
    ctx.rotate(0.15);
    ctx.scale(size, size);
    ctx.font = "bold 170px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 14;
    ctx.strokeStyle = COLORS.outline;
    ctx.strokeText(mark, 0, 0);
    ctx.fillStyle = COLORS.bang;
    ctx.fillText(mark, 0, 0);
    ctx.restore();
  }

  let deviceScale = 1; // device pixels per artwork unit
  let buttonMatrix = null; // artwork space -> canvas pixels where the chest button was last drawn
  let baseMatrix = null; // artwork space -> canvas pixels, before PUPU's own moves
  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const stageW = cssW / (1 + PAD.l + PAD.r); // the stage's own size, CSS px
    const scale = (stageW * dpr) / 1024;
    deviceScale = scale;
    unitsPerPx = 1024 / stageW;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(scale, 0, 0, scale, PAD.l * 1024 * scale, PAD.t * 1024 * scale);
    baseMatrix = ctx.getTransform();
    buttonMatrix = null;
    const t = lastFrame / 1000;
    const s = stuntNow;

    ctx.globalAlpha = 1 - Math.max(0, Math.min(1, face.ghost.value)) * 0.55;
    if (!s.hidden) drawShadow();
    drawParticles(true); // rocket flames, behind him

    if (!s.hidden) {
      // Body transform: hop, tilt and volume-preserving squash, all
      // pivoting between the feet; `pop` (and over-inflate) scale the
      // whole of him; hyper-spin turns him around his middle.
      // (a melting body is already as wide as it can go: no extra squash)
      const scaleY = 1 + body.squash.value * (1 - clamp01(body.melt.value));
      const scaleX = 1 / scaleY;
      const size = body.pop.value * s.inflate;
      const jx = s.jitter ? (Math.random() - 0.5) * 2 * s.jitter : 0;
      const jy = s.jitter ? (Math.random() - 0.5) * 2 * s.jitter : 0;
      ctx.save();
      ctx.globalAlpha *= clamp01(1 - (-s.rocketY - 300) / 500); // fades out as he blasts off the top
      if (Math.abs(stretch.value) > 0.002) {
        // rubber-band stretch: scale along the pull axis about the pinned point
        const [along, across] = stretchScales(stretch.value);
        const angle = Math.atan2(axis.uy, axis.ux);
        ctx.translate(axis.px, axis.py);
        ctx.rotate(angle);
        ctx.scale(along, across);
        ctx.rotate(-angle);
        ctx.translate(-axis.px, -axis.py);
      }
      ctx.translate(ANCHOR.x + jx, ANCHOR.y + body.hop.value + s.rocketY + jy);
      ctx.rotate(body.tilt.value);
      ctx.scale(scaleX * size, scaleY * size);
      ctx.translate(-ANCHOR.x, -ANCHOR.y);
      if (s.spin) {
        ctx.translate(BODY.cx, BODY.cy);
        ctx.rotate(s.spin);
        ctx.translate(-BODY.cx, -BODY.cy);
      }

      if (s.thrusters > 0.01) drawThrusters(s.thrusters);
      drawSilhouette(t);
      // Things painted on the body flatten with it when he melts.
      const [meltX, meltY] = meltScale(body.melt.value);
      ctx.save();
      ctx.translate(ANCHOR.x, ANCHOR.y);
      ctx.scale(meltX, meltY);
      ctx.translate(-ANCHOR.x, -ANCHOR.y);
      // crown shine, above the visor
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.ellipse(602, 196, 32, 13, 0.25, 0, Math.PI * 2);
      ctx.fill();
      if (body.mech.value > 0.01) drawMechPanels(clamp01(body.mech.value));
      buttonMatrix = ctx.getTransform(); // for isOnButton()
      drawButton();
      ctx.restore();
      const ooze = Math.max(0, body.ooze.value);
      if (ooze > 0.01) {
        drawDrip(318, 715, ooze * 120, 28);
        drawDrip(700, 730, ooze * 90, 24);
      }

      // The face trails the body: drawn shifted by how far behind it is.
      // When he melts it doesn't flatten: the visor floats on the puddle.
      ctx.save();
      const lagY = Math.max(-14, Math.min(14, body.faceY.value - body.hop.value));
      const lagTilt = Math.max(-0.08, Math.min(0.08, body.faceTilt.value - body.tilt.value));
      const melt = Math.max(-0.25, Math.min(1, body.melt.value));
      const drop = (ANCHOR.y - 340) * (1 - meltY) * 0.85 + Math.sin(t * 4) * 8 * Math.max(0, melt);
      ctx.translate(BODY.cx, 340 + lagY + drop);
      const lean = Math.max(-0.35, Math.min(0.35, axis.ux * Math.max(0, stretch.value) * 0.3)); // visor leans into a pull
      ctx.rotate(lagTilt + lean + Math.sin(t * 3) * 0.06 * Math.max(0, melt));
      ctx.scale(1 + 0.2 * melt, 1 - 0.1 * melt);
      ctx.translate(-BODY.cx, -340);
      drawVisorBand();
      drawCheeks();
      drawGlyphs(t);
      drawMouth();
      if (ooze > 0.01) drawDrip(MOUTH.x + 22, MOUTH.y + 14, ooze * 200, 20); // from his chin
      ctx.restore();
      if (body.battery.value > 0.02) drawBattery(clamp01(body.battery.value), t);
      ctx.restore();
    }

    drawParticles(false); // fart clouds, burp bubbles, goo, dust, confetti
    drawMark();
    ctx.globalAlpha = 1;
    if (s.speedLines > 0.02) drawSpeedLines(s.speedLines, s.spin);
    if (s.scanlines > 0.02) drawScanlines(s.scanlines, t);
    if (body.pixel.value > 0.02) pixelBlocks(Math.min(1, body.pixel.value), t);
    if (body.shatter.value > 0.02) shatterShards(body.shatter.value);
    if (body.glitch.value > 0.04) glitchSlices(body.glitch.value);
  }

  // A copy of the finished frame, for the effects that cut it up.
  const buffers = {};
  function snapshot(key) {
    const w = canvas.width;
    const h = canvas.height;
    let b = buffers[key];
    if (!b) b = buffers[key] = document.createElement("canvas");
    if (b.width !== w || b.height !== h) {
      b.width = w;
      b.height = h;
    }
    const bctx = b.getContext("2d");
    bctx.clearRect(0, 0, w, h);
    bctx.drawImage(canvas, 0, 0);
    return b;
  }
  const hash = (n) => {
    const x = Math.sin(n * 12.9898 + 4.1) * 43758.5453;
    return x - Math.floor(x);
  };

  // Hyper-spin: curved motion-blur lines whipping round him.
  function drawSpeedLines(amount, spin) {
    ctx.save();
    ctx.lineCap = "round";
    const cx = BODY.cx;
    const cy = BODY.cy + body.hop.value + stuntNow.rocketY;
    for (let i = 0; i < 10; i++) {
      const r = 380 + (i % 3) * 38;
      const start = -spin * 0.9 + i * 0.63;
      ctx.strokeStyle = i % 2 ? `rgba(255, 255, 255, ${0.8 * amount})` : `rgba(43, 27, 84, ${0.4 * amount})`;
      ctx.lineWidth = (i % 2 ? 7 : 4) * unitsPerPx;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + 0.5 + 0.5 * amount);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Low battery: old-TV scanlines and a rolling bright band, only where
  // PUPU is (source-atop keeps them off the empty canvas).
  function drawScanlines(amount, t) {
    const w = canvas.width;
    const h = canvas.height;
    const step = Math.max(3, Math.round(4 * deviceScale * unitsPerPx));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(10, 10, 24, ${0.35 * amount})`;
    for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, Math.ceil(step / 2));
    const band = ((t * 0.7) % 1) * h;
    ctx.fillStyle = `rgba(170, 255, 210, ${0.22 * amount})`;
    ctx.fillRect(0, band, w, step * 5);
    ctx.restore();
  }

  // Pixel-deconstruct: the picture breaks into a coarse grid of square
  // blocks (each the average colour of its cell) that drift apart in
  // zero-g, then snap back together.
  let pixelGrid = null;
  function pixelBlocks(amount, t) {
    const w = canvas.width;
    const h = canvas.height;
    const cell = Math.max(4, Math.round(34 * deviceScale));
    const centre = baseMatrix.transformPoint(new DOMPoint(BODY.cx, BODY.cy + body.hop.value));
    const gw = Math.ceil(w / cell);
    const gh = Math.ceil(h / cell);
    const source = snapshot("pixel");
    if (!pixelGrid) pixelGrid = document.createElement("canvas");
    pixelGrid.width = gw;
    pixelGrid.height = gh;
    const gctx = pixelGrid.getContext("2d", { willReadFrequently: true });
    gctx.clearRect(0, 0, gw, gh);
    gctx.drawImage(source, 0, 0, gw * cell, gh * cell, 0, 0, gw, gh);
    const data = gctx.getImageData(0, 0, gw, gh).data;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = clamp01(1 - amount * 1.6);
    ctx.drawImage(source, 0, 0);
    ctx.globalAlpha = clamp01(amount * 1.4);
    const size = cell * (1 - 0.16 * amount);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const k = (gy * gw + gx) * 4;
        if (data[k + 3] < 60) continue;
        const n = gy * gw + gx;
        // drift outwards from the middle, plus a little zero-g bobbing
        const ox = gx * cell - centre.x;
        const oy = gy * cell - centre.y;
        const dx = ox * 0.35 * amount + (hash(n) - 0.5) * cell * 1.6 * amount + Math.sin(t * 2.1 + n) * cell * 0.3 * amount;
        const dy = oy * 0.35 * amount + (hash(n + 999) - 0.5) * cell * 1.6 * amount + Math.cos(t * 1.7 + n) * cell * 0.3 * amount;
        ctx.fillStyle = `rgb(${data[k]}, ${data[k + 1]}, ${data[k + 2]})`;
        ctx.fillRect(gx * cell + dx, gy * cell + dy, size, size);
      }
    }
    ctx.restore();
  }

  // Shatter: the picture splits into 7 wedge-shaped shards around his
  // middle that fly apart, spin, and fly back together.
  function shatterShards(amount) {
    const w = canvas.width;
    const h = canvas.height;
    const source = snapshot("shatter");
    const c = baseMatrix.transformPoint(new DOMPoint(BODY.cx, BODY.cy - 60 + body.hop.value));
    const R = Math.hypot(w, h);
    const N = 7;
    const angles = Array.from({ length: N + 1 }, (_, i) => (i / N) * Math.PI * 2 + 0.3 + (i % N ? (hash(i) - 0.5) * 0.5 : 0));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < N; i++) {
      const a0 = angles[i];
      const a1 = angles[i + 1];
      const mid = (a0 + a1) / 2;
      const dist = amount * (110 + hash(i + 50) * 80) * deviceScale;
      const spin = (hash(i + 80) - 0.5) * 0.9 * amount;
      const px = c.x + Math.cos(mid) * 220 * deviceScale; // roughly the shard's middle
      const py = c.y + Math.sin(mid) * 220 * deviceScale;
      ctx.save();
      ctx.translate(Math.cos(mid) * dist, Math.sin(mid) * dist + amount * amount * 50 * deviceScale);
      ctx.translate(px, py);
      ctx.rotate(spin);
      ctx.translate(-px, -py);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(a0) * R, c.y + Math.sin(a0) * R);
      ctx.lineTo(c.x + Math.cos(a1) * R, c.y + Math.sin(a1) * R);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(source, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Glitch mode: cut the finished picture into a few horizontal bands and
  // shove them sideways by a random amount that changes ~16 times a
  // second -- PUPU "splitting into pieces" like a broken screen.
  function glitchSlices(amount) {
    const w = canvas.width;
    const h = canvas.height;
    const sliceBuffer = snapshot("glitch");
    const seed = Math.floor(lastFrame / 60);
    const rand = (n) => {
      const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 7; i++) {
      const y = Math.floor(rand(i) * h * 0.9);
      const bandH = Math.max(2, Math.floor(h * (0.03 + 0.08 * rand(i + 10))));
      const dx = Math.round((rand(i + 20) - 0.5) * w * 0.14 * amount);
      if (!dx) continue;
      ctx.clearRect(0, y, w, bandH);
      ctx.drawImage(sliceBuffer, 0, y, w, bandH, dx, y, w, bandH);
    }
    ctx.restore();
  }

  // ---------- Loop ----------
  let running = false;
  function frame(now) {
    if (!running) return;
    update(now);
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  // ---------- Mirroring the PNG version (see header) ----------
  function fileName(src) {
    return (src || "").split("/").pop().replace(/\.png$/, "");
  }
  const EYE_FILES = {
    eyes_open: "normal", eyes_closed: "closed", eyes_smiling: "smiling", eyes_dots: "dots",
    eyes_slits: "slits", eyes_circles: "circles", eyes_pupu: "pupu",
  };
  const MOUTH_FILES = {
    mouth_neutral: "normal", mouth_smile: "smile", mouth_blow: "blow", mouth_oh: "oh",
    mouth_wide: "wide", mouth_lips: "lips", mouth_tongue: "tongue", mouth_shout: "shout",
    mouth_closed_smile: "closedSmile", mouth_sing: "sing", mouth_sad: "sad",
  };

  function watch(el, attributes, onChange) {
    if (!el) return;
    new MutationObserver(() => onChange(el)).observe(el, { attributes: true, attributeFilter: attributes });
    onChange(el);
  }

  function mirror(parts) {
    watch(parts.eyes, ["src"], (el) => {
      baseEyes = EYE_SHAPES[EYE_FILES[fileName(el.getAttribute("src"))]] || EYE_SHAPES.normal;
    });
    watch(parts.mouth, ["src"], (el) => {
      baseMouth = MOUTH_SHAPES[MOUTH_FILES[fileName(el.getAttribute("src"))]] || MOUTH_SHAPES.normal;
    });
    watch(parts.button, ["src"], (el) => {
      face.buttonDown.target = fileName(el.getAttribute("src")) === "button_pressed" ? 1 : 0;
    });
    watch(parts.effect, ["src", "class"], (el) => {
      const visible = el.classList.contains("pupu-layer-visible") && !el.classList.contains("pupu-layer-fading");
      const name = fileName(el.getAttribute("src"));
      effectMark = !visible ? null : name === "effect_question" ? "?" : /exclamation|shock/.test(name) ? "!" : null;
      // The PNG fart cloud (e.g. the "puff" reaction): vector fart too.
      if (visible && name === "effect_fart") {
        emit("fart");
        mutate(REACTIONS.fart.mutation);
      }
    });
    watch(parts.ghostWatch, ["class"], (el) => {
      face.ghost.target = el.classList.contains("pupu-ghost-hidden") ? 1 : 0;
    });
    // PupuMotion is a top-level `const` (motion.js), so it is not on
    // `window`; check for it by name.
    if (typeof PupuMotion !== "undefined") {
      const play = PupuMotion.play;
      PupuMotion.play = (name, options) => {
        react(name);
        return play(name, options);
      };
    }
  }

  // ---------- Public ----------
  // mount(canvas, parts): start drawing on `canvas` and mirror the PNG
  // elements in `parts` ({ eyes, mouth, button, effect, ghostWatch, hit }).
  function mount(canvasEl, parts) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    mirror(parts);
    // Eyes follow the pointer: mouse movement, a finger dragging, and --
    // on phones/tablets, which have no hover -- every touch anywhere on
    // the page.
    const follow = (event) => {
      pointer = { ...toArtwork(event), at: performance.now() };
    };
    window.addEventListener("pointermove", follow, { passive: true });
    window.addEventListener("pointerdown", follow, { passive: true });
    // The canvas itself lets touches through (it is bigger than PUPU, see
    // PAD); `parts.hit` -- the stage -- is what you press.
    const hit = parts.hit || canvas;
    hit.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      const at = toArtwork(event);
      pointer = { ...at, at: performance.now() };
      if (isOnButton(event)) {
        poke(at.x); // a button press (app.js starts the card): instant squish, no grab
        return;
      }
      // anywhere else on him is only a grab: moving before letting go stretches him
      startDrag(event, at);
      try {
        hit.setPointerCapture(event.pointerId); // keep the drag when the finger leaves the stage
      } catch (error) {
        /* not supported -- the drag just ends at the stage edge */
      }
    });
    hit.addEventListener("pointermove", (event) => {
      moveDrag(event);
      // pointer over the button, open hand over the rest of him
      if (event.pointerType === "mouse" && !drag) hit.style.cursor = isOnButton(event) ? "pointer" : "";
    });
    hit.addEventListener("pointerup", endDrag);
    hit.addEventListener("pointercancel", endDrag);
    hit.addEventListener("lostpointercapture", endDrag);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }

  // For tests / tinkering in the console.
  function debugState() {
    const values = (group) => Object.fromEntries(Object.entries(group).map(([k, s]) => [k, s.value]));
    return {
      body: values(body),
      face: values(face),
      pose: pose && Object.keys(REACTIONS).find((k) => REACTIONS[k] === pose.def),
      effectMark,
      glyphTransforms: glyphTransforms.map((m) => m && Array.from(m.toFloat64Array())),
      glyphSquints: glyphSquints.slice(),
      mutation: mutation && { palette: mutation.palette, tint: mutation.tint, blocky: mutation.blocky || 0, glitch: mutation.glitch || 0 },
      palette,
      particles: particles.map((p) => p.kind),
      stunt: stunt && stunt.name,
      stuntNow: { ...stuntNow },
      drag: drag && { active: drag.active },
      stretch: { value: stretch.value, velocity: stretch.velocity, limit: stretchLimit, axis: { ...axis } },
    };
  }

  // Points on every stroke of one 푸, relative to its centre, before
  // squinting (multiply y by debugState().glyphSquints[i], then map
  // through glyphTransforms[i]): tests check these are still drawn in
  // letter colour in every expression.
  function glyphSamplePoints() {
    const g = GLYPH;
    return [
      [-g.half + 8, g.top + 2], [g.half - 8, g.top + 2],
      [-g.post, (g.top + g.bottom) / 2], [g.post, (g.top + g.bottom) / 2],
      [-g.half + 8, g.bottom], [0, g.bottom], [g.half - 8, g.bottom],
      [-g.uHalf + 8, g.uBar], [g.uHalf - 8, g.uBar], [0, (g.uBar + g.stemEnd) / 2 + 3],
    ];
  }

  return { mount, react, poke, isOnButton, debugState, glyphSamplePoints, REACTIONS, STUNTS: Object.keys(STUNT_MS), PAD };
})();
