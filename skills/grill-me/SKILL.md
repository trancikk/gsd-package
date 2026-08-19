---
name: grill-me
description: Relentless interview to sharpen a plan, design, or decision before building. Use when the user wants to stress-test their thinking or says anything like "grill me". User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (grill-me / grilling) for pi"
---

# Grill Me

Interview the user relentlessly until you reach a shared understanding. Map the topic as a **design tree**: every decision branches into the decisions that hang off it.

**Invoke with:** `/skill:grill-me <topic>`

---

## Work in rounds

The **frontier** is every decision whose prerequisites are already settled: questions you can ask *now* without guessing at answers you have not heard yet.

Ask the whole frontier in **one round**. Number each question and give your recommended answer. Then wait for the user's answers before the next round.

Each question format:

```
❓ **Q1** - **<question title>**: <question body, possibly multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock dependent questions. Recompute the frontier and ask the next round. A question whose answer depends on another still-open question belongs to a **later round**.

---

## Facts vs decisions

**Finding facts is your job, never the user's.** When a frontier question needs a fact from the environment (filesystem, tools, repo state), dispatch a subagent or use the available tools to find it. Do not ask the user for anything you could look up yourself.

Do not block the whole round on one exploration. A running exploration is an unsettled prerequisite, so only questions downstream of it wait; ask the rest of the frontier now.

The **decisions** are the user's: put each to them and wait.

---

## Done when

The session is complete when the frontier is empty: every branch of the design tree visited, nothing left silently assumed.

Do **not** act on the plan until the user confirms you have reached a shared understanding.
