---
phase: <NN>
plan: <PP>
status: complete | partial | failed
actuals:
  tokens: 0
  tasks: 0
  commits: 0
---

# Summary <NN>-<PP>: [Plan Title]

## What Was Built
[Description of what was implemented — files created/modified, behavior added]

## Deviations from Plan
<!-- Any differences between the plan and what was actually implemented -->

- [Deviation and reason]

## Acceptance Self-Check
| Criterion | Status | Evidence |
|-----------|--------|----------|
| [Criterion 1] | ✅ / ❌ / ⚠️ | [How verified] |
| [Criterion 2] | ✅ / ❌ / ⚠️ | [How verified] |

## Dependency Output
[What this plan produced that downstream plans depend on — exported functions, created files, new types]

## Commits
- `[hash]` — [commit message]
- `[hash]` — [commit message]

## Notes for Verifier
[Anything the verifier should pay special attention to — tricky edge cases, known limitations]
