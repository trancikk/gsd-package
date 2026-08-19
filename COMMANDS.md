# GSD Commands

User-facing invocation paths for GSD interactive workflows and the autonomous subagents they may delegate to.

## Interactive workflows (parent-turn)

Interactive skills run in the parent turn and are allowed to ask the user questions. They are **not** invokable as background pi subagents.

| Command | Skill | What it does |
| ------- | ----- | ------------ |
| `/skill:discuss-phase` | `skills/discuss-phase/` | Facilitate implementation decisions and produce `CONTEXT.md`. |
| `/skill:backlog-triage` | `skills/backlog-triage/` | Interactive backlog triage and prioritization. |
| `/skill:ui-phase` | `skills/ui-phase/` | Discuss the design contract and produce `UI-SPEC.md`. |
| `/skill:workstream-manage` | `skills/workstream-manage/` | Create, switch, pause, resume, merge, or close parallel workstreams. |
| `/skill:grill-me` | `skills/grill-me/` | Interview the user relentlessly to surface assumptions. |

## Autonomous subagents

These agents run unattended as pi subagents. They never ask the user clarifying questions; blockers are escalated via `contact_supervisor`.

| Agent | File | Use when |
| ----- | ---- | -------- |
| gsd-autonomous | `agents/gsd-autonomous.md` | Execute a whole phase autonomously from existing plans. |
| gsd-capture | `agents/gsd-capture.md` | Capture ideas, todos, decisions, or learnings into `.planning/`. |
| gsd-code-review | `agents/gsd-code-review.md` | Run a two-axis code review (standards + spec). |
| gsd-debug | `agents/gsd-debug.md` | Diagnose and fix a bug with a tight feedback loop. |
| gsd-executor | `agents/gsd-executor.md` | Execute a single PLAN.md atomically. |
| gsd-learnings | `agents/gsd-learnings.md` | Extract and accumulate phase learnings. |
| gsd-milestone-complete | `agents/gsd-milestone-complete.md` | Audit and archive a completed milestone. |
| gsd-milestone-summary | `agents/gsd-milestone-summary.md` | Generate a milestone summary report. |
| gsd-pause | `agents/gsd-pause.md` | Save session state for later resumption. |
| gsd-phase-researcher | `agents/gsd-phase-researcher.md` | Research a phase before planning. |
| gsd-plan-checker | `agents/gsd-plan-checker.md` | Verify plans will achieve the phase goal. |
| gsd-planner | `agents/gsd-planner.md` | Create executable phase plans. |
| gsd-prototype | `agents/gsd-prototype.md` | Build a throwaway prototype to answer a design question. |
| gsd-quick | `agents/gsd-quick.md` | Execute a small, well-defined task. |
| gsd-resume | `agents/gsd-resume.md` | Restore session state from a pause. |
| gsd-retrospective | `agents/gsd-retrospective.md` | Generate a post-phase retrospective. |
| gsd-security-audit | `agents/gsd-security-audit.md` | Run a security audit and produce a threat model. |
| gsd-ui-auditor | `agents/gsd-ui-auditor.md` | Retroactive visual audit of implemented UI. |
| gsd-ui-checker | `agents/gsd-ui-checker.md` | Validate a `UI-SPEC.md` contract. |
| gsd-verifier | `agents/gsd-verifier.md` | Verify a completed phase against its must-haves. |

## Rule of thumb

- If the workflow needs a human decision or clarification, use a **parent-turn skill** from the interactive table.
- If the work can proceed from locked decisions and existing plans, spawn an **autonomous subagent**.
