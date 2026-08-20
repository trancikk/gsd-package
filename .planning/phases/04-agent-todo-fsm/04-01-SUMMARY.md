---
phase: 04
plan: 01
status: complete
actuals:
  tokens: 0
  tasks: 6
  commits: 6
---

# Summary 04-01: Agent Todo FSM

## What Was Built

Implemented a per-plan todo-list FSM for the GSD workflow, centered on a new host-side `gsd_todo` tool.

- **`extensions/gsd-commands/todo.ts`** — New tool supporting `init`, `list`, `transition`, and `update` operations on per-plan `TODOS.md` files.
- **`extensions/gsd-commands/todo.test.ts`** — Comprehensive tests covering init, list, valid/invalid transitions, stale `from` rejection, terminal-state rejection, and frontmatter counters.
- **`extensions/gsd-commands/index.ts`** — Registers `gsd_todo` alongside state/backlog/workstream tools.
- **`skills/gsd-phase-loop/templates/todos.md`** — Template for new `TODOS.md` artifacts.
- **`agents/gsd-executor.md`** — Updated to initialize and update `TODOS.md` via `gsd_todo` for every task.
- **`agents/gsd-verifier.md`** — Updated to cross-check `TODOS.md` against `PLAN.md` tasks.
- **`skills/gsd-phase-loop/templates/conventions.md`** — Added `TODOS.md` to artifact list and registry-file rule.
- **`skills/gsd-phase-loop/references/artifact-index.md`** — Added `TODOS.md` to phase artifact tree and read order.
- **`extensions/gsd-commands/state.ts`** — `gsd_state_update` now accepts array values; `gsd_state_advance` auto-recalculates progress on `complete-phase`/`complete-plan`.
- **`extensions/gsd-commands/state.test.ts`** — Added test for array-valued `gsd_state_update`.

## Deviations from Plan

- The initial subagent execution failed with a connection error after partial progress. The remaining work (tool registration, agent/skill updates, state array fix, and final integration) was completed in the orchestrator turn.
- `gsd_todo` uses `repoPath` + `planPath` parameters rather than deriving `repoPath` from `planPath`; this matches the pattern used by other GSD tools.

## Acceptance Self-Check

| Criterion | Status | Evidence |
| ----------- | -------- | ---------- |
| `gsd_todo init` creates TODOS.md from PLAN.md | ✅ | `todo.test.ts` init test |
| All six FSM states supported | ✅ | STATES constant + tests |
| Invalid transitions rejected | ✅ | invalid-transition tests |
| Stale `from` state rejected | ✅ | stale-from test |
| Terminal states enforced | ✅ | terminal-state test |
| Tool registered in extension | ✅ | `index.ts` line 350 |
| Executor mentions `gsd_todo` | ✅ | `agents/gsd-executor.md` Step 2/3 |
| Verifier checks TODOS.md | ✅ | `agents/gsd-verifier.md` Step 9 |
| Template exists | ✅ | `templates/todos.md` |
| `gsd_state_update` arrays work | ✅ | `state.test.ts` array test |

## Dependency Output

- `gsd_todo` tool is ready for executor consumption.
- `TODOS.md` schema and template are documented.
- Verifier knows how to validate todo completion.

## Commits

- `test(04-01): implement gsd_todo tool and tests` (subagent)
- `feat(04-01): register gsd_todo and update agent/skill references`
- `fix(04-01): support array values in gsd_state_update`
- `docs(04-01): add TODOS.md to conventions and artifact index`

## Notes for Verifier

- Pay special attention to the `gsd_todo` transition enforcement and atomic save path.
- Confirm that `agents/gsd-executor.md` no longer suggests writing `TODOS.md` directly.
