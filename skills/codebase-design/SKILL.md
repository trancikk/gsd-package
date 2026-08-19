---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when designing or improving a module's interface, finding deepening opportunities, deciding where a seam goes, making code more testable, or when another skill needs the deep-module vocabulary. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (codebase-design) for pi"
---

# Codebase Design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Use this language and these principles wherever code is being designed or restructured.

**Invoke with:** `/skill:codebase-design`

---

## Glossary

Use these terms exactly — don't substitute "component," "service," "API," or "boundary."

| Term | Meaning | Avoid |
|------|---------|-------|
| **Module** | Anything with an interface and implementation. Scale-agnostic: function, class, package, or tier-spanning slice. | unit, component, service |
| **Interface** | Everything a caller must know to use the module correctly: signature, invariants, ordering, errors, config, perf. | API, signature |
| **Implementation** | What's inside a module. Distinct from **Adapter**. | — |
| **Depth** | Leverage at the interface: behaviour exercised per unit of interface learned. | — |
| **Seam** | Place where behaviour can be altered without editing there (Feathers). | boundary |
| **Adapter** | Concrete thing that satisfies an interface at a seam. | — |
| **Leverage** | Capability callers get from depth: more per unit of interface learned. | — |
| **Locality** | Change, bugs, knowledge, and verification concentrate in one place. | — |

---

## Deep vs shallow

**Deep module** = small interface + lots of implementation.

**Shallow module** = large interface + little implementation (avoid).

Ask when designing an interface:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

---

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable parts — they just aren't part of the interface.
- **The deletion test.** If deleting the module concentrates complexity, it was earning its keep. If it just moves complexity, it was a pass-through.
- **The interface is the test surface.** Callers and tests cross the same seam. Testing past the interface means the module is the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.

---

## Designing for testability

1. **Accept dependencies, don't create them.**
2. **Return results, don't produce side effects.**
3. **Small surface area.** Fewer methods = fewer tests. Fewer params = simpler test setup.

---

## Relationships

- A **Module** has exactly one **Interface**.
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

---

## Going deeper

- [Deepening a cluster](references/DEEPENING.md) — dependency categories, seam discipline, replace-don't-layer testing.
- [Design it twice](references/DESIGN-IT-TWICE.md) — parallel subagents for radically different interfaces.
