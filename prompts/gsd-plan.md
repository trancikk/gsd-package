---
description: Run GSD planner to produce PLAN.md from phase context and research.
argument-hint: "<repo-path> <context-files> <output-path>"
---

Run the GSD planner to produce a PLAN.md artifact.

```javascript
subagent({
  workflowScript: "return runs.run('plan-phase', { agent: 'gsd-planner', context: 'fresh', task: 'Create an executable plan and write PLAN.md.\n\nRepo: $1\nInput files to read first: $2\nOutput (absolute path): $3\n\nRead the input files, then produce a detailed PLAN.md with waves, tasks, must_haves, and verification criteria. Write the complete PLAN.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$3', gate: 'node -e "const fs=require(\'fs\'); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }" "$3"' });"
});
```

Use forward slashes in paths. For `<context-files>` you can pass a comma-separated list or "auto".
