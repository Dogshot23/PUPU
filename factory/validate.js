/**
 * Card validation — the structural rules of PUPU_CONVERSATION_CARD_SPEC.md §13.
 *
 * These rules are the checkable ones. The judgements in §12 (does it sound like
 * PUPU? does it produce speech?) are not here and cannot be: "Structure is not
 * quality. Every required field present is a floor, never a certificate" (§17).
 *
 * Errors are malformations: the card is fixed at source, never repaired
 * downstream (§13 preamble). Warnings are places where the spec uses words like
 * "almost always", which means a person decides.
 */

import {
  LEVELS,
  isEngine,
  isLevel,
  isEmotion,
  isPresentationStyle,
  isLifecycleState,
  isAnimation,
  stateIndex,
} from './vocabularies.js';
import { readField, isPresent, requiredFieldsFor } from './card.js';

/** Markup, formatting, code and field labels have no place in card text (§13). */
const FORBIDDEN_IN_TEXT = [
  { pattern: /[*_`#]/, label: 'markdown formatting' },
  { pattern: /<[^>]+>/, label: 'markup tags' },
  { pattern: /[{}]/, label: 'code or template braces' },
  { pattern: /\b(engine|level|emotion|presentation[_ ]style|lifecycle|tags)\s*:/i, label: 'a field label' },
  { pattern: /PUPU_[A-Z_]+|\.md\b/, label: 'a reference to a project document' },
  { pattern: /\[[^\]]*\]/, label: 'bracketed stage directions' },
];

/** No card text refers to another card, by ID or by description (§13). */
const CROSS_REFERENCE = /\b(CARD|FACT|RIDDLE|JOKE)-\d{3,}\b/i;

function checkBeats(beats, language, errors, warnings) {
  if (!Array.isArray(beats)) {
    errors.push(`${language}: text must be an ordered sequence of beats (§5.2).`);
    return;
  }
  if (beats.length === 0) {
    errors.push(`${language}: no variant may be empty (§13 Beat parity).`);
    return;
  }
  if (beats.length > 5) {
    warnings.push(
      `${language}: ${beats.length} beats. More than five is almost always a card that has not been cut (§7.1).`
    );
  }

  beats.forEach((beat, i) => {
    const n = i + 1;
    if (typeof beat !== 'string' || !beat.trim()) {
      errors.push(`${language} beat ${n} is empty.`);
      return;
    }
    for (const { pattern, label } of FORBIDDEN_IN_TEXT) {
      if (pattern.test(beat)) {
        errors.push(`${language} beat ${n} contains ${label}; card text carries none (§13 Text cleanliness).`);
      }
    }
    if (CROSS_REFERENCE.test(beat)) {
      errors.push(`${language} beat ${n} references another card (§13 No cross-references).`);
    }
    if (/\.{3}|…/.test(beat)) {
      warnings.push(
        `${language} beat ${n} uses an ellipsis. Confirm it is speech, not a delivery instruction (§7.1).`
      );
    }
  });
}

/**
 * Validate one card.
 *
 * @param {object} card
 * @param {object}  [context]
 * @param {object}  [context.sourceItem]  the Raw Content record this card came from
 * @param {string[]} [context.knownIds]   every card ID ever issued, for uniqueness
 * @returns {{ errors: string[], warnings: string[], ok: boolean }}
 */
export function validateCard(card, context = {}) {
  const errors = [];
  const warnings = [];
  const { sourceItem = null, knownIds = [] } = context;

  // --- Completeness (§13) -------------------------------------------------
  if (!isLifecycleState(card.lifecycleState)) {
    errors.push(`Lifecycle state "${card.lifecycleState}" is not one of the six states (§9.3).`);
    return { errors, warnings, ok: false };
  }
  for (const path of requiredFieldsFor(card.lifecycleState)) {
    if (!isPresent(readField(card, path))) {
      errors.push(`Missing required field "${path}" for state ${card.lifecycleState} (§5.4).`);
    }
  }

  // --- Closed vocabularies and cardinality (§13) --------------------------
  if (!isEngine(card.engine)) errors.push(`Engine "${card.engine}" is outside the closed set (§6.3).`);
  if (!isLevel(card.level)) errors.push(`Level "${card.level}" is not a CEFR value (§6.4).`);
  if (!isEmotion(card.emotion)) errors.push(`Emotion "${card.emotion}" is outside the closed vocabulary (§8.2).`);
  if (!isPresentationStyle(card.presentationStyle)) {
    errors.push(`Presentation style "${card.presentationStyle}" is not a style the app defines (§8.1).`);
  }
  if (Array.isArray(card.engine) || Array.isArray(card.level) || Array.isArray(card.emotion)) {
    errors.push('Engine, level and emotion are exactly one value each (§13 Cardinality).');
  }

  // --- Animation hint (§8.3, §13) ----------------------------------------
  if (card.animationHint != null) {
    if (Array.isArray(card.animationHint)) {
      errors.push('At most one animation hint per card (§8.3).');
    } else if (!isAnimation(card.animationHint)) {
      errors.push(
        `Animation hint "${card.animationHint}" is not in the catalogue. ` +
          'A hint naming something unbuilt is a request for an animation (§8.3).'
      );
    }
  }

  // --- Identity (§6.1, §13) ----------------------------------------------
  const isApprovedOrLater = stateIndex(card.lifecycleState) >= stateIndex('Approved');
  if (isApprovedOrLater && !isPresent(card.id)) {
    errors.push('Approved-or-later cards carry an ID (§6.1).');
  }
  if (!isApprovedOrLater && isPresent(card.id)) {
    errors.push('Cards below Approved do not carry an ID (§6.1).');
  }
  if (isPresent(card.id) && knownIds.filter((id) => id === card.id).length > 1) {
    errors.push(`ID ${card.id} is not unique across the brain (§6.1).`);
  }

  // --- Source integrity (§13) --------------------------------------------
  if (!isPresent(card.sourceId)) {
    errors.push('A card records exactly one source, or declares itself a Character Moment (§6.2).');
  } else if (Array.isArray(card.sourceId)) {
    errors.push('Exactly one source. Never two (§6.2).');
  }
  if (sourceItem) {
    if (sourceItem.id !== card.sourceId) {
      errors.push(`Source mismatch: card cites ${card.sourceId}, item is ${sourceItem.id}.`);
    }
    if (sourceItem.cefrRange && isLevel(card.level)) {
      const { min, max } = sourceItem.cefrRange;
      const i = LEVELS.indexOf(card.level);
      if (i < LEVELS.indexOf(min) || i > LEVELS.indexOf(max)) {
        errors.push(
          `Level ${card.level} falls outside the source range ${min}–${max} (§6.4, §13 Source integrity).`
        );
      }
    }
    // Tags are inherited but may be reduced, never widened (§3, §9.2).
    const extra = (card.topicTags ?? []).filter((t) => !sourceItem.tags.includes(t));
    if (extra.length) {
      warnings.push(
        `Topic tag(s) ${extra.join(', ')} are not carried by the source. Tags may be fewer, not more (§9.2).`
      );
    }
  }

  // --- Content (§7, §13 Beat parity) -------------------------------------
  checkBeats(card.text?.en, 'English', errors, warnings);
  if (card.text?.ko != null) {
    checkBeats(card.text.ko, 'Korean', errors, warnings);
    if (Array.isArray(card.text.en) && Array.isArray(card.text.ko) && card.text.en.length !== card.text.ko.length) {
      errors.push(
        `Beat parity: English has ${card.text.en.length} beats, Korean has ${card.text.ko.length} (§7.2).`
      );
    }
  }

  // --- Review fields (§9) -------------------------------------------------
  if (isPresent(card.conversationGoal) && /(?<!\w\.\w)[.!?]\s+\S/.test(card.conversationGoal.trim())) {
    warnings.push('Conversation goal reads as more than one sentence; a two-sentence goal describes a card doing two things (§9.1).');
  }
  if (card.reviewRecord != null && !isPresent(card.reviewRecord)) {
    errors.push('A review record, when present, carries something worth knowing (§9.4).');
  }

  return { errors, warnings, ok: errors.length === 0 };
}

/** Validate a set of cards together, so ID uniqueness is meaningful. */
export function validateAll(cards, sourcesById = {}) {
  const knownIds = cards.map((c) => c.id).filter(Boolean);
  return cards.map((card) => ({
    card,
    result: validateCard(card, { sourceItem: sourcesById[card.sourceId] ?? null, knownIds }),
  }));
}
