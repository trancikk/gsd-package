---
description: Interactive new-project setup for GSD. Asks deep questions and scaffolds .planning/ + AGENTS.md.
argument-hint: "[project-name]"
---

Start a new GSD project with upstream-style deep questioning.

Run the parent-turn skill and follow its instructions:

```text
/skill:init-project $1
```

This will:

1. Ask "What do you want to build?" and follow threads until the scope is clear.
2. Optionally call `gsd_research_project` to produce `.planning/research/RESEARCH.md`.
3. Call `gsd_scaffold` to create `.planning/` (`PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `CONVENTIONS.md`, `BACKLOG.md`, `WORKSTREAMS.md`, `config.json`) and root `AGENTS.md`.
4. Populate the scaffolded files from the answers and research.
5. Show the recommended next action.

Use forward slashes in paths. If a `.planning/` scaffold already exists, the skill will warn you instead of overwriting.
