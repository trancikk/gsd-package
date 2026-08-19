/**
 * GSD Hooks for pi — thin registration file.
 *
 * Context monitoring, phase boundary reminders, commit validation, prompt guard,
 * read-injection scanner, and workflow guard are implemented in focused modules
 * under this directory. This file only wires them to the extension API.
 */

import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { handleCommitValidation } from "./commit-guard";
import { handleTurnEnd, resetContextWarnings } from "./context-guard";
import { handlePromptAndWorkflowGuard, handleReadInjection } from "./injection-guard";
import { findGsdRoot } from "./status";
import { handleSessionStart } from "./status-renderer";

let gsdActive = false;

function isPlanningPath(filePath: string): boolean {
	return filePath.includes(".planning/") || filePath.startsWith(".planning/");
}

function handlePhaseBoundary(event: any, ctx: any) {
	if (!gsdActive) return;

	const toolName = event.toolName;
	let filePath: string | null = null;

	if (toolName === "write" || toolName === "edit") {
		const input = event.input as { path?: string; file_path?: string };
		filePath = input.path || input.file_path || null;
	}

	if (!filePath) return;
	if (!isPlanningPath(filePath)) return;

	ctx.ui.notify(
		`.planning/ file modified: ${filePath}\nCheck: Should STATE.md be updated to reflect this change?`,
		"info",
	);

	try {
		const root = findGsdRoot(ctx.cwd);
		if (!root) return;
		const status = execSync("git status --porcelain", {
			cwd: root,
			encoding: "utf8",
		});
		if (!status.trim()) return;
		const phaseContext = `Uncommitted changes detected after .planning/ update.`;
		ctx.ui.notify(`${phaseContext}\nRun: git add -A && git commit -m "<type>(<scope>): <subject>"`, "info");
	} catch {
		// git not available or not a repo, skip commit reminder
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		gsdActive = handleSessionStart(_event, ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		handleTurnEnd(_event, ctx, gsdActive);
	});

	pi.on("tool_result", handlePhaseBoundary);
	pi.on("tool_result", handleReadInjection);

	pi.on("tool_call", handlePromptAndWorkflowGuard);
	pi.on("tool_call", handleCommitValidation);
}

// Allow tests to reset module state.
export { resetContextWarnings };
