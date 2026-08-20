# GSD Tool Matrix

Host-side tools from the `gsd-commands` extension.

| Tool | Inputs | Purpose |
| ------ | -------- | --------- |
| `gsd_onboard` | `repoPath`, `outputPath` | Produce `MAPPING.md` for existing codebases |
| `gsd_research` | `repoPath`, `outputPath`, `[scope]` | Produce `RESEARCH.md` |
| `gsd_plan` | `repoPath`, `inputFiles`, `outputPath` | Produce `PLAN.md` |
| `gsd_execute` | `repoPath`, `planPath`, `outputPath` | Run a plan, produce `SUMMARY.md` |
| `gsd_verify` | `repoPath`, `phaseDir`, `outputPath` | Produce `VERIFICATION.md` |
| `gsd_prototype` | `repoPath`, `question`, `outputPath` | Throwaway prototype + `PROTOTYPE.md` |
| `gsd_arch_review` | `repoPath`, `outputPath`, `[scope]` | HTML architecture review |
| `gsd_security_audit` | `repoPath`, `phaseDir`, `outputPath` | Security audit |

## State tools

| Tool | Inputs | Purpose |
| ------ | -------- | --------- |
| `gsd_state_load` | `repoPath` | Read `STATE.md` frontmatter and body |
| `gsd_state_update` | `repoPath`, `field`, `value` | Atomic dot-notation frontmatter update |
| `gsd_state_advance` | `repoPath`, `operation`, `phase`, `[plan]` | `begin-phase`, `complete-plan`, `complete-phase` |
| `gsd_state_progress` | `repoPath` | Recalculate progress counters from disk |
| `gsd_next_action` | `repoPath` | Suggest valid actions without mutating `STATE.md` |

## Management tools

| Tool | Inputs | Purpose |
|------|--------|---------|
| `gsd_backlog` | `repoPath`, `operation`, `[...]` | Manage `BACKLOG.md` items |
| `gsd_workstream` | `repoPath`, `operation`, `[...]` | Manage `WORKSTREAMS.md` and Git branches |

## Todo tools

| Tool | Inputs | Purpose |
|------|--------|---------|
| `gsd_todo` | `repoPath`, `planPath`, `operation`, `[...]` | Manage per-plan `TODOS.md` task FSM |

All tools accept absolute paths or paths relative to the session cwd.
