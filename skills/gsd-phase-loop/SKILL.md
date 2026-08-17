---
name: "gsd-phase-loop"
description: "Phase-loop workflow (Discuss→Plan→Execute→Verify→Ship) with .planning/ artifacts and GSD-native subagents for pi"
version: 6
created: "2026-08-10"
updated: "2026-08-11"
---

# GSD Phase Loop for pi

A spec-driven development workflow adapted from GSD Core for pi's native subagent system. Prevents context rot by running all heavy research, planning, execution, and verification in fresh-context subagents while the orchestrator stays lean.

**Requires:** `pi-subagents` extension (install via `pi install npm:pi-subagents`). GSD agents are registered at `~/.pi/agent/agents/gsd-*.md`.

**Optional:** `gsd-hooks` extension at `~/.pi/agent/extensions/gsd-hooks/` provides context monitoring, phase boundary detection, and commit validation (pi-native equivalent of GSD Core's hook system).

## When to Use

**Use when:**
- Multi-file features or cross-cutting refactors
- Work that spans multiple sessions
- Complex domains requiring research before planning
- Any task where context rot is a real risk

**Skip when:**
- Single-file fixes, typos, or trivial changes
- Work that fits in one prompt + one agent turn
- Exploratory/spike work with no clear spec

## The Loop

```
Init → Discuss → Plan → Execute → Verify → Ship → (repeat)
```

## GSD Agent Mapping

This skill uses GSD-native agents registered at `~/.pi/agent/agents/gsd-*.md`. Each agent is a pi-subagent with GSD-specific behavior:

| GSD Role | Agent Name | Tools | Thinking | Purpose |
|----------|------------|-------|----------|---------|
| **Researcher** | `gsd-phase-researcher` | read, grep, find, ls, bash, write, web_search, fetch_content, get_search_content | medium | Produces RESEARCH.md: domain analysis, stack, patterns, pitfalls |
| **Planner** | `gsd-planner` | read, grep, find, ls, bash, write, web_search, fetch_content | high | Produces PLAN.md files: task breakdown, waves, must_haves |
| **Executor** | `gsd-executor` | read, grep, find, ls, bash, edit, write | high | Executes plans: atomic commits, deviation handling |
| **Verifier** | `gsd-verifier` | read, grep, find, ls, bash, write | high | Produces VERIFICATION.md: goal-backward verification |
| **Plan Checker** | `gsd-plan-checker` | read, grep, find, ls, bash | high | Pre-execution plan validation: 9 quality dimensions |

### Agent files location

```
~/.pi/agent/agents/
├── gsd-phase-researcher.md
├── gsd-planner.md
├── gsd-executor.md
├── gsd-verifier.md
├── gsd-plan-checker.md
├── gsd-discuss.md
├── gsd-quick.md
├── gsd-debug.md
├── gsd-autonomous.md
├── gsd-milestone-complete.md
├── gsd-milestone-summary.md
├── gsd-pause.md
├── gsd-resume.md
├── gsd-code-review.md
├── gsd-security-audit.md
├── gsd-retrospective.md
├── gsd-ui-researcher.md
├── gsd-ui-checker.md
├── gsd-ui-auditor.md
├── gsd-capture.md
└── gsd-learnings.md
```

The table above lists the five core loop agents; the full set includes quick work, milestone management, session management, quality/review, knowledge capture, and UI agents listed under *Operations beyond the core phase loop* below.

---

## Directory Structure

```
.planning/
├── PROJECT.md                          # Project identity and core value
├── ROADMAP.md                          # Milestone + phase listing
├── REQUIREMENTS.md                     # Numbered acceptance criteria (REQ-IDs)
├── STATE.md                            # Living position tracker (read this FIRST)
├── BACKLOG.md                          # Pending ideas, todos, tech debt
├── CONVENTIONS.md                      # GSD workflow conventions for this project
├── MILESTONES.md                       # Archived milestone summaries
├── LEARNINGS.md                        # Cross-phase learnings
├── config.json                         # Workflow configuration
├── codebase/                           # Codebase maps (onboarding output)
│   ├── MAPPING.md                      # Full codebase map
│   └── [area]-DEEP.md                  # Optional deep dives
├── debug/                              # Debug session files
│   └── <slug>.md
├── todos/                              # Pending / deferred todos
│   └── pending/
│       └── <slug>.md
└── phases/
    └── <NN>-<slug>/                    # One directory per phase
        ├── <NN>-CONTEXT.md             # Implementation decisions (discuss)
        ├── <NN>-RESEARCH.md            # Research findings (plan)
        ├── <NN>-VALIDATION.md          # Plan validation report (optional)
        ├── <NN>-UI-SPEC.md             # UI design contract (optional)
        ├── <NN>-RETROSPECTIVE.md       # Post-phase retrospective (optional)
        ├── <NN>-<PP>-PLAN.md           # Executable plan (one per plan)
        ├── <NN>-<PP>-SUMMARY.md        # Execution record (one per plan)
        ├── <NN>-VERIFICATION.md        # Verification report (verify)
        └── .continue-here.md           # Resume instructions (if paused)
```

Templates for all artifacts are in the `templates/` directory of this skill.

---

## Commands

GSD ships pi prompt templates in `prompts/` and typed tools via the `gsd-commands` extension. Either avoids hand-rolling workflow scripts and supplies the correct `output` + `gate` pattern.

| Command / Tool | Arguments | Purpose |
|----------------|-----------|---------|
| `/gsd-onboard` / `gsd_onboard` | `<repo-path> <output-path>` | Produce MAPPING.md for an existing codebase |
| `/gsd-research` / `gsd_research` | `<repo-path> <output-path> [scope]` | Produce RESEARCH.md for a phase |
| `/gsd-plan` / `gsd_plan` | `<repo-path> <context-files> <output-path>` | Produce PLAN.md from context/research |
| `/gsd-execute` / `gsd_execute` | `<repo-path> <plan-path> <output-path>` | Execute a plan, produce SUMMARY.md |
| `/gsd-verify` / `gsd_verify` | `<repo-path> <phase-dir> <output-path>` | Produce VERIFICATION.md for a phase |

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/phases/01-foo/01-RESEARCH.md`).

Prefer the **tools** (`gsd_research`, `gsd_plan`, etc.) when the orchestrator agent is driving the loop — they validate inputs, resolve absolute paths, create output directories, and return the exact subagent call. Prefer the **prompt templates** (`/gsd-research`, etc.) when invoking directly from the editor.

### Path and cwd conventions

**Agent discovery is cwd-relative.** The GSD agents live in the installed GSD package (resolved from the current session cwd). If you change `cwd` to a sibling repo, pi-subagents may fail to find `gsd-phase-researcher`, `gsd-planner`, etc.

Recommended pattern:

1. Keep the orchestrator/session cwd where the GSD package is installed (so agents resolve).
2. Pass the **absolute path** of the target repo and the absolute output path to the subagent.
3. Always set `output` to the absolute artifact path and add a `gate` command.
4. If the artifact lands in `.pi/subagents/artifacts/<hash>/...` instead of the requested path, copy it to the canonical location.

Example for a sibling repo:

```javascript
subagent({
  workflowScript: "return runs.run('onboard-map', { agent: 'gsd-phase-researcher', context: 'fresh', task: 'Map this codebase. Write MAPPING.md to C:/Sources/fifa.at.jest/.planning/codebase/MAPPING.md', output: 'C:/Sources/fifa.at.jest/.planning/codebase/MAPPING.md', gate: 'test -s C:/Sources/fifa.at.jest/.planning/codebase/MAPPING.md' });"
});
```

Operations beyond the core phase loop are invoked by spawning the corresponding agent directly with `subagent({ workflowScript: ... })`. There are no prompt templates for these agents in `prompts/`.

### Quick work (no phase needed)

| Command | Agent | When to use |
|---------|-------|-------------|
| `quick` | `gsd-quick` | Single-task fixes: typos, missing imports, small refactors |
| `debug` | `gsd-debug` | Diagnose and fix: reproduce → isolate → fix → verify |

### Milestone management

| Command | Agent | When to use |
|---------|-------|-------------|
| `milestone-complete` | `gsd-milestone-complete` | Audit, archive, tag release |
| `milestone-summary` | `gsd-milestone-summary` | Summary from all phase artifacts |

### Session management

| Command | Agent | When to use |
|---------|-------|-------------|
| `pause` | `gsd-pause` | Save session state for later resumption |
| `resume` | `gsd-resume` | Restore session from a previous pause |

### Quality & review

| Command | Agent | When to use |
|---------|-------|-------------|
| `code-review` | `gsd-code-review` | Review implementation against plan + requirements |
| `security-audit` | `gsd-security-audit` | OWASP ASVS scan + threat model |
| `backlog` | `gsd-backlog` | Interactive backlog triage |
| `retrospective` | `gsd-retrospective` | Post-phase what went well / what didn't |
| `ui-research` | `gsd-ui-researcher` | Produce UI-SPEC.md design contract (interactive) |
| `ui-check` | `gsd-ui-checker` | Validate UI-SPEC.md against 6 dimensions |
| `ui-review` | `gsd-ui-auditor` | Retroactive 6-pillar visual audit of implemented UI |

### Knowledge capture

| Command | Agent | When to use |
|---------|-------|-------------|
| `capture` | `gsd-capture` | Capture ideas, todos, decisions from conversation |
| `learnings` | `gsd-learnings` | Extract cross-phase learnings into LEARNINGS.md |

### Autonomous execution

| Command | Agent | When to use |
|---------|-------|-------------|
| `autonomous` | `gsd-autonomous` | Run Plan → Execute → Verify without stopping |

---

## Step 0: Init

### 0a: Greenfield (new project)

**Trigger:** No `.planning/` directory exists AND starting a new project.

**Action:** Create the project scaffold from discussion with the user.

1. Create `.planning/` directory
2. Create `PROJECT.md` — discuss and capture: what the project is, core value, constraints, architecture
3. Create `REQUIREMENTS.md` — numbered REQ-IDs with acceptance criteria
4. Create `ROADMAP.md` — milestones and phases with goals, requirement mappings, and success criteria
5. Create `STATE.md` — initialized from template
6. Create `config.json` — from template, adjust models/flags as needed

### 0b: Onboard (existing project)

**Trigger:** No `.planning/` directory exists AND onboarding an existing codebase.

**Goal:** Map the existing project, then scaffold `.planning/` artifacts from the map.

#### Step 0b-i: Codebase Mapping

Spawn `gsd-phase-researcher` in recon mode to map the existing codebase:

```javascript
const mapResult = await runs.run('onboard-map', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: `Map this existing codebase for GSD onboarding.

## Instructions
Analyze the codebase and produce a comprehensive map. Do NOT write any code.

Use read, grep, find, ls, and bash (read-only) to investigate.

## Output: produce a markdown document with these sections:

### 1. Project Overview
- What the project does (one sentence)
- Core value proposition
- Target users

### 2. Tech Stack
- Language(s) and version(s)
- Framework(s) and version(s)
- Key dependencies (from package.json, requirements.txt, etc.)
- Build tooling
- Test framework

### 3. Architecture
- High-level architecture (monolith, microservices, CLI, library, etc.)
- Directory structure overview (what lives where)
- Key modules/packages and their responsibilities
- Data flow (how data moves through the system)
- External integrations (APIs, databases, services)

### 4. Code Conventions
- Naming conventions
- File organization patterns
- Import/style patterns
- Error handling patterns
- Testing patterns

### 5. Entry Points
- Main entry points (CLI commands, API routes, app initialization)
- Key configuration files

### 6. Known Issues & Tech Debt
- TODO/FIXME/XXX markers found
- Obvious code smells or fragile areas
- Missing tests or documentation
- Outdated dependencies

### 7. Testing
- Test framework and configuration
- Test coverage (if determinable)
- How to run tests

### 8. Build & Deploy
- How to build the project
- How to run it locally
- Deployment mechanism (if any)

Write the map to: .planning/codebase/MAPPING.md`,
  output: '.planning/codebase/MAPPING.md',
  gate: 'test -s .planning/codebase/MAPPING.md'
});
```

#### Step 0b-ii: Validate Map with User

Present the mapping to the user. Ask:
- Is the overview accurate?
- Anything missing or wrong about the architecture?
- What are the top priorities for this project right now?
- What's the current milestone goal?

#### Step 0b-iii: Generate Planning Artifacts

Based on the validated map, generate the initial planning files:

1. **`PROJECT.md`** — from the mapping's project overview + tech stack
2. **`REQUIREMENTS.md`** — derive initial REQ-IDs from:
   - Explicit project goals the user states
   - Implied requirements from the codebase (features that exist but need work)
   - Known issues/tech debt from the mapping
3. **`ROADMAP.md`** — propose milestones and phases based on:
   - User's stated priorities
   - Logical decomposition of the work
   - Dependency ordering between phases
4. **`CONVENTIONS.md`** — from the GSD conventions template, customized with any project-specific overrides (naming, commit convention, workflow rules)
5. **`STATE.md`** — initialized from template, set first phase as active
6. **`config.json`** — from template, adjust models/flags as needed

Show the user the generated ROADMAP.md and REQUIREMENTS.md for approval before proceeding.

#### Step 0b-iv: Optional Deep Dive

For complex codebases, optionally spawn additional recon:

```javascript
const deepResult = await runs.run('onboard-deep', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: `Deep dive into: [specific area user wants mapped]

Focus on:
- Files that would need changes
- Integration points
- Risk areas
- Existing patterns to follow

Write findings to: .planning/codebase/[area]-DEEP.md`,
  output: '.planning/codebase/[area]-DEEP.md',
  gate: 'test -s .planning/codebase/[area]-DEEP.md'
});
```

#### Onboard output structure

```
.planning/
├── PROJECT.md
├── ROADMAP.md
├── REQUIREMENTS.md
├── CONVENTIONS.md          ← GSD workflow conventions for this project
├── STATE.md
├── config.json
└── codebase/
    ├── MAPPING.md              ← full codebase map
    └── [area]-DEEP.md          ← optional deep dives
```

After onboarding, proceed to Step 1 (Discuss Phase) for the first phase. Agents should read `.planning/CONVENTIONS.md` whenever they need to confirm where GSD artifacts live, how phases/plans are named, or what the commit/workflow rules are.

---

## Step 1: Discuss Phase

**Trigger:** New phase ready for discussion.
**Produces:** `<NN>-CONTEXT.md`

**Action:** Interactive discussion to capture implementation decisions before any planning.

### 1a: Identify Gray Areas

Analyze the phase to find ambiguous decisions where the planner would otherwise guess:

Read `.planning/ROADMAP.md` for phase goal, requirements, and success criteria.
Read prior phase CONTEXT.md files (up to 3 back) for accumulated decisions.

Identify gray areas in these categories:
- **Architecture & Approach:** Library choices, patterns, integration strategy
- **Data & State:** Data model changes, state management, migration
- **UI/UX:** Layout, interaction patterns, empty/loading/error states
- **Edge Cases:** Error handling, boundary conditions, performance
- **Scope Boundaries:** What's explicitly out of scope

Mark areas as pre-resolved if the codebase or prior decisions already answer them.

### 1b: Present Gray Areas to User

Use `ask_user_question` to let the user select which gray areas to discuss:

```javascript
ask_user_question({
  questions: [{
    header: "Discuss",
    question: "Phase <NN>: [name] has these gray areas. Which do you want to discuss?",
    options: [
      { label: "Architecture", description: "Library/framework choice, integration approach" },
      { label: "Data & State", description: "Data model, state management, migration" },
      { label: "UI/UX", description: "Layout, interaction patterns, edge states" },
      { label: "Scope", description: "What's in scope vs deferred" }
    ],
    multiSelect: true
  }]
})
```

### 1c: Deep-Dive Each Selected Area

For each selected area, use Socratic questioning with `ask_user_question`:

- Present the decision to be made
- Show options with tradeoffs (one sentence each)
- Recommend a default (first option) with brief rationale
- Let the user choose or type a custom answer
- Capture each decision with a unique ID: **D-<NN>-MM**

**Interaction style:**
- Conversational, not interrogative — you're a thinking partner
- Recommend defaults — user can override
- Move fast — state obvious decisions and move on
- Don't ask about things the researcher can determine from the code

### 1d: Enforce Scope Guardrail

**No scope creep.** The phase boundary from ROADMAP.md is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.

When user suggests scope creep:
```
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog?

For now, let's focus on [phase domain]."
```

Capture the idea in a "Deferred" section — don't lose it, don't act on it.

### 1e: Write CONTEXT.md

Produce `.planning/phases/<NN>-<slug>/<NN>-CONTEXT.md` with:

- **Locked decisions** (D-<NN>-MM) — NOT open for debate during planning
- **Canonical references** — source-of-truth files for researcher/planner
- **Code context** — existing patterns to follow
- **Deferred** — explicit out-of-scope items for future phases

---

## Step 2: Plan Phase

**Trigger:** CONTEXT.md exists for the phase.
**Produces:** `<NN>-RESEARCH.md`, `<NN>-VALIDATION.md`, `<NN>-<PP>-PLAN.md` files

### 2a: Spawn Researcher (Fresh Context)

Spawn `gsd-phase-researcher` to produce RESEARCH.md:

```javascript
const researchResult = await runs.run('research-phase', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: `Research Phase <NN>: [phase name]

## Phase goal (from ROADMAP.md):
[Phase goal text]

## Requirements: [REQ-XX, REQ-YY]

## User decisions (locked — research THESE, not alternatives):
[D-NN-01]: [decision]
[D-NN-02]: [decision]

## Canonical references (source-of-truth files):
- [file:line] — [what it covers]

## Code context (existing patterns):
- [pattern to follow]

## Technical questions to investigate:
- What are the standard libraries/patterns for this domain?
- What packages are needed? Verify legitimacy.
- What are common pitfalls?

## Output:
Write RESEARCH.md to: .planning/phases/<NN>-<slug>/<NN>-RESEARCH.md`,
  output: `.planning/phases/<NN>-<slug>/<NN>-RESEARCH.md`,
  gate: 'test -s .planning/phases/<NN>-<slug>/<NN>-RESEARCH.md'
});
```

**`gsd-phase-researcher` receives (context isolation):**
- Phase goal and domain from ROADMAP.md
- Locked decisions from CONTEXT.md
- Canonical references from CONTEXT.md (files to focus on)
- Phase directory path for output

**`gsd-phase-researcher` does NOT receive:** full session history, other phases, REQUIREMENTS.md.

### 2b: Spawn Planner (Fresh Context)

After the researcher completes, spawn `gsd-planner` to create PLAN.md files:

```javascript
const planResult = await runs.run('plan-phase', {
  agent: 'gsd-planner',
  context: 'fresh',
  task: `Create execution plans for Phase <NN>: [phase name]

## Phase goal (from ROADMAP.md):
[Phase goal text]

## Requirements: [REQ-XX, REQ-YY]

## User decisions (locked — MUST implement exactly):
[D-NN-01]: [decision and rationale]
[D-NN-02]: [decision and rationale]

## Deferred ideas (MUST NOT appear in plans):
- [deferred idea 1]

## Research findings (key points):
[Summary of RESEARCH.md findings]

## Canonical references:
- [file:line] — [what to follow]

## Output:
Write one or more PLAN.md files to: .planning/phases/<NN>-<slug>/
Each plan should have:
- YAML frontmatter (phase, plan, wave, depends_on, requirements, must_haves)
- XML-structured tasks with read_first, action, verify, acceptance_criteria
- Wave-based dependency ordering for parallel execution`,
  output: `.planning/phases/<NN>-<slug>/<NN>-<PP>-PLAN.md`,
  gate: 'test -s .planning/phases/<NN>-<slug>/<NN>-<PP>-PLAN.md'
});
```

### 2c: Optional Plan Check

For complex phases, optionally validate plans with `gsd-plan-checker`:

```javascript
const checkResult = await runs.run('plan-check', {
  agent: 'gsd-plan-checker',
  context: 'fresh',
  task: `Validate the following plan for Phase <NN>.

## Phase goal: [goal]
## Requirements: [REQ-XX, REQ-YY]
## Locked decisions: [D-NN-01, D-NN-02]

## Plan files:
[Contents of all PLAN.md files]

Check all 9 dimensions:
1. Requirement coverage
2. Task completeness
3. Dependency correctness
4. Key links planned
5. Scope sanity
6. Verification derivation
7. Context compliance
7b. Scope reduction detection
8. Project instructions compliance
9. Research resolution`,
  output: `.planning/phases/<NN>-<slug>/<NN>-VALIDATION.md`,
  gate: 'test -s .planning/phases/<NN>-<slug>/<NN>-VALIDATION.md'
});
```

### 2d: Wave Analysis

Analyze PLAN.md files to determine execution waves:
- Plans with no `depends_on` → Wave 1
- Plans depending only on Wave 1 plans → Wave 2
- Etc.

Store wave assignments in STATE.md for execute-phase:

```javascript
await gsd_state_update({ repoPath: '<repo>', field: 'current_plan', value: null });
await gsd_state_advance({ repoPath: '<repo>', operation: 'begin-phase', phase: <NN>, phaseName: '<slug>', nextAction: 'execute-phase' });
```

---

## Step 3: Execute Phase

**Trigger:** PLAN.md files exist, no SUMMARY.md yet.
**Produces:** `<NN>-<PP>-SUMMARY.md` per plan, code changes, git commits.

### Wave-Based Parallel Execution with `gsd-executor`

For each wave, spawn `gsd-executor` subagents in parallel using `runs.all`:

```javascript
// Wave 1: plans with no dependencies run in parallel
const wave1Plans = plans.filter(p => p.wave === 1);
const results = await runs.all(
  wave1Plans.map(plan => ({
    key: `execute-${plan.id}`,
    agent: 'gsd-executor',
    context: 'fresh',
    task: buildExecutorTask(plan),
    output: `.planning/phases/<NN>-<slug>/<NN>-<PP>-SUMMARY.md`,
    gate: `test -s .planning/phases/<NN>-<slug>/<NN>-<PP>-SUMMARY.md`
  }))
);
```

> **CRITICAL SYNTAX:** `runs.all()` takes an array of run spec objects directly — do NOT wrap them in `runs.run()`. Each object MUST have a `key` field (string, unique within the wave). The `runs.run()` and `runs.all()` syntaxes are different:
>
> ```javascript
> // ✅ CORRECT: runs.all with plain objects + key field
> await runs.all([
>   { key: 'exec-1', agent: 'gsd-executor', context: 'fresh', task: '...' },
>   { key: 'exec-2', agent: 'gsd-executor', context: 'fresh', task: '...' }
> ])
>
> // ✅ CORRECT: runs.run with single object (NO key field)
> await runs.run('exec-1', {
>   agent: 'gsd-executor',
>   context: 'fresh',
>   task: '...'
> })
>
> // ❌ WRONG: wrapping runs.run() inside runs.all()
> await runs.all([
>   runs.run('exec-1', { agent: 'gsd-executor', ... }),  // ERROR!
>   runs.run('exec-2', { agent: 'gsd-executor', ... })
> ])
>
> // ❌ WRONG: missing key field in runs.all items
> await runs.all([
>   { agent: 'gsd-executor', task: '...' },  // ERROR: no key!
>   { agent: 'gsd-executor', task: '...' }
> ])
> ```

> **⚠️ CRITICAL: Output paths MUST be canonical `.planning/` paths — NEVER use `.pi-subagents/artifacts/outputs/<hash>/` paths.**
>
> The `output` parameter controls where the subagent writes its artifact. If you set it to a hash-based path like
> `.pi-subagents/artifacts/outputs/5cf25566/.planning/phases/...`, the file will be written there instead of the
> canonical `.planning/` location. Downstream steps (verify, ship) look for artifacts at the canonical path and
> will fail to find them.
>
> ```javascript
> // ✅ CORRECT: canonical path (relative to project root)
> output: '.planning/phases/08-web-ui-hardening/08-01-SUMMARY.md'
>
> // ❌ WRONG: hash-based artifact path (creates nested duplicate tree)
> output: '.pi-subagents/artifacts/outputs/5cf25566/.planning/phases/08-web-ui-hardening/08-01-SUMMARY.md'
> ```
>
> **If you do NOT specify `output`**, the runtime auto-generates a hash-based path. This is the most common
> cause of "missing" summaries. Always explicitly set `output` to the canonical `.planning/` path.

### Executor Task Construction

Each `gsd-executor` task must include:

```
Implement plan <NN>-<PP>-PLAN.md located at .planning/phases/<NN>-<slug>/<NN>-<PP>-PLAN.md.

## Context
Read these files first:
- .planning/phases/<NN>-<slug>/<NN>-CONTEXT.md (locked decisions — these are NOT open for debate)
- .planning/phases/<NN>-<slug>/<NN>-RESEARCH.md (research findings — trust these)
- .planning/PROJECT.md (project overview)

## Phase decisions (locked):
[D-NN-01]: [decision and rationale]
[D-NN-02]: [decision and rationale]

## Prior plan summaries (if wave > 1):
[Include SUMMARY.md content from dependency plans]

## Rules:
- Follow locked decisions exactly. If a decision seems wrong, implement it anyway and note concern in SUMMARY.
- Make minimal, correct edits. No speculative scaffolding.
- Commit atomically per task using conventional commits.
- If you hit an unapproved decision, escalate — do not silently decide.
- Write SUMMARY.md to the output path when done.
```

### Executor Context (per plan)

Each `gsd-executor` receives ONLY:
- The specific PLAN.md it's implementing
- Phase CONTEXT.md (locked decisions)
- Phase RESEARCH.md (if available)
- PROJECT.md (overview)
- Prior-wave SUMMARY.md files (only if this plan's wave > 1)

Each `gsd-executor` does NOT receive: full codebase scan, other plans, planning conversation.

### After Each Wave

1. Review all SUMMARY.md files from the wave
2. Run type check / lint / tests if configured
3. If failures → spawn `gsd-verifier` for diagnosis, then `gsd-executor` for fix
4. Update STATE.md with completed plans and recalculate progress:

   ```javascript
   // For each completed plan:
   await gsd_state_advance({ repoPath: '<repo>', operation: 'complete-plan', phase: <NN>, plan: <PP> });
   // Then refresh progress counters from disk:
   await gsd_state_progress({ repoPath: '<repo>' });
   ```

5. Proceed to next wave

---

## Step 4: Verify Phase

**Trigger:** All plans have SUMMARY.md files.
**Produces:** `<NN>-VERIFICATION.md`

### Spawn Verifier (Fresh Context)

```javascript
const verifyResult = await runs.run('verify-phase', {
  agent: 'gsd-verifier',
  context: 'fresh',
  task: `Verify Phase <NN>: [phase name]

## Phase goal (from ROADMAP.md):
[Phase goal text]

## Requirements: [REQ-XX, REQ-YY]

## Locked decisions (should have been followed):
[D-NN-01]: [decision]
[D-NN-02]: [decision]

## Plans to verify:
[Include contents of all <NN>-<PP>-PLAN.md files — focus on must_haves sections]

## Execution summaries:
[Include contents of all <NN>-<PP>-SUMMARY.md files]

## Verification checklist:
1. Goal alignment: Does the implementation achieve the phase goal?
2. Must-have coverage: Are all truths, artifacts, and key_links present and correct?
3. Requirement coverage: Are all phase REQ-IDs addressed?
4. Decision compliance: Were locked decisions followed?
5. Code quality: Any obvious bugs, missing error handling, or security issues?

## Output:
Write VERIFICATION.md to: .planning/phases/<NN>-<slug>/<NN>-VERIFICATION.md`,
  output: '.planning/phases/<NN>-<slug>/<NN>-VERIFICATION.md',
  gate: 'test -s .planning/phases/<NN>-<slug>/<NN>-VERIFICATION.md'
});
```

### Verifier Context

The `gsd-verifier` receives:
- Phase goal from ROADMAP.md
- CONTEXT.md (decisions to check compliance)
- All PLAN.md files (must_haves to verify)
- All SUMMARY.md files (what executors claim)
- REQUIREMENTS.md (REQ-ID coverage)

The `gsd-verifier` reads actual code to verify claims, produces VERIFICATION.md with verdict.

### Handle Verdict

- **passed** → proceed to Ship
- **gaps_found** → generate fix plans, loop back to Execute (Step 3) for gap fixes
- **human_needed** → present findings to user, wait for decision

---

## Step 5: Ship

**Trigger:** VERIFICATION.md shows passed (or user overrides gaps).

1. Create PR with body derived from:
   - Phase goal from ROADMAP.md
   - Changes from SUMMARY.md files
   - Requirements addressed
   - Key decisions from CONTEXT.md
2. Update STATE.md via host-side tools:

   ```javascript
   // Mark phase complete and advance next_action:
   await gsd_state_advance({ repoPath: '<repo>', operation: 'complete-phase', phase: <NN> });
   // Recalculate progress from disk:
   await gsd_state_progress({ repoPath: '<repo>' });
   ```

3. Archive phase artifacts (commit .planning/ to git)

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (you — thin, stays lean)                       │
│                                                             │
│  Step 0: Init .planning/ structure (once)                   │
│  Step 1: Discuss with user → CONTEXT.md                     │
│  Step 2: Plan phase                                         │
│     ├─ runs.run(gsd-phase-researcher)  ← fresh             │
│     ├─ runs.run(gsd-planner)           ← fresh             │
│     ├─ (optional) runs.run(gsd-plan-checker) ← fresh       │
│     └─ Wave analysis → STATE.md                             │
│  Step 3: Execute phase                                      │
│     └─ For each wave:                                       │
│        └─ runs.all([gsd-executor, ...]) ← parallel, fresh  │
│  Step 4: Verify phase                                       │
│     └─ runs.run(gsd-verifier)          ← fresh             │
│  Step 5: Ship → PR, update STATE.md, repeat                 │
│                                                             │
│  STATE.md is read at the start of every step and written    │
│  after every significant action.                            │
└─────────────────────────────────────────────────────────────┘

## State-management tools

The `gsd-commands` extension provides host-side tools for reading and mutating `STATE.md` without asking a subagent to rewrite the whole file:

- `gsd_state_load({ repoPath })` — read frontmatter and body
- `gsd_state_update({ repoPath, field, value })` — atomic dot-notation frontmatter update
- `gsd_state_advance({ repoPath, operation, phase, ... })` — `begin-phase`, `complete-plan`, `complete-phase`
- `gsd_state_progress({ repoPath })` — recalculate `progress.*` from disk

Use these in the **orchestrator layer** for reliable state transitions. Agents reading `STATE.md` still use the `read` tool. Subagents generally should **not** write `STATE.md`; report desired state changes back to the orchestrator so it can apply them with these tools. The special-purpose `gsd-milestone-complete`, `gsd-pause`, and `gsd-resume` agents may still write `STATE.md` directly, but they should make minimal, frontmatter-only updates.
```

## Artifact Integrity — Preventing Empty Artifacts

Subagents sometimes complete successfully but fail to write their artifact file to disk. The `output` parameter is a directive, not a guarantee. Use **three layers of protection**:

### Layer 1: Gate Commands (automatic host-side verification)

Add a `gate` to every `runs.run()` that produces an artifact. The host verifies file existence after completion:

```javascript
runs.run('research-phase', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: '...',
  output: '.planning/phases/07-admin-ux/07-RESEARCH.md',
  gate: 'test -f .planning/phases/07-admin-ux/07-RESEARCH.md'
})
```

**Gate rules:**
- `gate` is a single shell command run on the host after the subagent completes
- If the command exits non-zero, the gate fails — the run is marked as not accepted
- Cannot be combined with `acceptance` — use one or the other
- For content verification (non-empty file), use: `test -s <path>` (checks file exists AND has size > 0)
- Rejected on retained resume items
- **Cross-platform:** Unix `test -s`/`test -f` do not work on Windows hosts. For portable gates use Node, e.g.:
  ```javascript
  gate: 'node -e "const fs=require(\'fs\'); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }" "<path>"'
  ```

### Layer 2: Acceptance Contracts (self-reported evidence)

When gates aren't sufficient, require evidence of file changes:

```javascript
runs.run('research-phase', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: '...',
  output: '.planning/phases/07-admin-ux/07-RESEARCH.md',
  acceptance: {
    level: 'checked',
    evidence: ['changed-files', 'commands-run']
  }
})
```

### Layer 3: Orchestrator Post-Check (safety net)

After `subagent_wait()`, verify the artifact exists:

```javascript
// After subagent completes
const waitResult = await subagent_wait({ id: research.asyncId });
// Verify artifact exists, reconstruct from agent output if missing
```

### Which layers to use?

| Phase step | Gate | Acceptance | Post-check |
|------------|------|------------|------------|
| Research | ✅ `test -f` | Optional | Recommended |
| Plan | ✅ `test -f` | Optional | Recommended |
| Execute | ✅ `test -f` per SUMMARY | `changed-files` | Recommended |
| Verify | ✅ `test -f` | Optional | Recommended |
| Onboard map | ✅ `test -f` | — | Recommended |
| Plan check | ✅ `test -f` | — | Recommended |

### Agent prompt hardening (built-in)

All artifact-producing agents now include a `## CRITICAL: Artifact Writing — MANDATORY` section in their system prompt that instructs them to:
1. Create the file as first action (placeholder header)
2. Write complete content as last action
3. Verify with `ls -la` after writing

This is prevention — gates and post-checks are the safety net.

## Context Isolation Rules

- **Always `context: 'fresh'`** — every subagent starts clean with only the artifacts in its task
- **No session history leakage** — subagents never see the orchestrator's conversation
- **Explicit artifact passing** — if a subagent needs knowledge from a prior step, include it in the task text
- **STATE.md is the spine** — every workflow reads it first, updates it after actions

## Fallback: Generic Agents

If you don't want to use the GSD-specific agents, this skill also works with pi-subagents' builtins:

| GSD Role | pi-subagent builtin | Notes |
|----------|--------------------|-------|
| Researcher | `scout` (codebase) + `researcher` (web) | Run in parallel |
| Planner | `oracle` | Advisory — doesn't create PLAN.md, only validates |
| Executor | `worker` | Direct replacement for `gsd-executor` |
| Verifier | `reviewer` | Direct replacement for `gsd-verifier` |

The GSD agents add: plan-checker, RESEARCH.md structure, PLAN.md format with waves/must_haves, goal-backward methodology, and VERIFICATION.md with adversarial stance. The builtins are lighter-weight alternatives.

## Common Subagent Invocation Mistakes

### runs.all() vs runs.run() syntax confusion

```javascript
// ✅ runs.all: array of plain objects, each with `key`
await runs.all([
  { key: 'a', agent: 'gsd-executor', context: 'fresh', task: '...' },
  { key: 'b', agent: 'gsd-executor', context: 'fresh', task: '...' }
])

// ✅ runs.run: single key string + options object (NO `key` field inside)
await runs.run('my-run', {
  agent: 'gsd-executor',
  context: 'fresh',
  task: '...'
})

// ❌ NEVER wrap runs.run() inside runs.all()
// ❌ NEVER omit `key` in runs.all() items
```

### Gate + acceptance mutual exclusivity

`gate` and `acceptance` cannot be combined on the same `runs.run()` / `runs.all()` item. Use one or the other:

```javascript
// ✅ Gate only
runs.run('key', { agent: '...', task: '...', gate: 'test -s file.md' })

// ✅ Acceptance only
runs.run('key', { agent: '...', task: '...', acceptance: { level: 'checked', evidence: ['changed-files'] } })

// ❌ NEVER combine them
runs.run('key', { agent: '...', task: '...', gate: '...', acceptance: {...} })
```

### Template literal escaping in workflowScript

When building task strings inside `workflowScript`, use backtick template literals carefully. Nested backticks break parsing:

```javascript
// ✅ Use string concatenation or escape inner backticks
task: `Execute plan...\n` + planContent + `\n## More:`

// ✅ Build the task string before passing to runs.run()
const task = buildExecutorTask(plan);  // returns string
runs.run('key', { agent: 'gsd-executor', task: task })

// ❌ Nested backticks cause "Syntax error in the workflow script"
runs.run('key', { task: `Plan: ${planContent}` })  // if planContent has backticks
```

### Task text must NOT override the output path

The `output` parameter controls where the subagent writes its artifact. If the task text contains an "Output:" or "Write to:" instruction with a different path, the subagent will follow the task text — writing to the wrong location:

```javascript
// ❌ WRONG: task text overrides output with hash-based path
task: `Implement plan...\n\n**Output:**\nWrite your findings to: .pi-subagents/artifacts/outputs/5cf25566/.planning/phases/08-web-ui-hardening/08-01-SUMMARY.md`,
output: '.planning/phases/08-web-ui-hardening/08-01-SUMMARY.md'  // overridden!

// ✅ CORRECT: task text does NOT mention a specific output path
// The output parameter controls the path
task: `Implement plan...\n\nWrite SUMMARY.md when done.`,
output: '.planning/phases/08-web-ui-hardening/08-01-SUMMARY.md'
```

**Root cause:** The main agent was generating unique hash-based paths (`.pi-subagents/artifacts/outputs/<hash>/...`) in the task text to avoid conflicts between parallel executors. This caused files to be written to nested duplicate trees instead of the canonical `.planning/` location. Downstream steps (verify, ship) look for artifacts at the canonical path and fail to find them.

**Rule:** Never put path-specific "Output:" or "Write to:" instructions in executor task text. The `output` parameter is the single source of truth.

### Output path with gate

The `gate` command runs on the host in the project cwd. Use paths relative to the project root:

```javascript
// ✅ Relative to project root
gate: 'test -s .planning/phases/07-admin-ux/07-RESEARCH.md'

// ✅ For dynamic paths, use template literals in the gate string
gate: `test -s .planning/phases/${phaseSlug}/RESEARCH.md`

// ❌ Absolute paths may fail if the host cwd differs
gate: 'test -s /home/user/project/.planning/RESEARCH.md'
```

## Pitfalls

- **Never skip the Discuss step.** Ambiguous plans produce workers that make wrong assumptions.
- **Context isolation is mandatory.** Do not dump session history into subagents.
- **STATE.md is the source of truth.** Always read it first, update after every action.
- **Respect wave dependencies.** Never run dependent plans in parallel.
- **For trivial work, skip the loop.** Typos and single-file fixes don't need a phase.
- **Don't over-delegate planning.** Use `gsd-planner` for plan creation; use `gsd-plan-checker` only for validation on complex phases.
- **Don't wrap `runs.run()` inside `runs.all()`.** They have different syntaxes — see Common Subagent Invocation Mistakes above.
- **Don't combine `gate` + `acceptance`.** They're mutually exclusive on the same run item.

## Verification

1. STATE.md reflects correct current phase and next action
2. All planning artifacts exist for current phase
3. Subagents complete without context overflow
4. VERIFICATION.md shows passed or documented gaps
5. Git commits are atomic per plan task
6. **No empty artifacts** — every artifact file exists and has content (verified by gates)
7. **No missing artifacts** — every expected artifact path exists on disk (post-check)

## Feature status

### ✅ Available now

Phase loop (Discuss→Plan→Execute→Verify→Ship), interactive discuss with locked decisions, wave-based parallelism, fresh-context subagents, quick tasks, structured debugging, milestone completion/summary, pause/resume, codebase onboarding, context monitoring, phase boundary reminders, commit validation, status display, code review, security audit, retrospective, capture, learnings, autonomous execution, UI research, UI checking, UI audit.

### ❌ Not yet available

UAT audit, workspace/workstream management, threads, broken windows ledger, graphify knowledge graph, intel queries, MVP/walking skeleton modes, cross-AI review convergence, decimal phases, effort estimation, config hot-reload, injection scanning, prompt/read/workflow guards, update checks, roadmap editing, plan insertion/removal.

### 🔄 Partial

Plan validation (9 dimensions, no auto-revise), Nyquist test enforcement (template only), TDD mode (supported but not dedicated), package legitimacy (check but no gate), multi-model (inherit only, no per-agent tiering).

See README.md for the full comparison table.
