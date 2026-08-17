# GSD Core for pi

> Git. Ship. Done.

A spec-driven development workflow adapted from [GSD Core](https://github.com/open-gsd/gsd-core) for pi's native subagent and extension system. Prevents **context rot** — the quality degradation that accumulates as an AI fills its context window — by running all heavy research, planning, execution, and verification in fresh-context subagents while the orchestrator stays lean.

## What it does

Each milestone repeats a five-step loop, one phase at a time:

```
Init → Discuss → Plan → Execute → Verify → Ship → (repeat)
```

- **Discuss** — capture implementation decisions before anything is planned
- **Plan** — research, decompose, and verify the fit in a fresh context window
- **Execute** — run plans in parallel waves; each executor starts with a clean context
- **Verify** — goal-backward analysis against the actual codebase
- **Ship** — create the PR, archive the phase, repeat

## Install

```bash
# Global install (available in all projects)
pi install /path/to/gsd-package

# Project-local install (shared with team via .pi/settings.json)
pi install -l /path/to/gsd-package
```

## Quick start

### New project

```bash
# 1. Scaffold
cd my-project
bash ~/.pi/agent/skills/gsd-phase-loop/init.sh

# 2. Fill in the scaffolded files
#    - .planning/PROJECT.md
#    - .planning/ROADMAP.md
#    - .planning/REQUIREMENTS.md

# 3. Start the phase loop
#    In pi: "run phase 1"
```

### Existing project (onboarding)

```bash
# 1. In pi, say: "onboard this project"
#    This spawns gsd-phase-researcher to map the codebase.

# 2. Review the generated .planning/codebase/MAPPING.md
#    Validate: overview, architecture, tech debt — fix anything wrong.

# 3. pi generates PROJECT.md, ROADMAP.md, REQUIREMENTS.md, and CONVENTIONS.md from the map.
#    Review and adjust the proposed milestones/phases and project conventions.

# 4. Start the phase loop
#    In pi: "run phase 1"
```

The onboarding process:

1. **Map** — `gsd-phase-researcher` analyzes the codebase (stack, architecture, conventions, entry points, tech debt) and writes `.planning/codebase/MAPPING.md`
2. **Validate** — you review the map, correct inaccuracies, state your priorities
3. **Generate** — pi derives `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `CONVENTIONS.md` from the validated map
4. **Approve** — you review the proposed milestones/phases and conventions before work begins

### Prompt commands

GSD registers pi prompt templates (`/gsd-onboard`, `/gsd-research`, `/gsd-plan`, `/gsd-execute`, `/gsd-verify`) that expand into the correct `subagent({ workflowScript: ... })` call with `output` + `gate`. Use them instead of hand-rolling workflow scripts.

```
/gsd-onboard C:/Sources/my-project C:/Sources/my-project/.planning/codebase/MAPPING.md
/gsd-research C:/Sources/my-project C:/Sources/my-project/.planning/phases/01-foo/01-RESEARCH.md
```

Use forward slashes in paths. See `prompts/` in this package.

### Command tools

For even more reliability, the `gsd-commands` extension registers typed tools the agent can call directly:

**Orchestration tools** (return a prepared `subagent()` call):
- `gsd_onboard({ repoPath, outputPath })`
- `gsd_research({ repoPath, outputPath, scope? })`
- `gsd_plan({ repoPath, inputFiles, outputPath })`
- `gsd_execute({ repoPath, planPath, outputPath })`
- `gsd_verify({ repoPath, phaseDir, outputPath })`

Each tool validates the inputs, resolves absolute paths, creates the output directory, and returns the exact `subagent({ workflowScript: ... })` call. The orchestrator agent then invokes it directly and waits for completion, removing hand-rolled workflow-script construction and copy-paste.

**State-management tools** (host-side file operations on `.planning/STATE.md`):
- `gsd_state_load({ repoPath })` — returns parsed frontmatter + body
- `gsd_state_update({ repoPath, field, value })` — atomic dot-notation frontmatter update
- `gsd_state_advance({ repoPath, operation, phase, plan?, phaseName?, nextAction? })` — phase/plan lifecycle transitions (`begin-phase`, `complete-plan`, `complete-phase`)
- `gsd_state_progress({ repoPath })` — recalculate `progress.*` from `.planning/phases/`

**Backlog tool** (host-side file operations on `.planning/BACKLOG.md`):
- `gsd_backlog({ repoPath, operation, ... })` — list / add / update / close / promote backlog items

These run directly in the extension (not in a subagent), atomically rewrite the target file, and return JSON. They eliminate the formatting drift and missed-updates that come from asking agents to `write` the whole file.

## Requirements

- `pi-subagents` — `pi install npm:pi-subagents`
- pi's native tools: `runs.run`, `runs.all`, `lens_diagnostics`

## How it works

### The `.planning/` directory

```
.planning/
├── PROJECT.md                          # Project identity and core value
├── ROADMAP.md                          # Milestone + phase listing with goals
├── REQUIREMENTS.md                     # Numbered acceptance criteria (REQ-IDs)
├── CONVENTIONS.md                      # GSD workflow conventions for this project
├── STATE.md                            # Living position tracker (read this FIRST)
├── BACKLOG.md                          # Pending ideas, todos, tech debt
├── config.json                         # Workflow configuration
└── phases/
    └── <NN>-<slug>/                    # One directory per phase
        ├── <NN>-CONTEXT.md             # Implementation decisions (discuss)
        ├── <NN>-RESEARCH.md            # Research findings (plan)
        ├── <NN>-VALIDATION.md          # Plan validation report (optional)
        ├── <NN>-<PP>-PLAN.md           # Executable plan (one per plan)
        ├── <NN>-<PP>-SUMMARY.md        # Execution record (one per plan)
        └── <NN>-VERIFICATION.md        # Phase verification report (verify)
```

### The agents

Each agent is a focused pi-subagent with its own system prompt and tool allowlist. They run in **fresh context** — no session history, only the artifacts they need.

#### Phase loop

| Agent | Role | What it does |
|-------|------|-------------|
| `gsd-discuss` | Interactive decision capture | Identifies gray areas, presents to user via `ask_user_question`, deep-dives each with Socratic questioning, produces CONTEXT.md with locked decisions |
| `gsd-phase-researcher` | Researches the phase domain | Produces RESEARCH.md: standard stack, patterns, pitfalls, package legitimacy audit, architecture responsibility map |
| `gsd-planner` | Creates executable plans | Produces PLAN.md files with XML-structured tasks, wave-based dependency ordering, must_haves for verification |
| `gsd-executor` | Executes a single plan | Reads PLAN.md, makes atomic commits per task, auto-fixes bugs (4 deviation rules), escalates unapproved decisions |
| `gsd-verifier` | Verifies phase goal achievement | Adversarial goal-backward analysis: checks truths, artifacts (3 levels), key links, requirement coverage, anti-patterns |
| `gsd-plan-checker` | Validates plans before execution | 9-dimension quality gate: requirement coverage, task correctness, dependency acyclicity, scope sanity, context compliance |

#### Quick work

| Agent | Role | When to use |
|-------|------|-------------|
| `gsd-quick` | Lightweight single-task execution | Typos, missing imports, small refactors — work that fits in one prompt |
| `gsd-debug` | Structured debugging | Diagnose issues: reproduce → isolate → fix → verify |

#### Milestone management

| Agent | Role | When to use |
|-------|------|-------------|
| `gsd-milestone-complete` | Archive milestone | Audit, archive phases, tag release, update state |
| `gsd-milestone-summary` | Generate milestone summary | Comprehensive summary from all phase artifacts for onboarding |

#### Session management

| Agent | Role | When to use |
|-------|------|-------------|
| `gsd-pause` | Save session state | Write HANDOFF.json + .continue-here.md for later resumption |
| `gsd-resume` | Restore session | Read handoff state and resume work |

### The extension (hooks)

GSD's hook behavior implemented as a pi extension using the event system:

| Hook | Event | Purpose |
|------|-------|---------|
| Context monitor | `turn_end` | Warns at 35% remaining (wrap up) and 25% remaining (stop now) |
| Phase boundary | `tool_result` | Reminds to update STATE.md when `.planning/` files are modified |
| Commit validation | `tool_call` | Warns when `git commit` messages don't follow Conventional Commits |
| Status display | `session_start` + `turn_end` | Shows milestone, phase, and progress in pi's footer |

### The skill

`gsd-phase-loop` ties everything together. When you say "run phase N" in pi, the skill orchestrates:

1. **Discuss** — You and pi discuss implementation decisions → `<NN>-CONTEXT.md`
2. **Plan** — Spawns `gsd-phase-researcher` → `gsd-planner` → optional `gsd-plan-checker`
3. **Execute** — For each wave, spawns `gsd-executor` subagents in parallel via `runs.all`
4. **Verify** — Spawns `gsd-verifier` to check the actual codebase against must_haves
5. **Ship** — Create PR, update STATE.md, advance to next phase

## Wave-based parallel execution

Plans declare dependencies in frontmatter:

```yaml
wave: 2
depends_on: ["01-01"]
```

The skill groups plans into waves:
- **Wave 1**: plans with no dependencies → run in parallel
- **Wave 2**: plans depending on Wave 1 → run after Wave 1 completes
- etc.

Each executor within a wave gets a fresh context window with only its specific plan and phase context.

## Goal-backward methodology

GSD plans backward from outcomes, not forward from tasks:

1. **Goal** → "Working chat interface" (outcome, not task)
2. **Truths** → "What must be TRUE?" (observable behaviors)
3. **Artifacts** → "What must EXIST?" (concrete files)
4. **Wiring** → "What must be CONNECTED?" (integration points)
5. **Key links** → "Where will this break?" (critical connections)

This produces `must_haves` in plan frontmatter — the contract the verifier checks against.

## STATE.md — the spine

Every workflow reads STATE.md first and updates it after significant actions. The extension displays its frontmatter in pi's footer:

```
v2.0 [██░░░░░░░░] 20% · Phase 4.5 executing
```

Lifecycle scenes:
- `active_phase` set → "Phase 4.5 executing"
- Idle + `next_action` → "next execute-phase 4.5"
- `percent: 100` → "milestone complete"

## When to use

**Use when:**
- Multi-file features or cross-cutting refactors
- Work that spans multiple sessions
- Complex domains requiring research before planning
- Any task where context rot is a real risk

**Skip when:**
- Single-file fixes, typles, or trivial changes
- Work that fits in one prompt + one agent turn
- Exploratory/spike work with no clear spec

## Comparison with upstream GSD Core

| Feature | GSD Core (Claude Code) | GSD Core for pi |
|---------|----------------------|-----------------|
| Agents | `agents/*.md` | `~/.pi/agent/agents/gsd-*.md` |
| Hooks | `hooks/*.js` (Claude Code hooks API) | `extensions/gsd-hooks/index.ts` (pi events) |
| State | `.planning/` + `STATE.md` | Same |
| Conventions | Scattered in docs/agents | `.planning/CONVENTIONS.md` + docs |
| CLI tools | `gsd-tools.cjs` (Node CLI) | `gsd-commands` extension / prompt templates (pi tools) |
| Multi-runtime | Claude Code, Codex, Cursor, etc. | pi only |
| Wave execution | Parallel via Claude Code subagents | Parallel via `runs.all` |

### Tools architecture: `gsd-tools.cjs` vs. pi-native tools

Upstream GSD Core ships a single Node CLI — `gsd-tools.cjs` — with ~20 command families (`state`, `phase`, `roadmap`, `graphify`, `intel`, `backlog`, etc.) and a `--raw` machine-readable mode. It is powerful, but experience shows that **giving a single mega-CLI to an agent is a reliability footgun**: agents routinely pick the wrong subcommand, invent flags, misplace positional arguments, or fail to parse the human-readable output, which costs extra round trips and sometimes corrupts `STATE.md`.

The pi port deliberately avoids that surface for agent-facing work. Instead it uses:

- **Typed pi tools** (`extensions/gsd-commands/index.ts`) — one focused tool per action, with JSON Schema validation, automatic path resolution, and explicit `output`/`gate` wiring.
- **Prompt templates** (`prompts/gsd-*.md`) — for direct human invocation from the editor.
- **Agent system prompts** — each agent knows only the artifact format it produces.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Monolithic `gsd-tools.cjs`** | Single source of truth; rich output; `--raw` JSON; state-machine verbs (`phase insert`, `state patch`); easy for humans/scripts | Agents misuse subcommands/flags; output parsing errors; harder to validate; one bug breaks every call site |
| **Separate pi tools** | Typed inputs validated by pi; one purpose each; harder to hallucinate flags; clear output paths and gates; composable | More surface to maintain; no centralized state machine; duplicated path-resolution logic |

#### Recommended stance for this repo

Keep the **agent-facing** surface as focused pi tools (or a small family of MCP-style tools), not as one big CLI. If a `gsd-tools`-equivalent is added for humans, scripts, or installers, expose it as a thin wrapper around the same fine-grained functions, and **do not teach agents to call the wrapper directly**. The current `gsd-commands` extension already follows this pattern: it returns the exact `subagent({ workflowScript: ... })` call, validated and resolved, so the orchestrator executes it rather than asking a subagent to figure it out.

This keeps the failure modes local: a mis-invoked tool fails one step, not the whole state machine.

## Feature status

### ✅ Implemented

| Feature | pi implementation |
|---------|------------------|
| Phase loop (Discuss→Plan→Execute→Verify→Ship) | `gsd-phase-loop` skill |
| Interactive discuss with user decisions | `gsd-discuss` agent + `ask_user_question` |
| Fresh-context subagents per step | All agents use `context: 'fresh'` |
| Wave-based parallel execution | `runs.all` per wave, sequential across waves |
| Goal-backward methodology | `gsd-planner` + `gsd-verifier` |
| Locked decisions (D-NN-MM) | `gsd-discuss` → CONTEXT.md → planner enforcement |
| Atomic commits per task | `gsd-executor` commit protocol |
| Deviation rules (auto-fix bugs, escalate architecture) | `gsd-executor` built-in rules |
| Quick tasks (no phase overhead) | `gsd-quick` agent |
| Structured debugging | `gsd-debug` agent |
| Milestone completion + audit | `gsd-milestone-complete` agent |
| Milestone summary generation | `gsd-milestone-summary` agent |
| Pause/Resume session state | `gsd-pause` + `gsd-resume` agents |
| Onboarding (codebase mapping) | `gsd-phase-researcher` recon mode |
| Context rot monitoring | `gsd-hooks` extension (turn_end) |
| Phase boundary reminders | `gsd-hooks` extension (tool_result) |
| Commit validation | `gsd-hooks` extension (tool_call) |
| Status display in footer | `gsd-hooks` extension (setStatus) |
| `.planning/` artifact templates | 12 templates in `templates/` |
| Project conventions artifact | `.planning/CONVENTIONS.md` generated by `init.sh`; read by all agents |
| Code review | `gsd-code-review` agent — plan compliance, requirement coverage, quality |
| Security audit | `gsd-security-audit` agent — OWASP ASVS + threat model |
| Autonomous execution | `gsd-autonomous` agent — full loop without human intervention |
| Capture | `gsd-capture` agent — ideas, todos, decisions from conversation |
| Backlog management | `gsd_backlog` tool + `gsd-backlog` agent — triage and promote items |
| Learnings | `gsd-learnings` agent — cross-phase learning accumulation |
| Retrospective | `gsd-retrospective` agent — post-phase what went well / what didn't |
| UI research | `gsd-ui-researcher` agent — interactive UI-SPEC.md design contract |
| UI checking | `gsd-ui-checker` agent — 6-dimension UI-SPEC.md validation |
| UI audit | `gsd-ui-auditor` agent — 6-pillar visual audit of implemented UI |

### ❌ Not yet implemented

| Feature | GSD Command | Notes |
|---------|-------------|-------|
| **Audit UAT** | `/gsd-audit-uat` | Cross-phase UAT audit |
| **Audit milestone** | `/gsd-audit-milestone` | Milestone definition-of-done verification |
| **Workspace management** | `/gsd-workspace` | Multi-repo, worktree isolation |
| **Workstreams** | `gsd-tools workstream` | Parallel feature work on same repo |
| **Threads** | `/gsd-thread` | Discussion threads |
| **Broken windows** | `gsd-tools windows` | Tech debt tracking ledger |
| **Graphify** | `gsd-tools graphify` | Knowledge graph for codebase intelligence |
| **Intel** | `gsd-tools intel` | Codebase intelligence queries |
| **MVP mode** | `/gsd-mvp-phase` | Vertical-slice planning |
| **Walking skeleton** | `/gsd-walking-skeleton` | End-to-end tracer first |
| **Cross-AI review** | `/gsd-plan-review-convergence` | External AI CLI review |
| **Plan convergence** | `/gsd-plan-review-convergence` | Review-replan loop until clean |
| **Decimal phases** | `gsd-tools phase` | Sub-phase numbering (4.1, 4.2) |
| **Effort estimation** | `gsd-tools effort` | Token budget calibration |
| **Config hot-reload** | `FileChanged` hook | Mid-session config updates |
| **Read injection scanning** | `gsd-read-injection-scan.js` | Scans Read output for injected instructions |
| **Prompt guard** | `gsd-prompt-guard.js` | Scans `.planning/` writes for injection |
| **Read guard** | `gsd-read-guard.js` | Prevents Edit/Write on unread files |
| **Workflow guard** | `gsd-workflow-guards.js` | Detects edits outside GSD workflow |
| **Session state tracking** | `gsd-session-state.sh` | Shell-based session tracking |
| **Update check** | `/gsd-update` | Background update check |
| **Plan insertion** | `gsd-tools phase insert` | Insert phase between existing phases |
| **Phase removal** | `gsd-tools phase remove` | Remove a phase cleanly |
| **Roadmap editing** | `gsd-tools roadmap` | Add/remove/edit roadmap entries |
| **Quick tasks** | `gsd-tools quick-tasks` | Quick task tracking |
| **Eval** | `gsd-tools eval` | Evaluation/assessment tools |
| **Spec phase** | `/gsd-spec-phase` | Pre-planning spec with edge-completeness and prohibition probes |
| **Secure phase** | `/gsd-secure-phase` | Security-focused phase planning |
| **Forensics** | `/gsd-forensics` | Post-incident investigation and recovery |
| **MemPalace** | `/gsd-mempalace-capture`, `/gsd-mempalace-recall` | Long-term structured memory |
| **Ingest docs** | `/gsd-ingest-docs` | ADR/doc classification, synthesis, verification |
| **AI integration phase** | `/gsd-ai-integration-phase` | AI/ML integration wizard |
| **Plan bounce** | `gsd-tools bounce` | External validation of plans before execution |
| **Cross-phase regression gate** | `gsd-tools query regression` | Automated cross-phase regression check |
| **Smart entry / next** | `/gsd-next` | Situation classifier + recommended route |
| **Stats / progress dashboard** | `/gsd-stats`, `/gsd-progress` | Project metrics and progress read-out |
| **Settings / config management** | `/gsd-settings`, `/gsd-config` | User/runtime configuration commands |
| **Pause-work / resume-work** | `/gsd-pause-work`, `/gsd-resume-work` | Full session-management commands (agents exist, but no command wrapper) |
| **Namespace meta-skills** | `/gsd-workflow`, `/gsd-project`, `/gsd-quality`, `/gsd-context`, `/gsd-manage`, `/gsd-ideate` | Two-stage hierarchical command routing |

### 🔄 Partial / workarounds

| Feature | Status | Workaround |
|---------|--------|------------|
| Plan validation | Partial | `gsd-plan-checker` covers 9 dimensions but doesn't auto-revise |
| Nyquist validation | Partial | Architecture section exists in RESEARCH.md but no enforcement |
| TDD mode | Partial | `gsd-executor` supports TDD tasks but no dedicated mode |
| Package legitimacy | Partial | `gsd-phase-researcher` can check but no gate enforcement |
| UAT / human verification | Partial | `checkpoint:human-verify` task type exists but no `/gsd-audit-uat` command |
| Multi-model | Partial | Agents inherit parent model, no per-agent tiering |

## License

MIT
