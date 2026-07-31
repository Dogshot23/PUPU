/**
 * Guard tests.
 *
 * Each case proves one rule refuses something it should refuse. A validator
 * that never rejects is decoration, so these exist to keep the gates honest.
 * Run: node test-guards.js
 */

import { startRun, stage1Feasibility, stage2Engine, stage3Write, stage4Review, stage5Metadata } from './factory.js';
import { createGeneratedCard, moveTo, approve, attachTranslation, nextCardId } from './card.js';
import { validateCard } from './validate.js';
import { compile } from './compiler.js';

let pass = 0;
let fail = 0;

function expectThrow(label, fn) {
  try {
    fn();
    console.log(`FAIL  ${label} — expected a refusal, got none`);
    fail++;
  } catch (e) {
    console.log(`ok    ${label}\n        → ${e.message.split('\n')[0]}`);
    pass++;
  }
}

function expectErrors(label, result, matcher) {
  const hit = result.errors.some((e) => matcher.test(e));
  if (hit) {
    console.log(`ok    ${label}\n        → ${result.errors.find((e) => matcher.test(e))}`);
    pass++;
  } else {
    console.log(`FAIL  ${label} — errors were: ${JSON.stringify(result.errors)}`);
    fail++;
  }
}

const source = {
  id: 'FACT-0042',
  type: 'Fact',
  cefrRange: { min: 'A2', max: 'B1' },
  tags: ['Animals', 'Biology'],
  content: "Sea otters hold hands while they sleep so they don't drift away from each other.",
};

const goodCard = () =>
  createGeneratedCard({
    sourceId: 'FACT-0042',
    engine: 'Share',
    level: 'A2',
    englishBeats: ['One.', 'Two.', 'Three.'],
    presentationStyle: 'default',
    emotion: 'thoughtful',
    conversationGoal: 'Invite the child to say what they would hold on to.',
    topicTags: ['Animals'],
  });

console.log('\n--- Stage ordering (Factory §4: stages are not skipped) ---\n');

expectThrow('Stage 2 cannot run before Stage 1', () =>
  stage2Engine(startRun(source), { engine: 'Share', rationale: 'x' })
);

expectThrow('Stage 3 cannot run before Stage 2', () =>
  stage3Write(
    stage1Feasibility(startRun(source), {
      characterCompatibility: { pass: true },
      conversationalPotential: { pass: true },
      enginePlausibility: { pass: true },
    }),
    { angle: 'a', mustSurvive: 'b', beats: ['x'] }
  )
);

expectThrow('An engine outside the closed set is refused', () =>
  stage2Engine(
    stage1Feasibility(startRun(source), {
      characterCompatibility: { pass: true },
      conversationalPotential: { pass: true },
      enginePlausibility: { pass: true },
    }),
    { engine: 'Wonder', rationale: 'x' }
  )
);

console.log('\n--- Stage 1 intake gate (Raw Content §9.10) ---\n');

{
  const incomplete = { ...source, cefrRange: null };
  const run = stage1Feasibility(startRun(incomplete), {
    characterCompatibility: { pass: true },
    conversationalPotential: { pass: true },
    enginePlausibility: { pass: true },
  });
  if (run.rejected) {
    console.log(`ok    Incomplete Raw Content is refused\n        → ${run.rejected.reason}`);
    pass++;
  } else {
    console.log('FAIL  Incomplete Raw Content was accepted');
    fail++;
  }
}

{
  const run = stage1Feasibility(startRun(source), {
    characterCompatibility: { pass: true },
    conversationalPotential: { pass: false, note: 'answers its own question' },
    enginePlausibility: { pass: true },
  });
  if (run.rejected) {
    console.log(`ok    A no-go on any one criterion rejects the item\n        → ${run.rejected.reason}`);
    pass++;
  } else {
    console.log('FAIL  Item passed despite failing a criterion');
    fail++;
  }
}

console.log('\n--- Stage 4 returns a failing draft to Stage 3 ---\n');

{
  let run = stage1Feasibility(startRun(source), {
    characterCompatibility: { pass: true },
    conversationalPotential: { pass: true },
    enginePlausibility: { pass: true },
  });
  run = stage2Engine(run, { engine: 'Share', rationale: 'x' });
  run = stage3Write(run, { angle: 'a', mustSurvive: 'the fact', beats: ['One.'] });
  run = stage4Review(run, {
    characterFidelity: { pass: false, note: 'any mascot could say this' },
    ideaPreservation: { pass: true },
    conversationalValue: { pass: true },
    languageQuality: { pass: true },
    pressAgainTest: { pass: true },
  });
  if (!run.stages.stage4.passed && run.stages.stage3 === undefined) {
    console.log('ok    A failed standard returns the draft to Stage 3 and clears the writing');
    pass++;
  } else {
    console.log('FAIL  Failed review did not return the draft');
    fail++;
  }
  expectThrow('Stage 5 refuses a draft that did not pass review', () =>
    stage5Metadata(run, {
      level: 'A2',
      emotion: 'thoughtful',
      conversationGoal: 'g',
      presentationStyle: 'default',
      topicTags: ['Animals'],
    })
  );
}

console.log('\n--- Identity and translation (Card Spec §6.1, §7.2) ---\n');

expectThrow('A card cannot skip Reviewed to reach Approved', () => approve(goodCard(), 'CARD-0001'));

expectThrow('Translation is refused before approval', () =>
  attachTranslation(goodCard(), ['하나.', '둘.', '셋.'])
);

expectThrow('Beat parity is enforced at translation', () => {
  const approved = approve(moveTo(goodCard(), 'Reviewed'), 'CARD-0001');
  return attachTranslation(approved, ['하나.', '둘.']);
});

expectThrow('Lifecycle states are never skipped', () => moveTo(goodCard(), 'Approved'));

console.log('\n--- Validation rules (Card Spec §13) ---\n');

expectErrors(
  'A card below Approved may not carry an ID',
  validateCard({ ...goodCard(), id: 'CARD-0099' }, { sourceItem: source }),
  /below Approved do not carry an ID/
);

expectErrors(
  'Level must fall inside the source CEFR range',
  validateCard({ ...goodCard(), level: 'C1' }, { sourceItem: source }),
  /outside the source range/
);

expectErrors(
  'An emotion outside the vocabulary is refused',
  validateCard({ ...goodCard(), emotion: 'wistful' }, { sourceItem: source }),
  /outside the closed vocabulary/
);

expectErrors(
  'An animation hint must resolve to the catalogue',
  validateCard({ ...goodCard(), animationHint: 'MVP-99' }, { sourceItem: source }),
  /not in the catalogue/
);

expectErrors(
  'Markup in card text is refused',
  validateCard(
    { ...goodCard(), text: { en: ['**Sea otters** hold hands.'], ko: null } },
    { sourceItem: source }
  ),
  /markdown formatting/
);

expectErrors(
  'Cross-references to other cards are refused',
  validateCard({ ...goodCard(), text: { en: ['See CARD-0042 for more.'], ko: null } }, { sourceItem: source }),
  /references another card/
);

expectErrors(
  'Duplicate IDs are caught across the brain',
  validateCard(
    { ...approve(moveTo(goodCard(), 'Reviewed'), 'CARD-0001'), text: { en: ['One.'], ko: ['하나.'] } },
    { sourceItem: source, knownIds: ['CARD-0001', 'CARD-0001'] }
  ),
  /not unique across the brain/
);

console.log('\n--- Compiler (Architecture §11, Card Spec §15) ---\n');

{
  const generated = goodCard();
  const { libraries, report } = compile([generated], { sourcesById: { 'FACT-0042': source } });
  if (Object.keys(libraries).length === 0 && report.skippedBelowApproved === 1) {
    console.log('ok    Only Approved cards compile — a Generated card is skipped, never shipped');
    pass++;
  } else {
    console.log('FAIL  A below-Approved card reached shipped output');
    fail++;
  }
}

{
  let approved = approve(moveTo(goodCard(), 'Reviewed'), 'CARD-0001');
  approved = attachTranslation(approved, ['하나.', '둘.', '셋.']);
  const { libraries } = compile([approved], { sourcesById: { 'FACT-0042': source } });
  const entry = libraries.share[0];
  // sourceId, conversationGoal, reviewRecord and lifecycleState are stripped
  // (nothing at runtime reads them). topicTags is NOT in this list: it
  // compiles through as `tags`, matching the existing app schema on purpose
  // (compiler.js's toRuntimeEntry() doc comment explains the tradeoff).
  const stripped = ['sourceId', 'conversationGoal', 'reviewRecord', 'lifecycleState'];
  const leaked = stripped.filter((k) => k in entry);
  const hasTags = 'tags' in entry;
  if (leaked.length === 0 && hasTags) {
    console.log(`ok    Review fields are stripped at compilation (tags pass through by design) → keys: ${Object.keys(entry).join(', ')}`);
    pass++;
  } else if (leaked.length > 0) {
    console.log(`FAIL  Review fields leaked into runtime: ${leaked.join(', ')}`);
    fail++;
  } else {
    console.log('FAIL  tags did not compile through as expected');
    fail++;
  }
}

{
  let a = attachTranslation(approve(moveTo(goodCard(), 'Reviewed'), 'CARD-0001'), ['하나.', '둘.', '셋.']);
  const first = JSON.stringify(compile([a]).libraries);
  const second = JSON.stringify(compile([a]).libraries);
  if (first === second) {
    console.log('ok    Compilation is deterministic');
    pass++;
  } else {
    console.log('FAIL  Compilation is not deterministic');
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
