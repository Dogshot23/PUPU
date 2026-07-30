Now let me check the character bible for any additional relevant context.I've now read through all the project documents thoroughly. Here's my proposal for the content classification system.

---

## 1. Purpose

This answers: *why does this speech bubble exist?*

The existing Content Creation Guide lists 17 content types (Conversation Missions, Thought Chains, Silly Thoughts, etc.). Those are good descriptions of *what form the content takes*, but they don't answer the deeper question of what the bubble is actually trying to do in the room. Two "Conversation Missions" might have completely different purposes — one gives the child something to say, another gives them something to think about first.

I'd propose a small set of purpose categories that sit *above* the content types, not replacing them:

**Spark** — gives the child something to say, ask, or do with the teacher. The child reads it and has an immediate next move. This is the workhorse purpose. Most of the content library should be Sparks because they directly serve the core product goal: shifting speaking agency to the child.

**Fuel** — gives the child something to think about, but doesn't hand them a specific action. The conversation happens because the thought is interesting enough that the child *wants* to talk about it. Facts, strange observations, thought chains, mysteries. The child has to do a small amount of their own work to turn this into conversation, which is what makes Fuel valuable — it builds the habit of initiating rather than following instructions.

**Colour** — exists purely to make PUPU feel alive. Jokes, emotions, tiny nonsense moments, "Hehe," sleeping sounds. These don't reliably produce conversation and they're not trying to. They're personality texture. Without Colour, PUPU would feel like a task dispenser. With too much of it, PUPU stops being useful in a lesson. This should be the smallest category — present enough to keep PUPU feeling like a creature, rare enough that the child still usually gets something they can use.

Three categories. That's it. Every bubble should fit cleanly into exactly one. If a piece of content seems to sit between Spark and Fuel, the test is simple: does the child know what to do next without having to figure it out themselves? If yes, it's a Spark. If they need to do some thinking first, it's Fuel.

**Why only three?** Because Purpose needs to be a fast, decisive classification. If you're hesitating between six options, the taxonomy is slowing you down rather than helping. Purpose should take two seconds to assign.

---

## 2. Teacher Involvement

This answers: *how much does this bubble need the teacher to work?*

This matters practically because lessons vary. Sometimes the teacher is very active. Sometimes the connection is bad and there's a lot of dead time. Sometimes a substitute teacher doesn't know PUPU at all. The engine should be able to lean toward content that matches the moment.

**Together** — the interaction specifically requires the teacher. "Ask your teacher…", "Challenge your teacher to…", "See if your teacher knows…". The content doesn't work if the teacher isn't engaged.

**Either** — the content works with or without the teacher. A mystery, a would-you-rather, a strange observation. The child might turn to the teacher, or might just enjoy it quietly. Both outcomes are fine.

**Solo** — the content is between PUPU and the child. A joke, a small emotion, a silly moment, a sound. The teacher doesn't need to be involved at all. This also covers the personality-texture moments that exist just to make PUPU feel alive.

**Why this matters for the engine:** If you ever build lesson-awareness (even something as simple as "the teacher seems quiet right now"), Teacher Involvement lets you bias the selection. Early on, even without that intelligence, it lets you ensure a session doesn't accidentally serve five "Together" bubbles in a row to a child whose teacher is struggling with audio.

---

## 3. Conversation Strength

This answers: *how reliably does this bubble produce actual talking?*

This is different from Purpose. A Spark with a direct instruction ("Ask your teacher one question about their childhood") almost guarantees conversation. A Spark with a game ("Describe an animal without saying its name") also guarantees conversation but requires more setup. A Fuel item might produce a great conversation or might just produce a quiet smile. Conversation Strength captures that reliability.

**Strong** — almost always produces conversation. The child has a clear thing to say or do, the teacher has a natural way to respond, and the exchange is likely to continue beyond a single turn. These are the most valuable items in the library for the core product goal.

**Medium** — usually produces some conversation, but it depends on the child and the moment. Would-you-rathers, opinions, mysteries. A confident child will run with these. A quieter child might need the teacher to pick it up.

**Gentle** — might produce conversation, might not, and that's fine. Observations, jokes, tiny stories, personality moments. The value isn't in the conversation they generate — it's in the warmth, surprise, or atmosphere they create.

Three levels again. Conversation Strength is a prediction about what will happen in the room, not a quality judgment. A "Gentle" joke that makes a child laugh is doing its job perfectly — it just isn't primarily a conversation tool.

---

## 4. A Better Name Than "Secret Weapon Score"

The idea behind "Secret Weapon Score" is good: how much does this bubble make the child feel empowered, like PUPU is giving them something powerful to use? But the name feels like it belongs to a gamification system, which cuts against everything in the MVP Scope about avoiding achievement mechanics.

I'd suggest: **Confidence Boost**.

It captures the same idea — does this content make the child feel braver, more interesting, more capable in the conversation? — without implying a points system or a weapon metaphor. It also maps naturally to what you're actually observing in the classroom: did the child sit up a little straighter after reading this?

Scale: **None / Low / High**.

**None** — personality texture, jokes, emotions. Not trying to boost confidence. Just being PUPU.

**Low** — gives the child something mildly interesting to contribute, but doesn't fundamentally change the power dynamic. A fact, a small observation, a gentle question.

**High** — makes the child feel like they have something genuinely powerful to bring to the conversation. A challenge for the teacher, a game to run, a mystery to pose, a debate to start. The child becomes the one with the interesting thing, and the teacher becomes the one who has to respond. This is the "secret superpower" feeling.

Three levels is enough. The distinction you actually care about is: does this content change who's driving the conversation? If it puts the child in the driver's seat, it's High. If it gives them a small passenger-seat contribution, it's Low. If it's not trying to do that at all, it's None.

---

## 5. Audience

This answers: *who is this bubble primarily aimed at?*

**Child** — the content speaks to the child. This is the vast majority of the library.

**Shared** — the content is designed to create a moment between the child and the teacher together. Neither person is the sole audience. "Would you rather" questions, debates, challenges that both people engage with.

**Teacher-via-child** — PUPU says something about the teacher, or gives the child something specifically aimed at the teacher. "I bet your teacher can't…", "Ask your teacher when they last…". The child is still the reader, but the content's energy is directed at the teacher through the child.

Three categories. I considered adding "PUPU-to-self" for moments where PUPU is just talking to himself ("Hehe", "I forgot", "Zzz…") but those are still aimed at the child — the child is the one who sees them and smiles. The audience is always ultimately the child; this field captures where the content's conversational energy is *directed*.

---

## 6. Topics

Topics should be flat tags, not a hierarchy. A bubble can have one or more. The list should grow organically as content is created, but here's a starter set drawn from the existing 137 bubbles:

**animals, food, school, family, friends, dreams, space, weather, time, body, nature, feelings, imagination, memory, language, music, science, home, games, nonsense**

A few principles for topic tags:

Topics describe *what the content is about*, not what form it takes. "riddle" is not a topic — that's a content type. "animals" is a topic.

Keep topics broad. "dogs" and "cats" and "fish" should all just be "animals" unless the library grows large enough that the distinction matters for selection. You can always split later; you can't easily merge.

Every bubble should have at least one topic. Most will have one or two. If a bubble needs more than three topic tags, it's probably doing too much.

**Why topics matter for the engine:** They're the simplest way to avoid repetition that *feels* like repetition. Two completely different content types about animals back-to-back will feel more repetitive than two similar structures about different topics. The engine should be able to say "we just did an animals bubble, let's avoid animals for the next few."

---

## 7. Additional Fields

I considered several additional fields and rejected most of them. Here's what I'd keep and what I'd drop.

### Keep

**Energy** — how much activity does this content ask of the child?

**Calm** — read and enjoy quietly. Low demand.
**Active** — requires the child to do something: speak, act, perform, decide.
**Performative** — requires the child to really put themselves out there: act something out, use a funny voice, run a game.

This matters because lesson energy isn't constant. Early in a lesson, a child might be shy and warming up. Mid-lesson they're engaged. Late in a lesson they might be tired. The engine should be able to match content energy to the moment, even roughly.

**Content Type** — keep the existing content types from the Content Creation Guide (Conversation Mission, Thought Chain, Silly Thought, Curious Question, etc.) as a separate field. They describe *form*, not purpose, and they're useful for ensuring variety. The engine should avoid serving three Thought Chains in a row, regardless of whether they have different topics and purposes.

**Emotion** — keep the existing emotion field (curious, playful, sleepy, proud, mischievous, etc.) since it maps to PUPU's animation state and helps the engine coordinate between content and character behaviour.

### Drop

**Difficulty** — I considered a linguistic difficulty rating but dropped it. The entire library targets B1. If PUPU ever supports multiple levels, difficulty becomes a level filter, not a within-level gradient. Adding it now would be premature complexity.

**Season/Calendar** — explicitly excluded by the MVP Scope, and even long-term it's a content *tag* at most, not a system field.

**Sequence/Follow-up** — I considered whether bubbles should be able to chain (bubble A leads to bubble B). I'd strongly recommend against this. It turns PUPU into a conversation tree, which is the opposite of what he should be. Every bubble should stand alone. The conversation that follows is between the child and the teacher, not between the child and PUPU.

**Duration/Reading Time** — the Content Creation Guide already sets a 10–25 second reading-time rule. Enforcing this as a field on every bubble adds classification overhead without helping the engine make better selections. If a bubble is too long, the fix is to edit it, not to tag it.

---

## Summary: The Full Field Set

For each speech bubble in the library:

| Field | Values | Purpose |
|---|---|---|
| **ID** | unique identifier | existing field, unchanged |
| **Content Type** | from existing list | *what form* the content takes |
| **Purpose** | Spark / Fuel / Colour | *why* this bubble exists |
| **Teacher Involvement** | Together / Either / Solo | how much the teacher needs to participate |
| **Conversation Strength** | Strong / Medium / Gentle | how reliably this produces actual talking |
| **Confidence Boost** | None / Low / High | how much this empowers the child |
| **Audience** | Child / Shared / Teacher-via-child | where the conversational energy is directed |
| **Energy** | Calm / Active / Performative | how much activity is asked of the child |
| **Emotion** | from existing list | PUPU's emotional state, for animation coordination |
| **Topics** | 1–3 tags from growing list | what the content is about |
| **English** | text | existing field |
| **Korean** | text | existing field |

That's 10 classification fields (excluding the text content itself). Of those, seven are three-value scales or small fixed lists, two are short tag lists, and one is free text (the ID). A new piece of content should be classifiable in under a minute once someone is familiar with the system.

The fields divide into two groups by function. Purpose, Conversation Strength, Confidence Boost, and Energy help the engine decide *what to serve when*. Content Type, Topics, Audience, and Teacher Involvement help the engine avoid *repetition that feels like repetition*. Emotion bridges content and animation. Together they give the engine enough to make good selections without being so granular that classification becomes a bottleneck.