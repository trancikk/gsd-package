# Project: gsd-core (GSD Core for pi)

## Core Value

`gsd-core` ports the GSD (Git. Ship. Done.) spec-driven phase-loop workflow to the pi agent runtime, keeping the parent orchestrator lean by pushing heavy research, planning, execution, and verification into focused, fresh-context subagents.

## Description

Modern software work in pi often collapses research, planning, implementation, and verification into a single long conversation. That causes context rot, contradictory decisions, and half-finished refactors. `gsd-core` solves this by providing a structured artifact layer (`.planning/`), typed pi extensions (`gsd-commands`, `gsd-hooks`), reusable subagent prompts, skills, and prompt templates that guide a project through repeatable Discuss → Research → Plan → Execute → Verify → Ship cycles.

The package is intended for pi users working on multi-file or cross-cutting codebases who want verified, shippable increments with a persistent record of decisions, requirements, and state.

## Requirements

- Provide typed pi tools that prepare focused `subagent()` invocations for each GSD step.
- Maintain atomic, version-friendly `.planning/` artifacts (STATE, BACKLOG, WORKSTREAMS, phase docs).
- Guard against context rot, prompt injection, and workflow drift via runtime hooks.
- Ship reusable agent prompts and skill templates that teams can adopt without reauthoring the workflow.

## Constraints

- Must run inside the pi agent runtime; depends on `@earendil-works/pi-agent-core` and `@earendil-works/pi-coding-agent`.
- No compile step — pi consumes TypeScript extensions directly via `tsx`.
- Must remain compatible with parent-turn skills and slash commands that need user interaction.
- Cross-repo consumers (e.g., `fifa.ai`) may keep copies of agent files that must stay in sync.

## Key Decisions

- **D-01-01:** Use fresh-context subagents for heavy work to limit context rot.
- **D-01-02:** Store all planning state in Markdown + JSON under `.planning/` so it is human-readable and diff-friendly.
- **D-01-03:** Separate interactive user-facing protocols (slash commands / skills) from background subagent agents.

## Architecture

TypeScript extensions register pi tools and hooks:

- `gsd-commands` — workflow, state, backlog, and workstream tools.
- `gsd-hooks` — context guards, commit validation, injection scanning, status bar.
- `gsd-save-response` — `/save-last` and `/save-response` slash commands.

Agent prompts in `agents/gsd-*.md` are consumed by `pi-subagents`. Skill and prompt templates in `skills/` and `prompts/` provide reusable user-facing entry points.

---
*Last updated: 2026-08-19*
