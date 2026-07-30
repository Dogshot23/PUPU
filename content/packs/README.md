# Packs

Each pack is a folder containing:

- `module.json` — manifest (id, name, enabled, premium, season, language)
- `interactions.json` — content array, following the frozen interaction schema

To add a pack:

1. Create a new folder here, e.g. `christmas/`
2. Add `module.json` and `interactions.json` inside it
3. Add an entry to `../registry.json` with the module's `id` and its `path`
   relative to `content/` (e.g. `"path": "packs/christmas"`)

No application code changes are required.
