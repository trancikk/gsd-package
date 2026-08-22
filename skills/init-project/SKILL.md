---
name: init-project
description: Interactive new-project setup for GSD. Asks deep questions, then scaffolds .planning/ artifacts and a root AGENTS.md.
disable-model-invocation: true
version: 1
created: "2026-08-21"
metadata:
  source: "Adapted from open-gsd/gsd-core and rokicool/gsd-opencode new-project workflows"
---

# Initialize New Project

Run an interactive, upstream-style new-project setup. This skill asks clarifying questions, captures the user's intent, and writes the full GSD scaffold plus a root `AGENTS.md` instruction file.

**Invoke with:** `/skill:init-project [project-name]`

## Before asking the user

1. Check whether `.planning/PROJECT.md` already exists.
   - If it exists: warn the user and stop; suggest editing existing files or starting a new milestone instead.
2. Check whether this directory is a git repo.
   - If not, run `git init` and report it.

## 1. Open the conversation

Ask inline (freeform):

> "What do you want to build?"

Wait for the response. This is the seed for all follow-up questions.

## 2. Deep questioning

Follow threads. Each answer opens new threads. Probe for:

- What problem sparked this?
- Who is the user or customer?
- What does "done" look like?
- What is the core value — the ONE thing that must work?
- What constraints exist (time, budget, compliance, team, tech)?
- What is in scope for v1 vs v2 or out of scope entirely?
- What technology or stack is already decided?
- What integrations, APIs, or external dependencies exist?
- What are the biggest risks or unknowns?

Use `ask_user_question` with 2–4 concrete options whenever you can interpret a vague answer in more than one way. Challenge fuzzy terms and propose canonical language.

## 3. Optional research

Ask:

```
header: "Research"
question: "Research the domain ecosystem before we scaffold?"
options:
  - "Research first (Recommended)" — discover stacks, features, pitfalls
  - "Skip research" — I know the domain, scaffold now
```

**If "Research first":**

1. Call the extension tool:

```javascript
gsd_research_project({ repoPath: ".", scope: "[domain or project description]" })
```

This prepares a `subagent()` call for `gsd-phase-researcher`. Execute it.

2. When the subagent returns, read `.planning/research/RESEARCH.md`.
3. Use its stack, features, architecture, and pitfalls sections when you write the scaffolded files.

**If "Skip research":** proceed directly to Step 4.

## 3. Decision gate

When you have enough context to write a clear `PROJECT.md`, ask:

```
header: "Ready?"
question: "I think I understand what you're after. Ready to scaffold the project?"
options:
  - "Scaffold project" — Create all GSD artifacts
  - "Keep exploring" — Ask me more
```

If "Keep exploring", continue questioning. Loop until the user confirms "Scaffold project".

## 4. Scaffold

Call the extension tool to create the default file tree:

```javascript
gsd_scaffold({ repoPath: ".", projectName: "[optional project name]" })
```

`gsd_scaffold` runs `skills/gsd-phase-loop/init.sh` and creates:

```
.planning/
├── PROJECT.md
├── ROADMAP.md
├── REQUIREMENTS.md
├── STATE.md
├── CONVENTIONS.md
├── BACKLOG.md
├── WORKSTREAMS.md
├── config.json
└── phases/
AGENTS.md
```

Do not call the tool inside a subagent; it is a host-side file operation.

## 5. Customize artifacts

Edit the scaffolded files with the write tool, using the captured conversation and any research output. Defaults to fill in:

- **PROJECT.md:** identity, core value, constraints, scope, key decisions, out-of-scope list.
- **REQUIREMENTS.md:** numbered `REQ-XX` items grouped by category; v1 active with checkboxes, v2 deferred, out-of-scope with reasons.
- **ROADMAP.md:** at least Phase 1 derived from the first slice of v1 requirements; include goal, success criteria, and mapped REQ-IDs.
- **STATE.md:** `status: initializing`, `next_action: discuss-phase`, `next_phases: ["1"]`, progress at 0%.
- **CONVENTIONS.md:** append any project-specific overrides established during questioning.
- **BACKLOG.md:** capture any deferred ideas.
- **AGENTS.md:** populate GSD marker sections from `PROJECT.md`, research, and established conventions. Do not overwrite an existing root `AGENTS.md` unless it contains GSD markers or the user explicitly asks.

Use the templates in `skills/gsd-phase-loop/templates/` as the source of truth for formatting and frontmatter.

### AGENTS.md rules

- Preserve GSD marker comments (`<!-- GSD:... -->`).
- Populate the `## Project` section with a concise summary from `PROJECT.md`.
- If stack/conventions/architecture were surfaced during questioning or research, include them under the relevant marker sections.
- Keep the `## GSD Workflow Enforcement` section that points to `/skill:init-project`, `/gsd-onboard`, `/skill:discuss-phase`, and GSD phase-loop commands.

## 6. Show next actions

After writing all files, run:

```javascript
gsd_next_action({ repoPath: "." })
```

Present the recommended next step to the user (typically `/skill:discuss-phase 1` or `/gsd-research` if research was deferred).

## Done when

- `.planning/` directory exists with all required scaffold files.
- Root `AGENTS.md` exists and is populated.
- User has seen the recommended next action.
