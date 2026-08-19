# Agent Classification

Classification of every agent in `gsd-package/agents/` as **autonomous** or **interactive**, created for Phase 02.

| Agent | Class | Rationale |
| ------- | ------- | ----------- |
| gsd-arch-review | autonomous | Produces architecture-review artifacts without user dialogue. |
| gsd-autonomous | autonomous | Executes full phases from existing plans; no mid-run user input. |
| gsd-capture | autonomous | Writes `.planning/` artifacts from provided conversation context. |
| gsd-code-review | autonomous | Runs parallel standards/spec reviews and writes a report. |
| gsd-debug | autonomous | Builds loops and fixes bugs; escalates blockers via `contact_supervisor`. |
| gsd-executor | autonomous | Executes PLAN.md tasks and commits; escalates blockers via `contact_supervisor`. |
| gsd-learnings | autonomous | Extracts learnings and updates `LEARNINGS.md` from artifacts. |
| gsd-milestone-complete | autonomous | Audits milestone artifacts and archives state. |
| gsd-milestone-summary | autonomous | Reads phase artifacts and writes a milestone summary. |
| gsd-pause | autonomous | Saves session state for later resumption. |
| gsd-phase-researcher | autonomous | Researches a phase and writes `RESEARCH.md`. |
| gsd-plan-checker | autonomous | Verifies plans against goals and writes `VALIDATION.md`. |
| gsd-planner | autonomous | Creates plans from locked decisions; escalates blockers via `contact_supervisor`. |
| gsd-prototype | autonomous | Builds throwaway prototypes; chooses branch or states assumption. |
| gsd-quick | autonomous | Executes a single well-defined task. |
| gsd-resume | autonomous | Restores session state from `HANDOFF.json`. |
| gsd-retrospective | autonomous | Generates post-phase retrospectives from artifacts. |
| gsd-security-audit | autonomous | Scans code and produces a threat model report. |
| gsd-ui-auditor | autonomous | Audits implemented UI and writes `UI-REVIEW.md`. |
| gsd-ui-checker | autonomous | Validates `UI-SPEC.md` contracts. |
| gsd-verifier | autonomous | Verifies codebase against plan must-haves and writes `VERIFICATION.md`. |

## Interactive agents that live as parent-turn skills

These agents are **not** registered in `gsd-package/agents/`; they are implemented as user-facing skills in `gsd-package/skills/`.

| Agent (concept) | Skill directory | User-facing invocation | Why interactive |
| ----------------- | ----------------- | ------------------------ | ----------------- |
| gsd-discuss | `discuss-phase/` | `/skill:discuss-phase` | Facilitates decision discussion with the user. |
| gsd-backlog | `backlog-triage/` | `/skill:backlog-triage` | Interactive backlog triage (uses `ask_user_question`). |
| gsd-ui-researcher | `ui-phase/` | `/skill:ui-phase` | Design-contract discussion with the user. |
| gsd-workstream | `workstream-manage/` | `/skill:workstream-manage` | Workstream management choices confirmed with user. |
| gsd-grill | `grill-me/` | `/skill:grill-me` | Interview-style rounds with the user. |

## Decision

Every file inside `gsd-package/agents/` is classified as **autonomous**. No interactive agents remain in the agent registry.
