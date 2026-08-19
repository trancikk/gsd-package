---
name: write-for-agents
description: Write documents that agents consume reliably — skills, AGENTS.md, CLAUDE.md, and pointer docs. Use when creating or editing a skill, agent prompt, or project instructions. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (writing-for-agents) for pi"
---

# Write for Agents

Reference for writing any document an agent consumes: a skill, an `AGENTS.md` / `CLAUDE.md`, or any doc reached by a pointer.

The packaging differs; the writing does not. The goal is to make the agent take the same _process_ every run, not produce the same output.

**Invoke with:** `/skill:write-for-agents`

---

## Context pointers

A **context pointer** is a reference in the agent's context that names out-of-context material and encodes when to reach it. A skill's description is one; a line in `AGENTS.md` naming a doc is another.

The pointer's **wording**, not its target, decides when the agent reaches the material. A must-have target behind weak wording is a variance bug: sharpen the wording first, inline the material only if sharpening fails.

Pointer rules:

- **Front-load the leading word.**
- **One trigger per branch.** Synonyms for the same branch are bloat; collapse them.
- **Cut identity the body already carries.**

---

## The two loads

Every document and pointer spends one of two budgets:

- **Context load** — cost of always-loaded material on the agent's window: `AGENTS.md` lines, skill descriptions, anything loaded every turn.
- **Cognitive load** — cost on the human who must remember which documents exist and when to reach for each. Not a cost to minimise; spend it where human judgement matters.

Material reached only through a pointer escapes context load at the price of the pointer's line. Material with no pointer rides entirely on cognitive load.

---

## Information hierarchy

A document mixes **steps** (ordered actions) and **reference** (definitions, rules, facts). The decision is where each piece sits on the ladder of immediate need:

1. **In-file step** — what the agent does, in order.
2. **In-file reference** — consulted on demand.
3. **Disclosed reference** — separate file reached by a pointer, loaded only when the pointer fires.

**Progressive disclosure** moves material down the ladder so the top stays legible. Inline what every branch needs; push behind a pointer what only some branches reach.

**Co-location** keeps a concept's definition, rules, and caveats under one heading. Scattering fragments one meaning across many places hurts readability; duplication repeats one meaning in many places.

**Sprawl** is the failure mode: a document too long even when every line is live. Cure it with the ladder — disclose reference behind pointers, split by branch or sequence.

---

## Steps and completion criteria

Every step ends on a **completion criterion** — the condition that tells the agent it is done.

- **Clarity** — can the agent tell done from not-done? Vague bounds invite premature completion. Sharpen the bound first; only if it is irreducibly fuzzy, hide later steps behind a real context boundary (hand-off or subagent).
- **Demand** — how much the step requires. "Every modified model accounted for" forces more thorough work than "produce a change list". Demand drives legwork even when it is not written as its own step.

The strongest criteria are both checkable and exhaustive.

---

## When to split

Splitting spends one of the two loads, so split only when the cut earns it:

- **By sequence** — split a run of steps where later steps tempt rushing the current one.
- **By invocation** — for skills, see pi's Agent Skills spec: user-invoked vs model-invoked, router skills, and `disable-model-invocation`.

---

## Leading words

A **leading word** is a compact concept already in the model's pretraining that the agent thinks with while running the document. Repeated as a token, it anchors a region of behaviour in few tokens by recruiting priors.

Examples:

- "fast, deterministic, low-overhead" → **tight** loop.
- "a loop you believe in" → **red** — the loop goes red on the bug, or it does not.

Coining your own word works only if you define it clearly; a made-up word recruits no priors and costs definition tokens.

**Negation is the failure mode beside this lever.** Steering by prohibition drags the forbidden behaviour into context and makes it _more_ available. State the positive target behaviour instead.

---

## Pruning

- **Single source of truth** — one authoritative place per meaning. Duplication costs maintenance and inflates a meaning's prominence past its real rank.
- **The environment is a source of truth too** — `package.json` scripts, config files, directory layout, `--help` output. Cache only what the agent cannot find by looking: unwritten conventions, reasons behind choices, gotchas.
- **Relevance** — every line must bear on the document's task. Without pruning, documents accumulate **sediment**: stale layers that bury what is still live.
- **No-ops** — if a sentence does not change behaviour versus the default, delete it. A word too weak to beat the default is a no-op; fix with a stronger word, not more words.
