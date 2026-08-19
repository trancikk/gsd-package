# Research: How GSD-OpenCode handles interactive vs autonomous agents

## Sources

- `https://github.com/rokicool/gsd-opencode` (cloned to `/c/tmp/pi-github-repos/rokicool/gsd-opencode`)
  - `gsd-opencode/commands/gsd/gsd-discuss-phase.md`
  - `gsd-opencode/commands/gsd/gsd-ui-phase.md`
  - `gsd-opencode/agents/gsd-ui-researcher.md`
  - `gsd-opencode/agents/gsd-debug-session-manager.md`
  - `gsd-opencode/get-shit-done/workflows/execute-phase.md`
  - `gsd-opencode/get-shit-done/workflows/discuss-phase.md`
  - `gsd-opencode/docs/ARCHITECTURE.md`
- `https://github.com/nicobailon/pi-subagents` (cloned to `/c/tmp/pi-github-repos/nicobailon/pi-subagents`)
  - `skills/pi-subagents/SKILL.md`
  - `skills/pi-subagents/references/execution-controls.md`
  - `skills/pi-subagents/references/constraints-and-recipes.md`
  - `docs/tool-reference.md`

## Finding 1 — GSD-OpenCode separates slash commands from subagents

GSD-OpenCode has two runtime surfaces:

1. **Slash commands** in `gsd-opencode/commands/gsd/*.md`
   - These run in the main OpenCode assistant turn.
   - They declare `permissions:` including `question: true` when they need to ask the user.
   - Example: `gsd-discuss-phase.md` has `question: true` and executes `workflows/discuss-phase.md`, which uses `question` to let the user pick gray areas to discuss.

2. **Subagents** in `gsd-opencode/agents/*.md`
   - Frontmatter includes `mode: subagent` and a `tools:` allowlist.
   - They are spawned from commands/workflows using `task(subagent_type="gsd-<agent>", ...)`.
   - Example from `execute-phase.md`:
     > "OpenCode: Uses `task(subagent_type="gsd-executor", ...)` — blocks until complete, returns result"

This means **interactivity lives in the command layer**, not inside the subagent prompt. The command asks the user, then passes structured input to the subagent.

## Finding 2 — Most OpenCode subagents are autonomous

Of the ~30 agents in `gsd-opencode/agents/`, only a few declare `question: true`:

- `gsd-debug-session-manager.md` — manages multi-cycle debug checkpoints and explicitly uses `question` for continuation.
- `gsd-eval-planner.md` — interactive evaluation planner.
- `gsd-framework-selector.md` — interactive framework-selection interview.

The common research/execution agents (`gsd-ui-researcher`, `gsd-planner`, `gsd-executor`, `gsd-phase-researcher`, `gsd-verifier`, etc.) do **not** have `question: true`. Their prompts say "ask only what CONTEXT.md did not already answer" — but they have no tool to ask the user, so they proceed autonomously from the provided context.

## Finding 3 — Pi subagents do not have a direct user-question channel

The `pi-subagents` runtime provides `contact_supervisor` for a child to ask the **parent orchestrator** for a decision, and the parent can then ask the user. Key quote from `references/execution-controls.md`:

> "Native supervisor coordination injects `contact_supervisor`, not generic `intercom`."
> "Use `contact_supervisor` with `reason: "need_decision"` when a subagent is blocked on a decision."

There is no documented `ask_user_question` or `interview` tool available to child subagents. The parent-level skill instructs the parent to "use `interview` to ask every clarification question needed for shared understanding."

So in pi:

- A background subagent cannot ask the user directly.
- It can only escalate to the parent via `contact_supervisor`.
- The parent must then use `ask_user_question`/`interview` and reply to the child.

## Finding 4 — GSD-OpenCode does not put confusion-recovery boilerplate in subagents

Searching `gsd-opencode/agents/` for `Confusion Recovery` or `wait-what` returns nothing. The `wait-what`-style recovery guidance exists only in command workflows or reference docs, where the main-turn assistant has a live user channel. Subagent prompts are purely autonomous.

By contrast, every agent in `gsd-package/agents/` currently ends with a `## Confusion Recovery` section copied from the `wait-what` skill. That section instructs the agent to re-pitch if the user says "wait" or "what?". For a pi background subagent, this instruction is unreachable noise; it also trains the model toward a user-interaction pattern it cannot actually perform.

## Implication for our cleanup plan

1. **Remove `## Confusion Recovery` from all autonomous gsd-package agents.** This matches the GSD-OpenCode model.
2. **Remove interactive agents from the pi subagent registry.** The pi runtime cannot support them as background subagents.
3. **Move interactivity to parent-turn slash commands or skills.** The equivalent of GSD-OpenCode's `commands/gsd/gsd-discuss-phase.md` is a pi skill/slash command that uses `ask_user_question`/`interview` and then optionally calls a non-interactive subagent.
4. **If a subagent truly needs a mid-run decision**, use `contact_supervisor` (parent escalation) rather than pretending the subagent can ask the user. This is the only supported inter-child-to-human path in pi.
