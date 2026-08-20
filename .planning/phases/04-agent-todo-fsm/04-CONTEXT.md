# Phase 04: Agent Todo FSM — Decisions

**Phase:** 04  
**Name:** Agent Todo FSM  
**Goal:** Provide a per-plan, state-machine-tracked todo list for agents, with the executor as the primary consumer.

## Locked Decisions

### D-04-01: Artifact location

Each `PLAN.md` produces a matching `TODOS.md` in the same phase directory:

```text
.planning/phases/<NN>-<slug>/<NN>-<PP>-TODOS.md
```

Rationale: Mirrors the existing `PLAN.md` / `SUMMARY.md` convention; keeps execution state adjacent to the plan it tracks.

### D-04-02: Supported FSM states

Tasks support six states:

- `pending` — not started
- `in_progress` — currently being worked
- `blocked` — waiting on a precondition, decision, or external event
- `completed` — task finished and verified
- `failed` — task could not be completed; requires escalation or deviation
- `skipped` — task intentionally omitted (out of scope or overridden)

### D-04-03: Valid transitions

Allowed transitions are enforced by the tool:

- `pending → in_progress`
- `in_progress → completed | blocked | failed | skipped`
- `blocked → in_progress | failed | skipped`
- `completed`, `failed`, `skipped` are terminal

Rationale: Captures normal flow, blockers, deviations, and intentional scope changes without allowing nonsensical re-opens.

### D-04-04: Transition driver

A new host-side extension tool, `gsd_todo`, drives all `TODOS.md` mutations.

Rationale: Same hardening pattern used for `STATE.md`, `BACKLOG.md`, and `WORKSTREAMS.md`. Centralizes schema, transition logic, and atomic writes.

### D-04-05: TODOS.md initialization

`gsd_todo` supports an `init` operation that reads a `PLAN.md` and writes a `TODOS.md` with every task in `pending` state.

Rationale: Removes manual todo authoring and guarantees every PLAN task is tracked.

### D-04-06: Executor responsibility

The executor must update `TODOS.md` via `gsd_todo` as it moves through tasks. It still produces `SUMMARY.md` as the narrative/audit artifact.

Rationale: `TODOS.md` is the machine-readable execution trace; `SUMMARY.md` remains the human-readable record.

### D-04-07: Verifier responsibility

The verifier checks that every task in `PLAN.md` has a corresponding `completed` entry in `TODOS.md` (or `skipped` with an explicit reason).

Rationale: Goal-backward verification must include todo completion, not just existence of a SUMMARY.md claim.

### D-04-08: Atomicity and concurrency

All `gsd_todo` writes use the registry module’s atomic save (`writeAtomic`). Transitions require `from` to match current state to detect stale updates.

Rationale: Prevents race conditions and partial writes.

## Deferred / Out of Scope

- Real-time UI progress bars
- Cross-plan todo aggregation
- Automatic todo creation from `SUMMARY.md`
- Webhook / notification on terminal states

## Canonical References

- `extensions/gsd-commands/registry.ts` — artifact loading/saving primitives
- `extensions/gsd-commands/backlog.ts` — prior art for a registry-backed tool
- `agents/gsd-executor.md` — consumer of the new artifact
- `agents/gsd-verifier.md` — validator of the new artifact
