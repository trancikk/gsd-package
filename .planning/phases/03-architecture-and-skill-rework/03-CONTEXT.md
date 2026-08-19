# Phase 03 — Architecture & Skill Rework

## Goal

Rework the `gsd-package` architecture so the GSD tooling is easier to maintain, test, and adopt. Reduce duplication in planning-state management, split the monolithic hooks extension, replace the single giant skill with a focused skill family, and add a state-aware next-action tool that surfaces valid transitions from `STATE.md`.

## Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D-03-01 | Split `skills/gsd-phase-loop/SKILL.md` into three variants: `gsd-quick-start`, `gsd-phase-loop` (full reference), and `gsd-decision-helper`. | The current skill is too long for quick lookup and too shallow for canonical reference. Separate variants let users pick the right level of detail. |
| D-03-02 | Add a `gsd_next_action` pi tool that returns a structured object: `{ valid_actions, recommended_action, reason, missing_prerequisites }`. | An object is parseable by orchestrator logic and readable by humans. It keeps the tool useful both as a prompt input and as a UI signal. |
| D-03-03 | `gsd_next_action` is **suggest-only**; it does not enforce transitions. | The orchestrator or user retains final control. Hard-gating can be added later if needed. |
| D-03-04 | Include the deeper architecture cleanups from the codebase map in this phase: shared `.planning/` registry, modular hooks, test runner, typecheck/lint, and CI. | These all improve maintainability and are prerequisites for safely shipping the skill/FSM rework. |
| D-03-05 | Keep the public APIs of `gsd_state_*`, `gsd_backlog`, and `gsd_workstream` stable while extracting the shared registry module. | Existing consumers (including `fifa.ai`) should not break. Internal refactoring only. |
| D-03-06 | Split `extensions/gsd-hooks/index.ts` into focused internal modules without changing the registered hooks or their behavior. | Improves testability and makes each guard independently understandable. |
| D-03-07 | Use a lightweight test runner (Vitest) rather than adding a custom one. | Vitest is native-ESM friendly, works with `tsx`, and gives us coverage/watch for free. |
| D-03-08 | References in skills use inline markdown links and a `references/` directory, not frontmatter-only links. | Frontmatter is invisible during skill invocation; inline links are discoverable while reading. |

## Non-goals

- No breaking changes to existing agent prompts or extension tool signatures.
- No migration of `fifa.ai` beyond keeping agent/skill copies in sync if needed.
- No rewrite of the pi extension API layer.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Refactoring state tools introduces regressions in `STATE.md`/`BACKLOG.md`/`WORKSTREAMS.md` handling. | Keep existing tests passing, add new tests for the registry module, and verify all three tools round-trip. |
| Splitting the skill scatters information and users land on the wrong variant. | Add a top-level index in each skill pointing to the others, and keep `gsd-phase-loop` as the canonical reference. |
| `gsd_next_action` returns invalid recommendations after state format changes. | Centralize state-shape knowledge in the registry module and validate against the current schema version. |
| CI cannot run Windows-specific git/branch tests. | Mark branch-dependent tests as optional in CI or mock `child_process`. |

## Deferred

- Replacing `intercom` with `contact_supervisor` in `gsd-phase-researcher.md` and `gsd-planner.md`.
- Reviewing non-gsd specialist agents in `fifa.ai` for autonomy.
- Publishing the package to npm.

---
*Last updated: 2026-08-19*
