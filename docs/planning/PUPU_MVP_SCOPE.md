# PUPU MVP Scope

**Status:** Permanent reference document — a decision lock, not a design exploration
**Type:** Scope definition — binding for the first build, not a new system and not an amendment to any existing one
**Audience:** Anyone (human or AI) building, reviewing, or considering adding to the first PUPU animation build, before real students have used it.

This document sits on top of `PUPU_PERSONALITY_SPEC.md`, `PUPU_ANIMATION_ARCHITECTURE.md`, `PUPU_RARE_ANIMATION_SYSTEM_SPEC.md`, `PUPU_ANIMATION_LIBRARY.md`, and `PUPU_ANIMATION_MVP_PLAN.md`. All five remain fully authoritative on who PUPU is, how the engine works, how rarity should feel, how a library entry should be documented, and why the MVP is scoped the way it is. This document introduces nothing new to any of that. It exists only to take the conclusions `PUPU_ANIMATION_MVP_PLAN.md` already reached and **freeze** them into a single, unambiguous statement of what the first build does and does not include — so that scope can't drift upward one "just this one extra animation" at a time before anyone has learned whether the MVP's core idea actually works.

Nothing in this document is a new system, a new tier, a new primitive, a new piece of architecture, or a new progression mechanic. Anywhere this document appears to say something new, it is misreading the five documents above, not superseding them.

---

## 1. Purpose of This Document

`PUPU_ANIMATION_MVP_PLAN.md` is a reasoned exploration — it explains *why* an MVP is needed, *how* animations were chosen, and *what* was considered and set aside. This document is the opposite kind of artifact: it is the **lock**, not the reasoning. It exists so that a future contributor — human or AI, on any given day — can check "is this in scope?" against a single page and get a clear yes or no, without needing to re-derive the reasoning from the plan every time.

Where this document and the plan appear to disagree on a specific number or item, this document wins for the purposes of *what gets built first*. The plan remains the correct place to understand *why*.

---

## 2. The Question This MVP Answers

The entire first build exists to answer exactly one question:

> **Does a child believe PUPU is someone, rather than something?**

Every decision below — what's in, what's out, what counts as done — is in service of answering this question as cheaply, clearly, and quickly as possible. Nothing in this document should be read as being about any other goal.

---

## 3. What This MVP Is Not

To keep scope from drifting, it's worth stating plainly what this build is explicitly *not* trying to do, even though each of these might look like reasonable goals in isolation:

- It is **not** trying to showcase the full animation catalogue.
- It is **not** trying to maximise the number of animations shipped.
- It is **not** trying to prove technical capability or engine sophistication.
- It is **not** trying to create engagement mechanics of any kind.

The MVP is a **personality validation exercise**. If a reviewer, contributor, or stakeholder starts evaluating the MVP against any of the four goals above instead of the question in §2, the conversation has drifted from what this build is for.

---

## 4. Locked Animation Count and Group Distribution

**Total: 20 animation concepts.**

| Group | Count |
|---|---|
| Direct Interaction | 1 |
| Idle Personality | 6 |
| Thinking / Response | 4 |
| Emotional Reactions | 4 |
| Rare Moments | 4 |
| **Total** | **20** |

Rare Moments is further locked as:

- **3 Rare animations**
- **1 Legendary animation**

These numbers are the scope, not a floor. Adding a 21st animation, a second Legendary entry, or a seventh Idle entry before the validation goal in §9 has been checked against real student use is out of scope, regardless of how good the idea is on its own merits. Good ideas discovered during this build should be written down for `PUPU_ANIMATION_MVP_PLAN.md` §9 (expansion), not folded into the current build.

---

## 5. Locked Animation List

The following is the specific, named scope for the first build, carried forward from `PUPU_ANIMATION_MVP_PLAN.md` §6 and locked here. Each entry's priority (§6) is fixed as shown.

### Direct Interaction
- **Belly Squish** — *Essential*

### Idle Personality
- **Weight Shift** — *Essential*
- **Slow Blink** — *Essential*
- **Wandering Gaze** — *Important*
- **Stretch Upward** — *Important*
- **Wobble Jiggle** — *Important*
- **Sleepy Half-Eyes** — *Later*

### Thinking / Response
- **Curious Tilt** — *Essential*
- **Content Smile** — *Essential*
- **Double Blink** — *Important*
- **Attentive Lean** — *Important*

### Emotional Reactions
- **Happy Hop** — *Essential*
- **Proud Beam** — *Important*
- **Surprised Widen** — *Important*
- **Shy Peek** — *Later*

### Rare Moments
- **Yawn** — *Essential* (Rare)
- **Double Take** — *Important* (Rare)
- **Surprised Gasp** — *Later* (Rare)
- **Freeze-Frame Pause** — *Essential* (Legendary)

Each of these concepts must still be written up as a complete entry against the field format in `PUPU_ANIMATION_LIBRARY.md` before it is built. Appearing in this list means "in scope for the first build," not "already specified in enough detail to implement."

---

## 6. Priority Levels

Three levels, matching the `Priority` field the library format already anticipates, and understood — per the architecture's own anti-patterns list — as planning metadata only, with no meaning to the running engine:

**Essential** — required before PUPU can be meaningfully tested at all. Without these, the MVP cannot answer the question in §2. Essential coverage is locked to guarantee, at minimum:

- at least one direct interaction (**Belly Squish**)
- enough idle behaviour to establish life (**Weight Shift**, **Slow Blink**)
- at least one lesson-linked behaviour (**Curious Tilt**, **Content Smile**)
- at least one emotional reaction (**Happy Hop**)
- at least one rare discovery moment (**Yawn**, **Freeze-Frame Pause**)

If schedule pressure ever forces a cut, only *Important* or *Later* items may be dropped. No Essential item may be cut without this document being explicitly revised first — dropping an Essential item silently would mean shipping something that can no longer answer §2's question, while still calling it "the MVP."

**Important** — strong additions that improve personality and round out a group, but whose absence would not by itself prevent the MVP from being tested. These should be built if time allows, in the order listed, but are not a precondition for beginning validation.

**Later** — reasonable ideas, correctly scoped for this catalogue's spirit, that should explicitly wait. Building a Later item before its group's Essential and Important items are done and observed is scope creep, even though the idea itself is sound.

---

## 7. MVP Animation Philosophy

Every animation in §5 — and any animation proposed for addition before validation — must satisfy all four of the following. These are not new principles; they are the plan's own filtering questions, restated here as a fixed checklist rather than a discussion.

**1. Personality first.** The animation must answer "why does PUPU do this?" — never "would this look cool?" An animation that could belong to any character isn't earning its place.

**2. Lesson compatible.** The animation must never compete with learning. PUPU is a companion in the room, not the main event in it — this is non-negotiable regardless of tier or how good the animation looks.

**3. Simplicity over spectacle.** A blink, a small movement, a subtle expression, a gentle reaction — these are the MVP's register. A simple behaviour that feels like PUPU is worth more than an impressive effect that doesn't.

**4. Discovery over reward.** Rare and Legendary moments must never become goals, achievements, collections, or unlocks. They exist to produce "I can't believe PUPU just did that," never "I unlocked another animation." This applies to every layer of the product a student can see — not just the animation itself, but anything around it that might hint a system is being worked.

Any animation that fails even one of these four, at any priority level, is out of scope — priority determines *when* something is built, not whether these four checks still apply.

---

## 8. Explicit MVP Exclusions

The following are **not part of the first build**, without exception:

- Visible animation lists of any kind
- Unlock systems
- Achievements
- Badges
- Progression mechanics
- Streaks
- Reward mechanics
- Animation collecting
- Seasonal content
- Complex magical effects
- Particle-heavy spectacle
- Additional rarity tiers beyond Common, Uncommon, Rare, and Legendary
- New primitives beyond those already defined in `PUPU_ANIMATION_ARCHITECTURE.md` §9

This list is a hard boundary for the first build, not a ranked list of low priorities. None of these should appear in even a minimal, experimental, or "just to test" form — several of them (particularly anything resembling an unlock system, a visible list, or a progress indicator) would actively work against the discovery philosophy this MVP is trying to validate, not merely be unnecessary alongside it.

---

## 9. First Validation Goal

**The MVP succeeds if students naturally, unprompted, arrive at some version of:**

- "PUPU feels alive."
- "PUPU reacts to me."
- "PUPU feels like a small creature, not a button."

**The MVP fails if students mainly arrive at:**

- "This character has animations."
- "What can I unlock?"
- "How do I trigger everything?"

These statements are the only scorecard that matters for this build. Technical completeness, animation count, or engine sophistication are not evidence of success or failure on their own — a technically flawless build that produces the failure-mode statements above has not succeeded, and a rougher build that produces the success-mode statements has not failed.

---

## 10. After MVP Validation

Expansion is out of scope for this document and belongs to `PUPU_ANIMATION_MVP_PLAN.md` §9 — but the ordering rule is locked here: **expansion happens only after real student use has been observed**, never on a schedule and never because the build "feels done." Future additions should be guided by what was actually watched happening, specifically:

- Which behaviours created attachment?
- Which moments were remembered?
- Which animations felt like PUPU?
- Which animations distracted from learning?

**More animations are not automatically better.** A future contributor proposing to grow the catalogue should be able to point to observed evidence against these four questions, not merely to the fact that the architecture can support more entries without difficulty.

Any change to the locked count, distribution, priority assignments, or exclusion list in this document requires the same thing: observed evidence from real use, not a design opinion, however good that opinion might be.

---

## 11. Final Statement

The MVP is not successful when PUPU can do many things.

**The MVP is successful when a student believes PUPU is someone.**
