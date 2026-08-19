import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findGsdRoot, formatStatus, parseStateMd } from "./status";

const sampleState = `---
gsd_state_version: '1.0'
milestone: v1.0
milestone_name: Initial Development
status: executing
active_phase: "03"
current_phase_name: Auth refactor
current_plan: "03-01"
active_workstream: WS-001
next_action: execute-phase
next_phases: ["3"]
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 8
  completed_plans: 3
  percent: 40
---

# State

## Project Reference
- **Core value:** Test project

## Current Position
- **Phase:** 03 — Auth refactor
- **Plan:** 03-01
- **Status:** executing
- **Progress:** [████░░░░░░] 40%

## Accumulated Context
- **Decisions:** None yet
`;

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-hooks-status-test-"));
}

describe("status parsing", () => {
	it("parses all state fields", () => {
		const parsed = parseStateMd(sampleState);
		expect(parsed.milestone).toBe("v1.0");
		expect(parsed.activePhase).toBe("03");
		expect(parsed.currentPhaseName).toBe("Auth refactor");
		expect(parsed.currentPlan).toBe("03-01");
		expect(parsed.activeWorkstream).toBe("WS-001");
		expect(parsed.status).toBe("executing");
		expect(parsed.percent).toBe(40);
		expect(parsed.nextAction).toBe("execute-phase");
		expect(parsed.nextPhases).toEqual(["3"]);
	});

	it("formats active status", () => {
		const parsed = parseStateMd(sampleState);
		const formatted = formatStatus(parsed);
		expect(formatted).toContain("v1.0");
		expect(formatted).toContain("Phase 03");
		expect(formatted).toContain("Auth refactor");
		expect(formatted).toContain("executing");
		expect(formatted).toContain("Plan 03-01");
		expect(formatted).toContain("WS-001");
		expect(formatted).toContain("40%");
	});

	it("formats idle status", () => {
		const idleState = parseStateMd(`---
milestone: v2.0
status: idle
active_phase: null
next_action: begin-phase
next_phases: ["4"]
progress:
  percent: 0
---
# State
`);
		const idleFormatted = formatStatus(idleState);
		expect(idleFormatted).toContain("v2.0");
		expect(idleFormatted).toContain("next begin-phase 4");
	});
});

describe("findGsdRoot", () => {
	let tmp: string;

	beforeEach(() => {
		tmp = createTempRepo();
		fs.mkdirSync(path.join(tmp, ".planning"), { recursive: true });
		fs.writeFileSync(path.join(tmp, ".planning", "STATE.md"), sampleState, "utf8");
	});

	afterEach(() => {
		fs.rmSync(tmp, { recursive: true, force: true });
	});

	it("finds GSD root from nested dir", () => {
		const nested = path.join(tmp, "src", "components");
		fs.mkdirSync(nested, { recursive: true });
		expect(findGsdRoot(nested)).toBe(tmp);
	});

	it("returns null when no GSD root", () => {
		expect(findGsdRoot("/nonexistent/path/that/should/not/exist")).toBeNull();
	});
});
