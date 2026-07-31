/**
 * The Conversation Card.
 *
 * One in-memory shape for the object specified by PUPU_CONVERSATION_CARD_SPEC.md.
 * The spec deliberately fixes no storage format (§13 preamble), so this shape is
 * an implementation decision and is free to change without the spec changing.
 *
 * Four parts, exactly as Card Spec §5:
 *   Identity  — id, sourceId, engine, level
 *   Content   — text, held in parallel per language
 *   Delivery  — presentationStyle, emotion, animationHint
 *   Review    — conversationGoal, topicTags, lifecycleState, reviewRecord
 *
 * There is no logic on a card (§5.2). Every function here operates *on* a card;
 * a card never decides anything about itself.
 */

import { LIFECYCLE_STATES, stateIndex } from './vocabularies.js';

/** Fields required at each state, cumulatively. Card Spec §5.4. */
export const REQUIRED_AT_GENERATED = [
  'sourceId',
  'engine',
  'level',
  'text.en',
  'presentationStyle',
  'emotion',
  'conversationGoal',
  'topicTags',
  'lifecycleState',
];

/** Approval is the point at which identity is frozen and translation completed. */
export const REQUIRED_AT_APPROVED = [...REQUIRED_AT_GENERATED, 'id', 'text.ko'];

/**
 * Build a card in the Generated state.
 *
 * Everything passed in is authored by a person (or by an AI acting as author)
 * during Factory Stages 2, 3 and 5. This function performs no authoring: it
 * assembles fields that already exist and refuses nothing that validation will
 * catch later. Keeping construction dumb keeps the validator the single place
 * where "is this card well-formed?" is answered.
 */
export function createGeneratedCard({
  sourceId,
  engine,
  level,
  englishBeats,
  presentationStyle,
  emotion,
  animationHint = null,
  conversationGoal,
  topicTags,
  reviewRecord = null,
}) {
  return {
    // Identity — no ID yet. Cards below Approved do not have one (§6.1).
    id: null,
    sourceId,
    engine,
    level,

    // Content — languages are peers; Korean arrives at Stage 6 (§7.2).
    text: { en: [...englishBeats], ko: null },

    // Delivery
    presentationStyle,
    emotion,
    animationHint,

    // Review
    conversationGoal,
    topicTags: [...topicTags],
    lifecycleState: 'Generated',
    reviewRecord,
  };
}

/** Read a possibly dotted field path ("text.en") off a card. */
export function readField(card, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), card);
}

/** A field counts as present when it is neither null/undefined nor an empty array/string. */
export function isPresent(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/** Which fields the card's current state requires. Card Spec §5.4. */
export function requiredFieldsFor(state) {
  return stateIndex(state) >= stateIndex('Approved')
    ? REQUIRED_AT_APPROVED
    : REQUIRED_AT_GENERATED;
}

/**
 * Move a card to the next state.
 *
 * Forward movement is one step at a time — states are never skipped
 * (Architecture §12.1). Backward movement is normal and cheap, so it is
 * permitted to any earlier state without ceremony.
 */
export function moveTo(card, nextState) {
  const from = stateIndex(card.lifecycleState);
  const to = stateIndex(nextState);
  if (to === -1) throw new Error(`"${nextState}" is not a lifecycle state.`);
  if (to > from + 1) {
    throw new Error(
      `Cannot skip from ${card.lifecycleState} to ${nextState}. ` +
        `Next state is ${LIFECYCLE_STATES[from + 1]} (Architecture §12.1).`
    );
  }
  return { ...card, lifecycleState: nextState };
}

/**
 * Approve a card and freeze its identity.
 *
 * Approval is a human decision made outside the Factory (Factory §4 Stage 5,
 * Card Spec §4), which is why it is a separate function rather than a Factory
 * stage. It is also the only place an ID is ever assigned.
 */
export function approve(card, id) {
  if (card.lifecycleState !== 'Reviewed') {
    throw new Error(`Only a Reviewed card can be approved (was ${card.lifecycleState}).`);
  }
  if (card.id) throw new Error(`Card already carries the frozen ID ${card.id}; identity never changes (§6.1).`);
  return { ...card, id, lifecycleState: 'Approved' };
}

/**
 * Attach the Korean text produced by Stage 6.
 *
 * Translation tracks a final text, not a draft, so it is refused before
 * approval (Factory §4 Stage 6). Beat parity is checked here because it is the
 * one mechanical constraint on translation (Card Spec §7.2) and catching it at
 * the point of attachment gives a far clearer error than catching it at compile.
 */
export function attachTranslation(card, koreanBeats) {
  if (stateIndex(card.lifecycleState) < stateIndex('Approved')) {
    throw new Error('Translation happens only after approval (Factory §4 Stage 6).');
  }
  if (koreanBeats.length !== card.text.en.length) {
    throw new Error(
      `Beat parity failure: English has ${card.text.en.length} beats, Korean has ${koreanBeats.length} (§7.2).`
    );
  }
  return { ...card, text: { ...card.text, ko: [...koreanBeats] } };
}

/**
 * Allocate the next card ID.
 *
 * Deliberately opaque and sequential. An ID "is an identifier, not a
 * description" and must not encode anything that might change (§6.1). IDs are
 * never reused, including for retired cards, so the allocator takes every ID
 * ever issued — not merely the live ones.
 */
export function nextCardId(everIssuedIds) {
  const highest = everIssuedIds
    .map((id) => Number.parseInt(String(id).replace(/^CARD-/, ''), 10))
    .filter((n) => Number.isInteger(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `CARD-${String(highest + 1).padStart(4, '0')}`;
}
