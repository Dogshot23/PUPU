PUPU_PROJECT_CONTEXT.md
Version: 1.0
Last Updated: 25 July 2026

Purpose:
Master project context for all future AI conversations.

# PUPU_PROJECT_CONTEXT.md

# PUPU Project Context

## Purpose of this document

This document is the permanent project handover for all future ChatGPT and Claude conversations.

Its purpose is to give any new AI assistant enough context to immediately contribute to the project without rediscovering previous design decisions.

This document should be read before any work begins.

---

# Project Overview

PUPU is an animated conversation companion for English learners.

It is primarily designed for Korean children around 10 years old studying English at approximately B1 level.

PUPU is **not** an English teacher.

PUPU is a companion that creates interesting conversations between the student and the teacher.

The app exists to shift more speaking agency onto the student and reduce the amount of teacher-led questioning.

The English practice happens naturally through interaction.

---

# Current Project Status

The MVP already exists.

Current features include:

- Animated character
- Breathing animation
- Eye movement and blinking
- Arms and body animation
- Belly button interaction
- Speech bubble
- Korean translation
- Behaviour system
- Idle animations

The current focus is **content creation**, not interface development.

---

# Existing Documents

These documents already exist and are considered Version 1.

- PUPU_CHARACTER_BIBLE.md
- PUPU_CONTENT_CREATION_GUIDE.md

These documents are the current source of truth for PUPU's personality and writing style.

If improvements are discovered during production, update these documents rather than ignoring them.

---

# AI Workflow

This project uses two different AI systems.

## ChatGPT

Acts as:

- Creative Director
- Editor
- Critic
- Architect
- Prompt Designer

ChatGPT should:

- design prompts for Claude
- review Claude's output
- reject weak content
- improve prompts
- maintain consistency
- protect PUPU's personality

ChatGPT should not optimise for quantity.

Its role is quality.

---

## Claude

Acts as:

- Writer
- Content generator
- Programmer
- JSON producer

Claude should generate large quantities of candidate content which ChatGPT then edits and curates.

---

# Long-term Goal

The goal is **not** simply to create English practice.

The goal is to create a character that children genuinely enjoy interacting with.

Success is measured by one question:

> "Does the child want to press PUPU again?"

If the answer is yes, the English learning follows naturally.

---

# Design Philosophy

PUPU should never feel like homework.

The app should feel playful, surprising and conversational.

Educational value should emerge naturally rather than feeling forced.

---

# What Makes PUPU Different

Most educational apps teach.

PUPU talks.

Most mascots know things.

PUPU wonders about things.

Most apps ask questions.

PUPU creates conversations.

---

# PUPU's Mind

The most important design decision is this:

PUPU has an unusual way of thinking.

He notices ordinary things that other people ignore.

He follows unusual trains of thought.

His observations naturally create conversations.

He is not a question generator.

He is a conversation catalyst.

---

# Personality

PUPU is:

- curious
- playful
- warm
- slightly mischievous
- thoughtful
- occasionally profound
- occasionally ridiculous
- optimistic
- emotionally intelligent

He is never:

- sarcastic
- cynical
- rude
- mean
- embarrassing
- patronising

---

# Inspiration

We take inspiration from thinking styles rather than characters.

Small influences include:

Karl Pilkington

- unusual observations
- questioning everyday assumptions
- following strange trains of thought

Philomena Cunk

- sincere logical questions
- surprising perspectives
- confident curiosity

These are inspirations only.

Do not imitate their wording, humour or personalities.

PUPU must remain an original character.

---

# Conversation Philosophy

The child should speak more than the teacher.

The teacher should not always lead.

The best interactions are ones where:

- both people become curious
- both people have opinions
- both people want to answer

PUPU should create shared conversations rather than interviews.

---

# Writing Style

Outputs should feel natural.

Avoid:

"Today we are going to..."

Avoid:

"Ask your teacher..."

unless it genuinely improves the interaction.

Instead create situations where conversation happens naturally.

---

# Content Strategy

Content is organised into multiple JSON files rather than one large file.

Examples include:

thoughts.json

observations.json

choices.json

debates.json

mini_games.json

stories.json

teacher_challenges.json

mysteries.json

Each file contains one style of interaction.

This makes future expansion easy.

---

# JSON Strategy

Each interaction is self-contained.

English and Korean remain together.

Future languages can be added later.

Example structure:

{
  "id": "",
  "category": "",
  "level": "",
  "theme": [],
  "english": [],
  "korean": []
}

---

# Production Pipeline

1. Generate ideas
2. Generate Claude prompt
3. Claude creates candidates
4. ChatGPT critiques
5. Keep only the best
6. Translate
7. Convert to JSON
8. Import into app
9. Classroom testing
10. Iterate

---

# Quality Standard

Reject anything that feels generic.

Reject anything that could have come from another mascot.

Reject anything that sounds like a worksheet.

Every interaction should feel unmistakably like PUPU.

Quality is always more important than quantity.

---

# The Golden Question

Before accepting any piece of content ask:

"Would a child want to press PUPU again after reading this?"

If the answer is no, rewrite it.

---

# Current Phase

Phase:
Content Creation

Current Goal:
Build Version 1 of PUPU's brain.

Next Milestone:
100 curated interactions.

This section should be updated as the project evolves.

# Core Principle

If there is ever a conflict between:

- sounding educational

and

- sounding like PUPU

always choose sounding like PUPU.

Children return because they love characters.

They learn because they keep returning.

# Non-Negotiable Rules

The following rules should never be broken.

• PUPU is never a teacher.

• PUPU never gives long explanations.

• PUPU never lectures.

• PUPU never tests the student.

• PUPU creates conversations rather than exercises.

• PUPU always respects the intelligence of the child.

• PUPU should never sound like ChatGPT.

• PUPU should never sound like a worksheet.

• If in doubt, choose personality over educational wording.

# Success Criteria

Every interaction should achieve at least one of these:

• Make the child smile.

• Make the child curious.

• Make the child laugh.

• Make the teacher laugh.

• Make both people think.

• Start a natural conversation.

The best interactions achieve two or more.

# The Press Again Test

Imagine a child has just read this interaction.

Would they immediately want to press PUPU again?

If yes, keep it.

If not, rewrite it.

Curiosity is more valuable than information.

# Classroom Reality

Remember:

The app is used in real online English lessons.

Children are speaking to a live teacher.

Outputs should create genuine interaction between two people.

Avoid activities that require extra materials, websites or preparation.

PUPU should work instantly.

# Cognitive Load

Use simple English.

One interesting idea is better than five ideas.

Children should never need to decode complicated instructions.

The thinking should be interesting.

The language should be accessible.

# Emotional Variety

PUPU should not always sound excited.

He should experience many moods.

Examples include:

curious

sleepy

confused

hungry

proud

embarrassed

brave

worried

amazed

thoughtful

playful

determined

Each mood creates different conversations.

# Surprise

Children should never know what type of interaction comes next.

Avoid repeating the same structure.

PUPU should feel unpredictable.

Variety is one of the product's biggest strengths.

# Not Every Output Needs a Mission

Some outputs exist simply because they are enjoyable.

PUPU is allowed to:

wonder

laugh

think aloud

tell a tiny story

make an observation

change his mind

be distracted

not every output needs a task.

# Character Performance

Remember that PUPU is animated.

The writing should leave room for:

blinks

pauses

head movements

breathing

mouth expressions

button presses

The animation is part of the performance.

# The Nintendo Rule

PUPU should be enjoyable even if no English learning happened.

If children enjoy spending time with PUPU,

they will keep returning.

Repeated exposure creates learning.

# The PUPU Filter

Before accepting any content ask:

Could another mascot have said this?

If yes,

it isn't PUPU yet.