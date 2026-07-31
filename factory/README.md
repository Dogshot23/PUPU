# PUPU Content Factory — V1

Transforms one Raw Content **Fact** into one finished **Conversation Card**, and compiles approved cards to runtime JSON.

Governed by `../docs/architecture/PUPU_CONTENT_FACTORY.md` (the process), `../docs/architecture/PUPU_CONVERSATION_CARD_SPEC.md` (the output), `../docs/architecture/PUPU_CONTENT_ARCHITECTURE_V2.md` (the vocabularies) and `../docs/content/PUPU_RAW_CONTENT_SPEC.md` (the input). Where this code disagrees with those documents, the documents are right and this code is wrong.

This is the canonical copy of the pipeline. `archive/src_legacy/` at the repo root is a broken, superseded attempt at a further-decomposed version of this same code — do not use it, do not import from it.

---

## What this is, and what it is not

The Factory "is a human and AI process, not a piece of software" (Architecture §10). Nothing here writes PUPU's words, picks an engine, or decides whether an idea is worth building.

What the code does is hold the **shape** of the process: six stages in order, none skippable, each refusing to run until the one before it passed, each recording the judgement that was made so a reviewer can audit it later. The author supplies judgement; the code gates and records it.

---

## The three layers

| Layer | Produced by | Format | Authoritative? | Lives at |
|---|---|---|---|---|
| Raw Content | Author, upstream | Markdown | Yes, for the idea | `raw-content/` |
| Conversation Card | Factory | Markdown | **Yes — this is the product** | `cards/` |
| Runtime JSON | Compiler | JSON | No. Derived, reduced, disposable | `content/packs/*` (app repo root), once published |

**The Factory never produces JSON** (Factory §3). Serialisation is the Compiler's job, downstream. If compiled files disagree with a card, the card is right (Card Spec §15).

Publishing compiled output into the live app — adding a `content/` module and a `registry.json` entry — is a separate, deliberate step, not something running the compiler does automatically (same precedent as `PUPU_MIGRATION_SPEC.md` §11, "activation is a separate step").

---

## Pipeline

```
raw-content/facts.md
      │  factory.js — parse, report §9.11 completeness
      ▼
  Raw Content record ── incomplete ──▶ refused, fixed upstream
      │
      │  factory.js
      ├─ Stage 1  Feasibility ──── no-go ──▶ rejected
      ├─ Stage 2  Engine selection
      ├─ Stage 3  Voice and writing  ◀──┐
      ├─ Stage 4  Quality review ───────┘ returned on any failed standard
      ├─ Stage 5  Metadata           ──▶ CARD, state = Generated
      │
      ▼  human review, outside the Factory
   Reviewed ──▶ Approved   ID frozen here, and only here
      │
      ├─ Stage 6  Korean translation (beat-matched)
      ▼
  cards/<engine>/CARD-0001.md  ── the authoritative record
      │  compiler.js — validate, strip, sort, report
      ▼
  Runtime JSON, one library per engine — same shape content-loader.js
  already reads for content/packs/* (see "Runtime JSON" below)
```

Approval sits **between** Stage 5 and Stage 6, not inside the Factory: "approval is a human decision made outside the Factory" (Factory §4 Stage 5), and Stage 6 takes an *Approved* card as input. This is why `approve()` lives in `card.js` rather than `factory.js`.

---

## Modules

| File | Responsibility |
|---|---|
| `vocabularies.js` | Every closed set, transcribed from its source document |
| `card.js` | Card shape, lifecycle-aware required fields, approval, translation |
| `factory.js` | Raw Content loading (Facts only, V1) and the six stages as ordered gates |
| `validate.js` | Card Spec §13 structural rules |
| `compiler.js` | Card → Markdown artefact, and Approved → runtime JSON; strip, sort, report |
| `run-example.js` | Worked example: FACT-0042 end to end |
| `test-guards.js` | Guard tests proving the gates refuse what they should |

`raw-content.js` and `authoring.js` do not exist here as separate modules — `factory.js` and `compiler.js` currently hold that logic inline. A further split was attempted elsewhere in the project's history and abandoned half-finished; it's a possible future refactor, not required for this pipeline to work (it passes all tests as a single-module-per-concern set today).

---

## Runtime JSON

One library per engine (Architecture §4.1), sorted by ID for determinism. **This shape matches the existing `content/packs/*` format `content-loader.js` already reads** (`PUPU_MIGRATION_SPEC.md` §9) — the compiler does not introduce a new runtime schema:

```json
[
  {
    "id": "CARD-0001",
    "type": "share",
    "subtype": null,
    "level": "A2",
    "tags": ["Animals"],
    "emotion": "thoughtful",
    "animation": null,
    "english": ["…"],
    "translations": { "ko": ["…"] }
  }
]
```

`type` carries the card's engine, lowercased (`character_moment` for Character Moments — see `CHARACTER_MOMENT` in `vocabularies.js`). `subtype` is always `null` here — there's no finer-grained per-entry category for a Factory-produced card the way there is for a migrated legacy pack, but the key is always present, matching Migration Spec §7's "key structure always present, never omitted" rule. `tags` carries the card's topic tags through to runtime — a deliberate match to the existing schema, even though Card Spec §9.2 calls them review-only; see the doc comment on `toRuntimeEntry()` in `compiler.js` for the full reasoning.

**Stripped at compilation:** `sourceId`, `conversationGoal`, `reviewRecord`, `lifecycleState` — review fields nothing at runtime reads. `source_id` in particular is deliberately absent from JSON and permanent only on the card artefact in `cards/`.

---

## Adding the other five raw-content types

V1 supports Facts only. The other five Raw Content libraries — Riddles, Jokes, Challenges, Comparisons, Story Seeds — are already authored (80–100 items each) but **have not been migrated into `raw-content/`**, because the current parser only understands the Facts format (a single `Content:` field). They remain where they were authored, each carrying a "Migration status" note at the top of the file:

| Type | Current location | Format the parser would need to learn |
|---|---|---|
| Riddle | `../docs/content/PUPU_RAW_RIDDLES_0001-0100.md` | `Question:` / `Answer:` |
| Joke | `../docs/content/PUPU_RAW_JOKES_0001-0060_REPLACEMENT.md` | `Question:` / `Answer:` |
| Challenge | `../docs/content/PUPU_RAW_CHALLENGES_0001-0100.md` | `Challenge:` (plus an optional `Note:`) |
| Comparison | `../docs/content/PUPU_RAW_COMPARISONS_0001-0100.md` | `Option A:` / `Option B:` |
| Story Seed | `../docs/content/PUPU_RAW_STORY_SEEDS_0001-0100.md` | `Seed:` |

To add one: extend the raw-content parser in `factory.js` to handle that type's field structure, add the type to `SUPPORTED_RAW_TYPES` in `vocabularies.js`, then move its file into `raw-content/` and point the loader at it. The six stages, the card shape, the validator and the compiler are all type-agnostic already — the Raw Content type describes the idea, and the engine describes what a child does with it (Raw Content Spec §2.1). The one place type matters is Stage 3's "must survive" note, which is a different sentence per type (Factory §6) and is already an authored field rather than a code path.

---

## Running

```bash
node run-example.js   # FACT-0042 from raw fact to compiled JSON
node test-guards.js   # guard tests
```
