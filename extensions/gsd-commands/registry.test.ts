import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { determineNextAction } from "./next-action";
import { listPhases, load, save, updateField } from "./registry";

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

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-registry-test-"));
}

function scaffoldRepo(repoPath: string): void {
	fs.mkdirSync(path.join(repoPath, ".planning", "phases"), { recursive: true });
	fs.writeFileSync(path.join(repoPath, ".planning", "STATE.md"), stateTemplate, "utf8");
}

describe("registry", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
		scaffoldRepo(repoPath);
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	describe("load", () => {
		it("loads state frontmatter and body", () => {
			const state = load("state", repoPath);
			expect(state.frontmatter.status).toBe("initializing");
			expect(state.frontmatter.active_phase).toBeNull();
			expect(state.body).toContain("# State");
			expect(state.path).toContain("STATE.md");
		});
	});

	describe("updateField", () => {
		it("updates a top-level field and returns previous/current values", () => {
			const update = updateField("state", repoPath, "active_phase", "03");
			expect(update.previous).toBeNull();
			expect(update.current).toBe("03");
			expect(load("state", repoPath).frontmatter.active_phase).toBe("03");
		});

		it("updates a nested field", () => {
			const update = updateField("state", repoPath, "progress.completed_plans", 2);
			expect(update.previous).toBe(0);
			expect(load("state", repoPath).frontmatter.progress.completed_plans).toBe(2);
		});
	});

	describe("save", () => {
		it("writes a body-only artifact", () => {
			save("backlog", repoPath, { body: "# Backlog\n\n## Open\n\n" });
			const backlog = load("backlog", repoPath);
			expect(backlog.frontmatter).toEqual({});
			expect(backlog.body).toContain("## Open");
		});
	});

	describe("listPhases", () => {
		it("returns phase metadata sorted by number", () => {
			const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
			fs.mkdirSync(phaseDir, { recursive: true });
			fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
			fs.writeFileSync(path.join(phaseDir, "01-01-SUMMARY.md"), "# summary", "utf8");
			fs.writeFileSync(path.join(phaseDir, "01-auth-VERIFICATION.md"), "# verification", "utf8");

			const phases = listPhases(repoPath);
			expect(phases).toHaveLength(1);
			expect(phases[0]).toMatchObject({
				num: "01",
				slug: "auth",
				plans: 1,
				summaries: 1,
				hasVerification: true,
			});
		});
	});

	describe("gsd_next_action FSM", () => {
		it("recommends discuss-phase when initializing", () => {
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("discuss-phase");
			expect(result.recommended_action).toBe("discuss-phase");
		});

		it("allows begin-phase or milestone-complete when idle", () => {
			updateField("state", repoPath, "status", "idle");
			updateField("state", repoPath, "active_phase", null);
			updateField("state", repoPath, "next_phases", []);
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("begin-phase");
			expect(result.valid_actions).toContain("milestone-complete");
		});

		it("recommends plan-phase when context exists", () => {
			const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
			fs.mkdirSync(phaseDir, { recursive: true });
			fs.writeFileSync(path.join(phaseDir, "01-CONTEXT.md"), "# context", "utf8");
			updateField("state", repoPath, "status", "active");
			updateField("state", repoPath, "active_phase", "01");
			updateField("state", repoPath, "next_action", "discuss-phase");
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("plan-phase");
			expect(result.recommended_action).toBe("plan-phase");
		});

		it("recommends plan-phase when next_action is plan-phase", () => {
			const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
			fs.mkdirSync(phaseDir, { recursive: true });
			fs.writeFileSync(path.join(phaseDir, "01-CONTEXT.md"), "# context", "utf8");
			updateField("state", repoPath, "status", "active");
			updateField("state", repoPath, "active_phase", "01");
			updateField("state", repoPath, "next_action", "plan-phase");
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("plan-phase");
			expect(result.recommended_action).toBe("plan-phase");
		});

		it("recommends execute-phase when executing", () => {
			const phaseDir = path.join(repoPath, ".planning", "phases", "01-auth");
			fs.mkdirSync(phaseDir, { recursive: true });
			fs.writeFileSync(path.join(phaseDir, "01-01-PLAN.md"), "# plan", "utf8");
			updateField("state", repoPath, "status", "executing");
			updateField("state", repoPath, "active_phase", "01");
			updateField("state", repoPath, "current_plan", "01-01");
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("execute-phase");
			expect(result.recommended_action).toBe("execute-phase");
		});

		it("recommends resume when paused", () => {
			updateField("state", repoPath, "status", "paused");
			updateField("state", repoPath, "active_phase", "01");
			const result = determineNextAction(repoPath);
			expect(result.valid_actions).toContain("resume");
			expect(result.recommended_action).toBe("resume");
		});
	});
});
