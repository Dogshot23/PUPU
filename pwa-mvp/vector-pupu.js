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
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.6 * dt; // air drag
      p.r += (p.kind === "fart" ? 26 : 4) * dt; // clouds spread
    }
  }
  function drawParticles(behind) {
    particles.forEach((p) => {
      if (p.behind !== behind) return;
      const fade = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha *= fade * (p.kind === "fart" ? 0.8 : 0.8);
      if (p.kind === "fart") {
        ctx.fillStyle = radial(p.x, p.y, 2, p.r, [[0, "rgba(170, 215, 80, 1)"], [0.6, "rgba(170, 215, 80, 0.7)"], [1, "rgba(150, 200, 70, 0)"]]);
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
      react("glitch");
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
  function toArtwork(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1024,
      y: ((event.clientY - rect.top) / rect.height) * 1024,
    };
  }

  // ---------- Per-frame update ----------
  const reducedMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = reducedMotion ? 0.35 : 1;
  const MAX_LOOK = 16; // how far pupils can move, artwork px

  function setTargets(now) {
    const active = pose && now < pose.until ? pose.def : null;
    if (pose && !active) pose = null;
    const p = (active && active.pose) || {};
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
    while (leftover >= STEP) {
      ALL_SPRINGS.forEach((s) => stepSpring(s, STEP));
      leftover -= STEP;
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
  function bodyPath(chest, blocky = 0) {
    const { cx, cy, rx, top, bottom } = BODY;
    const b = Math.max(0, Math.min(1, blocky));
    const k = 0.56 + 0.4 * b;
    const lowK = 0.62 + 0.33 * b;
    const lowX = 0.64 + 0.31 * b;
    const upper = 1 + chest * 0.1;
    const path = new Path2D();
    path.moveTo(cx, cy - top);
    path.bezierCurveTo(cx + rx * k * (1 + chest * 0.35), cy - top, cx + rx * upper, cy - top * k, cx + rx * upper, cy);
    path.bezierCurveTo(cx + rx, cy + bottom * lowK, cx + rx * lowX, cy + bottom, cx, cy + bottom);
    path.bezierCurveTo(cx - rx * lowX, cy + bottom, cx - rx, cy + bottom * lowK, cx - rx * upper, cy);
    path.bezierCurveTo(cx - rx * upper, cy - top * k, cx - rx * k * (1 + chest * 0.35), cy - top, cx, cy - top);
    path.closePath();
    return path;
  }

  function drawShadow() {
    const lift = Math.max(0, -body.hop.value);
    const sx = 1 / (1 + body.squash.value);
    const w = 330 * sx * body.pop.value * (1 - Math.min(lift / 400, 0.4));
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
  function drawSilhouette() {
    const chest = Math.max(0, body.chest.value);
    const limbs = [
      limbPath(395, 800, 72, 42, 0, 395, 800),
      limbPath(620, 800, 72, 42, 0, 620, 800),
      limbPath(170, 585, 52, 84, 0.35 + body.armL.value, 215, 520),
      limbPath(842, 585, 52, 84, -0.35 + body.armR.value, 795, 520),
    ];
    const torso = bodyPath(chest, body.blocky.value);
    const stops = bodyStops();
    ctx.lineJoin = "round";
    ctx.strokeStyle = body.glitch.value > 0.02 ? mix(COLORS.outline, NEON, body.glitch.value) : COLORS.outline;
    ctx.lineWidth = OUTLINE_PX * 2 * unitsPerPx;
    [...limbs, torso].forEach((part) => ctx.stroke(part));
    limbs.forEach((part, i) => {
      const [x, y, r] = i < 2 ? [i ? 620 : 395, 790, 70] : [i === 2 ? 170 : 842, 560, 90];
      ctx.fillStyle = radial(x, y, 4, r * 1.4, stops);
      ctx.fill(part);
    });
    ctx.fillStyle = radial(560, 420, 20, 480, stops);
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

  // Cheeks: soft blush only -- a radial gradient that fades to nothing
  // at its edge, so it melts into the body (no outline), plus a shine.
  function drawCheeks() {
    const r = 112 * (1 + body.cheek.value * 0.18);
    ctx.save();
    ctx.globalAlpha *= 1 - Math.max(0, Math.min(1, body.tint.value)) * 0.75; // the blush fades when he changes colour
    [[312, 432], [700, 432]].forEach(([x, y]) => {
      ctx.fillStyle = radial(x, y - 10, 4, r, [[0, COLORS.cheek[0]], [0.55, COLORS.cheek[1]], [1, COLORS.cheek[2]]]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(x + (x > BODY.cx ? 34 : -34), y - r * 0.42, 18, 10, x > BODY.cx ? 0.4 : -0.4, 0, Math.PI * 2);
      ctx.fill();
    });
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

  function drawVisorAndEyes() {
    const { x, y, w, h, r } = VISOR;
    roundedRect(x - w / 2, y - h / 2, w, h, r);
    const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    g.addColorStop(0, COLORS.visor[0]);
    g.addColorStop(0.5, COLORS.visor[1]);
    g.addColorStop(1, COLORS.visor[2]);
    ctx.fillStyle = g;
    ctx.fill();
    softEdge(COLORS.visorEdge, 1.4);
    ctx.save();
    roundedRect(x - w / 2, y - h / 2, w, h, r);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    roundedRect(x - w / 2 + 36, y - h / 2 + 10, w - 160, 12, 6);
    ctx.fill();

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
      const gx = eye.x + shiftX;
      const gy = eye.y + shiftY + closed * 6;
      // eyelid shade, from the visor top down to just above the letter:
      // a soft gradient with a rounded lower edge
      if (closed > 0.01) {
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

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const size = canvas.clientWidth;
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    const scale = (size * dpr) / 1024;
    unitsPerPx = 1024 / size;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.globalAlpha = 1 - Math.max(0, Math.min(1, face.ghost.value)) * 0.55;
    drawShadow();
    drawParticles(true); // (particles marked `behind`: none at the moment)

    // Body transform: hop, tilt and volume-preserving squash, all pivoting
    // between the feet; `pop` scales the whole of him.
    const scaleY = 1 + body.squash.value;
    const scaleX = 1 / scaleY;
    ctx.save();
    ctx.translate(ANCHOR.x, ANCHOR.y + body.hop.value);
    ctx.rotate(body.tilt.value);
    ctx.scale(scaleX * body.pop.value, scaleY * body.pop.value);
    ctx.translate(-ANCHOR.x, -ANCHOR.y);

    drawSilhouette();
    // crown shine, above the visor
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.ellipse(602, 196, 32, 13, 0.25, 0, Math.PI * 2);
    ctx.fill();

    drawButton();

    // The face trails the body: drawn shifted by how far behind it is.
    ctx.save();
    const lagY = Math.max(-14, Math.min(14, body.faceY.value - body.hop.value));
    const lagTilt = Math.max(-0.08, Math.min(0.08, body.faceTilt.value - body.tilt.value));
    ctx.translate(BODY.cx, 340 + lagY);
    ctx.rotate(lagTilt);
    ctx.translate(-BODY.cx, -340);
    drawCheeks();
    drawVisorAndEyes();
    drawMouth();
    ctx.restore();

    ctx.restore();
    drawParticles(false); // fart clouds and burp bubbles
    drawMark();
    ctx.globalAlpha = 1;
    if (body.glitch.value > 0.04) glitchSlices(body.glitch.value);
  }

  // Glitch mode: cut the finished picture into a few horizontal bands and
  // shove them sideways by a random amount that changes ~16 times a
  // second -- PUPU "splitting into pieces" like a broken screen.
  let sliceBuffer = null;
  function glitchSlices(amount) {
    const w = canvas.width;
    const h = canvas.height;
    if (!sliceBuffer) sliceBuffer = document.createElement("canvas");
    if (sliceBuffer.width !== w || sliceBuffer.height !== h) {
      sliceBuffer.width = w;
      sliceBuffer.height = h;
    }
    const buffer = sliceBuffer.getContext("2d");
    buffer.clearRect(0, 0, w, h);
    buffer.drawImage(canvas, 0, 0);
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
  // elements in `parts` ({ eyes, mouth, button, effect, ghostWatch }).
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
    canvas.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      const at = toArtwork(event);
      pointer = { ...at, at: performance.now() };
      poke(at.x);
    });
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

  return { mount, react, poke, debugState, glyphSamplePoints, REACTIONS };
})();
