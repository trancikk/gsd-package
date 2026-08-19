---
name: grill-me
description: Relentless interview to sharpen a plan, design, or decision before building. Use when the user wants to stress-test their thinking or says anything like "grill me". User-invoked only.
disable-model-invocation: true
version: 2
created: "2026-08-18"
updated: "2026-08-19"
metadata:
  source: "Adapted from mattpocock/skills (grill-me / grilling) for pi"
---

# Grill Me

Interview the user relentlessly until you reach a shared understanding. Map the topic as a **design tree**: every decision branches into the decisions that hang off it.

**Invoke with:** `/skill:grill-me <topic>`

---

## Work in rounds

The **frontier** is every decision whose prerequisites are already settled: questions you can ask *now* without guessing at answers you have not heard yet.

Ask the whole frontier in **one round**, but use the `ask_user_question` tool instead of presenting a plain text list.

### `ask_user_question` constraints

- One `ask_user_question` call can contain **1–4 questions**.
- Each question needs:
  - `header`: max 16 characters (short chip, e.g., `Approach`).
  - `question`: the full question text.
  - `options`: **2–4 options**, each with a `label` (max 60 chars) and `description`.
- Your **recommended answer** should be the first option.
- Do **not** add an "Other" option — the UI already provides a "Type something" row for freeform answers.
- If a question feels open-ended, still provide 2–4 concrete options that cover the likely answers; the user can type a custom answer if none fit.

Batch related frontier questions into a single `ask_user_question` call when possible. If the frontier has more than 4 questions, split them into multiple calls.

### Question option format

Each option should look like:

```text
[Short label]
Short description of what this option means and when to pick it.
```

Example:

```yaml
label: "From CONTEXT.md"
description: "Use the CONTEXT.md file as the single source of truth and only add ADRs for hard-to-reverse decisions."
```

---

## GRILL.md artifact — MANDATORY

**You MUST write/update `GRILL.md` to disk before completing each response.**

- Create the file early with a placeholder header.
- After each round, append the frontier questions, the options you offered, and the user's answers.
- Update the design tree and status as decisions settle.
- Verify the file exists with `ls -la` before returning.

Use this shape:

```markdown
---
topic: "[what is being grilled]"
rounds: 0
status: "open | complete"
---

# Grill: [topic]

## Round N
### Frontier
1. **Q1 — [title]**
   - Options: [A / B / C]
   - ➡️ Recommended: [A]

### Answers
1. [user answer]

## Design Tree
- [decision] → [dependent decisions]

## Shared understanding
[summary once complete]
```

---

## Facts vs decisions

**Finding facts is your job, never the user's.** When a frontier question needs a fact from the environment (filesystem, tools, repo state), dispatch a subagent or use the available tools to find it. Do not ask the user for anything you could look up yourself.

Do not block the whole round on one exploration. A running exploration is an unsettled prerequisite, so only questions downstream of it wait; ask the rest of the frontier now.

The **decisions** are the user's: put each to them with `ask_user_question` and wait.

---

## Done when

The session is complete when the frontier is empty: every branch of the design tree visited, nothing left silently assumed.

Do **not** act on the plan until the user confirms you have reached a shared understanding.
