# Design It Twice

When the user wants to explore alternative interfaces for a chosen deepening candidate. Based on Ousterhout — your first idea is unlikely to be the best.

## Process

### 1. Frame the problem space

Write a user-facing explanation of:

- Constraints any new interface must satisfy.
- Dependencies and their categories (see [DEEPENING.md](DEEPENING.md)).
- A rough illustrative code sketch to ground constraints — not a proposal.

Show it to the user, then proceed to Step 2.

### 2. Spawn subagents

Use the `subagent` tool with `workflowScript` to run 3+ agents in parallel. Each produces a **radically different** interface.

Give each agent a different design constraint:

- **Agent 1:** Minimise the interface — 1–3 entry points max. Maximise leverage per entry point.
- **Agent 2:** Maximise flexibility — support many use cases and extension.
- **Agent 3:** Optimise for the most common caller — make the default case trivial.
- **Agent 4 (if applicable):** Design around ports & adapters for cross-seam dependencies.

Include both codebase-design vocabulary and project domain vocabulary in the brief.

Each agent outputs:

1. Interface (types, methods, params, invariants, ordering, errors).
2. Usage example.
3. What the implementation hides behind the seam.
4. Dependency strategy and adapters.
5. Trade-offs — where leverage is high, where it's thin.

### 3. Present and compare

Present designs sequentially, then compare by **depth**, **locality**, and **seam placement**. Give your own recommendation. Propose a hybrid if elements from different designs combine well. Be opinionated.
