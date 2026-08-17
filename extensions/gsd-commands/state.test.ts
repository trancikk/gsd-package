/**
 * Manual test for gsd-commands state tools.
 *
 * Run with:
 *   npx tsx extensions/gsd-commands/state.test.ts
 *
 * It creates a temporary repo, scaffolds a STATE.md, and exercises the four
 * state tools end-to-end.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseFrontmatter, stringifyFrontmatter, parseYaml, stringifyYaml } from "./yaml";
import { registerStateTools } from "./state";

const template = `---
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

async function withTempRepo(cb: (repoPath: string) => Promise<void>) {
	const tmp = path.join(process.cwd(), `.tmp-state-test-${Date.now()}`);
	fs.mkdirSync(path.join(tmp, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(tmp, ".planning", "STATE.md"), template, "utf8");
	try {
		await cb(tmp);
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

function mockPi() {
	const tools: Array<{ name: string; execute: Function }> = [];
	return {
		registerTool(def: any) {
			tools.push({ name: def.name, execute: def.execute });
		},
		async call(name: string, params: any, repoPath: string) {
			const tool = tools.find((t) => t.name === name);
			if (!tool) throw new Error(`Tool not found: ${name}`);
			const result = await tool.execute("test-id", params, undefined as any, undefined as any, { cwd: repoPath });
			return JSON.parse((result as any).content[0].text);
		},
	};
}

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

// YAML round-trip tests
console.log("--- YAML tests ---");
const parsed = parseYaml(`foo: bar\nnested:\n  a: 1\n  b: true\nlist: ["x", "y"]`);
assertEqual(parsed.foo, "bar", "parse plain string");
assertEqual(parsed.nested.a, 1, "parse nested number");
assertEqual(parsed.nested.b, true, "parse nested boolean");
assertEqual(parsed.list, ["x", "y"], "parse array");

const roundTrip = stringifyYaml(parseYaml(template.split("---\n")[1]));
const reparsed = parseYaml(roundTrip);
assertEqual(reparsed.milestone, "v1.0", "round-trip milestone");
assertEqual(reparsed.progress.percent, 0, "round-trip nested percent");
assertEqual(reparsed.next_phases, ["1"], "round-trip array");

const fm = parseFrontmatter(template);
assertEqual(fm.frontmatter.status, "initializing", "parse frontmatter");
assertEqual(fm.body.includes("# State"), true, "parse body");

const rewritten = stringifyFrontmatter(fm.frontmatter) + fm.body;
assertEqual(parseFrontmatter(rewritten).frontmatter.milestone, "v1.0", "frontmatter round-trip");

// State tool tests
(async () => {
console.log("\n--- State tool tests ---");
await withTempRepo(async (repoPath) => {
	const pi = mockPi();
	registerStateTools(pi);

	// load
	const loaded = await pi.call("gsd_state_load", { repoPath }, repoPath);
	assertEqual(loaded.frontmatter.status, "initializing", "gsd_state_load");

	// update
	const updated = await pi.call("gsd_state_update", { repoPath, field: "active_phase", value: "01" }, repoPath);
	assertEqual(updated.field, "active_phase", "gsd_state_update field");
	assertEqual(updated.value, "01", "gsd_state_update value");

	// begin phase
	const begun = await pi.call(
		"gsd_state_advance",
		{ repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" },
		repoPath,
	);
	assertEqual(begun.frontmatter.active_phase, "01", "begin-phase active_phase");
	assertEqual(begun.frontmatter.current_phase_name, "Auth", "begin-phase name");
	assertEqual(begun.frontmatter.status, "active", "begin-phase status");

	// complete plan
	const planDone = await pi.call(
		"gsd_state_advance",
		{ repoPath, operation: "complete-plan", phase: 1, plan: 1 },
		repoPath,
	);
	assertEqual(planDone.frontmatter.current_plan, "01-01", "complete-plan current_plan");

	// scaffold a fake phase so progress scan sees work
	const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
	fs.mkdirSync(phaseDir, { recursive: true });
	fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
	fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");
	fs.writeFileSync(path.join(phaseDir, "01-auth-VERIFICATION.md"), "# verification", "utf8");

	// progress
	const progress = await pi.call("gsd_state_progress", { repoPath }, repoPath);
	assertEqual(progress.progress.total_phases, 1, "progress total_phases");
	assertEqual(progress.progress.completed_phases, 1, "progress completed_phases");
	assertEqual(progress.progress.total_plans, 1, "progress total_plans");
	assertEqual(progress.progress.completed_plans, 1, "progress completed_plans");
	assertEqual(progress.progress.percent, 100, "progress percent");

	// complete phase
	const phaseDone = await pi.call(
		"gsd_state_advance",
		{ repoPath, operation: "complete-phase", phase: 1 },
		repoPath,
	);
	assertEqual(phaseDone.frontmatter.active_phase, null, "complete-phase active_phase cleared");
	assertEqual(phaseDone.frontmatter.status, "idle", "complete-phase status");
	assertEqual(phaseDone.frontmatter.completed_phases, ["01"], "complete-phase records completion");

	console.log("\nAll state tool tests passed.");
});
})();
