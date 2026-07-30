# PUPU Content Architecture V2

**Status:** Permanent reference document — the definitive specification for PUPU's content system
**Type:** Architecture specification — not character design, not engine design, not an implementation plan
**Audience:** Anyone (human or AI) creating, reviewing, organising, compiling or extending PUPU's content, for the lifetime of the project.

This document sits below `PUPU_PROJECT_PRINCIPLES.md`, `PUPU_PERSONALITY_SPEC.md` and `PUPU_CHARACTER_BIBLE.md`, and beside `PUPU_ANIMATION_ARCHITECTURE.md`. Those documents define, respectively, what the product is, what PUPU feels like, who PUPU is, and how PUPU moves. This document defines only how PUPU's **content** is structured, produced and delivered.

Nothing here redefines PUPU's personality, philosophy or visual design. Where this document appears to conflict with the documents above, the documents above win and this one is wrong. Where it appears to introduce a new capability, it is misnaming something that already exists.

---

## 1. Project Purpose

PUPU is a tiny installable companion app used during live online English lessons. It is not an AI, not a chatbot, and not a lesson platform.

The content system exists for one reason: **to give a child something worth saying to their teacher.**

Everything in this architecture is downstream of that. Content is not a curriculum, not a question bank, and not a set of exercises. It is the raw material for a conversation that happens between two humans, out loud, in the room.

Three consequences follow, and they constrain every decision in this document:

- **The character comes before the content.** A child returns because they enjoy PUPU, not because the content is well organised. Structure exists to protect the character, never to compete with it.
- **The conversation belongs to the teacher and the child.** Content opens a door. It never walks through it, and it never continues the conversation itself.
- **The system stays small.** No backend, no database, no runtime generation. All content is authored ahead of time and shipped as static files.

---

## 2. PUPU Brain

"PUPU's brain" is the complete body of authored content the app can draw from. It has exactly two parts.

### 2.1 Conversation Seeds — 90%

A **Conversation Seed** is any piece of content whose purpose is to produce speech between the child and the teacher. Seeds carry the product's reason for existing.

A seed does not have to contain an instruction. A thought that makes a child *want* to say something is a seed. What makes something a seed is its outcome, not its grammar.

### 2.2 Character Moments — 10%

A **Character Moment** is a piece of content whose purpose is only to make PUPU feel alive. It carries no conversational payload and asks nothing of the child. Character Moments are specified fully in §8.

### 2.3 Why the split is fixed

The 90/10 ratio is a deliberate constraint in both directions.

Below 90% seeds, PUPU drifts toward being a toy that occasionally produces a prompt — the product loses its purpose. Above 90%, PUPU drifts toward being a prompt generator with a face, which `PUPU_PROJECT_PRINCIPLES.md` explicitly forbids. The 10% is not filler; it is the margin that keeps PUPU a creature.

### 2.4 Relationship to engine variety

Engine variety governs the mix **within Conversation Seeds only**. It describes distribution across engines, not the seed/moment split. The two systems are stacked, not competing: 90/10 first, then variety across the eight engines inside the 90.

---

## 3. Conversation Engines

A **Conversation Engine** is the mechanism by which a Conversation Seed turns into speech. It answers the question: *what does this card actually make happen in the room?*

The engine is the single most important classification in the content system, because it is what governs variety. A child who receives three cards in a row from the same engine will feel the pattern immediately, however different the subject matter is.

### 3.1 What an engine is

An engine is a **behavioural category**, not a topic and not a format. Topic is handled by tags (§7). Format is handled by presentation style (§5). The engine describes the shape of the resulting interaction — whether the child asks, tells, teaches, challenges, decides, imagines, performs, or simply wonders aloud.

### 3.2 The engine set

The following eight engines form the complete, closed set. Each name describes the shape of the interaction — what the child is doing when the card is working.

- **Share** — PUPU's thought invites the child to share something personal: a feeling, an experience, an opinion.
- **Guess** — PUPU presents something unknown and the child must speculate, deduce or predict.
- **Perform** — PUPU asks the child to do something physical or vocal: make a sound, act out a scene, demonstrate a feeling.
- **Compare** — PUPU poses a choice between two things and the child must pick and defend.
- **Challenge** — PUPU dares the child or the teacher to do or prove something within the lesson.
- **Teach** — PUPU asks the child to explain, demonstrate or pass knowledge to the teacher.
- **Imagine** — PUPU presents a hypothetical or impossible situation and the child must reason inside it.
- **Continue** — PUPU starts a story, a sentence or a situation and leaves it deliberately unfinished for the child to extend.

Adding an engine is an architectural decision, made deliberately and recorded in the changelog — never a side effect of writing a card that doesn't fit an existing one.

### 3.3 Rules for engines

- Every Conversation Seed declares **exactly one** engine. A card that plausibly belongs to two engines is usually a card doing two things and should be simplified.
- Engines are a **closed set**. Adding one is an architectural decision, made deliberately and recorded in the changelog — never a side effect of writing a card that doesn't fit.
- Engines govern **selection variety** at runtime. The brain should avoid repeating an engine in immediate succession, in line with the variety rules already established.
- Engines are **stable**. A published card's engine should not be reclassified casually, because selection history and variety balancing depend on it.

---

## 4. Content Libraries

A **Content Library** is a storage grouping. One library holds the cards for one engine.

This continues the strategy already recorded in `PUPU_PROJECT_CONTEXT.md`: many small files rather than one large one.

### 4.1 Purpose

Libraries exist for authoring and review convenience, not for runtime logic. They make it possible to work on one engine at a time — which the Content Factory (§10) requires — and to see the size and health of each engine at a glance.

### 4.2 Rules for libraries

- **One engine per library, one library per engine.** No mixed files.
- **A card lives in exactly one library.** Cards are never duplicated across files for convenience. Cross-cutting groupings are handled by Theme Packs (§9), which reference cards rather than copy them.
- **Libraries are flat.** No nesting, no sub-libraries, no per-level splits. Level and theme are metadata, not folder structure.
- **A library can be empty.** An engine with no cards yet is a legitimate state and preferable to padding it with weak content.
- **Library size is not a target.** No library should be grown simply because it is smaller than the others.

---

## 5. Presentation Styles

A **Presentation Style** describes *how a card is revealed on screen* — its pacing and shape in the speech bubble.

Presentation style is deliberately separated from content. The text of a card says what PUPU thinks; the presentation style says how the thought arrives. Keeping them separate means the app owns all timing and rendering behaviour, and content never contains formatting instructions, markup or timing hints.

### 5.1 What a presentation style controls

- Whether the card arrives as a single beat or unfolds across several.
- Where the natural pauses fall between beats.
- The rhythm of the typewriter reveal.

### 5.2 What a presentation style does not control

- Animation. Animation selection belongs entirely to `PUPU_ANIMATION_ARCHITECTURE.md`. A card may carry an animation *hint* (§7), which is a suggestion to the animation engine, never a command to it.
- Sound. Sound behaviour is governed by `PUPU_PERSONALITY_SPEC.md` §3.
- Layout, styling or bubble appearance. These are fixed by the interface.

### 5.3 Rules for presentation styles

- Presentation styles are a **small closed set**, defined by the app, not by content authors.
- Every card declares **one** presentation style.
- A card must read correctly in the **default** style even if a richer one is declared. Presentation is polish, never a dependency.
- If a card only works because of an unusual reveal, the writing is doing too little work. Rewrite the card, do not add a style.

---

## 6. Conversation Card Structure

A **Conversation Card** is the atomic unit of PUPU's brain. Every Conversation Seed and every Character Moment is a card. There are no other content units.

A card is self-contained: everything needed to select, deliver and translate it lives on the card itself. The app never assembles a card from fragments at runtime, and never combines two cards into one delivery.

Conceptually, a card has four parts:

- **Identity** — what this card is and where it belongs. Stable for the card's entire life.
- **Content** — PUPU's words, held in parallel per language.
- **Delivery** — how it should arrive: its presentation style and its optional animation hint.
- **Provenance** — its lifecycle state and review history (§12).

Three structural rules apply to every card:

- **Content is beat-based, not paragraph-based.** A card's text is a short ordered sequence of beats, matching the line-by-line rhythm already used throughout `PUPU_MASTER_CONTENT.md`. This is what allows presentation styles to pace a card without content containing timing data.
- **All languages are peers.** English and Korean sit side by side on the card, with the same beat count. Adding a third language later must never require restructuring existing cards. No language is derived at runtime.
- **No logic on the card.** No conditions, no branching, no references to other cards, no state. A card is data.

---

## 7. Content Metadata

Metadata exists to make selection, review and balancing possible. It is not documentation, and it is not a place to record intent that the writing failed to convey.

Every card carries:

- **ID** — unique, permanent, never reused, never renumbered. Once a card is published, its ID is frozen even if the card's text is later revised. Selection history and classroom notes depend on this.
- **Engine** — exactly one, from the closed set (§3). Character Moments carry the Character Moment classification in this position instead.
- **Level** — the intended CEFR level of the child this card is written for. Valid values are A1, A2, B1, B2 and C1.
- **Theme tags** — topic descriptors only, never format descriptors. Tags answer "what is this about," never "what kind of card is this," which is the engine's job. Tags are drawn from a shared vocabulary; inventing a tag for a single card is a signal the card is too specific.
- **Conversation goal** — one short sentence stating why the card exists. This is a review artefact, invisible to children.
- **Emotion** — how PUPU feels while saying it.
- **Animation hint** — an optional suggestion to the animation engine (§5.2).
- **Lifecycle state** — where the card sits in §12.

Two rules govern metadata as a whole:

- **Metadata is closed-vocabulary wherever possible.** Free text in metadata cannot be balanced, filtered or audited, and quietly becomes unusable at scale.
- **Metadata never rescues weak content.** A carefully tagged card that a child would not enjoy is still a rejected card.

---

## 8. Character Moments

Character Moments are the 10% of PUPU's brain that exists purely to make PUPU feel alive. They are the content-system equivalent of the idle behaviour described in `PUPU_PERSONALITY_SPEC.md` §4: small, unprompted, and for no one's benefit but PUPU's own.

Content of this kind already exists in `PUPU_MASTER_CONTENT.md` — the short emotional and vocal beats at the beginning of the file. Character Moments name that category; they do not create it.

### 8.1 Rules

- **A Character Moment asks for nothing.** No question to the teacher, no instruction to the child, no implied task. The moment a card asks for something, it is a Conversation Seed and must be classified as one.
- **Character Moments are short.** Usually one or two beats. If it needs a third, it is probably a thought, not a moment.
- **They are never explained.** No setup, no payoff, no clarification.
- **They must survive being missed.** A child who looks away and misses one has lost nothing. This is what makes them safe to keep rare.
- **They are still PUPU.** Charming, gentle, occasionally weird, never annoying and never attention-seeking.

### 8.2 Why they are capped

Character Moments are the most enjoyable content to write and the easiest to over-produce, because they are short and they always feel charming in isolation. Left uncapped, they crowd out the content that gives the product its purpose. The 10% ceiling is a production discipline, not an aesthetic judgement.

---

## 9. Theme Packs

A **Theme Pack** is a named, curated selection of existing cards, drawn from across libraries, grouped for a purpose — a topic, a season, a classroom context.

### 9.1 What a Theme Pack is

A pack is a **lens over the brain**, not a part of it. It contains references to cards, never card content.

### 9.2 Rules

- **Packs never contain content.** A card that exists only inside a pack is a card in the wrong place. Write it into its engine's library and reference it.
- **Packs never duplicate cards.** A card may appear in many packs; it exists once.
- **Packs cannot override card data.** No pack-specific rewrites, translations, presentation styles or metadata. If a card needs to differ in a pack, it is a different card.
- **Packs must respect engine variety.** A pack drawn entirely from one engine will feel repetitive in exactly the way the engine system exists to prevent.
- **Packs are optional.** The brain must work correctly with zero packs defined. Nothing in selection may depend on a pack existing.
- **Packs are never surfaced as collections to children.** No visible lists, no completion, no unlocks — consistent with the exclusions in `PUPU_MVP_SCOPE.md` §8.

---

## 10. Content Factory Workflow

The **Content Factory** is the authoring process that turns ideas into approved cards. It is a human and AI process, not a piece of software.

The Factory's job is to take raw content material — facts, riddles, jokes, challenges, comparisons and story seeds — and shape each one into a polished Conversation Card by mapping it to an appropriate Conversation Engine, assigning a Presentation Style, and writing PUPU's voice before the card enters human review and compilation. Most candidate material does not survive this process. That is by design.

### 10.1 Properties

- **One engine per batch.** Mixed-engine generation reliably produces weaker content than focused generation.
- **Quantity at the idea stage, severity at the selection stage.** Ideas are cheap and are meant to be discarded in bulk. The value of the Factory is in what it rejects.
- **Translation happens after approval, never before.** Translating a card that will be cut wastes effort, and translating before the English is final produces Korean that tracks a draft.
- **Batches are reviewed as collections, not only as individual cards.** A batch of individually good cards can still be a bad batch if the openings, rhythms or engines repeat.
- **The classroom is the final editor.** Approval is a prediction; observed use is evidence. Scores and checklists rank candidates, they do not confirm success.

### 10.2 Roles

Role assignment between contributors — including the division of labour between AI systems — is recorded in `PUPU_PROJECT_CONTEXT.md` and is not restated here. Architecturally, only one thing matters: **generation and approval are different roles and must not be performed in the same pass.**

---

## 11. Content Compiler Workflow

The **Content Compiler** is the build step that turns approved source content into the runtime files the app ships.

It exists because authoring formats and runtime formats have different jobs. Authoring content should be pleasant to read, review and diff. Runtime content should be minimal, validated and predictable. Without a compile step, one of those two always degrades to serve the other.

### 11.1 Constraints

- **The compiler runs at authoring time, never in the browser.** The app loads finished static files. This preserves the no-backend, no-runtime-generation rule in `PUPU_PROJECT_PRINCIPLES.md`.
- **The compiler is a transformer, not an author.** It may validate, filter, sort, merge and strip. It may never rewrite PUPU's words, invent metadata, or repair a malformed card. A card the compiler cannot process is a card that must be fixed at source.
- **Compilation is deterministic.** The same approved source always produces byte-identical output. Randomness belongs to the brain at runtime, never to the build.
- **Compiled output is disposable.** It can always be regenerated from source and is never edited by hand.

### 11.2 Responsibilities

The compiler is the project's enforcement point for structural rules that reviewers cannot reliably catch by eye. At minimum it verifies:

- ID uniqueness across the whole brain, and that no published ID has changed.
- That every card declares a valid engine, level, presentation style and lifecycle state.
- That every language variant is present and has a matching beat count.
- That only Approved cards are included in shipped output.
- That the seed/moment ratio and per-engine distribution are reported, so drift is visible before it reaches a lesson.

The last point is a reporting duty, not a corrective one. The compiler surfaces imbalance; people decide what to do about it.

---

## 12. Content Lifecycle

Every card moves through six states, in order. States are never skipped.

**Idea → Generated → Reviewed → Approved → Compiled → Live**

- **Idea** — a spark; a single interesting thought, not yet a card. Most ideas die here, by design.
- **Generated** — written as a complete card draft. Being generated confers no status whatsoever.
- **Reviewed** — assessed against the Character Bible and the quality standards. Reviewed means *judged*, not *passed*; a card can be Reviewed and rejected.
- **Approved** — accepted into the brain. This is where the ID is frozen and where translation is completed. Approval is the only state that grants a card the right to be shipped.
- **Compiled** — included in a validated build (§11). A card is Compiled by a machine, never by a decision.
- **Live** — in front of real children, in real lessons. Only here does the card produce evidence.

### 12.1 Rules

- **Movement forward requires a gate.** Each transition has an explicit reason; nothing advances by age or by inertia.
- **Movement backward is normal and cheap.** A Live card that consistently falls flat returns to Reviewed. Retirement is not failure; it is the classroom doing its job as final editor.
- **Retired cards keep their IDs forever.** IDs are never reused, so that classroom notes remain meaningful over time.
- **Only Approved content compiles.** There is no mechanism for shipping a card "just to try it."

---

## 13. Design Principles

These principles govern the content system specifically. They sit beneath, and never override, the design rules in `PUPU_PERSONALITY_SPEC.md` §8.

- **Content serves conversation.** A card that a child enjoys but that produces no speech has done half its job. A card that produces speech but that a child does not enjoy has done the wrong half.
- **Structure protects the character.** Every classification in this document exists to make PUPU feel more varied and more alive. Any structure that starts making him feel systematic has failed and should be removed.
- **One card, one idea.** Cards that do two things dilute both.
- **Variety is engineered; surprise is not.** The system can guarantee that a child does not receive the same engine twice in a row. It cannot manufacture delight — that is the writing's job.
- **Rarity is preserved by restraint, not by mechanics.** Content is kept memorable by writing less of it and cutting more of it, never by gating or rationing what exists.
- **Metadata is for selection and review only.** It never leaks to the child, and it never becomes the reason a card exists.
- **Small and finished beats large and unfinished.** A brain of a hundred cards that are all excellent is a better product than a brain of a thousand that are mostly adequate.
- **Every card must earn its place.** The default answer to any candidate card is no.

---

## 14. Folder Responsibilities

High-level only. This section describes what each area of the project is *responsible for*, not how it is implemented, named or organised on disk.

- **Source content.** Holds authored cards, grouped one library per engine (§4), plus Character Moments and Theme Pack definitions. Human-readable and reviewable. This is the only place content is edited, and the only content anyone should ever need to read to understand what PUPU can say.
- **Compiled content.** Holds the validated static output of §11. Machine-generated, never hand-edited, always reproducible from source.
- **Application logic.** Loads compiled content, makes selection decisions, and coordinates delivery. Contains no content, no hardcoded strings, and no card text of any kind — consistent with the localisation rule in `PUPU_PROJECT_PRINCIPLES.md`.
- **Presentation.** Owns the speech bubble, the reveal timing and the visual behaviour of presentation styles (§5). Knows how a card is shown; knows nothing about what a card means.
- **Documentation.** Holds this document and the design documents it sits beneath. Documentation records decisions; it never holds content.

The boundary that matters most: **application logic never contains content, and content never contains logic.** Every other separation here is convenience; that one is architectural.

---

## 15. Rules for Future Content Creation

These rules are permanent. Any future contributor — human or AI — should be able to settle a content decision using this section alone.

1. **Write the thought first, classify it second.** Never start from an engine and work backwards to a card. That process produces content that sounds like a category.
2. **Every new card declares one engine, one level, one presentation style and one conversation goal.** A card that cannot state its goal in one sentence is not ready.
3. **Respect the 90/10 split.** Character Moments are capped, not merely infrequent.
4. **Respect engine variety.** Before adding to a library, check whether the brain needs more of that engine — not whether that engine is the easiest to write for today.
5. **Never add a new engine to accommodate a card.** Rewrite the card, or record the engine proposal as a deliberate architectural change.
6. **Never duplicate a card.** If two cards are nearly identical, keep the stronger one and delete the other.
7. **Never edit a published ID.** Text may be revised; identity may not.
8. **Never put formatting, timing or markup in card text.** Delivery is the app's responsibility.
9. **Never let metadata substitute for writing.** No amount of tagging makes a forgettable card worth shipping.
10. **Never write content that continues the conversation itself.** PUPU opens the door and gets out of the way; the teacher and the child do the talking.
11. **Translate for feeling, not for words.** A literal translation that loses PUPU's voice is a defect, not a fidelity win.
12. **Cut more than feels comfortable.** The health of the brain is determined by what was rejected, not by what was written.
13. **When a rule here conflicts with the character documents, the character documents win.** This architecture exists to serve PUPU, never the reverse.

---

## 16. Final Statement

This document describes how PUPU's content is organised. It does not describe why anyone would want it.

A child does not experience engines, libraries, packs or lifecycle states. A child experiences one small creature saying one small thing, and then turning to their teacher to talk about it.

**The content system is successful when it is completely invisible.**
