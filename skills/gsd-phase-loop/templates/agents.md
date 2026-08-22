<!-- GSD:project-start source:.planning/PROJECT.md -->
## Project

Project not yet initialized. Run `/skill:init-project` to set up.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:.planning/CONVENTIONS.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:.planning/CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:.planning/PROJECT.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.pi/skills/`, `.cursor/skills/`, `.agents/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using edit, write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/skill:init-project` for new project setup
- `/gsd-onboard` for existing codebase onboarding
- `/skill:discuss-phase` for implementation decisions
- `/gsd-research`, `/gsd-plan`, `/gsd-execute`, `/gsd-verify` for planned phase work
- `/skill:workstream-manage` for parallel feature branches

**Registry/state files must be mutated through dedicated tools, not direct edits:**
- `.planning/STATE.md` → `gsd_state_load`, `gsd_state_update`, `gsd_state_advance`, `gsd_state_progress`, `gsd_next_action`
- `.planning/BACKLOG.md` → `gsd_backlog`
- `.planning/WORKSTREAMS.md` → `gsd_workstream`
- `.planning/phases/<NN>-<slug>/<NN>-<PP>-TODOS.md` → `gsd_todo`

Use `gsd_scaffold` to create the initial `.planning/` directory and root `AGENTS.md`.
Use `gsd_research_project` to run domain research for a new project.

## Agent Rules

When running as a GSD subagent:

- **Use the GSD tool set** (`gsd_research`, `gsd_plan`, `gsd_execute`, `gsd_verify`, etc.) for planned work. Do not write code directly in response to a user prompt unless the user explicitly asks to bypass the workflow.
- **Read relevant specs, design docs, and prior decisions** before writing or editing code.
- **Capture planning decisions in artifacts** (`CONTEXT.md`, `PLAN.md`, project `specs/`, ADRs) before generating implementation code.
- **Write the minimum code** that solves the stated problem — nothing extra.
- **Run tests and gates after every change** and show evidence before declaring the work done.
- **Never proceed on red gates.** If tests, lint, type-check, or other required checks fail, fix the failure or escalate before continuing.
- **One clarifying question beats a wrong assumption baked into code.** Ask when requirements are ambiguous.
- **Be concise when reporting** — summarize decisions, evidence, and next steps clearly.

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. This section is managed exclusively by user-provided project context.
<!-- GSD:profile-end -->

---
*Last updated: <DATE> after initialization*
