---
description: Run GSD security audit for a phase and produce SECURITY-AUDIT.md.
argument-hint: "<repo-path> <phase-dir> <output-path>"
---

Run the GSD security audit agent to produce a phase SECURITY-AUDIT.md.

```javascript
subagent({
  workflowScript: "return runs.run('security-audit', { agent: 'gsd-security-audit', context: 'fresh', task: 'Run a security audit for this phase.\\n\\nRepo: $1\\nPhase directory (absolute path): $2\\nOutput (absolute path): $3\\n\\nRead ROADMAP.md, CONTEXT.md, all PLAN.md and SUMMARY.md files in the phase directory, then scan the actual codebase for OWASP ASVS categories, trust boundaries, and vulnerabilities. Write the complete SECURITY-AUDIT.md to the absolute output path using the write tool. Create parent directories with bash (mkdir -p) if needed. Verify the file exists with ls -la before returning.', output: '$3', gate: 'node -e \"const fs=require\\(\\'fs\\'\\); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }\" \"$3\"' });"
});
```

Use forward slashes in paths (e.g., `C:/Sources/my-project/.planning/phases/03-auth/03-SECURITY-AUDIT.md`).
