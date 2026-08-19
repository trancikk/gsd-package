---
name: backlog-triage
description: Interactive backlog triage — review, prioritize, promote, and close items. Use when the user says /skill:backlog-triage or asks to manage the backlog. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-19"
metadata:
  source: "Adapted from gsd-package agent gsd-backlog for parent-turn interactivity in pi"
---

# Backlog Triage

Help the user review and manage `.planning/BACKLOG.md` interactively in the parent turn.

**Invoke with:** `/skill:backlog-triage`

## Load

Read `.planning/BACKLOG.md`.

- If it does not exist, warn and offer to create it.

## Summarize

Present a short summary to the user:

- Open item count by priority
- Open item count by type (task/decision/risk)
- Items linked to the current phase (if `active_phase` is known)
- Top 5 items by priority

## Ask for action

Use `ask_user_question` to let the user pick one or more actions:

- Review high-priority items
- Promote an item to a workstream
- Close completed/stale items
- Add a new item
- Re-prioritize items
- Do nothing

## Execute chosen action

Use the `gsd_backlog` tool or direct file edits to carry out the user's choices.

- **Promote:** create a workstream via `gsd_workstream` if the user wants a branch.
- **Close:** update the item status and add a closing note.
- **Add:** ask for title, description, priority, type, and source/linked phase.
- **Re-prioritize:** ask for new priorities and rewrite the file.

## Write changes

Write the updated `BACKLOG.md` to disk before returning. Verify it with `ls -la`.

## Done when

- All user-selected actions are applied.
- `BACKLOG.md` is updated.
- User confirms the backlog state looks correct.
