# Cards

The authoritative Conversation Card artefacts — one Markdown file per card, in the shape `renderCardMarkdown()` produces (`../compiler.js`). "The .md file is the authoritative record. Compiled JSON is derived from it and is disposable" (Card Spec §2, §15).

## Layout

One flat folder per Conversation Engine, per `PUPU_CONTENT_ARCHITECTURE_V2.md` §4 ("one library holds the cards for one engine... libraries are flat, no nesting"):

```
cards/
  share/
  guess/
  perform/
  compare/
  challenge/
  teach/
  imagine/
  continue/
  character_moments/
```

A folder is created when its first approved card exists, not before — none of the above exist yet as directories, since no card has been approved out of the Factory beyond the worked example in `../out/`.

## Rules

- One card per file, named by its frozen ID (e.g. `CARD-0001.md`), assigned only at Approved (Card Spec §6.1).
- A card lives in exactly one engine folder, matching its `Engine` field. Never duplicated across folders.
- These files are hand-reviewable and the source of truth. `content/packs/*` and any future `content/libraries/*` are compiled, disposable projections of what's here — never the other way around (Card Spec §15).
