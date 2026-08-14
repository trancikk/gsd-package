/**
 * GSD Commands for pi
 *
 * Registers deterministic, parameter-typed tools that prepare and queue the
 * exact `subagent({ workflowScript: ... })` call for each GSD phase agent.
 *
 * The tools handle path resolution, directory creation, and gate construction,
 * then send the prepared call as a follow-up user message so the subagent
 * executes automatically without copy-paste.
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import * as fs from "node:fs";
import * as path from "node:path";

interface ResolvedPaths {
	repoPath: string;
	outputPath: string;
}

function toForwardSlash(input: string): string {
	return input.replace(/\\/g, "/");
}

function resolveAbsolutePath(input: string, cwd: string): string {
	const normalized = toForwardSlash(input);
	return path.isAbsolute(normalized)
		? normalized
		: toForwardSlash(path.resolve(cwd, normalized));
}

function ensureOutputDir(outputPath: string): void {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function buildCrossPlatformGate(outputPath: string): string {
	const execPath = JSON.stringify(process.execPath.replace(/\\/g, "/"));
	const targetPath = JSON.stringify(outputPath);
	const script = `const fs=require('fs'); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }`;
	return `${execPath} -e ${JSON.stringify(script)} ${targetPath}`;
}

function buildSubagentCall(
	agent: string,
	key: string,
	task: string,
	outputPath: string,
): string {
	const taskJson = JSON.stringify(task);
	const outputJson = JSON.stringify(outputPath);
	const gate = buildCrossPlatformGate(outputPath);
	return `subagent({
  workflowScript: "return runs.run('${key}', { agent: '${agent}', context: 'fresh', task: ${taskJson}, output: ${outputJson}, gate: '${gate}' });"
});`;
}

async function queueToolResult(
	pi: ExtensionAPI,
	call: string,
	outputPath: string,
	repoPath: string,
): Promise<AgentToolResult> {
	await pi.sendUserMessage(call, { deliverAs: "followUp" });
	return {
		content: [
			{
				type: "text",
				text: [
					`Queued GSD subagent call as a follow-up message; it will execute automatically after this turn completes.`,
					``,
					`- Repo: ${repoPath}`,
					`- Output: ${outputPath}`,
					`- Gate: ${buildCrossPlatformGate(outputPath)}`,
					``,
					`Prepared call:`,
					``,
					"```javascript",
					call,
					"```",
					``,
					`If the gate fails because the artifact landed in the subagent output channel (.pi/subagents/artifacts/<hash>/...), copy it to ${outputPath}.`,
				].join("\n"),
			},
		],
	};
}

function resolveAndEnsure(
	repoPathInput: string,
	outputPathInput: string,
	ctx: ExtensionContext,
): ResolvedPaths {
	const repoPath = resolveAbsolutePath(repoPathInput, ctx.cwd);
	const outputPath = resolveAbsolutePath(outputPathInput, ctx.cwd);
	ensureOutputDir(outputPath);
	return { repoPath, outputPath };
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_onboard",
		label: "GSD Onboard",
		description: "Queue gsd-phase-researcher in onboard mode to produce a codebase MAPPING.md.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo to map (absolute or relative to session cwd)" }),
			outputPath: Type.String({ description: "Path for MAPPING.md (absolute or relative to session cwd)" }),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult> {
			const { repoPath, outputPath } = resolveAndEnsure(params.repoPath, params.outputPath, ctx);
			const task = [
				"Map this existing codebase for GSD onboarding.",
				``,
				`Repo: ${repoPath}`,
				`Output (absolute path): ${outputPath}`,
				``,
				"Analyze stack, architecture, conventions, entry points, tests, build/deploy, and known tech debt. Do NOT write any implementation code.",
				"Write the complete MAPPING.md to the absolute output path using the write tool.",
				"Create parent directories with bash (mkdir -p) if needed.",
				"Verify the file exists with ls -la before returning.",
			].join("\n");
			const call = buildSubagentCall("gsd-phase-researcher", "onboard-map", task, outputPath);
			return await queueToolResult(pi, call, outputPath, repoPath);
		},
	});

	pi.registerTool({
		name: "gsd_research",
		label: "GSD Research",
		description: "Queue gsd-phase-researcher to produce a phase RESEARCH.md.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo to research (absolute or relative to session cwd)" }),
			outputPath: Type.String({ description: "Path for RESEARCH.md (absolute or relative to session cwd)" }),
			scope: Type.Optional(Type.String({ description: "Optional scope description" })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult> {
			const { repoPath, outputPath } = resolveAndEnsure(params.repoPath, params.outputPath, ctx);
			const task = [
				"Research this phase and write RESEARCH.md.",
				``,
				`Repo: ${repoPath}`,
				`Output (absolute path): ${outputPath}`,
				`Scope: ${params.scope || "entire phase"}`,
				``,
				"Use only read/grep/find/ls/bash (read-only) unless code changes are explicitly required.",
				"Write the complete RESEARCH.md to the absolute output path using the write tool.",
				"Create parent directories with bash (mkdir -p) if needed.",
				"Verify the file exists with ls -la before returning.",
			].join("\n");
			const call = buildSubagentCall("gsd-phase-researcher", "research-phase", task, outputPath);
			return await queueToolResult(pi, call, outputPath, repoPath);
		},
	});

	pi.registerTool({
		name: "gsd_plan",
		label: "GSD Plan",
		description: "Queue gsd-planner to produce a PLAN.md from context and research.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo (absolute or relative to session cwd)" }),
			inputFiles: Type.String({ description: "Comma-separated list of files to read first, or 'auto'" }),
			outputPath: Type.String({ description: "Path for PLAN.md (absolute or relative to session cwd)" }),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult> {
			const { repoPath, outputPath } = resolveAndEnsure(params.repoPath, params.outputPath, ctx);
			const task = [
				"Create an executable plan and write PLAN.md.",
				``,
				`Repo: ${repoPath}`,
				`Input files to read first: ${params.inputFiles}`,
				`Output (absolute path): ${outputPath}`,
				``,
				"Read the input files, then produce a detailed PLAN.md with waves, tasks, must_haves, and verification criteria.",
				"Write the complete PLAN.md to the absolute output path using the write tool.",
				"Create parent directories with bash (mkdir -p) if needed.",
				"Verify the file exists with ls -la before returning.",
			].join("\n");
			const call = buildSubagentCall("gsd-planner", "plan-phase", task, outputPath);
			return await queueToolResult(pi, call, outputPath, repoPath);
		},
	});

	pi.registerTool({
		name: "gsd_execute",
		label: "GSD Execute",
		description: "Queue gsd-executor to implement a PLAN.md and produce SUMMARY.md.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo (absolute or relative to session cwd)" }),
			planPath: Type.String({ description: "Path to the PLAN.md file (absolute or relative to session cwd)" }),
			outputPath: Type.String({ description: "Path for SUMMARY.md (absolute or relative to session cwd)" }),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult> {
			const { repoPath, outputPath } = resolveAndEnsure(params.repoPath, params.outputPath, ctx);
			const planPath = resolveAbsolutePath(params.planPath, ctx.cwd);
			const task = [
				"Execute the plan and write SUMMARY.md.",
				``,
				`Repo: ${repoPath}`,
				`Plan file (absolute path): ${planPath}`,
				`Output (absolute path): ${outputPath}`,
				``,
				"Read the plan file, execute every task atomically, make per-task commits, handle deviations per your rules, and write the complete SUMMARY.md to the absolute output path using the write tool.",
				"Create parent directories with bash (mkdir -p) if needed.",
				"Verify the file exists with ls -la before returning.",
			].join("\n");
			const call = buildSubagentCall("gsd-executor", "execute-plan", task, outputPath);
			return await queueToolResult(pi, call, outputPath, repoPath);
		},
	});

	pi.registerTool({
		name: "gsd_verify",
		label: "GSD Verify",
		description: "Queue gsd-verifier to produce VERIFICATION.md for a completed phase.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo (absolute or relative to session cwd)" }),
			phaseDir: Type.String({ description: "Path to the phase directory (absolute or relative to session cwd)" }),
			outputPath: Type.String({ description: "Path for VERIFICATION.md (absolute or relative to session cwd)" }),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult> {
			const { repoPath, outputPath } = resolveAndEnsure(params.repoPath, params.outputPath, ctx);
			const phaseDir = resolveAbsolutePath(params.phaseDir, ctx.cwd);
			const task = [
				"Verify the phase and write VERIFICATION.md.",
				``,
				`Repo: ${repoPath}`,
				`Phase directory (absolute path): ${phaseDir}`,
				`Output (absolute path): ${outputPath}`,
				``,
				"Read ROADMAP.md, CONTEXT.md, all PLAN.md and SUMMARY.md files in the phase directory, then perform goal-backward verification against the actual codebase.",
				"Write the complete VERIFICATION.md to the absolute output path using the write tool.",
				"Create parent directories with bash (mkdir -p) if needed.",
				"Verify the file exists with ls -la before returning.",
			].join("\n");
			const call = buildSubagentCall("gsd-verifier", "verify-phase", task, outputPath);
			return await queueToolResult(pi, call, outputPath, repoPath);
		},
	});
}
