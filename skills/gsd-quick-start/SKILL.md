---
name: "gsd-quick-start"
description: "Get from zero to your first GSD phase in minutes."
version: 1
created: "2026-08-19"
updated: "2026-08-19"
---

# GSD Quick Start

Get a project onto the GSD phase loop in three steps: install, init, first phase.

## 1. Install

Make sure pi and the GSD package are available:

```bash
pi install npm:gsd-core
```

Verify the extensions and skills are registered:

- `gsd-commands` extension
- `gsd-hooks` extension
- `gsd-phase-loop` skill family

## 2. Init the project

Pick the path that matches your project.

### Greenfield

If there is no `.planning/` directory yet, run:

```javascript
gsd_onboard({ repoPath: 'C:/Sources/my-project', outputPath: 'C:/Sources/my-project/.planning/codebase/MAPPING.md' })
```

Wait — for a truly new project you do not need a codebase map. Instead create the planning scaffold directly:

1. Create `.planning/`.
2. Write `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `CONVENTIONS.md`, `STATE.md`, `config.json`.

Use the templates in `skills/gsd-phase-loop/references/` if you need examples.

### Existing codebase

Run the onboard tool to produce `MAPPING.md`, then generate the scaffold from the map.

```javascript
gsd_onboard({ repoPath: 'C:/Sources/my-project', outputPath: 'C:/Sources/my-project/.planning/codebase/MAPPING.md' })
```

## 3. Start the first phase

Read `.planning/STATE.md` first. Then begin phase 01:

```javascript
gsd_state_advance({
  repoPath: 'C:/Sources/my-project',
  operation: 'begin-phase',
  phase: 1,
  phaseName: 'Foundation'
})
```

This sets `status: active`, `active_phase: 01`, and `next_action: discuss-phase`.

### Discuss

Run the `discuss-phase` skill or work directly with the user to capture locked decisions in:

```
.planning/phases/01-foundation/01-CONTEXT.md
```

Each decision gets an ID like `D-01-01`.

## Next step

Once `CONTEXT.md` exists, move to planning:

```javascript
gsd_next_action({ repoPath: 'C:/Sources/my-project' })
```

For the full canonical reference, open [gsd-phase-loop](../gsd-phase-loop/SKILL.md).
