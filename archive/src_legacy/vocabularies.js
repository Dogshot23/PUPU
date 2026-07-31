/**
 * Closed vocabularies for the Content Factory.
 *
 * Every classification field on a Conversation Card draws from a set defined
 * here. This file exists so that "closed vocabulary" is enforceable rather than
 * aspirational (PUPU_CONVERSATION_CARD_SPEC.md §13, PUPU_CONTENT_ARCHITECTURE_V2.md §7).
 *
 * Nothing in this file is invented. Each set is transcribed from the document
 * named above it. Adding a value to any of these sets is an architectural
 * decision recorded in the changelog — never a side effect of writing a card
 * that does not fit (PUPU_CONTENT_ARCHITECTURE_V2.md §3.3, §15.5).
 */

/** The eight Conversation Engines. PUPU_CONTENT_ARCHITECTURE_V2.md §3.2. */
export const ENGINES = [
  'Share',
  'Guess',
  'Perform',
  'Compare',
  'Challenge',
  'Teach',
  'Imagine',
  'Continue',
];

/**
 * The Character Moment classification occupies the same field position as an
 * engine, which is why no separate card-class field exists and why the
 * seed/moment ratio is computable from one field (Card Spec §6.3).
 * Out of scope for V1, declared here so the field's full domain is honest.
 */
export const CHARACTER_MOMENT = 'Character Moment';

/** CEFR levels. PUPU_CONTENT_ARCHITECTURE_V2.md §7, Card Spec §6.4. */
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

/**
 * Emotion vocabulary, transcribed from PUPU_CONTENT_CREATION_GUIDE.md
 * ("# Emotion"), which Card Spec §8.2 names as the established source.
 */
export const EMOTIONS = [
  'happy',
  'curious',
  'excited',
  'sleepy',
  'confused',
  'proud',
  'mischievous',
  'thoughtful',
  'surprised',
];

/**
 * Presentation styles are "defined by the application and are not enumerated"
 * in the content documents (Card Spec §8.1, Architecture §5.3).
 *
 * PROVISIONAL: no document in the project records the application's actual set.
 * Only 'default' is certain to exist, because Card Spec §8.1 requires that every
 * card read correctly in the default style. This list must be reconciled with
 * the application before any card ships. It is deliberately minimal rather than
 * guessed, so that a card cannot silently claim a style the app does not have.
 */
export const PRESENTATION_STYLES = ['default'];

/** The six lifecycle states, in order. PUPU_CONTENT_ARCHITECTURE_V2.md §12. */
export const LIFECYCLE_STATES = [
  'Idea',
  'Generated',
  'Reviewed',
  'Approved',
  'Compiled',
  'Live',
];

/**
 * The animation catalogue. An animation hint must name an entry that exists
 * (Card Spec §8.3, §13 "Animation hints resolve").
 * Transcribed from PUPU_ANIMATION_LIBRARY.md §7 (the 19 MVP entries).
 * Keyed by the library's stable ID so a rename of the human-readable Name
 * cannot break a card.
 */
export const ANIMATION_CATALOGUE = {
  'MVP-01': 'Belly Squish',
  'MVP-02': 'Weight Shift',
  'MVP-03': 'Slow Blink',
  'MVP-04': 'Wandering Gaze',
  'MVP-05': 'Stretch Upward',
  'MVP-06': 'Wobble Jiggle',
  'MVP-07': 'Sleepy Half-Eyes',
  'MVP-08': 'Curious Tilt',
  'MVP-09': 'Content Smile',
  'MVP-10': 'Double Blink',
  'MVP-11': 'Attentive Lean',
  'MVP-12': 'Happy Hop',
  'MVP-13': 'Proud Beam',
  'MVP-14': 'Surprised Widen',
  'MVP-15': 'Shy Peek',
  'MVP-16': 'Yawn',
  'MVP-17': 'Double Take',
  'MVP-18': 'Surprised Gasp',
  'MVP-19': 'Freeze-Frame Pause',
};

/** The six Raw Content types. PUPU_RAW_CONTENT_SPEC.md §2. */
export const RAW_TYPES = [
  'Fact',
  'Riddle',
  'Joke',
  'Challenge',
  'Comparison',
  'Story Seed',
];

/** V1 supports Facts only. Widening this is the whole cost of adding a type. */
export const SUPPORTED_RAW_TYPES = ['Fact'];

/** Languages held on a card. All languages are peers (Card Spec §5.2). */
export const LANGUAGES = ['en', 'ko'];

export const isEngine = (v) => ENGINES.includes(v) || v === CHARACTER_MOMENT;
export const isLevel = (v) => LEVELS.includes(v);
export const isEmotion = (v) => EMOTIONS.includes(v);
export const isPresentationStyle = (v) => PRESENTATION_STYLES.includes(v);
export const isLifecycleState = (v) => LIFECYCLE_STATES.includes(v);
export const isAnimation = (v) => Object.prototype.hasOwnProperty.call(ANIMATION_CATALOGUE, v);

/** Ordered comparison of lifecycle states. States are never skipped (§12.1). */
export const stateIndex = (state) => LIFECYCLE_STATES.indexOf(state);
