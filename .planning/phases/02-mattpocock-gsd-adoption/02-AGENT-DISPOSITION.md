# gsd-package agent disposition

Based on prompt audit of `C:/Sources/gsd-package/agents/` and the research in `02-RESEARCH.md`.

## Summary

- **5 agents are interactive** and must be removed from the pi subagent registry.
- **2 autonomous agents need a `contact_supervisor` escalation path** for genuine blockers.
- **18 autonomous agents can stay** with only the `## Confusion Recovery` boilerplate removed.

## Interactive agents — remove from subagent registry

| Agent | Why it is interactive | Corresponding skill / command | Recommendation |
| --- | --- | --- | --- |
| **gsd-discuss** | Facilitates interactive discussion; asks user to select gray areas; produces `CONTEXT.md`. | gsd-package has `domain-modeling` and `gsd-phase-loop` skills, but no user-facing `/discuss` command. | Remove from `.cursor/agents/` and `.pi/agents/`. Convert to a parent-turn slash command or skill (e.g., `/discuss-phase`) that uses `ask_user_question`/`interview`. |
| **gsd-backlog** | Frontmatter declares `ask_user_question`; "Interactive triage" lets user choose actions. | Pi has the `gsd_backlog` tool; no dedicated slash command. | Remove from subagent registry. Keep as a slash-command wrapper or let users call `gsd_backlog` directly. |
| **gsd-ui-researcher** | Description says "Interactive discussion with user"; prompt instructs to `ask_user_question` for design contract. | No matching skill in gsd-package. | Remove from subagent registry. Convert to a parent-turn `/ui-phase` command that orchestrates autonomous `gsd-ui-checker` / `gsd-ui-auditor`. |
| **gsd-workstream** | Frontmatter declares `ask_user_question`; confirms ambiguous workstream requests with user. | Pi has the `gsd_workstream` tool; no dedicated slash command. | Remove from subagent registry. Keep as a slash-command wrapper or let users call `gsd_workstream` directly. |
| **gsd-grill** | Prompt says "Interview the user relentlessly" and waits for answers between rounds. | gsd-package has `grill-me` skill. Not present in `.cursor/agents/` or `.pi/agents/`. | Do not register as a subagent. Keep `grill-me` as a parent-turn slash command / skill. |

## Autonomous agents that need an escalation path

| Agent | Notes | Recommendation |
| --- | --- | --- |
| **gsd-debug** | Mostly autonomous, but prompt says "ask the user for a private channel or a scrubbed artifact" when redacted output is insufficient. | Keep as subagent. Replace "ask the user" with `contact_supervisor({ reason: "need_decision" })`. Remove `## Confusion Recovery`. |
| **gsd-executor** | Fully autonomous executor with deviation rules. If it hits an unapproved architectural or product decision, it needs escalation. | Keep. Ensure blocker escalation uses `contact_supervisor`, not user questions. Remove `## Confusion Recovery`. |

## Autonomous agents — keep, only remove `## Confusion Recovery`

| Agent | Notes |
| --- | --- |
| **gsd-arch-review** | Architectural review; no user interaction. |
| **gsd-autonomous** | Full phase-loop agent; escalate blockers via `contact_supervisor`. |
| **gsd-capture** | Captures ideas/todos/decisions from conversation; writes artifacts. |
| **gsd-code-review** | Code review; autonomous. |
| **gsd-learnings** | Extracts and accumulates phase learnings. |
| **gsd-milestone-complete** | Milestone completion audit. |
| **gsd-milestone-summary** | Milestone summary generation. |
| **gsd-pause** | State save operation. |
| **gsd-phase-researcher** | Research for a phase; autonomous. |
| **gsd-plan-checker** | Goal-backward plan review; autonomous. |
| **gsd-planner** | Plan creation; escalate scope ambiguities via `contact_supervisor`. |
| **gsd-prototype** | Build throwaway prototypes; when branch is ambiguous, state the assumption in `PROTOTYPE.md` and proceed. |
| **gsd-quick** | Lightweight single-task execution. |
| **gsd-resume** | State restore operation. |
| **gsd-retrospective** | Retrospective generation. |
| **gsd-security-audit** | Security audit; autonomous. |
| **gsd-ui-auditor** | UI audit against design requirements. |
| **gsd-ui-checker** | UI implementation quality check. |
| **gsd-verifier** | Phase verification; autonomous. |

## Files to edit

For the 18 autonomous agents plus `gsd-debug` and `gsd-executor`:

- `gsd-package/agents/*.md`
- `fifa.ai/.cursor/agents/*.md`
- `fifa.ai/.pi/agents/*.md`

Delete from registries only:

- `fifa.ai/.cursor/agents/gsd-discuss.md`
- `fifa.ai/.cursor/agents/gsd-backlog.md`
- `fifa.ai/.cursor/agents/gsd-ui-researcher.md`
- `fifa.ai/.cursor/agents/gsd-workstream.md`
- `fifa.ai/.pi/agents/gsd-discuss.md`
- `fifa.ai/.pi/agents/gsd-backlog.md`
- `fifa.ai/.pi/agents/gsd-ui-researcher.md`
- `fifa.ai/.pi/agents/gsd-workstream.md`

`gsd-grill.md` does not currently exist in `.cursor/agents/` or `.pi/agents/`, so no deletion is needed.
