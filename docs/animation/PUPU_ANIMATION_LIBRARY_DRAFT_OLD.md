# PUPU Animation Library

**Status:** Permanent reference document — the master catalogue
**Type:** Catalogue of ideas — not an implementation document, not code
**Audience:** Anyone (human or AI) designing, prioritising, or building a specific PUPU animation, now or years from now.

This document exists to hold every animation idea PUPU could ever perform in one place, so that future work pulls from a single shared list instead of reinventing ideas piecemeal. It follows `PUPU_PERSONALITY_SPEC.md` and `PUPU_ANIMATION_SPEC.md` throughout — nothing here should be built without also checking those documents, and nothing here overrides them.

New ideas should be added to this catalogue over time rather than replacing it. It is meant to grow, not to be rewritten.

---

## How to Read This Catalogue

Every entry uses the same fields:

- **Description** — what happens, in one short line.
- **Tier** — how often it should occur, from `Reliable` (fires every time its trigger occurs) through `Occasional`, `Rare`, `Very Rare`, to `Legendary` (the rarest, "I've never seen that before" tier described in the animation spec's discovery curve).
- **Duration** — a rough suggested length, not a strict spec.
- **Sound** — which sound category from the personality spec it might pair with, if any. "None" means the animation should likely stay silent.
- **Idle / React / Typing** — whether the animation is eligible to occur during idle time, as a reaction to something, or alongside a message being typed out. An entry can be eligible for more than one.
- **Feeling** — the emotional note it's meant to strike.
- **Difficulty** — a rough build-effort estimate (Easy / Medium / Hard), not a commitment.
- **Priority** — `MVP` (worth having early), `Later` (valuable but not foundational), or `Future` (speculative, revisit once the core system is proven).

None of these values are binding numbers — they're a starting point for discussion, meant to be adjusted as the system is actually built and tuned.

A reminder before browsing: every entry here should still pass the checklist in `PUPU_ANIMATION_SPEC.md` §11 before it's built for real. Being in this catalogue means "worth considering," not "approved."

---

## 1. Squishy Body Movements

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Belly Squish | Squishes at the point of contact when pressed | Reliable | 0.2–0.4s | Belly button squish | No | Yes | No | cute | Easy | MVP |
| Wobble Jiggle | Whole body jiggles gently after any movement, settling like jelly | Occasional | 0.5–1s | Wobble | Yes | Yes | No | cute | Easy | MVP |
| Weight Shift | Leans weight slowly from one side to the other while waiting | Occasional | 1–2s | None | Yes | No | No | curious | Easy | MVP |
| Squash & Stretch Bounce | A single squash-down then stretch-up, like a soft toy bouncing once | Rare | 0.4–0.6s | Wobble | Yes | Yes | No | playful | Medium | Later |
| Body Ripple | A small ripple travels across his surface like a pond | Rare | 0.6–1s | Droplet | Yes | No | No | curious | Medium | Later |
| Slow Sink | Gradually sinks a little lower as if relaxing, then rises back | Occasional | 2–3s | None | Yes | No | No | sleepy | Easy | MVP |
| Puff Up | Briefly puffs up rounder, then settles back to normal size | Rare | 0.5–1s | Wobble | Yes | No | No | funny | Medium | Later |
| Deflate Sigh | Gently deflates a little with a soft exhale, like a sigh | Rare | 0.8–1.2s | PUPU noises | Yes | No | No | content/tired | Medium | Later |

## 2. Facial Expressions

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Content Smile | A small, warm smile appears briefly | Occasional | 1–2s | None | Yes | Yes | No | cute | Easy | MVP |
| Curious Tilt | Head/body tilt paired with an inquisitive look | Occasional | 1–1.5s | None | Yes | Yes | Yes | curious | Easy | MVP |
| Surprised Gasp Face | Eyes and mouth open wide for a split second | Rare | 0.3–0.5s | PUPU noises | Yes | Yes | No | surprised | Medium | Later |
| Confused Squint | One eye squints, brow furrows briefly, then relaxes | Rare | 1s | None | Yes | Yes | No | funny/curious | Medium | Later |
| Sleepy Half-Eyes | Eyes droop halfway during long idle stretches | Occasional | 2–4s | None | Yes | No | No | sleepy | Easy | MVP |
| Proud Beam | A bright, warm expression for a moment | Rare | 1–1.5s | Celebration (soft) | No | Yes | No | happy/proud | Medium | Later |
| Shy Peek | Briefly looks away or half-covers face, then peeks back | Rare | 1–2s | None | Yes | Yes | No | cute/shy | Medium | Later |
| Gentle Concern | A brief, softened, caring expression with no words | Very Rare | 1s | None | No | Yes | No | caring | Medium | Future |

## 3. Eye Animations

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Slow Blink | A natural, unhurried single blink | Occasional | 0.2–0.3s | None | Yes | No | Yes | cute | Easy | MVP |
| Double Blink | Two quick blinks in a row, slightly comic timing | Occasional | 0.4s | None | Yes | Yes | No | funny | Easy | MVP |
| Eye Widen | Eyes widen briefly in response to something | Rare | 0.3–0.5s | PUPU noises | No | Yes | No | surprised | Easy | Later |
| Eye Roll (Playful) | A light, comic eye roll | Rare | 0.6s | None | Yes | Yes | No | funny | Medium | Later |
| Cross-Eyed Moment | Eyes briefly cross, then correct with a little shake | Very Rare | 0.5–0.8s | Wobble | Yes | No | No | funny | Medium | Later |
| Wandering Gaze | Eyes drift slowly aside, as if noticing something off-screen | Occasional | 1.5–2s | None | Yes | No | No | curious | Easy | MVP |
| Sparkle Eyes | A brief sparkle or shine appears in the eyes | Rare | 0.5s | Celebration (tiny) | No | Yes | No | delighted | Medium | Later |

## 4. Blob Physics

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Jiggle Settle | After any motion, body jiggles and settles like gelatin | Occasional | 0.5–1s | Wobble | Yes | Yes | No | cute | Easy | MVP |
| Gentle Bounce | One soft bounce in place | Occasional | 0.4–0.6s | Wobble | Yes | Yes | No | playful | Easy | MVP |
| Roll Wobble | Rocks side to side like a weighted toy | Rare | 1–1.5s | Wobble | Yes | No | No | cute | Medium | Later |
| Flatten Momentarily | Briefly flattens slightly, as if gently sat on, then pops back | Rare | 0.5–0.8s | Wobble | Yes | No | No | funny | Medium | Later |
| Stretch Upward | Stretches taller for a moment, like a small yawn-stretch | Occasional | 1–1.5s | None | Yes | No | No | sleepy/content | Easy | MVP |
| Lean Sideways | Leans to one side, as if peering around something | Occasional | 1–2s | None | Yes | No | No | curious | Easy | MVP |
| Ripple Ring | A visible ripple ring passes across his whole body surface | Very Rare | 1–1.5s | Droplet | Yes | No | No | curious/strange | Hard | Future |

## 5. Funny Gross Behaviours

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Burp | A small, comic burp with a subtle body twitch | Rare | 0.3–0.5s | Burps | Yes | Yes | No | funny/gross | Easy | MVP |
| Fart | A small, silly toot with a tiny full-body wiggle | Rare | 0.3–0.5s | Farts | Yes | No | No | funny/gross | Easy | MVP |
| Hiccup | A single cute hiccup with a small full-body jump | Rare | 0.4s | PUPU noises | Yes | No | No | funny | Medium | Later |
| Bubble Burp | A small bubble floats up and pops along with the burp | Very Rare | 0.6–1s | Bubbles + Burps | Yes | No | No | funny/gross-cute | Medium | Later |
| Squelch Step | A small squelchy noise as PUPU shifts his weight | Rare | 0.3s | Wobble | Yes | No | No | funny/gross | Easy | Later |
| Drool Bubble | A tiny bubble appears at the mouth during sleepy states | Very Rare | 1–2s | Droplet | Yes | No | No | funny/gross-cute | Medium | Future |
| Gurgle Tummy | A soft, comic tummy-rumble sound with a small shake | Rare | 0.5–1s | PUPU noises | Yes | No | No | funny | Medium | Later |

## 6. Happy Behaviours

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Happy Wiggle | A quick, full-body wiggle of delight | Occasional | 0.5–1s | Celebration | Yes | Yes | No | happy | Easy | MVP |
| Little Hop | One small, joyful hop | Occasional | 0.4–0.6s | Wobble | Yes | Yes | No | happy | Easy | MVP |
| Warm Glow Pulse | A soft glow briefly pulses outward | Rare | 1–1.5s | Celebration (soft) | No | Yes | No | warm/happy | Medium | Later |
| Spin of Joy | A single, gentle spin in place | Rare | 0.8–1.2s | Celebration + Wobble | No | Yes | No | happy/playful | Medium | Later |
| Small Cheer | A tiny celebratory bounce-and-wiggle combination | Rare | 1s | Celebration | No | Yes | No | happy | Easy | MVP |
| Self Hug | Briefly wraps around himself in a small self-hug | Very Rare | 1–1.5s | PUPU noises | Yes | Yes | No | warm/cute | Medium | Later |
| Star-Struck Sparkle | Eyes sparkle and body glimmers briefly | Very Rare | 1s | Celebration (soft) | No | Yes | No | delighted | Medium | Future |

## 7. Sleepy Behaviours

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Slow Doze | Eyes close slowly and body stills for a stretch | Occasional | 3–5s | Sleeping | Yes | No | No | sleepy | Easy | MVP |
| Yawn | A small, soft yawn | Occasional | 1–1.5s | PUPU noises | Yes | No | No | sleepy/cute | Easy | MVP |
| Droopy Blink | A slow, heavy-lidded blink during quiet moments | Occasional | 0.5–0.8s | None | Yes | No | No | sleepy | Easy | MVP |
| Snore Bubble | A tiny bubble appears with a soft snore during a doze | Rare | 1–2s | Sleeping + Bubbles | Yes | No | No | sleepy/cute | Medium | Later |
| Curl Up | Body curls slightly inward, as if getting cozy | Rare | 1.5–2s | Sleeping | Yes | No | No | cozy | Medium | Later |
| Sleepy Sway | Gently sways as if nodding off, then catches itself | Occasional | 1–2s | None | Yes | No | No | sleepy/funny | Easy | MVP |
| Waking Stretch | A soft stretch-and-blink sequence, as if waking up | Rare | 1.5–2s | None | Yes | No | No | sleepy/content | Medium | Later |

## 8. Curious Behaviours

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Head Tilt Peek | Tilts to peer at something, as if noticing it | Occasional | 1–1.5s | None | Yes | Yes | Yes | curious | Easy | MVP |
| Lean Toward Edge | Leans toward the edge of the screen, as if looking past it | Occasional | 1–2s | None | Yes | No | No | curious | Easy | MVP |
| Sniff the Air | A small sniffing motion and sound | Rare | 0.6–1s | PUPU noises | Yes | No | No | curious | Medium | Later |
| Follow Glance | Eyes track a plausible point of interest briefly | Occasional | 1–2s | None | Yes | No | No | curious | Medium | MVP |
| Peek from Corner | Briefly ducks and peeks back from an edge | Rare | 1–1.5s | None | Yes | No | No | curious/shy | Medium | Later |
| Twitch of Interest | A small twitch or perk, as if something caught his attention | Rare | 0.4s | None | Yes | Yes | No | curious | Easy | Later |
| Investigate Poke | Pokes at his own body, as if curious about himself | Very Rare | 1–1.5s | Wobble | Yes | No | No | curious/funny | Medium | Future |

## 9. Rare Surprises

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Hiccup Fit | A short string of 2–3 small hiccups in a row | Very Rare | 1.5–2s | PUPU noises | Yes | No | No | funny | Medium | Later |
| Sudden Colour Blush | Briefly flushes a warmer shade of pink | Very Rare | 1s | None | Yes | Yes | No | cute/shy | Medium | Future |
| Momentary Transparency | Briefly becomes semi-see-through, like a jellyfish | Very Rare | 1–1.5s | Bubbles | Yes | No | No | strange/curious | Hard | Future |
| Tiny Sneeze | A small, comic sneeze with a full-body flinch | Very Rare | 0.5s | PUPU noises | Yes | No | No | funny/cute | Medium | Later |
| Startled Jump | A small startled hop, as if surprised by nothing in particular | Very Rare | 0.4–0.6s | Wobble | Yes | No | No | surprised/funny | Medium | Later |
| Echo Voice | A PUPU noise plays twice, the second time softer, like an echo | Very Rare | 1s | PUPU noises | Yes | No | No | strange/curious | Medium | Future |
| Double Take | Looks away, then snaps back to look again | Very Rare | 0.8–1s | None | Yes | Yes | No | funny/surprised | Medium | Later |
| Freeze-Frame Pause | Pauses completely still a beat longer than usual, then resumes with a blink | Very Rare | 1.5–2s | None | Yes | No | No | strange/curious | Medium | Future |

## 10. Legendary Discoveries

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Rainbow Shimmer | Body briefly shimmers through soft rainbow hues | Legendary | 2–3s | Celebration (soft) | Yes | No | No | magical/delighted | Hard | Future |
| Brief Levitation | Floats a small distance off the ground for a moment | Legendary | 2–3s | None | Yes | No | No | magical/surprised | Hard | Future |
| Glimpse of Another Form | A fleeting half-second silhouette hints at another shape, then returns to normal | Legendary | 0.5–1s | None | Yes | No | No | mysterious | Hard | Future |
| Thought Bubble Memory | A tiny cloud thought-bubble appears with a small image inside, briefly | Legendary | 2–3s | None | Yes | No | No | curious/sweet | Hard | Future |
| Mirror Blink | Colours briefly invert during a single blink, like a photo negative | Legendary | 0.3–0.5s | None | Yes | No | No | strange/surprising | Hard | Future |
| Tiny Firework Sparkle | A small, soft sparkle bursts and fades near PUPU | Legendary | 1–1.5s | Celebration (soft) | No | Yes | No | delighted | Medium | Future |
| Ancient PUPU Murmur | A unique, never-quite-repeated small vocalisation | Legendary | 1s | PUPU noises | Yes | No | No | mysterious/sweet | Medium | Future |

## 11. Seasonal Ideas

Kept deliberately generic (seasons and calendar milestones rather than specific cultural or religious holidays) so they travel well across classrooms everywhere.

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Winter Chill Shiver | A tiny shiver and a puff of "cold breath" | Seasonal | 0.5–1s | PUPU noises | Yes | No | No | cute/cold | Medium | Later |
| Spring Bloom Peek | A tiny flower-like shape briefly blooms and fades nearby | Seasonal | 1.5–2s | Bubbles | Yes | No | No | fresh/happy | Medium | Later |
| Summer Sun Squint | Squints and fans himself lightly, as if warm | Seasonal | 1s | None | Yes | No | No | cute/warm | Easy | Later |
| Autumn Leaf Catch | A small leaf drifts by and PUPU tries to catch it | Seasonal | 1.5–2s | Wobble | Yes | No | No | playful | Medium | Later |
| Student's Birthday Wobble | An extra joyful wiggle-and-glow on the student's own birthday, if known | Seasonal | 1.5–2s | Celebration | No | Yes | No | happy/special | Medium | Later |
| New Year Sparkle | A small sparkle-burst around the calendar new year | Seasonal | 1–1.5s | Celebration (soft) | Yes | No | No | happy | Medium | Future |
| Back-to-School Perk | An extra alert, perky little bounce near the start of a term | Seasonal | 1s | Wobble | Yes | No | No | excited/curious | Easy | Later |

## 12. Future Experimental Ideas

Speculative and unproven — worth revisiting once the core system exists, not before.

| Name | Description | Tier | Duration | Sound | Idle | React | Typing | Feeling | Difficulty | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Colour Shift Mood | A subtle colour shift that hints at mood over a longer stretch of time | Legendary | minutes | None | Yes | No | No | variable | Hard | Future |
| Melt Puddle | Briefly melts into a puddle shape before reforming, played for comedy | Very Rare | 1.5–2s | Wobble | Yes | No | No | funny/strange | Hard | Future |
| Cartoon Cutaway | A brief, stylised illustration replaces PUPU for a beat, then returns to normal | Legendary | 1s | None | Yes | No | No | funny/surprising | Hard | Future |
| Memory Photograph | A tiny photograph-style image appears briefly, hinting PUPU "remembers" something | Legendary | 2s | None | Yes | No | No | sweet/curious | Hard | Future |
| Dance Wiggle | A brief, silly little dance move | Rare | 1.5–2s | Celebration + Wobble | Yes | Yes | No | playful/funny | Medium | Future |
| Glow Aura Pulse | A soft aura glows and fades slowly around him | Very Rare | 2–3s | None | Yes | No | No | calm/magical | Hard | Future |
| Confused Static Fuzz | A brief, gentle "glitch" flicker, played for comic confusion rather than error | Very Rare | 0.3–0.5s | None | Yes | Yes | No | funny/confused | Hard | Future |

---

## Recommended Implementation Order

The first 20 animations worth building, ordered from easiest and highest-impact to most ambitious. This is a starting sequence, not a rigid roadmap — but it's deliberately shaped so that early items are cheap, foundational, and reusable, and later items start to lean on what came before.

1. **Belly Squish** — the one reliable, deterministic interaction in the whole system. It has to exist from day one because it's the anchor for "PUPU is a toy you can touch," and it's the simplest possible thing to build correctly.
2. **Slow Blink** — the cheapest possible signal of life. A single blink asset does more for "this feels alive" per unit of effort than almost anything else on this list.
3. **Weight Shift** — establishes baseline idle presence with a very small animation footprint, and needs no new assets beyond simple body movement.
4. **Curious Tilt** — works across idle, reaction, and typing contexts, so building it once pays off in three places immediately.
5. **Content Smile** — minimal expression work for a large emotional return; makes every other early animation feel warmer by association.
6. **Head Tilt Peek** — the anchor of the whole "curious" category; simple to build and immediately reusable.
7. **Stretch Upward** — small addition to idle variety using the same body rig as weight shift, low marginal cost.
8. **Lean Sideways** — same reasoning as stretch upward; rounds out idle variety cheaply before anything more elaborate is attempted.
9. **Wobble Jiggle** — a physics flourish that makes every motion built so far look more "blob-like"; worth adding once there's already motion for it to react to.
10. **Little Hop** — the simplest building block of the "happy" vocabulary, and a natural pairing with wobble jiggle.
11. **Happy Wiggle** — completes the initial happy pair with little hop; together they cover most early "good moment" needs.
12. **Sleepy Half-Eyes** — establishes the sleepy idle baseline using the blink asset already built in step 2.
13. **Yawn** — completes the initial sleepy vocabulary alongside sleepy half-eyes, for relatively little extra work.
14. **Sleepy Sway** — adds charm to the sleepy set without needing new assets beyond what's already built.
15. **Double Blink** — a cheap comic variation on the existing blink asset; adds texture almost for free.
16. **Wandering Gaze** — extends the eye system that blink and double blink already required, rather than starting a new one.
17. **Burp** — the first "gross" personality beat, and deliberately placed after the basics: it needs a sound asset but only a small, simple body twitch.
18. **Fart** — pairs naturally with burp, reusing the same lightweight approach, and rounds out the earliest gross-charm set.
19. **Jiggle Settle** — a physics-polish pass that layers on top of every motion built so far; makes sense once there's a body of motions worth polishing, not before.
20. **Surprised Gasp Face** — the first animation in this list that needs genuine expressive range rather than a simple body or eye movement, making it a deliberate step up in ambition to close out the first twenty.

Everything beyond this point in the catalogue should be picked up roughly in order of tier and difficulty — Rare before Very Rare, Very Rare before Legendary — once the MVP set above is in place and has been observed with real students for long enough to confirm the pacing and rarity feel right before adding more.
