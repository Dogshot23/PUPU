# PUPU Rare Animation System Spec

**Status:** Permanent reference document — behavioural rules, not a new system
**Type:** Design rules — implementation-independent, not code
**Audience:** Anyone (human or AI) tuning, reviewing, or adding to PUPU's rare and legendary animation behaviour, for the lifetime of the project.

This document does not describe a separate system or engine. Rare and legendary animations run entirely through the architecture already defined in `PUPU_ANIMATION_ARCHITECTURE.md` — the Animation Registry, Cooldown Manager, Random Selector, Priority Resolver, and Animation Manager. What follows are the personality and behavioural rules those existing subsystems must be tuned to honour whenever the animation in question sits at the rarer end of the spectrum. Nowhere below should be read as introducing new machinery; anywhere this document says a subsystem "should" do something, it means an existing subsystem, configured or weighted a particular way.

Nothing in this document is code, and nothing here should be read as an implementation plan. It describes intent and feel, not mechanisms.

---

## 1. Purpose

Rare animations exist to do four things that ordinary, frequent behaviour cannot:

- **Creating discovery** — giving a student something to genuinely find, rather than something the product hands them on a schedule.
- **Making PUPU feel alive** — a creature that occasionally does something nobody was expecting reads as having its own inner life; a creature that only ever does what's anticipated reads as a program.
- **Creating memorable moments** — the specific instances a student brings up later, unprompted, days or weeks after they happened.
- **Rewarding a long-term relationship with PUPU** — giving time spent with PUPU a payoff that couldn't have arrived on day one, no matter how attentively a student was watching.

Rare animations are not content to collect. A student is not meant to be working toward them, tracking them, or building a mental checklist of which ones remain. They are unexpected moments, discovered naturally in the course of an ordinary lesson, that happen to be memorable precisely because nothing about the moment announced that something was coming.

---

## 2. Rarity Tiers

- **Common** — expected on an ordinary basis, part of PUPU's everyday texture. Emotional impact is low-key: charming, not surprising. Purpose: establish that PUPU is present and alive without asking for attention.
- **Uncommon** — noticeable but not shocking; the kind of thing a regular student might see every so often and enjoy without remarking on it to anyone. Emotional impact: a small smile. Purpose: keep the space between "always there" and "rare" from feeling empty.
- **Rare** — infrequent enough that seeing one is a small event. Emotional impact: genuine delight, often worth a comment to whoever's nearby. Purpose: the main vehicle for "did you see that?" moments between student and teacher.
- **Legendary** — the rarest tier, deliberately positioned as something most students will encounter only a handful of times, if that, across a long relationship with PUPU. Emotional impact: disbelief, the kind of thing retold later. Purpose: prove, occasionally, that PUPU still has more to him than a student thought.

Rarity here is about **perceived specialness**, not only probability. Two animations could have similar underlying odds of occurring and still belong in different tiers, because tier is ultimately a statement about how a moment is meant to *feel* when it lands — how much it should stand out against everything ordinary that surrounds it. Tuning probability is how the Cooldown Manager and Random Selector make a tier's feel real in practice, but the tier itself is a design judgment about impact, not a number chosen first and rationalized afterward.

---

## 3. Discovery Philosophy

There is a meaningful difference between a student thinking "I unlocked this animation" and a student thinking "I can't believe PUPU just did that." The second is the goal, and the two are not the same feeling even when the underlying event is identical.

"Unlocked" implies a system being worked — a ladder, a goal, an expectation that effort produces a specific, knowable reward. "I can't believe PUPU just did that" implies chance, and a creature that surprised you on its own terms.

To protect the second feeling over the first:

- There should be **no visible unlock system** — nothing a student can look at to see what's been seen or what remains.
- There should be **no progress bars** — nothing suggesting proximity to a next reward.
- There should be **no achievement hunting** — nothing that turns watching PUPU into a task to be completed rather than a thing to be enjoyed.
- There should be **no predictable rewards** — no sense that a particular action or amount of time reliably produces a particular rare moment.

Anything that lets a student reason their way toward a rare animation has already cost that animation most of its value.

---

## 4. Timescale

### Single lesson
Within one lesson, a student should reasonably be able to see Common and Uncommon behaviour, and should have some real chance — not a guarantee — of seeing a Rare one. A single lesson should not reliably contain a Legendary moment; if it did, Legendary would simply be a slower Rare, not a distinct tier.

### Multiple lessons
Across several lessons, a repeated student should have accumulated a small, personal sense of "the kinds of things PUPU does" without having exhausted it. Rare animations should surface often enough, over this span, that the student's picture of PUPU keeps filling in gradually — never all at once, never on a fixed cadence they could learn to predict.

### Long-term relationship
Over weeks or months, Legendary moments should remain genuinely special — not because they're withheld arbitrarily, but because the tier's rarity is tracked on a timescale that matches a real relationship, not a single session. A student who has used PUPU for months encountering a Legendary moment for only the second or third time is the intended experience; encountering one every few sessions would have already collapsed the tier into something closer to Rare.

---

## 5. Burstiness and Silence

PUPU should not behave like a notification system, and nothing about rare animation pacing should ever start to resemble one.

- Clusters of small events happening close together are a natural, acceptable outcome of genuine randomness, and shouldn't be smoothed away just because they occurred.
- Long quiet periods are a positive outcome, not a gap the system is failing to fill. A stretch of a lesson, or several lessons, with nothing rare happening at all is working as intended.
- Silence is what creates anticipation. A rare moment only lands as rare because it's surrounded by enough ordinary or quiet time that it stands out; removing the quiet removes the specialness along with it.
- The engine should never feel obligated to entertain. There is no quota of delight owed per lesson, per week, or per student. If nothing rare happens for a long while, that is the system succeeding, not underperforming.

---

## 6. Context Rules

Rare animations may reasonably take context into account — PUPU's current state, what's recently played, the lesson's context, or how the student has been interacting — as inputs that shift probability up or down. A student who's been attentively poking and waiting might reasonably have a slightly better chance of being met with something; a moment right after a Rare animation already played might reasonably have a lower one.

What context must never do is create a **predictable trigger** — a specific, learnable action or condition that reliably produces a specific rare result. The moment a student (or a curious observer) can say "do X and PUPU will do Y," the animation has stopped being a discovery and become a cheat code. Context should nudge the odds; it should never determine the outcome.

---

## 7. Legendary Animations

Legendary is the highest tier, and it carries the strictest rules of all:

- Legendary events should **feel almost accidental** — as if the student happened to be looking at exactly the right moment, rather than as if the product decided to reward them.
- They should **create strong memories** — the kind of moment a student describes to someone else afterward, unprompted.
- They should **happen extremely rarely**, on a timescale measured in weeks or months of real use, not sessions.
- They should **not be expected by users** — nothing in the product should hint that a Legendary tier exists at all, let alone when one might be due.
- They should **avoid repetition** — a student encountering the same Legendary moment twice in quick succession undermines the entire premise; the tier's cooldown and long-term memory must be strict enough that this is a genuinely unusual occurrence.

If a Legendary animation ever starts to feel routine to a long-term student, something about its tuning has failed, regardless of how impressive the animation itself looks.

---

## 8. Rarity Failure Modes

These are the ways rarity can quietly break, even when every individual animation still looks and sounds exactly as designed:

- **Showing rare animations too often** — the single fastest way to convert "rare" into "common," regardless of what label is attached to it internally.
- **Making every animation exciting** — if Common and Uncommon behaviour start reaching for the same impact as Rare and Legendary, nothing has anywhere left to stand out against.
- **Children waiting for the next event instead of learning** — a sign that anticipation has curdled into distraction, and that PUPU has started competing with the lesson rather than quietly coexisting with it.
- **Turning discovery into a checklist** — whether by any part of the product, or simply by a predictable enough pattern that students construct one themselves.
- **Making legendary events predictable** — through overly consistent triggers, overly short cooldowns, or patterns clear enough to be reverse-engineered by an attentive student.

Any of these can happen even while the underlying architecture in `PUPU_ANIMATION_ARCHITECTURE.md` is working exactly as built — they are tuning and design failures, not engine failures, and they need to be watched for as such.

---

## 9. Design Checklist

Before adding any rare or legendary animation, ask:

- Would a child remember this?
- Does this reveal personality?
- Is it worth waiting for?
- Would it still feel special after seeing it several times?
- Does it respect the lesson?

An animation that can't clear these questions doesn't belong at the rare end of the catalogue, however well-built it is.

---

Rare animations are not rewards PUPU gives the student.
They are moments where PUPU reveals more of who he is.
