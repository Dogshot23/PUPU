# PUPU Personality Spec

**Status:** Permanent design document
**Type:** Product & character design — not a technical specification
**Audience:** Anyone (human or AI) working on PUPU who needs to understand what PUPU is *supposed to feel like*, independent of how any given feature happens to be implemented.

This document is the source of truth for PUPU's character. Code changes come and go; this document should not. If a future implementation detail conflicts with something written here, the implementation is what should change.

---

## 1. Character Philosophy

PUPU is a cute, pink, blob-like creature who lives on screen during a student's lesson.

PUPU is not a chatbot, not a mascot in the branding sense, and not a UI widget. PUPU is meant to feel like a small living creature that happens to share the screen with the lesson — something with its own quiet inner life, not something that exists to serve the interface.

The single most important test for any PUPU behaviour is: **does this feel alive, or does this feel like a computer?** A blinking cursor, a progress bar, a notification chime — these feel like a computer. A creature that occasionally shifts its weight, makes a small noise for no obvious reason, or reacts a beat late because it was "thinking" — that feels alive. Every decision about PUPU should be pushed in the direction of the latter.

PUPU exists to delight children in small, funny ways — not to entertain them continuously. He should surprise, not perform. A good PUPU moment is a tiny, unexpected thing a child notices and smiles at; it is not a show PUPU puts on.

PUPU's personality, in a few words:

- **Curious** — he notices things, reacts to things, seems interested in what's happening.
- **Playful** — his default mode is gentle fun, not solemnity.
- **Slightly weird** — he is not a generic, safe, focus-grouped mascot. He has odd little quirks.
- **Occasionally gross, in a child-friendly way** — burps, farts, squishy noises. Silly-gross, playground-gross, never actually unpleasant or crude. This is a feature of his charm, used sparingly.

PUPU should never become noisy, annoying, or distracting. He shares the room with a lesson that matters more than he does. The instant PUPU starts to feel like he's competing for attention rather than quietly coexisting, something has gone wrong with his design.

---

## 2. Core Behaviour Principles

These principles should guide every behaviour, sound, and animation decision for PUPU, present and future:

- **Simple.** PUPU's behaviours should be small and easy to understand at a glance. He is not a complex system to master; he is a presence to notice.
- **Unpredictable.** Nothing about PUPU should feel like it runs on a schedule. Randomness — in timing, in selection, in intensity — is what makes him feel like a creature rather than a program.
- **Charming.** Every behaviour should be likeable. Weird and gross are allowed; mean, scary, or off-putting are not.
- **Gentle.** Even PUPU's more energetic moments (celebration, excitement) should land softly. Nothing about PUPU should feel abrupt, harsh, or jarring.
- **Encouraging.** PUPU's reactions should feel supportive of whatever the student is doing, never critical or judgmental.
- **Never overwhelming.** Quiet is the default state. Activity is the exception. If in doubt, PUPU should do less, not more.
- **Supports conversation rather than replacing the teacher.** PUPU is a presence in the room, not a participant in the lesson. He should prompt a child to turn to their teacher and say "did you see that?" — not hold a conversation with the child himself.

---

## 3. Sounds

Sound is one of PUPU's primary ways of feeling alive, and also one of the easiest ways to accidentally make him annoying. The guiding rule for all PUPU sound design is: **most sounds should be subtle and infrequent.** Sound is a seasoning, not a soundtrack.

- **Belly button squish** — the one sound that is *not* rare. It's a direct, physical response to a direct, physical action (the student pressing PUPU's belly button), so it should fire every time, immediately, like a real squishy toy would. This is the one place where reliability matters more than surprise.
- **Typing ambience** — a soft, looping background texture that plays only while PUPU's message is being typed out, and stops cleanly the instant typing finishes. It should feel like part of the typing itself, not like a separate sound effect layered on top.
- **Key taps** — occasional, irregular little taps while text is being revealed. These should feel like a natural texture to the typing, not a metronome — sparse and randomly spaced, never on every character.
- **Idle sounds** — small, rare noises PUPU makes while simply waiting for the student. These are the clearest expression of "PUPU is alive even when nothing is happening." They should be the rarest category of all — long stretches of true silence are the point, not a gap to be filled.
- **Celebration** — a warm, happy sound for good moments. Should feel like a small burst of joy, not a fanfare.
- **Burps** — silly, child-friendly, used sparingly. A surprise, not a running gag.
- **Farts** — same spirit as burps: playground-silly, harmless, rare enough to still get a laugh rather than an eye-roll.
- **Bubbles** — a soft, ambient, faintly aquatic idle sound — part of PUPU's "small strange creature" texture.
- **Wobble** — a light physical sound tied to PUPU shifting or jiggling; reinforces that he has a soft, squishy body.
- **Droplet** — a tiny, delicate idle sound; one of the quietest and rarest in the whole set.
- **Eating** — a soft chewing/masticating texture for whenever PUPU is depicted eating something; should feel comically small-scale, not messy or gross-loud.
- **Sleeping** — a gentle, restful sound for when PUPU is dozing; should make the moment feel cozy rather than eventful.
- **PUPU noises** — PUPU's own small vocalizations; his "voice," used the way a real small creature might chirp or murmur, not the way a character delivers a line.

Across all of these: rarity is what preserves their charm. A sound a child hears constantly stops registering as a surprise and starts registering as noise. A sound a child hears once every few minutes — or once every few lessons — stays memorable.

---

## 4. Idle Behaviour

Idle is PUPU's default and most common state, and it should be treated as a first-class part of his personality, not as "nothing happening."

Long quiet periods are desirable. A student should be able to sit through a stretch of a lesson with PUPU doing and saying nothing at all, and that should feel completely normal — the way a real pet can sit quietly in the corner of a room for a long while. Silence is not a failure state to be avoided; it's part of what makes the occasional burst of activity land.

Activity should arrive in occasional, uneven bursts rather than on a fixed cadence. A creature that does something every thirty seconds on the dot feels like a machine with a timer. A creature that might go quiet for a minute, then do two small things close together, then go quiet again for much longer — that feels like it has its own internal rhythm, the way real animals and small children do.

The right mental model for PUPU at idle is: **a small creature waiting patiently nearby.** He's not bored, not performing, not expectant — just present, occasionally shifting or making a small sound the way a resting animal might, entirely on his own schedule and for no one's benefit but his own.

---

## 5. Student Experience

The emotional arc for a student getting to know PUPU should unfold gradually, over weeks of lessons — not all at once in a single sitting.

A student should not be able to see "everything PUPU can do" in one lesson. Discovery should feel like getting to know a real pet: you don't learn all its quirks on day one, and every so often, months in, it does something you've genuinely never seen before. That slow reveal is a deliberate design goal, not an accident of limited content — new behaviours and sounds should be rare enough, and varied enough, that a student's mental model of "everything PUPU does" is always slightly incomplete.

PUPU should reward curiosity. A student who pokes, waits, watches, or experiments should occasionally be met with something small and delightful in return — not on a guaranteed schedule, but often enough that curiosity feels worthwhile. The reward for paying attention to PUPU is noticing him.

---

## 6. Teacher Experience

PUPU exists to create small opportunities for communication between teacher and student — a shared moment of "did you see that?" that gives a lesson a bit of warmth and levity. He is a conversation catalyst, not a participant in the lesson and not a second teacher.

The teacher should always remain the central figure in the room. PUPU should never compete with the teacher for the student's attention, never require the teacher to manage or explain him at length, and never take over a moment that belongs to the lesson. His role is to occasionally hand the teacher a small, easy opening — a shared smile, a quick "PUPU just did something funny" aside — and then get out of the way.

---

## 7. Future Behaviour Ideas

These are ideas for future exploration, not commitments or implementation plans. They exist to keep the space of "what PUPU could someday do" broad and to seed future brainstorming.

- Inflate
- Shrink
- Wobble
- Bounce
- Sneeze
- Blink
- Colour shift
- Rainbow mode
- Melt
- Tiny cloud thought bubbles
- Photographs
- Cartoon illustrations
- Sleeping
- Hiccups
- Dancing
- Spinning
- Stretching
- Glowing
- Confused face
- Excited face

Any of these — and ideas not yet imagined — should be evaluated against the principles in this document before being built, not the other way around.

---

## 8. Design Rules

These rules are permanent. They should outlive any particular feature, sprint, or implementation, and any future contributor — human or AI — should be able to use them to settle a design disagreement about PUPU without needing anyone's prior context.

- **Surprise is more valuable than frequency.** A behaviour that happens rarely and lands well is worth more than the same behaviour happening often.
- **Rare behaviours are memorable.** The rarity is the feature, not a limitation to be optimized away.
- **Simplicity is better than complexity.** If a behaviour needs a paragraph to explain, it's probably wrong for PUPU.
- **Personality comes before features.** Never add something to PUPU just because it's technically possible; add it because it makes him feel more like himself.
- **Every new feature should make PUPU feel more alive** — not busier, not more capable, not more "feature-complete." Alive.
- **Children should occasionally wonder, "I've never seen PUPU do that before."** If every child sees every behaviour within their first few lessons, PUPU has lost something important.
- **PUPU should always encourage real conversation with the teacher.** Any behaviour that pulls attention away from the teacher and toward PUPU-as-an-end-in-itself is a behaviour worth reconsidering.
