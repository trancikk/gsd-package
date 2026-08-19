# Phase 02 — Make gsd-package agents strictly autonomous

## Goal

Remove interactive subagent wrappers and remove the `wait-what` / confusion-recovery boilerplate from non-interactive agents. The result: every agent that can be invoked as a background pi subagent runs unattended and never tries to ask the user for feedback.

## Why this is the right narrow first step

The broader adoption plan mixed two incompatible things:

- **Interactive skills** (`grill-me`, `wait-what`, `gsd-discuss`, etc.) require a user dialogue channel that pi subagents do not have.
- **Non-interactive agents** currently carry confusion-recovery instructions copied from the `wait-what` skill, but a background subagent cannot observe or respond to user confusion.

Until this is cleaned up, adding more skills or `CONTEXT.md` is premature. We must first make the subagent surface consistent and autonomous.

## Decisions

| # | Decision |
| --- | ---------- |
| D1 | **Subagents must be autonomous.** Any agent registered in `.cursor/agents/` or `.pi/agents/` must complete its work without asking the user questions. |
| D2 | **Interactive agents are not subagents.** The interactive agents (`gsd-discuss`, `gsd-backlog`, `gsd-ui-researcher`, `gsd-workstream`, and `gsd-grill`) are removed from subagent registries. They remain available as user-facing slash commands or parent-turn skills. |
| D3 | **No confusion recovery in autonomous agents.** The `## Confusion Recovery` section (and any equivalent "re-pitch if user says wait/what" instruction) is removed from every non-interactive agent. |
| D4 | **Agent authoring guide is updated.** `gsd-package/docs/AGENT-AUTHORING.md` explicitly bans user-question / confusion-signal handling in autonomous agents. |

## Interactive agents to remove from subagent registries

Based on prompt analysis:

- `gsd-discuss` — explicitly asks user about implementation decisions.
- `gsd-backlog` — uses `ask_user_question`; interactive triage.
- `gsd-ui-researcher` — uses `ask_user_question`; design-contract discussion.
- `gsd-workstream` — uses `ask_user_question`; workstream management choices.
- `gsd-grill` — interview-style rounds (already absent from `.cursor/agents/` and `.pi/agents/`, but verify).

## Autonomous agents to clean up

All remaining agents in `.cursor/agents/` and `.pi/agents/` plus `gsd-package/agents/` must be scrubbed for:

- `## Confusion Recovery` section.
- Phrases like "If the user signals confusion", "re-pitch your last message", "wait", "what?".
- Any instruction to wait for user approval or ask the user an open-ended question.

Confirmed files containing the confusion-recovery section:

`gsd-autonomous`, `gsd-capture`, `gsd-code-review`, `gsd-debug`, `gsd-executor`, `gsd-learnings`, `gsd-milestone-complete`, `gsd-milestone-summary`, `gsd-pause`, `gsd-phase-researcher`, `gsd-plan-checker`, `gsd-planner`, `gsd-prototype`, `gsd-quick`, `gsd-resume`, `gsd-retrospective`, `gsd-security-audit`, `gsd-ui-auditor`, `gsd-ui-checker`, `gsd-verifier`.

## Tasks

### T1 — Audit and classify agents

- Read every `gsd-package/agents/*.md` and classify it `interactive` or `autonomous`.
- Write the classification to `.planning/phases/02-mattpocock-gsd-adoption/AGENT-CLASSIFICATION.md`.

**Acceptance:** Classification file exists and lists every agent with rationale.

### T2 — Remove interactive agents from subagent registries

- In `fifa.ai`, delete interactive agents from `.cursor/agents/` and `.pi/agents/`:
  - `gsd-discuss.md`
  - `gsd-backlog.md`
  - `gsd-ui-researcher.md`
  - `gsd-workstream.md`
- Verify `gsd-grill.md` is not present in either registry.
- Leave the source files in `gsd-package/agents/` intact (they will become slash-command skills).

**Acceptance:** `grep -E "gsd-discuss|gsd-backlog|gsd-ui-researcher|gsd-workstream|gsd-grill" .cursor/agents/*.md .pi/agents/*.md` returns no matches.

### T3 — Remove confusion-recovery boilerplate from autonomous agents

- Remove the `## Confusion Recovery` section and its body from every autonomous agent in:
  - `gsd-package/agents/`
  - `fifa.ai/.cursor/agents/`
  - `fifa.ai/.pi/agents/`
- Also remove any remaining "If the user signals confusion" paragraph if it appears outside that section.

**Acceptance:** `grep -Rni "confusion recovery\|signals confusion\|re-pitch" gsd-package/agents/ fifa.ai/.cursor/agents/ fifa.ai/.pi/agents/` returns no matches in non-interactive agents.

### T4 — Scan for remaining user-question patterns in autonomous agents

- Search for phrases like "ask the user", "wait for the user's", "wait for user approval", "ask_user_question".
- Rewrite or remove them. Legitimate escalations must be rare, concrete, and documented as "blocker escalations", not clarifying questions.

**Acceptance:** No autonomous agent contains instructions to ask the user clarifying questions.

### T5 — Update `AGENT-AUTHORING.md`

- Add a section: **Autonomy rule for subagent agents**.
- State that agents callable as pi subagents must not contain confusion recovery, open-ended questions, or `ask_user_question`.
- State that interactive protocols belong to slash commands or parent-turn skills.
- Add a review checklist item: "Agent does not ask the user questions or recover from confusion signals."

**Acceptance:** `AGENT-AUTHORING.md` contains the autonomy rule and checklist item.

### T6 — Document non-subagent invocation path for interactive agents

- Add a `COMMANDS.md` or update an existing commands/skills index in `gsd-package`.
- Map each interactive agent to a slash command or skill invocation:
  - `/discuss` → `gsd-discuss` skill/parent turn
  - `/backlog` → `gsd-backlog` skill/parent turn
  - `/ui-spec` → `gsd-ui-researcher` skill/parent turn
  - `/workstream` → `gsd-workstream` skill/parent turn
  - `/grill-me` → `gsd-grill` skill/parent turn

**Acceptance:** Document lists every interactive agent with its user-facing invocation path.

### T7 — Verify and write summary

- Run verification greps and capture output.
- Write `.planning/phases/02-mattpocock-gsd-adoption/02-SUMMARY.md`.

## Acceptance criteria for the phase

- [ ] Every agent in `.cursor/agents/` and `.pi/agents/` is classified as autonomous.
- [ ] No autonomous agent contains `## Confusion Recovery` or user-confusion handling.
- [ ] No autonomous agent prompts the user with clarifying questions.
- [ ] `AGENT-AUTHORING.md` documents the autonomy rule.
- [ ] Interactive agents have a documented slash-command / skill invocation path.
- [ ] Phase summary exists.

## Risks and mitigations

| Risk | Mitigation |
| ------ | ------------ |
| Orchestrator workflows currently invoke interactive agents | Replace those calls with parent-turn dialogue or parameter-driven autonomous equivalents before deleting. |
| Removing confusion recovery degrades foreground experience | Keep confusion recovery in parent-level interactive wrappers, not in subagent prompts. |
| Sync drift between `gsd-package/agents/` and `fifa.ai/.cursor/.pi/agents/` | Do T2–T3 in both locations and verify with grep. |

## Deferred to later phases

- `CONTEXT.md` adoption.
- New `research` skill.
- Autonomous plan-refinement in `gsd-plan-checker`.
- Pilot defect-class selection.
