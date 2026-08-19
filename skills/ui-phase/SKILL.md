---
name: ui-phase
description: Interactive UI design contract for frontend phases. Use when the user wants to define visual/interaction contracts and produce UI-SPEC.md. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-19"
metadata:
  source: "Adapted from gsd-package agent gsd-ui-researcher for parent-turn interactivity in pi"
---

# UI Phase

Create a UI design contract (`UI-SPEC.md`) for a frontend phase. Ask the user only what upstream `CONTEXT.md` and `REQUIREMENTS.md` did not already answer; detect the design system from the codebase.

**Invoke with:** `/skill:ui-phase [phase]`

## Load context

Read:

- `.planning/phases/<NN>-<slug>/<NN>-CONTEXT.md` — user decisions from discuss-phase
- `.planning/phases/<NN>-<slug>/<NN>-RESEARCH.md` — technical findings
- `.planning/REQUIREMENTS.md` — any visual/UX requirements
- Prior `UI-SPEC.md` files for patterns

## Detect design system

Run lightweight probes:

```bash
ls components.json tailwind.config.* postcss.config.* 2>/dev/null
find src -path '*/components/*' -name '*.tsx' 2>/dev/null | head -20
```

## Collect the contract

Use `ask_user_question` to confirm or set:

1. **Spacing scale** — e.g., 4, 8, 16, 24, 32, 48, 64
2. **Typography** — 3–4 sizes, 1–2 weights, line heights
3. **Color contract** — 60/30/10 split and accent usage
4. **Copywriting** — CTA labels, empty/error state copy, destructive confirmations
5. **Component inventory** — list of components needed for this phase

For each category, recommend defaults and offer options. Skip categories already resolved in upstream artifacts.

## Write UI-SPEC.md

Write to `.planning/phases/<NN>-<slug>/<NN>-UI-SPEC.md` and include:

- Design system info
- Spacing scale
- Typography scale
- Color contract
- Copywriting contract
- Component inventory

## Optional verification

If the user wants a review, call `gsd-ui-checker` or `gsd-ui-auditor` as an autonomous subagent with the produced `UI-SPEC.md` path.

## Done when

- `UI-SPEC.md` is written and verified to exist.
- User confirms the contract is sufficient for planning.
