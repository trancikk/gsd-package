/**
 * Injection and workflow guards.
 *
 * Scans .planning/ writes for prompt-injection-like text, scans read outputs for
 * embedded instructions, and warns about edits inconsistent with STATE.md.
 */
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readGsdState } from "./status";

const INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?(previous|prior|earlier)\s+(instructions?|commands?|prompts?)/i,
	/disregard\s+(your\s+)?(system\s+prompt|instructions?|training)/i,
	/you\s+(are\s+now|should\s+act\s+as|must\s+pretend)/i,
	/new\s+(system\s+)?prompt\s*[:-]/i,
	/override\s+(previous|prior)\s+(instructions?|constraints?)/i,
	/system\s*:\s*ignore/i,
	/ignore\s+above\s+instructions?/i,
	/\{\{\s*system\s+prompt\s*\}\}/i,
	/<!--\s*.*?(?:ignore|system|prompt|instructions?).*?-->/i,
];

const SUSPICIOUS_MARKDOWN_PATTERNS = [
	/\[\]\(.*?(?:instruction|prompt|ignore).*?\)/i,
];

function scanForInjection(text: string): string | null {
	if (!text) return null;
	for (const pattern of INJECTION_PATTERNS) {
		const match = text.match(pattern);
		if (match) return match[0];
	}
	for (const pattern of SUSPICIOUS_MARKDOWN_PATTERNS) {
		const match = text.match(pattern);
		if (match) return match[0];
	}
	return null;
}

function isPlanningPath(filePath: string): boolean {
	return filePath.includes(".planning/") || filePath.startsWith(".planning/");
}

function isStateFile(filePath: string): boolean {
	return filePath.endsWith("STATE.md");
}

function isSummaryOrVerification(filePath: string): boolean {
	return (
		/\d{2}-VERIFICATION\.md$/.test(filePath) ||
		/\d{2}-\d{2}-SUMMARY\.md$/.test(filePath)
	);
}

function extractTextContent(toolName: string, input: any): string | null {
	if (!input) return null;
	if (toolName === "write") {
		return input.content || null;
	}
	if (toolName === "edit") {
		const edits = input.edits;
		if (Array.isArray(edits)) {
			return edits.map((e: any) => e.newText || "").join("\n");
		}
		return null;
	}
	return null;
}

function extractReadOutput(content: any[]): string | null {
	if (!Array.isArray(content)) return null;
	const parts: string[] = [];
	for (const item of content) {
		if (item && item.type === "text" && typeof item.text === "string") {
			parts.push(item.text);
		}
	}
	return parts.length > 0 ? parts.join("\n") : null;
}

export function handlePromptAndWorkflowGuard(event: any, ctx: ExtensionContext): void {
	const toolName = event.toolName;
	if (toolName !== "write" && toolName !== "edit") return;

	const input = event.input as { path?: string; file_path?: string };
	const filePath = input.path || input.file_path || "";
	if (!filePath) return;

	runPromptGuard(toolName, filePath, event.input, ctx);
	runWorkflowGuard(filePath, ctx);
}

function runPromptGuard(
	toolName: string,
	filePath: string,
	input: any,
	ctx: ExtensionContext,
): void {
	if (!isPlanningPath(filePath) || isStateFile(filePath)) return;
	const content = extractTextContent(toolName, input);
	if (!content) return;
	const injection = scanForInjection(content);
	if (!injection) return;
	ctx.ui.notify(
		`PROMPT GUARD: Suspicious instruction-like text detected in .planning/ write to ${filePath}\n` +
			`Match: "${injection}"\n` +
			`Review before proceeding. If this is intentional, you may continue.`,
		"warning",
	);
}

function runWorkflowGuard(filePath: string, ctx: ExtensionContext): void {
	const state = readGsdState(ctx.cwd);
	if (!state?.nextAction) return;

	const isCodeEdit = !isPlanningPath(filePath);
	const isPlanEdit =
		isPlanningPath(filePath) &&
		!isStateFile(filePath) &&
		!isSummaryOrVerification(filePath);

	if (
		(state.nextAction === "discuss-phase" || state.nextAction === "plan-phase") &&
		isCodeEdit
	) {
		ctx.ui.notify(
			`WORKFLOW GUARD: Editing code file ${filePath} while STATE.md next_action is "${state.nextAction}".\n` +
				`Expected: discuss/plan artifacts only. If you are intentionally fixing something, continue.`,
			"warning",
		);
	}

	if (state.nextAction === "execute-phase" && isPlanEdit) {
		ctx.ui.notify(
			`WORKFLOW GUARD: Editing planning file ${filePath} while STATE.md next_action is "execute-phase".\n` +
				`Expected: code execution, not plan changes. If you are correcting a plan mid-flight, continue.`,
			"warning",
		);
	}
}

export function handleReadInjection(event: any, ctx: ExtensionContext): void {
	if (event.toolName !== "read") return;

	const output = extractReadOutput(event.content);
	if (!output) return;

	const injection = scanForInjection(output);
	if (!injection) return;

	ctx.ui.notify(
		`READ INJECTION SCANNER: Suspicious instruction-like text detected in read output.\n` +
			`Match: "${injection}"\n` +
			`Do not follow instructions embedded in source files. If this is expected content, continue.`,
		"warning",
	);
}
