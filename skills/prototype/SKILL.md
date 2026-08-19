---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (prototype) for pi"
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

**Invoke with:** `/skill:prototype <question>`

---

## Pick a branch

Identify which question is being answered:

- **"Does this logic / state model feel right?"** → [references/LOGIC.md](references/LOGIC.md). Build a single shareable HTML file with free-play buttons and guided walkthroughs.
- **"What should this look like?"** → [references/UI.md](references/UI.md). Generate several radically different UI variations on a route, switchable via URL param and a floating bottom bar.

Getting the branch wrong wastes the prototype. If the question is ambiguous and the user isn't reachable, default to the branch matching the surrounding code (backend module → logic; page/component → UI) and state the assumption.

---

## Rules that apply to both

1. **Throwaway from day one.** Locate it close to where it will be used but name it obviously as a prototype.
2. **Trivial to run.** One command or a double-click. No thinking required.
3. **No persistence by default.** State lives in memory unless the question is explicitly about persistence.
4. **Skip the polish.** No tests, no error handling beyond runnable, no abstractions.
5. **Surface the state.** After every action or variant switch, print/render the full relevant state.
6. **Capture it when done.** Fold validated decisions into real code, then capture the prototype as a primary source on a throwaway branch with a pointer on the issue.

---

## Capture

Once the prototype has answered its question:

- Record the verdict and the question it settled.
- Lift validated logic into the real module.
- Move the prototype code onto a throwaway branch, not into main.
- The main branch keeps only the validated decision.
