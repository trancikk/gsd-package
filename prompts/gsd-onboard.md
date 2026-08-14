---
description: Run GSD phase researcher in onboard mode to produce MAPPING.md.
argument-hint: "<repo-path> <output-path>"
---

Run the GSD phase researcher in onboard/recon mode to produce a codebase MAPPING.md.

```javascript
subagent({
  workflowScript: "return runs.run('onboard-map', { agent: 'gsd-phase-researcher', context: 'fresh', task: 'Map this existing codebase for GSD onboarding.\n\nRepo: $1\nOutput (absolute path): $2\n\nAnalyze stack, architecture, conventions, entry points, tests, build/deploy, and known tech debt. Do NOT write any implementation code. Write the complete MAPPING.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$2', gate: 'test -s $2' });"
});
```

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/codebase/MAPPING.md`).
