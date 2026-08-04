# FACT-0001 — Stage 1–5 Review

Produced by running `factory/prompts/conversation-card-generator.md` against `factory/raw-content/facts-pilot.md` (FACT-0001 only). This is the Factory's audit trail up to and including Stage 5 (Metadata Assignment) — it stops before the final rendered Conversation Card (§5.1 output), per instruction.

**Source:** FACT-0001 — Type: Fact, CEFR: A2, Tags: Food, History
**Content:** "Bubble wrap was originally invented to be wallpaper."

**Intake gate:** ID unique (FACT-0001), Type = Fact, CEFR = A2 (parseable, single-level, floor not above ceiling), Tags present (Food, History), Content present and non-empty. Passes.

---

## Stage 1 — Feasibility Assessment

**Character compatibility:** pass
> Bubble wrap is physical and tactile — a small, concrete, touchable thing, not an abstract or technical idea. It belongs squarely in PUPU's natural world of small physical observations rather than requiring any stretch to fit his character.

**Conversational potential:** pass
> The historical trivia resolves itself too neatly on its own ("used to be wallpaper, now it's packaging" — nothing left to ask). The genuine open edge is not the history but the personal question underneath it: whether the child pops bubble wrap too. That edge exists, but it has to be found — it isn't handed over by the fact itself.

**Engine plausibility:** pass
> Share works without any stretch — PUPU can react personally and open the same question to the child. Guess is a weaker fit: "wallpaper" isn't reachable through logic, clues, or lateral thinking, so turning it into a guessing game would produce arbitrary trivia-guessing rather than a satisfying deduction. Imagine is plausible as a secondary option (imagining a room wallpapered in bubble wrap) but is less personal than Share.

**Plausible engines:** Share (primary), Imagine (secondary, weaker)
**Conversational opening:** The child's own relationship to popping bubble wrap — would they pop it or leave it as wallpaper.
**Notes:** The emotional/comic core here is physical impulse (the urge to pop), not the historical fact itself, which is closer to inert trivia.

**Decision: go.**

---

## Stage 2 — Engine Selection

**Engine:** Share

**Rationale:** The idea's real pull is the shared, physical urge to pop bubble wrap, not the arbitrary historical fact — PUPU admitting what he'd do first is the least forced way to hand the child something low-risk to agree or disagree with.

**Engine distribution note:** Not consulted. No cards are Approved yet, so no compiled library exists to weigh engine balance against (per §4 Stage 2 of the prompt, this consideration has nothing to read).

---

## Stage 3 — Voice and Writing

**Must survive:** Bubble wrap was originally invented to be wallpaper.

**PUPU's angle:** PUPU doesn't marvel at the historical trivia itself — he gets distracted by the mismatch between "wallpaper" (something you're meant to look at and leave alone) and what bubble wrap actually invites (something you destroy). The angle is the swerve from admiration to impulse.

**Beats (English draft):**
1. Bubble wrap used to be wallpaper.
2. Imagine a whole wall of it.
3. I wouldn't look at it, though.
4. I'd just pop the whole thing.

**Pre-Stage-4 check (Factory §6):** Read alone, beat one reconstructs the source fact intact and accurately. Beats two through four contain no factual claim beyond the source — they are PUPU's own imagined reaction and stated impulse, not assertions of fact, so no hallucination risk. Four beats, within the 3–5 norm. Last beat ends on impulse rather than resolution — it doesn't answer a question or close the idea, it leaves the child something to agree with or contest.

---

## Stage 4 — Quality Review

**Character fidelity:** pass
> Apply the PUPU Filter — could another mascot have said this unchanged? A generic mascot stays with the trivia and marvels at it ("Wow, wallpaper — who knew!"). PUPU's specific swerve to "I'd just pop it" — abandoning the fact mid-thought for his own destructive impulse — is the distinguishing, non-generic move.

**Idea preservation:** pass
> The fact is present, intact, and unaltered in beat one. Nothing about the underlying claim has been changed, softened, or embellished.

**Conversational value:** pass
> After the last beat, something is genuinely unresolved — PUPU has gone first with an admission (he'd pop it), which lowers the risk for the child to admit the same or push back and defend the wallpaper. Either response is a real thing said, not a shrug.

**Language quality:** pass
> Short spoken beats, natural contractions ("wouldn't," "I'd"), entirely common concrete vocabulary (bubble wrap, wallpaper, imagine, wall, pop). Comfortably within A2, reads aloud without any stumbling point.

**Press Again Test:** pass
> The card is small, physical, funny, and over quickly — the kind of thing a child grins at and presses again for, not something that asks to be taken seriously.

**Statement:** The fact survives intact in the first beat; PUPU's specific, physical urge to pop rather than admire is what makes the card his and not generic trivia, and it hands the child a low-risk thing to agree or disagree with.

**All four standards plus the Press Again Test pass. No return to Stage 3 required.**

---

## Stage 5 — Metadata Assignment

**Level:** A2 — falls within the source's CEFR range (A2, single-level), and matches the language actually written (simple vocabulary, short clauses, natural contractions).

**Emotion:** mischievous — the writing implies a naughty physical impulse (wanting to pop rather than admire), not curiosity or wonder. Chosen because the words already carry this tone, not to add variety.

**Animation hint:** none — nothing in the catalogue is confidently more than PUPU's ordinary behaviour here. This matches the calibration set by the worked example (`factory/out/CARD-0001.md`), where "thoughtful" content with a clear emotional beat still carried no hint. Most cards should carry none, and this one doesn't earn an exception.

**Conversation goal:** Invite the child to admit whether they'd pop it too. (One honest sentence, written after the draft, describing what the card actually does.)

**Presentation style:** default — the only presentation style confirmed to exist (§7 of the prompt).

**Topic tags:** History only. Source tags are Food, History; Food doesn't describe what this finished card is about (it's not about food at all), so it's dropped. History is kept because the card's opening beat is explicitly a historical framing ("used to be wallpaper"). Tags may be fewer than the source carried, never invented beyond it (Card Spec §9.2).

**Lifecycle state:** Generated. No ID assigned. No Korean text attached.

---

Stops here, as instructed. The final rendered Conversation Card (§5.1 output) has not been produced.
