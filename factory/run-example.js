/**
 * Worked example — FACT-0042 from Raw Content to compiled runtime JSON.
 *
 * Run: node run-example.js
 *
 * Every judgement below (feasibility, engine choice, the beats themselves, the
 * quality verdicts, the metadata, the translation) is authored. The Factory
 * modules record and gate them; they do not produce them.
 */
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  loadRawFacts,
  findRawItem,
  rawContentGaps,
  startRun,
  stage1Feasibility,
  stage2Engine,
  stage3Write,
  stage4Review,
  stage5Metadata,
  stage6Translate,
  traceOf,
} from './factory.js';
import { moveTo, approve, nextCardId } from './card.js';
import { validateCard } from './validate.js';
import { compile, serialise, renderCardMarkdown } from './compiler.js';

const RAW_FACTS = fileURLToPath(
  new URL('./raw-content/facts.md', import.meta.url)
);

const OUT = fileURLToPath(
  new URL('./out/', import.meta.url)
);

const rule = (t) => console.log(`\n${'─'.repeat(70)}\n${t}\n${'─'.repeat(70)}`);

/* ---------------------------------------------------------------------------
 * 0. Load Raw Content
 * ------------------------------------------------------------------------ */
rule('0. RAW CONTENT');

const facts = loadRawFacts(RAW_FACTS);
console.log(`Parsed ${facts.length} Fact records from PUPU_RAW_FACTS.md.`);

const asFiled = findRawItem(facts, 'FACT-0042');
console.log('\nFACT-0042 as filed:');
console.log(asFiled);

/* ---------------------------------------------------------------------------
 * 1. Stage 1 refuses the record as filed
 *
 * PUPU_RAW_FACTS.md carries ID, Tags and Content, but not the CEFR range that
 * §9.11 requires. The Factory does not guess it — it refuses the item.
 * ------------------------------------------------------------------------ */
rule('1. STAGE 1 — INTAKE GATE (record as filed)');

console.log('Completeness gaps:', rawContentGaps(asFiled));

const refused = stage1Feasibility(startRun(asFiled), {
  characterCompatibility: { pass: true },
  conversationalPotential: { pass: true },
  enginePlausibility: { pass: true },
});
console.log('\nResult:', refused.rejected);

/* ---------------------------------------------------------------------------
 * 2. The completed Raw Content record
 *
 * The fix belongs upstream: the author records the CEFR range on the item.
 * Shown here as the completed record the Factory actually receives.
 * ------------------------------------------------------------------------ */
rule('2. COMPLETED RAW CONTENT RECORD');

const source = {
  ...asFiled,
  type: 'Fact',
  cefrRange: { min: 'A2', max: 'B1' },
};
console.log(source);

/* ---------------------------------------------------------------------------
 * 3. Stage 1 — Feasibility Assessment
 * ------------------------------------------------------------------------ */
rule('3. STAGE 1 — FEASIBILITY ASSESSMENT');

let run = stage1Feasibility(startRun(source), {
  characterCompatibility: {
    pass: true,
    note: 'Concrete, visual and slightly strange. Small creatures holding on to each other is squarely inside PUPU\'s world of small physical observations.',
  },
  conversationalPotential: {
    pass: true,
    note: 'The fact resolves its own "why" but opens a second one it does not answer: who would you hold on to. That question belongs to the room, not the card.',
  },
  enginePlausibility: {
    pass: true,
    note: 'Share and Imagine both work without stretching. Guess would require withholding the reason the source already gives.',
  },
  plausibleEngines: ['Share', 'Imagine'],
  conversationalOpening: 'Who or what would you hold on to so you did not drift away.',
  notes: 'Emotional core is companionship, not otter biology.',
});
console.log('Decision:', run.stages.stage1.decision);
console.log('Plausible engines:', run.stages.stage1.plausibleEngines.join(', '));
console.log('Opening:', run.stages.stage1.conversationalOpening);

/* ---------------------------------------------------------------------------
 * 4. Stage 2 — Engine Selection
 * ------------------------------------------------------------------------ */
rule('4. STAGE 2 — ENGINE SELECTION');

run = stage2Engine(run, {
  engine: 'Share',
  rationale:
    'The idea\'s pull is personal rather than hypothetical, so the child answering from their own life is the least forced thing that can happen after the last beat.',
  engineDistributionNote:
    'Library distribution not consulted: no compiled libraries exist yet at MVP, so the balancing consideration in Factory §4 Stage 2 has nothing to read.',
});
console.log('Engine:', run.stages.stage2.engine);
console.log('Rationale:', run.stages.stage2.rationale);
console.log('Distribution:', run.stages.stage2.engineDistributionNote);

/* ---------------------------------------------------------------------------
 * 5. Stage 3 — Voice and Writing
 * ------------------------------------------------------------------------ */
rule('5. STAGE 3 — VOICE AND WRITING');

run = stage3Write(run, {
  mustSurvive: 'Sea otters hold hands while they sleep so they do not drift away from each other.',
  angle:
    'PUPU does not marvel at the otters; he takes the idea personally and immediately gets it slightly wrong, answering a question nobody asked with something absurd.',
  beats: [
    'Sea otters hold hands while they sleep.',
    "So they don't drift away from each other.",
    "I think I'd hold on to something silly.",
    'Like a spoon.',
  ],
});
console.log(run.stages.stage3.beats.join('\n'));

/* ---------------------------------------------------------------------------
 * 6. Stage 4 — Quality Review
 * ------------------------------------------------------------------------ */
rule('6. STAGE 4 — QUALITY REVIEW');

run = stage4Review(run, {
  characterFidelity: {
    pass: true,
    note: 'The spoon is the PUPU Filter passing. A generic mascot would have ended on warmth; PUPU ends on a spoon.',
  },
  ideaPreservation: {
    pass: true,
    note: 'Beats one and two carry the source almost verbatim, including the reason. Beats three and four make no factual claim — PUPU is wondering, not asserting.',
  },
  conversationalValue: {
    pass: true,
    note: 'PUPU answers first and answers badly, which lowers the cost of the child answering. The obvious next line in the room is the child\'s own choice.',
  },
  languageQuality: {
    pass: true,
    note: 'A2 throughout. Four short beats, all natural spoken English, reads aloud without stumbling.',
  },
  pressAgainTest: { pass: true, note: 'Ends on a joke that costs nothing to miss and rewards a second press.' },
  statement:
    'The fact survives intact in the first half; the second half hands the child a low-risk opening by having PUPU go first with a worse answer.',
});
console.log('Passed:', run.stages.stage4.passed);
console.log('Statement:', run.stages.stage4.statement);

/* ---------------------------------------------------------------------------
 * 7. Stage 5 — Metadata Assignment
 * ------------------------------------------------------------------------ */
rule('7. STAGE 5 — METADATA ASSIGNMENT');

run = stage5Metadata(run, {
  level: 'A2',
  emotion: 'thoughtful',
  animationHint: null, // Nothing in the catalogue adds more than PUPU's normal behaviour here (§8.3).
  conversationGoal: 'Invite the child to say what they would hold on to.',
  presentationStyle: 'default',
  topicTags: ['Animals'],
});

let card = run.card;
console.log(card);

const generatedCheck = validateCard(card, { sourceItem: source, knownIds: [] });
console.log('\nValidation at Generated:', generatedCheck.ok ? 'ok' : generatedCheck.errors);
if (generatedCheck.warnings.length) console.log('Warnings:', generatedCheck.warnings);

/* ---------------------------------------------------------------------------
 * 8. Human review and approval — outside the Factory
 * ------------------------------------------------------------------------ */
rule('8. REVIEW AND APPROVAL (human, outside the Factory)');

card = moveTo(card, 'Reviewed');
console.log('State:', card.lifecycleState);

card = approve(card, nextCardId([])); // no IDs issued yet in an empty brain
console.log('State:', card.lifecycleState, '— ID frozen as', card.id);

/* ---------------------------------------------------------------------------
 * 9. Stage 6 — Korean Translation
 * ------------------------------------------------------------------------ */
rule('9. STAGE 6 — KOREAN TRANSLATION');

card = stage6Translate(card, [
  '해달은 잠잘 때 서로 손을 잡아.',
  '그래야 서로 멀리 떠내려가지 않거든.',
  '나라면 좀 엉뚱한 걸 잡고 있을 것 같아.',
  '숟가락 같은 거.',
]);
console.log(card.text.ko.join('\n'));
console.log(`\nBeat parity: en=${card.text.en.length} ko=${card.text.ko.length}`);

const approvedCheck = validateCard(card, { sourceItem: source, knownIds: [card.id] });
console.log('Validation at Approved:', approvedCheck.ok ? 'ok' : approvedCheck.errors);
if (approvedCheck.warnings.length) console.log('Warnings:', approvedCheck.warnings);

/* ---------------------------------------------------------------------------
 * 10. The authoring artefact — the Factory's actual output
 * ------------------------------------------------------------------------ */
rule('10. FACTORY OUTPUT — authoring artefact (Markdown, no JSON)');

const markdown = renderCardMarkdown(card, traceOf(run));
console.log(markdown);

/* ---------------------------------------------------------------------------
 * 11. Compilation — the only step that produces JSON
 * ------------------------------------------------------------------------ */
rule('11. CONTENT COMPILER — runtime JSON');

const { libraries, report, errors } = compile([card], { sourcesById: { [source.id]: source } });
console.log('Errors:', errors);
console.log('Report:', report);
console.log('\nshare.json:');
console.log(serialise(libraries.share));

/* ---------------------------------------------------------------------------
 * 12. Write artefacts
 * ------------------------------------------------------------------------ */
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}${card.id}.md`, markdown);
for (const [name, library] of Object.entries(libraries)) {
  writeFileSync(`${OUT}${name}.json`, serialise(library));
}
console.log(`Written to out/: ${card.id}.md, ${Object.keys(libraries).join('.json, ')}.json`);
