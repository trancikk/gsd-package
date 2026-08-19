import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-workstream-test-"));
}

function scaffoldRepo(repoPath: string): void {
	fs.mkdirSync(path.join(repoPath, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(repoPath, ".planning", "STATE.md"), stateTemplate, "utf8");

	spawnSync("git", ["init"], { cwd: repoPath, encoding: "utf8" });
	spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: repoPath, encoding: "utf8" });
	spawnSync("git", ["config", "user.name", "Test"], { cwd: repoPath, encoding: "utf8" });
	spawnSync("git", ["checkout", "-b", "main"], { cwd: repoPath, encoding: "utf8" });
	fs.writeFileSync(path.join(repoPath, "README.md"), "# test\n", "utf8");
	gitCommit(repoPath, "initial");
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

describe("workstream tools", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
		scaffoldRepo(repoPath);
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("lists empty workstreams", async () => {
		const pi = mockPi();
		registerWorkstreamTools(pi as any);
		const list = await pi.call("gsd_workstream", { repoPath, operation: "list" }, repoPath);
		expect(list.count).toBe(0);
		expect(list.active).toBeUndefined();
	});

	it("adds workstreams and creates git branches", async () => {
		const pi = mockPi();
		registerWorkstreamTools(pi as any);

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
		expect(add1.item.id).toBe("WS-001");
		expect(add1.item.branch).toBe("ws001");
		expect(add1.item.status).toBe("active");
		expect(add1.branchCreated).toBe(true);

		const add2 = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "add", name: "UI polish", branch: "ui-polish", linkedBacklogItem: "B-005" },
			repoPath,
		);
		expect(add2.item.id).toBe("WS-002");
		expect(add2.item.branch).toBe("ui-polish");

		const list = await pi.call("gsd_workstream", { repoPath, operation: "list" }, repoPath);
		expect(list.count).toBe(2);
		expect(list.active).toBe("WS-002");
	});

	it("switches workstreams and updates state", async () => {
		const pi = mockPi();
		registerWorkstreamTools(pi as any);
		await pi.call("gsd_workstream", { repoPath, operation: "add", name: "Auth refactor", linkedPhase: "03" }, repoPath);
		await pi.call("gsd_workstream", { repoPath, operation: "add", name: "UI polish", branch: "ui-polish" }, repoPath);
		gitCommit(repoPath, "workstreams registry");

		const switched = await pi.call("gsd_workstream", { repoPath, operation: "switch", id: "WS-001" }, repoPath);
		expect(switched.item.id).toBe("WS-001");
		expect(switched.checkoutResult?.ok).toBe(true);

		const branchAfterSwitch = spawnSync("git", ["branch", "--show-current"], {
			cwd: repoPath,
			encoding: "utf8",
		}).stdout.trim();
		expect(branchAfterSwitch).toBe("ws001");

		const stateContent = fs.readFileSync(path.join(repoPath, ".planning", "STATE.md"), "utf8");
		expect(stateContent).toContain("active_workstream: WS-001");
	});

	it("pauses, resumes, merges, and closes workstreams", async () => {
		const pi = mockPi();
		registerWorkstreamTools(pi as any);
		await pi.call("gsd_workstream", { repoPath, operation: "add", name: "Auth refactor", linkedPhase: "03" }, repoPath);

		const paused = await pi.call("gsd_workstream", { repoPath, operation: "pause", id: "WS-001" }, repoPath);
		expect(paused.item.status).toBe("paused");
		expect(paused.active).toBeUndefined();

		const resumed = await pi.call("gsd_workstream", { repoPath, operation: "resume", id: "WS-001" }, repoPath);
		expect(resumed.item.status).toBe("active");

		const updated = await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "update", id: "WS-001", name: "Auth refactor v2" },
			repoPath,
		);
		expect(updated.item.name).toBe("Auth refactor v2");

		const merged = await pi.call("gsd_workstream", { repoPath, operation: "merge", id: "WS-001" }, repoPath);
		expect(merged.item.status).toBe("merged");

		await pi.call("gsd_workstream", { repoPath, operation: "add", name: "UI polish", branch: "ui-polish" }, repoPath);
		const closed = await pi.call("gsd_workstream", { repoPath, operation: "close", id: "WS-002" }, repoPath);
		expect(closed.item.status).toBe("closed");

		const list = await pi.call("gsd_workstream", { repoPath, operation: "list", status: "active" }, repoPath);
		expect(list.count).toBe(0);
	});

	it("round-trips workstreams file content", async () => {
		const pi = mockPi();
		registerWorkstreamTools(pi as any);
		await pi.call("gsd_workstream", { repoPath, operation: "add", name: "Auth refactor", linkedPhase: "03" }, repoPath);
		await pi.call(
			"gsd_workstream",
			{ repoPath, operation: "update", id: "WS-001", name: "Auth refactor v2" },
			repoPath,
		);
		await pi.call("gsd_workstream", { repoPath, operation: "merge", id: "WS-001" }, repoPath);

		const wsContent = fs.readFileSync(path.join(repoPath, ".planning", "WORKSTREAMS.md"), "utf8");
		expect(wsContent).toContain("WS-001: Auth refactor v2");
		expect(wsContent).toContain("merged");
	});
});
