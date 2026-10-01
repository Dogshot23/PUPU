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
    outline: "#382e6a",
    bodyStops: [
      [0, "#fff0d4"],   // warm peach centre
      [0.45, "#fccde3"], // pink
      [0.78, "#ebb8ef"], // lilac pink
      [1, "#c9cbfb"],   // blue-lilac rim
    ],
    cheek: ["#ffd9ec", "#f1b4e4", "#d9b1f2"],
    visor: ["#d9c9fb", "#c7dcff"],
    visorLid: "#b8a5ec",
    eyeWhite: "#ffffff",
    pupil: "#2f2763",
    glyph: "#2a2775", // the 푸푸 lettering
    mouthInside: "#8c3c66",
    tongue: "#f58fb3",
    buttonRing: "#d8c9f5",
    buttonFace: ["#ffffff", "#e7e0fb"],
    arrow: "#b4a2e6",
    shadow: "rgba(150, 130, 220, 0.55)",
    bang: "#ffd84d",
  };

  // Layout in artwork space (see body.png).
  const ANCHOR = { x: 505, y: 815 }; // between the feet: squash/tilt pivot
  const BODY = { cx: 505, cy: 520, rx: 330, top: 335, bottom: 290 };
  // The visor and its "푸푸" lettering. Each 푸 is ㅍ over ㅜ; the closed box
  // inside each ㅍ is that eye's socket (see "The 푸푸 visor" below).
  const VISOR = { x: 506, y: 262, w: 392, h: 168, r: 74 };
  const GLYPH = {
    stroke: 17,
    half: 58, // half-width of ㅍ's top/bottom bars
    post: 34, // ㅍ's two upright strokes sit at x ± post
    top: 202, // ㅍ top bar
    bottom: 282, // ㅍ bottom bar
    uBar: 307, // ㅜ bar
    uHalf: 64,
    stemEnd: 334, // ㅜ stem
  };
  const EYES = [{ x: 416, y: (202 + 282) / 2 }, { x: 596, y: (202 + 282) / 2 }]; // the two 푸, left to right on screen
  const MOUTH = { x: 506, y: 388 };
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
  };

  let pose = null; // { until, def }
  let wiggleUntil = 0;
  let sweepUntil = 0;
  let lastPokeAt = -1e9;
  let effectMark = null; // "!" | "?" | null

  function react(name) {
    const def = REACTIONS[name];
    if (!def) return;
    if (name === "press" && performance.now() - lastPokeAt < 150) return; // a poke already squished him
    Object.entries(def.impulse || {}).forEach(([key, kick]) => {
      body[key] ? (body[key].velocity += kick * motionScale) : (face[key].velocity += kick * motionScale);
    });
    if (def.pose) pose = { until: performance.now() + def.pose.ms, def };
    if (def.wiggle) wiggleUntil = performance.now() + def.wiggle;
    if (def.sweep) sweepUntil = performance.now() + def.sweep;
  }

  // A touch at canvas point (x, y), in artwork space: squish down and lean
  // away from the side that was pressed -- the instant physical answer.
  function poke(x) {
    lastPokeAt = performance.now();
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
  }

  // ---------- Drawing ----------
  function radial(x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    return g;
  }

  function outlineFill(fill, width = 10) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = width;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
  }

  // The body: four cubic Bézier curves around top / right / bottom / left
  // anchors. `chest` pushes the upper curves outwards (proud puff); the
  // bottom is flatter than the top, like PUPU sitting on his feet.
  function bodyPath(chest) {
    const { cx, cy, rx, top, bottom } = BODY;
    const k = 0.56;
    const upper = 1 + chest * 0.1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - top);
    ctx.bezierCurveTo(cx + rx * k * (1 + chest * 0.35), cy - top, cx + rx * upper, cy - top * k, cx + rx * upper, cy);
    ctx.bezierCurveTo(cx + rx, cy + bottom * 0.62, cx + rx * 0.64, cy + bottom, cx, cy + bottom);
    ctx.bezierCurveTo(cx - rx * 0.64, cy + bottom, cx - rx, cy + bottom * 0.62, cx - rx * upper, cy);
    ctx.bezierCurveTo(cx - rx * upper, cy - top * k, cx - rx * k * (1 + chest * 0.35), cy - top, cx, cy - top);
    ctx.closePath();
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

  function drawLimb(x, y, rx, ry, angle, pivotX, pivotY) {
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.translate(-pivotX, -pivotY);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    outlineFill(radial(x - rx * 0.3, y - ry * 0.3, 4, Math.max(rx, ry) * 1.3, COLORS.bodyStops), 9);
    ctx.restore();
  }

  function drawButton() {
    const { x, y, r } = BUTTON;
    const down = Math.max(0, Math.min(1, face.buttonDown.value));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    outlineFill(COLORS.buttonRing, 9);
    ctx.save();
    ctx.translate(x, y + down * 6);
    ctx.scale(1 - down * 0.06, 1 - down * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, down > 0.5 ? COLORS.buttonFace[1] : COLORS.buttonFace[0]);
    g.addColorStop(1, COLORS.buttonFace[1]);
    outlineFill(g, 6);
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

  function drawCheeks() {
    const r = 118 * (1 + body.cheek.value * 0.18);
    [[300, 425], [712, 425]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      outlineFill(radial(x - 30, y - 40, 6, r * 1.15, [[0, COLORS.cheek[0]], [0.6, COLORS.cheek[1]], [1, COLORS.cheek[2]]]), 9);
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.3 + (x > BODY.cx ? r * 0.55 : 0), y - r * 0.55, 20, 11, -0.4, 0, Math.PI * 2);
      ctx.fill();
    });
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
  // PUPU's name is his face: each 푸 (ㅍ over ㅜ) is drawn from strokes,
  // and the closed box inside each ㅍ is an eye socket. Inside the box go
  // the eye white, the pupil (following the pointer, kept inside the
  // box), the eyelid, the wink's lash line and the happy "^". The letter
  // strokes are drawn LAST, on top, at full strength -- so whatever the
  // eyes do, "푸푸" stays whole and readable.

  // The inside of one ㅍ box (between its strokes).
  function socketOf(eye) {
    const inset = GLYPH.stroke / 2;
    const x0 = eye.x - GLYPH.post + inset;
    const x1 = eye.x + GLYPH.post - inset;
    const y0 = GLYPH.top + inset;
    const y1 = GLYPH.bottom - inset;
    return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }

  // One eye inside its socket. `lid`: 0 open .. 1 shut (below 0 = wide,
  // shown by the pupil shrinking -- the socket itself never changes, so
  // the letter keeps its shape). `happy` cross-fades to a "^".
  function drawEyeInSocket(eye, lid, happy) {
    const box = socketOf(eye);
    const closed = Math.max(0, Math.min(1, lid));
    const roundAlpha = 1 - happy;
    ctx.save();
    roundedRect(box.x0, box.y0, box.w, box.h, 7);
    ctx.clip();
    // eye white
    ctx.globalAlpha = roundAlpha;
    ctx.fillStyle = COLORS.eyeWhite;
    ctx.fillRect(box.x0, box.y0, box.w, box.h);
    // pupil, kept inside the box
    const pr = 12 * face.pupil.value;
    const roomX = Math.max(0, box.w / 2 - pr - 2);
    const roomY = Math.max(0, box.h / 2 - pr - 2);
    const px = box.cx + (face.lookX.value / MAX_LOOK) * roomX;
    const py = box.cy + (face.lookY.value / MAX_LOOK) * roomY;
    ctx.fillStyle = COLORS.pupil;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px + pr * 0.35, py - pr * 0.4, Math.max(2.5, pr * 0.3), 0, Math.PI * 2);
    ctx.fill();
    // eyelid coming down from the top of the box
    if (closed > 0.01) {
      const edge = box.y0 + closed * box.h;
      ctx.fillStyle = COLORS.visorLid;
      ctx.fillRect(box.x0, box.y0, box.w, edge - box.y0);
      if (closed < 0.92) {
        ctx.strokeStyle = COLORS.glyph;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(box.x0, edge);
        ctx.quadraticCurveTo(box.cx, edge + 6 * (1 - closed), box.x1, edge);
        ctx.stroke();
      } else {
        // shut (blink / wink): a lash curve across the middle
        ctx.strokeStyle = COLORS.glyph;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(box.x0 + 6, box.cy - 2);
        ctx.quadraticCurveTo(box.cx, box.cy + 12, box.x1 - 6, box.cy - 2);
        ctx.stroke();
      }
    }
    // happy "^" (on the visor colour, the white fades out under it)
    if (happy > 0.01) {
      ctx.globalAlpha = happy;
      ctx.fillStyle = COLORS.visorLid;
      ctx.fillRect(box.x0, box.y0, box.w, box.h);
      ctx.strokeStyle = COLORS.glyph;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(box.x0 + 5, box.cy + 9);
      ctx.quadraticCurveTo(box.cx, box.cy - 22, box.x1 - 5, box.cy + 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  // The letter 푸 itself, as strokes: ㅍ (top bar, two uprights, bottom
  // bar) over ㅜ (bar and a stem going down).
  function drawPuGlyph(cx) {
    const g = GLYPH;
    ctx.strokeStyle = COLORS.glyph;
    ctx.lineWidth = g.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    // ㅍ
    ctx.moveTo(cx - g.half, g.top);
    ctx.lineTo(cx + g.half, g.top);
    ctx.moveTo(cx - g.post, g.top);
    ctx.lineTo(cx - g.post, g.bottom);
    ctx.moveTo(cx + g.post, g.top);
    ctx.lineTo(cx + g.post, g.bottom);
    ctx.moveTo(cx - g.half, g.bottom);
    ctx.lineTo(cx + g.half, g.bottom);
    // ㅜ
    ctx.moveTo(cx - g.uHalf, g.uBar);
    ctx.lineTo(cx + g.uHalf, g.uBar);
    ctx.moveTo(cx, g.uBar);
    ctx.lineTo(cx, g.stemEnd);
    ctx.stroke();
  }

  let glyphTransform = null; // where the lettering was last drawn (for tests)

  function drawVisorAndEyes() {
    const { x, y, w, h, r } = VISOR;
    roundedRect(x - w / 2, y - h / 2, w, h, r);
    const g = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
    g.addColorStop(0, COLORS.visor[0]);
    g.addColorStop(1, COLORS.visor[1]);
    outlineFill(g, 9);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    roundedRect(x - w / 2 + 40, y - h / 2 + 12, w - 170, 14, 7);
    ctx.fill();
    // EYES[0] is the 푸 on screen-left; a wink closes that one (lidL).
    drawEyeInSocket(EYES[0], face.lidL.value, face.happy.value);
    drawEyeInSocket(EYES[1], face.lidR.value, face.happy.value);
    glyphTransform = ctx.getTransform();
    drawPuGlyph(EYES[0].x);
    drawPuGlyph(EYES[1].x);
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
    ctx.lineWidth = 8;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.globalAlpha = 1 - Math.max(0, Math.min(1, face.ghost.value)) * 0.55;
    drawShadow();

    // Body transform: hop, tilt and volume-preserving squash, all pivoting
    // between the feet; `pop` scales the whole of him.
    const scaleY = 1 + body.squash.value;
    const scaleX = 1 / scaleY;
    ctx.save();
    ctx.translate(ANCHOR.x, ANCHOR.y + body.hop.value);
    ctx.rotate(body.tilt.value);
    ctx.scale(scaleX * body.pop.value, scaleY * body.pop.value);
    ctx.translate(-ANCHOR.x, -ANCHOR.y);

    drawLimb(395, 800, 72, 42, 0, 395, 800);
    drawLimb(620, 800, 72, 42, 0, 620, 800);
    drawLimb(170, 585, 52, 84, 0.35 + body.armL.value, 215, 520);
    drawLimb(842, 585, 52, 84, -0.35 + body.armR.value, 795, 520);

    bodyPath(Math.max(0, body.chest.value));
    outlineFill(radial(560, 420, 20, 470, COLORS.bodyStops), 11);
    if (face.glow.value > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, face.glow.value * 0.15);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.restore();
    }
    // top shine
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.ellipse(612, 222, 34, 15, 0.25, 0, Math.PI * 2);
    ctx.fill();

    drawButton();

    // The face trails the body: drawn shifted by how far behind it is.
    ctx.save();
    const lagY = Math.max(-14, Math.min(14, body.faceY.value - body.hop.value));
    const lagTilt = Math.max(-0.08, Math.min(0.08, body.faceTilt.value - body.tilt.value));
    ctx.translate(BODY.cx, 330 + lagY);
    ctx.rotate(lagTilt);
    ctx.translate(-BODY.cx, -330);
    drawCheeks();
    drawVisorAndEyes();
    drawMouth();
    ctx.restore();

    ctx.restore();
    drawMark();
    ctx.globalAlpha = 1;
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
      glyphTransform: glyphTransform && Array.from(glyphTransform.toFloat64Array()),
    };
  }

  // Points on every stroke of both 푸 (artwork space): tests check these
  // are still drawn in letter colour in every expression.
  function glyphSamplePoints() {
    const g = GLYPH;
    return EYES.flatMap((eye) => {
      const cx = eye.x;
      return [
        [cx - g.half + 6, g.top], [cx + g.half - 6, g.top], [cx, g.top],
        [cx - g.post, (g.top + g.bottom) / 2], [cx + g.post, (g.top + g.bottom) / 2],
        [cx - g.half + 6, g.bottom], [cx, g.bottom], [cx + g.half - 6, g.bottom],
        [cx - g.uHalf + 6, g.uBar], [cx + g.uHalf - 6, g.uBar], [cx, (g.uBar + g.stemEnd) / 2 + 4],
      ];
    });
  }

  return { mount, react, poke, debugState, glyphSamplePoints, REACTIONS };
})();
