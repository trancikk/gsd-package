import { execSync } from "node:child_process";
import { findGsdRoot } from "./status";

function isPlanningPath(filePath: string): boolean {
	return filePath.includes(".planning/") || filePath.startsWith(".planning/");
}

export function handlePhaseBoundary(event: any, ctx: any, gsdActive: boolean) {
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
