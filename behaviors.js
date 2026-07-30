// PUPU - Behaviour data
// This file holds ONLY behaviour content: what PUPU can do once it's
// finished thinking. No state management, animation control, timing,
// or DOM logic lives here -- that all stays in script.js.
//
// Loaded as a plain <script> before script.js (see index.html), so the
// BEHAVIOURS constant below is available as a global, the same way the
// rest of this project shares code without a build step or module
// system.
//
// Each behaviour:
// - id:        unique identifier for the behaviour
// - message:   what appears in the speech bubble (typed out letter by letter)
// - animation: name used to build the CSS class "pupu-<animation>"
//              (the class must exist in style.css)
// - duration:  how long the animation plays before the finishing reaction.
//              Kept for behaviours whose animation should visibly run
//              alongside the typewriter effect.

const BEHAVIOURS = [
  {
    id: "hello",
    message: "Hello!",
    animation: "bounce",
    duration: 1200
  },
  {
    id: "excited",
    message: "I have an idea!",
    animation: "excited",
    duration: 1400
  },
  {
    id: "sleepy",
    message: "Oops... I nearly fell asleep.",
    animation: "sleepy",
    duration: 1600
  },
  {
    id: "laugh",
    message: "Hehehe!",
    animation: "laugh",
    duration: 1200
  }
];
