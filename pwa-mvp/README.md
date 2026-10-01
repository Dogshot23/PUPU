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
- `motion.js` — PUPU's body/arm movements (breathing, reactions, the face's follow-through), played with the Web Animations API on nested layers so reactions add on top of breathing.
- `audio.js` — one shared Web Audio player; each sound is decoded once and reused (replaces a new `Audio()` per sound). It also builds the chaos stunts' sound effects on the spot (`PupuAudio.sfx(name)`: oscillators, filtered noise, envelopes; no files).
- `vector-pupu.js` — the vector PUPU (`preview.html`, or `?pupu=vector`): drawn every frame from curves and springs, mirroring what `app.js` does to the PNG layers. Its canvas is bigger than the stage (`PAD`, matched in `style.css`) so he never gets cut off. It also draws the 11 chaos stunts (`motion.js` `CHAOS`: melt, slime-drip, acid-burp, eyeball-pop, mech-shift, pixel-deconstruct, low-battery, rocket-thrust, over-inflate, shatter, hyper-spin), which some cards name as a beat reaction, and which can also come from a burst of 4 quick taps, the broken-button payoff (50%), a beat with no reaction of its own (15%) or an idle moment (rare). The PNG version plays a simpler take on each.
- `cards.json` — the MVP card dataset (see above; now 137 cards). Each card has a `category` and `beats` (`setup` / `reveal` / `prompt`); every line inside a beat holds its English, Korean and Simplified Chinese side by side (`{ "en": …, "ko": …, "zh": … }`), so there is no separate translations file. The language button in the app cycles EN → KO → ZH.
- `categories.json` — per-category names (EN/ZH), box labels (English, plus `labels.zh`), beat order, tap/auto reveal, weights and PUPU's reactions (motion names from `motion.js`), plus the card-emotion → reaction map.
- `tools/validate-content.js` — run `node tools/validate-content.js` from `pwa-mvp/` after any edit to `cards.json` or `categories.json`: checks every line has English, Korean and Chinese (and every category its Chinese name and labels), beats match their category, and every reaction exists in `motion.js`.
- `manifest.json`, `sw.js` — PWA installability (manifest + a minimal cache-first service worker for the app shell).

## Running it

Serve this folder over HTTP (service workers require it — `file://` won't work). From the repo root, for example:

```
npx serve pwa-mvp
```

or any other static file server pointed at `pwa-mvp/`. Open it in a browser; an "Install PUPU" button appears once the browser fires its install-eligibility event.
