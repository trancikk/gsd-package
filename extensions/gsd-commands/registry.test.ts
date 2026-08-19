/**
 * Tests for the shared .planning/ registry module.
 *
 * Run with:
 *   npx tsx extensions/gsd-commands/registry.test.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { load, save, updateField, listPhases } from "./registry";

const stateTemplate = `---
gsd_state_version: '1.0'
milestone: v1.0
milestone_name: Initial Development
status: initializing
active_phase: null
next_action: discuss-phase
next_phases: ["1"]
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
current_phase: null
current_phase_name: null
current_plan: null
last_updated: "2026-01-01T00:00:00.000Z"
last_activity: "2026-01-01"
stopped_at: "Project initialized"
paused_at: null
---

# State

## Project Reference
- **Core value:** Test project
`;

function assertEqual(actual: any, expected: any, msg: string) {
	const a = JSON.stringify(actual);
	const e = JSON.stringify(expected);
	if (a !== e) {
		console.error(`FAIL: ${msg}`);
		console.error(`  expected: ${e}`);
		console.error(`  actual:   ${a}`);
		process.exit(1);
	}
	console.log(`PASS: ${msg}`);
}

function assertTrue(condition: boolean, msg: string) {
	if (!condition) {
		console.error(`FAIL: ${msg}`);
		process.exit(1);
	}
	console.log(`PASS: ${msg}`);
}

async function withTempRepo(cb: (repoPath: string) => Promise<void>) {
	const tmp = path.join(process.cwd(), `.tmp-registry-test-${Date.now()}`);
	fs.mkdirSync(path.join(tmp, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(tmp, ".planning", "STATE.md"), stateTemplate, "utf8");
	try {
		await cb(tmp);
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

(async () => {
	await withTempRepo(async (repoPath) => {
		console.log("--- registry load tests ---");
		const state = load("state", repoPath);
		assertEqual(state.frontmatter.status, "initializing", "load state frontmatter");
		assertEqual(state.frontmatter.active_phase, null, "load state null field");
		assertTrue(state.body.includes("# State"), "load state body");
		assertTrue(state.path.includes("STATE.md"), "load state path");

		console.log("\n--- registry updateField tests ---");
		const update = updateField("state", repoPath, "active_phase", "03");
		assertEqual(update.previous, null, "updateField returns previous value");
		assertEqual(update.current, "03", "updateField returns current value");
		const reloaded = load("state", repoPath);
		assertEqual(reloaded.frontmatter.active_phase, "03", "updateField persists change");

		const nested = updateField("state", repoPath, "progress.completed_plans", 2);
		assertEqual(nested.previous, 0, "updateField nested previous");
		const reloadedNested = load("state", repoPath);
		assertEqual(reloadedNested.frontmatter.progress.completed_plans, 2, "updateField nested persists");

		console.log("\n--- registry save tests ---");
		save("backlog", repoPath, { body: "# Backlog\n\n## Open\n\n" });
		const backlog = load("backlog", repoPath);
		assertEqual(backlog.frontmatter, {}, "backlog has no frontmatter");
		assertTrue(backlog.body.includes("## Open"), "backlog body saved");

		console.log("\n--- registry listPhases tests ---");
		const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
		fs.mkdirSync(phaseDir, { recursive: true });
		fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-auth-VERIFICATION.md"), "# verification", "utf8");

		const phases = listPhases(repoPath);
		assertEqual(phases.length, 1, "listPhases returns one phase");
		assertEqual(phases[0].num, "01", "listPhases parses num");
		assertEqual(phases[0].slug, "auth", "listPhases parses slug");
		assertEqual(phases[0].plans, 1, "listPhases counts plans");
		assertEqual(phases[0].summaries, 1, "listPhases counts summaries");
		assertEqual(phases[0].hasVerification, true, "listPhases detects verification");

		console.log("\nAll registry tests passed.");
	});
})();
