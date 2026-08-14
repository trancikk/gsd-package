---
description: Run GSD verifier to produce VERIFICATION.md for a completed phase.
argument-hint: "<repo-path> <phase-dir> <output-path>"
---

Run the GSD verifier to produce a VERIFICATION.md artifact.

```javascript
subagent({
  workflowScript: "return runs.run('verify-phase', { agent: 'gsd-verifier', context: 'fresh', task: 'Verify the phase and write VERIFICATION.md.\n\nRepo: $1\nPhase directory (absolute path): $2\nOutput (absolute path): $3\n\nRead ROADMAP.md, CONTEXT.md, all PLAN.md and SUMMARY.md files in the phase directory, then perform goal-backward verification against the actual codebase. Write the complete VERIFICATION.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$3', gate: 'test -s $3' });"
});
```

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/phases/01-foo`).
