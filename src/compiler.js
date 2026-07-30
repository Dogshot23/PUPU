/**
 * Content Compiler — PUPU_CONTENT_ARCHITECTURE_V2.md §11, Card Spec §15.
 *
 * This is the only component in the system that produces JSON. "The Factory
 * does not produce JSON... Conversion to JSON happens downstream, in the
 * compilation step" (Factory §3). Keeping the two apart is what lets the
 * authoring format stay pleasant to read and diff while the runtime format
 * stays minimal.
 *
 * Three constraints govern this file (§11.1):
 *   - It runs at authoring time, never in the browser.
 *   - It is a transformer, not an author. It may validate, filter, sort, merge
 *     and strip. It may never rewrite PUPU's words or repair a malformed card.
 *   - It is deterministic. The same approved source produces identical output.
 */

import { CHARACTER_MOMENT, stateIndex } from './vocabularies.js';
import { validateCard } from './validate.js';

/**
 * Project one approved card into its runtime entry.
 *
 * Reduced per §15: the review fields — source, conversation goal, review record
 * — are stripped, "along with anything else no runtime behaviour reads". Topic
 * tags and lifecycle state go with them: tags exist for review, balancing and
 * theme pack curation and are "never surfaced to a child" (§9.2), and no
 * documented runtime behaviour reads either. Both are trivially restorable if a
 * behaviour ever needs them (§16, additions are additive).
 *
 * What remains is identity, classification, text and delivery.
 */
export function toRuntimeEntry(card) {
  const entry = {
    id: card.id,
    engine: card.engine,
    level: card.level,
    presentation_style: card.presentationStyle,
    emotion: card.emotion,
    text: {
      en: [...card.text.en],
      ko: [...card.text.ko],
    },
  };
  // Absence of a hint is a normal, common state (§8.3), so the key is omitted
  // rather than emitted as null — the app reads "no hint" from its absence.
  if (card.animationHint) entry.animation_hint = card.animationHint;
  return entry;
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
