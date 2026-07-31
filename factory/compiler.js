/**
 * Content Compiler — PUPU_CONTENT_ARCHITECTURE_V2.md §11, Card Spec §15.
 *
 * This module has two responsibilities that belong together: rendering a card
 * as its human-readable authoring artefact (Markdown), and compiling approved
 * cards to the runtime JSON the application loads. Both are output concerns —
 * the two forms a finished card can take — so they live in one place.
 *
 * ─── THE AUTHORING ARTEFACT ─────────────────────────────────────────────────
 *
 * "The Factory produces a finished Conversation Card in whatever human-readable
 * form the current workflow requires" (Factory §3). That form is Markdown,
 * because a card is "human-readable, human-reviewable, and it is the
 * authoritative content of the project" (Card Spec §2) and because Markdown
 * diffs legibly when a card is revised.
 *
 * The .md file is the authoritative record. Compiled JSON is derived from it
 * and is disposable: "if the compiled files disagree with the card, the card
 * is right" (§15).
 *
 * ─── THE CONTENT COMPILER ───────────────────────────────────────────────────
 *
 * This is the only component in the system that produces JSON. "The Factory
 * does not produce JSON... Conversion to JSON happens downstream, in the
 * compilation step" (Factory §3). Keeping the two apart is what lets the
 * authoring format stay pleasant to read and diff while the runtime format
 * stays minimal.
 *
 * Three constraints govern compilation (§11.1):
 *   - It runs at authoring time, never in the browser.
 *   - It is a transformer, not an author. It may validate, filter, sort, merge
 *     and strip. It may never rewrite PUPU's words or repair a malformed card.
 *   - It is deterministic. The same approved source produces identical output.
 */

import { CHARACTER_MOMENT, stateIndex } from './vocabularies.js';
import { validateCard } from './validate.js';

// ─── Authoring artefact (Markdown) ──────────────────────────────────────────

const beatList = (beats) => beats.map((b) => `${b}`).join('\n');

/**
 * Render one card as its authoring artefact.
 *
 * The Factory trace is included under Provenance. It is review information,
 * never delivered and stripped at compilation (§6.2), but it is what makes
 * the card auditable against its source — a reviewer holding the card and the
 * Raw Content item can check idea preservation without any other file (§3).
 */
export function renderCardMarkdown(card, trace = null) {
  const lines = [];

  lines.push(`# ${card.id ?? '(no ID — below Approved)'}`);
  lines.push('');

  lines.push('## Identity');
  lines.push('');
  lines.push(`- Source: ${card.sourceId}`);
  lines.push(`- Engine: ${card.engine}`);
  lines.push(`- Level: ${card.level}`);
  lines.push('');

  lines.push('## Content');
  lines.push('');
  lines.push('### English');
  lines.push('');
  lines.push(beatList(card.text.en));
  lines.push('');
  if (card.text.ko) {
    lines.push('### Korean');
    lines.push('');
    lines.push(beatList(card.text.ko));
    lines.push('');
  }

  lines.push('## Delivery');
  lines.push('');
  lines.push(`- Presentation style: ${card.presentationStyle}`);
  lines.push(`- Emotion: ${card.emotion}`);
  lines.push(`- Animation hint: ${card.animationHint ?? 'none'}`);
  lines.push('');

  lines.push('## Review');
  lines.push('');
  lines.push(`- Conversation goal: ${card.conversationGoal}`);
  lines.push(`- Topic tags: ${card.topicTags.join(', ')}`);
  lines.push(`- Lifecycle state: ${card.lifecycleState}`);
  if (card.reviewRecord) lines.push(`- Review record: ${card.reviewRecord}`);
  lines.push('');

  if (trace) {
    lines.push('## Provenance');
    lines.push('');
    lines.push(`- Source content: ${trace.sourceContent}`);
    lines.push(`- Must survive: ${trace.mustSurvive}`);
    lines.push(`- Engine rationale: ${trace.engineRationale}`);
    lines.push(`- PUPU's angle: ${trace.angle}`);
    if (trace.qualityStatement) lines.push(`- Quality review: ${trace.qualityStatement}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Content Compiler (JSON) ─────────────────────────────────────────────────

/**
 * Project one approved card into its runtime entry.
 *
 * The shape here is not the Card Spec's own runtime sketch — it is the shape
 * `content-loader.js` and every existing `content/packs/*` module already
 * use, fixed by `PUPU_MIGRATION_SPEC.md` §9 (`id, type, subtype, level, tags,
 * emotion, animation, english, translations`). Card Spec §15 deliberately
 * leaves runtime format unspecified ("must be free to change without any
 * card changing"), so matching the app's existing, working format rather
 * than inventing a second one is a conforming choice, not a deviation.
 *
 * Source, conversation goal, review record and lifecycle state are still
 * stripped per §15 — nothing about them is read by the app. Topic tags are
 * the one deliberate exception: Card Spec §9.2 calls them review-only and
 * "never surfaced to a child", but the existing runtime schema this compiler
 * targets carries a `tags` field on every entry (Migration Spec §9), so they
 * compile through as `tags` to match it. This is a conscious tradeoff in
 * favour of one existing, working runtime shape over two competing ones —
 * not an oversight.
 */
export function toRuntimeEntry(card) {
  return {
    id: card.id,
    type: card.engine === CHARACTER_MOMENT ? 'character_moment' : card.engine.toLowerCase(),
    // No finer-grained per-entry category exists for a Factory-produced
    // card the way it does for a migrated legacy pack, so this is always
    // null — present per Migration Spec §7's "key structure always present".
    subtype: null,
    level: card.level,
    tags: [...card.topicTags],
    emotion: card.emotion,
    animation: card.animationHint ?? null,
    english: [...card.text.en],
    translations: { ko: [...(card.text.ko ?? [])] },
  };
}

/**
 * Compile a set of cards.
 *
 * @param {object[]} cards
 * @param {object} [options]
 * @param {object} [options.sourcesById] Raw Content records, for source integrity checks
 * @returns {{ libraries: object, report: object, errors: object[] }}
 */
export function compile(cards, { sourcesById = {} } = {}) {
  const errors = [];
  const knownIds = cards.map((c) => c.id).filter(Boolean);

  // Only Approved compiles — "by any mechanism, for any reason, including
  // testing" (§13, §12.1). Filtering happens before validation so that an
  // in-progress draft is skipped rather than reported as broken.
  const eligible = cards.filter((c) => stateIndex(c.lifecycleState) >= stateIndex('Approved'));
  const skipped = cards.length - eligible.length;

  const valid = [];
  for (const card of eligible) {
    const result = validateCard(card, {
      sourceItem: sourcesById[card.sourceId] ?? null,
      knownIds,
    });
    if (result.ok) valid.push(card);
    else errors.push({ id: card.id ?? '(no id)', errors: result.errors });
  }

  // One library per engine (§4.1). Sorted by ID so output is byte-identical
  // across runs (§11.1, determinism).
  const libraries = {};
  for (const card of valid.sort((a, b) => a.id.localeCompare(b.id))) {
    const key = card.engine === CHARACTER_MOMENT ? 'character-moments' : card.engine.toLowerCase();
    (libraries[key] ??= []).push(toRuntimeEntry(card));
  }

  return { libraries, report: buildReport(valid, { skipped, failed: errors.length }), errors };
}

/**
 * Distribution reporting.
 *
 * "The compiler shows the imbalance, and people decide what to do about it"
 * (§13, §11.2). Nothing here corrects anything.
 */
export function buildReport(cards, { skipped = 0, failed = 0 } = {}) {
  const moments = cards.filter((c) => c.engine === CHARACTER_MOMENT).length;
  const seeds = cards.length - moments;

  const perEngine = {};
  for (const card of cards) {
    if (card.engine === CHARACTER_MOMENT) continue;
    perEngine[card.engine] = (perEngine[card.engine] ?? 0) + 1;
  }

  return {
    compiled: cards.length,
    skippedBelowApproved: skipped,
    failedValidation: failed,
    seeds,
    characterMoments: moments,
    // The 90/10 split is a fixed constraint in both directions (§2.3).
    momentShare: cards.length ? Number((moments / cards.length).toFixed(3)) : 0,
    perEngine,
  };
}

/** Serialise a library deterministically. */
export function serialise(library) {
  return `${JSON.stringify(library, null, 2)}\n`;
}
