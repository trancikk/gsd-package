---
description: Run GSD executor to implement a PLAN.md and produce SUMMARY.md.
argument-hint: "<repo-path> <plan-path> <output-path>"
---

Run the GSD executor to implement a plan and produce a SUMMARY.md artifact.

```javascript
subagent({
  workflowScript: "return runs.run('execute-plan', { agent: 'gsd-executor', context: 'fresh', task: 'Execute the plan and write SUMMARY.md.\n\nRepo: $1\nPlan file (absolute path): $2\nOutput (absolute path): $3\n\nRead the plan file, execute every task atomically, make per-task commits, handle deviations per your rules, and write the complete SUMMARY.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$3', gate: 'node -e "const fs=require(\'fs\'); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }" "$3"' });"
});
```

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/phases/01-foo/01-01-PLAN.md`).
