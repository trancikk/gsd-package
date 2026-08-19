# Roadmap

## Milestone: v1.0 — GSD Core Stable

**Goal:** A stable, documented, and tested pi package that teams can install to run the full GSD phase-loop workflow with confidence.

### Phase 1: Core GSD pi package

- **Goal:** Ship the foundational extensions, agents, skills, and templates needed to run a GSD phase loop in pi.
- **Requirements:** REQ-01, REQ-02, REQ-03, REQ-05
- **Success criteria:**
  - `gsd-commands`, `gsd-hooks`, and `gsd-save-response` load without errors.
  - State/backlog/workstream tools pass round-trip manual tests.
  - A new project can run `init.sh` and start a phase loop.
- **Estimated scope:** Large
- **Status:** Completed

### Phase 2: Matt Pocock GSD adoption — autonomous agents

- **Goal:** Align `gsd-package` agents with the GSD-OpenCode model: interactive protocols live in parent-turn skills/commands, and every background subagent is strictly autonomous.
- **Requirements:** REQ-04
- **Success criteria:**
  - All autonomous agents are scrubbed of `## Confusion Recovery` and user-question phrases.
  - Interactive agents are removed from `.cursor/agents/` and `.pi/agents/` (including in `fifa.ai`).
  - `docs/AGENT-AUTHORING.md` contains the autonomy rule and checklist.
  - Phase summary and verification reports exist.
- **Depends on:** Phase 1
- **Estimated scope:** Medium
- **Status:** Completed

### Phase 3: Stabilization and quality gates

- **Goal:** Add automated testing, typechecking, linting, and CI so the package can be shipped and maintained safely.
- **Requirements:** REQ-06
- **Success criteria:**
  - `npm test`, `npm run typecheck`, and `npm run lint` exist and pass.
  - GitHub Actions (or equivalent) runs the checks on every PR.
  - `gsd-resolve.sh` is deleted or moved to a `legacy/` directory.
- **Depends on:** Phase 2
- **Estimated scope:** Medium
- **Status:** Not Started

---
*Last updated: 2026-08-19*
