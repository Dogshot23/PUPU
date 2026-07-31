# Archived — do not use

This is the old `src/` copy of the Factory pipeline, archived here (Phase 2 of the Factory consolidation) rather than deleted outright.

**It does not run.** `factory.js` imports `./raw-content.js`, which was never added to this copy — it has been broken since the initial commit.

The canonical, working pipeline is `factory/` at the repo root. Nothing imports from this archive; it is kept only so it's recoverable without digging through git history, until `factory/` has been proven in real use. See `docs/architecture/PUPU_REMOVAL_CANDIDATES.md` for its eventual removal.
