---
name: "gsd-phase-loop"
description: "Full reference for the GSD phase-loop workflow: artifacts, agents, and transitions."
version: 7
created: "2026-08-10"
updated: "2026-08-19"
---

# GSD Phase Loop — Full Reference

Spec-driven development workflow for pi. Use this skill when you need the canonical explanation of artifacts, agents, and the phase loop.

**Quick paths:**

- [gsd-quick-start](../gsd-quick-start/SKILL.md) — zero-to-first-phase in minutes.
- [gsd-decision-helper](../gsd-decision-helper/SKILL.md) — "What do I do now?" lookup.
- [references/](./references/) — reusable reference fragments.

## The loop

```
Init → Discuss → Plan → Execute → Verify → Ship → (repeat)
```

Each phase produces a consistent set of artifacts under `.planning/`.

## Artifact index

| Artifact | Purpose | Produced in |
| ---------- | --------- | ------------- |
| `.planning/PROJECT.md` | Identity, core value, constraints | Init |
| `.planning/ROADMAP.md` | Milestones and phases | Init |
| `.planning/REQUIREMENTS.md` | Numbered acceptance criteria | Init |
| `.planning/STATE.md` | Living position tracker; read first every session | All |
| `.planning/BACKLOG.md` | Pending ideas and tech debt | All |
| `.planning/WORKSTREAMS.md` | Parallel feature branches | All |
| `.planning/CONVENTIONS.md` | Project workflow conventions | Init |
| `.planning/phases/<NN>-<slug>/<NN>-CONTEXT.md` | Locked decisions | Discuss |
| `.planning/phases/<NN>-<slug>/<NN>-RESEARCH.md` | Research findings | Plan |
| `.planning/phases/<NN>-<slug>/<NN>-VALIDATION.md` | Optional plan validation | Plan |
| `.planning/phases/<NN>-<slug>/<NN>-<PP>-PLAN.md` | Executable plan | Plan |
| `.planning/phases/<NN>-<slug>/<NN>-<PP>-SUMMARY.md` | Execution record | Execute |
| `.planning/phases/<NN>-<slug>/<NN>-VERIFICATION.md` | Verification report | Verify |

See [references/artifact-index.md](./references/artifact-index.md) for the complete directory layout.

## Core agents

| Role | Agent | Output |
| ------ | ------- | -------- |
| Researcher | `gsd-phase-researcher` | `RESEARCH.md`, `MAPPING.md` |
| Planner | `gsd-planner` | `PLAN.md` |
| Executor | `gsd-executor` | code changes + `SUMMARY.md` |
| Verifier | `gsd-verifier` | `VERIFICATION.md` |
| Plan Checker | `gsd-plan-checker` | `VALIDATION.md` |

Invoke them via the `gsd-commands` extension tools (`gsd_research`, `gsd_plan`, `gsd_execute`, `gsd_verify`) or directly with `subagent({ workflowScript: ... })`.

## Phase transitions

The canonical state machine lives in [`docs/STATE-FSM.md`](../../docs/STATE-FSM.md). Key statuses:

- `initializing` → `discuss-phase`
- `active` → `discuss-phase` / `plan-phase`
- `executing` → `execute-phase` / `complete-plan`
- `idle` → `begin-phase` / `milestone-complete`
- `paused` → `resume` / `abandon`

Use `gsd_next_action({ repoPath })` for a suggest-only lookup of valid actions and missing prerequisites.

## Wave-based execution

Plans within a phase may depend on each other. Group them into waves:

- Wave 1: plans with no `depends_on`
- Wave 2: plans depending only on Wave 1
- etc.

Run each wave in parallel with `runs.all([...])`; never run dependent plans in parallel.

## Context isolation rules

1. Start every subagent with `context: 'fresh'`.
2. Pass only the artifacts the subagent needs.
3. Never dump the full orchestrator conversation into a subagent.
4. Read `STATE.md` first; update it after significant actions.

## Showing next actions to the user

After any orchestrator-level state change, use `gsd_next_action({ repoPath })` to show the user the deterministic FSM output:

```javascript
gsd_next_action({ repoPath: "." })
```

Display `recommended_action`, `valid_actions`, and any `missing_prerequisites`. This keeps the user informed without mutating `STATE.md`.

## Commit conventions

Follow Conventional Commits: `<type>(<scope>): <subject>`.

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Further reading

- [Transition table](./references/transition-table.md)
- [Tool matrix](./references/tool-matrix.md)
- [gsd-quick-start](../gsd-quick-start/SKILL.md)
- [gsd-decision-helper](../gsd-decision-helper/SKILL.md)
- [STATE FSM](../../docs/STATE-FSM.md)
