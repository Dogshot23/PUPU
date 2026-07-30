# PUPU Raw Content Spec

**Status:** Permanent reference document — the definitive specification for PUPU's Raw Content
**Type:** Content architecture specification — not character design, not engine design, not an implementation plan
**Audience:** Anyone (human or AI) creating, reviewing, or contributing Raw Content for PUPU, for the lifetime of the project.

This document sits below `PUPU_PROJECT_PRINCIPLES.md`, `PUPU_PERSONALITY_SPEC.md` and `PUPU_CHARACTER_BIBLE.md`, and below `PUPU_CONTENT_ARCHITECTURE_V2.md`. It defines one layer of the content system: the **Raw Content** that enters the Content Factory and may eventually become a Conversation Card.

Nothing here redefines PUPU's personality, the Conversation Engine set, or the Conversation Card structure. Where this document appears to conflict with the documents above, the documents above win and this one is wrong. If a description here appears to add a new content-system concept, it is almost certainly misnaming something that already exists.

---

## 1. What Raw Content Is

Raw Content is **reusable source material**. It is an idea captured at its most transferable form — stripped of all PUPU personality, all presentation logic, and all delivery context — so that the same idea can be developed into multiple Conversation Cards across different engines, levels, and presentations in future, without rewriting the original idea.

Raw Content is not what appears in the app. A child never encounters it. A teacher never sees it. It has no language, no voice, no bubble, and no timing.

Its purpose is upstream of the Content Factory defined in `PUPU_CONTENT_ARCHITECTURE_V2.md` §10. Whereas the Factory's job is to turn raw material into polished Conversation Cards, Raw Content's job is to be that raw material — captured reliably, described consistently, and stored in a form that survives the process intact.

### 1.1 What Raw Content is not

Raw Content is not a draft Conversation Card. It is not PUPU speaking. It does not contain hooks, nudges, opening lines, or personality. It does not reference teachers, conversations, or lessons. It contains no timing hints, presentation style suggestions, engine classifications, or runtime behaviour. It contains no code, no JSON, and no implementation details.

The removal of all of the above is not an aesthetic preference. It is the mechanism by which the same idea stays usable across multiple cards. The moment Raw Content begins to sound like PUPU, it has already committed to one card — and the reusability that justifies storing it at all has been lost.

### 1.2 Relationship to the Content Factory

The Content Factory (`PUPU_CONTENT_ARCHITECTURE_V2.md` §10) receives Raw Content as input and produces Conversation Cards as output. The Factory adds the engine classification, the presentation style, the PUPU voice, the emotion, the animation hint, and the translation. None of these belong in Raw Content, because all of them may legitimately vary when the same idea is given to a different engine, a different level, or a different contributor on a different day.

A single Raw Content item may survive into several distinct Conversation Cards. That potential is the only reason Raw Content exists as a distinct layer.

---

## 2. The Six Raw Content Types

Raw Content is organised into six types. Each type names a **shape of idea** — the kind of thing it is, independent of how it will eventually be presented or which engine will process it.

The six types are: **Facts**, **Riddles**, **Jokes**, **Challenges**, **Comparisons**, and **Story Seeds**.

These types are a closed set. An idea that cannot be classified as one of the six should either be reworked until it fits, or discarded. Adding a seventh type is an architectural decision, not a writing decision.

### 2.1 Relationship to Conversation Engines

The types and the eight Conversation Engines (`PUPU_CONTENT_ARCHITECTURE_V2.md` §3) are not a one-to-one mapping. A Comparison, for example, may be developed by a **Compare** engine card or by a **Share** engine card depending on how the Factory chooses to frame it. A Story Seed may become a **Continue** card or an **Imagine** card. The type describes the idea; the engine describes what a child does with it. They belong to different layers and neither determines the other.

---

## 3. Facts

### 3.1 Purpose

A Fact is a piece of true, verifiable information about the world that is surprising, strange, beautiful, or funny enough to make a child pause. Its purpose is to create a moment of genuine wonder — not to inform, teach, or test. The measure of a good Fact is not accuracy alone but the reaction it produces: a child briefly thinking "wait, really?"

### 3.2 What makes a strong Fact

A strong Fact is unexpected. It runs against what a child would assume, or reveals something about a familiar thing that they have never considered. The most effective Facts are concrete and visual — they describe something the mind can picture — rather than abstract or statistical.

A strong Fact has a natural "but why?" or "how?" trailing behind it. That trailing question is the space a Conversation Card will eventually occupy. A Fact that answers its own natural follow-up is doing too much. A Fact that produces no natural follow-up is probably not interesting enough.

The strangeness should be intrinsic to the subject, not manufactured by framing. The idea itself should be surprising; no special phrasing should be required to make it seem so.

### 3.3 What to avoid

Avoid facts that are merely numerical ("the Earth is 4.5 billion years old"). Numbers without context rarely produce curiosity. Avoid facts that are only interesting to adults or that require specialist background knowledge to appreciate. Avoid facts that are true but unsurprising to a child who has already encountered the topic ("caterpillars become butterflies"). Avoid facts presented as lessons, lists, or comparisons of magnitudes — these are a different content type or no content type at all.

Do not record unverified information as a Fact. If the source is uncertain, discard the item; the Content Factory has no mechanism to flag factual doubt in a delivered card.

### 3.4 CEFR considerations

A Fact's complexity should be assessed at the level of the idea, not the words used to record it. An idea whose full meaning requires adult background knowledge to appreciate has a high effective CEFR ceiling regardless of how simply it is written. Record the intended minimum CEFR level at which the idea itself is appreciable — not the level at which a simplified summary could be delivered.

A single Fact may span a CEFR range (for example, A2–B2) if the core surprise is accessible at a lower level but richer follow-up questions are available to older or more advanced learners. When the range is genuinely wide, note both ends.

### 3.5 Length guidelines

A Fact is recorded as one or two sentences in plain English. It states the surprising truth. It does not frame it, comment on it, or editorialize. "A snail can sleep for three years" is a complete Fact record. "A snail can sleep for three years, which is pretty incredible when you think about it" is a Fact record with contamination added.

### 3.6 Metadata requirements

Every Fact record carries the universal metadata fields (§9.11). No type-specific fields are required beyond these.

### 3.7 Quality checklist

- Is this true and verifiable?
- Would a child who hears it for the first time say "wait, really?"
- Does it leave a natural question unanswered?
- Could it be understood and enjoyed by a child at or above its stated CEFR level with no additional context?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?
- Is it free of comparisons that would make it better suited to a Comparison item?

---

## 4. Riddles

### 4.1 Purpose

A Riddle is a question whose answer is not obvious, but which — once revealed — feels satisfying and slightly surprising. Its purpose is to create a short moment of genuine thinking, followed by the pleasure of resolution. The question is the Riddle; the answer must always be recorded alongside it.

### 4.2 What makes a strong Riddle

A strong Riddle has an answer that is arrived at through logic, wordplay, or lateral thinking — not guessing. The path from question to answer should be traceable in hindsight, even if it was not obvious at first. This traceability is what produces the satisfaction of a good Riddle and distinguishes it from a trivia question.

The answer should be a single concrete thing, or a very small set of things. An answer that could be "lots of things depending on how you look at it" is not a Riddle answer; it is the beginning of a discussion, which belongs to a different content type.

The best Riddles work across a range of ages. The question should be puzzling enough to require thought, but the answer — once given — should feel inevitable rather than arbitrary.

### 4.3 What to avoid

Avoid Riddles whose answer depends on cultural knowledge specific to one country or age group. Avoid Riddles whose answer is ambiguous, or which have more than one equally valid answer. Avoid Riddles that are only solvable if you already know the answer — these are trivia items, not Riddles. Avoid Riddles whose question contains the answer.

### 4.4 CEFR considerations

Assess CEFR at the level of the language used in the question and answer, and at the level of the lateral thinking required. A simple verbal Riddle ("What has hands but cannot clap?") is accessible at a lower level than a Riddle requiring abstract reasoning about systems or concepts. The answer must be expressible in language appropriate for the stated CEFR level — a Riddle whose answer requires vocabulary a child does not know yet is not an appropriate Riddle for that level.

### 4.5 Length guidelines

A Riddle is recorded as the question and the answer. Both are written in plain English. The question is one sentence. The answer is one word, phrase, or at most one sentence of explanation. No framing, no hint, no preamble.

### 4.6 Metadata requirements

Every Riddle record carries the universal metadata fields (§9.11), plus: the question and the answer. Question and answer must be stored together and must never be separated in the record.

### 4.7 Quality checklist

- Is the answer unique and unambiguous?
- Can the path from question to answer be traced in hindsight?
- Is the answer expressible in language appropriate for the stated CEFR level?
- Does the answer feel satisfying rather than arbitrary?
- Is the question free of its own answer?
- Is it free of cultural dependencies that would make it opaque to some learners?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?

---

## 5. Jokes

### 5.1 Purpose

A Joke is a piece of comic material — usually a setup and a punchline — whose purpose is to produce a smile or a laugh. Its purpose is delight, not information. A Joke does not need to teach, invite speculation, or produce conversation; its entire value is in the moment of reaction it creates.

### 5.2 What makes a strong Joke

A strong Joke is simple and visual. The comedy should be accessible: it relies on an incongruity, a surprise, a silly image, or a mild absurdity that a child can picture immediately. The punchline must arrive quickly — the setup should be as short as the joke can bear.

The best Jokes for this audience are playground-grade: the kind that a ten-year-old would tell a friend. They may be slightly silly, mildly gross in a child-friendly way, or based on simple wordplay. They should never be mean, never embarrassing, and never dependent on adult context or knowledge.

The test of a strong Joke is not whether an adult finds it clever but whether a child finds it funny. These are different standards and the child's standard is the one that matters.

### 5.3 What to avoid

Avoid jokes that require cultural context not shared across the learner population. Avoid jokes based on complex wordplay that does not survive translation into Korean. Avoid sarcasm, irony, and jokes that work by embarrassing someone — real or fictional. Avoid jokes that are only funny if you have seen a particular film, television programme, or piece of media. Avoid anything that could be read as mean even in context.

Note that jokes depending on English puns or homophones should be flagged explicitly, because they may produce a strong English-language card but be untranslatable without losing the joke entirely. This is not a reason to reject the Joke from Raw Content; it is information the Factory needs.

### 5.4 CEFR considerations

A Joke's effective CEFR level is set by the most complex element required to understand the punchline. A simple visual absurdity may work at A1. A joke depending on a homophone or a conceptual twist may require B1 or higher. Wordplay-dependent jokes should state that explicitly in their metadata, since translation choices downstream will depend on this.

### 5.5 Length guidelines

A Joke is recorded as its setup and punchline in plain English, with no framing or delivery instruction. Setup and punchline are stored as separate elements so the Factory can make pacing decisions. A Joke with no distinct setup (a one-liner) is recorded as a single element.

### 5.6 Metadata requirements

Every Joke record carries the universal metadata fields (§9.11), plus: the setup (or full text for one-liners) and the punchline, stored as separate elements. Where the joke depends on English wordplay or a homophone, a note to that effect is required so the Factory can assess translatability.

### 5.7 Quality checklist

- Is this funny to a child, not only to an adult?
- Does the punchline arrive quickly?
- Is it free of cultural dependencies not shared across the learner population?
- Is it free of meanness, embarrassment, and adult context?
- If it depends on English wordplay, is that flagged?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?

---

## 6. Challenges

### 6.1 Purpose

A Challenge is a prompt for a physical, vocal, or imaginative action that can be performed briefly within the space of a lesson. Its purpose is to create a moment of active, embodied participation rather than discussion. The child (or, in some cases, the teacher) must *do* something.

### 6.2 What makes a strong Challenge

A strong Challenge is achievable in seconds. It requires no props, no preparation, and no prior knowledge. The action must be possible for a child sitting in front of a screen during an online lesson.

The best Challenges are slightly silly or mildly surprising — they produce a small moment of play, not a task to be completed. The action itself should be its own reward; a Challenge that requires explanation before it can be understood is too complex.

A Challenge should have a clear, unambiguous completion condition. A child should know when they have done the thing. "Try to lick your elbow" is a Challenge with a clear (and famously impossible) completion condition. "Think of something creative" is not a Challenge; it is an invitation to think, which belongs to a different type.

### 6.3 What to avoid

Avoid Challenges requiring movement a child might not be able to perform, or that assume a particular physical setup. Avoid Challenges that could embarrass a shy child. Avoid Challenges so easy they feel pointless, and Challenges so difficult they feel discouraging. Avoid Challenges that require materials, special sounds, or things not present in a standard lesson environment. Avoid timed Challenges — timing belongs to the Factory and the app, not to Raw Content.

### 6.4 CEFR considerations

Most Challenges are language-light; their CEFR level is set by the complexity of the instruction, not the action. A Challenge whose instruction can be pantomimed or demonstrated may work at A1 regardless of the vocabulary used to record it. Note the vocabulary required to understand the instruction, not the difficulty of the action itself.

### 6.5 Length guidelines

A Challenge is recorded as a single plain-English instruction describing the action and the completion condition. No encouragement, no reward framing, no setup. One sentence is usual; two may occasionally be necessary if setup and action genuinely cannot be combined.

### 6.6 Metadata requirements

Every Challenge record carries the universal metadata fields (§9.11), plus: the action. Where the Challenge is physically impossible (deliberately), this should be noted, since impossibility is itself the joke — the Factory needs to know.

### 6.7 Quality checklist

- Can this be completed in seconds, inside an online lesson, with no props?
- Is the completion condition clear and unambiguous, with no encouragement or reward framing attached?
- Is it appropriate for a range of physical abilities and comfort levels?
- If deliberately impossible, is that noted?
- Is it one idea, not two?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?

---

## 7. Comparisons

### 7.1 Purpose

A Comparison presents two things side by side and invites a judgement between them. Its purpose is to create a moment of genuine opinion — not facts, not right answers, but the particular pleasure of being asked what *you* think and discovering that someone else thinks differently.

### 7.2 What makes a strong Comparison

A strong Comparison pairs two things that are genuinely arguable. Both options must have a reasonable case for them. A Comparison where nearly everyone would pick the same option is not a Comparison; it is a question with a consensus answer, and it belongs to a different type or no type.

The two things being compared should be clearly distinct from each other but belong to the same domain or category — this is what makes the comparison feel natural and what prevents one option from being trivially better. "Dogs or cats?" works. "Dogs or algebra?" does not.

The best Comparisons produce different answers from different people — different ages, different cultures, different moods. That variation is the conversational payload. A Comparison that any reasonable person would answer identically has no conversational value.

### 7.3 What to avoid

Avoid Comparisons with an objectively correct answer. Avoid Comparisons where one option is culturally universal (for example, a beloved cultural reference versus an obscure one, where most children in the learner population will not know the second). Avoid Comparisons that require extensive explanation of either option before a choice can be made — if a child does not already know both things, the Comparison is not ready for this audience. Avoid Comparisons that are trivially silly without being genuinely arguable.

### 7.4 CEFR considerations

Assess CEFR based on the vocabulary required to understand and name both options, and the complexity of reasoning required to articulate a preference. A simple preference between two familiar concrete things ("ice cream or cake?") is accessible at A1. A Comparison requiring abstract reasoning or knowledge of unfamiliar concepts may sit at B1 or above. The goal is for a child at the stated level to understand both options without assistance.

### 7.5 Length guidelines

A Comparison is recorded as two named options and, where necessary, one brief sentence providing just enough context for the options to be understood. No framing, no declared preference, no suggested follow-up. The two options are peers; the record must not imply that one is more interesting, funnier, or more obviously correct than the other.

### 7.6 Metadata requirements

Every Comparison record carries the universal metadata fields (§9.11), plus: both options, stated clearly and as peers. Where brief context is required for one or both options to be understood, it is included in the record body, not as a separate field.

### 7.7 Quality checklist

- Are both options genuinely arguable?
- Would different children give different answers?
- Does a child at the stated CEFR level already know and understand both options?
- Is one option not implied to be better, funnier, or more interesting than the other?
- Do both options belong to the same domain or category?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?

---

## 8. Story Seeds

### 8.1 Purpose

A Story Seed is an incomplete situation — the start of a story, a sentence, a scenario, or a world — left deliberately unfinished so that someone else can continue it. Its purpose is to create imaginative momentum: a strong enough beginning that the mind immediately wants to know what comes next, and interesting enough that many different answers are all valid.

### 8.2 What makes a strong Story Seed

A strong Story Seed establishes something concrete and specific quickly, then stops at a moment of genuine uncertainty. The opening must be specific enough to feel real and grounded; a vague beginning produces a vague continuation. The stopping point must be genuinely open — many different continuations must all be plausible and interesting.

The best Seeds introduce an element of strangeness, incongruity, or surprise in their premise. A world where something unexpected is true ("One morning, all the teachers forgot how to read") produces richer imaginative space than a purely realistic premise. The strangeness must be established in the seed itself, not imported from context.

A strong Story Seed does not imply a correct continuation. It opens a door without pointing through it.

### 8.3 What to avoid

Avoid seeds that are so open they provide no direction ("Tell a story about an animal"). The seed must have a specific premise — a character, a situation, an unexpected condition — that gives the imagination something to push against. Avoid seeds that strongly imply one obvious continuation, as these limit rather than open.

Avoid seeds whose premise requires lengthy explanation before it makes sense. The first one or two sentences should be enough to establish everything a child needs to continue. Avoid seeds featuring characters or worlds that belong to copyrighted material — seeds must be original.

Avoid seeds that could cause anxiety or distress. The situation may be strange or surprising; it should not be frightening, harmful, or upsetting to a child.

### 8.4 CEFR considerations

Assess CEFR based on the vocabulary and conceptual complexity of the seed itself. The continuation is the child's own and cannot be controlled, but the entry point must be accessible at the stated level. A seed involving abstract concepts, unusual vocabulary, or a culturally unfamiliar premise sits at a higher effective level than a seed grounded in concrete, familiar situations.

The stopping point matters to CEFR assessment: a seed that stops immediately after establishing a concrete premise requires less language to engage with than a seed that establishes a complex situation before stopping.

### 8.5 Length guidelines

A Story Seed is recorded as one to three sentences that establish the premise and reach a stopping point. No continuation is provided. No suggested follow-up question is included. The record ends where the imagination takes over.

### 8.6 Metadata requirements

Every Story Seed record carries the universal metadata fields (§9.11), plus: the seed text. Where the seed contains a premise element that requires verification — for example, a claim presented as a child character's belief — this should be noted if the factual accuracy of that element matters.

### 8.7 Quality checklist

- Does the seed establish a specific, concrete premise?
- Does it stop at a moment of genuine uncertainty, where many continuations are plausible?
- Does it avoid implying a single correct continuation?
- Is it free of copyrighted characters and worlds?
- Is it free of content that could cause anxiety or distress?
- Can a child at the stated CEFR level understand the premise without assistance?
- Does it comply with the general cleanliness rules (§9.2–§9.6)?

---

## 9. General Rules for All Raw Content

These rules apply across all six types. A Raw Content item that violates any of these rules is not ready for the Content Factory, regardless of how strong the underlying idea is.

### 9.1 One idea per item

Every Raw Content item contains exactly one idea. Two facts that happen to share a topic are two items. A riddle that also contains a joke is a riddle and a joke. An item that does two things forces the Factory to choose which idea to develop, which means one idea is always lost. Separate them at the source.

### 9.2 No PUPU voice

Raw Content contains no PUPU personality, no characteristic phrasing, no openings ("I wonder...", "Wait..."), no internal monologue, and no emotional commentary ("which is pretty weird if you think about it"). These belong to the Conversation Card, not the source material. The Factory adds the voice; Raw Content must not prejudge it.

### 9.3 No conversational framing

Raw Content does not address a teacher, a student, or a lesson. It does not contain "ask your teacher," "imagine you and your teacher," "this is a great chance to," or any other framing that places the idea inside a classroom interaction. The idea exists independent of any context; the Factory applies context.

### 9.4 No hooks or nudges

Raw Content does not open with a hook, a curiosity builder, or an invitation. "Did you know..." and "Here's a strange one..." and "You might not believe this, but..." are all hooks. They belong to the Conversation Card. Raw Content records the idea flatly, without attempting to make it interesting. The idea should be interesting enough on its own.

### 9.5 No presentation or timing instructions

Raw Content does not contain formatting, pacing hints, beat markers, reveal instructions, or suggestions about how to show the content. It contains no ellipses used for dramatic effect, no line breaks used for timing, and no instructions to pause. These belong to the presentation style layer (`PUPU_CONTENT_ARCHITECTURE_V2.md` §5), which the Factory applies. Raw Content is plain text.

### 9.6 No implementation details

Raw Content contains no JSON keys, no field labels, no code, no schema references, and no system names. It is human-readable prose that describes an idea. The structure imposed by this document (the metadata requirements per type) describes what information to capture — it does not prescribe how to store it. Storage format is an implementation decision, not a content decision.

### 9.7 Accuracy is the author's responsibility

Raw Content must be accurate when it claims to be. A Fact that is wrong or unverifiable must not enter the system — there is no downstream mechanism for flagging factual doubt once a card is live. Riddle answers must be correct and unambiguous before the item is recorded. Story Seeds that include factual premises should be clearly written as imaginative scenarios so no implied factual claim is made.

### 9.8 CEFR is assessed at the idea level

CEFR metadata in Raw Content describes the complexity of the **idea**, not the complexity of the words used to record it. A complex idea written in simple words is still a complex idea. CEFR should reflect the minimum level at which a learner can genuinely appreciate the item — understand it, be affected by it, and have something to say about it. This is more demanding than the level at which a simplified version of it could be delivered.

An item whose CEFR range is genuinely wide should record both ends. An item whose CEFR floor is uncertain should err toward the higher estimate; it is better to overestimate difficulty than to deploy material that frustrates a learner.

### 9.9 Tags describe topics, never types

Topic tags describe what an item is **about** — animals, food, space, school, friendship, science, language, bodies, time. They never describe what kind of item it is; the type field already does that. Tags drawn from outside the shared vocabulary should not be invented for a single item. If no existing tag fits, the gap in the vocabulary should be recorded as a proposed addition to the shared tag set, not silently resolved by creating a one-off tag.

### 9.10 Quality gates before the Factory

Raw Content that enters the Factory in poor condition wastes the Factory's filtering work. Before submitting an item, the author should verify:

- The idea is strong enough on its own, without the benefit of the doubt.
- The item is complete: every required metadata field is present.
- The item is clean: it contains none of the excluded elements listed in §9.2 through §9.6.
- The item is honest: it makes no factual claims the author cannot verify.
- The item is one thing: it has not smuggled a second idea inside the first.

The Factory's job is to transform strong raw material into polished Conversation Cards. It is not to rescue weak material, repair contaminated items, or decide between two ideas that should have been separated before submission. Everything before the Factory gate is the author's responsibility.

### 9.11 Universal metadata fields

Every Raw Content item, regardless of type, carries these four fields:

- **ID** — unique, permanent, and assigned at the point of first recording. The format is not prescribed here; what matters is that no two items share an ID, and that an ID is never reused once assigned.
- **Type** — exactly one of the six types defined in §2. A record with no type or with a type outside the closed set is not a valid Raw Content item.
- **CEFR range** — the minimum and maximum CEFR levels at which the idea itself is appreciable. Where the range spans only a single level, both ends are the same. Where the ceiling is genuinely open, record the floor and note that the upper bound is unconstrained. See §9.8 for how CEFR is assessed.
- **Topic tags** — one or more tags drawn from the shared tag vocabulary, describing what the item is about. See §9.9 for tagging rules.

These fields are referenced as "the universal metadata fields" in each type's §x.6 section. Any change to this list applies to all six types simultaneously.

---

## 10. What Raw Content Does Not Decide

This section exists to prevent scope creep into the Raw Content layer. The following decisions belong to later stages of the pipeline and must not be anticipated, implied, or constrained by Raw Content.

**Engine.** Raw Content does not classify itself by Conversation Engine. An idea may be developed by multiple engines across different cards. The Factory decides.

**Presentation style.** Raw Content does not describe how it should arrive on screen. The Factory and the app decide.

**Emotion.** Raw Content does not suggest how PUPU should feel while delivering it. The Factory decides.

**Animation.** Raw Content contains no animation hints, gesture suggestions, or references to PUPU's physical behaviour. The animation engine decides.

**Language.** Raw Content is authored in English. Translation is added after Factory approval, not before. Raw Content contains no Korean text, no translation notes, and no guidance on how to translate.

**Card count.** Raw Content does not declare how many Conversation Cards it expects to produce. One item may produce one card or several; the Factory decides.

**Lifecycle state.** Raw Content has no lifecycle state. States (Idea, Generated, Reviewed, Approved, Compiled, Live) belong to Conversation Cards, not to their source material. Raw Content either exists or it does not.

---

## 11. Design Principles

These principles govern the Raw Content layer specifically. They sit beneath, and never override, the principles in `PUPU_PERSONALITY_SPEC.md` §8 and `PUPU_CONTENT_ARCHITECTURE_V2.md` §13.

- **Reusability is the only justification for this layer.** If an item cannot plausibly become more than one card, it should be written directly into the Factory as a single card candidate, not banked as Raw Content. The overhead of the Raw Content layer only pays for itself when the idea is genuinely generative.
- **Completeness is not the same as strength.** A Raw Content item that satisfies every metadata requirement but whose underlying idea is weak is a weak item. Requirements are a floor, not a certificate.
- **The Factory's filters apply downstream; the author's judgement applies upstream.** Self-editing before submission is more efficient than producing large volumes of material and relying on the Factory to reject most of it.
- **Contamination is harder to remove than to prevent.** An item that enters the Factory with a hook already embedded will tend to produce a card that keeps the hook — even when a different hook would have been better. Keep Raw Content clean.
- **Small and excellent beats large and mediocre.** A library of one hundred strong items is more useful than a library of one thousand items of varying quality. The PUPU content system at every level rewards restraint.

---

## 12. Final Statement

Raw Content is the earliest point in the PUPU content pipeline at which an idea is worth recording. Its value is entirely prospective — it has no effect on a lesson, no voice, and no presence in the app.

Its only purpose is to give the Content Factory reliable, reusable, uncontaminated material to work from.

**Raw Content succeeds when the Factory finds it easy to ignore, transform, or discard.**
