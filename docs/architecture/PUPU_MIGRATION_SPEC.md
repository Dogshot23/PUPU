# PUPU Content Migration Specification

**Status:** Canonical. Established from the successful `missions.json` migration.
**Applies to:** `games.json`, `jokes.json`, `weird_facts.json`, `would_you_rather.json`, `tiny_stories.json`, and any future legacy content file.
**Goal:** every remaining file can be converted by following this document exactly, with zero new architectural decisions per file.

---

## 1. Folder structure

```
content/packs/<module_id>/
    module.json
    interactions.json
```

- Lives under `content/packs/`, never directly under `content/`. (`content/core/` is the one reserved exception — already migrated, not part of this spec.)
- Folder name = module ID, exactly (see §4).
- Exactly two files per folder, always named `module.json` and `interactions.json` — these filenames are hardcoded in `content-loader.js` and are not a style choice.

## 2. `module.json`

Fixed shape, every field always present:

```json
{
  "id": "<module_id>",
  "name": "<Title Case display name>",
  "enabled": true,
  "premium": false,
  "season": null,
  "language": "en"
}
```

- `id` — matches the module ID and folder name exactly.
- `name` — freeform Title Case for display (e.g. `"Weird Facts"`).
- `enabled` — `true` unless the pack is intentionally held back.
- `premium` / `season` — `false` / `null` unless the pack is genuinely gated or seasonal.
- `language` — `"en"` by default (see §13, open question on what this field is actually for).
- No additional fields. If a pack ever needs one, that's a spec change, not a per-file decision.

## 3. `interactions.json`

- A flat JSON array of interaction objects — same top-level shape as the source file.
- Every object uses the exact field set and order defined in §7.
- File is UTF-8, no BOM, 2-space indent, trailing newline, Korean characters written literally (never `\uXXXX`-escaped).

## 4. Module ID format

- Derived mechanically from the source filename: strip `.json`, keep as-is if already `snake_case`.

| Source file | Module ID |
|---|---|
| `games.json` | `games` |
| `jokes.json` | `jokes` |
| `missions.json` | `missions` ✅ done |
| `tiny_stories.json` | `tiny_stories` |
| `weird_facts.json` | `weird_facts` |
| `would_you_rather.json` | `would_you_rather` |

No manual renaming. The filename is the module ID.

## 5. Interaction ID format

```
<MODULE_ID_UPPERCASE>_<4-digit sequence, zero-padded, starting at 0001>
```

Example: `MISSIONS_0001`, `MISSIONS_0002`, ... `MISSIONS_0020`.

- Sequence restarts at `0001` within each module; never shared or coordinated across modules.
- Original source IDs (e.g. `MISSION_001`) are **discarded**, not preserved — they exist purely to prevent collisions with `core` and other packs, not to carry meaning.
- 4-digit padding supports up to 9,999 entries per pack before a format change would be needed.

## 6. `type`

- Every entry in a module carries the **same, fixed** `type` value — one per module, from the closed vocabulary below.
- Derived the same mechanical way: singular, `snake_case`, from the module ID.

| Module | `type` |
|---|---|
| `core` (existing) | `thought` |
| `missions` | `mission` ✅ done |
| `games` | `game` |
| `jokes` | `joke` |
| `tiny_stories` | `tiny_story` |
| `weird_facts` | `weird_fact` |
| `would_you_rather` | `would_you_rather` |

- This value is **not** read from the source file's own `type`/category field — it is always set to the fixed value above, regardless of what the source calls it.

## 7. `subtype`

- **Always present on every entry**, no exceptions — even if the source file turns out to be internally homogeneous (unlike `missions.json`).
- Holds the **original, unmodified, per-entry** category value from the source file's own type/category field, verbatim.
- If the source entry has no such field at all, `subtype` is set to `null` (the key is still present — never omitted), so every entry in a module has an identical key set.
- Purpose: preserves original authorial categorization for possible future use (finer filtering, analytics) without it interfering with the fixed, cross-pack `type` vocabulary in §6.

## 8. `translations`

- Replaces any top-level `korean` (or equivalently-named) field from the source.
- Fixed shape:
  ```json
  "translations": { "ko": [ "...", "..." ] }
  ```
- Values copied verbatim, same array, same order, same line count as the source's Korean array.
- If a source entry has no Korean content at all, use `"translations": { "ko": [] }` — key structure always present, never omitted.

## 9. Field ordering

Every interaction object uses this exact key order:

```
id, type, subtype, level, tags, emotion, animation, english, translations
```

Fixed for readability and diffability across packs — not functionally required by any code, but mandatory by convention so every pack's file reads identically.

## 10. Naming conventions

- `snake_case`, all-lowercase: module IDs, folder names, `type` values, filenames.
- `UPPERCASE`: only the interaction `id` prefix (e.g. `MISSIONS_`) — the one deliberate exception, to visually distinguish IDs from categories.
- `subtype` values: copied verbatim from source — **not** normalized to any convention, since they're a preserved historical record, not a new controlled vocabulary.
- `tags`: copied verbatim from source, casing and wording as-is. Not currently a controlled vocabulary (see §13).

## 11. Validation rules (run before delivering any pack)

Programmatic, not visual, checks:

1. Output JSON parses without error.
2. Entry count in output matches entry count in source, unless entries were explicitly excluded and reported as malformed.
3. Every entry has all required keys, in the order from §9.
4. `english` and `translations.ko` are both arrays; their lengths match, per entry.
5. `english` and `translations.ko` content is byte-identical to the source (no rewording, no punctuation changes).
6. `level`, `tags`, `emotion`, `animation` byte-identical to source, per entry.
7. `type` is the single fixed value from §6 on every entry, no exceptions.
8. `subtype` is present on every entry, holding the source's original value (or `null`).
9. IDs are sequential, zero-gapped, uniquely prefixed per module, matching §5.
10. `module.json` matches the fixed shape in §2 exactly.
11. No entry is added to `registry.json` as part of a migration step — activation is a separate, later step (see §14).

Any entry failing checks 3–6 is excluded from the output and listed by source ID in the migration report — never silently dropped, never silently "fixed" by guessing intent.

## 12. What must never change

- Wording, meaning, punctuation, and capitalization of every `english` and Korean line.
- The order of lines within an `english` or `translations.ko` array (they represent sequential beats).
- `tags`, `emotion`, `animation`, `level` values.
- The number of interactions (unless explicitly excluding a malformed entry, reported).

## 13. Open questions / ambiguities — self-review

Flagging before further migrations begin, per your request:

1. **Schema fit for non-flat content.** This spec assumes each interaction reduces to a flat `english[]` array of sequential beats. That's confirmed true for `core` and `missions`. It is **not yet confirmed** for:
   - `would_you_rather.json` — likely needs two distinct options, not a linear beat sequence. May not fit `english[]` at all without a schema extension (e.g. an `options` field).
   - `tiny_stories.json` — may have more structure than a few lines (paragraphs, distinct story parts).
   - `games.json` — may include rules/turns/setup rather than a single spoken thought.
   → **Recommend opening one raw entry from each of these three before converting**, rather than assuming this spec covers them as-is.

2. **`subtype` always present, even when it duplicates `type`.** If a future source file happens to already be homogeneous (single category, like `core`'s `"thought"`), `subtype` will just equal `type` on every entry — slightly redundant, but keeps the rule uniform with zero per-file judgment calls. Confirm this trade-off is acceptable, or say if homogeneous sources should omit `subtype`/set it to `null` instead.

3. **Malformed entry handling: exclude vs. flag-and-keep.** §11 currently says malformed entries are excluded from output and reported. An alternative would be to keep them with a `"malformed": true` marker for manual repair later instead of dropping them. Current spec drops them — confirm that's the intended policy before it happens for real on a file that might have more issues than `missions.json` did (which had zero).

4. **`tags` are not a controlled vocabulary.** Unlike `type`, nothing currently standardizes tag spelling/casing across packs (`"school"` vs `"classroom"`, etc. could proliferate). Not fixed by this spec — flagging as a possible future need, not addressed now.

5. **Purpose of `module.json`'s `language` field is undefined.** Every pack sets it to `"en"` even though packs also carry Korean via `translations`. Nothing in the codebase currently reads this field, so its intended meaning (primary authored language? UI language? something else?) is unclear. Not blocking migration, but worth clarifying before more modules encode a value for a field whose semantics aren't settled.

6. **Activation is explicitly out of scope here.** This spec covers producing a finished, standalone module folder only. Adding the module's entry to `registry.json` (making it live in the app) is a distinct, separate step for each pack — listed as validation rule §11.11 to make sure it isn't accidentally conflated with migration.

---

*This document is the single source of truth for migrating `games.json`, `jokes.json`, `weird_facts.json`, `would_you_rather.json`, and `tiny_stories.json`. Any deviation required for a specific file (e.g. due to §13.1) should be resolved as an explicit decision before that file's migration begins, then reflected back into this spec — not decided silently mid-conversion.*
