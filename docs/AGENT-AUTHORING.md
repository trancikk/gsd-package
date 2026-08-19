# Agent Authoring Guide

Guidelines for writing agent system prompts in `gsd-package/agents/`. Derived from the `write-for-agents` skill.

## Core principle

An agent prompt is a program the model runs every time it is invoked. Optimize for **predictable process**, not predictable output.

---

## Frontmatter

Every agent must have:

```yaml
---
name: gsd-<name>
description: One-line, specific description of what the agent does and when to use it.
tools: [read, grep, find, ls, bash, edit, write, ...]
thinking: medium | high
systemPromptMode: replace
inheritProjectContext: true
inheritSkills: false
defaultContext: fresh | fork
output: <artifact-name>.md
---
```

- **description** — be specific. This is the pointer that decides when the agent is reached.
- **tools** — list only what the agent needs. Too many tools invite misuse.
- **thinking** — use `high` for planning/review, `medium` for focused execution.
- **defaultContext** — `fresh` for artifact-producing agents; `fork` for interactive agents.

---

## Prompt structure

Order matters. A well-structured prompt reads top-to-bottom like a checklist:

1. **Identity** — what the agent is and what it produces.
2. **CRITICAL directive** — artifact-writing rules, non-negotiable.
3. **Project context** — `AGENTS.md`, `CONVENTIONS.md`.
4. **Workflow** — numbered steps the agent follows.
5. **Output format** — exact artifact shape and example.
6. **Rules / guardrails** — deviation rules, analysis-paralysis guards.
7. **Final response shape** — what to say when returning.

---

## Leading words

Use compact terms the model already understands. Repeat them as tokens, never as full explanations:

- **tight** loop (fast, deterministic feedback)
- **red-capable** (can catch the bug)
- **deep** module (small interface, rich implementation)
- **seam** (behaviour-alteration point)
- **frontier** (questions whose prerequisites are settled)

Avoid coining new terms unless you define them clearly.

---

## Completion criteria

Every step ends with a checkable condition. Bad vs good:

| Bad | Good |
|-----|------|
| "Understand the codebase" | "Read `src/auth.ts` and identify the three auth middleware entry points" |
| "Review the changes" | "Run `git diff ...HEAD` and classify every finding as BLOCKER/WARNING/INFO" |
| "Plan the implementation" | "Produce `01-01-PLAN.md` with 2-3 tasks, wave numbers, and must_haves" |

Vague bounds invite premature completion.

---

## Pruning

- **Single source of truth.** Don't restate `package.json` scripts or config files; reference them.
- **No-op sentences.** If a sentence does not change behaviour versus the default, delete it.
- **No negation steering.** Say "write one-line comments", not "don't write long comments".

---

## Autonomy

Agents run unattended. Avoid mandatory user checkpoints mid-workflow. Instead:

- Make the decision and record it in the artifact.
- Escalate only on genuine blockers.
- Inform the user in the final response, don't consult them during execution.

If a skill being inlined has user checkpoints (e.g., "show the user before testing"), replace them with autonomous defaults and artifact audit trails.

## Autonomy rule for subagent agents

Agents that run as pi subagents **must not** ask the user questions or react to user confusion signals. Pi subagents do not have a direct user-interaction channel.

- Do **not** include `ask_user_question` in the `tools:` frontmatter.
- Do **not** include `## Confusion Recovery`, "re-pitch if the user says wait/what", or any "wait-what" handling.
- Do **not** instruct the agent to "wait for user approval", "ask the user", or "interview the user".
- For genuine blockers that need a human decision, use `contact_supervisor({ reason: "need_decision", message: "..." })`. The parent orchestrator will ask the user and reply.
- Interactive protocols belong in parent-turn skills or slash commands, not in subagent prompts.

Before declaring an agent complete, grep its prompt for `ask_user_question`, `Confusion Recovery`, `signals confusion`, `re-pitch`, `ask the user`, and `wait for the user's`. Remove every hit.

---

## Artifact discipline

Every artifact-producing agent must:

1. Create the file early with a placeholder header.
2. Write complete content before returning.
3. Verify with `ls -la` that the file exists and is non-empty.
4. Use absolute output paths when invoked via `gsd-commands`.

---

## Integration with skills

When an agent's behaviour is derived from a skill:

1. Inline the essential discipline into the agent prompt.
2. Reference the skill file for extended vocabulary or reference docs.
3. Keep the skill as the user-facing `/skill:name` entry point.
4. Avoid duplicating long reference sections — use `references/` in the skill directory.

Example: `gsd-debug` inlines the `diagnose-bugs` 6-phase loop; `gsd-code-review` inlines the two-axis review from `review-code`.

---

## Review checklist

Before adding or editing an agent, verify:

- [ ] Frontmatter is complete and accurate.
- [ ] Description is specific enough to trigger correctly.
- [ ] CRITICAL artifact-writing section is present.
- [ ] Workflow steps have checkable completion criteria.
- [ ] No mandatory user checkpoints mid-workflow.
- [ ] Output format includes a concrete example.
- [ ] Final response shape is defined.
- [ ] No-ops and restatements are removed.
- [ ] Leading words are used consistently.
- [ ] Skill-derived behaviour is properly inlined and attributed.
- [ ] No user questions, confusion recovery, or wait-what handling in subagent prompts (only `contact_supervisor` for genuine blockers).
