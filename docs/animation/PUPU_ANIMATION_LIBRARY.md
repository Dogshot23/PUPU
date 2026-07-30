# PUPU Animation Library

**Status:** Permanent reference document — structure populated with the approved MVP entries
**Type:** Data design document — not engine behaviour, not code
**Audience:** Anyone (human or AI) designing, reviewing, or adding individual animation entries to PUPU's catalogue, for the lifetime of the project.

This document sits below `PUPU_PERSONALITY_SPEC.md`, `PUPU_ANIMATION_ARCHITECTURE.md`, and `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md`. Those three documents define, respectively, who PUPU is, how the engine that runs him is built, and how rarity and discovery are meant to feel. This document holds the individual animation concepts that get plugged into that engine as data — nothing here redefines or reinterprets anything those three documents already establish.

Sections 1–6 below define the shape every entry must take. Section 7 contains the first populated entries: the 19 concepts approved for the first build, as locked by `PUPU_MVP_SCOPE.md`. A note on that document's count appears at the top of Section 7.

---

## 1. Purpose

This document contains the individual animation entries the engine can execute. Each entry is a self-contained concept — a specific thing PUPU can do — described as data, in line with the Animation Registry's role in `PUPU_ANIMATION_ARCHITECTURE.md`. The engine doesn't know or care what a "yawn" or a "burp" is; it only knows how to read an entry's fields and act on them. This document is where that meaning lives.

Nothing in this document defines engine behaviour, and nothing in it should be read as an implementation plan. An entry describes *what* an animation is and *why* it exists — the architecture document already governs *how* any entry gets scheduled, selected, and played.

---

## 2. Animation Entry Format

Every animation entry includes the following fields:

- **ID** — a stable, unique identifier for the entry.
- **Name** — a short, human-readable name for the animation.
- **Tier** — Common, Uncommon, Rare, or Legendary, per `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md`.
- **Category** — an organisational grouping (§3).
- **Priority** — Essential, Important, or Later, as locked by `PUPU_MVP_SCOPE.md`. Planning metadata only; has no meaning to the running engine.
- **Trigger type** — direct, contextual, or idle, per the trigger classes in `PUPU_ANIMATION_ARCHITECTURE.md`. This is also where an animation's reliability lives — a direct- or contextual-trigger entry may be deterministic in a way its tier alone wouldn't imply.
- **Eligible states** — which of PUPU's states the animation is allowed to play from.
- **Cooldown philosophy** — a plain-terms description of how repetition-resistant this animation should feel, not a number.
- **Description** — what happens, described visually and physically rather than technically.
- **Personality purpose** — what this animation says about PUPU as a creature.
- **Primitive composition** — which primitives from `PUPU_ANIMATION_ARCHITECTURE.md` §9 the animation is built from.
- **Sound relationship** — whether the animation is paired with sound, and what kind of relationship that pairing has.
- **Why this animation exists** — the specific justification for including it now, at MVP stage.
- **Testing notes** — what to watch for once built and observed in real use.

---

## 3. Categories

- **Physical** — body movements and physics-driven behaviour.
- **Emotional** — expressions and reactions tied to a feeling.
- **Curious** — behaviour that reads as noticing or investigating something.
- **Silly** — playful, comic behaviour without a gross-out element.
- **Sleepy** — dozing, resting, and waking behaviour.
- **Gross** — child-friendly, playground-silly behaviour.
- **Magical** — behaviour that reads as strange or wondrous, typically reserved for rarer tiers.
- **Environmental** — behaviour tied to season, calendar, or surroundings.
- **Interaction-based** — behaviour specifically tied to something the student directly does.

No new categories were introduced while populating Section 7.

---

## 4. Tier Rules

Common, Uncommon, Rare, Legendary — exactly as defined in `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md`. No fifth tier (e.g. a "Reliable" tier) exists or was introduced. Where an entry needs to feel dependable, that reliability is expressed through its **trigger type** (direct or a sustained contextual pairing), never by inventing a new tier.

---

## 5. Animation Design Principles

- **Personality over spectacle.**
- **Simple animations can be powerful.**
- **No animation should interrupt learning.**
- **Every animation should reveal something about PUPU.**

Held to strictly throughout Section 7 — including for Rare and Legendary entries, which were deliberately kept as simple as their Common and Uncommon counterparts rather than made more elaborate to justify their rarity.

---

## 6. Example Entry Template

```
ID:
Name:
Tier:
Category:
Priority:
Trigger type:
Eligible states:
Cooldown philosophy:
Description:
Personality purpose:
Primitive composition:
Sound relationship:
Why this animation exists:
Testing notes:
```

---

## 7. MVP Entries

This section contains the 19 animation concepts locked by `PUPU_MVP_SCOPE.md`.

Entries are grouped below using the same five MVP groups for readability. The group heading is organisational only — it is not a field on the entry itself, and the engine has no concept of "group."

### Direct Interaction

```
ID: MVP-01
Name: Belly Squish
Tier: Common
Category: Interaction-based
Priority: Essential
Trigger type: Direct
Eligible states: Idle, Sleeping (wakes into Reacting)
Cooldown philosophy: Effectively none, by design. This is the one entry in the whole catalogue where the point is reliability rather than rarity — any cooldown present should exist only to prevent an unnatural double-fire from a single continuous press, never to make the response feel rare or withheld.
Description: The moment a student presses PUPU's belly, it compresses inward at the point of contact and springs gently back, like pressing a soft toy.
Personality purpose: Establishes that PUPU has a real, touchable body — the one place a student can act and know exactly what will happen, the way a real squishy toy behaves every single time.
Primitive composition: Squash (at the point of contact), Translate (a slight give), Timing curve (quick compress, soft settle).
Sound relationship: Paired reliably, every time, with the belly button squish sound — the one sound in the personality spec that is not rare, because it's a direct physical response to a direct physical action.
Why this animation exists: Without one fully dependable interaction, nothing else PUPU does can be trusted as "real" by a student — this is the anchor everything else is built on top of.
Testing notes: Watch specifically for any perceived delay, inconsistency, or "randomness" in the response — any hint of unreliability here undermines trust in PUPU as a physical creature far more than a missed idle behaviour would.
```

### Idle Personality

```
ID: MVP-02
Name: Weight Shift
Tier: Common
Category: Physical
Priority: Essential
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Short enough to recur reasonably often relative to other idle entries, since this is meant to be the baseline "someone is here" signal — but still bounded by the idle-wide cooldown so it never crowds out silence.
Description: PUPU's weight slowly leans from one side to the other, unhurried, as if simply settling while waiting.
Personality purpose: The cheapest, most direct expression of "a small creature is quietly present," with no event or reason behind it beyond existing.
Primitive composition: Translate (slow lean), Timing curve (gentle, unhurried ease).
Sound relationship: None. Idle presence should not require sound to read as alive.
Why this animation exists: This is the entry the MVP most depends on to prove idle pacing works at all — it needs to exist first because every other idle entry's rarity is judged relative to how often this one appears.
Testing notes: If students describe PUPU as "just sitting there doing nothing" even when this is firing at its intended rate, the pacing — not the animation itself — likely needs revisiting.
```

```
ID: MVP-03
Name: Slow Blink
Tier: Common
Category: Physical
Priority: Essential
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Short, allowing fairly frequent recurrence — a blink is cheap enough, and universal enough to a living creature, that it can appear more often than most idle entries without feeling repetitive.
Description: A single, unhurried blink — not fast, not held, just a natural close-and-open.
Personality purpose: A blink does more for "this is alive" per unit of effort than almost anything else PUPU can do; it's the simplest possible proof of a living creature's rhythm.
Primitive composition: Blink, Timing curve (natural, unhurried).
Sound relationship: None.
Why this animation exists: Establishes the baseline blink asset the rest of the eye-based entries (Double Blink, Sleepy Half-Eyes, Surprised Widen, Surprised Gasp, Yawn) build from, and is on its own one of the cheapest possible aliveness signals to validate first.
Testing notes: Confirm this reads as a natural, organic blink rather than a mechanical repeated tic — timing curve and recurrence rate matter more here than the motion itself.
```

```
ID: MVP-04
Name: Wandering Gaze
Tier: Common
Category: Curious
Priority: Important
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Moderate — frequent enough to reinforce that PUPU notices his surroundings, but paced so it doesn't read as constant scanning.
Description: PUPU's gaze drifts slowly to one side, as if something just off-screen caught his attention, then returns to neutral.
Personality purpose: Signals that PUPU is aware of a world beyond the screen's edge, not just reactive to the student directly in front of him — reinforces curiosity as a default trait, not a triggered one.
Primitive composition: Translate (gaze/eye region), Timing curve (slow drift, slow return).
Sound relationship: None.
Why this animation exists: Adds idle variety cheaply, using body-movement vocabulary already established by Weight Shift, while specifically testing whether "noticing" reads clearly without any accompanying sound or message.
Testing notes: Watch whether students ever look toward whatever direction PUPU appears to be looking — that response would be a strong positive signal that this is landing as intended.
```

```
ID: MVP-05
Name: Stretch Upward
Tier: Uncommon
Category: Physical
Priority: Important
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Longer than Weight Shift or Slow Blink — occasional enough to feel like a small, distinct moment rather than part of the constant idle texture.
Description: PUPU stretches gently upward and taller for a moment, then eases back down to his normal shape.
Personality purpose: Reinforces PUPU's soft, elastic body — a small physical flourish that says something about his materiality without needing a story behind it.
Primitive composition: Stretch, Timing curve (slow ease in and out).
Sound relationship: None typically; kept silent to preserve idle's overall quietness.
Why this animation exists: Extends idle variety using the same body-movement groundwork as Weight Shift, at low additional cost, giving the Idle group more than one flavour of "quiet aliveness" to observe.
Testing notes: Confirm this doesn't read as the start of a yawn — the two should feel distinct, since Yawn (Rare) needs to still land as a notable moment later on.
```

```
ID: MVP-06
Name: Wobble Jiggle
Tier: Uncommon
Category: Physical
Priority: Important
Trigger type: Contextual (tied to the end of a preceding movement, whichever state that movement occurred in — flagged in Section 7 preamble as a judgment call worth confirming)
Eligible states: Idle, Reacting (mirrors whichever state the preceding movement occurred in)
Cooldown philosophy: Moderate — should not fire after every single motion, or it stops feeling like an occasional flourish and starts feeling automatic. Paced so it reads as PUPU's body settling only sometimes, not always.
Description: After a movement resolves, PUPU's whole body jiggles gently and settles, like soft gelatin coming to rest.
Personality purpose: Reinforces the "soft body" identity that underlies everything else PUPU does — a physical signature that makes other movements feel like they're happening to a real, yielding creature rather than a rigid shape.
Primitive composition: Wobble, Timing curve (decaying oscillation).
Sound relationship: Occasional pairing with the Wobble sound category, not guaranteed every occurrence.
Why this animation exists: Tests whether a physics-flavoured layer, applied on top of other motion rather than standing alone, is distinguishable and additive rather than redundant — a question worth answering early since several future entries may want to reuse this same layering approach.
Testing notes: Watch specifically whether this reads as "PUPU's body reacting to its own movement" or as "a second animation playing right after the first" — the former is the goal; the latter would suggest the contextual pairing needs retuning.
```

```
ID: MVP-07
Name: Sleepy Half-Eyes
Tier: Uncommon
Category: Sleepy
Priority: Later
Trigger type: Idle
Eligible states: Idle (occurring within an unusually long idle stretch, ahead of any transition to Sleeping)
Cooldown philosophy: Long enough that it appears at most once within any single long idle stretch — this is meant to signal drowsiness building, not to repeat within the same lull.
Description: PUPU's eyes droop to about half-closed for a few seconds, then return to normal, without any other part of him moving.
Personality purpose: Gives a long quiet stretch its own texture — a hint that time spent doing nothing is starting to feel like rest to PUPU, not just an absence of events.
Primitive composition: Blink (held partway rather than completing), Timing curve (slow droop, slow return).
Sound relationship: None.
Why this animation exists: Reuses the blink asset already validated by Slow Blink and Double Blink at very low additional cost, and gives the Sleepy category an Idle-state entry to sit alongside Yawn before the Sleeping state itself is exercised.
Testing notes: Confirm this doesn't get mistaken for a slow blink at a glance — the "held" quality is what distinguishes it, and needs to read clearly even to someone glancing briefly.
```

### Thinking / Response

```
ID: MVP-08
Name: Curious Tilt
Tier: Common
Category: Curious
Priority: Essential
Trigger type: Contextual (tied to the Thinking state)
Eligible states: Thinking
Cooldown philosophy: Short — this is meant to appear often, since Thinking states themselves occur often through an ordinary lesson, and it's the primary signal that PUPU is following along.
Description: As PUPU enters a brief moment of "preparing to respond," his body tilts slightly with an inquisitive look, then settles once the moment resolves.
Personality purpose: The clearest possible signal that PUPU is present in the rhythm of the lesson without ever taking part in it directly — he notices something is happening, and that's all.
Primitive composition: Rotate (tilt), Timing curve (quick ease into the tilt, brief hold, ease out).
Sound relationship: None.
Why this animation exists: Directly tests whether PUPU can participate visibly in a lesson moment without pulling attention toward himself or away from the teacher — one of the MVP's central open questions.
Testing notes: Watch for any sign a student is waiting on this tilt before continuing, rather than simply noticing it in passing — the former would suggest it's reading as more significant than intended.
```

```
ID: MVP-09
Name: Content Smile
Tier: Uncommon
Category: Emotional
Priority: Essential
Trigger type: Contextual (tied to a warm moment flagged by the lesson context)
Eligible states: Reacting
Cooldown philosophy: Moderate — frequent enough that warmth doesn't feel withheld, but paced so it doesn't fire on every possible warm moment and lose its meaning.
Description: PUPU brightens briefly — a slight rounding and warming of his whole body, paired with a soft, relaxed blink — then eases back to neutral.
Personality purpose: The simplest possible proof that PUPU can feel warmth toward a moment, not just react mechanically to it — this is the entry most responsible for testing whether attachment can form at all.
Primitive composition: Scale (a gentle, brief puff of warmth), Blink (soft), Tint (a faint warm shift), Timing curve (slow bloom and settle).
Sound relationship: None required; can co-occur naturally with ambient lesson sound without needing its own.
Why this animation exists: Without at least one entry like this, the MVP has no way to test whether PUPU can feel warm rather than merely present — this is the anchor for the Emotional Reactions group's core question.
Testing notes: Watch whether students describe this moment using words like "happy" or "pleased" unprompted — that's the clearest sign the intended feeling is landing rather than just the motion being noticed.
```

```
ID: MVP-10
Name: Double Blink
Tier: Common
Category: Physical
Priority: Important
Trigger type: Contextual (tied to the Typing state; selected occasionally within it, not guaranteed every occurrence)
Eligible states: Typing
Cooldown philosophy: Moderate — should not appear every time a message types, or it would compete for attention with Attentive Lean and the typing sound texture already defined in the personality spec.
Description: Two quick blinks in slightly comic succession, occurring while a message is being typed out.
Personality purpose: A small comic texture during Typing, reusing the blink vocabulary already established, to keep that state from feeling identical to ordinary Idle blinking.
Primitive composition: Blink (twice, in quick succession), Timing curve (quick-quick, slightly playful).
Sound relationship: Not directly paired, but naturally co-occurs with the Key taps sound texture already playing during Typing.
Why this animation exists: A near-free variation on Slow Blink, added specifically to give the Typing state its own small identity distinct from Idle at very low additional build cost.
Testing notes: Watch that this never appears so often that Typing starts to feel busier or more attention-grabbing than the message itself — the message always needs to remain the primary thing being looked at.
```

```
ID: MVP-11
Name: Attentive Lean
Tier: Common
Category: Curious
Priority: Important
Trigger type: Contextual (sustained for the full duration of the Typing state; reliability comes from this trigger relationship, not from the tier)
Eligible states: Typing
Cooldown philosophy: Effectively none within its own occurrence — begins when typing begins and resolves to neutral the instant typing ends, every time, the same way Attentive Lean's tier alone would not imply. No rarity cooldown is meant to suppress it; it is meant to be a consistent companion to the Typing state itself, similar in spirit (though not in mechanism) to how Belly Squish is reliable through its trigger type.
Description: PUPU leans very slightly and sustainedly toward the message as it types, settling back to neutral the moment typing finishes.
Personality purpose: Makes Typing feel like PUPU is listening along, rather than merely being present while something else happens on screen.
Primitive composition: Translate (slight, sustained lean), Timing curve (smooth ease in at typing's start, smooth ease out at its end, tied to those exact moments).
Sound relationship: None required; naturally coincides with the Typing ambience sound already defined in the personality spec.
Why this animation exists: Tests whether a contextual trigger can feel dependable and coherent without being classified as a new "reliable" tier — proving the trigger-type mechanism the whole design relies on for this distinction.
Testing notes: Confirm the lean consistently begins and ends exactly with typing's start and end — any visible lag or early settling would undercut the "listening along" effect this exists to create.
```

### Emotional Reactions

```
ID: MVP-12
Name: Happy Hop
Tier: Uncommon
Category: Emotional
Priority: Essential
Trigger type: Contextual (tied to an energetic or warm moment flagged by the lesson context)
Eligible states: Reacting
Cooldown philosophy: Moderate — enough restraint that consecutive warm moments don't each produce a hop, which would start to feel like a performance cue rather than a spontaneous reaction.
Description: A single soft bounce in place — PUPU compresses slightly and springs upward once, then settles.
Personality purpose: PUPU's primary "good moment" beat — small and soft, landing gently rather than as a burst of excitement, in keeping with the instruction that even PUPU's energetic moments should never feel abrupt.
Primitive composition: Scale (brief plump compression), Translate (single soft vertical hop), Timing curve (quick ease-out, gentle landing).
Sound relationship: Paired with the Celebration sound at its softest, each time it occurs.
Why this animation exists: Gives the Emotional Reactions group its baseline "shared good moment" beat, without which the MVP has no way to test whether a lesson-linked reaction feels supportive rather than evaluative.
Testing notes: Watch closely that this never reads as a scorecard response tied to being "right" — the intended feeling is shared enjoyment of a moment, not a judgment of performance.
```

```
ID: MVP-13
Name: Proud Beam
Tier: Rare
Category: Emotional
Priority: Important
Trigger type: Contextual (tied to a particularly warm moment flagged by the lesson context)
Eligible states: Reacting
Cooldown philosophy: Long, in keeping with its Rare tier — noticeably less frequent than Happy Hop, so the two remain distinguishable in intensity rather than blurring together.
Description: PUPU brightens more fully than in Content Smile or Happy Hop — a warm glow-like brightening of colour, a soft wide-eyed look, held for a beat before easing away.
Personality purpose: Gives the Emotional Reactions group a second, distinctly bigger beat above Happy Hop, so warmth has more than one register.
Primitive composition: Scale (fuller, slower brightening), Tint (soft warm shift), Blink (soft, warm), Timing curve (slow bloom and settle).
Sound relationship: Paired with the Celebration sound at its softest, per its Rare-tier restraint.
Why this animation exists: Tests whether two distinct intensities of warmth (Happy Hop and this) can coexist without collapsing into "the same reaction, sometimes bigger" — an open question worth answering with real students before more emotional range is added.
Testing notes: If students or teachers describe this and Happy Hop as "the same thing," the two need more differentiation before further Emotional entries are added.
```

```
ID: MVP-14
Name: Surprised Widen
Tier: Uncommon
Category: Emotional
Priority: Important
Trigger type: Contextual (tied to an unexpected or notable moment flagged by the lesson context)
Eligible states: Reacting
Cooldown philosophy: Moderate, with a shared category cooldown alongside Surprised Gasp so the two "surprise" entries don't stack closely and blur together.
Description: PUPU's eyes open wider than usual for a brief moment, with a small quick pop of his whole body, then settle back to normal.
Personality purpose: Extends PUPU's emotional range to include surprise, using the eye vocabulary already built for Slow Blink and Double Blink rather than introducing anything new.
Primitive composition: Blink (widened variant, rather than closing), Scale (small quick pop), Timing curve (sharp onset, quick settle).
Sound relationship: Optional light pairing with a soft PUPU noise; not required every occurrence.
Why this animation exists: A cheap variation reusing established eye-primitive work, extending the Emotional Reactions group's range without new build cost.
Testing notes: Confirm this reads as distinct from Content Smile and Happy Hop at a glance — surprise and warmth should not be confusable even briefly.
```

```
ID: MVP-15
Name: Shy Peek
Tier: Rare
Category: Emotional
Priority: Later
Trigger type: Idle (inferred; not specified upstream — flagged in Section 7 preamble)
Eligible states: Idle
Cooldown philosophy: Long, in keeping with its Rare tier — this should feel like an occasional glimpse of shyness, not a repeatable gesture.
Description: PUPU briefly turns and looks away, pauses for a beat, then peeks back toward the screen.
Personality purpose: Adds a shy, slightly self-conscious note to PUPU's range, distinct from curiosity or surprise — a small, specific quirk rather than a generic "cute" gesture.
Primitive composition: Rotate (slight turn away), Blink (soft closing), Timing curve (a held pause before the return).
Sound relationship: None.
Why this animation exists: A charming, low-cost addition to the Emotional Reactions group's range — deliberately deferred to Later since Happy Hop and Content Smile already cover the group's core validation question.
Testing notes: Since its trigger type was inferred rather than specified, confirm Idle is the right fit before building — a version tied to a lesson moment (e.g. after being "noticed") may read differently and would need separate evaluation.
```

### Rare Moments

```
ID: MVP-16
Name: Yawn
Tier: Rare
Category: Sleepy
Priority: Essential
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Long, in keeping with its Rare tier, and sharing a category cooldown with Sleepy Half-Eyes so the two Sleepy entries don't appear in close succession.
Description: A slow stretch, paired with a slow-closing blink, easing gently in and then out — exactly the composition already given as a worked example in the architecture document.
Personality purpose: A genuine "haven't seen that in a while" moment built entirely from primitives already validated elsewhere in this set — proof that a Rare moment doesn't need anything new to feel special.
Primitive composition: Stretch, Blink (slow-closing), Timing curve (gentle ease-in-then-out).
Sound relationship: A sound event marker placed at the animation's midpoint, pairing with a soft, quiet sound in keeping with the Sleepy category's restrained sound profile.
Why this animation exists: Chosen as the MVP's first Rare entry specifically because it's inexpensive to build — it reuses the Stretch and Blink work already required elsewhere — while still being a genuine, noticeable Rare moment, making it a low-risk first test of whether Rare pacing feels right.
Testing notes: This is the primary entry for judging whether the Rare tier's pacing feels right at all — if this appears too often or too rarely relative to how it feels to watch, that's a signal for the Cooldown Manager's tuning, not for the animation itself.
```

```
ID: MVP-17
Name: Double Take
Tier: Rare
Category: Curious
Priority: Important
Trigger type: Idle (inferred; not specified upstream — flagged in Section 7 preamble)
Eligible states: Idle
Cooldown philosophy: Long, in keeping with its Rare tier, and distinct enough from Yawn's cooldown that the two Rare entries don't feel like they're on the same schedule.
Description: PUPU looks away, pauses, then snaps back to look again, as if something had just caught his attention a beat too late.
Personality purpose: A second, distinct flavour of Rare moment — confirms that "Rare" can hold more than one kind of surprise without any single one feeling diluted by the others.
Primitive composition: Rotate (look away, then snap back), Timing curve (a held pause followed by a sharp correction).
Sound relationship: None, or a very soft optional pairing — kept light so the visual snap itself carries the moment.
Why this animation exists: Gives the Rare tier a second entry specifically to test whether the tier holds together across more than one moment, which a single entry alone (Yawn) couldn't confirm on its own.
Testing notes: Since its trigger type was inferred, confirm Idle is the right fit — this could plausibly also work as a Reacting-state entry, and that choice would change how frequently it can be observed.
```

```
ID: MVP-18
Name: Surprised Gasp
Tier: Rare
Category: Emotional
Priority: Later
Trigger type: Contextual (tied to a notable or unexpected moment flagged by the lesson context — inferred; flagged in Section 7 preamble)
Eligible states: Reacting
Cooldown philosophy: Long, in keeping with its Rare tier, sharing a category cooldown with Surprised Widen so the milder and stronger versions of "surprise" don't appear close together.
Description: PUPU's eyes and whole body open wide for a split second — a stronger, rarer version of Surprised Widen — then settles immediately.
Personality purpose: Gives PUPU's surprise register a rarer, more intense expression than Surprised Widen, reserved for genuinely unusual moments rather than everyday ones.
Primitive composition: Blink (wide), Scale (quick pop), Timing curve (sharp, split-second), with a sound event marker at the moment's peak.
Sound relationship: Paired with a PUPU noise, reliably when it occurs, since the sound is part of what makes the split-second moment register at all.
Why this animation exists: A reasonable, low-cost future addition once Surprised Widen and the other Reacting-state entries have been observed working — deferred to Later since it doesn't test anything the Essential and Important Emotional entries don't already cover.
Testing notes: Confirm this and Surprised Widen remain clearly distinguishable in intensity once both are observed in real use — if they read as the same moment at two different volumes rather than two different moments, one may be redundant.
```

```
ID: MVP-19
Name: Freeze-Frame Pause
Tier: Legendary
Category: Physical
Priority: Essential
Trigger type: Idle
Eligible states: Idle
Cooldown philosophy: Very long, tracked per student across sessions rather than reset each lesson, in keeping with how the architecture requires Legendary cooldowns to be tracked — this should be able to go weeks or months between occurrences without that being treated as a problem.
Description: PUPU holds completely, noticeably still for a beat longer than any ordinary pause — long enough to register as unusual — then resumes with a single blink, as if he'd simply drifted off somewhere for a second.
Personality purpose: The MVP's only Legendary entry, deliberately built from almost nothing — stillness and a single blink — so that discovering it feels like witnessing something almost accidental, never like being shown a designed spectacle.
Primitive composition: Timing curve (an unusually extended hold at a neutral pose), Blink (single, at the resumption).
Sound relationship: None, deliberately. Silence reinforces the "almost accidental" quality this entry depends on — a produced sound moment would work against that.
Why this animation exists: Chosen as the MVP's one Legendary entry specifically because its low build cost lets the MVP test the discovery mechanism itself — rarity, long-term cooldown, the "I've never seen him do that" reaction — without also having to prove out a visually ambitious effect at the same time. If the feeling doesn't land with something this simple, a more elaborate entry wouldn't fix that.
Testing notes: This is the single most important entry to watch closely and patiently — per the rare-animation spec, if it ever starts to feel routine to a long-term student, the tuning (not the concept) has failed, however good the animation looks. Given its long cooldown, meaningful observation here will take real time, not a single testing session.
```
