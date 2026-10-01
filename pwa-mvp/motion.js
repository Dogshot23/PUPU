// PUPU MVP -- motion.js
// Every body/arm movement PUPU makes, played with the browser's own Web
// Animations API (element.animate) -- no library. Loaded before app.js,
// which drives it through the one global this file defines: PupuMotion.
//
// Why this exists (it replaces the old ".pupu-circle.pupu-<name>" CSS
// classes): a CSS class can only set ONE `animation` on an element, so
// every reaction used to replace PUPU's breathing -- he froze mid-breath,
// reacted, then snapped back. Here breathing is a continuous animation
// and every reaction is layered on top of it with composite: "add", so
// he keeps breathing straight through a bounce. (A browser without
// composite support simply lets the reaction win while it runs; the
// breathing clock keeps going underneath, so it still never resets.)
//
// The layers it moves (see index.html):
//   .pupu-float-wrap   slow up/down float (CSS, style.css)
//   .pupu-sway-wrap    slow side-to-side lean (CSS, style.css)
//   .pupu-squash-wrap  breathing + every reaction below ("body")
//     .pupu-arm-left / .pupu-arm-right   arm swings ("armLeft"/"armRight")
//     .pupu-face        eyes + mouth + item; trails the body slightly
//                       (secondary motion, see "Face follow-through")
//
// To add a reaction: add its keyframes to KEYFRAMES and an entry to
// MOTIONS, then call PupuMotion.play("<name>") from app.js.

const PupuMotion = (() => {
  const bodyEl = document.getElementById("pupu-circle");
  const faceEl = document.getElementById("pupu-face");
  const PARTS = {
    body: bodyEl,
    armLeft: document.getElementById("pupu-arm-left"),
    armRight: document.getElementById("pupu-arm-right"),
  };

  const supported = typeof bodyEl.animate === "function";
  const reducedMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Keyframes ----------
  // Ported unchanged from the @keyframes that used to live in style.css.
  // Each keyframe's easing applies from that keyframe to the next, the
  // same way a CSS animation-timing-function does; a keyframe without
  // its own easing uses its motion's `easing` below.
  const KEYFRAMES = {
    "breathe": [
      { offset: 0, transform: "scale(1)" },
      { offset: 0.35, transform: "scale(1.04)" },
      { offset: 0.42, transform: "scale(1.04)" },
      { offset: 0.75, transform: "scale(1)" },
      { offset: 1, transform: "scale(1)" }
    ],
    "bounce": [
      { offset: 0, transform: "scale(1) translateY(0)" },
      { offset: 0.3, transform: "scale(1.08, 0.92) translateY(-14px)" },
      { offset: 0.55, transform: "scale(0.95, 1.05) translateY(4px)" },
      { offset: 0.75, transform: "scale(1.03, 0.97) translateY(-4px)" },
      { offset: 1, transform: "scale(1) translateY(0)" }
    ],
    "arm-up-left": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.5, transform: "rotate(-8deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "arm-up-right": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.5, transform: "rotate(8deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "sneeze": [
      { offset: 0, transform: "scale(1) translateY(0)" },
      { offset: 0.3, transform: "scale(0.94, 1.06) translateY(2px)" },
      { offset: 0.5, transform: "scale(1.1, 0.9) translateY(-6px)" },
      { offset: 0.7, transform: "scale(0.98, 1.02) translateY(2px)" },
      { offset: 1, transform: "scale(1) translateY(0)" }
    ],
    "arm-flick-left": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.3, transform: "rotate(10deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "arm-flick-right": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.3, transform: "rotate(-10deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "distracted-body": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.3, transform: "rotate(5deg)" },
      { offset: 0.7, transform: "rotate(5deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "excited": [
      { offset: 0, transform: "scale(1) rotate(0deg)" },
      { offset: 0.2, transform: "scale(1.06) rotate(-6deg)" },
      { offset: 0.4, transform: "scale(1.1) rotate(6deg)" },
      { offset: 0.6, transform: "scale(1.06) rotate(-4deg)" },
      { offset: 0.8, transform: "scale(1.08) rotate(4deg)" },
      { offset: 1, transform: "scale(1) rotate(0deg)" }
    ],
    "sleepy": [
      { offset: 0, transform: "translateY(0) rotate(0deg)" },
      { offset: 0.4, transform: "translateY(10px) rotate(6deg)" },
      { offset: 0.7, transform: "translateY(12px) rotate(6deg)" },
      { offset: 1, transform: "translateY(0) rotate(0deg)" }
    ],
    "arm-down-left": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.4, transform: "rotate(6deg)" },
      { offset: 0.7, transform: "rotate(6deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "arm-down-right": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.4, transform: "rotate(-6deg)" },
      { offset: 0.7, transform: "rotate(-6deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "thinking-body": [
      { offset: 0, transform: "rotate(0deg) translateY(0)" },
      { offset: 0.5, transform: "rotate(-4deg) translateY(-2px)" },
      { offset: 1, transform: "rotate(0deg) translateY(0)" }
    ],
    "finish": [
      { offset: 0, transform: "scale(1) translateY(0)" },
      { offset: 0.4, transform: "scale(1.03) translateY(-4px)" },
      { offset: 1, transform: "scale(1) translateY(0)" }
    ],
    "laugh": [
      { offset: 0, transform: "translateY(0) rotate(0deg)" },
      { offset: 0.15, transform: "translateY(-6px) rotate(-3deg)" },
      { offset: 0.3, transform: "translateY(0) rotate(3deg)" },
      { offset: 0.45, transform: "translateY(-6px) rotate(-3deg)" },
      { offset: 0.6, transform: "translateY(0) rotate(3deg)" },
      { offset: 0.8, transform: "translateY(-3px) rotate(0deg)" },
      { offset: 1, transform: "translateY(0) rotate(0deg)" }
    ],
    "broken-payoff": [
      { offset: 0, transform: "scale(1)", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      { offset: 0.222, transform: "scale(1.5)" },
      { offset: 0.611, transform: "scale(1.5)" },
      { offset: 1, transform: "scale(1)" }
    ],
    "broken-payoff-shrink": [
      { offset: 0, transform: "scale(1)" },
      { offset: 0.35, transform: "scale(0.28)" },
      { offset: 0.6, transform: "scale(0.28)" },
      { offset: 1, transform: "scale(1)" }
    ],
    "broken-payoff-spin": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.85, transform: "rotate(1080deg)" },
      { offset: 1, transform: "rotate(1080deg)" }
    ],
    "broken-payoff-squash": [
      { offset: 0, transform: "scale(1, 1)" },
      { offset: 0.3, transform: "scale(1.5, 0.55)" },
      { offset: 0.6, transform: "scale(0.6, 1.45)" },
      { offset: 1, transform: "scale(1, 1)" }
    ],
    "soft-wobble": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.25, transform: "rotate(-4deg)" },
      { offset: 0.55, transform: "rotate(3deg)" },
      { offset: 0.8, transform: "rotate(-1deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "idle-brightness-pulse": [
      { offset: 0, filter: "brightness(1)" },
      { offset: 0.5, filter: "brightness(1.08)" },
      { offset: 1, filter: "brightness(1)" }
    ],
    "spin": [
      { offset: 0, transform: "rotate(0deg) scale(1)" },
      { offset: 0.6, transform: "rotate(360deg) scale(1.05)" },
      { offset: 1, transform: "rotate(360deg) scale(1)" }
    ],
    "puff": [
      { offset: 0, transform: "scale(1)" },
      { offset: 0.4, transform: "scale(1.18)" },
      { offset: 0.7, transform: "scale(0.92)" },
      { offset: 1, transform: "scale(1)" }
    ],
    "look-around": [
      { offset: 0, transform: "rotate(0deg)" },
      { offset: 0.25, transform: "rotate(-8deg)" },
      { offset: 0.6, transform: "rotate(8deg)" },
      { offset: 0.85, transform: "rotate(-3deg)" },
      { offset: 1, transform: "rotate(0deg)" }
    ],
    "yawn": [
      { offset: 0, transform: "scale(1, 1) translateY(0)" },
      { offset: 0.4, transform: "scale(1.05, 1.08) translateY(-4px)" },
      { offset: 0.6, transform: "scale(1.05, 1.08) translateY(-4px)" },
      { offset: 1, transform: "scale(1, 1) translateY(0)" }
    ],
    "surprised": [
      { offset: 0, transform: "scale(1) translateY(0)" },
      { offset: 0.3, transform: "scale(1.15) translateY(-6px)" },
      { offset: 0.6, transform: "scale(0.97) translateY(1px)" },
      { offset: 1, transform: "scale(1) translateY(0)" }
    ],
    "silly-dance": [
      { offset: 0, transform: "translateX(0) rotate(0deg)" },
      { offset: 0.15, transform: "translateX(-6px) rotate(-6deg)" },
      { offset: 0.3, transform: "translateX(6px) rotate(6deg)" },
      { offset: 0.45, transform: "translateX(-6px) rotate(-6deg)" },
      { offset: 0.6, transform: "translateX(6px) rotate(6deg)" },
      { offset: 0.75, transform: "translateX(-3px) rotate(-3deg)" },
      { offset: 0.9, transform: "translateX(3px) rotate(3deg)" },
      { offset: 1, transform: "translateX(0) rotate(0deg)" }
    ],
    "wake-up": [
      { offset: 0, transform: "translateY(10px) rotate(6deg) scale(1)" },
      { offset: 0.5, transform: "translateY(-8px) rotate(-4deg) scale(1.08)" },
      { offset: 1, transform: "translateY(0) rotate(0deg) scale(1)" }
    ],
    "exaggerated-float": [
      { offset: 0, transform: "translateY(0)" },
      { offset: 0.5, transform: "translateY(-16px)" },
      { offset: 1, transform: "translateY(0)" }
    ],
  };

  // New: the instant "squish" when a finger first touches the belly
  // (pointerdown), before anything else in the press sequence happens.
  KEYFRAMES["press-squish"] = [
    { offset: 0, transform: "scale(1) translateY(0)" },
    { offset: 0.3, transform: "scale(1.05, 0.93) translateY(4px)" },
    { offset: 0.65, transform: "scale(0.98, 1.03) translateY(-1px)" },
    { offset: 1, transform: "scale(1) translateY(0)" },
  ];

  // New: card-category reactions (see categories.json). Each starts and
  // ends at rest so it adds cleanly on top of breathing.
  KEYFRAMES["lean-in"] = [ // lean in close, as if sharing a secret
    { offset: 0, transform: "translateY(0) rotate(0deg) scale(1)" },
    { offset: 0.35, transform: "translateY(5px) rotate(-7deg) scale(1.03)" },
    { offset: 0.7, transform: "translateY(5px) rotate(-6deg) scale(1.03)" },
    { offset: 1, transform: "translateY(0) rotate(0deg) scale(1)" },
  ];
  KEYFRAMES["shock-pop"] = [ // a sudden startled pop upwards, then a squashy landing
    { offset: 0, transform: "scale(1) translateY(0)" },
    { offset: 0.15, transform: "scale(0.9, 1.12) translateY(-20px)" },
    { offset: 0.38, transform: "scale(1.12, 0.88) translateY(2px)" },
    { offset: 0.6, transform: "scale(0.97, 1.04) translateY(-3px)" },
    { offset: 1, transform: "scale(1) translateY(0)" },
  ];
  KEYFRAMES["proud-puff"] = [ // puffs himself up, very pleased, then deflates
    { offset: 0, transform: "scale(1) translateY(0) rotate(0deg)" },
    { offset: 0.3, transform: "scale(1.1) translateY(-5px) rotate(2deg)" },
    { offset: 0.7, transform: "scale(1.1) translateY(-5px) rotate(-2deg)" },
    { offset: 1, transform: "scale(1) translateY(0) rotate(0deg)" },
  ];
  KEYFRAMES["wink"] = [ // quick cheeky head tilt and bob
    { offset: 0, transform: "rotate(0deg) translateY(0)" },
    { offset: 0.3, transform: "rotate(-9deg) translateY(-4px)" },
    { offset: 0.6, transform: "rotate(-7deg) translateY(-2px)" },
    { offset: 1, transform: "rotate(0deg) translateY(0)" },
  ];

  // New: gross / glitch reactions. Each frame also carries a `filter`
  // (added on top of nothing), so the PNG PUPU flashes green for a
  // fart/burp and goes dark and cold for a glitch.
  KEYFRAMES["fart"] = [ // sudden comic squish, then a little lift-off
    { offset: 0, transform: "scale(1) translateY(0)", filter: "hue-rotate(0deg)" },
    { offset: 0.12, transform: "scale(1.12, 0.86) translateY(8px)", filter: "hue-rotate(125deg) saturate(1.3)" },
    { offset: 0.32, transform: "scale(0.93, 1.1) translateY(-12px)", filter: "hue-rotate(125deg) saturate(1.3)" },
    { offset: 0.6, transform: "scale(1.03, 0.97) translateY(0)", filter: "hue-rotate(70deg)" },
    { offset: 1, transform: "scale(1) translateY(0)", filter: "hue-rotate(0deg)" },
  ];
  KEYFRAMES["burp"] = [ // a jolt from the belly up, head thrown back
    { offset: 0, transform: "scale(1) translateY(0) rotate(0deg)", filter: "hue-rotate(0deg)" },
    { offset: 0.18, transform: "scale(1.07) translateY(-6px) rotate(-4deg)", filter: "hue-rotate(120deg) saturate(1.5)" },
    { offset: 0.42, transform: "scale(0.97) translateY(2px) rotate(2deg)", filter: "hue-rotate(120deg) saturate(1.5)" },
    { offset: 0.7, transform: "scale(1.01) translateY(0) rotate(-1deg)", filter: "hue-rotate(60deg)" },
    { offset: 1, transform: "scale(1) translateY(0) rotate(0deg)", filter: "hue-rotate(0deg)" },
  ];
  KEYFRAMES["glitch"] = [ // jumpy, broken-robot jitter (each step snaps: easing "steps(1)")
    { offset: 0, transform: "translateX(0) skewX(0deg)", filter: "grayscale(0) brightness(1)" },
    { offset: 0.1, transform: "translateX(7px) skewX(8deg)", filter: "grayscale(1) brightness(0.55) contrast(1.6)" },
    { offset: 0.22, transform: "translateX(-6px) skewX(-6deg)", filter: "grayscale(1) brightness(0.45) contrast(1.8)" },
    { offset: 0.36, transform: "translateX(4px) skewX(0deg)", filter: "grayscale(0.6) hue-rotate(160deg) brightness(0.8)" },
    { offset: 0.5, transform: "translateX(-8px) skewX(10deg)", filter: "grayscale(1) brightness(0.5) contrast(1.6)" },
    { offset: 0.66, transform: "translateX(3px) skewX(-4deg)", filter: "grayscale(1) brightness(0.6)" },
    { offset: 0.82, transform: "translateX(-2px) skewX(0deg)", filter: "grayscale(0.4) brightness(0.85)" },
    { offset: 1, transform: "translateX(0) skewX(0deg)", filter: "grayscale(0) brightness(1)" },
  ];

  // Chaos stunts (vector-pupu.js draws the full versions: melting,
  // eyeballs on stalks, robot panels, pixels, shards...). These are the
  // PNG version's take on each, with the same duration.
  KEYFRAMES["melt"] = [ // slumps into a wide puddle, wobbles, springs back up
    { offset: 0, transform: "scale(1, 1) translateY(0)" },
    { offset: 0.25, transform: "scale(1.9, 0.25) translateY(0)" },
    { offset: 0.45, transform: "scale(2.1, 0.18) translateY(20px)" },
    { offset: 0.6, transform: "scale(1.95, 0.22) translateY(10px)" },
    { offset: 0.75, transform: "scale(0.8, 1.25) translateY(-12px)" },
    { offset: 0.88, transform: "scale(1.08, 0.94) translateY(4px)" },
    { offset: 1, transform: "scale(1, 1) translateY(0)" },
  ];
  KEYFRAMES["slime-drip"] = [ // sags and oozes, then snaps back
    { offset: 0, transform: "scale(1, 1) translateY(0)", filter: "hue-rotate(0deg)" },
    { offset: 0.3, transform: "scale(1.14, 0.86) translateY(12px) skewX(3deg)", filter: "hue-rotate(60deg) saturate(1.2)" },
    { offset: 0.55, transform: "scale(1.18, 0.84) translateY(16px) skewX(-3deg)", filter: "hue-rotate(60deg) saturate(1.2)" },
    { offset: 0.7, transform: "scale(0.9, 1.12) translateY(-8px)", filter: "hue-rotate(20deg)" },
    { offset: 1, transform: "scale(1, 1) translateY(0)", filter: "hue-rotate(0deg)" },
  ];
  KEYFRAMES["acid-burp"] = [ // swells up neon green, BURP
    { offset: 0, transform: "scale(1) rotate(0deg)", filter: "hue-rotate(0deg)" },
    { offset: 0.25, transform: "scale(1.16, 1.08) rotate(0deg)", filter: "hue-rotate(110deg) saturate(2.2) brightness(1.1)" },
    { offset: 0.38, transform: "scale(1.04) translateY(-10px) rotate(-6deg)", filter: "hue-rotate(110deg) saturate(2.2) brightness(1.1)" },
    { offset: 0.6, transform: "scale(1.06) rotate(3deg)", filter: "hue-rotate(110deg) saturate(2)" },
    { offset: 1, transform: "scale(1) rotate(0deg)", filter: "hue-rotate(0deg)" },
  ];
  KEYFRAMES["eyeball-pop"] = [ // a startled jump and a springy wobble
    { offset: 0, transform: "scale(1) translateY(0)" },
    { offset: 0.12, transform: "scale(0.9, 1.15) translateY(-22px)" },
    { offset: 0.3, transform: "scale(1.06, 0.95) translateY(0)" },
    { offset: 0.45, transform: "scale(0.97, 1.04) rotate(4deg)" },
    { offset: 0.6, transform: "scale(1.02, 0.98) rotate(-3deg)" },
    { offset: 0.8, transform: "scale(1) rotate(1deg)" },
    { offset: 1, transform: "scale(1) rotate(0deg)" },
  ];
  KEYFRAMES["mech-shift"] = [ // clunky robot steps, cold metal colours
    { offset: 0, transform: "rotate(0deg) translateY(0)", filter: "grayscale(0) brightness(1)" },
    { offset: 0.12, transform: "rotate(-5deg) translateY(-6px)", filter: "grayscale(0.85) brightness(1.1) contrast(1.2)" },
    { offset: 0.3, transform: "rotate(5deg) translateY(0)", filter: "grayscale(0.85) brightness(1.1) contrast(1.2)" },
    { offset: 0.48, transform: "rotate(-5deg) translateY(-6px)", filter: "grayscale(0.85) brightness(1.1) contrast(1.2)" },
    { offset: 0.66, transform: "rotate(5deg) translateY(0)", filter: "grayscale(0.85) brightness(1.1) contrast(1.2)" },
    { offset: 0.8, transform: "rotate(0deg) translateY(0)", filter: "grayscale(0.4) brightness(1.05)" },
    { offset: 1, transform: "rotate(0deg) translateY(0)", filter: "grayscale(0) brightness(1)" },
  ];
  KEYFRAMES["pixel-deconstruct"] = [ // jerky, blurry 8-bit break-up (easing "steps(1)")
    { offset: 0, transform: "translate(0, 0) scale(1)", filter: "blur(0px) contrast(1)" },
    { offset: 0.1, transform: "translate(6px, -8px) scale(1.04)", filter: "blur(1.5px) contrast(1.6)" },
    { offset: 0.25, transform: "translate(-8px, -14px) scale(1.08)", filter: "blur(2.5px) contrast(1.8)" },
    { offset: 0.4, transform: "translate(8px, -18px) scale(1.1)", filter: "blur(3px) contrast(1.8)" },
    { offset: 0.55, transform: "translate(-4px, -10px) scale(1.05)", filter: "blur(2px) contrast(1.5)" },
    { offset: 0.7, transform: "translate(2px, -2px) scale(0.98)", filter: "blur(0.5px) contrast(1.2)" },
    { offset: 1, transform: "translate(0, 0) scale(1)", filter: "blur(0px) contrast(1)" },
  ];
  KEYFRAMES["low-battery"] = [ // droops, dims and flickers, crashes, reboots
    { offset: 0, transform: "scale(1) translateY(0)", filter: "grayscale(0) brightness(1)" },
    { offset: 0.15, transform: "scale(1.03, 0.95) translateY(6px)", filter: "grayscale(0.9) brightness(0.55)" },
    { offset: 0.35, transform: "scale(1.04, 0.94) translateY(8px)", filter: "grayscale(0.9) brightness(0.3)" },
    { offset: 0.4, transform: "scale(1.04, 0.94) translateY(8px)", filter: "grayscale(0.9) brightness(0.7)" },
    { offset: 0.6, transform: "scale(1.05, 0.93) translateY(10px)", filter: "grayscale(1) brightness(0.35)" },
    { offset: 0.72, transform: "translateX(5px) scale(1.05, 0.93) translateY(10px)", filter: "grayscale(1) brightness(0.15) contrast(2)" },
    { offset: 0.82, transform: "scale(0.96, 1.06) translateY(-8px)", filter: "grayscale(0) brightness(1.4)" },
    { offset: 1, transform: "scale(1) translateY(0)", filter: "grayscale(0) brightness(1)" },
  ];
  KEYFRAMES["rocket-thrust"] = [ // crouch, blast off the top of the screen, fall back, crash
    { offset: 0, transform: "scale(1) translateY(0)" },
    { offset: 0.12, transform: "scale(1.12, 0.86) translateY(8px)" },
    { offset: 0.2, transform: "scale(0.9, 1.15) translateY(-60px)", easing: "ease-in" },
    { offset: 0.55, transform: "scale(0.9, 1.1) translateY(-900px)", easing: "ease-in" },
    { offset: 0.84, transform: "scale(0.95, 1.05) translateY(0)" },
    { offset: 0.9, transform: "scale(1.3, 0.7) translateY(10px)" },
    { offset: 1, transform: "scale(1) translateY(0)" },
  ];
  KEYFRAMES["over-inflate"] = [ // swells, shakes, POPS (vanishes), pops back in
    { offset: 0, transform: "scale(1) translateX(0)", opacity: 1 },
    { offset: 0.35, transform: "scale(1.25) translateX(0)", opacity: 1 },
    { offset: 0.5, transform: "scale(1.38) translateX(-4px)", opacity: 1 },
    { offset: 0.6, transform: "scale(1.45) translateX(5px)", opacity: 1 },
    { offset: 0.69, transform: "scale(1.55) translateX(-5px)", opacity: 1 },
    { offset: 0.7, transform: "scale(1.8)", opacity: 0 },
    { offset: 0.86, transform: "scale(0.1)", opacity: 0 },
    { offset: 0.94, transform: "scale(1.1)", opacity: 1 },
    { offset: 1, transform: "scale(1)", opacity: 1 },
  ];
  KEYFRAMES["shatter"] = [ // a hard crack: shudder, flash, pieces back together
    { offset: 0, transform: "scale(1) rotate(0deg)", filter: "brightness(1)" },
    { offset: 0.08, transform: "scale(1.1) rotate(-6deg)", filter: "brightness(1.8)" },
    { offset: 0.2, transform: "scale(0.85) rotate(8deg)", filter: "brightness(0.8) contrast(1.4)" },
    { offset: 0.38, transform: "scale(0.9) rotate(-4deg)", filter: "brightness(0.9)" },
    { offset: 0.6, transform: "scale(1.05) rotate(2deg)", filter: "brightness(1.1)" },
    { offset: 1, transform: "scale(1) rotate(0deg)", filter: "brightness(1)" },
  ];
  KEYFRAMES["hyper-spin"] = [ // four full turns, fast in the middle
    { offset: 0, transform: "rotate(0deg) scale(1)", filter: "blur(0px)" },
    { offset: 0.5, transform: "rotate(720deg) scale(1.08, 0.92)", filter: "blur(2px)" },
    { offset: 1, transform: "rotate(1440deg) scale(1)", filter: "blur(0px)" },
  ];

  // ---------- Motions ----------
  // name -> duration (ms), default easing, optional iterations, and
  // which KEYFRAMES each part plays. Names match the `animation` /
  // `motion` values used in app.js's BEHAVIOURS, BUBBLE_REACTIONS and
  // EVENTS data (and the old CSS class names without "pupu-").
  const MOTIONS = {
    "bounce": { duration: 600, easing: "ease-in-out", body: "bounce", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "sneeze": { duration: 500, easing: "ease-in-out", body: "sneeze", armLeft: "arm-flick-left", armRight: "arm-flick-right" },
    "distracted": { duration: 700, easing: "ease-in-out", body: "distracted-body" },
    "excited": { duration: 600, easing: "ease-in-out", body: "excited", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "sleepy": { duration: 1400, easing: "ease-in-out", body: "sleepy", armLeft: "arm-down-left", armRight: "arm-down-right" },
    "thinking": { duration: 1000, easing: "ease-in-out", iterations: Infinity, body: "thinking-body" },
    "finish": { duration: 350, easing: "ease-in-out", body: "finish" },
    "laugh": { duration: 600, easing: "ease-in-out", body: "laugh", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "broken-payoff": { duration: 900, easing: "ease-in-out", body: "broken-payoff" },
    "broken-payoff-shrink": { duration: 700, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", body: "broken-payoff-shrink" },
    "broken-payoff-spin": { duration: 800, easing: "cubic-bezier(0.45, 0, 0.55, 1)", body: "broken-payoff-spin" },
    "broken-payoff-squash": { duration: 700, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", body: "broken-payoff-squash" },
    "soft-wobble": { duration: 500, easing: "ease-in-out", body: "soft-wobble" },
    "idle-brightness-pulse": { duration: 500, easing: "ease-in-out", body: "idle-brightness-pulse" },
    "spin": { duration: 700, easing: "ease-in-out", body: "spin" },
    "puff": { duration: 900, easing: "ease-in-out", body: "puff" },
    "look-around": { duration: 800, easing: "ease-in-out", body: "look-around" },
    "yawn": { duration: 1300, easing: "ease-in-out", body: "yawn" },
    "surprised": { duration: 550, easing: "ease-in-out", body: "surprised" },
    "silly-dance": { duration: 1400, easing: "ease-in-out", body: "silly-dance" },
    "wake-up": { duration: 700, easing: "ease-in-out", body: "wake-up" },
    "exaggerated-float": { duration: 1200, easing: "ease-in-out", body: "exaggerated-float" },
    "press": { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", body: "press-squish" },
    "lean-in": { duration: 900, easing: "ease-in-out", body: "lean-in", armLeft: "arm-up-left" },
    "shock-pop": { duration: 650, easing: "ease-out", body: "shock-pop", armLeft: "arm-flick-left", armRight: "arm-flick-right" },
    "proud-puff": { duration: 1100, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", body: "proud-puff", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "wink": { duration: 700, easing: "ease-in-out", body: "wink", armRight: "arm-up-right" },
    "fart": { duration: 750, easing: "ease-out", body: "fart", armLeft: "arm-flick-left", armRight: "arm-flick-right" },
    "burp": { duration: 650, easing: "ease-out", body: "burp" },
    "glitch": { duration: 700, easing: "steps(1)", body: "glitch" },
    // Chaos stunts (durations = vector-pupu.js STUNT_MS)
    "melt": { duration: 1800, easing: "ease-in-out", body: "melt", armLeft: "arm-down-left", armRight: "arm-down-right" },
    "slime-drip": { duration: 1700, easing: "ease-in-out", body: "slime-drip", armLeft: "arm-down-left", armRight: "arm-down-right" },
    "acid-burp": { duration: 1300, easing: "ease-out", body: "acid-burp", armLeft: "arm-flick-left", armRight: "arm-flick-right" },
    "eyeball-pop": { duration: 1600, easing: "ease-out", body: "eyeball-pop", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "mech-shift": { duration: 1800, easing: "steps(1)", body: "mech-shift" },
    "pixel-deconstruct": { duration: 1700, easing: "steps(1)", body: "pixel-deconstruct" },
    "low-battery": { duration: 2200, easing: "ease-in-out", body: "low-battery", armLeft: "arm-down-left", armRight: "arm-down-right" },
    "rocket-thrust": { duration: 2000, easing: "ease-out", body: "rocket-thrust", armLeft: "arm-up-left", armRight: "arm-up-right" },
    "over-inflate": { duration: 2000, easing: "ease-in", body: "over-inflate" },
    "shatter": { duration: 1500, easing: "ease-out", body: "shatter", armLeft: "arm-flick-left", armRight: "arm-flick-right" },
    "hyper-spin": { duration: 1300, easing: "cubic-bezier(0.65, 0, 0.35, 1)", body: "hyper-spin" },
  };

  // The chaos stunts: what a hard hit, a broken button or (rarely) a
  // card or an idle moment can set off (see app.js).
  const CHAOS = [
    "melt", "slime-drip", "acid-burp", "eyeball-pop",
    "mech-shift", "pixel-deconstruct", "low-battery", "rocket-thrust",
    "over-inflate", "shatter", "hyper-spin",
  ];

  function framesFor(keyframesName, defaultEasing) {
    return KEYFRAMES[keyframesName].map((frame) => ({ ...frame, easing: frame.easing || defaultEasing }));
  }

  // ---------- Breathing (continuous base layer) ----------
  // Started once and never stopped; reactions add on top of it.
  if (supported) {
    bodyEl.animate(framesFor("breathe", "ease-in-out"), { duration: 3200, iterations: Infinity });
  }

  // ---------- Playing reactions ----------
  // Reaction animations that stopAll() may cut short (everything except
  // the press squish, which must survive the press sequence's own
  // stopAll() calls a few milliseconds later).
  const reactions = new Set();
  let activeCount = 0;

  const DONE = Promise.resolve();
  const NO_MOTION = { finished: DONE, cancel() {} };

  // Plays a motion on top of breathing. Returns { finished, cancel }:
  // `finished` resolves when it ends or is cancelled (never rejects).
  // options.keep: true -> not cancelled by stopAll().
  function play(name, options = {}) {
    const motion = MOTIONS[name];
    if (!motion) {
      if (name) console.warn(`PUPU MVP: unknown motion "${name}"`);
      return NO_MOTION;
    }
    // Stunts have their own made-up sound effects (audio.js PupuAudio.sfx).
    if (CHAOS.includes(name) && typeof PupuAudio !== "undefined" && PupuAudio.sfx) PupuAudio.sfx(name);
    if (!supported) return NO_MOTION;

    const timing = {
      duration: motion.duration,
      iterations: motion.iterations || 1,
      composite: "add",
    };
    const animations = Object.keys(PARTS)
      .filter((part) => motion[part])
      .map((part) => PARTS[part].animate(framesFor(motion[part], motion.easing), timing));

    const finished = Promise.all(
      animations.map((animation) => {
        if (!options.keep) reactions.add(animation);
        activeCount++;
        return animation.finished
          .catch(() => {}) // cancel() rejects `finished`; treat it as done
          .then(() => {
            reactions.delete(animation);
            activeCount--;
          });
      })
    ).then(() => {});

    startFaceFollow();
    return { finished, cancel: () => animations.forEach((animation) => animation.cancel()) };
  }

  // Stops every running reaction at once (the old clearBehaviourAnimations()
  // removing all reaction classes). Breathing and the float are untouched.
  function stopAll() {
    reactions.forEach((animation) => animation.cancel());
    reactions.clear();
  }

  // ---------- Face follow-through (secondary motion) ----------
  // While the body is moving, the face group chases where the body was
  // FACE_LAG_MS ago on a small spring, so eyes/mouth trail a bounce and
  // overshoot a little before settling -- the soft-toy feel. It reads
  // the body's actual animated transform each frame, so it works for
  // every motion automatically. Runs only while something is moving,
  // then clears itself; skipped entirely for prefers-reduced-motion.
  const FACE_LAG_MS = 55; // how far behind the body the face aims
  const FACE_STIFFNESS = 2000; // spring pull towards that point
  const FACE_DAMPING = 45; // < 2*sqrt(stiffness): slightly bouncy
  const FACE_FOLLOW = 0.35; // share of that lag actually shown (subtle)
  const FACE_MAX_SHIFT_PX = 6;
  const FACE_MAX_TILT_DEG = 4;
  const HISTORY_MS = 250;

  const AXES = ["x", "y", "r"];
  let history = [];
  let springPos = null;
  let springVel = { x: 0, y: 0, r: 0 };
  let lastFrameTime = 0;
  let rafId = null;

  let lastAngle = 0;
  function readBody() {
    const transform = getComputedStyle(bodyEl).transform;
    if (!transform || transform === "none") return { x: 0, y: 0, r: (lastAngle = 0) };
    const m = new DOMMatrixReadOnly(transform);
    let r = (Math.atan2(m.b, m.a) * 180) / Math.PI;
    // Keep the angle continuous through a full spin (atan2 jumps from
    // +180 to -180), so the face doesn't see a sudden 360-degree change.
    while (r - lastAngle > 180) r -= 360;
    while (r - lastAngle < -180) r += 360;
    lastAngle = r;
    return { x: m.e, y: m.f, r };
  }

  // Body pose at time t, interpolated from the recorded history
  // (oldest first).
  function poseAt(t) {
    for (let i = history.length - 1; i > 0; i--) {
      const before = history[i - 1];
      const after = history[i];
      if (before.t > t) continue;
      if (after.t <= t) return after;
      const k = (t - before.t) / (after.t - before.t);
      const pose = {};
      AXES.forEach((axis) => (pose[axis] = before[axis] + (after[axis] - before[axis]) * k));
      return pose;
    }
    return history[0];
  }

  function clamp(value, limit) {
    return Math.max(-limit, Math.min(limit, value));
  }

  function faceFrame(now) {
    const body = readBody();
    history.push({ t: now, ...body });
    while (history.length > 2 && history[1].t < now - HISTORY_MS) history.shift();

    const target = poseAt(now - FACE_LAG_MS);
    const dt = Math.min(now - lastFrameTime, 32) / 1000;
    lastFrameTime = now;

    let moving = false;
    const offset = {};
    AXES.forEach((axis) => {
      const accel = FACE_STIFFNESS * (target[axis] - springPos[axis]) - FACE_DAMPING * springVel[axis];
      springVel[axis] += accel * dt;
      springPos[axis] += springVel[axis] * dt;
      offset[axis] = (springPos[axis] - body[axis]) * FACE_FOLLOW;
      if (Math.abs(offset[axis]) > 0.02 || Math.abs(springVel[axis]) > 0.5) moving = true;
    });

    if (!moving && activeCount === 0) {
      faceEl.style.transform = "";
      rafId = null;
      return;
    }
    faceEl.style.transform =
      `translate(${clamp(offset.x, FACE_MAX_SHIFT_PX).toFixed(2)}px, ${clamp(offset.y, FACE_MAX_SHIFT_PX).toFixed(2)}px) ` +
      `rotate(${clamp(offset.r, FACE_MAX_TILT_DEG).toFixed(2)}deg)`;
    rafId = requestAnimationFrame(faceFrame);
  }

  function startFaceFollow() {
    if (reducedMotion || !faceEl || rafId !== null) return;
    const now = performance.now();
    const body = readBody();
    history = [{ t: now, ...body }];
    springPos = { ...body };
    springVel = { x: 0, y: 0, r: 0 };
    lastFrameTime = now;
    rafId = requestAnimationFrame(faceFrame);
  }

  return { play, stopAll, MOTIONS, CHAOS };
})();
