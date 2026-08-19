/**
 * gsd_next_action — state-aware next-action recommender.
 *
 * Reads .planning/STATE.md and suggests valid next actions without mutating
 * the file. The FSM is keyed by `status`, `active_phase`, and `next_action`.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as registry from "./registry";
import { resolveAbsolutePath } from "./utils";

export interface NextActionResult {
	valid_actions: string[];
	recommended_action: string;
	reason: string;
	missing_prerequisites: string[];
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

function findPhaseDir(repoPath: string, phaseNum: string): string | undefined {
	const phases = registry.listPhases(repoPath);
	const phase = phases.find((p) => p.num === phaseNum);
	return phase?.path;
}

function contextPath(repoPath: string, phaseNum: string): string | undefined {
	const phaseDir = findPhaseDir(repoPath, phaseNum);
	if (!phaseDir) return undefined;
	return path.join(phaseDir, `${phaseNum}-CONTEXT.md`);
}

function planPath(repoPath: string, planId: string): string | undefined {
	const [phaseNum, planNum] = planId.split("-");
	if (!phaseNum || !planNum) return undefined;
	const phaseDir = findPhaseDir(repoPath, phaseNum);
	if (!phaseDir) return undefined;
	return path.join(phaseDir, `${planId}-PLAN.md`);
}

export function determineNextAction(repoPath: string): NextActionResult {
	const { frontmatter } = registry.load("state", repoPath);
	const status = frontmatter.status;
	const nextAction = frontmatter.next_action;
	const activePhase = frontmatter.active_phase;
	const currentPlan = frontmatter.current_plan;
	const nextPhases = Array.isArray(frontmatter.next_phases) ? frontmatter.next_phases : [];

	const missing: string[] = [];

	if (status === "initializing") {
		if (!nextPhases.length) missing.push("next_phases is empty");
		return {
			valid_actions: ["discuss-phase"],
			recommended_action: "discuss-phase",
			reason: "Project is initializing; start with discuss-phase for the first phase.",
			missing_prerequisites: missing,
		};
	}

	if (status === "idle") {
		const actions = ["begin-phase"];
		if (!nextPhases.length) actions.push("milestone-complete");
		if (!activePhase && !nextPhases.length) missing.push("No upcoming phases in next_phases");
		return {
			valid_actions: actions,
			recommended_action: nextPhases.length ? "begin-phase" : "milestone-complete",
			reason: "No active phase. Begin the next queued phase or mark the milestone complete.",
			missing_prerequisites: missing,
		};
	}

	if (status === "paused") {
		if (!activePhase) missing.push("active_phase is null");
		return {
			valid_actions: ["resume", "abandon"],
			recommended_action: "resume",
			reason: "Work is paused. Resume the active phase or abandon it.",
			missing_prerequisites: missing,
		};
	}

	if (status === "executing") {
		if (!activePhase) missing.push("active_phase is null");
		if (!currentPlan) missing.push("current_plan is null");
		if (currentPlan) {
			const pp = planPath(repoPath, currentPlan);
			if (!pp || !fs.existsSync(pp)) missing.push(`PLAN.md for plan ${currentPlan}`);
		}
		return {
			valid_actions: ["execute-phase", "complete-plan", "pause"],
			recommended_action: "execute-phase",
			reason: currentPlan
				? `Plan ${currentPlan} is currently executing.`
				: "Execution is requested but no plan is selected.",
			missing_prerequisites: missing,
		};
	}

	if (status === "active") {
		if (!activePhase) missing.push("active_phase is null");

		if (nextAction === "discuss-phase") {
			if (activePhase) {
				const cp = contextPath(repoPath, activePhase);
				if (cp && fs.existsSync(cp)) {
					return {
						valid_actions: ["plan-phase", "plan-check"],
						recommended_action: "plan-phase",
						reason: `CONTEXT.md exists for phase ${activePhase}; proceed to plan-phase.`,
						missing_prerequisites: [],
					};
				}
			}
			return {
				valid_actions: ["discuss-phase", "plan-phase"],
				recommended_action: "discuss-phase",
				reason: `Phase ${activePhase} is active and ready for discussion.`,
				missing_prerequisites: activePhase ? [] : ["active_phase is null"],
			};
		}

		if (nextAction === "plan-phase") {
			if (activePhase) {
				const cp = contextPath(repoPath, activePhase);
				if (!cp || !fs.existsSync(cp)) missing.push(`CONTEXT.md for phase ${activePhase}`);
			}
			return {
				valid_actions: ["plan-phase", "plan-check"],
				recommended_action: "plan-phase",
				reason: `Phase ${activePhase} has been discussed; create or refine the plan.`,
				missing_prerequisites: missing,
			};
		}

		if (nextAction === "execute-phase") {
			if (!currentPlan) missing.push("current_plan is null");
			if (currentPlan) {
				const pp = planPath(repoPath, currentPlan);
				if (!pp || !fs.existsSync(pp)) missing.push(`PLAN.md for plan ${currentPlan}`);
			}
			return {
				valid_actions: ["execute-phase", "pause"],
				recommended_action: "execute-phase",
				reason: currentPlan
					? `Plan ${currentPlan} is queued for execution.`
					: "Execution is requested but no plan is selected.",
				missing_prerequisites: missing,
			};
		}

		return {
			valid_actions: ["discuss-phase"],
			recommended_action: "discuss-phase",
			reason: `Active phase ${activePhase} has unrecognized next_action "${nextAction}"; default to discuss.`,
			missing_prerequisites: missing,
		};
	}

	return {
		valid_actions: ["discuss-phase"],
		recommended_action: "discuss-phase",
		reason: `Unrecognized status "${status}"; default to discuss-phase.`,
		missing_prerequisites: [],
	};
}

export function registerNextActionTool(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_next_action",
		label: "GSD Next Action",
		description: "Suggest valid next actions based on .planning/STATE.md without mutating it.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const result = determineNextAction(repoPath);
			return buildToolResultText({
				ok: true,
				path: registry.artifactPath("state", repoPath),
				...result,
			});
		},
	});
}
