# Codebase Mapping: gsd-core (GSD Core for pi)

**Generated:** 2026-08-18
**Purpose:** GSD onboarding map of the `gsd-package` repository
**Confidence:** HIGH — all file paths were read or listed directly from disk this session.

---

## 1. Project Overview

- **What it does:** `gsd-core` is a pi package that ports the GSD (Git. Ship. Done.) spec-driven phase-loop workflow to the pi agent runtime. It provides subagent prompts, pi extensions, skills, and prompt templates so multi-file projects can run Discuss → Research → Plan → Execute → Verify → Ship cycles in fresh-context subagents.
- **Core value:** Prevents context rot by keeping the orchestrator lean and pushing heavy research, planning, execution, and verification into focused, fresh-context subagents.
- **Target users:** pi users running multi-file or cross-cutting software projects who want spec-driven, verified delivery with state tracking.

---

## 2. Tech Stack

### Language & Runtime

| Component | Version | Purpose |
| ----------- | --------- | --------- |
| TypeScript | 5.x (via `tsx`) | Extension and test source |
| Node.js | LTS required by pi | Runs extensions and manual tests |
| pi runtime | native | Loads extensions, skills, agents, prompts |

### Key Dependencies

| Package | Declared Version | Verified Latest | Purpose |
| --------- | ------------------ | ----------------- | --------- |
| `@earendil-works/pi-agent-core` | `^0.84.2` | 0.84.2 | Core pi agent types (`AgentToolResult`) |
| `@earendil-works/pi-coding-agent` | `^0.84.2` | 0.84.2 | Extension API types (`ExtensionAPI`, `ExtensionContext`) |
| `tsx` | `^4.23.12` | 4.23.12 | TypeScript execution for manual tests |
| `typebox` | `^1.3.15` | 1.3.16 | JSON Schema parameter validation for pi tools |

> Source: `package.json` [VERIFIED: C:/Sources/gsd-package/package.json]; registry versions verified with `npm view` this session.

### Build & Test

- **Build:** None — pi loads TypeScript extensions directly at runtime.
- **Test:** Manual `npx tsx <file>.test.ts` scripts; no centralized test runner or CI pipeline.
- **Lint:** None configured.

---

## 3. Architecture

### Repository Shape

```text
gsd-package/
├── .pi/                          # pi project-local settings
│   └── settings.json             # references parent package ("..")
├── .planning/                    # GSD planning artifacts
│   └── phases/
│       └── 02-mattpocock-gsd-adoption/   # Active/in-progress phase
├── agents/                       # Subagent system prompts (gsd-*.md)
├── docs/                         # Project docs and research
├── extensions/                   # pi extensions (TypeScript)
│   ├── gsd-commands/             # Typed workflow tools
│   ├── gsd-hooks/                # Event hooks / guards
│   └── gsd-save-response/        # /save-last command
├── prompts/                      # pi prompt templates (/gsd-*)
├── skills/                       # pi skills (user-invoked)
│   ├── gsd-phase-loop/           # Core workflow skill
│   └── <matt-pocock-skills>/     # Adopted helper skills
├── legacy/                       # Archived or superseded artifacts
├── package.json                  # pi package manifest
└── README.md                     # Feature inventory and usage
```

### Key Modules

| Module | Path | Responsibility |
| -------- | ------ | ---------------- |
| **gsd-commands extension** | `extensions/gsd-commands/index.ts` | Registers 9 typed pi tools (`gsd_onboard`, `gsd_research`, `gsd_plan`, `gsd_execute`, `gsd_verify`, `gsd_security_audit`, `gsd_prototype`, `gsd_arch_review`) plus state/backlog/workstream tools. Returns the exact `subagent()` call to the orchestrator. |
| **state tools** | `extensions/gsd-commands/state.ts` | Atomic read/update/advance/progress operations on `.planning/STATE.md`. |
| **backlog tools** | `extensions/gsd-commands/backlog.ts` | CRUD-style operations on `.planning/BACKLOG.md`. |
| **workstream tools** | `extensions/gsd-commands/workstream.ts` | Workstream registry + Git branch management in `.planning/WORKSTREAMS.md`. |
| **YAML helper** | `extensions/gsd-commands/yaml.ts` | Minimal frontmatter parser/stringifier; keeps the extension free of a full YAML dependency. |
| **path utils** | `extensions/gsd-commands/utils.ts` | Absolute-path resolution, cross-platform gate builder, atomic file write. |
| **gsd-hooks extension** | `extensions/gsd-hooks/index.ts` | Event-driven guards: context monitoring, phase-boundary reminders, Conventional Commit validation, prompt guard, read-injection scanner, workflow guard, status bar. |
| **status parser** | `extensions/gsd-hooks/status.ts` | Finds GSD root from cwd and parses/formats `STATE.md` for the status bar. |
| **gsd-save-response extension** | `extensions/gsd-save-response/index.ts` | `/save-last` and `/save-response` slash commands. |
| **phase-loop skill** | `skills/gsd-phase-loop/SKILL.md` | Canonical workflow documentation and subagent invocation patterns. |
| **artifact templates** | `skills/gsd-phase-loop/templates/` | 14 Markdown/JSON templates for `.planning/` artifacts. |
| **init helper** | `skills/gsd-phase-loop/init.sh` | Bash scaffold for new `.planning/` directories. |
| **agent prompts** | `agents/gsd-*.md` | 19 subagent system prompts consumed by `pi-subagents`. |
| **prompt templates** | `prompts/gsd-*.md` | Human-facing `/gsd-*` prompt templates that emit `subagent()` calls. |

### Data Flow

1. **Orchestrator** (parent turn in pi) reads `.planning/STATE.md` and decides the next action.
2. **Commands** — orchestrator calls a `gsd-commands` tool (or uses a `/gsd-*` prompt) to prepare a `subagent()` invocation.
3. **Subagent** runs with `context: 'fresh'`, reads only the artifacts in its task, and writes its output artifact (e.g., `RESEARCH.md`, `PLAN.md`, `SUMMARY.md`).
4. **Hooks** — `gsd-hooks` observes tool calls/results and warns on context rot, planning edits, injection patterns, or workflow inconsistencies.
5. **State tools** — orchestrator mutates `.planning/STATE.md` atomically after each transition.

### External Integrations

| Service | Purpose | Config Location |
| --------- | --------- | ----------------- |
| pi runtime | Loads extensions, skills, agents, prompts | `package.json` `pi` block |
| pi-subagents | Resolves `agents/*.md` as subagents | `package.json` `pi-subagents.agents` |
| npm registry | Dependency resolution | `package.json` / `package-lock.json` |
| Git (optional) | Workstream branches, commit reminders | Used by `workstream.ts` and `gsd-hooks` |

---

## 4. Code Conventions

### Naming

- Agent files: `gsd-<role>.md` (kebab-case).
- Phase directories: `<NN>-<slug>/` (two-digit number + kebab slug), e.g., `02-mattpocock-gsd-adoption`.
- Phase artifacts: `<NN>-<type>.md`, e.g., `02-RESEARCH.md`.
- Plan artifacts: `<NN>-<PP>-PLAN.md` and `<NN>-<PP>-SUMMARY.md`.
- Decision IDs: `D-<NN>-<MM>`.
- Requirement IDs: `REQ-XX`.

### File Organization Patterns

- **Extensions** are self-contained per feature with their own `package.json` and `index.ts` default export.
- **Skills** are Markdown SKILL.md documents, sometimes with a `references/` subdirectory.
- **Agent prompts** use YAML frontmatter (`name`, `description`, `tools`, `thinking`, `defaultContext`, `output`).
- **Templates** live under the skill that owns them; `init.sh` copies them into `.planning/`.

### Import Style

- Extensions use Node built-ins (`node:fs`, `node:path`, `node:child_process`) and pi types.
- Type validation uses `@sinclair/typebox` imported as `typebox` (the package on npm is `@sinclair/typebox` but this repo depends on the wrapper package `typebox` v1.3.15).

### Error Handling Patterns

- Extension tools throw on invalid state (e.g., missing `STATE.md`, missing backlog ID).
- `writeAtomic` in `utils.ts` writes to a temp file and renames; falls back to copy-then-unlink on Windows `EPERM`/`EBUSY`.
- Hooks catch errors silently when optional checks fail (e.g., git unavailable).

### Testing Patterns

- Manual `npx tsx <file>.test.ts` scripts that create temporary repos, exercise tools, and assert with `process.exit(1)` on failure.
- No automated CI, no test framework dependency (no Jest/Vitest/Mocha).

---

## 5. Entry Points

| Entry Point | Type | Location |
| ------------- | ------ | ---------- |
| pi package manifest | config | `package.json` [VERIFIED: C:/Sources/gsd-package/package.json] |
| Extensions registry | config | `package.json` → `pi.extensions` (3 entries) |
| Skills registry | config | `package.json` → `pi.skills` (single `./skills` folder) |
| Agents registry | config | `package.json` → `pi-subagents.agents` (single `./agents` folder) |
| gsd-commands tools | TypeScript | `extensions/gsd-commands/index.ts` [VERIFIED: C:/Sources/gsd-package/extensions/gsd-commands/index.ts:1-10] |
| gsd-hooks | TypeScript | `extensions/gsd-hooks/index.ts` [VERIFIED: C:/Sources/gsd-package/extensions/gsd-hooks/index.ts:1-14] |
| gsd-save-response | TypeScript | `extensions/gsd-save-response/index.ts` [VERIFIED: C:/Sources/gsd-package/extensions/gsd-save-response/index.ts:1-10] |
| Project init | bash | `skills/gsd-phase-loop/init.sh` [VERIFIED: C:/Sources/gsd-package/skills/gsd-phase-loop/init.sh:1-10] |

### Configuration Files

| File | Purpose |
| ------ | --------- |
| `package.json` | Declares extensions, skills, agents, dev dependencies |
| `.pi/settings.json` | Project-local pi package resolution (`{ "packages": [".."] }`) |
| `skills/gsd-phase-loop/templates/config.json` | Default GSD workflow config (models, flags, git behavior) |

---

## 6. Known Issues & Tech Debt

### 6.1 High-Severity Debt

| # | Issue | Location | Why It Matters |
| --- | ------- | ---------- | ---------------- |
| H1 | **No automated test runner or CI.** Tests are manual `npx tsx *.test.ts` scripts. | `extensions/gsd-commands/*.test.ts`, `extensions/gsd-hooks/status.test.ts` | Regressions in state/backlog/workstream logic are caught only by manual runs. |
| H2 | **Partial planning scaffold.** `.planning/` contains only `phases/02-mattpocock-gsd-adoption/`; missing `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `CONVENTIONS.md`, `BACKLOG.md`, `WORKSTREAMS.md`, `config.json`. | `.planning/` root | The repo that ships the GSD workflow does not itself use the full GSD scaffold. State tools and hooks cannot demonstrate canonical behavior without a `STATE.md`. |
| H3 | ~~**Dead legacy shell script.** `gsd-resolve.sh` resolves `gsd-tools.cjs` from a classic GSD install that does not exist in this repo.~~ | ~~`gsd-resolve.sh`~~ | Resolved in Phase 03: script deleted. |

### 6.2 Medium-Severity Debt

| # | Issue | Location | Why It Matters |
| --- | ------- | ---------- | ---------------- |
| M1 | **Agent registry may still contain interactive agents.** Phase 02 research found `gsd-discuss`, `gsd-backlog`, `gsd-ui-researcher`, `gsd-workstream`, and `gsd-grill` should not be registered as pi subagents, yet `agents/` still contains source files for some of them and downstream `.cursor/.pi` registries are out of scope of this repo. | `agents/`, `docs/research/mattpocock-gsd-integration.md` | Risk that an orchestrator spawns an interactive agent in a context with no user channel. |
| M2 | **Confusion-recovery boilerplate may persist in autonomous agents.** Phase 02 plan requires scrubbing all autonomous agents for `## Confusion Recovery` and user-question phrasing. | `agents/gsd-*.md` | Background subagents cannot observe user confusion; the instructions are unreachable noise. |
| M3 | **`typebox` dependency is a wrapper, not the canonical `@sinclair/typebox`.** Version 1.3.15 is installed; npm shows 1.3.16 available. | `package.json` | Could drift from upstream fixes; verify whether the wrapper package is actively maintained. |
| M4 | **No lint/typecheck script.** `package.json` has no `scripts` section. | `package.json` | No automated guard against TypeScript errors before commit. |

### 6.3 Low-Severity Debt

| # | Issue | Location | Why It Matters |
| --- | ------- | ---------- | ---------------- |
| L1 | **Hard-coded thresholds in hooks.** Context warning thresholds (35%, 25%) are magic numbers in `index.ts`. | `extensions/gsd-hooks/index.ts:34-35` | Harder to customize per project. |
| L2 | **Regex-based injection scanning.** Prompt/read guards use static regexes; can miss novel prompt-injection shapes and may false-positive. | `extensions/gsd-hooks/index.ts:44-67` | Security depth is limited to known patterns. |
| L3 | **`gsd-save-response` is unrelated to core workflow.** It is a convenience utility bundled into the same package. | `extensions/gsd-save-response/` | Increases surface area without contributing to the GSD loop. |
| L4 | **Manual test files are not discoverable by a test runner.** They use ad-hoc `assertEqual` helpers. | `extensions/gsd-commands/*.test.ts` | Maintenance burden if the project grows. |

### 6.4 TODO/FIXME Markers

No `TODO`, `FIXME`, `XXX`, or `HACK` markers were found in source files. The only references to these tokens are in verifier criteria and documentation templates (expected). [VERIFIED: grep across `*.{ts,md,sh,json}`]

---

## 7. Testing

- **Framework:** None — manual TypeScript scripts executed with `tsx`.
- **Config file:** None.
- **How to run:**

  ```bash
  npx tsx extensions/gsd-commands/state.test.ts
  npx tsx extensions/gsd-commands/backlog.test.ts
  npx tsx extensions/gsd-commands/workstream.test.ts
  npx tsx extensions/gsd-hooks/status.test.ts
  ```

- **Coverage:** Not measured.
- **CI/CD:** None.

### Test Structure

```text
extensions/
├── gsd-commands/
│   ├── state.test.ts        # STATE.md load/update/advance/progress round-trip
│   ├── backlog.test.ts      # BACKLOG.md add/list/update/close/promote
│   ├── workstream.test.ts   # WORKSTREAMS.md + Git branch lifecycle
│   └── yaml.ts              # YAML helper used by state tests
└── gsd-hooks/
    └── status.test.ts       # STATE.md parsing and status formatting
```

---

## 8. Build & Deploy

- **Build command:** None — pi consumes TypeScript extensions directly.
- **Run locally:** Install as a pi package:

  ```bash
  pi install /path/to/gsd-package        # global
  pi install -l /path/to/gsd-package     # project-local
  ```

- **Deploy:** Distributed as a local pi package; no published npm artifact.
- **CI/CD:** None.
- **Release process:** Manual git tag + README update; no automated versioning.

---

## 9. Deepening Opportunities (codebase-design vocabulary)

| Area | Current Shape | Problem | Recommended Deepening | Confidence |
| ------ | -------------- | --------- | ---------------------- | ------------ |
| **State mutations** | Scattered across `state.ts`, `backlog.ts`, `workstream.ts` | Each file re-implements file I/O, parsing, rendering, and atomic write. Bugs in path resolution or frontmatter handling are duplicated. | Extract a shared `.planning/` registry module with a small interface: `load(artifact)`, `save(artifact)`, `update(field, value)`. The three tools become adapters. | HIGH |
| **Hooks extension** | One large `index.ts` with many inline handlers | Guards, status, commit validation, and injection scanning are tightly coupled. One change to commit rules risks touching context-monitoring code. | Split into focused modules (`context-guard.ts`, `commit-guard.ts`, `injection-guard.ts`, `status-renderer.ts`) registered by a thin `index.ts`. | HIGH |
| **Agent prompts** | 19 standalone Markdown files | Shared vocabulary (deep modules, seams, goal-backward) is repeated in multiple prompts. Drift is likely. | Create a single `references/` vocabulary doc and have agents reference it via a pointer in their description, reducing duplication. | MEDIUM |
| **Test harness** | Ad-hoc scripts in each extension directory | No unified runner; no coverage; no CI gate. | Add a minimal test seam (e.g., Vitest or a tiny custom runner) so extensions share assertion/reporting logic. | MEDIUM |

---

## 10. GSD Onboarding Recommendations

1. **Run `init.sh`** to create the full `.planning/` scaffold (`PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `CONVENTIONS.md`, `BACKLOG.md`, `WORKSTREAMS.md`, `config.json`).
2. **Capture existing debt** in `BACKLOG.md` — prioritize H1 (test runner) and H2 (complete scaffold).
3. **Complete Phase 02** (`02-mattpocock-gsd-adoption`) before adding new agents/commands, since it cleans up the interactive/autonomous agent boundary.
4. **Add a `scripts` section** to `package.json` for typecheck, lint, and test commands.
5. ~~**Decide** whether `gsd-resolve.sh` should be deleted or moved to a `legacy/` directory to avoid onboarding confusion.~~ (Done in Phase 03.)

---

*Last updated: 2026-08-18*
