import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as registry from "./registry";
import { resolveAbsolutePath } from "./utils";

function statePath(repoPath: string): string {
	return registry.artifactPath("state", repoPath);
}

function loadState(repoPath: string) {
	const { path: sp, frontmatter, body } = registry.load("state", repoPath);
	return { frontmatter, body, sp };
}

function saveState(repoPath: string, frontmatter: Record<string, any>, body: string): void {
	frontmatter.last_updated = new Date().toISOString();
	registry.save("state", repoPath, { frontmatter, body });
}

function formatDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function padPhase(num: number | string): string {
	const n = String(num).padStart(2, "0");
	return n;
}

function buildToolResultText(payload: any): AgentToolResult<any> {
	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(payload, null, 2),
			},
		],
		details: payload,
	};
}

function calculateProgress(repoPath: string): {
	total_phases: number;
	completed_phases: number;
	total_plans: number;
	completed_plans: number;
	percent: number;
} {
	const phases = registry.listPhases(repoPath);

	let totalPlans = 0;
	let completedPlans = 0;
	let completedPhases = 0;

	for (const phase of phases) {
		totalPlans += phase.plans;
		completedPlans += phase.summaries;
		if (phase.hasVerification) completedPhases++;
	}

	return {
		total_phases: phases.length,
		completed_phases: completedPhases,
		total_plans: totalPlans,
		completed_plans: completedPlans,
		percent: totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0,
	};
}

function refreshProgress(repoPath: string, frontmatter: Record<string, any>): void {
	frontmatter.progress = calculateProgress(repoPath);
}

export function registerStateTools(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_state_load",
		label: "GSD State Load",
		description: "Load .planning/STATE.md frontmatter and markdown body.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const { frontmatter, body, sp } = loadState(repoPath);
			return buildToolResultText({ ok: true, path: sp, frontmatter, body });
		},
	});

	pi.registerTool({
		name: "gsd_state_update",
		label: "GSD State Update",
		description:
			"Atomically update a single field in .planning/STATE.md frontmatter using dot-notation path (e.g. 'progress.completed_plans').",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
			field: Type.String({
				description: "Dot-notation path, e.g. 'active_phase' or 'progress.completed_plans'",
			}),
			value: Type.Union(
				[
					Type.String(),
					Type.Number(),
					Type.Boolean(),
					Type.Null(),
					Type.Array(Type.Any(), { description: "Array value for fields like completed_phases or next_phases" }),
				],
				{
					description: "New scalar or array value",
				},
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const { previous, current, path: p } = registry.updateField("state", repoPath, params.field, params.value);
			const { frontmatter, body } = loadState(repoPath);
			frontmatter.last_activity = formatDate();
			saveState(repoPath, frontmatter, body);
			return buildToolResultText({
				ok: true,
				path: p,
				field: params.field,
				previous,
				value: current,
			});
		},
	});

	pi.registerTool({
		name: "gsd_state_advance",
		label: "GSD State Advance",
		description:
			"Perform a common state transition: begin a phase, complete a plan, or complete a phase. Progress counters are recalculated automatically when completing a phase or plan.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
			operation: Type.Union(
				[
					Type.Literal("begin-phase", {
						description: "Start a phase: set active_phase, current_phase, status, next_action",
					}),
					Type.Literal("complete-plan", {
						description: "Mark a plan completed and update current_plan",
					}),
					Type.Literal("complete-phase", {
						description: "Mark a phase complete, clear active state, advance to next phase",
					}),
				],
				{ description: "State transition to apply" },
			),
			phase: Type.Union([Type.String(), Type.Number()], {
				description: "Phase number or padded string (e.g. '01' or 1)",
			}),
			plan: Type.Optional(
				Type.Union([Type.String(), Type.Number()], {
					description: "Plan number within the phase (required for complete-plan)",
				}),
			),
			phaseName: Type.Optional(
				Type.String({
					description: "Human-readable phase name (used by begin-phase)",
				}),
			),
			nextAction: Type.Optional(
				Type.String({
					description: "Override the next_action value (defaults are sensible)",
				}),
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const { frontmatter, body } = loadState(repoPath);
			const phase = padPhase(params.phase);
			const phaseSlug = params.phaseName || `Phase ${phase}`;

			if (params.operation === "begin-phase") {
				frontmatter.active_phase = phase;
				frontmatter.current_phase = phase;
				frontmatter.current_phase_name = phaseSlug;
				frontmatter.current_plan = null;
				frontmatter.status = "active";
				frontmatter.next_action = params.nextAction || "discuss-phase";
				frontmatter.stopped_at = `Phase ${phase} started`;
			} else if (params.operation === "complete-plan") {
				if (params.plan == null) {
					throw new Error("complete-plan requires a plan number");
				}
				const planNum = padPhase(params.plan);
				frontmatter.current_plan = `${phase}-${planNum}`;
				frontmatter.status = "executing";
				frontmatter.stopped_at = `Plan ${phase}-${planNum} completed`;
			} else if (params.operation === "complete-phase") {
				const completed = Array.isArray(frontmatter.completed_phases) ? frontmatter.completed_phases : [];
				if (!completed.includes(phase)) {
					completed.push(phase);
				}
				frontmatter.completed_phases = completed.sort();
				frontmatter.active_phase = null;
				frontmatter.current_phase = null;
				frontmatter.current_phase_name = null;
				frontmatter.current_plan = null;
				frontmatter.status = "idle";
				// Advance next phase if queued
				const nextPhases = Array.isArray(frontmatter.next_phases) ? frontmatter.next_phases : [];
				const next = nextPhases.find((p) => padPhase(p) !== phase);
				frontmatter.next_action = params.nextAction || (next ? `begin-phase ${padPhase(next)}` : "milestone-complete");
				frontmatter.stopped_at = `Phase ${phase} completed`;
			}

			// Keep progress counters in sync with the canonical filesystem state.
			if (params.operation === "complete-phase" || params.operation === "complete-plan") {
				refreshProgress(repoPath, frontmatter);
			}

			frontmatter.last_activity = formatDate();
			saveState(repoPath, frontmatter, body);
			return buildToolResultText({
				ok: true,
				path: statePath(repoPath),
				operation: params.operation,
				phase,
				plan: params.plan == null ? undefined : padPhase(params.plan),
				progress: frontmatter.progress,
				frontmatter: {
					active_phase: frontmatter.active_phase,
					current_phase: frontmatter.current_phase,
					current_phase_name: frontmatter.current_phase_name,
					current_plan: frontmatter.current_plan,
					status: frontmatter.status,
					next_action: frontmatter.next_action,
					completed_phases: frontmatter.completed_phases,
				},
			});
		},
	});

	pi.registerTool({
		name: "gsd_state_progress",
		label: "GSD State Progress",
		description:
			"Recalculate progress.* fields in .planning/STATE.md by scanning .planning/phases/ for plans and summaries.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const { frontmatter, body } = loadState(repoPath);
			const progress = calculateProgress(repoPath);

			frontmatter.progress = progress;
			frontmatter.last_activity = formatDate();
			saveState(repoPath, frontmatter, body);
			return buildToolResultText({
				ok: true,
				path: statePath(repoPath),
				progress,
			});
		},
	});
}
