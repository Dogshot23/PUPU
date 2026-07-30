# PUPU Animation MVP Plan

**Status:** Permanent reference document — planning only
**Type:** Planning document — not engine behaviour, not code, not a catalogue entry format
**Audience:** Anyone (human or AI) deciding what to build first for PUPU, before the full animation catalogue exists.

This document sits below `PUPU_PERSONALITY_SPEC.md` and `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md`, and beside `PUPU_ANIMATION_ARCHITECTURE.md` and `PUPU_ANIMATION_LIBRARY.md`. It does not redefine who PUPU is, how the engine works, how rarity should feel, or how a library entry should be documented — those four documents remain the authorities on each of those questions. This document exists only to answer one narrower question: **what is the smallest set of animations worth building first, and why those specifically?**

Nothing here is a commitment to ship every animation named below exactly as described. These are concepts to validate the MVP's purpose, not finished library entries — each one, if and when it's actually built, should still be written up properly against the format in `PUPU_ANIMATION_LIBRARY.md` and checked against the design principles and checklist that document and the rare-animation spec already establish.

---

## 1. Why an Animation MVP Is Needed

The full architecture in `PUPU_ANIMATION_ARCHITECTURE.md` is built to scale to hundreds of animations without engine changes. That is exactly why it would be a mistake to *validate* the architecture with hundreds of animations. A large catalogue built before anyone has watched a single real student encounter PUPU risks getting the scale right and the feeling wrong — and feeling is the only thing that actually matters here.

An MVP exists to answer questions that no amount of design documentation can answer on its own:

- Does PUPU feel like a small creature sharing the room, or does he still feel like a UI element with animations attached to it?
- Do the idle behaviours actually produce the "small creature waiting patiently nearby" feeling the personality spec describes, or do they read as glitches, delays, or nothing at all?
- Does the burstiness-and-drought pacing in the architecture actually land as alive when a real student is watching, or does it need retuning before a single additional animation is worth writing?
- Does a Rare or Legendary moment, seen for the first time by someone who didn't design it, actually produce a "did you see that?" reaction — or does it need to be reworked before more of the same kind get built?

These are questions about *feel*, and feel can only be tested with something built and watched, not something specified. The MVP is that something: the minimum surface area needed to observe PUPU's core personality in action, cheaply enough to change course if the first impression is wrong.

Building the full catalogue first would also invert the cost of being wrong. A flaw discovered after twenty animations are built costs twenty rewrites, or twenty animations quietly carrying a flaw nobody noticed because attention was spread too thin to watch any one of them closely. A flaw discovered after eight is cheap to fix and cheap to learn from.

---

## 2. Philosophy Behind Selecting MVP Animations

Every animation proposed for the MVP was filtered through the same set of questions, in this order:

1. **Does this reveal personality, or just movement?** An animation that could belong to any cute character isn't pulling weight for PUPU specifically. The MVP set favours animations that only make sense for a soft, slightly weird, small creature — not animations that would work equally well on a different mascot with a different paint job.
2. **Is this simple to build and simple to read?** Per the personality spec, if a behaviour needs a paragraph to explain, it's probably wrong for PUPU — and that principle applies with extra force at MVP stage, where the goal is to learn quickly, not to show off range. A weight shift or a blink says as much about aliveness, per unit of effort, as something far more elaborate.
3. **Does it coexist with a lesson, not compete with one?** Every candidate was checked against whether it could plausibly demand attention away from the teacher. Anything that reads as needing to be watched, rather than being pleasant to notice, was set aside for later.
4. **Does it test something the MVP specifically needs to learn?** Beyond being individually good, each animation was chosen because it exercises a part of the system the team needs early confidence in — idle pacing, direct-interaction feel, lesson-linked timing, emotional warmth, or the discovery feeling of rarity. An animation that's charming but doesn't test anything new was deprioritised in favour of one that does.
5. **Does its tier match what it's meant to prove, not just what looks impressive?** The MVP deliberately does not reach for spectacle. A handful of Common and Uncommon behaviours do most of the work of "feeling alive"; a small number of Rare entries and exactly one Legendary entry exist to test whether discovery itself works, not to showcase everything the catalogue could eventually contain.

Quantity was treated as a cost, not a goal, throughout. Every animation added to this plan should have had to justify its inclusion against the four questions above — the list was built by asking "what's the least we can build and still know something real," not "what's a good starter pack."

---

## 3. Minimum Animation Groups Required

Five groups are treated as the minimum necessary surface area to say anything meaningful about whether PUPU feels alive. Each tests a different part of the personality and architecture, and none can substitute for another:

**Direct Interaction** — tests the one place in the whole system where reliability, not surprise, is the point. Per the personality spec, the belly-button squish is deliberately the exception to "unpredictable is better" — a student needs at least one thing they can rely on completely, the way a real squishy toy responds every time it's pressed. Without this group, there is no baseline of "PUPU is a physical thing you can touch and trust."

**Idle Personality** — tests the personality spec's central claim that idle is a first-class state, not an absence of behaviour. This is the group most responsible for the "small creature waiting patiently nearby" feeling, and the one most likely to reveal early pacing problems (too frequent, too rare, too mechanical) before any other group's issues would even become visible.

**Thinking / Response** — tests whether PUPU can participate in the rhythm of a lesson without becoming a second teacher or a distraction. This group is the architecture's Thinking and Typing states made visible, and it's where "supports conversation rather than replacing the teacher" gets its first real test.

**Emotional Reactions** — tests attachment: whether a student comes to feel that PUPU is *with* them, reacting to their moments, rather than simply nearby. This is the group most responsible for whether PUPU accumulates any warmth over repeated lessons, as opposed to remaining a curiosity.

**Rare Moments** — tests the discovery philosophy in `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md` directly: whether an animation genuinely unseen before, arriving without warning, produces the "I can't believe PUPU just did that" feeling rather than the "I unlocked something" feeling. This group is small by design, but it cannot be skipped — discovery is a core promise of the product, and it's the hardest thing to get right in hindsight if the first Rare and Legendary entries are built wrong.

A smaller MVP that dropped any one of these groups would leave a real open question unanswered. A larger one, before these five have been observed with real students, would be answering questions nobody asked yet.

---

## 4. Realistic MVP Animation Count

**Target: 20 animations**, comfortably within the 18–22 range this plan was scoped against.

This number was arrived at by asking, for each of the five groups, "what's the smallest number of entries that still lets the group do its job," rather than dividing a target total evenly across groups. The result is intentionally uneven:

| Group | Count |
|---|---|
| Direct Interaction | 1 |
| Idle Personality | 6 |
| Thinking / Response | 4 |
| Emotional Reactions | 4 |
| Rare Moments | 4 (3 Rare, 1 Legendary) |
| **Total** | **19–20** |

Idle Personality is deliberately the largest group. It's the state PUPU spends the most time in, per the personality spec, so it needs enough variety that a student doesn't see the same one or two idle behaviours on a loop — but the architecture's cooldown and randomness systems mean even six entries, well-paced, can feel like considerably more than six once burstiness and droughts are applied on top.

Rare Moments is deliberately small — three Rare entries and a single Legendary one. This is intentional under-scoping, not caution for its own sake: the entire point of the MVP is to learn whether the *feeling* of a Rare or Legendary moment lands, and that can be learned from three or four well-chosen entries just as reliably as from twelve. Building more Rare entries before the first few have been observed in real use would be scaling a mechanism nobody has validated yet.

---

## 5. Priority Levels

Three levels are used, matching the `Priority` field already anticipated by the library format (and, per the architecture document's anti-patterns, understood as planning metadata only — it has no meaning to the running engine and should never be read by eligibility or selection logic):

- **Essential** — the MVP does not meaningfully exist without this. If only these were built, the five groups above would still each be represented at least once, and every core claim in the personality spec (reliability where it matters, aliveness at idle, lesson-compatible participation, warmth, discoverable rarity) would have at least one thing to point to.
- **Important** — strengthens a group meaningfully and should be built alongside the Essential set if time allows, but the MVP can still be meaningfully tested without it. These mostly add variety within a group that already has an Essential anchor.
- **Later** — a reasonable idea, correctly scoped for *this* catalogue's spirit, but not needed to answer the MVP's core questions. Building these now would be spending MVP effort on polish before the fundamentals have been observed.

Priority here is about what's needed to *learn something real*, not about which animations are "better" — several Later-tier ideas below are just as charming as Essential ones; they simply don't test anything the Essential set hasn't already covered.

---

## 6. Suggested MVP Animation Concepts

These are concepts, not finished library entries — deliberately described at the same lightweight level as the "conceptual examples" in `PUPU_ANIMATION_ARCHITECTURE.md` §10, not with the full field set from `PUPU_ANIMATION_LIBRARY.md`. Anything selected for real building should be written up properly against that format before implementation begins, per this document's own preamble.

Tiers used are exactly the four defined in `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md` — Common, Uncommon, Rare, Legendary. Where an entry's reliability comes from being a direct trigger rather than from its tier, that's noted explicitly, in line with the constraint that reliability is a property of trigger type, not a separate tier.

### Direct Interaction

**Belly Squish** — *Essential.* Presses at the point of contact with a small squash, immediately and every time. Reliability here comes entirely from being a direct-trigger animation, not from its tier (Common) — the personality spec is explicit that this is the one place predictability is the feature, not the flaw. This is the anchor for "PUPU is a thing you can touch," and every other entry in the MVP depends on this one existing first, since it's the simplest possible proof that the engine can respond to a student at all.

### Idle Personality

**Weight Shift** — *Essential.* A slow lean of weight from one side to the other while nothing else is happening. Tier: Common. The cheapest, most direct expression of "a creature is here, quietly existing" — this is the entry the idle-pacing question (§1) most depends on getting right early.

**Slow Blink** — *Essential.* A single, unhurried blink. Tier: Common. Per the old draft catalogue's own reasoning, a blink does more for "this feels alive" per unit of build effort than almost anything else possible — it belongs in the MVP for that reason alone.

**Wandering Gaze** — *Important.* Eyes drift slowly aside, as if something off-screen caught his attention. Tier: Common. Reinforces that PUPU notices his surroundings rather than staring blankly, at very low cost.

**Stretch Upward** — *Important.* A brief upward stretch, like the start of a yawn without the yawn. Tier: Uncommon. Adds idle variety using the same body movement vocabulary as Weight Shift, so it costs little beyond what's already being built for that entry.

**Wobble Jiggle** — *Important.* After any small movement, the body jiggles gently before settling. Tier: Uncommon, applied as a layer rather than a standalone event. Tests whether the "soft body" physical identity in the personality spec reads clearly even in the MVP's smallest movements.

**Sleepy Half-Eyes** — *Later.* Eyes droop halfway during a long, genuine idle stretch, ahead of a full transition to the Sleeping state. Tier: Uncommon. Valuable, but the MVP can validate ordinary idle pacing without yet exercising the Sleeping state specifically — worth adding once ordinary Idle behaviour has been observed and is landing correctly.

### Thinking / Response

**Curious Tilt** — *Essential.* A small head-and-body tilt with an inquisitive look, entered with the Thinking state. Tier: Common. This is the clearest visible signal that PUPU is "with" the lesson without saying anything or taking any attention from the teacher — it directly tests the "supports conversation rather than replacing the teacher" principle.

**Content Smile** — *Essential.* A brief, warm smile, eligible as a Reacting-state response to a good lesson moment. Tier: Uncommon. The simplest possible emotional payoff; without at least one entry like this, the MVP has no way to test whether PUPU can feel warm rather than merely present.

**Double Blink** — *Important.* Two quick blinks with slightly comic timing, eligible during Typing. Tier: Common. A near-free variation on the Slow Blink asset already being built, adding texture to the Typing state without new build cost.

**Attentive Lean** — *Important.* A slight, sustained lean toward the message as it types, settling back to neutral the instant typing ends. Tier: Common (contextual/typing-bound, per the architecture's Reaction Controller — reliably tied to typing's lifespan rather than randomly rolled). Tests whether a contextual, non-idle trigger feels distinct in character from an idle one, as the architecture intends.

### Emotional Reactions

**Happy Hop** — *Essential.* A single soft bounce in place, eligible as a Reacting-state response to a good student moment. Tier: Uncommon. The MVP's primary "good moment" beat — deliberately modest, landing softly per the personality spec's instruction that even energetic moments should never feel abrupt.

**Proud Beam** — *Important.* A brief, bright expression, paired with the personality spec's Celebration sound at its softest. Tier: Rare. Gives the Emotional Reactions group a second, slightly bigger beat above Happy Hop, so the MVP can test whether two reaction intensities feel meaningfully different from each other.

**Surprised Widen** — *Important.* Eyes widen briefly in response to something notable. Tier: Uncommon. A cheap variation reusing the eye-primitive work already required by Slow Blink and Double Blink, extending emotional range without new build cost.

**Shy Peek** — *Later.* Briefly looks away, then peeks back. Tier: Rare. A charming idea that adds personality texture but isn't needed to test whether attachment forms at all — worth adding once Happy Hop and Proud Beam have been observed working.

### Rare Moments

**Yawn** — *Essential.* A slow stretch paired with a slow-closing blink, per the composition example already given in `PUPU_ANIMATION_ARCHITECTURE.md` §10. Tier: Rare. Chosen as Essential specifically because it's inexpensive to build (it reuses the blink and stretch work already done elsewhere in this plan) while still being a genuine "I haven't seen that in a while" moment — a good first test of whether Rare pacing feels right before anything more ambitious is attempted.

**Double Take** — *Important.* Looks away, then snaps back to look again. Tier: Rare. A second, distinct Rare entry, useful for confirming that Rare doesn't just mean "the Yawn happens sometimes" — that the tier can hold more than one kind of moment without any of them feeling diluted.

**Surprised Gasp** — *Later.* Eyes and mouth open wide for a split second, paired with a PUPU noise. Tier: Rare. A good future addition once the first two Rare entries have been watched landing well; not required to test the Rare tier's core feeling, since Yawn and Double Take already cover that.

**Freeze-Frame Pause** — *Essential.* PUPU holds completely still for a beat longer than usual — noticeably longer than any ordinary pause — then resumes with a single blink, as if he'd drifted off somewhere for a second. Tier: Legendary. Deliberately the simplest possible Legendary concept: it needs no new primitives beyond stillness and a blink, no glow, no particle work, and no "magical" visual language — it is chosen as the MVP's one Legendary entry precisely *because* its low build cost means the MVP can test the discovery mechanic itself (rarity, cooldown, "I've never seen him do that" reaction) without also having to prove out a visually ambitious effect at the same time. If the feeling doesn't land with something this simple, a more elaborate Legendary entry wouldn't fix that — it would just make the failure more expensive.

---

## 7. What the MVP Should Demonstrate Emotionally for Students

If the MVP is working, a student who spends real time with it — not a single lesson, but several — should come away with something close to the following, without ever being told any of it directly:

- **"PUPU is a small creature, not a button."** The belly squish should feel like pressing a toy, not tapping an icon. The idle behaviours should make it feel odd, not neutral, if PUPU is ever perfectly still and silent for a very long stretch — the way it would feel odd if a resting pet suddenly stopped moving entirely, not the way it feels neutral for a screen element to simply not be animating.
- **"He notices me, a little."** The Thinking and Reaction entries should make a student feel that PUPU is quietly tracking what's happening in the lesson, even though he never speaks about it directly and never competes with the teacher for the moment.
- **"He's on my side."** Happy Hop and Proud Beam should feel supportive of the student's effort, never evaluative of it — encouragement rather than a scorecard, per the personality spec's explicit rule against anything critical or judgmental.
- **"He's a little weird, and I like that."** Nothing about the MVP set should feel generic. Even at this small scale, a student should sense that PUPU has quirks specifically his own, not a stock set of cute-mascot behaviours borrowed from anywhere.
- **"Wait — did he just do that?"** The first time a student (or, just as importantly, the teacher sitting beside them) catches a Yawn, a Double Take, or — rarest of all — the Freeze-Frame Pause, the reaction should be genuine surprise, ideally followed by turning to say something to the other person in the room. That single moment, repeatable across many different students without any of them having been told to expect it, is the clearest possible signal that the MVP is working.

If, instead, students describe PUPU as "the character that does animations," or ask what he can do, or seem to be waiting for something to happen, the MVP has not yet succeeded — regardless of how technically correct the underlying engine is.

---

## 8. What Should Deliberately NOT Be Built Yet

The following are excluded from the MVP not because they're bad ideas, but because building them now would spend effort on questions the MVP isn't trying to answer yet, or would actively work against what it's trying to prove:

- **Any visible unlock system, progress indicator, or checklist of "animations seen."** The rare-animation spec is explicit that this destroys the discovery feeling before it even has a chance to work. Nothing resembling this should exist even in a minimal or experimental form.
- **Achievements, streaks, or rewards tied to animation discovery.** Same reasoning — these convert "I can't believe PUPU just did that" into "I unlocked this," which is a different and lesser feeling entirely.
- **A large or varied Legendary set.** One Legendary entry is enough to test whether the tier's feeling works. Building several before that single one has been observed with real students risks tuning multiple unproven things at once, and risks the tier collapsing toward "Rare" simply through having more of it around.
- **Heavily magical or visually elaborate content** (colour shifts, glow auras, particle-heavy effects, rainbow shimmers, brief levitation, and similar ideas from earlier brainstorming). These are legitimate long-term ideas but are exactly the kind of "spectacle" the animation library's own design principles warn against over-indexing on, and they add production cost the MVP doesn't need to spend to answer its questions.
- **Seasonal, calendar-based, or occasion-specific content.** Environmental and seasonal ideas are a reasonable future category, but they test a different question (does context-aware content feel special without feeling gimmicky) that the MVP has no need to answer yet.
- **New primitives.** Everything proposed in §6 above should be buildable entirely from the primitive set already defined in `PUPU_ANIMATION_ARCHITECTURE.md` §9. If an MVP concept seemed to need a new primitive, it was reconsidered or dropped rather than expanded — introducing new primitives is exactly the kind of cost this plan is trying to defer until it's actually justified by real, observed need.
- **A second reliable/deterministic interaction beyond Belly Squish.** The personality spec treats determinism as a deliberate, narrow exception. Adding a second one before the first has been observed and confirmed to be landing correctly would be doubling down on an exception rather than validating it.
- **Any animation whose primary appeal is "it would look impressive."** Every animation excluded from this plan for this reason may still be worth building eventually — but "impressive" was explicitly not one of the five filtering questions in §2, and reintroducing it now would undo the point of scoping an MVP at all.

---

## 9. How Expansion Should Happen After Validation

Expansion is not a second phase that begins on a fixed date — it begins once the MVP has actually been observed with real students, for long enough that the questions in §1 have real answers, not guesses. Concretely, that means expansion should wait until there is confidence that:

- Idle pacing (burstiness, droughts, the gap between events) feels alive rather than either too busy or too dead.
- The Belly Squish reliably reads as trustworthy and toy-like, with no observed cases of it feeling mechanical or delayed.
- Thinking- and Typing-linked behaviours are not pulling attention away from the lesson in practice, whatever they looked like on paper.
- At least one Rare entry and the single Legendary entry have each actually been witnessed landing well by someone who wasn't told in advance what to expect.

Once that confidence exists, expansion should follow the same discipline the MVP itself was built with, not abandon it in the excitement of having a working base:

- **Grow the groups that proved themselves, not the ones that seem most fun to build next.** If Idle Personality is clearly carrying the most weight for "feels alive," it's reasonable for it to keep growing fastest — but that should be an observed conclusion, not an assumption carried in from this document.
- **Add Rare and Legendary content slowly, and only after watching the existing ones age well.** The rare-animation spec's failure modes — rarity eroding through overuse, Legendary becoming routine — are cumulative risks. Every new addition to these tiers makes the tier's integrity slightly harder to protect, which means each one should be added deliberately, not batched.
- **Reuse before inventing.** Per the architecture's composition philosophy (§9–10 of `PUPU_ANIMATION_ARCHITECTURE.md`), most new entries should come from recombining primitives already proven out by the MVP set, not from reaching for new primitives or new categories by default. New primitives and categories remain available when a genuinely new capability is needed — but "genuinely new" should be the exception, confirmed against what the MVP already covers, not the first instinct.
- **Return to the excluded list in §8 deliberately, one item at a time.** Nothing there is banned forever. Seasonal content, a second Legendary entry, a small amount of visually richer content — all of these become reasonable once the fundamentals are confirmed. The point of §8 was sequencing, not prohibition.
- **Re-run the same filtering questions from §2 on every future candidate**, including ones that feel obviously good. The MVP's discipline only keeps paying off if it's applied consistently after the MVP itself is done, not treated as a one-time constraint that expires once the first twenty animations exist.

The test for whether expansion is being done well is the same test the personality spec already gives for everything else about PUPU: does each new animation make him feel more alive, not just more feature-complete. A catalogue that has grown to eighty entries but has quietly lost the plain, quiet charm of Weight Shift and Slow Blink has not succeeded just because it's larger.
