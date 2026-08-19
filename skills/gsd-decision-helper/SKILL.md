---
name: "gsd-decision-helper"
description: "State-to-action lookup for GSD: decide what to do next and which agent to call."
version: 1
created: "2026-08-19"
updated: "2026-08-19"
---

# GSD Decision Helper

Use this skill when you are unsure what to do next. Read `.planning/STATE.md` first, then look up the current `status` below.

## Fast lookup

| `status` | `next_action` | What to do now | Which agent / tool |
| ---------- | --------------- | ---------------- | -------------------- |
| `initializing` | `discuss-phase` | Start phase 01 discussion | `discuss-phase` skill |
| `idle` | `begin-phase` | Begin the next queued phase | `gsd_state_advance({ operation: 'begin-phase' })` |
| `idle` | `milestone-complete` | Wrap up the milestone | `gsd-milestone-complete` agent |
| `active` | `discuss-phase` | Capture decisions in `CONTEXT.md` | `discuss-phase` skill |
| `active` | `plan-phase` | Research, then write `PLAN.md` | `gsd_research` → `gsd_plan` |
| `active` | `execute-phase` | Execute the current plan | `gsd_execute` |
| `executing` | `execute-phase` | Continue execution | `gsd_execute` |
| `executing` | `complete-plan` | Mark plan done, pick next | `gsd_state_advance({ operation: 'complete-plan' })` |
| `paused` | `resume` | Resume the active phase | `gsd_state_update({ field: 'status', value: 'active' })` |
| `paused` | `abandon` | Drop the phase and return to idle | `gsd_state_advance({ operation: 'complete-phase' })` |

## Examples

### Example 1: Project just initialized

```yaml
status: initializing
active_phase: null
next_action: discuss-phase
```

Action: run `discuss-phase` for phase 01.

### Example 2: Phase active, planning needed

```yaml
status: active
active_phase: "03"
next_action: plan-phase
```

Action: spawn `gsd-phase-researcher`, then `gsd-planner`.

### Example 3: Executing a plan

```yaml
status: executing
active_phase: "03"
current_plan: "03-01"
next_action: execute-phase
```

Action: run `gsd_execute` with the plan path.

## When to call a subagent

- Research, plan, execute, verify, security audit, architecture review → subagent with `context: 'fresh'`.
- State updates, backlog triage, workstream switches → host-side tools in the orchestrator turn.

## Reference

- Full FSM: [`docs/STATE-FSM.md`](../../docs/STATE-FSM.md)
- Canonical skill: [gsd-phase-loop](../gsd-phase-loop/SKILL.md)
- Quick start: [gsd-quick-start](../gsd-quick-start/SKILL.md)
- Suggest-only lookup: `gsd_next_action({ repoPath })`
