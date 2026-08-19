---
phase: 03
plan: 01
wave: 1
depends_on: []
files:
  - extensions/gsd-commands/state.ts
  - extensions/gsd-commands/backlog.ts
  - extensions/gsd-commands/workstream.ts
  - extensions/gsd-commands/yaml.ts
  - extensions/gsd-commands/utils.ts
requirements:
  - REQ-06
  - REQ-07
  - REQ-08
  - REQ-09
  - REQ-10
must_haves:
  truths:
    - "The .planning/ registry module is the single source of truth for artifact load/save/update."
    - "Existing state/backlog/workstream tool signatures remain unchanged."
    - "The three skill variants coexist and cross-link to each other."
    - "gsd_next_action returns a structured object and never mutates STATE.md."
  artifacts:
    - "extensions/gsd-commands/registry.ts"
    - "extensions/gsd-commands/index.ts updated to register gsd_next_action"
    - "skills/gsd-quick-start/SKILL.md"
    - "skills/gsd-decision-helper/SKILL.md"
    - "skills/gsd-phase-loop/SKILL.md (rewritten as full reference)"
    - "skills/gsd-phase-loop/references/*.md"
    - ".github/workflows/ci.yml or equivalent"
  key_links:
    - "registry.load('state') returns the same shape as the current gsd_state_load."
    - "npm test passes all existing and new tests."
    - "gsd_next_action({ repoPath }) returns valid_actions matching STATE.md status."
---

# Phase 03 — Architecture & Skill Rework

## Goal

Rework `gsd-package` internals and skill surface: extract a shared `.planning/` registry, modularize hooks, split the monolithic skill into a focused family, add a `gsd_next_action` FSM tool, and ship a test/CI pipeline.

## Waves

### Wave 1: Foundation

#### T1 — Extract shared `.planning/` registry module

- **Files to read:** `extensions/gsd-commands/state.ts`, `backlog.ts`, `workstream.ts`, `yaml.ts`, `utils.ts`
- **Read first:** Identify duplicated file I/O, frontmatter parsing, atomic write, and path-resolution logic.
- **Action:** Create `extensions/gsd-commands/registry.ts` exposing at least:
  - `load(artifact, repoPath)` → parsed frontmatter + body
  - `save(artifact, repoPath, data)` → atomic write
  - `updateField(artifact, repoPath, field, value)` → atomic partial update
  - `listPhases(repoPath)` → array of phase metadata
- **Verify:** `npx tsx extensions/gsd-commands/registry.test.ts` passes.

#### T2 — Refactor state/backlog/workstream tools to use registry

- **Files to read:** `extensions/gsd-commands/state.ts`, `backlog.ts`, `workstream.ts`
- **Read first:** Ensure each tool's public signature and error behavior are preserved.
- **Action:** Replace inline file I/O with registry calls. Keep error messages and return shapes identical.
- **Verify:** Existing manual tests (`state.test.ts`, `backlog.test.ts`, `workstream.test.ts`) still pass.

#### T3 — Modularize `gsd-hooks`

- **Files to read:** `extensions/gsd-hooks/index.ts`, `status.ts`
- **Read first:** Note each hook/guard and its dependencies.
- **Action:** Split into focused modules under `extensions/gsd-hooks/`:
  - `context-guard.ts`
  - `commit-guard.ts`
  - `injection-guard.ts`
  - `status-renderer.ts`
  - `index.ts` becomes a thin registration file.
- **Verify:** Extension loads without errors and existing `status.test.ts` passes.

### Wave 2: FSM & Tooling

#### T4 — Implement `gsd_next_action` tool

- **Files to read:** `extensions/gsd-commands/index.ts`, `.planning/STATE.md`, `extensions/gsd-commands/registry.ts`
- **Read first:** Understand current STATE.md schema and valid transitions.
- **Action:** Add `gsd_next_action` to `extensions/gsd-commands/index.ts`. It returns:

  ```typescript
  {
    valid_actions: string[];
    recommended_action: string;
    reason: string;
    missing_prerequisites: string[];
  }
  ```

  Implement a simple FSM map keyed by `status`/`active_phase`/`next_action`.
- **Verify:** Add `registry.test.ts` cases for each major state (idle, active, initializing, paused).

#### T5 — Document the `STATE.md` FSM

- **Files to read:** `.planning/STATE.md`, `skills/gsd-phase-loop/SKILL.md`
- **Read first:** Capture all status values and transitions observed in state tools.
- **Action:** Create `docs/STATE-FSM.md` with a state-transition table and Mermaid diagram.
- **Verify:** `grep` confirms the table lists every `status` value used in `state.ts`.

### Wave 3: Skill Surface

#### T6 — Rewrite `gsd-phase-loop` as the full reference skill

- **Files to read:** `skills/gsd-phase-loop/SKILL.md`
- **Read first:** Identify what must stay canonical (workflow diagram, artifact definitions, conventions).
- **Action:** Trim the skill to a clean reference: overview → artifact index → phase-loop diagram → quick-links to other skills and references.
- **Verify:** Skill file is under 250 lines and links to `gsd-quick-start`, `gsd-decision-helper`, and `references/`.

#### T7 — Create `gsd-quick-start` skill

- **Files to read:** `skills/gsd-phase-loop/SKILL.md`, `skills/gsd-phase-loop/init.sh`
- **Read first:** Find the minimal path from zero to first phase.
- **Action:** Write `skills/gsd-quick-start/SKILL.md` covering install → init → first discuss-phase in under 100 lines.
- **Verify:** A reader can follow it without opening the full reference skill.

#### T8 — Create `gsd-decision-helper` skill

- **Files to read:** `skills/gsd-phase-loop/SKILL.md`, `docs/STATE-FSM.md`
- **Read first:** Extract the decision trees: "What do I do now?" and "Which subagent do I call?"
- **Action:** Write `skills/gsd-decision-helper/SKILL.md` as a state-to-action lookup with examples.
- **Verify:** Skill references `gsd_next_action` and links to the FSM doc.

#### T9 — Add references directory to `gsd-phase-loop`

- **Action:** Move reusable reference fragments from the monolithic skill into `skills/gsd-phase-loop/references/`:
  - `artifact-index.md`
  - `transition-table.md`
  - `tool-matrix.md`
- **Verify:** Each reference is linked from at least one skill variant.

### Wave 4: Test & CI

#### T10 — Add test runner and npm scripts

- **Files to read:** `package.json`, `extensions/gsd-commands/*.test.ts`
- **Read first:** Confirm no test framework is present and note ad-hoc assertion style.
- **Action:**
  - Add `vitest` and `@vitest/coverage-v8` as dev dependencies.
  - Convert manual `.test.ts` files to Vitest syntax.
  - Add `scripts`: `test`, `test:watch`, `typecheck`, `lint`.
- **Verify:** `npm test` passes; `npm run typecheck` passes.

#### T11 — Add CI workflow

- **Action:** Create `.github/workflows/ci.yml` running Node LTS, `npm ci`, `npm run typecheck`, `npm test`.
- **Verify:** Workflow file is valid YAML and references the correct scripts.

#### T12 — Verify and write summary

- **Action:** Run `gsd_verify` for Phase 03.
- **Verify:** All must-haves pass.
- **Output:** `.planning/phases/03-architecture-and-skill-rework/03-SUMMARY.md`.

## Acceptance Criteria

- [ ] `registry.ts` exists and state/backlog/workstream tools use it.
- [ ] Existing state/backlog/workstream tests pass unchanged.
- [ ] `gsd-hooks` is split into focused modules; extension still loads.
- [ ] `gsd_next_action` returns the structured object and suggests valid actions for each state.
- [ ] `docs/STATE-FSM.md` documents all status values and transitions.
- [ ] Three skill variants exist and cross-link.
- [ ] `npm test`, `npm run typecheck`, and CI workflow exist.
- [ ] Phase verification passes.

## Deferred

- Replacing `intercom` with `contact_supervisor` in researcher/planner agents.
- npm package publishing.
- Non-gsd specialist agent review in `fifa.ai`.
