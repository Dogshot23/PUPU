// PUPU - Mission data
// This file holds ONLY mission content: little speaking tasks PUPU can
// hand to the child. No state management, animation control, timing,
// or DOM logic lives here -- that stays in script.js. Selection logic
// (which mission gets picked) lives in brain.js.
//
// Loaded as a plain <script> before brain.js and script.js (see
// index.html), so the MISSIONS constant below is available as a
// global, the same way BEHAVIOURS and EVENTS are shared.
//
// Each mission:
// - id:   unique identifier for the mission
// - text: the mission prompt shown in the speech bubble (typed out
//         letter by letter via the existing typewriter effect)
//
// Kept as a flat array so this list can grow to hundreds of entries
// without any change to how missions are picked or displayed --
// Brain.getRandomMission() just needs entries with an id and text.

const MISSIONS = [
  {
    id: "childhood-question",
    text: "Ask your teacher one question about their childhood."
  },
  {
    id: "teach-korean-word",
    text: "Teach your teacher one Korean word."
  },
  {
    id: "true-or-false",
    text: "Tell your teacher one thing that is true and one thing that is false."
  },
  {
    id: "guess-favourite-food",
    text: "Challenge your teacher to guess your favourite food."
  },
  {
    id: "broken-bone",
    text: "Ask your teacher if they have ever broken a bone."
  },
  {
    id: "funniest-dream",
    text: "Tell your teacher your funniest dream."
  },
  {
    id: "make-laugh",
    text: "Make your teacher laugh in under one minute."
  },
  {
    id: "describe-animal",
    text: "Describe an animal without saying its name."
  },
  {
    id: "choose-superpower",
    text: "Ask your teacher what superpower they would choose."
  },
  {
    id: "teach-something",
    text: "Teach your teacher how to do something."
  }
];
