---
phase: <NN>
plan: <PP>
wave: 1
depends_on: []
files:
  - path/to/file1.ts
  - path/to/file2.ts
requirements:
  - REQ-01
must_haves:
  truths:
    - "[Verifiable truth about the code — e.g., 'The auth middleware returns 401 for expired tokens']"
  artifacts:
    - "[File or export that must exist — e.g., 'src/middleware/auth.ts exports validateToken']"
  key_links:
    - "[Connection that must work — e.g., 'POST /api/login calls validateToken before session creation']"
estimate:
  tokens: 50000
  tasks: 4
  confidence: low
---

# Plan <NN>-<PP>: [Plan Title]

## Objective
[What this plan achieves in one sentence]

## Context
<!-- Read these files before starting -->
- `.planning/PROJECT.md` — project overview
- `.planning/STATE.md` — current position
- `.planning/phases/<NN>-<slug>/<NN>-CONTEXT.md` — phase decisions
- `.planning/phases/<NN>-<slug>/<NN>-RESEARCH.md` — research findings (if available)

## Tasks

### Task 1: [Task Name]
- **Type:** auto | prototype | checkpoint:human-verify
- **Files:** `[file:line]`, `[file:line]` — files to read before acting (fallback: use **Read first**)
- **Read first:** `[file:line]` — [what to look for]
- **Action:** [What to implement/change]
- **Verify:** [How to confirm it works — test command, manual check]
- **Acceptance criteria:**
  - [Criterion 1]
  - [Criterion 2]

### Task 2: [Task Name]
- **Type:** auto
- **Files:** `[file:line]` — files to read before acting (fallback: use **Read first**)
- **Read first:** `[file:line]` — [what to look for]
- **Action:** [What to implement/change]
- **Verify:** [How to confirm it works]
- **Acceptance criteria:**
  - [Criterion 1]

## Integration Points
[Where this plan's output connects to other plans — interfaces, shared types, call sites]
