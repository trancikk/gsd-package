# Requirements

## REQ-01: Typed GSD workflow tools

- **Description:** The package must register pi tools that return ready-to-run `subagent()` calls for onboarding, research, planning, execution, verification, security audit, prototyping, and architecture review.
- **Acceptance criteria:**
  - `gsd_onboard`, `gsd_research`, `gsd_plan`, `gsd_execute`, `gsd_verify`, `gsd_security_audit`, `gsd_prototype`, and `gsd_arch_review` are callable from the orchestrator.
  - Each tool returns the exact subagent invocation and output path required by the workflow.
- **Phase:** 1
- **Status:** ☑ Done

## REQ-02: Atomic planning state management

- **Description:** STATE.md, BACKLOG.md, and WORKSTREAMS.md must be readable and writable atomically through typed pi tools.
- **Acceptance criteria:**
  - `gsd_state_load`, `gsd_state_update`, `gsd_state_advance`, `gsd_state_progress` work round-trip.
  - `gsd_backlog` supports add/list/update/close/promote.
  - `gsd_workstream` supports workstream registry and Git branch lifecycle.
  - All writes are atomic (temp file + rename, with Windows fallback).
- **Phase:** 1
- **Status:** ☑ Done

## REQ-03: Runtime guard hooks

- **Description:** `gsd-hooks` must warn the orchestrator when context is low, planning files are edited, prompt-injection patterns appear, commits diverge from Conventional Commits, or workflow rules are violated.
- **Acceptance criteria:**
  - Context warnings fire at configured thresholds.
  - Planning-edit reminders appear after relevant tool calls.
  - Injection scanner flags known patterns.
  - Status bar reflects current GSD state.
- **Phase:** 1
- **Status:** ☑ Done

## REQ-04: Autonomous subagent agent surface

- **Description:** Agents callable as pi background subagents must complete unattended, never ask the user clarifying questions, and escalate blockers via `contact_supervisor`.
- **Acceptance criteria:**
  - Interactive agents (`gsd-discuss`, `gsd-backlog`, `gsd-ui-researcher`, `gsd-workstream`, `gsd-grill`) are removed from subagent registries.
  - `## Confusion Recovery` and user-confusion phrases are removed from all autonomous agents.
  - Remaining user-question phrases are eliminated or converted to `contact_supervisor` escalations.
  - `docs/AGENT-AUTHORING.md` documents the autonomy rule.
- **Phase:** 2
- **Status:** ☑ Done

## REQ-05: Reusable skills and prompt templates

- **Description:** Provide user-facing skills and `/gsd-*` prompt templates that wrap the workflow tools and guide humans through the phase loop.
- **Acceptance criteria:**
  - `skills/gsd-phase-loop/SKILL.md` documents the canonical workflow.
  - Templates exist for all standard artifacts (PROJECT, ROADMAP, REQUIREMENTS, STATE, CONVENTIONS, BACKLOG, WORKSTREAMS, config, PLAN, SUMMARY, RESEARCH, VERIFICATION, codebase mapping).
  - `prompts/` templates emit valid `subagent()` calls.
- **Phase:** 1
- **Status:** ☑ Done

## REQ-06: Automated test and quality pipeline

- **Description:** Replace manual `npx tsx *.test.ts` scripts with a runnable test harness and add typecheck / lint scripts to guard against regressions.
- **Acceptance criteria:**
  - `npm test` runs all extension tests.
  - `npm run typecheck` runs `tsc --noEmit`.
  - CI workflow runs tests and typecheck on push/PR.
- **Phase:** 3
- **Status:** ☐ Open
