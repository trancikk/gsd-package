---
phase: <NN>
name: "[Phase Name]"
goal: "[Single-sentence phase goal]"
requirements:
  - REQ-01
  - REQ-02
created: "<TIMESTAMP>"
---

# Phase <NN>: [Phase Name]

## Goal
[What this phase delivers — one sentence that defines done]

## Domain
[The technical domain this phase operates in — e.g., "authentication API", "frontend state management"]

## Locked Decisions
<!-- Decided during discuss-phase. These are NOT open for debate during planning/execution. -->

### D-<NN>-01: [Decision Title]
- **Decision:** [What was decided]
- **Rationale:** [Why this approach]
- **Alternatives considered:** [What was rejected and why]

## Canonical References
<!-- Source-of-truth documents the planner and executor must consult. -->

- `[path/to/doc.md]` — [What it covers]
- `[path/to/source.ts]` — [What module/pattern it defines]

## Code Context
<!-- Existing code the executor should be aware of. -->

- `[file:line]` — [What it does, relevant to this phase]
- `[file:line]` — [Pattern to follow or avoid]

## Specifics
<!-- Concrete implementation guidance — not decisions, but specifics the executor should know. -->

- [Specific technical detail 1]
- [Specific detail 2]

## Deferred
<!-- Ideas raised but explicitly out of scope for this phase. Captured for future phases. -->

- [Deferred idea 1] → will revisit in Phase <NN>
