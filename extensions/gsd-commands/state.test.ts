import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerStateTools } from "./state";
import { parseFrontmatter, parseYaml, stringifyFrontmatter, stringifyYaml } from "./yaml";

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

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-state-test-"));
}

function scaffoldRepo(repoPath: string): void {
	fs.mkdirSync(path.join(repoPath, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(repoPath, ".planning", "STATE.md"), template, "utf8");
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

describe("yaml", () => {
	it("parses plain string", () => {
		const parsed = parseYaml(`foo: bar\nnested:\n  a: 1\n  b: true\nlist: ["x", "y"]`);
		expect(parsed.foo).toBe("bar");
		expect(parsed.nested.a).toBe(1);
		expect(parsed.nested.b).toBe(true);
		expect(parsed.list).toEqual(["x", "y"]);
	});

	it("round-trips nested values", () => {
		const roundTrip = stringifyYaml(parseYaml(template.split("---\n")[1]));
		const reparsed = parseYaml(roundTrip);
		expect(reparsed.milestone).toBe("v1.0");
		expect(reparsed.progress.percent).toBe(0);
		expect(reparsed.next_phases).toEqual(["1"]);
	});

	it("round-trips frontmatter", () => {
		const fm = parseFrontmatter(template);
		expect(fm.frontmatter.status).toBe("initializing");
		expect(fm.body).toContain("# State");
		const rewritten = stringifyFrontmatter(fm.frontmatter) + fm.body;
		expect(parseFrontmatter(rewritten).frontmatter.milestone).toBe("v1.0");
	});
});

describe("state tools", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
		scaffoldRepo(repoPath);
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("loads state", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const loaded = await pi.call("gsd_state_load", { repoPath }, repoPath);
		expect(loaded.frontmatter.status).toBe("initializing");
	});

	it("updates a field", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const updated = await pi.call("gsd_state_update", { repoPath, field: "active_phase", value: "01" }, repoPath);
		expect(updated.field).toBe("active_phase");
		expect(updated.value).toBe("01");
	});

	it("begins a phase", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const begun = await pi.call(
			"gsd_state_advance",
			{ repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" },
			repoPath,
		);
		expect(begun.frontmatter.active_phase).toBe("01");
		expect(begun.frontmatter.current_phase_name).toBe("Auth");
		expect(begun.frontmatter.status).toBe("active");
	});

	it("completes a plan", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		await pi.call("gsd_state_advance", { repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" }, repoPath);
		const planDone = await pi.call(
			"gsd_state_advance",
			{ repoPath, operation: "complete-plan", phase: 1, plan: 1 },
			repoPath,
		);
		expect(planDone.frontmatter.current_plan).toBe("01-01");
		expect(planDone.frontmatter.status).toBe("executing");
	});

	it("recalculates progress", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
		fs.mkdirSync(phaseDir, { recursive: true });
		fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-VERIFICATION.md"), "# verification", "utf8");

		const progress = await pi.call("gsd_state_progress", { repoPath }, repoPath);
		expect(progress.progress.total_phases).toBe(1);
		expect(progress.progress.completed_phases).toBe(1);
		expect(progress.progress.total_plans).toBe(1);
		expect(progress.progress.completed_plans).toBe(1);
		expect(progress.progress.percent).toBe(100);
	});

	it("completes a phase", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		await pi.call("gsd_state_advance", { repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" }, repoPath);
		const phaseDone = await pi.call("gsd_state_advance", { repoPath, operation: "complete-phase", phase: 1 }, repoPath);
		expect(phaseDone.frontmatter.active_phase).toBeNull();
		expect(phaseDone.frontmatter.status).toBe("idle");
		expect(phaseDone.frontmatter.completed_phases).toEqual(["01"]);
	});

	it("recalculates progress automatically on complete-phase", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
		fs.mkdirSync(phaseDir, { recursive: true });
		fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-VERIFICATION.md"), "# verification", "utf8");

		await pi.call("gsd_state_advance", { repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" }, repoPath);
		const phaseDone = await pi.call("gsd_state_advance", { repoPath, operation: "complete-phase", phase: 1 }, repoPath);
		expect(phaseDone.frontmatter.completed_phases).toEqual(["01"]);
		expect(phaseDone.progress.total_phases).toBe(1);
		expect(phaseDone.progress.completed_phases).toBe(1);
		expect(phaseDone.progress.completed_plans).toBe(1);
		expect(phaseDone.progress.percent).toBe(100);

		const loaded = await pi.call("gsd_state_load", { repoPath }, repoPath);
		expect(loaded.frontmatter.progress.completed_phases).toBe(1);
	});

	it("updates array fields", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const updated = await pi.call(
			"gsd_state_update",
			{ repoPath, field: "completed_phases", value: ["03", "04"] },
			repoPath,
		);
		expect(updated.field).toBe("completed_phases");
		expect(updated.value).toEqual(["03", "04"]);

		const loaded = await pi.call("gsd_state_load", { repoPath }, repoPath);
		expect(loaded.frontmatter.completed_phases).toEqual(["03", "04"]);
	});

	it("recalculates progress automatically on complete-plan", async () => {
		const pi = mockPi();
		registerStateTools(pi as any);
		const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
		fs.mkdirSync(phaseDir, { recursive: true });
		fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
		fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");

		await pi.call("gsd_state_advance", { repoPath, operation: "begin-phase", phase: 1, phaseName: "Auth" }, repoPath);
		const planDone = await pi.call(
			"gsd_state_advance",
			{ repoPath, operation: "complete-plan", phase: 1, plan: 1 },
			repoPath,
		);
		expect(planDone.progress.total_phases).toBe(1);
		expect(planDone.progress.completed_plans).toBe(1);
		expect(planDone.progress.percent).toBe(100);
	});
});
