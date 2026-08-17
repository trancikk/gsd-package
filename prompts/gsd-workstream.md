# /gsd-workstream

Manage parallel feature workstreams (Git branches) for a GSD project.

## Usage

```text
/gsd-workstream <repoPath>
```

## What it does

- Reads `.planning/STATE.md`, `.planning/WORKSTREAMS.md`, and `.planning/BACKLOG.md`
- Helps create, switch, pause, resume, merge, and close workstreams
- Updates the active workstream in `STATE.md`
- Optionally creates and checks out the corresponding Git branch

## Example

```text
/gsd-workstream C:/Sources/my-project
```

This expands into a `subagent()` call for the `gsd-workstream` agent.
