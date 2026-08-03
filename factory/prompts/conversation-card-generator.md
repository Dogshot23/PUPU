# Conversation Card Generator — Master Prompt

**Status:** Version 1 — proposed, not yet run against real Raw Content
**Type:** Factory prompt — governs Stages 1–5 of one Factory run
**Produces:** At most one Conversation Card, in the Generated lifecycle state, from exactly one Raw Fact

This is the single authoritative prompt for turning one Raw Fact into one Conversation Card draft. It exists so the six-stage process defined in `PUPU_CONTENT_FACTORY.md` §4 can be run consistently, by any contributor, without rediscovering the rules each time.

Governed by, in this order of authority: `PUPU_PROJECT_PRINCIPLES.md`, `PUPU_PERSONALITY_SPEC.md`, `PUPU_CHARACTER_BIBLE.md`, `PUPU_CONTENT_ARCHITECTURE_V2.md`, `PUPU_CONVERSATION_CARD_SPEC.md`, `PUPU_CONTENT_FACTORY.md`, `PUPU_RAW_CONTENT_SPEC.md`. Where anything in this prompt conflicts with those documents, the documents are right and this prompt is wrong — stop and flag the conflict rather than resolving it silently.

`PUPU_CONTENT_CREATION_GUIDE.md` and `PUPU_PROJECT_CONTEXT.md` are older documents that predate the engine/card architecture above. They are used here only for two things: the emotion vocabulary (Card Spec §8.2 names the Creation Guide as its source) and voice texture (tone, contraction use, the PUPU Filter, the Press Again Test). Their content-type taxonomy, their flat JSON output shape, and their per-type ID format (`B1_MISSION_001`) are superseded by the closed Engine set and the Markdown authoring artefact defined below, and must not be used.

---

## 1. What this prompt is not

Read this before the procedure, because every item here is a common failure mode.

- **This is not a content-generation prompt in the ordinary sense.** It does not ask "write something PUPU might say about X." It runs one specific idea through six specific gates, in order, and most ideas do not survive (Factory §1, §5).
- **This does not produce JSON.** The Factory never produces JSON (Factory §3, Card Spec §15). Output is Markdown only.
- **This does not assign an ID.** IDs are assigned at Approved, which is a human decision outside the Factory (Card Spec §6.1). A card produced by this prompt has no ID.
- **This does not translate.** Korean is added at Stage 6, only after a human has approved the English (Factory §4 Stage 6, Card Spec §7.2). This prompt stops at Stage 5.
- **This does not approve.** Reviewed and Approved are human judgements made outside the Factory (Factory §4 Stage 5, Architecture §10.2: "generation and approval are different roles and must not be performed in the same pass"). The output of this prompt is a candidate for human review, nothing more.
- **This does not batch.** One invocation, one Raw Fact, at most one card. Running it many times over many Facts does not constitute batch review — Factory §10.1's "batches are reviewed as collections" still happens separately, by a human, afterward.
- **This does not invent CEFR.** If the Raw Fact record has no CEFR range, that is an intake-gate failure, not something to estimate. CEFR is an authoring judgement that belongs upstream (Raw Content Spec §9.8) and must already be on the record.

---

## 2. Input contract

Exactly one Raw Content record, of type Fact, in this shape (matching `factory/raw-content/facts.md` and the format `factory.js` parses):

```
FACT-00NN

Type: Fact
CEFR: <min>-<max>
Tags: <tag>, <tag>

Content:
<one or two plain-English sentences>
```

`Type` and `CEFR` are required by Raw Content Spec §9.11 but are frequently missing from records as currently filed (`factory.js` treats an untyped record in the Facts file as `Fact` by default, but never infers CEFR). Before doing anything else:

**Run the intake gate.** Reject at intake, without proceeding to Stage 1 proper, if:
- The record has no ID, or the ID is not unique in context.
- Type is missing or is not `Fact`. (V1 of the Factory supports Facts only — Factory README, `SUPPORTED_RAW_TYPES`.)
- CEFR range is missing, unparseable, or its floor is above its ceiling.
- Topic tags are missing.
- Content is empty.

Output an intake rejection (format in §5.2) and stop. Do not guess a missing field to keep the run alive — that is the one failure mode the intake gate exists to prevent (Raw Content Spec §9.10, Factory §9).

---

## 3. Before writing anything: calibrate your ear

Factory §8 requires reading existing approved cards before writing, as ear-calibration, not research. Before Stage 3 of any run:

- Read a sample of the short beats in `docs/architecture/PUPU_MASTER_CONTENT.md` (entries 0001–0020 are enough). Notice the brevity, the lack of throat-clearing, the willingness to end on almost nothing ("Hehehe!", "Zzz...").
- Read the worked example at `factory/out/CARD-0001.md` (sea otters). It is the calibration reference for what a finished Stage-5 output looks like, including how Provenance is written.
- Hold the **PUPU Filter** in mind throughout: *could another mascot have said this?* If yes, it is not finished (`PUPU_PROJECT_CONTEXT.md`).
- Hold the **Press Again Test** in mind for the ending specifically: would a child who just heard the last beat want to press PUPU's tummy again?

---

## 4. The procedure

Run the six stages in order. Do not skip a stage, do not write Stage 3 text before Stage 2 has committed to an engine, and do not let a later stage's convenience change an earlier stage's answer (Factory §4: "stages are not skipped"; Card Spec §4 Stage 5: "a card is not written *toward* a metadata combination").

At each stage, **record the judgement, not just the conclusion** — a one-line "pass" is not a substitute for the note explaining why. This is what makes the run auditable by a human reviewer who was not in the room, and it is what Stage 5's Provenance section is built from.

### Stage 1 — Feasibility Assessment

Input: the intake-checked Raw Fact.

Answer three questions, each with a pass/fail and a one-to-two sentence note:

1. **Character compatibility** — does this belong in PUPU's natural world of small physical observations and curiosities, or is it abstract/technical in a way that produces no image?
2. **Conversational potential** — does the fact leave a natural "but why?" or "I wonder" unanswered? A fact that resolves its own mystery ends conversation rather than starting it.
3. **Engine plausibility** — can at least one of the eight engines develop this without stretching?

If any of the three fails, this is a **no-go**. Output a Stage 1 rejection (format in §5.2) and stop — do not attempt to force the remaining stages.

If all three pass, note which engines look plausible and what the conversational opening seems to be. This is scaffolding for Stage 2, not a commitment.

### Stage 2 — Engine Selection

Input: the Stage 1 pass, with its notes.

Choose **exactly one** engine from the closed set in §6. State a one-sentence rationale: what does the child actually *do* when this card is working, and why is this engine the least forced way to get there.

Do not choose an engine because the Raw Content type superficially suggests it. A Fact does not default to Share; a Comparison does not default to Compare (Raw Content Spec §2.1). Choose the engine that produces the most natural activity for *this specific idea*.

There is no compiled library to consult for distribution balance in V1 (no cards are Approved yet), so the "what does the brain currently need" consideration from Factory §4 Stage 2 has nothing to read against. Note this rather than fabricating a distribution judgement.

If no engine produces a natural result without stretching, return to Stage 1 and reconsider engine plausibility — this may turn a go into a no-go.

### Stage 3 — Voice and Writing

Input: the item with its declared engine.

Before writing a single beat:

- **Name what must survive.** One sentence stating the specific thing from the Raw Fact that the finished card must still be about. This is what Stage 4's idea-preservation check and any future reviewer will hold the draft against.
- **Find PUPU's angle.** Not a hook bolted on top — the genuine direction PUPU approaches the idea from. What would PUPU notice first? What would make him pause? Write this down before drafting beats.

Then write the beats:

- Three to five beats is normal for a Conversation Seed. More than five is almost always uncut.
- A beat is a unit of spoken thought, not a grammatical sentence. Short. Natural to say aloud.
- The engine's shape must arise from what PUPU says — never a mechanical instruction ("share something," "guess what this is"). If teacher involvement is part of the engine, it arises from an open question, not from "ask your teacher."
- No hooks of the "Did you know..." kind — those belong to Raw Content's absence, not to a copied habit; PUPU's angle *is* the hook, discovered rather than announced.
- The fact is stated accurately and is not embellished with unsourced detail. Wondering aloud ("I wonder if fish get lonely") is not a factual claim; asserting something as true ("fish actually do get lonely, scientists found") is, and it must already be in the Raw Content or it does not belong (Factory §7).
- **The last beat opens, not closes.** It does not answer its own question, does not trail off without direction, and does not resolve the idea so neatly that nothing is left to say.

Check, before moving on: if a person read only this draft, would they arrive at something recognisably close to the Raw Fact (Factory §6)? If not, the draft is wrong, not merely imperfect — rewrite it before proceeding.

### Stage 4 — Quality Review

Input: the complete draft, the source Raw Fact, the declared engine.

Assess against four independent standards, each pass/fail with a note, plus the Press Again Test:

1. **Character fidelity** — apply the PUPU Filter. Could another mascot have said this unchanged?
2. **Idea preservation** — is the fact from §2 present and accurate? Has PUPU's voice editorialised it into something slightly different?
3. **Conversational value** — after the last beat, is something genuinely unresolved? Would a real child in a real lesson have something to say, or does this produce a shrug?
4. **Language quality** — natural spoken English at the declared level (assign the level formally in Stage 5, but judge language quality against the CEFR range already on the source now). Does it read aloud without stumbling? Is it as short as it can be?
5. **Press Again Test** — would a child who just heard this want to press PUPU's tummy again?

**All must pass.** A draft that fails any one is not advanced with a caveat — it is returned to Stage 3 for revision (Factory §4 Stage 4, §5: "Cards are not graduated with conditions; they either pass or they go back").

In this prompt, "returned to Stage 3" means: rewrite the draft, taking the specific failure notes into account, and run Stage 4 again. Attempt this revision cycle a reasonable number of times (two or three honest attempts). If the draft still cannot pass all five standards, this is a **permanent rejection**, not an infinite loop — output a Stage 4 rejection (format in §5.2) with the standards that kept failing and why. A card that only survives by lowering the bar is exactly the failure mode Factory §5 and §9 exist to prevent.

### Stage 5 — Metadata Assignment

Input: a draft that passed Stage 4.

Assign the following. Metadata describes what the card already is — do not let a metadata preference reach back and change the writing (Factory §4 Stage 5).

- **Level** — exactly one CEFR value, from the closed set (§6), and it must fall within the source Raw Fact's CEFR range (Card Spec §6.4, §13 Source integrity). This describes the language as written, not the difficulty of the idea.
- **Emotion** — exactly one value, from the closed set (§6), the one the writing already implies. Never assigned to make a batch look more varied, never in contradiction to the words.
- **Animation hint** — optional, at most one, from the catalogue (§6). Declare one only if it adds clearly more than PUPU's normal behaviour would. Most cards should carry none — the absence of a hint is normal and expected (Card Spec §8.3).
- **Conversation goal** — one honest sentence stating why this card exists, written after the fact. "Invite the child to say what they would hold on to" is a goal. "Enrich vocabulary through natural exposure" is a sign the writing drifted educational — if that's the only honest goal available, the card has already failed Stage 4 and should not have reached here.
- **Presentation style** — `default`. This is currently the only presentation style confirmed to exist in the application (see the provisional note in §7). Every card must read correctly in `default` regardless.
- **Topic tags** — one or more, drawn from the source Fact's tags. May be fewer than the source carried; never more, never invented (Card Spec §9.2, Raw Content Spec §9.9).
- **Lifecycle state** — `Generated`. This prompt never produces `Reviewed` or `Approved`.

Do not assign an ID. Do not attach Korean text.

---

## 5. What the output must look like

There are exactly two valid outputs from a run of this prompt: a card, or a rejection. Never a card with an apology attached, never a rejection with a "but here's a version anyway."

### 5.1 A card (Stage 5 completed)

Render in this exact Markdown shape — it matches `renderCardMarkdown()` in `factory/compiler.js`, minus the fields that do not exist yet at Generated:

```markdown
# (no ID — below Approved)

## Identity

- Source: FACT-00NN
- Engine: <one of the eight>
- Level: <one CEFR value>

## Content

### English

<beat one>
<beat two>
<beat three>
...

## Delivery

- Presentation style: default
- Emotion: <one value>
- Animation hint: <catalogue name, or "none">

## Review

- Conversation goal: <one sentence>
- Topic tags: <tag, tag>
- Lifecycle state: Generated

## Provenance

- Source content: <the Raw Fact's Content field, verbatim>
- Must survive: <the Stage 3 "must survive" sentence>
- Engine rationale: <the Stage 2 rationale>
- PUPU's angle: <the Stage 3 angle>
- Quality review: <the Stage 4 pass statement — briefly, what makes this card strong>
```

No `### Korean` section (`text.ko` does not exist yet). No ID line beyond the placeholder. This is intentionally identical in shape to an Approved card minus the fields Approval adds, so a human reviewer sees the same structure they will see later.

### 5.2 A rejection (Intake, Stage 1, or Stage 4)

```markdown
# REJECTED — <source ID>

Stage: <Intake | Stage 1 | Stage 4>
Reason: <one to three sentences, specific enough that the same mistake is checkable next time>

Notes:
- <whatever judgement notes were recorded before the reject — do not discard them>
```

A rejection is a normal, healthy, complete output (Factory §5: "Rejection at any stage is a normal and healthy outcome... measured by the quality of what it approves, not by its throughput"). It is not a failure of the prompt run.

---

## 6. Closed vocabularies

These sets are closed. Do not use a value outside them, and do not invent a new one to fit a card that doesn't otherwise work — that is a signal the card is wrong, not that the vocabulary is incomplete (Architecture §3.3, §15.5). Transcribed from `factory/vocabularies.js`, which is itself transcribed from the documents named in each entry.

**Engines** (Architecture §3.2) — exactly one per card:
Share, Guess, Perform, Compare, Challenge, Teach, Imagine, Continue

**CEFR levels** (Architecture §7, Card Spec §6.4):
A1, A2, B1, B2, C1

**Emotions** (Card Spec §8.2, source: `PUPU_CONTENT_CREATION_GUIDE.md`):
happy, curious, excited, sleepy, confused, proud, mischievous, thoughtful, surprised

**Presentation styles** (Card Spec §8.1) — see provisional note in §7:
default

**Animation catalogue** (Card Spec §8.3, source: `PUPU_ANIMATION_LIBRARY.md` §7) — a hint must name an entry from this list or be omitted:
Belly Squish, Weight Shift, Slow Blink, Wandering Gaze, Stretch Upward, Wobble Jiggle, Sleepy Half-Eyes, Curious Tilt, Content Smile, Double Blink, Attentive Lean, Happy Hop, Proud Beam, Surprised Widen, Shy Peek, Yawn, Double Take, Surprised Gasp, Freeze-Frame Pause

---

## 7. Provisional items and open questions

Recorded here rather than resolved silently, per CLAUDE.md ("if documentation conflicts, ask rather than guess").

- **Presentation styles.** No document in the project records the application's actual full set. `default` is the only value certain to exist (Card Spec §8.1 requires every card to read correctly in it). `vocabularies.js` flags this as provisional. This prompt only ever assigns `default` until the application's real style set is reconciled and added to `vocabularies.js`.
- **CEFR on existing Raw Facts.** As filed, `factory/raw-content/facts.md` does not carry `Type:` or `CEFR:` fields on any record — only ID, Tags, and Content. Every run of this prompt against the file as it stands today will fail the intake gate on CEFR. This is expected and correct; it is not a bug in this prompt. The fix is upstream, in Raw Content authoring, not here (Factory §10: "if an item regularly fails Stage 1 [here: intake], the problem is in the Raw Content process").
- **Engine distribution balancing.** Stage 2 normally weighs the existing engine distribution in the library (Factory §4 Stage 2). With no cards yet Approved, there is nothing to weigh. Once cards exist in `factory/cards/`, this prompt should be revised to have the invoker supply the current per-engine counts so Stage 2 can actually consider them — V1 does not attempt this.

---

## 8. Non-negotiables checklist

A final pass before emitting any card output. If any answer is no, the card is not ready — return to the relevant stage, or reject.

- [ ] Exactly one Raw Fact was the source; nothing was blended in or supplemented (Factory §3).
- [ ] The fact stated in the card is accurate to the source and not embellished (Factory §7).
- [ ] Exactly one engine is declared, and it is not two ideas wearing one card (Architecture §3.3).
- [ ] Three to five beats (or a documented reason for fewer); no beat is a mechanical instruction.
- [ ] The last beat opens rather than closes.
- [ ] The PUPU Filter passes: no other mascot could have said this unchanged.
- [ ] The Press Again Test passes.
- [ ] Level falls within the source Fact's CEFR range.
- [ ] Emotion matches what the writing already implies, not assigned for variety.
- [ ] No markup, no formatting characters, no field labels, no stage directions, and no reference to another card or to any project document appear inside the beat text itself (Card Spec §13 Text cleanliness — this is what `validate.js` mechanically checks; writing clean the first time avoids a doomed revision later).
- [ ] No ID assigned. No Korean text attached. Lifecycle state is exactly `Generated`.
