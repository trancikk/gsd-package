---
description: Run GSD phase researcher to produce RESEARCH.md for a phase.
argument-hint: "<repo-path> <output-path> [scope]"
---

Run the GSD phase researcher to produce a RESEARCH.md artifact.

```javascript
subagent({
  workflowScript: "return runs.run('research-phase', { agent: 'gsd-phase-researcher', context: 'fresh', task: 'Research this phase and write RESEARCH.md.\n\nRepo: $1\nOutput (absolute path): $2\nScope: ${3:-entire phase}\n\nUse only read/grep/find/ls/bash (read-only) unless code changes are explicitly required. Write the complete RESEARCH.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$2', gate: 'test -s $2' });"
});
```

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/phases/01-foo/01-RESEARCH.md`).
