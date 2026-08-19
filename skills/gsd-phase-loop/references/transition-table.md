# GSD Phase Transition Table

Valid transitions between `STATE.md` statuses.

| Current status | Current `next_action` | Valid actions | Recommended action | Resulting status |
| ---------------- | ---------------------- | --------------- | -------------------- | ------------------ |
| `initializing` | `discuss-phase` | `discuss-phase` | `discuss-phase` | `active` |
| `idle` | `begin-phase` | `begin-phase`, `milestone-complete` | `begin-phase` | `active` |
| `active` | `discuss-phase` | `discuss-phase`, `plan-phase` | `discuss-phase`¹ | `active` |
| `active` | `plan-phase` | `plan-phase`, `plan-check` | `plan-phase` | `active` |
| `active` | `execute-phase` | `execute-phase`, `pause` | `execute-phase` | `executing` |
| `executing` | `execute-phase` | `execute-phase`, `complete-plan`, `pause` | `execute-phase` | `executing` / `active`² |
| `paused` | `resume` | `resume`, `abandon` | `resume` | `active` / `idle`³ |

¹ If `CONTEXT.md` already exists, recommendation shifts to `plan-phase`.
² `complete-plan` returns to `active` with `next_action: execute-phase` for the next plan.
³ `resume` returns to `active`; `abandon` returns to `idle`.

## Corresponding tools

| Action | Tool / agent |
| -------- | -------------- |
| `discuss-phase` | `discuss-phase` skill |
| `plan-phase` | `gsd_research` → `gsd_plan` |
| `plan-check` | `gsd_plan_check` |
| `execute-phase` | `gsd_execute` |
| `complete-plan` | `gsd_state_advance({ operation: 'complete-plan' })` |
| `begin-phase` | `gsd_state_advance({ operation: 'begin-phase' })` |
| `complete-phase` | `gsd_state_advance({ operation: 'complete-phase' })` |
| `pause` / `resume` | `gsd_state_update({ field: 'status', ... })` |
| `milestone-complete` | `gsd-milestone-complete` agent |
