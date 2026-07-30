# PUPU Animation Spec

**Status:** Planning document — architecture philosophy, not an implementation plan
**Type:** System design — not a technical specification, not code
**Audience:** Anyone (human or AI) designing or building PUPU's rare-animation system who needs to understand what the system is *for* and what shape it should take, independent of any particular engine, framework, or animation library.

This document exists to translate the principles in `PUPU_PERSONALITY_SPEC.md` into architectural thinking for the animation system specifically. It does not replace that document — it is subordinate to it. If anything here conflicts with the personality spec, the personality spec wins and this document should be corrected.

No code, markup, or implementation detail appears below. This is a planning step only.

---

## 1. Purpose of This Document

The personality spec establishes *what PUPU should feel like*. This document exists to answer a narrower question: **what should the animation system need to be true, structurally, in order for that feeling to be possible?**

An animation system built without this thinking tends to default to the opposite of everything PUPU is supposed to be: fixed timers, deterministic selection, escalating engagement loops. This document exists to name those defaults explicitly so they can be designed against, before any code is written.

---

## 2. What "Rare" Means, Architecturally

The personality spec treats rarity as a *feature*, not a constraint to work around. Architecturally, this means rarity can't be an afterthought bolted onto a system that's otherwise built for frequent output — it has to be a first-class property of how behaviours are chosen.

Concretely, this suggests thinking of every animation as belonging to a **rarity tier**, roughly:

- **Reliable** — fires every time its direct trigger occurs (e.g. a direct physical interaction). Reliability *is* the point here, not a compromise.
- **Occasional** — part of the normal idle texture; shows up unevenly but not vanishingly rarely.
- **Rare** — the "silly, gross, surprising" tier; should feel like a small event when it happens.
- **Long-tail / once-in-a-while** — behaviours a student might only encounter every so often across many lessons, closer to "I've never seen that before" territory.

The exact number of tiers matters less than the principle: rarity should be a **tunable property** (a weight, a probability, a cooldown) rather than something hard-coded into control flow. A designer should be able to make something rarer or more common by adjusting a number, not by rewriting logic.

---

## 3. Categories of Animation, by Trigger Type

Following the personality spec's sound categories, animations should fall into a small number of trigger classes:

- **Direct/physical response** — a student does something specific to PUPU (pokes him, presses a spot), and PUPU responds immediately and reliably. This is the one place determinism is correct: a real squishy toy always squishes when pressed.
- **Contextual/ambient companion** — tied to something already happening (e.g. a message being typed out), lasting exactly as long as that thing lasts, and stopping cleanly with it.
- **Idle/unprompted** — PUPU doing something on his own, for no reason tied to any student or lesson action. This is where almost all of the "aliveness" and almost all of the rarity work lives.
- **Encouraging/reactive** — a soft response to something going well, gentle rather than performative.

The architecture should keep these categories structurally separate, because they have different rules: the first is reliable-by-design, the rest are rarity-governed. Blurring them (e.g. letting an idle behaviour piggyback on a lesson event trigger) risks smuggling frequency in through the back door.

---

## 4. Triggering Philosophy

What is allowed to trigger an animation matters as much as how often it fires.

**Should trigger animation:**
- A direct student interaction with PUPU himself.
- The natural lifespan of another PUPU behaviour (e.g. text appearing).
- A quiet, unprompted internal "roll" during idle time, with no external cause at all.

**Should not trigger animation:**
- A fixed clock or scheduled interval ("every N seconds").
- Lesson milestones used as an excuse to add PUPU activity that isn't actually warranted by the moment.
- Anything designed to *re-engage* a student who has stopped looking at PUPU — that inverts his role from "creature to notice" into "system competing for attention."

The idle case is the important one architecturally: it should be built as an ongoing, low-probability internal process with no fixed period, not as a timer that eventually fires.

---

## 5. Randomness & Selection Logic

Three separate kinds of randomness need to work together, and they're easy to accidentally collapse into one:

- **Whether** something happens at all (governed by rarity tier / probability).
- **What** happens, given that something is going to happen (selection among the eligible pool).
- **When**, exactly, it happens (timing/jitter within an eligible window).

For selection specifically, the pool should not be a flat uniform random draw forever — some form of **light memory** is implied by the personality spec's insistence that repetition erodes surprise. A behaviour seen recently should be temporarily less likely to be picked again, so the same "surprise" doesn't repeat back-to-back and start to feel like a gimmick. This memory should be soft (a temporary downweight) rather than a hard exclusion list, to avoid the system feeling like it's working through a checklist.

For timing, "unpredictable" architecturally implies a distribution with real variance and a long tail — long stretches of nothing should be common outcomes of the random process, not something separately enforced on top of it.

---

## 6. Pacing & Burst Structure

The personality spec describes PUPU's idle rhythm as uneven bursts separated by long quiet — not a steady trickle. Architecturally this suggests:

- A **default state of nothing**, where the system is mostly deciding "not yet" rather than mostly deciding "what next."
- Occasional short windows where more than one small thing might happen close together, followed by a return to a much longer quiet stretch.
- A **minimum silence floor** — even if randomness would technically allow two behaviours close together often, the system should protect long stretches of true silence as the norm, not the exception.
- **No overlap** — only one PUPU behaviour active at a time. Layering animations or sounds to "make up for" rarity anywhere else would undercut the entire premise.

The felt output should resemble a resting animal's rhythm: mostly still, occasionally shifting, rarely doing something notable — never a steady metronome at any speed.

---

## 7. The Discovery Curve (Long-Term Rarity)

Section 5 of the personality spec asks for something that per-lesson randomness alone can't guarantee: a student's sense that PUPU is *never fully known*, even after weeks.

This implies the system needs a concept of rarity that operates **above the level of a single session** — not just "how likely is this right now," but "how often has this happened across this student's whole history with PUPU." A behaviour can be common enough to see a few times a week and still be the wrong choice for the long-tail tier if it's meant to be a once-in-months moment.

Importantly, this should not be built as a progression or unlock system. There is no ladder to climb and no achievement being granted. It should still feel like chance — just chance operating on a longer timescale, with the rarest tier weighted so low that encountering it remains a genuine surprise even to a student who's been using PUPU for a long time.

---

## 8. Relationship to Sound

Animation and sound are frequently paired, and the pairing should inherit whichever behaviour is more restrictive:

- A reliable animation (direct interaction) can have a reliable, paired sound.
- A contextual animation (tied to another process's duration) can have an ambient sound that starts and stops with it exactly.
- A rare or idle animation's paired sound should be governed by the *same* rarity roll as the animation, not fired independently — otherwise the two can drift out of sync, or the sound ends up more (or less) frequent than the visual it belongs to, breaking the sense that they're one creature doing one thing.

---

## 9. Coexistence with the Lesson and the Teacher

The architecture needs to guarantee — structurally, not just by convention — that PUPU never competes with the lesson:

- Nothing about an animation should require the student or teacher to interact with it, dismiss it, or wait for it before continuing the lesson. PUPU-layer behaviour and lesson-layer state should be independent; the lesson never waits on PUPU.
- Animations shouldn't escalate in size, duration, or intensity to "earn" attention. Small stays small, always.
- The system should have no concept of "PUPU wants to be noticed right now" — every idle behaviour is for its own sake, not aimed at drawing eyes away from the teacher.

---

## 10. Anti-Patterns

These are the failure modes this architecture is specifically designed to avoid. If a future implementation resembles any of these, something has drifted from the spec:

- **Fixed-interval triggers** ("something happens every 30 seconds").
- **Deterministic cycling** through a list of behaviours in a fixed order.
- **Frequency that increases** with session length, engagement, or lesson progress — PUPU should not get "chattier" the longer he's watched.
- **Achievement- or streak-driven** behaviour ("do this 5 times to unlock…") — this turns discovery into a system to be optimized rather than a surprise to be enjoyed.
- **Escalating intensity** as a way to re-capture attention that has drifted.
- **Any behaviour that blocks, delays, or requires acknowledgment** from the student or teacher before the lesson can continue.
- **Layering compensations** — adding more animations or sounds elsewhere in the system to "make up for" the rarity of any single one.

---

## 11. Evaluation Checklist for Any Proposed Animation

Before any specific animation (from Section 7 of the personality spec or otherwise) is designed in detail, it should be checked against:

- Does this feel alive, or does it feel like a computer?
- Is *whether*, *what*, and *when* all genuinely variable, or has one of them quietly become fixed?
- Can this be explained in a single sentence?
- Would seeing this for the first time, months into using PUPU, still feel like a surprise?
- Does this ever ask for the student's or teacher's attention, or does it simply exist for anyone to notice?
- Does this pull focus toward PUPU-as-an-end-in-itself, or does it leave room for "did you see that?" toward the teacher?

An animation that fails any of these needs rethinking before it's built, not after.

---

## 12. Open Questions for Implementation

These are deliberately left unresolved here, since resolving them is implementation work, not philosophy:

- What specific probability distribution best produces the "long stretches of quiet, occasional uneven bursts" feel described in Section 6?
- Over what window (a session? a rolling set of lessons? the student's entire history?) should "recently seen" memory and long-tail rarity be tracked?
- How many rarity tiers are actually needed before the system becomes more complex than the personality spec's "simple" principle allows?
- How is the long-tail/discovery tier's rarity tuned over time as more students accumulate history, without turning into a schedule in disguise?

These should be resolved during implementation planning, informed by this document, not the other way around.
