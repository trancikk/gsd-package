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

Always use the `gsd_backlog` tool to mutate `BACKLOG.md`. Never use the `write` tool or direct file edits on `.planning/BACKLOG.md`.

- **Promote:** create a workstream via `gsd_workstream` if the user wants a branch.
- **Close:** use `gsd_backlog` with `operation: close`. Add a closing note in the description field if the user provides one.
- **Add:** use `gsd_backlog` with `operation: add`.
- **Re-prioritize:** use `gsd_backlog` with `operation: update` to change `priority`.

## Verify changes

After calling `gsd_backlog`, confirm the operation succeeded by reading the returned `path`, `operation`, and `item`. Use `gsd_backlog` with `operation: list` if you need to inspect the current state.

## Done when

- All user-selected actions are applied.
- `BACKLOG.md` is updated.
- User confirms the backlog state looks correct.
