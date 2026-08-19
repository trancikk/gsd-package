# Research: Integrating Matt Pocock Skills with the GSD Workflow Suite

**Scope:** Tighter integration of the ten adopted Matt Pocock skills (`diagnose-bugs`, `review-code`, `write-for-agents`, `grill-me`, `wait-what`, `teach`, `improve-codebase-arch`, `codebase-design`, `domain-modeling`, `prototype`) with the existing GSD workflow suite in `gsd-package`.

**Date:** 2026-08-18  
**Status:** Research / recommendation

---

## 1. Executive Summary

The Matt Pocock skills are currently standalone, user-invoked pi skills. The GSD suite is a coordinated set of agents, extensions, hooks, and command tools. The highest-value integrations are where a Matt Pocock skill either:

1. **Replaces or augments a GSD agent's internal workflow** (`diagnose-bugs` → `gsd-debug`, `review-code` → `gsd-code-review`).
2. **Adds a new workflow step or checkpoint** (`prototype` as a plan task type, `improve-codebase-arch` as a pre-plan architecture review).
3. **Provides shared vocabulary used by multiple agents** (`codebase-design`, `domain-modeling`, `write-for-agents`).

Lowest-value integrations are purely informational (e.g., linking `teach` or `wait-what` in docs).

---

## 2. Current GSD Suite Inventory

### Agents (`.planning/phases/<NN>-<slug>/` artifacts)

| Agent | Role | Artifact | Integration Relevance |
|-------|------|----------|----------------------|
| `gsd-discuss` | Lock implementation decisions | `NN-CONTEXT.md` | Use `grill-me` rounds for complex gray areas; use `domain-modeling` vocabulary. |
| `gsd-phase-researcher` | Domain/tech research | `NN-RESEARCH.md` | Use `codebase-design` vocabulary; flag architectural hotspots for `improve-codebase-arch`. |
| `gsd-planner` | Executable plans | `NN-<PP>-PLAN.md` | Add `prototype` task type; use `codebase-design` for interface design tasks. |
| `gsd-executor` | Implement plans | `NN-<PP>-SUMMARY.md` | Handle `prototype` tasks; fallback to `diagnose-bugs` on repeated auto-fix failures. |
| `gsd-verifier` | Goal-backward verification | `NN-VERIFICATION.md` | Use `review-code` Standards axis as an input. |
| `gsd-code-review` | Plan/requirement compliance | `NN-CODE-REVIEW.md` | Add Standards axis from `review-code`. |
| `gsd-debug` | Structured debugging | (inline / `.planning/debug/`) | Replace workflow with `diagnose-bugs` 6-phase loop. |
| `gsd-learnings` | Cross-phase learning extraction | `LEARNINGS.md` | Capture `write-for-agents` lessons for agent docs. |

### Extensions

| Extension | What It Does | Integration Opportunity |
|-----------|--------------|------------------------|
| `gsd-commands` | Typed tools for onboard/research/plan/execute/verify | Add new tools: `gsd_diagnose`, `gsd_review`, `gsd_prototype`. |
| `gsd-hooks` | Context monitoring, guards, status, commit validation | Trigger `wait-what` recovery pattern on user confusion signals; warn when agent response may not have landed. |
| `gsd-save-response` | `/save-last` command | Not relevant. |

### Skills

| Skill | Role | Relationship |
|-------|------|--------------|
| `gsd-phase-loop` | Orchestrates the whole loop | Mention integrated Matt Pocock skills in loop steps. |
| `ensure-subagent-artifacts` | Artifact-writing guardrails | Applies to any new subagent-based integration. |
| New Matt Pocock skills | User-invoked helpers | Tighten by making them callable from agents/commands. |

---

## 3. Integration Matrix

| Matt Pocock Skill | Primary GSD Touchpoint | Secondary Touchpoints | Integration Pattern | Value |
|-------------------|------------------------|----------------------|---------------------|-------|
| `diagnose-bugs` | `gsd-debug` agent | `gsd-executor` (auto-fix fallback) | **Replace/augment workflow** | High |
| `review-code` | `gsd-code-review` agent | `gsd-verifier` | **Add parallel Standards axis** | High |
| `write-for-agents` | All agent `.md` files | Skill authoring guide | **Vocabulary / quality bar** | Medium-High |
| `grill-me` | `gsd-discuss` agent | Pre-plan deep dives | **Augment Socratic rounds** | Medium |
| `wait-what` | All agents | `gsd-hooks` UI notifications | **Recovery heuristic** | Medium |
| `teach` | Onboarding docs | — | **Standalone** | Low-Medium |
| `improve-codebase-arch` | `gsd-phase-researcher` / planning | `gsd-planner` | **New checkpoint** | High |
| `codebase-design` | `gsd-planner`, `gsd-phase-researcher`, `gsd-code-review` | `improve-codebase-arch` | **Shared vocabulary** | High |
| `domain-modeling` | `gsd-discuss` | `gsd-phase-researcher` | **CONTEXT.md/ADR discipline** | Medium-High |
| `prototype` | `gsd-planner` / `gsd-executor` | — | **New plan task type** | High |

---

## 4. High-Value Integration Opportunities

### 4.1 `diagnose-bugs` → `gsd-debug`

**Current `gsd-debug`:** Reproduce → Isolate → Fix → Verify. Good, but shallow.

**What `diagnose-bugs` adds:**
- Phase 1: build a tight, red-capable feedback loop.
- Phase 2: reproduce + minimise.
- Phase 3: ranked, falsifiable hypotheses.
- Phase 4: instrumentation discipline.
- Phase 5: regression test before fix.
- Phase 6: cleanup.

**Recommended integration:**
- Rewrite `agents/gsd-debug.md` to follow the 6-phase loop.
- Add a `/gsd-diagnose` (or `/gsd-debug --deep`) command in `gsd-commands`.
- In `gsd-executor.md`, after 3 failed auto-fix attempts, spawn `gsd-debug` (already planned) but route it through the `diagnose-bugs` discipline.

**Artifact impact:** Debug sessions currently write `.planning/debug/<slug>.md`. Add fields: `feedback-loop`, `minimised-repro`, `hypotheses`, `instrumentation`, `regression-test`.

### 4.2 `review-code` → `gsd-code-review`

**Current `gsd-code-review`:** Reviews plan compliance, requirement coverage, code quality, simplicity, security.

**What `review-code` adds:** Explicit two-axis review:
- **Standards** — repo conventions + Fowler smell baseline.
- **Spec** — what the issue/spec asked for.

**Recommended integration:**
- Update `agents/gsd-code-review.md` to run two parallel subagents:
  - **Standards subagent** — use repo docs (`AGENTS.md`, `CODING_STANDARDS.md`, `.cursor/rules/*.mdc`) + smell baseline.
  - **Spec subagent** — use PLAN.md, REQUIREMENTS.md, CONTEXT.md, and issue references.
- Aggregate findings under `## Standards` and `## Spec` headings in `NN-CODE-REVIEW.md`.
- Add `/gsd-review` command (or extend `/gsd-code-review`) that accepts a fixed-point argument.

**Caveat:** The original `review-code` depends on an issue tracker. GSD already has `REQUIREMENTS.md` and `CONTEXT.md`, so the Spec axis maps naturally without needing a tracker setup.

### 4.3 `codebase-design` → Shared vocabulary for agents

**Impact:** `codebase-design` defines precise terms: module, interface, implementation, depth, seam, adapter, leverage, locality.

**Recommended integration:**
- Add a "Deep Modules" section to `agents/gsd-planner.md` for design tasks.
- Add "Architecture Vocabulary" to `agents/gsd-phase-researcher.md` so hotspots are described in these terms.
- Reference `codebase-design` in `agents/gsd-code-review.md` for structural critique.

**Low-cost start:** Create `prompts/gsd-design.md` that loads `codebase-design` vocabulary into any agent that needs it.

### 4.4 `prototype` → Plan task type

**Current state:** Prototyping is not part of the GSD task taxonomy. Planner only knows `auto` and `checkpoint:human-verify`.

**Recommended integration:**
- Add `prototype` as a task type in `agents/gsd-planner.md` and `templates/plan.md`.
- Add handling in `agents/gsd-executor.md`:
  - For `type="prototype"`, build a throwaway artifact (HTML for logic, route for UI).
  - Do not commit to main; commit to a throwaway branch or save to `.planning/prototypes/`.
  - Capture the verdict in SUMMARY.md.
- Add `/gsd-prototype` command in `gsd-commands`.

**Artifact impact:** New `.planning/prototypes/` directory; new frontmatter `prototype_type: logic | ui`.

### 4.5 `improve-codebase-arch` → Pre-plan architecture review

**Current state:** Architecture review is ad hoc inside research or discuss.

**Recommended integration:**
- Add an optional `/gsd-arch-review` command that produces an HTML report (using the skill's existing report format).
- In `gsd-phase-loop/SKILL.md`, add an optional "Architecture Review" step between Onboard and Discuss, or before Plan.
- Store report in OS temp dir (already specified) and link from `.planning/ARCHITECTURE-REVIEW.md`.

### 4.6 `domain-modeling` → `gsd-discuss`

**Current `gsd-discuss`:** Captures decisions in `NN-CONTEXT.md`.

**What `domain-modeling` adds:** Active glossary/ADR discipline.

**Recommended integration:**
- Update `gsd-discuss.md` to:
  - Read/update `CONTEXT.md` (or `CONTEXT-MAP.md`) during discussion.
  - Challenge fuzzy terms and propose canonical language.
  - Offer ADRs for hard-to-reverse, surprising, trade-off decisions.
- Add `/gsd-domain-model` command for focused glossary/ADR work.

### 4.7 `grill-me` → `gsd-discuss` deep rounds

**Current `gsd-discuss`:** Socratic questioning per gray area.

**What `grill-me` adds:** Round-based frontier questioning with recommended answers and design-tree mapping.

**Recommended integration:**
- Add a "deep grill" mode to `gsd-discuss` for complex gray areas.
- When a gray area has many cascading decisions, use `grill-me` rounds instead of single questions.

### 4.8 `write-for-agents` → Agent authoring quality

**Current state:** Agent prompts are authored manually; no style guide.

**Recommended integration:**
- Add a `CONTRIBUTING-AGENTS.md` or `AGENT-AUTHORING.md` in `gsd-package` summarizing `write-for-agents` principles.
- Apply to all agent `.md` files: front-load leading words, add completion criteria, prune no-ops.
- Add a `/gsd-write-for-agents` command or skill for editing agent docs.

### 4.9 `wait-what` → Recovery pattern

**Current state:** No recovery protocol when user says "wait, what?"

**Recommended integration:**
- Add a recovery instruction to all agent system prompts: "If the user signals confusion, re-pitch using `/skill:wait-what` principles."
- Optional: `gsd-hooks` could detect confusion signals (`wait`, `what?`, `i don't follow`) and notify the agent.

### 4.10 `teach` → Onboarding

**Current state:** Onboarding is codebase mapping + ROADMAP generation.

**Recommended integration:**
- Optional: use `teach` workspace pattern for new team member onboarding to GSD workflow itself.
- Low priority; keep standalone.

---

## 5. Implementation Approaches

### Approach A: Skill-first (low coupling)

Keep the Matt Pocock skills as user-invoked only. Update GSD agent prompts to reference them ("Invoke `/skill:diagnose-bugs` if this bug is hard").

- **Pros:** No code changes. Safe. Easy to revert.
- **Cons:** Agents cannot enforce the discipline; user must remember to invoke.

### Approach B: Agent prompt updates (medium coupling)

Rewrite specific agent system prompts to inline the discipline from the Matt Pocock skill. Keep the skill as the user-facing reference.

- **Pros:** Agents follow the discipline automatically. Still no extension/tool changes.
- **Cons:** Duplication between skill and agent prompt; risk of drift.

### Approach C: New commands + agent updates (high coupling)

Add typed tools in `gsd-commands` (`gsd_diagnose`, `gsd_review`, `gsd_prototype`, etc.) and update agents to call them via `subagent`.

- **Pros:** Tight integration; discoverable; consistent with existing GSD tool style.
- **Cons:** More code; requires tests; careful path/gate handling.

### Approach D: Hybrid (recommended)

Use **Approach B** for vocabulary/skills that should become part of agent behavior (`diagnose-bugs`, `review-code`, `codebase-design`, `domain-modeling`), and **Approach C** for workflow checkpoints that benefit from dedicated commands (`prototype`, `improve-codebase-arch`, `grill-me` rounds).

---

## 6. Recommended Roadmap

### Phase 1 — Quick wins (no new tools)

1. ✅ Update `agents/gsd-debug.md` to use `diagnose-bugs` 6-phase loop.
2. ✅ Update `agents/gsd-code-review.md` to run Standards-vs-Spec two-axis review.
3. ✅ Add `codebase-design` vocabulary to `agents/gsd-planner.md` and `agents/gsd-phase-researcher.md`.
4. ✅ Add `domain-modeling` discipline to `agents/gsd-discuss.md`.
5. ✅ Add recovery guidance from `wait-what` to all agent prompts.

### Phase 2 — New commands

6. Add `/gsd-prototype` command and `prototype` task type.
7. Add `/gsd-arch-review` command.
8. Add `/gsd-grill` deep-round command.

### Phase 3 — Quality + documentation

9. Create `AGENT-AUTHORING.md` from `write-for-agents`.
10. Audit all agent prompts against `write-for-agents` principles.
11. Add integration notes to `gsd-phase-loop/SKILL.md` and `README.md`.

---

## 7. Risks and Gotchas

- **User-invoked vs model-invoked tension.** The new skills are currently `disable-model-invocation: true`. Tight integration (Approach C) may require making some skills model-invokable or inlining their behavior.
- **Agent autonomy vs interaction.** Matt Pocock skills often include user checkpoints ("show the user before testing"). GSD agents should operate autonomously by default and escalate only on genuine blockers. When inlining a skill into an agent, remove mandatory user-consultation steps and replace them with audit-trail entries in the artifact file.
- **Context budget.** Adding vocabulary and workflow steps to every agent increases context load. Use `write-for-agents` principles to keep additions tight.
- **Duplication drift.** If the same discipline lives in both a skill and an agent prompt, they will diverge. Prefer referencing the skill file from the agent prompt when possible.
- **Over-integration.** Not every skill needs to be wired. `teach` and `wait-what` can remain mostly standalone.
- **Path conventions.** Any new command must use the same absolute-path + gate pattern as existing `gsd_*` tools.

---

## 8. Next Step Recommendation

Start with **Phase 1, item 1**: rewrite `agents/gsd-debug.md` around the `diagnose-bugs` 6-phase loop. It has a clear current agent, a clear skill replacement, and a bounded scope. Then proceed to `gsd-code-review.md` for the two-axis review.
