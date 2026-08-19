---
name: review-code
description: Two-axis review (Standards vs Spec) of changes since a fixed point. Use when the user wants to review a branch, PR, work-in-progress changes, or asks to "review since X". User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (code-review) for pi"
---

# Review Code

Review the diff between `HEAD` and a fixed point along two independent axes:

- **Standards** — does the code follow this repo's documented conventions?
- **Spec** — does the code match the originating issue / spec?

Run both axes in **parallel pi subagents** so they do not pollute each other's context, then aggregate their findings.

**Invoke with:** `/skill:review-code <fixed-point>`

---

## 1. Pin the fixed point

Accept whatever the user supplies: commit SHA, branch, tag, `main`, `HEAD~5`, etc. If they did not specify one, ask.

Capture:

```bash
git diff <fixed-point>...HEAD
git log <fixed-point>..HEAD --oneline
```

Use the three-dot diff so the comparison is against the merge-base.

Confirm the ref resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. Fail here on a bad ref or empty diff, not inside the subagents.

---

## 2. Identify the spec source

Look for the originating spec in this order:

1. **Issue references** in commit messages (`#123`, `Closes #45`, GitLab `!67`).
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, `.scratch/`, or `.planning/` matching the branch name or feature.
4. Ask the user if nothing is found. If there is no spec, the Spec subagent skips and reports "no spec available".

---

## 3. Identify the standards sources

Collect any repo document that defines how code should be written — e.g. `AGENTS.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `.cursor/rules/*.mdc`.

On top of documented standards, the Standards axis always carries the **smell baseline** below. Two rules bind it:

- **Repo overrides.** A documented standard always wins; suppress a smell when the repo endorses the pattern.
- **Always a judgement call.** Each smell is a labelled heuristic, never a hard violation. Skip anything tooling already enforces.

### Smell baseline (Fowler, *Refactoring*, ch. 3)

| Smell | What it is | Fix |
|-------|-----------|-----|
| **Mysterious Name** | Name does not reveal intent. | Rename; if no honest name exists, the design is murky. |
| **Duplicated Code** | Same logic shape appears more than once. | Extract and call from both sites. |
| **Feature Envy** | Method reaches into another object's data more than its own. | Move the method onto the data it envies. |
| **Data Clumps** | Same few fields/params travel together. | Bundle into a type. |
| **Primitive Obsession** | Primitive stands in for a domain concept. | Give the concept its own small type. |
| **Repeated Switches** | Same `switch`/`if`-cascade recurs on the same type. | Replace with polymorphism or a shared map. |
| **Shotgun Surgery** | One logical change forces scattered edits. | Gather what changes together into one module. |
| **Divergent Change** | One file is edited for several unrelated reasons. | Split so each module changes for one reason. |
| **Speculative Generality** | Abstractions/hooks added for needs the spec does not have. | Delete; inline until a real need shows. |
| **Message Chains** | Long `a.b().c().d()` navigation. | Hide the walk behind one method. |
| **Middle Man** | Class/function mostly delegates onward. | Cut it, call the real target direct. |
| **Refused Bequest** | Subclass ignores most of what it inherits. | Drop inheritance, use composition. |

---

## 4. Spawn parallel subagents

Use the `subagent` tool with `workflowScript` to run both reviews in parallel.

### Standards subagent prompt

Include:

- The diff command and commit list.
- The standards-source files found in step 3, plus the full smell baseline.
- Brief: "Report, per file/hunk where relevant: (a) every place the diff violates a documented standard — cite the standard file and rule; (b) any baseline smell — name it and quote the hunk. Distinguish hard violations from judgement calls; baseline smells are always judgement calls. Skip anything tooling enforces. Under 400 words."

### Spec subagent prompt

Include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- Brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that was not asked for (scope creep); (c) requirements that look implemented but wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec subagent and note this in the final report.

---

## 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings.

End with a one-line summary: total findings per axis, and the worst issue *within each axis* (if any). Do not pick a single winner across axes.

---

## Why two axes

A change can pass one axis and fail the other:

- Follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Does exactly what the issue asked but breaks conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
