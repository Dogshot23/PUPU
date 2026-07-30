/**
 * The Content Factory — PUPU_CONTENT_FACTORY.md §4.
 *
 * This module has two responsibilities that belong together: loading Raw
 * Content from disk, and transforming it through the six Factory stages.
 * They are combined because the loader's sole consumer is the Factory, and
 * the gap-reporting function is called exclusively at Stage 1. Keeping them
 * in one place makes the Factory fully self-contained from input to output.
 *
 * ─── WHAT THIS MODULE IS ────────────────────────────────────────────────────
 *
 * The Factory "is a human and AI process, not a piece of software"
 * (PUPU_CONTENT_ARCHITECTURE_V2.md §10). Nothing here writes PUPU's words,
 * chooses an engine, or decides whether an idea is worth building. Those are
 * judgements, and a judgement made by a scoring function would be a judgement
 * not made at all.
 *
 * What this module does is hold the shape of the process: six stages in order,
 * each with a defined input and a defined output, none skippable, each refusing
 * to run until the one before it has passed. The author supplies the judgement;
 * the code records it, gates on it, and keeps it attached to the card so a
 * reviewer can see how the card came to exist.
 *
 * "Stages are not skipped. A card that fails a stage returns to the previous
 * stage or is rejected; it does not continue forward" (§4).
 *
 * ─── RAW CONTENT FORMAT ─────────────────────────────────────────────────────
 *
 * Records follow the §9.11 universal metadata field layout:
 *
 *   FACT-0042
 *
 *   Type: Fact
 *   CEFR: A2-B1
 *   Tags: Animals, Biology
 *
 *   Content:
 *   Sea otters hold hands while they sleep so they don't drift away.
 *
 * `Type` and `CEFR` are required by §9.11 but are absent from the current
 * PUPU_RAW_FACTS.md. They are parsed when present and reported as missing
 * when not — see rawContentGaps(). CEFR is never inferred; it is an authoring
 * judgement (§9.8). loadRawFacts() applies one safe default: records in the
 * Facts file with no explicit Type are read as Fact.
 */

import { readFileSync } from 'node:fs';
import { LEVELS, RAW_TYPES, SUPPORTED_RAW_TYPES, ENGINES } from './vocabularies.js';
import { createGeneratedCard } from './card.js';

// ─── Raw Content loading ────────────────────────────────────────────────────

/** An item header is exactly an ID on its own line: FACT-0042. */
const ITEM_HEADER = /^([A-Z]+-\d{4})$/;

/** Field lines: "Tags: Animals, Biology". */
const FIELD_LINE = /^(Type|CEFR|Tags|Content):\s*(.*)$/;

/**
 * Parse a CEFR range into { min, max }.
 * Accepts "A2-B1", "A2–B1" (en dash) and the single-level form "A2", where
 * both ends are the same (§9.11).
 */
function parseCefrRange(raw) {
  const parts = String(raw)
    .split(/[-–—]/)
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);

  if (parts.length === 0) return null;
  const min = parts[0];
  const max = parts.length > 1 ? parts[1] : parts[0];
  if (!LEVELS.includes(min) || !LEVELS.includes(max)) return null;
  if (LEVELS.indexOf(min) > LEVELS.indexOf(max)) return null;
  return { min, max };
}

/** Split "Animals, Biology" into ["Animals", "Biology"]. */
function parseTags(raw) {
  return String(raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Parse a Raw Content markdown file into records.
 *
 * Lines that are not part of a record — the "FACT-0021 to FACT-0040" batch
 * separators present in the current file — are ignored, because they do not
 * match the strict header pattern.
 */
export function parseRawContent(text) {
  const lines = String(text).split(/\r?\n/);
  const items = [];
  let current = null;
  let collectingContent = false;

  const finish = () => {
    if (!current) return;
    current.content = current.contentLines.join(' ').replace(/\s+/g, ' ').trim();
    delete current.contentLines;
    items.push(current);
    current = null;
  };

  for (const line of lines) {
    const header = line.trim().match(ITEM_HEADER);
    if (header) {
      finish();
      current = {
        id: header[1],
        type: null,
        cefrRange: null,
        tags: [],
        content: '',
        contentLines: [],
      };
      collectingContent = false;
      continue;
    }

    if (!current) continue;

    const field = line.match(FIELD_LINE);
    if (field) {
      const [, name, value] = field;
      collectingContent = false;
      if (name === 'Type') current.type = value.trim() || null;
      else if (name === 'CEFR') current.cefrRange = parseCefrRange(value);
      else if (name === 'Tags') current.tags = parseTags(value);
      else if (name === 'Content') {
        collectingContent = true;
        if (value.trim()) current.contentLines.push(value.trim());
      }
      continue;
    }

    if (collectingContent && line.trim()) current.contentLines.push(line.trim());
  }

  finish();
  return items;
}

/**
 * Report which §9.11 universal metadata fields a record is missing.
 * Returns an array of human-readable strings; empty means complete.
 */
export function rawContentGaps(item) {
  const gaps = [];
  if (!item.id) gaps.push('ID is missing.');
  if (!item.type) gaps.push('Type is missing (§9.11).');
  else if (!RAW_TYPES.includes(item.type)) gaps.push(`Type "${item.type}" is not one of the six types (§2).`);
  if (!item.cefrRange) gaps.push('CEFR range is missing or unparseable (§9.11, §9.8).');
  if (!item.tags || item.tags.length === 0) gaps.push('Topic tags are missing (§9.11, §9.9).');
  if (!item.content) gaps.push('Content is empty.');
  return gaps;
}

/**
 * Load PUPU_RAW_FACTS.md.
 *
 * The file contains Facts exclusively, so a record with no explicit `Type:`
 * line is read as a Fact. This is the one inference the loader makes, and it
 * is confined to a file whose entire contents are one declared type. CEFR is
 * never inferred: an idea's CEFR floor is an authoring judgement (§9.8), so
 * a record without one is reported incomplete and refused at Stage 1.
 */
export function loadRawFacts(path) {
  const items = parseRawContent(readFileSync(path, 'utf8'));
  return items.map((item) => ({ ...item, type: item.type ?? 'Fact' }));
}

/** Find one record by ID, or throw — the Factory always works from one item. */
export function findRawItem(items, id) {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`Raw Content item "${id}" not found.`);
  return item;
}

// ─── Factory stages ─────────────────────────────────────────────────────────

/** Start a Factory run against exactly one Raw Content item (Card Spec §3). */
export function startRun(rawItem) {
  return { rawItem, stages: {}, rejected: null };
}

/** Every stage refuses to run out of order. */
function requireStage(run, stageName, previous) {
  if (run.rejected) {
    throw new Error(`Run was rejected at ${run.rejected.stage}: ${run.rejected.reason}`);
  }
  if (previous && !run.stages[previous]) {
    throw new Error(`${stageName} cannot run before ${previous} (Factory §4: stages are not skipped).`);
  }
}

function reject(run, stage, reason) {
  return { ...run, rejected: { stage, reason } };
}

/* -------------------------------------------------------------------------
 * Stage 1 — Feasibility Assessment
 *
 * Input:  one complete Raw Content item.
 * Output: a go / no-go decision, plus the plausible engines and the
 *         conversational opening that Stage 2 will work from.
 * ---------------------------------------------------------------------- */
export function stage1Feasibility(run, judgement) {
  requireStage(run, 'Stage 1');
  const { rawItem } = run;

  // Intake gate. The Factory does not rescue weak or incomplete material
  // (Factory §9, Raw Content Spec §9.10) — it refuses it.
  const gaps = rawContentGaps(rawItem);
  if (gaps.length) {
    return reject(run, 'Stage 1', `Raw Content is incomplete: ${gaps.join(' ')}`);
  }
  if (!SUPPORTED_RAW_TYPES.includes(rawItem.type)) {
    return reject(run, 'Stage 1', `V1 supports ${SUPPORTED_RAW_TYPES.join(', ')} only; item is a ${rawItem.type}.`);
  }

  const {
    characterCompatibility,
    conversationalPotential,
    enginePlausibility,
    plausibleEngines = [],
    conversationalOpening = '',
    notes = '',
  } = judgement;

  // All three must hold. Any one failing is a no-go (§4 Stage 1).
  const failed = [
    !characterCompatibility.pass && 'character compatibility',
    !conversationalPotential.pass && 'conversational potential',
    !enginePlausibility.pass && 'engine plausibility',
  ].filter(Boolean);

  if (failed.length) {
    return reject(run, 'Stage 1', `Failed on ${failed.join(', ')}.`);
  }

  const unknown = plausibleEngines.filter((e) => !ENGINES.includes(e));
  if (unknown.length) {
    throw new Error(`Unknown engine(s) named at Stage 1: ${unknown.join(', ')}.`);
  }

  return {
    ...run,
    stages: {
      ...run.stages,
      stage1: {
        decision: 'go',
        characterCompatibility,
        conversationalPotential,
        enginePlausibility,
        plausibleEngines,
        conversationalOpening,
        notes,
      },
    },
  };
}

/* -------------------------------------------------------------------------
 * Stage 2 — Engine Selection
 *
 * Input:  an item that passed Stage 1, with its notes.
 * Output: exactly one declared engine, with a one-sentence rationale.
 * ---------------------------------------------------------------------- */
export function stage2Engine(run, { engine, rationale, engineDistributionNote = null }) {
  requireStage(run, 'Stage 2', 'stage1');

  if (!ENGINES.includes(engine)) {
    throw new Error(`"${engine}" is not one of the eight engines (Architecture §3.2).`);
  }
  if (!rationale || !rationale.trim()) {
    throw new Error('Stage 2 output includes a one-sentence rationale (Factory §4 Stage 2).');
  }

  return {
    ...run,
    stages: { ...run.stages, stage2: { engine, rationale, engineDistributionNote } },
  };
}

/* -------------------------------------------------------------------------
 * Stage 3 — Voice and Writing
 *
 * Input:  an item with a declared engine.
 * Output: a complete English draft, written in beats.
 *
 * The beats are authored. This function stores them and records the angle PUPU
 * took, because "the angle is not a hook that is added on top" and a reviewer
 * needs to see what it was.
 * ---------------------------------------------------------------------- */
export function stage3Write(run, { angle, mustSurvive, beats }) {
  requireStage(run, 'Stage 3', 'stage2');

  if (!Array.isArray(beats) || beats.length === 0) {
    throw new Error('Stage 3 output is a sequence of beats (Factory §4 Stage 3).');
  }
  if (!mustSurvive || !mustSurvive.trim()) {
    throw new Error(
      'Stage 3 records the single specific thing that must survive into the card (Factory §6).'
    );
  }

  return {
    ...run,
    stages: { ...run.stages, stage3: { angle, mustSurvive, beats: [...beats] } },
  };
}

/* -------------------------------------------------------------------------
 * Stage 4 — Quality Review
 *
 * Input:  the English draft, the source item, the engine, and the level.
 * Output: a pass with a statement of what makes the card strong, or a return
 *         to Stage 3 with specific notes.
 *
 * Four independent standards plus the Press Again Test. A draft failing any
 * one is returned, "not pushed forward with a caveat" (§4 Stage 4).
 * ---------------------------------------------------------------------- */
export const QUALITY_STANDARDS = [
  'characterFidelity',
  'ideaPreservation',
  'conversationalValue',
  'languageQuality',
  'pressAgainTest',
];

export function stage4Review(run, judgement) {
  requireStage(run, 'Stage 4', 'stage3');

  const failures = QUALITY_STANDARDS.filter((s) => !judgement[s]?.pass).map((s) => ({
    standard: s,
    note: judgement[s]?.note ?? 'no note given',
  }));

  if (failures.length) {
    // Returned to Stage 3, not rejected outright: the writing gets another pass.
    return {
      ...run,
      stages: {
        ...run.stages,
        stage3: undefined,
        stage4: { passed: false, failures, returnedTo: 'Stage 3' },
      },
    };
  }

  return {
    ...run,
    stages: {
      ...run.stages,
      stage4: {
        passed: true,
        standards: Object.fromEntries(QUALITY_STANDARDS.map((s) => [s, judgement[s]])),
        statement: judgement.statement ?? '',
      },
    },
  };
}

/* -------------------------------------------------------------------------
 * Stage 5 — Metadata Assignment
 *
 * Input:  a card that passed Quality Review.
 * Output: a complete Conversation Card in English, in the Generated state.
 *
 * Metadata is assigned after writing so that nothing here influences the
 * writing that preceded it: "a card is not written *toward* a metadata
 * combination; metadata describes what the card is" (§4 Stage 5).
 * ---------------------------------------------------------------------- */
export function stage5Metadata(run, { level, emotion, animationHint = null, conversationGoal, presentationStyle, topicTags }) {
  requireStage(run, 'Stage 5', 'stage4');
  if (!run.stages.stage4?.passed) {
    throw new Error('Stage 5 runs only on a draft that passed Quality Review (Factory §4).');
  }

  const card = createGeneratedCard({
    sourceId: run.rawItem.id,
    engine: run.stages.stage2.engine,
    level,
    englishBeats: run.stages.stage3.beats,
    presentationStyle,
    emotion,
    animationHint,
    conversationGoal,
    topicTags,
  });

  return { ...run, stages: { ...run.stages, stage5: { card } }, card };
}

/* -------------------------------------------------------------------------
 * Stage 6 — Korean Translation
 *
 * Input:  an APPROVED card in English.
 * Output: a card complete in both languages, beat-matched.
 *
 * Stage 6 is deliberately not chained to Stage 5. Approval happens outside
 * the Factory, between the two (Factory §4 Stage 5/6, Card Spec §4), so the
 * caller approves the card and hands it back. attachTranslation() enforces
 * beat parity.
 * ---------------------------------------------------------------------- */
export { attachTranslation as stage6Translate } from './card.js';

/** A compact, human-readable trace of how a card came to exist. */
export function traceOf(run) {
  const { rawItem, stages, rejected } = run;
  return {
    sourceId: rawItem.id,
    sourceType: rawItem.type,
    sourceContent: rawItem.content,
    rejected,
    engine: stages.stage2?.engine ?? null,
    engineRationale: stages.stage2?.rationale ?? null,
    angle: stages.stage3?.angle ?? null,
    mustSurvive: stages.stage3?.mustSurvive ?? null,
    qualityStatement: stages.stage4?.statement ?? null,
  };
}
