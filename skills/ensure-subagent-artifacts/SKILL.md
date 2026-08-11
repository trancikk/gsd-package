---
name: "ensure-subagent-artifacts"
description: "Ensures subagent artifact files are actually written to disk. Prevents empty/missing artifacts via gate commands, acceptance contracts, and orchestrator post-checks."
version: 1
created: "2026-08-11"
updated: "2026-08-11"
---

# Ensure Subagent Artifacts

Prevents the failure mode where subagents complete successfully but their artifact files never get written to disk. The `output` parameter on `runs.run()` is a directive to the subagent, not a runtime guarantee — if the agent's final turn returns text without calling `write`, the artifact is lost.

## When to Use

**Use when:**
- Any `runs.run()` / `runs.all()` call produces an artifact file that downstream steps depend on
- Subagents have failed to write artifacts in the past (researcher, verifier, planner patterns)
- Artifact integrity is critical — missing files cause cascading failures downstream

**Skip when:**
- Subagents only modify existing code (no new artifact files)
- Output is consumed directly from the agent response (not from a file)
- Trivial one-shot lookups with no durable output

## The Problem

```
Subagent completes (24 turns, 67 tools) → returns great content in response text
→ never calls `write` tool → artifact file doesn't exist → downstream step fails
```

The `output` field in agent YAML and `output` parameter in `runs.run()` tell the agent *where* to write, but the runtime does not enforce that the write actually happens.

## Three-Layer Defense

### Layer 1: Gate Commands (automatic host-side verification)

Add a `gate` to `runs.run()`. After the subagent completes, the host runs a verification command:

```javascript
runs.run('my-research', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: '...',
  output: '.planning/phases/07-admin-ux/07-RESEARCH.md',
  gate: 'test -s .planning/phases/07-admin-ux/07-RESEARCH.md'
})
```

**Gate command reference:**

| Check | Command | What it verifies |
|-------|---------|-----------------|
| File exists | `test -f <path>` | File is present |
| File non-empty | `test -s <path>` | File exists AND has size > 0 |
| Multiple files | `test -f <path1> && test -f <path2>` | Both files exist |
| Content contains | `grep -q "pattern" <path>` | File contains expected text |
| Valid markdown headings | `grep -q "^#" <path>` | File has markdown structure |
| Minimum line count | `test $(wc -l < <path>) -ge 10` | File has at least N lines |

**Gate rules:**
- Single shell command run on host after subagent completes
- Non-zero exit = gate fails = run marked as not accepted
- Cannot combine with `acceptance` — use one or the other
- Rejected on retained resume items
- Memoized per tracked workspace state

### Layer 2: Acceptance Contracts (self-reported evidence)

When you need structured evidence beyond file existence:

```javascript
runs.run('my-research', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: '...',
  output: '.planning/phases/07-admin-ux/07-RESEARCH.md',
  acceptance: {
    level: 'checked',
    evidence: ['changed-files', 'commands-run', 'validation-output']
  }
})
```

**Evidence kinds for artifact verification:**

| Evidence | What it proves |
|----------|---------------|
| `changed-files` | Files were written or modified |
| `commands-run` | Shell commands were executed (e.g., `ls -la` after write) |
| `validation-output` | Validation steps produced output |
| `no-staged-files` | Working tree is clean (all changes committed) |

### Layer 3: Orchestrator Post-Check (safety net)

After `subagent_wait()`, verify and reconstruct if missing:

```javascript
// Launch async
const research = subagent({
  workflowScript: `return runs.run("research", {
    agent: "gsd-phase-researcher",
    task: "...",
    output: ".planning/phases/07-admin-ux/07-RESEARCH.md"
  })`,
  async: true
});

// Wait for completion
await subagent_wait({ id: research.asyncId });

// Post-check: verify artifact exists
// (Use bash tool to check, then read agent output from status if missing)
```

The orchestrator can read the agent's transcript from `status.view: "transcript"` and write the artifact manually if the subagent failed to do so.

## Agent Prompt Hardening (prevention)

Add this section to any agent that produces artifact files:

```markdown
## CRITICAL: Artifact Writing — MANDATORY

**You MUST write the artifact to disk using the `write` tool BEFORE completing your response.**

- **FIRST action after loading context**: Create the file with a placeholder header so the file handle exists
- **LAST action before returning**: Write the complete content to the output path specified in your task
- Returning findings in your response text alone is **NOT sufficient** — if you do not call `write`, the artifact is LOST
- If the output path directory does not exist yet, create it with `bash` (`mkdir -p`) before writing
- After writing, verify with `ls -la` that the file exists and has content

**Failure to write the file = task failure, regardless of work quality.**
```

All GSD agents (researcher, planner, executor, verifier, plan-checker, UI researcher/checker/auditor, code review, security audit, retrospective, learnings, capture, milestone-complete, milestone-summary) now include this hardening.

## Quick Reference: Which Layers to Use

| Scenario | Gate | Acceptance | Post-check | Prompt hardening |
|----------|------|------------|------------|-----------------|
| Phase research | ✅ `test -s` | Optional | Recommended | ✅ Already in agent |
| Phase planning | ✅ `test -s` | Optional | Recommended | ✅ Already in agent |
| Phase execution | ✅ `test -s` per SUMMARY | `changed-files` | Recommended | ✅ Already in agent |
| Phase verification | ✅ `test -s` | Optional | Recommended | ✅ Already in agent |
| Code review | ✅ `test -s` | `changed-files` | Optional | ✅ Already in agent |
| Onboarding map | ✅ `test -s` | — | Recommended | ✅ Already in agent |
| Quick fixes | — | — | — | — |
| Recon/scout | — | — | — | — |

## Patterns

### Pattern 1: Single artifact with gate

```javascript
runs.run('research', {
  agent: 'gsd-phase-researcher',
  context: 'fresh',
  task: 'Research...',
  output: '.planning/phases/01-foo/01-RESEARCH.md',
  gate: 'test -s .planning/phases/01-foo/01-RESEARCH.md'
})
```

### Pattern 2: Multiple artifacts with compound gate

```javascript
runs.run('plan', {
  agent: 'gsd-planner',
  context: 'fresh',
  task: 'Plan...',
  output: '.planning/phases/01-foo/01-01-PLAN.md',
  gate: 'test -s .planning/phases/01-foo/01-01-PLAN.md && test -s .planning/phases/01-foo/01-02-PLAN.md'
})
```

### Pattern 3: Wave execution with per-plan gates

```javascript
const results = await runs.all(
  plans.map(plan => ({
    key: `execute-${plan.id}`,
    agent: 'gsd-executor',
    context: 'fresh',
    task: buildExecutorTask(plan),
    output: `.planning/phases/<NN>-<slug>/<NN>-<PP>-SUMMARY.md`,
    gate: `test -s .planning/phases/<NN>-<slug>/<NN>-<PP>-SUMMARY.md`
  }))
);
```

### Pattern 4: Content verification gate

```javascript
runs.run('verify', {
  agent: 'gsd-verifier',
  context: 'fresh',
  task: 'Verify...',
  output: '.planning/phases/01-foo/01-VERIFICATION.md',
  gate: 'test -s .planning/phases/01-foo/01-VERIFICATION.md && grep -q "verdict:" .planning/phases/01-foo/01-VERIFICATION.md'
})
```

### Pattern 5: Parallel artifacts with acceptance (no gate)

```javascript
const results = await runs.all([
  {
    key: 'research',
    agent: 'gsd-phase-researcher',
    task: '...',
    output: '.planning/RESEARCH.md',
    acceptance: { level: 'checked', evidence: ['changed-files'] }
  },
  {
    key: 'review',
    agent: 'gsd-code-review',
    task: '...',
    output: '.planning/REVIEW.md',
    acceptance: { level: 'checked', evidence: ['changed-files'] }
  }
]);
```

## Verification

1. Every `runs.run()` that produces a new file has a `gate` or `acceptance` with `changed-files` evidence
2. Every artifact-producing agent prompt includes the `## CRITICAL: Artifact Writing` section
3. Orchestrator post-checks artifact existence after `subagent_wait()`
4. No empty files (`test -s` catches zero-byte files)
5. No missing files (`test -f` catches absent files)

## Pitfalls

- **Gate commands are shell commands** — they run in the project's cwd. Use absolute paths or paths relative to the project root.
- **`test -s` vs `test -f`**: `-f` checks existence only (empty file passes), `-s` checks existence + non-empty. Prefer `-s` for artifact verification.
- **Gate failure ≠ run failure**: A failed gate means the run is "not accepted" — the agent output is still available, but the completion is flagged.
- **Cannot combine gate + acceptance**: Use one or the other per `runs.run()` call. Choose gate for simple file checks, acceptance for multi-evidence contracts.
- **Directory must exist**: If the output path includes a directory that doesn't exist yet, the agent needs to `mkdir -p` first. The gate will fail if the directory doesn't exist.
- **Memoization**: Gates are memoized per workspace state. If a file is deleted after the gate passes, the gate won't re-run until the next `runs.run()`.

## Feature status

### ✅ Available now

Gate commands (`test -f`, `test -s`, `grep -q`), acceptance with `changed-files` evidence, orchestrator post-check via `subagent_wait()` + status, agent prompt hardening.

### 🔄 Partial

Content-quality gates (grep for patterns) work but don't validate semantic correctness — that requires LLM judgment or human review.
