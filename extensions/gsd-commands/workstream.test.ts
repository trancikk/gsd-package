/**
 * Manual test for gsd-commands workstream tools.
 *
 * Run with:
 *   npx tsx extensions/gsd-commands/workstream.test.ts
 *
 * It creates a temporary git repo, scaffolds STATE.md and WORKSTREAMS.md,
 * and exercises the workstream tools end-to-end.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { registerWorkstreamTools } from "./workstream";

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
`;

function gitCommit(repoPath: string, message: string) {
	spawnSync("git", ["add", "."], { cwd: repoPath, encoding: "utf8" });
	spawnSync("git", ["commit", "-m", message], { cwd: repoPath, encoding: "utf8" });
}

async function withTempRepo(cb: (repoPath: string) => Promise<void>) {
	const tmp = path.join(process.cwd(), `.tmp-workstream-test-${Date.now()}`);
	fs.mkdirSync(path.join(tmp, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(tmp, ".planning", "STATE.md"), stateTemplate, "utf8");

	// Initialize git repo
	spawnSync("git", ["init"], { cwd: tmp, encoding: "utf8" });
	spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: tmp, encoding: "utf8" });
	spawnSync("git", ["config", "user.name", "Test"], { cwd: tmp, encoding: "utf8" });
	spawnSync("git", ["checkout", "-b", "main"], { cwd: tmp, encoding: "utf8" });
	fs.writeFileSync(path.join(tmp, "README.md"), "# test\n", "utf8");
	gitCommit(tmp, "initial");

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

function assertTrue(condition: boolean, msg: string) {
	if (!condition) {
		console.error(`FAIL: ${msg}`);
		process.exit(1);
	}
	console.log(`PASS: ${msg}`);
}

async function main() {
	const pi = mockPi();
	registerWorkstreamTools(pi as any);

	await withTempRepo(async (repoPath) => {
		console.log("--- workstream tests ---");

		// list empty
		let list = await pi.call("gsd_workstream", { repoPath, operation: "list" }, repoPath);
		assertEqual(list.count, 0, "empty list has zero items");
		assertEqual(list.active, undefined, "no active workstream initially");

		// add first workstream
		const add1 = await pi.call(
			"gsd_workstream",
			{
				repoPath,
				operation: "add",
				name: "Auth refactor",
				description: "Refactor authentication layer",
				linkedPhase: "03",
			},
			repoPath,
		);
		assertEqual(add1.item.id, "WS-001", "first id is WS-001");
		assertEqual(add1.item.branch, "ws001", "default branch name derived from id");
		assertEqual(add1.item.status, "active", "new workstream is active");
		assertTrue(add1.branchCreated, "git branch was created");

		// add second workstream with explicit branch
		const add2 = await pi.call(
			"gsd_workstream",
			{
				repoPath,
				operation: "add",
				name: "UI polish",
				branch: "ui-polish",
				linkedBacklogItem: "B-005",
			},
			repoPath,
		);
		assertEqual(add2.item.id, "WS-002", "second id is WS-002");
		assertEqual(add2.item.branch, "ui-polish", "explicit branch name used");

		// list all
		list = await pi.call("gsd_workstream", { repoPath, operation: "list" }, repoPath);
		assertEqual(list.count, 2, "two workstreams listed");
		assertEqual(list.active, "WS-002", "most recently added is active");

		// Commit registry changes so branch checkout can succeed
		gitCommit(repoPath, "workstreams registry");

		// switch to first
		const switched = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "switch", id: "WS-001" },
			repoPath,
		);
		assertEqual(switched.item.id, "WS-001", "switched to WS-001");
		assertTrue(switched.checkoutResult?.ok, "checkout succeeded");
		const branchAfterSwitch = spawnSync("git", ["branch", "--show-current"], { cwd: repoPath, encoding: "utf8" }).stdout.trim();
		assertEqual(branchAfterSwitch, "ws001", "git branch changed to ws001");

		// state.md active_workstream updated
		const stateContent = fs.readFileSync(path.join(repoPath, ".planning", "STATE.md"), "utf8");
		assertTrue(stateContent.includes("active_workstream: WS-001"), "STATE.md active_workstream updated");

		// pause
		const paused = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "pause", id: "WS-001" },
			repoPath,
		);
		assertEqual(paused.item.status, "paused", "workstream paused");
		assertEqual(paused.active, undefined, "no active workstream after pausing active one");

		// resume
		const resumed = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "resume", id: "WS-001" },
			repoPath,
		);
		assertEqual(resumed.item.status, "active", "workstream resumed");

		// update
		const updated = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "update", id: "WS-001", name: "Auth refactor v2" },
			repoPath,
		);
		assertEqual(updated.item.name, "Auth refactor v2", "name updated");

		// merge
		const merged = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "merge", id: "WS-001" },
			repoPath,
		);
		assertEqual(merged.item.status, "merged", "workstream merged");

		// close
		const closed = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "close", id: "WS-002" },
			repoPath,
		);
		assertEqual(closed.item.status, "closed", "workstream closed");

		// filter by status
		list = await pi.call("gsd_workstream", { repoPath, operation: "list", status: "active" }, repoPath);
		assertEqual(list.count, 0, "no active workstreams after merge/close");

		// file content round-trip
		const wsContent = fs.readFileSync(path.join(repoPath, ".planning", "WORKSTREAMS.md"), "utf8");
		assertTrue(wsContent.includes("WS-001: Auth refactor v2"), "WORKSTREAMS.md contains updated WS-001");
		assertTrue(wsContent.includes("WS-002: UI polish"), "WORKSTREAMS.md contains WS-002");
		assertTrue(wsContent.indexOf("merged") > 0, "WORKSTREAMS.md contains merged status");
	});

	console.log("\nAll workstream tests passed.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
