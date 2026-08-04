# PUPU MVP (development build)

A minimal, installable PWA: press PUPU's belly, PUPU says one of 100 things, picked at random while avoiding the last 10 shown. Nothing else.

## Why this exists as a separate app

`index.html` / `script.js` / `brain.js` / `behaviors.js` at the repo root are the real, fuller PUPU app (breathing, blinking, sound, effects, missions). This folder is not a replacement for that app — it is a small, disposable MVP scoped to exactly what was asked: one button, one random card, repeat-avoidance, installability. Building it separately avoided pulling in the main app's animation/sound complexity, which the MVP scope explicitly excluded.

## Content status — read before treating this as more than a dev build

`cards.json` contains all 100 Conversation Cards from `factory/cards/generated/`, exactly as the Content Factory produced them, **at the `Generated` lifecycle state** — none have been through the Reviewed → Approved human review step described in `PUPU_CONTENT_FACTORY.md` and `PUPU_CONVERSATION_CARD_SPEC.md`. Card Spec §13 and Architecture §12.1 both say a card below Approved should never appear in shipped output "by any mechanism, for any reason, including testing."

This app knowingly does that anyway, on your explicit instruction, for local development and classroom-testing purposes only. Consequences of that choice, so they're visible rather than buried:

- No card here has a permanent ID. `sourceId` (e.g. `FACT-0042`) is used as a stable local key purely so the app can track "recently shown" — it is not, and must never be treated as, the frozen ID a card gets at Approved (Card Spec §6.1).
- No Korean text exists yet (translation only happens after Approval — Factory §4 Stage 6). This build is English-only.
- The status line under the bubble deliberately keeps saying "Generated (not yet reviewed)" so this is never mistaken for finished, shipped content.
- `cards.json` is a one-off projection made directly for this MVP. It is **not** produced by `factory/compiler.js` — that compiler correctly refuses to compile anything below Approved, and was left untouched.

When real review happens, the reviewed/approved subset belongs in the project's actual content pipeline (`factory/cards/<engine>/`, compiled via `factory/compiler.js` into `content/packs/*`), not here.

## Files

- `index.html`, `style.css`, `app.js` — the app itself.
- `cards.json` — the 100-card MVP dataset (see above).
- `manifest.json`, `sw.js` — PWA installability (manifest + a minimal cache-first service worker for the app shell).

## Running it

Serve this folder over HTTP (service workers require it — `file://` won't work). From the repo root, for example:

```
npx serve pwa-mvp
```

or any other static file server pointed at `pwa-mvp/`. Open it in a browser; an "Install PUPU" button appears once the browser fires its install-eligibility event.
