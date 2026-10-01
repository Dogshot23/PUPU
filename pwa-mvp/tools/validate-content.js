#!/usr/bin/env node
// PUPU MVP -- content check for cards.json + categories.json.
// Run from pwa-mvp/:   node tools/validate-content.js
// Exits with code 1 (and lists every problem) if anything is wrong:
//   - every line in every beat has non-empty English, Korean AND Chinese
//     (LANGUAGES below; so they can't drift: a line edited in one must
//     be in all of them)
//   - every category has a name and every box label a translation in
//     each language except English (CATEGORY_LANGUAGES)
//   - each card's beats follow its category's beat roles, in order
//   - every reaction (card beat `react`, category beat `react`,
//     emotionReactions) names a motion that exists in motion.js
//   - favouredReactions name real BUBBLE_REACTIONS ids in app.js
//   - unique card ids, known categories, sensible category settings

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// motion.js expects a browser; give it just enough to build its tables.
function loadMotionNames() {
  const stubElement = {};
  const sandbox = {
    document: { getElementById: () => stubElement },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(`${read("motion.js")}\nthis.__motions = PupuMotion.MOTIONS;`, sandbox);
  return new Set(Object.keys(sandbox.__motions));
}

function loadBubbleReactionIds() {
  const source = read("app.js");
  const block = source.slice(source.indexOf("const BUBBLE_REACTIONS = ["));
  const body = block.slice(0, block.indexOf("];"));
  return new Set([...body.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]));
}

const motions = loadMotionNames();
const bubbleReactionIds = loadBubbleReactionIds();
const { categories, emotionReactions = {} } = JSON.parse(read("categories.json"));
const cards = JSON.parse(read("cards.json"));

const ROLES = ["setup", "reveal", "prompt"];
const LANGUAGES = ["en", "ko", "zh"]; // every card line, all of these
const LANGUAGE_NAMES = { en: "English", ko: "Korean", zh: "Chinese" };
const CATEGORY_LANGUAGES = ["zh"]; // category names / box labels besides English
const checkReaction = (where, name) => {
  if (name !== undefined && !motions.has(name)) fail(where, `reaction "${name}" is not a motion in motion.js`);
};

// ---- categories ----
const categoryById = {};
categories.forEach((category, index) => {
  const where = `categories[${index}] ${category.id || "(no id)"}`;
  if (!category.id) return fail(where, "missing id");
  if (categoryById[category.id]) fail(where, "duplicate id");
  categoryById[category.id] = category;

  if (!["auto", "tap"].includes(category.reveal)) fail(where, `reveal must be "auto" or "tap"`);
  ["en", ...CATEGORY_LANGUAGES].forEach((lang) => {
    if (!category.name || typeof category.name[lang] !== "string" || !category.name[lang].trim()) {
      fail(where, `missing ${LANGUAGE_NAMES[lang]} name (name.${lang})`);
    }
  });
  if (category.weightGroup === undefined && !(category.weight >= 0)) fail(where, "needs a weight (>= 0) or a weightGroup");
  if (!Array.isArray(category.beats) || category.beats.length === 0) return fail(where, "needs at least one beat");
  if (category.beats[0].role !== "setup") fail(where, "first beat must be the setup");

  const roles = new Set();
  category.beats.forEach((beat, i) => {
    const beatWhere = `${where} beat ${i}`;
    if (!ROLES.includes(beat.role)) fail(beatWhere, `role must be one of ${ROLES.join(" / ")}`);
    if (roles.has(beat.role)) fail(beatWhere, `role "${beat.role}" used twice`);
    roles.add(beat.role);
    if (!beat.label) fail(beatWhere, "missing label");
    CATEGORY_LANGUAGES.forEach((lang) => {
      if (!beat.labels || typeof beat.labels[lang] !== "string" || !beat.labels[lang].trim()) {
        fail(beatWhere, `missing ${LANGUAGE_NAMES[lang]} label (labels.${lang})`);
      }
    });
    checkReaction(beatWhere, beat.react);
  });
  (category.favouredReactions || []).forEach((id) => {
    if (!bubbleReactionIds.has(id)) fail(where, `favouredReactions "${id}" is not a BUBBLE_REACTIONS id in app.js`);
  });
});
categories.forEach((category) => {
  if (category.weightGroup && !(categoryById[category.weightGroup] && !categoryById[category.weightGroup].weightGroup)) {
    fail(`category ${category.id}`, `weightGroup "${category.weightGroup}" must be a category with its own weight`);
  }
});
if (!categoryById.fact) fail("categories.json", 'a "fact" category is required (fallback for unknown categories)');
Object.entries(emotionReactions).forEach(([emotion, name]) => checkReaction(`emotionReactions.${emotion}`, name));

// ---- cards ----
const seenIds = new Set();
const cardsPerCategory = {};
let lineCount = 0;
cards.forEach((card, index) => {
  const where = card.sourceId || `cards[${index}]`;
  if (!card.sourceId) fail(where, "missing sourceId");
  else if (seenIds.has(card.sourceId)) fail(where, "duplicate sourceId");
  seenIds.add(card.sourceId);

  const category = categoryById[card.category];
  if (!category) return fail(where, `unknown category "${card.category}"`);
  cardsPerCategory[card.category] = (cardsPerCategory[card.category] || 0) + 1;

  if (!Array.isArray(card.beats) || card.beats.length === 0) return fail(where, "has no beats");
  const expected = category.beats.filter((beat, i) => !(beat.missionFallback && !card.beats.some((b) => b.role === beat.role)));
  const roles = card.beats.map((beat) => beat.role).join(" > ");
  const expectedRoles = expected.map((beat) => beat.role).join(" > ");
  if (roles !== expectedRoles) fail(where, `beats are "${roles}" but category "${category.id}" needs "${expectedRoles}"`);

  card.beats.forEach((beat, i) => {
    const beatWhere = `${where} beat ${i} (${beat.role})`;
    checkReaction(beatWhere, beat.react);
    if (!Array.isArray(beat.lines) || beat.lines.length === 0) return fail(beatWhere, "has no lines");
    beat.lines.forEach((line, j) => {
      lineCount++;
      LANGUAGES.forEach((lang) => {
        if (typeof line[lang] !== "string" || !line[lang].trim()) fail(`${beatWhere} line ${j}`, `missing ${LANGUAGE_NAMES[lang]}`);
      });
    });
  });
  ["english", "type", "sharePrompt"].forEach((oldField) => {
    if (card[oldField] !== undefined) fail(where, `old field "${oldField}" -- text now lives in beats`);
  });
});

// ---- report ----
console.log(`Cards: ${cards.length} (${lineCount} lines, each needs ${LANGUAGES.map((l) => LANGUAGE_NAMES[l]).join(" + ")})`);
categories.forEach((category) => {
  console.log(`  ${category.id.padEnd(18)} ${String(cardsPerCategory[category.id] || 0).padStart(3)} cards`);
});
console.log(`Motions available in motion.js: ${motions.size}`);
if (errors.length) {
  console.log(`\n✗ ${errors.length} problem(s):`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}
console.log("\n✓ All content checks passed.");
