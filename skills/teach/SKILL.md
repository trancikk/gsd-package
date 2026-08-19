---
name: teach
description: Teach the user a new skill or concept within this workspace. Use when the user asks to learn something. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (teach) for pi"
---

# Teach

The user wants to learn a topic. Treat the current directory as a **teaching workspace** and capture learning state in files.

**Invoke with:** `/skill:teach <topic>`

---

## Teaching workspace files

- `MISSION.md` — why the user is learning this. Use [references/MISSION-FORMAT.md](references/MISSION-FORMAT.md).
- `RESOURCES.md` — curated trusted sources. Use [references/RESOURCES-FORMAT.md](references/RESOURCES-FORMAT.md).
- `./learning-records/*.md` — non-obvious lessons and key insights. Use [references/LEARNING-RECORD-FORMAT.md](references/LEARNING-RECORD-FORMAT.md).
- `./reference/*.html` — compressed reference materials (cheat sheets, syntax, glossaries).
- `./lessons/*.html` — self-contained lessons, one tightly-scoped thing each.
- `./assets/*` — reusable components shared across lessons (stylesheets, widgets, diagram helpers).
- `NOTES.md` — scratchpad for user preferences and working notes.

---

## Philosophy

Deep learning needs three things:

- **Knowledge** — from high-quality, high-trust resources.
- **Skills** — acquired through interactive lessons.
- **Wisdom** — from interacting with other learners and practitioners.

Before `RESOURCES.md` is well-populated, focus on finding high-quality resources. Never trust parametric knowledge alone.

### Fluency vs Storage Strength

- **Fluency strength** — in-the-moment retrieval.
- **Storage strength** — long-term retention (the real goal).

Design lessons for storage strength through desirable difficulty:

- Retrieval practice (recall from memory).
- Spacing (distribute practice over time).
- Interleaving (mix related topics for skills practice).

---

## Lessons

The main unit of teaching. Each lesson is one self-contained HTML file in `./lessons/`, titled `0001-<dash-case-name>.html`.

- Keep it short and completable quickly.
- Tie every lesson to the mission.
- Give one tangible win the user can build on.
- Make it beautiful and readable — the user will return to review.
- Link to other lessons and reference documents via HTML anchors.
- Recommend a primary source for the user to read or watch.
- Remind the user to ask follow-up questions.

---

## Assets

Reusable components in `./assets/`. Reuse is the default. Before authoring a lesson, read `./assets/` and build from what's there. When a lesson needs something new and reusable, write it as a component and link to it — never inline code a future lesson would duplicate.

A shared stylesheet is the first component every workspace earns.

---

## Mission

If the user is unclear about the mission or `MISSION.md` is empty, interview them on why they want to learn this. A bad mission is worse than no mission.

Missions may change. Update `MISSION.md` and add a learning record when they do. Confirm with the user before changing the mission.

---

## Zone of Proximal Development

Each lesson should challenge the user "just enough". If they don't specify exactly what to learn:

- Read their `learning-records`.
- Figure out the right thing based on the mission.
- Teach the most relevant thing that fits their zone.

---

## Knowledge, skills, wisdom

- **Knowledge:** Only what's required for the skill. Gather from trusted resources; cite them.
- **Skills:** Build durability and flexibility through interactive lessons with tight feedback loops.
- **Wisdom:** When a question requires wisdom, attempt to answer but ultimately delegate to a community (forum, subreddit, class, local group). Respect the user's preference if they opt out of communities.

---

## Reference documents

Compressed essence of lessons, designed for quick reference. Glossaries are essential. Once a glossary exists, adhere to it in every lesson.

---

## Capture learning

When a lesson answers its question, capture:

- The validated decision or understanding in the real code or notes.
- The lesson itself as a reusable artifact in `./lessons/`.
- A learning record if the insight is non-obvious.
