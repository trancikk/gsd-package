---
name: improve-codebase-arch
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through the chosen one. Use when the user wants to improve architecture, testability, or AI-navigability. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (improve-codebase-architecture) for pi"
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

**Invoke with:** `/skill:improve-codebase-arch <optional module or pain point>`

This skill is informed by the deep-module vocabulary in `codebase-design`. Read `../codebase-design/SKILL.md` before exploring.

---

## 1. Explore

**Scope before you scan — YAGNI.** Deepening pays off where future changes cluster.

- If the user named a module/subsystem/pain point, take it.
- Otherwise, walk recent commit history (`git log --oneline`) to find hot spots.

Read the project's domain glossary (`CONTEXT.md` if it exists) and any ADRs in the area first.

Then explore organically. Note friction:

- Understanding one concept requires bouncing between many small modules.
- Modules are **shallow** — interface nearly as complex as implementation.
- Pure functions were extracted for testability, but real bugs hide in how they're called (no **locality**).
- Tightly-coupled modules leak across their seams.
- Parts are untested or hard to test through the current interface.

Apply the **deletion test**: would deleting the module concentrate complexity or just move it?

---

## 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory. Resolve the temp dir from `$TMPDIR`, fallback to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html`.

Open it for the user (`xdg-open`, `open`, or `start`) and tell them the absolute path.

The report uses **Tailwind via CDN** and **Mermaid via CDN**. See [references/HTML-REPORT.md](references/HTML-REPORT.md) for the full scaffold and styling guidance.

For each candidate, render a card with:

- **Files** — involved modules/files.
- **Problem** — one sentence.
- **Solution** — one sentence.
- **Benefits** — ≤6-word bullets in terms of locality, leverage, and testability.
- **Before / After diagram** — side-by-side.
- **Recommendation strength** — `Strong`, `Worth exploring`, or `Speculative`.
- **ADR callout** (if applicable) — when the candidate contradicts an existing ADR but warrants reopening.

End with a **Top recommendation** section.

**Use the codebase-design vocabulary** and the project's domain vocabulary. Do not propose interfaces yet. After writing the file, ask: "Which of these would you like to explore?"

---

## 3. Grilling loop

Once the user picks a candidate, run `/skill:grill-me` or read `../grill-me/SKILL.md` and walk the decision tree: constraints, dependencies, shape of the deepened module, what sits behind the seam, what tests survive.

As decisions crystallise, keep the domain model current:

- **New term not in `CONTEXT.md`?** Add it. Create `CONTEXT.md` lazily if absent.
- **Sharpening a fuzzy term?** Update `CONTEXT.md` inline.
- **User rejects a candidate with a load-bearing reason?** Offer an ADR. Only offer if the reason would help a future explorer avoid re-suggesting the same thing.
- **Exploring alternative interfaces?** Read `../codebase-design/references/DESIGN-IT-TWICE.md` and run the parallel subagent pattern.
