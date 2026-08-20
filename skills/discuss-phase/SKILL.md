---
name: discuss-phase
description: Interactive decision-capture session before planning. Use when the user wants to discuss a phase, clarify gray areas, or produce CONTEXT.md. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-19"
metadata:
  source: "Adapted from gsd-package agent gsd-discuss for parent-turn interactivity in pi"
---

# Discuss Phase

Run an interactive discussion to capture implementation decisions for a phase and write them to `CONTEXT.md` so downstream planner/researcher agents can act without asking the user again.

**Invoke with:** `/skill:discuss-phase <phase>`

## Load context first

Before asking the user, read:

- `.planning/ROADMAP.md` — phase goal, scope, success criteria
- `.planning/STATE.md` — current position
- `.planning/PROJECT.md` — project overview
- Prior phase `CONTEXT.md` files (up to 3 back)
- Existing `./CONTEXT.md` or `CONTEXT-MAP.md` if present

## Identify gray areas

A gray area is an implementation decision the user cares about that could change the result.

- Generate **specific** gray areas for this phase (not generic UI/UX/Behavior labels).
- Skip anything already decided in prior `CONTEXT.md` or `REQUIREMENTS.md`.
- Mark scope-creep ideas as deferred; do not discuss them now.

## Present gray areas to the user

Use `ask_user_question` to let the user select which gray areas to discuss. Example shape:

```
Which gray areas should we discuss for phase 02?
- Area A: [one-line]
- Area B: [one-line]
- Area C: [one-line]
- None — CONTEXT.md is already sufficient
```

## Deep-dive each selected area

For each selected area:

1. State the decision in one sentence.
2. Offer 2–4 concrete options with trade-offs.
3. Recommend one option.
4. Ask the user to confirm, modify, or add constraints.

Use `ask_user_question` for each round. Batch related options into one question when possible (max 4 questions per `ask_user_question` call).

## Domain-modeling discipline

As terms resolve:

- Challenge fuzzy or overloaded terms; propose canonical language.
- Update `CONTEXT.md` inline after each resolved decision.
- Offer an ADR only when a decision is hard-to-reverse, surprising, or a real trade-off.

## Output

Write the final `CONTEXT.md` to the phase directory **before** returning.

Include:

- Phase number/name
- Decisions locked during this session
- Deferred ideas (scope creep)
- Terms/glossary updates
- Link to any created ADR

## Show next actions

After `CONTEXT.md` is written, show the user what they can do next without editing `STATE.md`:

```javascript
gsd_next_action({ repoPath: "." })
```

Present `recommended_action` and `valid_actions` to the user, e.g.:

> CONTEXT.md is ready. Recommended next step: **plan-phase**. Valid options: `plan-phase`, `plan-check`.

## Done when

- All selected gray areas are resolved.
- `CONTEXT.md` is written and non-empty.
- User has seen the recommended next action from `gsd_next_action`.
- User confirms the captured decisions are clear enough for planning.
