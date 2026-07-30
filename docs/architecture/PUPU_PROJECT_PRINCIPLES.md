# PUPU

## Overview

PUPU is a tiny installable Progressive Web App (PWA).

It is **not** an AI.

It is **not** a chatbot.

It is **not** a lesson platform.

PUPU is a tiny digital companion for children learning English.

The initial audience is Korean children aged approximately 10–12 who have online English conversation lessons.

---

# Core Philosophy

Children spend most lessons answering questions.

PUPU gives children more agency by helping them initiate conversations with their teacher.

PUPU encourages children to:

* ask questions
* challenge the teacher
* tell jokes
* teach the teacher
* give riddles
* create funny moments

The goal is confidence and agency, not grammar practice.

---

# Product Philosophy

PUPU is the product.

The missions are secondary.

Children should enjoy spending a few seconds with PUPU.

Every interaction should feel magical.

---

# Design Philosophy

If a feature does not make pressing the button more magical, don't build it.

Keep everything simple.

Remove unnecessary UI.

One creature.

One button.

One interaction.

---

# MVP Principles

The MVP should be buildable in one weekend.

No backend.

No login.

No database.

No AI.

Static files only.

---

# Technology

* HTML
* CSS
* Vanilla JavaScript

Current architecture:

* index.html
* style.css
* script.js
* brain.js
* behaviors.js
* missions.js

Later:

* manifest.json
* service-worker.js

---

# Current Interaction Flow

Idle

↓

Child presses "Surprise Me"

↓

Optional special event

↓

Thinking state

↓

Random behaviour selected

↓

Random mission selected

↓

Speech bubble appears

↓

Mission revealed with typewriter effect

↓

Return to idle

---

# Creature Behaviour

PUPU should feel alive.

Examples include:

* breathing
* blinking
* laughing
* sneezing
* sleeping
* getting distracted
* becoming excited

Children should wonder:

"I wonder what PUPU will do this time."

---

# Coding Principles

Do not redesign the project.

Prefer small incremental improvements.

Avoid rewriting working code.

Keep modules separate.

Comment JavaScript clearly.

Keep code readable.

Avoid unnecessary dependencies.

Use only:

* HTML
* CSS
* Vanilla JavaScript

---

# Data Architecture

Random decisions belong in:

brain.js

Behaviour data belongs in:

behaviors.js

Mission data belongs in:

missions.js

script.js should mainly coordinate the interaction.

---

# Localisation

Prepare all text for multiple languages.

Use this structure:

{
id: "...",
en: "...",
ko: "..."
}

Do not hardcode English strings inside the application logic.

---

# Important Rule

PUPU should always feel like a tiny living creature.

Never let it feel like a prompt generator with a mascot.


# Character Design

PUPU's visual design is final.

Do not redesign the character.

Do not invent new facial features.

Do not replace the artwork with HTML/CSS shapes.

All future animation work should preserve the existing artwork and animate it using CSS transforms, layered assets, or sprite techniques.