# PUPU Removal Candidates

Tracking doc only — nothing listed here has been deleted. This file exists so
removal candidates identified during the roadmap audit are recorded and don't
get forgotten, without acting on them yet.

**Update — Phase 2 complete.** The Factory pipeline consolidation is done:
`factory/` is canonical, `src/` has been archived (not deleted — see its own
entry below), and `PUPU_RAW_FACTS.md` has moved into `factory/raw-content/`.
The items below were on hold pending this; that hold is now lifted, but
deleting them still needs a fresh, explicit go-ahead — nothing here is
auto-approved by Phase 2 finishing.

## Candidates

### `sounds_semi_sorted/`
- What: duplicate copy of the audio already in `sounds/` (113 tracked files, ~39MB).
- Verified: no reference in any `.js`/`.html`/`.css` file. `sound-manager.js`
  hardcodes `SOUND_BASE_PATH = "sounds/"`.

### `sounds_unsorted/`
- What: second duplicate copy of the same audio (~39MB).
- Verified: same as above — unreferenced.

### `brain/*.json`
- What: old-schema content data (`games.json`, `interactions.json`,
  `jokes.json`, `missions.json`, `tiny_stories.json`, `weird_facts.json`,
  `would_you_rather.json`) superseded by `content/packs/*/interactions.json`.
- Verified: not fetched or imported anywhere; `content-loader.js` only reads
  from `content/`.

### `docs/animation/PUPU_ANIMATION_LIBRARY_DRAFT_OLD.md`
- What: self-labeled obsolete draft, superseded by
  `docs/animation/PUPU_ANIMATION_LIBRARY.md`.
- Verified: not yet diffed for unique content — do that check before deleting.

### `PUPU_RAW_FACTS.md` (repo root) and `docs/content/PUPU_RAW_FACTS.md`
- What: two duplicates of the Facts raw-content file, now that the current
  (100-fact) version lives at `factory/raw-content/facts.md`. The root copy
  is byte-identical to the file that moved; the `docs/content/` copy is a
  stale, diverged fork (stops at fact 80).
- Status: **awaiting a fresh go-ahead specifically for these two**, per the
  user's instruction not to run `git rm` until the relocated pipeline
  (`factory/raw-content/facts.md`) was proven working — verification passed,
  but deletion of the duplicates was deliberately kept as its own decision,
  separate from the move.

### `archive/src_legacy/` (new — added by Phase 2, not from the original audit)
- What: the old, broken `src/` copy of the pipeline (imports a
  `raw-content.js` that was never added), archived rather than deleted per
  the user's instruction during Phase 2.
- Status: **hold, longer-term.** Not a candidate for deletion now — kept
  until `factory/` has been proven in real use, per the user's explicit
  instruction. Revisit this on a future pass, not as part of any near-term
  cleanup.

## Not on this list (resolved by Phase 2)

`factory/` is now the canonical, single copy of the pipeline. `BUILDING/`
(the gitignored third copy, plus large local zip backups) was intentionally
left untouched — it's the user's own scratch area, not part of the tracked
repo, and its disposal remains the user's call rather than something Phase 2
acts on.
