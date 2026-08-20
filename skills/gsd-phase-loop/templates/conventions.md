# Project Conventions

This project uses the **GSD (Git. Ship. Done.)** phase-loop workflow. These conventions apply to all plans, artifacts, commits, and verification.

## GSD Terminology

| Term | Meaning | Analogous to (do not use) |
| ------ | --------- | --------------------------- |
| **Milestone** | A shippable body of work composed of phases | epic, release |
| **Phase** | A single discussion→plan→execute→verify→ship cycle | story, sprint |
| **Plan** | An executable document (`<NN>-<PP>-PLAN.md`) with 2–3 tasks | sub-task, ticket |
| **Wave** | A group of plans that can execute in parallel | batch |
| **Decision** | A locked choice captured in `CONTEXT.md` (ID: `D-<NN>-MM`) | assumption |

## Artifact Locations

All GSD artifacts live under `.planning/`:

```
.planning/
├── PROJECT.md                         # Project identity, core value, architecture
├── ROADMAP.md                         # Milestones + phases + goals
├── REQUIREMENTS.md                    # Numbered acceptance criteria (REQ-XX)
├── STATE.md                           # Current position; read FIRST each session
├── CONVENTIONS.md                     # This file — GSD workflow conventions
├── config.json                        # Workflow configuration
├── MILESTONES.md                      # Archived milestone summaries
├── LEARNINGS.md                       # Cross-phase learnings
├── codebase/
│   └── MAPPING.md                     # Codebase map from onboarding
└── phases/
    └── <NN>-<slug>/                   # One directory per phase
        ├── <NN>-CONTEXT.md            # Locked decisions from discuss step
        ├── <NN>-RESEARCH.md           # Research findings
        ├── <NN>-VALIDATION.md         # Plan-checker validation (optional)
        ├── <NN>-<PP>-PLAN.md          # Executable plan(s)
        ├── <NN>-<PP>-SUMMARY.md       # Execution record(s)
        └── <NN>-VERIFICATION.md       # Phase verification report
```

## Naming Conventions

- **Phase directory:** `<NN>-<slug>/` — two-digit phase number, kebab-case slug  
  Example: `01-auth`, `12-admin-ux`
- **Phase artifacts:** `<NN>-<type>.md`  
  Example: `01-CONTEXT.md`, `01-RESEARCH.md`
- **Plan artifacts:** `<NN>-<PP>-PLAN.md` and `<NN>-<PP>-SUMMARY.md`  
  Example: `01-01-PLAN.md`, `01-02-SUMMARY.md`
- **Decision IDs:** `D-<NN>-MM`  
  Example: `D-01-01`, `D-01-02`
- **Requirement IDs:** `REQ-XX`  
  Example: `REQ-01`, `REQ-12`

## Plan Structure

Every `PLAN.md` file must include YAML frontmatter and XML-structured tasks:

```markdown
---
phase: <NN>
plan: <PP>
wave: 1
depends_on: []
files:
  - path/to/file.ext
requirements:
  - REQ-XX
must_haves:
  truths:
    - "[Verifiable truth about the code]"
  artifacts:
    - "[File or export that must exist]"
  key_links:
    - "[Connection that must work]"
---
```

Tasks use these fields:

- **Type:** `auto` or `checkpoint:human-verify`
- **Files:** exact files to read before acting
- **Read first:** what to look for in those files
- **Action:** implementation instructions in prose (no fenced code blocks)
- **Verify:** automated command or manual check
- **Acceptance criteria:** measurable completion state

## Commit Conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

- Format: `<type>(<scope>): <subject>`
- Use phase/plan scope when applicable: `feat(01-01): add auth middleware`
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- Commit atomically per task, not per plan unless the plan is a single task

## Workflow Rules

1. **Read `STATE.md` first** every session.
2. **Registry files are mutated only through dedicated host-side tools.** Never use the `write` tool or direct file edits on `.planning/STATE.md`, `.planning/BACKLOG.md`, or `.planning/WORKSTREAMS.md`.
   - State transitions: `gsd_state_load`, `gsd_state_update`, `gsd_state_advance`, `gsd_state_progress`, `gsd_next_action`
   - Backlog: `gsd_backlog`
   - Workstreams: `gsd_workstream`
   - `gsd_state_advance` automatically recalculates `progress` when completing a phase or plan.
   - If progress still looks stale, call `gsd_state_progress` — do not edit `STATE.md` directly.
   - See the GSD tool matrix in `skills/gsd-phase-loop/references/tool-matrix.md` for input/output details.
3. **Honor locked decisions** (`D-<NN>-MM` in `CONTEXT.md`) exactly; never silently override them.
4. **Deferred ideas** never appear in plans. Capture them in `BACKLOG.md` via `gsd_backlog`.
5. **Wave order is fixed:** do not run a plan before its `depends_on` plans are complete.
6. **Every plan must map to at least one `REQ-XX`.**
7. **Plans are prompts, not documents that become prompts** — write actionable tasks, not descriptions.
8. **Verification is adversarial:** `gsd-verifier` checks actual code against `must_haves`, not claims.

## Research & Planning Flow

```
Discuss → Research → Plan → (optional Plan Check) → Execute → Verify → Ship
```

- **Discuss:** produces `CONTEXT.md` with locked decisions
- **Research:** produces `RESEARCH.md` with stack, patterns, pitfalls
- **Plan:** produces one or more `PLAN.md` files with waves and `must_haves`
- **Execute:** produces `SUMMARY.md` per plan, with atomic commits
- **Verify:** produces `VERIFICATION.md` with passed/gaps_found/human_needed verdict

## Project-Specific Overrides

If a project-specific `AGENTS.md` or `SYSTEM.md` exists in the repo root, its directives take precedence over these conventions. Note any overrides below as they are established.

### Established Overrides

- *None yet — add project-specific overrides here as decisions are locked.*

---
*Last updated: <DATE>*
