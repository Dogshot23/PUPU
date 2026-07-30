# PUPU Animation Architecture

**Status:** Permanent reference document — the engine blueprint
**Type:** Technical architecture — implementation-independent, not code
**Audience:** Anyone (human or AI) building, extending, or debugging the PUPU animation engine, for the lifetime of the project.

This document defines the technical foundation every PUPU animation will run on. It sits below `PUPU_PERSONALITY_SPEC.md` and `PUPU_ANIMATION_SPEC.md` in the sense that it exists to *serve* their principles, not to reinterpret them — anywhere this document is silent or ambiguous, those two documents are the tiebreaker. It sits above `PUPU_ANIMATION_LIBRARY.md` in the sense that every entry in that catalogue should be buildable as data on top of what's defined here, without needing engine changes.

Nothing in this document is code, and nothing here should be read as an implementation plan for a specific language or framework. It describes shapes and responsibilities, not syntax.

---

## 1. Purpose

The animation engine is responsible for:

- Knowing what state PUPU is currently in, and what states he's allowed to move to next.
- Holding the catalogue of possible animations as data, along with each one's rules (tier, cooldown, eligible states, category).
- Deciding **whether**, **what**, and **when** an animation should play, for every trigger type described in the animation spec (direct, contextual, idle).
- Enforcing rarity, cooldowns, and the "one thing at a time" rule, so that no individual animation and no combination of animations can accidentally violate the personality spec.
- Resolving conflicts when more than one animation becomes eligible at once.
- Giving other systems (the lesson engine, the SoundManager, a future teacher-facing control) a small, stable surface to talk to, without needing to know how any of the above works internally.

The animation engine is deliberately **not** responsible for:

- Deciding what any individual animation looks like, in visual or motion terms. That's content, defined per-animation as data referencing the primitives in §9, not engine logic.
- Deciding whether an animation is a good idea in the first place. That judgment belongs to the design process described in the animation spec's evaluation checklist, before an entry ever reaches the Registry.
- Producing or owning sound. Sound belongs to the SoundManager; the engine only coordinates timing with it (§11).
- Any lesson content, pedagogy, curriculum logic, or student progress tracking.
- Any teacher-facing UI beyond exposing whatever minimal state (e.g. "disabled") a control might need to read or set.
- Persisting or reasoning about long-term student data beyond what's strictly needed to support long-tail rarity and discovery (§7, §8) — and even then, only as much as those features require, not as a general-purpose data store.

If a proposed engine responsibility doesn't fit this list, it likely belongs in a different system, or doesn't belong in the product at all.

---

## 2. Design Philosophy

These principles govern every subsystem described later in this document:

- **Modular** — each subsystem in §3 has one job. A subsystem should be replaceable on its own without the others needing to know or care.
- **Reusable** — nothing about the engine should be specific to any one animation. If a piece of logic only makes sense for a single animation, it isn't engine logic — it's data belonging in the Registry.
- **Data-driven** — animations are described as data (tier, category, eligible states, cooldown, which primitives they compose), not as bespoke code paths. Adding animation #88 should mean adding a Registry entry, not writing new engine code.
- **Deterministic where required** — a small number of trigger types (most notably direct physical interaction) must always behave exactly the same way, every time. Determinism is a deliberate, narrow exception, not the default.
- **Unpredictable where appropriate** — everywhere else, the engine should actively resist becoming predictable, in line with §8.
- **Lightweight** — the engine shares a screen with a lesson that matters more than it does. It should cost as little attention, performance, and complexity as possible for what it delivers.
- **Maintainable** — a contributor years from now, with no memory of today's decisions, should be able to understand any one subsystem without reading all of them.
- **Scalable** — the engine should handle 87 animations or 400 equally well. Growth in the catalogue should never require growth in the core engine's complexity.

---

## 3. High-Level Architecture

The engine is made up of the following subsystems. Each has a single responsibility, and each should be able to be reasoned about independently.

**Animation Registry**
The source of truth for every animation that exists. Holds each animation's metadata — its tier, category, eligible states, cooldown rules, and which primitives it's composed from — as data, not logic. Nothing outside the Registry should need to know these details directly; everything else queries it.

**State Manager**
Tracks PUPU's current state (§5) and the rules for which state transitions are legal. Every other subsystem consults the State Manager before doing anything, since eligibility for almost everything else depends on current state.

**Scheduler**
Owns the question of *when* the engine should even consider whether something might happen. It doesn't choose animations itself — it decides when to next ask the question, using the jittered, non-fixed timing described in §8, and hands control to the Idle Controller or Reaction Controller as appropriate.

**Idle Controller**
Handles the idle trigger class specifically: unprompted behaviour with no external cause. On each window the Scheduler opens, it asks "should something happen right now, and if so, from which pool" — consulting the Cooldown Manager and Random Selector before anything is chosen.

**Reaction Controller**
Handles direct and contextual triggers: a physical interaction, or an animation tied to the lifespan of another process (like a message being typed). Structurally separate from the Idle Controller because its rules are different — some of its outputs are meant to be reliable, not rare.

**Cooldown Manager**
Tracks when each animation, category, and tier last played, and answers a single question for anything else that asks: "is this currently allowed to happen, given what's already happened recently?" Owns per-animation, per-category, per-tier, and idle-wide cooldowns (§7).

**Random Selector**
Given a pool of currently-eligible animations and their weights, decides *what* plays and exactly *when* within an allowed window. Owns the probability distributions and timing jitter described in §8. Does not decide eligibility itself — that's already been filtered by the Cooldown Manager and State Manager before the pool reaches it.

**Priority Resolver**
Steps in whenever more than one candidate becomes eligible at, or near, the same moment. Decides which one plays, which are deferred, and which are dropped entirely, following the rules in §6.

**Animation Manager**
The top-level orchestrator. It's the only subsystem that other systems (the lesson engine, the SoundManager, any teacher-facing control) should ever need to talk to directly. It wires the above subsystems together, executes the lifecycle in §4, and is responsible for cleanup and the return to idle at the end of every animation.

---

## 4. Animation Lifecycle

Every animation, regardless of category or tier, passes through the same sequence of stages:

**Trigger** → something becomes possible: a direct interaction occurs, a contextual process starts or ends, or the Scheduler opens an idle evaluation window.

**Eligibility** → the State Manager and Registry are checked: is PUPU in a state that allows this category of animation at all? An animation ineligible in the current state is filtered out immediately, before any cooldown or randomness work is done.

**Cooldown check** → the Cooldown Manager filters the remaining candidates against per-animation, per-category, per-tier, and idle-wide cooldowns (§7). Anything still "resting" is removed from the pool.

**Random selection** → for anything beyond a deterministic trigger, the Random Selector picks one candidate (or "nothing") from what remains, using the weighting and timing philosophy in §8.

**Priority resolution** → if more than one thing has become eligible at once — a rare but real case — the Priority Resolver decides the outcome per §6.

**Animation execution** → the chosen animation plays, composed from primitives per §9–10, with any relevant event markers emitted for the SoundManager per §11.

**Cleanup** → the Cooldown Manager is updated with a new "last played" timestamp for the animation, its category, and its tier; any temporary state is cleared.

**Return to idle** → PUPU returns to his resting default state, and the Scheduler resumes deciding when to next open an evaluation window. Idle is always the destination at the end of this cycle, never a dead end the system has to specially handle.

---

## 5. Animation States

PUPU is always in exactly one of the following states:

- **Idle** — the default resting state. Most of PUPU's life is spent here. Idle-category animations are only eligible from this state.
- **Thinking** — a brief, bounded state entered while something is being prepared (for instance, before a response begins appearing). Distinct from Idle because the "waiting" quality is different: this is anticipatory rather than restful.
- **Typing** — entered while a message is being revealed. Contextual/typing-eligible animations and sounds live here, and this state ends the instant typing finishes.
- **Reacting** — a brief state entered in response to a direct interaction or a notable lesson moment. Reaction-eligible animations live here.
- **Sleeping** — entered only after a long, genuine stretch of inactivity. A deeper version of Idle, where the sleepy-category behaviours become relevant and ambient idle chatter should quiet down further, not increase.
- **Busy** — a state the lesson can request when PUPU should visually stand down entirely — for instance during an assessment moment that needs the student's full attention. No animation of any kind should play in Busy except, at most, a silent return to a neutral resting pose.
- **Disabled** — a state in which the engine performs no animation work at all. Exists for any future teacher- or system-level opt-out, complete and total, not a "quieter" mode.

**Allowed transitions:**

- Idle is the hub: Idle → Thinking, Idle → Typing, Idle → Reacting, and Idle → Sleeping (only after a sufficiently long stretch of Idle) are all valid, and each of those states returns to Idle when it concludes.
- Thinking → Typing is valid (thinking resolves into a response beginning to appear); Thinking → Idle is valid if nothing comes of it.
- Sleeping → Reacting is valid (a direct interaction can wake PUPU), and should route back to Idle afterward, not directly back to Sleeping — waking up and immediately dozing again would feel mechanical.
- Busy and Disabled can be entered from any state, immediately, since they represent an external system asserting control. Recovery from either always returns to Idle, never directly to Typing, Reacting, or Sleeping — the engine should re-establish a neutral baseline before resuming any behaviour.
- No state should be able to transition to itself in a way that's observable — re-entering Idle from Idle, for instance, isn't a transition, it's just continuing.

---

## 6. Priority System

Conflicts are rare by design — most of the time only one thing is eligible at all — but the engine still needs a clear, small set of rules for when they occur.

**The core ordering, from highest to lowest priority:**

1. **Direct interaction** always wins immediately over anything else in progress. If an idle animation is mid-flight when a direct interaction occurs, the idle animation is cut short cleanly (not abruptly cancelled mid-motion — it settles to a neutral point) and the interaction response takes over.
2. **Contextual/typing-bound** animations take priority over idle, because they're tied to something else's lifespan that the engine doesn't control the timing of.
3. **Idle-triggered** animations are lowest priority and are the ones expected to be deferred or dropped when something above them becomes eligible.

**Examples:**

- PUPU is mid-way through an idle "weight shift" when the student presses his belly. The interaction wins immediately; the weight shift resolves to neutral rather than continuing, and the belly squish plays without delay.
- A message begins typing while an idle animation's evaluation window happens to open at the same moment. Typing wins; the idle roll is simply discarded rather than deferred to "try again later" — deferring would risk two things landing close together, which undercuts the rarity feel.
- Two idle-eligible animations are both randomly selected in the same evaluation window (a Random Selector edge case). Only one may play — the "one thing at a time" rule from the animation spec is absolute. The Priority Resolver breaks the tie by favouring whichever candidate has gone longer since it last played, rather than a coin flip, so the system's own memory contributes to variety rather than pure chance doing all the work.
- A Legendary-tier candidate and a Rare-tier candidate both become eligible in the same window. Legendary does not automatically win — its rarity already makes it special, and letting it always pre-empt lower tiers would make it feel entitled rather than surprising. The same recency-based tie-break applies.

---

## 7. Cooldown System

Cooldowns are what make rarity actually happen at runtime, rather than existing only as a design intention. The Cooldown Manager enforces several layers simultaneously — an animation must clear all of them, not just one, to be eligible:

- **Per-animation cooldowns** — the minimum time before the exact same animation can be selected again. This prevents any single behaviour from repeating too soon, regardless of what else has happened.
- **Category cooldowns** — a minimum gap between any two animations from the same category (e.g. two "gross" behaviours), even if they're different specific animations. Without this, a student could see Burp followed shortly by Fart and correctly perceive that as "the gross thing happening twice," even though they're technically different entries.
- **Legendary cooldowns** — tracked on a much longer timescale than the others, and tracked per student across sessions rather than reset each lesson. This is what makes the discovery curve in the animation spec real: a Legendary-tier animation's cooldown might reasonably be measured in weeks or months of usage, not minutes.
- **Idle cooldowns** — a global minimum gap enforced between *any* two idle-triggered animations, independent of category or specific identity. This is the mechanism that protects the "long stretches of true silence" principle — even if every per-animation and per-category cooldown were individually satisfied, the idle cooldown stops the engine from filling every available moment.

These layers stack: an animation must simultaneously be past its own cooldown, past its category's cooldown, and (if applicable) past its tier's cooldown, and the idle-wide cooldown must currently be satisfied if the trigger is idle. Any one of these failing removes the animation from the eligible pool for that cycle — it isn't queued or retried immediately, it simply waits for the next evaluation window.

---

## 8. Randomness Philosophy

Randomness in this engine is not a single dice roll bolted onto a decision — it needs to *feel* like the unpredictability of a small creature, which means several distinct qualities working together:

- **Apparent spontaneity** — the felt experience should be indistinguishable from true unpredictability, even though it's implemented with weights and rules under the hood. If a student (or a curious developer watching closely) can learn to anticipate the pattern, the feeling has already failed, regardless of how sophisticated the underlying logic is.
- **Burstiness** — activity should cluster unevenly rather than spreading out smoothly. Two small things happening close together, followed by a long gap, feels more alive than the same total amount of activity spread at even intervals.
- **Droughts** — long stretches with nothing happening at all are a desired, common outcome, not a gap the system should feel obligated to fill. A drought is success, not an edge case to patch.
- **Discovery** — the rarest tier should be governed by rarity operating on a timescale longer than any single session, so that "I've never seen that before" remains true even for long-time students, as described in the animation spec's discovery curve.
- **Rarity** — a tier label is a target feel, not a guarantee of a specific count. It's fine, and expected, for a "Rare" animation to sometimes go much longer than its nominal cooldown before appearing again — that variance is part of what keeps it feeling rare rather than mechanically scheduled.
- **Avoiding predictable intervals** — the Scheduler should never evaluate on a fixed period. The gap between one evaluation window and the next should itself be randomized within a wide range, so there's no clock a student (or an engineer debugging behaviour) could set a watch to.

Together, these qualities are what separate "an engine that occasionally does something" from "an engine that convincingly resembles a small creature waiting patiently nearby."

---

## 9. Animation Primitives

Primitives are the small, reusable vocabulary that every specific animation in the library should be composed from. They are described here purely as capabilities — what they *do*, conceptually — with no implementation detail, since how any of these get realized is a later, separate decision.

- **Translate** — repositioning PUPU, or part of him, in space.
- **Rotate** — turning PUPU, or part of him, around a point.
- **Scale** — making PUPU, or part of him, larger or smaller.
- **Squash** — compressing along one axis, the signature "soft body" deformation.
- **Stretch** — elongating along one axis, squash's natural counterpart.
- **Wobble** — an oscillating, settling motion, distinct from a single translate or rotate in that it implies a decaying back-and-forth rather than a single directed movement.
- **Blink** — a specific, reusable eye-state change, since eyes carry enough of PUPU's expressiveness to deserve their own primitive rather than being treated as generic scale/translate.
- **Tint** — a shift in colour or hue.
- **Opacity** — a change in transparency.
- **Glow** — a soft luminance effect around or through PUPU, distinct from tint in that it implies light rather than colour.
- **Particle emission** — small transient elements (bubbles, sparkles, droplets) released from or near PUPU.
- **Timing curves** — the shape of how any of the above unfolds over time (e.g. easing in gently, easing out slowly, a sharp snap followed by a slow settle). A primitive without a timing curve is incomplete — the same translate can feel entirely different depending on its curve.

This list should stay short. A new primitive should only be added when a genuinely new capability is needed that no combination of existing primitives can produce — not every time a new animation idea in the library wants something slightly different from what exists.

---

## 10. Animation Composition

No specific animation should be built as bespoke, one-off logic. Every entry in the animation library should be describable as a small recipe: a handful of primitives, each with its own timing curve, layered or sequenced together, plus a reference to whatever sound event markers it should emit.

This matters architecturally because it means the engine never needs to understand what "a yawn" or "a burp" *is* — it only needs to know how to play a sequence of primitives. All of the personality lives in the data (the recipe), not in the code.

**Conceptual examples** (recipes, not implementations):

- **Happy Wiggle** — a short wobble, layered with a small translate oscillation, on a quick ease-out curve.
- **Yawn** — a slow stretch, paired with a slow-closing blink, on a gentle ease-in-then-out curve, with a sound event marker placed at the midpoint.
- **Burp** — a very short squash, paired with a single small translate twitch, on a sharp-then-settle curve, with a sound event marker at the start.
- **Rainbow Shimmer** — a looped tint cycle, layered with a soft glow, on a slow, continuous easing curve, sustained for a longer duration than most other entries.
- **Sneeze** — a quick squash-and-release, paired with a small translate flinch and a blink, all compressed into a very short, sharp timing curve.

The point of showing these side by side is that a small, fixed set of primitives can produce animations that feel completely different from one another, purely through which primitives are combined and how their timing curves are shaped — which is what keeps the system simple even as the library grows.

---

## 11. Interaction with SoundManager

Animation and sound must cooperate closely in feel while remaining fully independent as systems. Neither should need to reach into the other's internals, and either should be replaceable without the other needing to change.

The mechanism for this is **event markers**: as an animation plays, the Animation Manager emits a small number of named moments (for instance, "animation started," "animation reached its key beat," "animation ended") that the SoundManager can listen for and respond to, entirely on its own terms. The Animation Manager does not call the SoundManager directly, does not know what sound (if any) is playing, and does not wait for sound to finish before proceeding with its own cleanup.

Rarity and cooldown decisions for a paired sound-and-animation moment should be made **once**, by whichever system owns the trigger, and communicated outward — not rolled independently by both systems. If animation and sound each independently decided "should this happen," they could drift out of sync (the animation playing without its sound, or vice versa), which would break the sense that they're one creature doing one thing, as noted in the animation spec.

This separation also means the SoundManager can evolve, be swapped, or go temporarily silent (e.g. muted by a student or teacher) without the Animation Manager needing to know or care — animations should always be visually complete and coherent on their own, with sound as an enhancement layered on top rather than a dependency.

---

## 12. Future Extensibility

The engine should be able to absorb new ideas — thought bubbles, photographs, seasonal events, new gross or curious behaviours, or ideas not yet imagined — as new **data**, not new **engine code**.

Concretely, this means:

- A new animation, however novel it looks, should be addable as a new Registry entry: a tier, a category, an eligible-states list, a cooldown, and a composition of existing (or, occasionally, one newly added) primitives. If adding an idea requires touching the Scheduler, the Cooldown Manager, or the Priority Resolver, that's a signal the idea doesn't fit the architecture yet — not a reason to special-case it.
- A genuinely new visual capability (say, something a photograph or thought-bubble idea needs that no existing primitive covers) should be added once, to the primitive layer in §9, and then become available to every future animation — not built as a one-off feature bolted directly onto a specific entry.
- A new *category* (say, "seasonal") should be addable as a label the Cooldown Manager and Priority Resolver already know how to treat generically, the same way they treat "gross" or "sleepy" today — categories should be data the engine reasons about generically, not special cases hardcoded into logic.
- Any future feature that starts to resemble progression, unlocking, or achievements should be treated with real caution before it's built at all — the personality spec is explicit that discovery should feel like chance, not a ladder to climb — but if such a feature were ever pursued, it should still route through the same Registry, Cooldown Manager, and Priority Resolver as everything else, rather than becoming a parallel system.

The test for whether the architecture is holding up over time is simple: adding animation #200 should feel exactly as easy as adding animation #88 did.

---

## 13. Anti-Patterns

These are architectural mistakes this design is specifically meant to prevent. If a future change resembles any of these, something has drifted from the intent of this document:

- **Animation-specific logic living in the engine** rather than as data in the Registry — a special `if` branch for one particular animation is a sign that something belongs in a Registry entry instead.
- **Bypassing the Cooldown Manager** for an animation considered "too important" to be rare — nothing is exempt; the moment an animation gets a shortcut around cooldowns, its rarity stops being real.
- **The Animation Manager and SoundManager calling directly into each other's internals** instead of communicating through event markers — this is the fastest way to make the two systems impossible to change independently.
- **Fixed-interval scheduling** anywhere in the Scheduler — a constant tick period reintroduces the "machine with a timer" feeling the entire system exists to avoid.
- **Multiple animations playing at once** without going through the Priority Resolver — even a rare overlap undermines the "one small thing at a time" premise.
- **Conflating session-level and lifetime-level rarity tracking** — treating a Legendary cooldown the same way as a Rare one (i.e., resetting it every session) quietly destroys the discovery curve the whole system is built to protect.
- **Treating the library's `Difficulty` and `Priority` fields as runtime concepts** — those are planning metadata for deciding what to build next; they have no meaning inside the running engine and shouldn't leak into eligibility or selection logic.
- **Building a parallel system for a new feature** (a separate scheduler for seasonal events, a separate cooldown tracker for a new category) instead of extending the existing generic mechanisms — this is the surest way to end up with two engines instead of one.

---

## 14. Implementation Roadmap

The recommended build order for the engine itself, before any individual animation from the library is implemented. Each stage is chosen so that it can be reasoned about and tested using only the stages before it.

1. **State Manager** — build first, since every other subsystem needs to know what state PUPU is in before it can decide anything.
2. **Animation Registry** — build next, even with an empty or placeholder catalogue, so that later subsystems have something real to query against from the start rather than being designed around a stub.
3. **Cooldown Manager** — needed before anything can safely be allowed to play more than once; building it early forces the per-animation/category/tier/idle distinctions to be settled up front rather than retrofitted later.
4. **Random Selector** — depends on the Cooldown Manager already existing to filter its input pool, and needs to exist before the Idle Controller can meaningfully decide "maybe now."
5. **Priority Resolver** — build before more than one controller exists, so conflict resolution is designed deliberately rather than patched in reactively once collisions start happening in practice.
6. **Reaction Controller** — build before the Idle Controller, since its rules are simpler (largely deterministic, direct triggers) and it exercises the State Manager, Registry, and Priority Resolver in their simplest form.
7. **Idle Controller** — build once the Reaction Controller has proven the simpler path works; this is where the full weight of cooldowns and randomness needs to come together correctly.
8. **Scheduler** — build once both controllers exist, since its job is to decide when to hand control to each of them, which only makes sense once there's something on the other end to hand control to.
9. **Animation Manager** — wire this last, once every subsystem below it exists and works independently; its entire job is orchestration, so it should be the final layer, not the first.
10. **SoundManager integration hooks** — add the event-marker contract once the Animation Manager is stable on its own, so animation behaviour can be verified visually before sound timing is layered on top.
11. **Primitive layer** — the primitives in §9 can be stubbed out conceptually throughout this process, but their real construction naturally happens as the first individual animations are built in the phase that follows this one — that work is deliberately out of scope for this document.

Only once this sequence is complete should work begin on any specific animation from `PUPU_ANIMATION_LIBRARY.md` — starting, as recommended there, with Belly Squish.
