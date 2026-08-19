---
name: workstream-manage
description: Interactive workstream management — create, switch, pause, resume, merge, and close parallel feature branches. Use when the user wants to manage workstreams. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-19"
metadata:
  source: "Adapted from gsd-package agent gsd-workstream for parent-turn interactivity in pi"
---

# Workstream Manage

Manage parallel feature workstreams interactively in the parent turn.

**Invoke with:** `/skill:workstream-manage [create|switch|pause|resume|merge|close]`

## Load context

Read:

- `.planning/STATE.md` — active phase and active workstream
- `.planning/WORKSTREAMS.md` — existing workstreams
- `.planning/BACKLOG.md` — optional items to promote

## Execute simple requests directly

For unambiguous requests (e.g., "switch to workstream WS-002"), execute with the `gsd_workstream` tool directly.

## Handle ambiguous requests interactively

If the request is ambiguous, use `ask_user_question` to confirm:

- Desired action (create/switch/pause/resume/merge/close)
- Workstream name or ID
- Optional link to a backlog item or phase

## Create workflow

When creating a workstream:

1. Suggest a name based on the linked backlog item or phase.
2. Ask the user to confirm or edit the name.
3. Call `gsd_workstream` with `operation: add`.
4. Optionally switch to the new branch.

## Write changes

Ensure `.planning/WORKSTREAMS.md` and `.planning/STATE.md` reflect the action. Use the `gsd_workstream` tool for deterministic registry updates when possible.

## Done when

- The requested workstream operation is complete.
- Registry files are consistent.
- User confirms the active workstream state.
