# PUPU Conversation Card Spec

**Status:** Permanent reference document — the definitive specification for a finished Conversation Card
**Type:** Content architecture specification — not character design, not engine design, not an implementation plan
**Audience:** Anyone (human or AI) writing, reviewing, translating, compiling or extending PUPU's Conversation Cards, for the lifetime of the project.

This document sits below `PUPU_PROJECT_PRINCIPLES.md`, `PUPU_PERSONALITY_SPEC.md`, `PUPU_CHARACTER_BIBLE.md` and `PUPU_CONTENT_ARCHITECTURE_V2.md`, and beside `PUPU_RAW_CONTENT_SPEC.md` and `PUPU_CONTENT_FACTORY.md`. Those documents define, respectively, what the product is, what PUPU feels like, who PUPU is, how the content system is structured, what enters the Content Factory, and what happens inside it.

This document defines one thing only: **what a finished Conversation Card contains.**

Nothing here redefines PUPU's character, the Conversation Engine set, the Raw Content types, or the Factory process. Where this document appears to conflict with the documents above, the documents above win and this one is wrong. Where it appears to introduce a new content concept, it is misnaming something that already exists.

This document describes structure and meaning only. It contains no code, no storage format, no schema, and no selection algorithm. How a card is stored on disk, loaded, or held in memory is an implementation decision that must remain free to change without this document changing.

---

## 1. Purpose of a Conversation Card

A **Conversation Card** is the smallest unit of content the application can display. One press of PUPU produces at most one card. There is no smaller unit, and there is no mechanism by which two cards become one delivery.

A card exists to do exactly one thing: **give a child something worth saying to their teacher** — or, in the case of a Character Moment, to make PUPU feel briefly and unmistakably alive.

Four properties define a card, and every rule in this document exists to protect one of them.

**A card is atomic.** It carries one idea. A card that carries two ideas is two cards, or one card that has not been cut yet.

**A card is independent.** Everything needed to select it, deliver it, translate it and review it lives on the card itself. A card never references another card, never depends on what was delivered before it, and never assumes anything about what will be delivered after it.

**A card is reusable.** A card is a fixed piece of authored content with no memory and no state. The same card may be delivered to the same child months apart and must work identically both times.

**A card is derived from exactly one Raw Content item.** One source, one card. Two Raw Content items are never blended into a single card. This is what makes idea preservation reviewable at all.

A card is also the only content layer a child ever experiences. Raw Content is invisible to them. The Factory is invisible to them. The compiled runtime files are invisible to them. The card — its words, its pacing, its emotion — is the entire product from the child's point of view.

---

## 2. Position in the Content Pipeline

The content system has three distinct layers. They are frequently confused because all three describe the same idea, and keeping them separate is one of the load-bearing decisions of the whole architecture.

**Raw Content** is the idea, captured cleanly and stored for reuse. It has no voice, no language pair, no engine, no emotion, no pacing and no lifecycle. It is governed by `PUPU_RAW_CONTENT_SPEC.md`. A child never sees it. A teacher never sees it. The application never loads it.

**The Conversation Card** is the idea after the Content Factory has made it a PUPU moment. It has PUPU's voice, an engine, a level, an emotion, a presentation style, and both languages. It is human-readable, human-reviewable, and it is the authoritative content of the project. This document governs it.

**Runtime JSON** is the compiled, machine-facing projection of approved cards, produced by the Content Compiler (`PUPU_CONTENT_ARCHITECTURE_V2.md` §11). It is minimal, disposable, never hand-edited, and never authoritative. It is discussed here only in §15, and only to establish what it may and may not contain.

The distinctions that matter:

- Raw Content may become **many** cards. A card compiles into exactly **one** runtime entry.
- Raw Content is **reused**; a card is **fixed**; a runtime entry is **regenerated**.
- Raw Content is upstream of judgement; a card is the object of judgement; a runtime entry is downstream of judgement and has no judgement of its own.
- Editing Raw Content does not change any card already produced from it. Editing a card does not change the Raw Content that produced it. Editing runtime output is never done at all.

A card is therefore the only one of the three layers that is simultaneously authored, reviewed, translated, shipped and seen.

---

## 3. Relationship to Raw Content

Every Conversation Seed card is produced from exactly one Raw Content item, and records which one (§6.2).

The relationship is one-directional and one-to-many: a Raw Content item may legitimately produce several cards across different engines and levels, but a card has one source and cannot acquire a second one later. If a card would need material from two sources, the material belongs in one Raw Content item or in two cards.

The card inherits nothing automatically. Specifically:

- **The idea is inherited and must survive intact.** Whatever the Raw Content item was about, the card is still about (`PUPU_CONTENT_FACTORY.md` §6).
- **The CEFR range is narrowed, not copied.** Raw Content records a range; a card declares a single level (§6.4).
- **Topic tags are inherited but may be reduced.** A card carries the tags that describe what the card is about, which may be fewer than the source carried.
- **Everything else is new.** Engine, voice, emotion, presentation style, translation and conversation goal do not exist in Raw Content and are added by the Factory.

The card also inherits the source's factual liability. A card may not contain a specific factual claim that its Raw Content item did not contain (`PUPU_CONTENT_FACTORY.md` §7). This is a property of the finished card, not only of the process that made it: a reviewer holding the card and its source must be able to check it.

Character Moments are the one exception. They are authored directly and have no Raw Content source, because they carry no conversational payload and no factual claim. This exception is recorded on the card itself (§6.2) rather than left implicit.

---

## 4. Relationship to the Content Factory

The Content Factory (`PUPU_CONTENT_FACTORY.md`) is the process that produces cards. This document specifies its output.

The division is exact and should not blur in either direction:

- The Factory decides **what a particular card contains**. This document defines **what any card must contain**.
- The Factory may be revised, replaced, automated, or run by a different contributor without this document changing.
- This document may not be satisfied by a well-intentioned Factory run that omits a required field. A card missing a required field is not a card yet, however good the writing is.

A card leaves the Factory complete in English at the Generated or Reviewed state, and complete in both languages at the Approved state. The Factory never assigns the Approved state itself; approval is a human decision made outside it.

This document is also the Factory's acceptance criteria. Anything a reviewer needs in order to judge a card must be present on the card. Anything a reviewer does not need is not a field.

---

## 5. Anatomy of a Card

A card has four parts, exactly as established in `PUPU_CONTENT_ARCHITECTURE_V2.md` §6.

- **Identity** — what this card is, where it came from, and where it belongs. Stable for the card's entire life.
- **Content** — PUPU's words, held in parallel per language.
- **Delivery** — how the words should arrive.
- **Review** — why the card exists and where it sits in its lifecycle.

### 5.1 Field summary

| Part | Field | Required |
|---|---|---|
| Identity | ID | Yes, from Approved |
| Identity | Source ID | Yes |
| Identity | Engine | Yes |
| Identity | Level | Yes |
| Content | English text | Yes |
| Content | Korean text | Yes, from Approved |
| Delivery | Presentation style | Yes |
| Delivery | Emotion | Yes |
| Delivery | Animation hint | **Optional** |
| Review | Conversation goal | Yes |
| Review | Topic tags | Yes |
| Review | Lifecycle state | Yes |
| Review | Review record | Optional |

Eleven required fields and two optional fields. The optional list is small by design — see §10.

### 5.2 Structural rules

Three rules apply to every card regardless of its fields.

**Content is beat-based, not paragraph-based.** A card's text in every language is a short ordered sequence of beats. This is what allows the presentation layer to pace a card without the card containing timing data.

**All languages are peers.** No language is primary at runtime, none is derived from another at runtime, and adding a third language later must never require restructuring existing cards.

**No logic on the card.** No conditions, no branching, no alternatives, no references to other cards, no state, no randomness. A card is data. Every variation a child experiences is produced by the brain choosing between cards, never by a card choosing between versions of itself.

### 5.3 No hidden text

Every piece of text on a card is either shown to the child in delivery, or is review metadata that is never shown to anyone in the room.

There is no third category. A card may not carry a concealed answer, a delayed reveal, a teacher-only note, or any text that depends on a mechanism to expose it. If a riddle's answer needs to reach the room, it is a beat of the card; if it should not reach the room, it stays in the Raw Content item and the card is written to work without it.

This rule exists to prevent a field being added now that would silently require a reveal system, a teacher interface, or a second delivery step to be built later.

### 5.4 When fields become required

Fields are not all required at once, because a card is not complete at once.

- **At Generated:** Source ID, Engine, Level, English text, Presentation style, Emotion, Conversation goal, Topic tags, Lifecycle state.
- **At Approved:** ID and Korean text are added. Approval is the point at which identity is frozen and translation is completed.
- **When meaningful:** a review record is added only if there is a reason a future contributor would need it. Most straightforward cards will never carry one.

A card in an earlier state that is missing a later state's fields is valid. A card that has reached a state without the fields that state requires is not, and may not advance.

---

## 6. Identity Fields

### 6.1 ID

A unique, permanent identifier, assigned when the card reaches Approved and frozen from that moment.

The ID exists because selection history, classroom notes, theme pack references and retirement records must all remain meaningful across years and across revisions of a card's text. It is the only thing about a card that can never change.

Rules:

- Unique across the entire brain, not merely within a library.
- Never reused, including for retired cards.
- Never renumbered, reorganised, or made to encode anything that might change. An ID is an identifier, not a description.
- Cards below Approved do not have one, and must not be referred to by a provisional identifier that could later be mistaken for a real ID.

### 6.2 Source ID

The identifier of the single Raw Content item this card was produced from, or an explicit record that the card is a Character Moment authored without a source.

This field is required because "one card, one source" is otherwise unverifiable. It makes three things possible that nothing else does: checking idea preservation during review, finding every card produced from an item when that item turns out to be wrong, and noticing that two cards which read differently are in fact the same idea twice.

Rules:

- Exactly one source, or none in the Character Moment case. Never two.
- The source is recorded permanently, even after the card is Live, and is never removed to "clean up" the card.
- The field is review information only. It is never delivered, and it is stripped at compilation (§15).

### 6.3 Engine

Exactly one Conversation Engine from the closed set defined in `PUPU_CONTENT_ARCHITECTURE_V2.md` §3, or the Character Moment classification in the same position.

The engine is not restated or redefined here. What matters at the card level:

- The engine governs runtime variety. It is the field the brain uses to avoid delivering the same shape of interaction twice in succession, which makes it the most operationally significant classification a card carries.
- A card declares one engine and one only. A card that plausibly belongs to two is a card doing two things.
- The engine is stable. Reclassifying a published card's engine invalidates the variety history that depended on it, and is done deliberately or not at all.
- Because the Character Moment classification occupies the same position, the seed/moment ratio is computable from this single field. This is why no separate card-class field exists.

### 6.4 Level

The single CEFR level this card is written for: A1, A2, B1, B2 or C1.

A card declares one level, not a range. Raw Content records a range because an idea is appreciable across several levels; a card is written in specific words for a specific child, and those words are either right for a level or they are not. Where an idea genuinely deserves two levels, it produces two cards.

Rules:

- Exactly one value, from the closed set.
- The level describes the language of the card as written, not the difficulty of the underlying idea. An easy idea written in demanding words is a demanding card.
- The declared level must fall within the CEFR range of the source Raw Content item. A card written below the floor of its source is a card whose idea has been flattened; a card written above the ceiling is a card whose source has been outgrown and which needs a different source.
- The Korean text is written for the same child and is not levelled separately.

---

## 7. Content Fields

### 7.1 English text

PUPU's words, written as an ordered sequence of beats.

A beat is a unit of thought as it arrives in speech, not a grammatical sentence. Beats are what allow presentation styles to pace a card, and they are the reason card text contains no timing marks, no ellipses used for effect, and no line breaks used as instructions.

Rules:

- Three to five beats is normal for a Conversation Seed. One or two for a Character Moment. More than five is almost always a card that has not been cut.
- Beats are ordered and the order is meaningful. The final beat is the one the child sits with before speaking, and it should open rather than close.
- Text contains no markup, no formatting, no punctuation used as a delivery instruction, and no stage directions.
- Text contains no mechanical instruction to the child. The engine shape must arise from what PUPU says, never from telling the child what to do.
- Text is natural spoken English at the declared level. If it does not read aloud well, it is not finished.
- Text never continues the conversation itself. PUPU opens the door; the teacher and the child walk through it.

### 7.2 Korean text

A complete Korean version of the card, added after the English is approved.

The Korean is a peer, not an annotation. It is what a Korean-speaking child and their teacher will actually read, and it must produce the same moment in the room that the English produces.

Rules:

- **The beat count must match the English exactly.** This is the one mechanical constraint on translation, and it exists so the presentation layer can pace both languages identically without knowing which language it is showing.
- Beats correspond in order and in function. Beat three of the Korean is the same moment as beat three of the English, even where the sentences differ.
- The translation preserves feeling, not wording. A literal translation that loses PUPU's voice is a defect, not a fidelity win.
- The Korean carries no extra content: no explanation, no gloss, no clarification the English does not have.
- Where English wordplay cannot survive translation, the Korean finds an equivalent moment. If no equivalent exists, the card is an English-only idea and should not have been approved.
- Every rule in §7.1 applies to the Korean text as well.

---

## 8. Delivery Fields

Delivery fields describe how a card should arrive. They are suggestions and categories, never commands, and no card may depend on them.

### 8.1 Presentation style

One value from the small closed set defined by the application, describing the card's pacing and shape in the speech bubble.

Rules:

- Exactly one per card.
- **A card must read correctly in the default style.** Presentation is polish, never a dependency. A card that only works with an unusual reveal has a writing problem.
- The style is chosen to match the card's existing beat rhythm. It is never chosen first and written toward.
- Presentation styles are defined by the application and are not enumerated here, because their set may change without any card changing.

### 8.2 Emotion

How PUPU feels while saying the card, drawn from the established emotion vocabulary in `PUPU_CONTENT_CREATION_GUIDE.md` and the character documents.

Emotion exists so that PUPU's delivery matches his words. It is the field that keeps a curious line from being delivered with a proud face.

Rules:

- Exactly one per card. A card whose emotion changes partway through is a card doing two things.
- The emotion is the one the writing already implies. It is descriptive, never corrective, and never assigned to make a batch look more varied.
- The emotion is drawn from a closed vocabulary. Free-text emotions cannot be balanced, filtered or audited, and quietly become unusable at scale.
- Emotion must never contradict the words. If the two disagree, the writing is right and the field is wrong.

**Emotion is an authoring field first.** Its primary purpose is to make the intended delivery explicit during writing and review: it is the author naming the inner state the words already imply, so that a reviewer can check whether the writing and the feeling agree. It disciplines the writing process and gives reviewers a clear handle.

Runtime systems may read the emotion field — the animation engine or a future delivery system might find it useful — but they are not required to, and a card must work correctly regardless of whether any runtime system consults it. Emotion does not select an animation, set a duration, choose a sound, or alter the speech bubble. Those decisions belong to their own systems, governed by `PUPU_ANIMATION_ARCHITECTURE.md` and `PUPU_PERSONALITY_SPEC.md` §3.

### 8.3 Animation hint

An optional suggestion to the animation system that a particular physical expression would complement this card.

This field is optional for a reason: most cards are better with no hint at all. A hint is declared only when a specific animation would add clearly more than PUPU's normal behaviour would.

Rules:

- **A hint is a suggestion, never a command.** The animation system may disregard it entirely, for reasons — state, cooldown, rarity, the one-thing-at-a-time rule — that the card knows nothing about and must not attempt to influence.
- **The card must work with no animation at all.** If the card only lands when the animation plays, the card is incomplete.
- At most one hint per card.
- A hint names an animation that exists in the catalogue. A hint naming something unbuilt is a request for an animation, which belongs in the animation documents, not on a card.
- A hint never specifies timing, duration, intensity, or sequencing.
- The absence of a hint is a normal, common, and entirely acceptable state.

---

## 9. Review Fields

Review fields exist so that a card can be judged, balanced and retired. They are never delivered, never seen by a child or a teacher, and never compiled into runtime output.

### 9.1 Conversation goal

One short sentence stating why this card exists.

The goal is the reviewer's handle on the card. It is what makes it possible to say "this card is not doing what it set out to do" rather than only "I don't like this card."

Rules:

- One sentence. A goal that needs two sentences describes a card that is doing two things.
- Honest, not aspirational. "Invite the child to defend a silly opinion" is a goal. "Enrich vocabulary through natural exposure" is a sign the writing has become educational.
- Written after the card, describing what it does — never before, prescribing what it should do.
- For a Character Moment, the goal records the feeling the moment is meant to create. A Character Moment goal that describes something the child is supposed to do means the card is a Conversation Seed and is misclassified.

### 9.2 Topic tags

One or more tags from the shared tag vocabulary, describing what the card is about.

Rules:

- Tags describe topic only. What kind of card this is, is the engine's job.
- Tags come from the shared vocabulary. Inventing a tag for one card signals a card too specific to be useful, or a genuine gap that should be proposed as a vocabulary addition rather than silently created.
- Tags may be fewer than the source Raw Content item carried, and never more specific than the card itself.
- Tags exist for review, balancing and theme pack curation. They are never surfaced to a child, and no visible categorisation of any kind is built on them.

### 9.3 Lifecycle state

One of the six states defined in `PUPU_CONTENT_ARCHITECTURE_V2.md` §12: Idea, Generated, Reviewed, Approved, Compiled, Live.

The state is recorded on the card because it determines what the card may do next, and because only Approved cards may be compiled. States are never skipped forward, and moving backward is normal and cheap.

### 9.4 Review record

An optional, source-only note added only when there is something a future contributor would genuinely need to know: the reason a card was returned and revised, a classroom observation that changed it, or the rationale behind an unusual decision. Most cards will never carry one, and the absence of a review record is a normal, expected state.

The field exists for the exceptions — the card whose engine was reclassified, the card that failed in a real lesson and came back changed, the card whose wording looks odd but was the result of a deliberate translation constraint. In those cases, a brief note prevents the same question from being asked again. In all other cases, the field should simply not be present.

Rules:

- Written only when absence would leave a future contributor unable to understand why the card is the way it is.
- Human-readable, brief, and appended to rather than rewritten.
- Never compiled, never delivered, and never used by any runtime behaviour.
- Never a substitute for fixing the card. A note explaining why a weak card is acceptable is a rejection written in the wrong place.
- A perfunctory note — "reviewed, approved" — is worse than no note, because it implies information was recorded when none was.

---

## 10. Fields Deliberately Excluded

The card has one optional field because everything else that might plausibly live on a card has been considered and placed elsewhere. This section records those decisions so that future contributors argue with a decision rather than adding a field by default.

**Sound references.** Sound behaviour belongs to `PUPU_PERSONALITY_SPEC.md` §3 and the SoundManager. A card that could choose its own sound could make PUPU noisy, which is the failure mode the sound rules exist to prevent.

**Timing, duration and pacing values.** Presentation style is a category; the application owns the numbers. Timing on a card would make the card's rhythm impossible to tune globally.

**Selection weights, priority or rarity.** Rarity in PUPU is preserved by writing less, not by rationing what exists. A weight field would let content quietly reshape selection, which belongs to the brain.

**Usage counts, ratings, popularity or any analytics.** There is no backend and no database. Evidence about a card is recorded by people, in the review record.

**Theme pack membership.** Packs reference cards; cards do not know which packs contain them. A card that knew would break the rule that the brain works correctly with zero packs defined.

**References to other cards.** Sequences, prerequisites, follow-ups and pairs would all make cards non-independent and non-reusable, and would introduce runtime state.

**Alternative or conditional text.** A card is one fixed piece of authored content. Variation comes from having more cards.

**Version numbers.** Text may be revised; identity may not. A card is always its current text, and the review record carries the reason it changed.

**Seasonal or expiry dates.** Excluded per `PUPU_MVP_SCOPE.md` §8. Content that expires needs a calendar, a build cadence and a retirement mechanism the product does not have.

**Author and date stamps.** Not needed by the application, and not needed for review beyond what the review record already carries.

**Wordplay and translatability flags.** These belong to Raw Content, where they inform the Factory's translation decisions. Once the Korean text exists, the flag has done its job.

**Difficulty scores beyond CEFR.** A second difficulty axis would immediately drift out of agreement with the first.

Anything on this list may be reconsidered — but only through §16, and only with a reason that names a running application behaviour or a demonstrated scaling failure.

---

## 11. Character Moment Cards

Character Moments are cards. They use the same structure, the same fields, and the same lifecycle as Conversation Seeds. They are specified fully in `PUPU_CONTENT_ARCHITECTURE_V2.md` §8 and are described here only where their field usage differs.

Differences:

- The Engine field carries the Character Moment classification rather than one of the eight engines (§6.3).
- The Source ID records that the card was authored directly, with no Raw Content item (§6.2).
- Text is one or two beats. A third beat usually means a thought has crept in, and a thought is a seed.
- The Conversation goal records a feeling rather than an interaction (§9.1).

Everything else is identical, including the Korean translation requirement, the beat-count rule, the emotion requirement, and the validation rules in §13. A Character Moment is held to the same standard as any other card; it is simply asking for less.

Two properties are worth stating at the card level because they are easy to lose in production. A Character Moment **asks for nothing** — the moment it asks, it is a Conversation Seed and is misclassified. And a Character Moment **must survive being missed** — a child who looks away and misses one has lost nothing at all.

---

## 12. Quality Requirements

These are the standards a finished card must meet. They are judgements, not checks, and they cannot be automated. Section 13 covers what can.

**It sounds like PUPU.** Not like a mascot, not like an educational app, not like a worksheet with personality applied. If another mascot could have said it unchanged, the card is not finished.

**It preserves its source.** A reader given only the card should be able to reconstruct something recognisably close to the Raw Content item behind it.

**It makes no unsourced factual claim.** Every specific claim is either present in the source or is plainly PUPU wondering aloud. PUPU imagining is not PUPU asserting, and the difference must be audible in the writing.

**It produces speech.** After the last beat, something is genuinely unresolved: something the child wants to say, or something the teacher wants to ask. A card that reliably produces a single word or silence has not done its job.

**Its language is right for its level.** Every word can be understood by a child at the declared level hearing it for the first time, and it reads aloud naturally.

**It is as short as it can be.** Length that has not been cut is a defect, not a style.

**It is safe for every child.** It cannot embarrass a child, single anyone out, or create a moment of failure. Nothing about a card should require a child to already know something in order to enjoy it.

**It leaves the teacher central.** The card hands the teacher a small opening and gets out of the way. It never conducts the lesson, and it never becomes the lesson.

**It passes the Press Again Test.** A child who has just received this card wants to press PUPU's tummy again.

A card that fails any one of these is returned, not shipped with a caveat. Metadata cannot rescue it: a perfectly classified card that a child would not enjoy is a rejected card.

---

## 13. Validation Rules

These rules are structural and checkable. The Content Compiler is their enforcement point (`PUPU_CONTENT_ARCHITECTURE_V2.md` §11.2); this section defines what it is enforcing. A card that breaks any of them is malformed and is fixed at source — never repaired downstream.

**Completeness.** Every field required by the card's current lifecycle state is present and non-empty (§5.4).

**Closed vocabularies.** Engine, level, presentation style, emotion, lifecycle state and topic tags each hold a value from their defined set. No free text appears in any classification field.

**Cardinality.** Exactly one engine, one level, one presentation style, one emotion, one lifecycle state, one source, and at most one animation hint.

**Identity.** IDs are unique across the whole brain, present on every Approved-or-later card, and unchanged since the card was approved.

**Source integrity.** The referenced Raw Content item exists, or the card is a Character Moment declaring no source. The card's level falls within the source's CEFR range.

**Beat parity.** Every language variant present has the same beat count, and no variant is empty.

**Text cleanliness.** No card text contains markup, formatting, timing marks, code, field labels, or references to any system.

**No cross-references.** No card text or field refers to another card by ID or by description.

**Animation hints resolve.** Any declared hint names an animation that exists in the catalogue.

**Only Approved compiles.** No card below Approved appears in shipped output, by any mechanism, for any reason, including testing.

Two reporting duties accompany the rules above. The seed/moment ratio and the per-engine distribution are surfaced at compile time so that drift is visible before it reaches a lesson. These are reports, not corrections: the compiler shows the imbalance, and people decide what to do about it.

---

## 14. Card Revision and Identity

A card's text may change. A card's identity may not. This section defines where the line falls, because getting it wrong silently corrupts the classroom record.

**Revision** is a change to an existing card that keeps its ID. Wording, beat phrasing, emotion, presentation style, animation hint, tags and translation may all be revised. A revised card returns to Reviewed and is re-approved before shipping again.

**Replacement** is a new card with a new ID. A change is a replacement, not a revision, when any of the following changes: the engine, the level, or the source. Each of these invalidates the history that was accumulated against the card, and pretending otherwise makes past observations misleading.

**Retirement** removes a card from shipped output without deleting it. Its ID is retired with it and is never reused. Retirement is not failure; a card that consistently falls flat in real lessons is doing exactly what the lifecycle exists to detect.

One rule governs all three: **the ID belongs to the moment, not to the text.** If the moment a child experiences is meaningfully different, it deserves its own identity.

---

## 15. Relationship to Runtime JSON

Runtime output is the compiled projection of approved cards. It is mentioned here only to fix the boundary, because it is the layer most likely to be mistaken for the card itself.

Three properties define it:

- **It is derived.** Every runtime entry is produced from exactly one approved card, deterministically. The same source always produces identical output.
- **It is reduced.** It carries only what the running application needs to select and deliver a card. The review fields — source, conversation goal, review record — are stripped, along with anything else no runtime behaviour reads. What remains is the card's identity, classification, text and delivery information.
- **It is disposable.** It is regenerated from source, never hand-edited, and never the place a content question is answered.

Two prohibitions follow, and they are absolute. **The compiler never authors.** It may validate, filter, sort, merge and strip; it may never rewrite PUPU's words, invent a missing field, or repair a malformed card. And **runtime output is never authoritative.** If the compiled files disagree with the card, the card is right.

The format of runtime output — its keys, its file layout, its grouping — is an implementation decision and is deliberately not specified in this document. It must be free to change without any card changing.

---

## 16. Future Extensibility

This specification will need to grow. These rules govern how, so that growth does not become sprawl.

**Additions are additive.** A new field must not require existing cards to be rewritten, re-reviewed, or re-translated. A change that invalidates the existing brain is not an extension.

**A new field must name a need.** Either a running application behaviour requires it, or a demonstrated scaling failure requires it. "It might be useful someday" is the reasoning §10 exists to refuse.

**New fields are optional first.** A field that starts required makes every existing card invalid on the day it is introduced. A field that starts optional and later becomes required does so as a deliberate migration, recorded in the changelog.

**Closed vocabularies wherever possible.** A new classification field arrives with its complete set of values. Free text cannot be balanced, filtered or audited, and becomes unusable long before anyone notices.

**New languages are peers.** A third language is added alongside English and Korean, with the same beat count and no derivation from either. Nothing in the card structure may assume that exactly two languages exist.

**Closed sets grow by architectural decision.** Adding an engine, a presentation style, an emotion or a CEFR value is a decision made deliberately and recorded in the changelog — never a side effect of writing a card that does not fit.

**Structure never grows to rescue content.** A field introduced so that a particular card can exist is a card that should have been rewritten.

Anticipated but explicitly deferred: additional languages, teacher-facing views of card metadata, and per-card observation records richer than the review record. Each may become necessary. None is designed for now, because designing for them now would add fields to every card in the brain in exchange for capabilities the product does not have.

---

## 17. Design Principles

These principles govern the card layer specifically. They sit beneath, and never override, `PUPU_PERSONALITY_SPEC.md` §8 and `PUPU_CONTENT_ARCHITECTURE_V2.md` §13.

- **The card is the product.** Raw Content, the Factory and the compiler exist to produce cards. A child experiences nothing else. Every decision at this layer should be made from the child's side of the screen.
- **One card, one idea, one source.** All three are the same discipline seen from different angles.
- **A field exists because something reads it.** The application, a reviewer, or the compiler. If nothing reads it, it is not a field.
- **Optional means genuinely optional.** A card must be complete, deliverable and good with every optional field absent.
- **Structure is not quality.** Every required field present is a floor, never a certificate. The best-classified card in the brain can still be a card that no child enjoys.
- **The card carries no mechanism.** No logic, no state, no hidden text, no dependency on another card. Everything clever happens in the writing or in the brain, never in the card's structure.
- **Lean now, extensible later.** A specification small enough to implement completely is worth more than one comprehensive enough to describe everything and finished by nobody.

---

## 18. Final Statement

A Conversation Card is a small, fixed, self-contained thing: a few beats in two languages, a handful of classifications, and one honest sentence explaining why it exists.

Everything else in the content system — the six Raw Content types, the eight engines, the six Factory stages, the six lifecycle states, the compiler — exists to produce that small thing reliably and to keep it good.

A child never counts the beats, never learns the engine, and never knows the card had a source. They hear one small creature say one small thing, and then they turn to their teacher because they have something to say.

**A Conversation Card is finished when nothing can be removed from it without losing that moment.**
