---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (domain-modeling) for pi"
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise.

**Invoke with:** `/skill:domain-modeling`

---

## File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
```

If a `CONTEXT-MAP.md` exists, the repo has multiple contexts. The map points to where each one lives.

Create files lazily — only when you have something to write.

---

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with `CONTEXT.md`, call it out immediately: "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term: "You're saying 'account' — do you mean the Customer or the User?"

### Discuss concrete scenarios

Stress-test domain relationships with specific edge-case scenarios. Force precision about boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. Surface contradictions: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Use the format in [references/CONTEXT-FORMAT.md](references/CONTEXT-FORMAT.md).

`CONTEXT.md` should be totally devoid of implementation details. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer an ADR when all three are true:

1. **Hard to reverse** — changing your mind later costs meaningful effort.
2. **Surprising without context** — a future reader will wonder "why?"
3. **Result of a real trade-off** — genuine alternatives were considered.

Use the format in [references/ADR-FORMAT.md](references/ADR-FORMAT.md).
