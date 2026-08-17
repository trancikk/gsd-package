/**
 * Manual test for gsd-hooks status parsing and formatting.
 *
 * Run with:
 *   npx tsx extensions/gsd-hooks/status.test.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseStateMd, formatStatus, findGsdRoot } from "./status";

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

console.log("--- status parsing tests ---");
const parsed = parseStateMd(sampleState);
assertEqual(parsed.milestone, "v1.0", "parses milestone");
assertEqual(parsed.activePhase, "03", "parses active_phase");
assertEqual(
	parsed.currentPhaseName,
	"Auth refactor",
	"parses current_phase_name",
);
assertEqual(parsed.currentPlan, "03-01", "parses current_plan");
assertEqual(parsed.activeWorkstream, "WS-001", "parses active_workstream");
assertEqual(parsed.status, "executing", "parses status");
assertEqual(parsed.percent, 40, "parses nested progress.percent");
assertEqual(parsed.nextAction, "execute-phase", "parses next_action");
assertEqual(parsed.nextPhases, ["3"], "parses next_phases");

console.log("\n--- status formatting tests ---");
const formatted = formatStatus(parsed);
console.log("formatted:", formatted);
assertTrue(formatted.includes("v1.0"), "includes milestone");
assertTrue(formatted.includes("Phase 03"), "includes phase number");
assertTrue(formatted.includes("Auth refactor"), "includes phase name");
assertTrue(formatted.includes("executing"), "includes status");
assertTrue(formatted.includes("Plan 03-01"), "includes current plan");
assertTrue(formatted.includes("WS-001"), "includes active workstream");
assertTrue(formatted.includes("40%"), "includes progress percent");

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
console.log("idle formatted:", idleFormatted);
assertTrue(idleFormatted.includes("v2.0"), "idle includes milestone");
assertTrue(
	idleFormatted.includes("next begin-phase 4"),
	"idle shows next action",
);

console.log("\n--- findGsdRoot tests ---");
const tmp = path.join(process.cwd(), `.tmp-hooks-status-test-${Date.now()}`);
fs.mkdirSync(path.join(tmp, ".planning"), { recursive: true });
fs.writeFileSync(path.join(tmp, ".planning", "STATE.md"), sampleState, "utf8");
const nested = path.join(tmp, "src", "components");
fs.mkdirSync(nested, { recursive: true });
assertEqual(findGsdRoot(nested), tmp, "finds GSD root from nested dir");
assertEqual(
	findGsdRoot("/nonexistent/path/that/should/not/exist"),
	null,
	"returns null when no GSD root",
);
fs.rmSync(tmp, { recursive: true, force: true });

console.log("\nAll status tests passed.");
