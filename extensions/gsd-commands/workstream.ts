import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { Type } from "typebox";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { resolveAbsolutePath, writeAtomic } from "./utils";

export type WorkstreamStatus = "active" | "paused" | "merged" | "closed";

export interface Workstream {
	id: string;
	name: string;
	branch: string;
	status: WorkstreamStatus;
	created: string;
	updated: string;
	base_branch?: string;
	linked_phase?: string;
	linked_backlog_item?: string;
	description: string;
}

function workstreamsPath(repoPath: string): string {
	return path.join(repoPath, ".planning/WORKSTREAMS.md");
}

function statePath(repoPath: string): string {
	return path.join(repoPath, ".planning/STATE.md");
}

function defaultTemplate(): string {
	return `# Workstreams

Parallel feature workstreams for this repository.

A workstream is an isolated line of work (a Git branch) that can progress independently
of the main trunk and other workstreams. Use workstreams when you need to run multiple
phases or features in parallel, spike an idea, or keep a long-running refactor separate
from daily delivery.

## Active workstream

None.

## Workstreams

`;
}

function ensureWorkstreamsFile(repoPath: string): string {
	const wp = workstreamsPath(repoPath);
	if (!fs.existsSync(wp)) {
		fs.mkdirSync(path.dirname(wp), { recursive: true });
		fs.writeFileSync(wp, defaultTemplate(), "utf8");
	}
	return wp;
}

function readWorkstreams(repoPath: string, ensure = true): { content: string; items: Workstream[]; activeId?: string } {
	const wp = ensure ? ensureWorkstreamsFile(repoPath) : workstreamsPath(repoPath);
	if (!fs.existsSync(wp)) {
		return { content: defaultTemplate(), items: [], activeId: undefined };
	}
	const content = fs.readFileSync(wp, "utf8");
	const items = parseWorkstreams(content);
	const activeId = parseActiveWorkstream(content);
	return { content, items, activeId };
}

function parseActiveWorkstream(content: string): string | undefined {
	const match = content.match(/## Active workstream\s*\n\s*(?:\*\*)?([^*\n]+?)(?:\*\*)?\s*(?=\n## |\n# |$)/s);
	if (!match) return undefined;
	const line = match[1].trim();
	if (line.toLowerCase().startsWith("none") || line.toLowerCase().startsWith("no active")) return undefined;
	const idMatch = line.match(/^(WS-\d+)/);
	return idMatch ? idMatch[1] : undefined;
}

function renderActiveLine(item?: Workstream): string {
	if (!item) return "None.";
	return `${item.id}: ${item.name} (branch: ${item.branch}, status: ${item.status})`;
}

function parseWorkstreams(content: string): Workstream[] {
	const items: Workstream[] = [];
	const sectionMatch = content.match(/## Workstreams\b([\s\S]*?)(?=\n## |\n# |$)/);
	if (!sectionMatch) return items;
	const sectionBody = sectionMatch[1];

	const itemMatches = sectionBody.matchAll(
		/### (WS-\d+):\s*(.*?)\n([\s\S]*?)(?=\n### WS-\d+:|\n## |$)/g,
	);
	for (const itemMatch of itemMatches) {
		const id = itemMatch[1];
		const title = itemMatch[2].trim();
		const body = itemMatch[3];
		items.push({
			id,
			name: title,
			branch: extractField(body, "Branch") || id.toLowerCase().replace("-", ""),
			status: (extractField(body, "Status") as WorkstreamStatus) || "active",
			created: extractField(body, "Created") || new Date().toISOString().slice(0, 10),
			updated: extractField(body, "Updated") || new Date().toISOString().slice(0, 10),
			base_branch: extractField(body, "Base branch"),
			linked_phase: extractField(body, "Linked phase") || undefined,
			linked_backlog_item: extractField(body, "Linked backlog item") || undefined,
			description: extractDescription(body),
		});
	}
	return items;
}

function extractField(body: string, fieldName: string): string | undefined {
	const re = new RegExp(`^- \\*\\*${fieldName}:\\*\\*\\s*(.+?)\\s*$`, "im");
	const match = body.match(re);
	if (!match) return undefined;
	const value = match[1].trim();
	return value === "—" || value === "None" ? undefined : value;
}

function extractDescription(body: string): string {
	const lines = body.split(/\r?\n/);
	const descLines: string[] = [];
	let inDescription = false;
	for (const line of lines) {
		if (line.match(/^- \*\*[A-Za-z ]+:\*\*/)) continue;
		if (line.trim() === "" && !inDescription) continue;
		inDescription = true;
		descLines.push(line);
	}
	return descLines.join("\n").trim();
}

function renderItem(item: Workstream): string {
	const baseBranch = item.base_branch || "—";
	const linkedPhase = item.linked_phase || "—";
	const linkedBacklog = item.linked_backlog_item || "—";
	return `### ${item.id}: ${item.name}
- **Branch:** ${item.branch}
- **Status:** ${item.status}
- **Created:** ${item.created}
- **Updated:** ${item.updated}
- **Base branch:** ${baseBranch}
- **Linked phase:** ${linkedPhase}
- **Linked backlog item:** ${linkedBacklog}

${item.description}
`;
}

function rebuildWorkstreams(content: string, items: Workstream[], activeItem?: Workstream): string {
	const introMatch = content.match(/^(.*?)## Active workstream\b/s);
	const intro = introMatch
		? `${introMatch[1].trimEnd()}\n\n`
		: "# Workstreams\n\n## Active workstream\n\n";

	let out = intro;
	out += `## Active workstream\n\n${renderActiveLine(activeItem)}\n\n`;
	out += "## Workstreams\n\n";
	if (items.length === 0) {
		out += "*(No workstreams yet.)*\n";
	} else {
		for (const item of items) {
			out += renderItem(item);
			out += "\n";
		}
	}
	return `${out.trimEnd()}\n`;
}

function nextId(items: Workstream[]): string {
	let max = 0;
	for (const item of items) {
		const num = parseInt(item.id.replace("WS-", ""), 10);
		if (!isNaN(num) && num > max) max = num;
	}
	return `WS-${String(max + 1).padStart(3, "0")}`;
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function git(repoPath: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
	const result = spawnSync("git", args, { cwd: repoPath, encoding: "utf8" });
	return {
		ok: result.status === 0,
		stdout: result.stdout?.trim() || "",
		stderr: result.stderr?.trim() || "",
	};
}

function isGitRepo(repoPath: string): boolean {
	return git(repoPath, ["rev-parse", "--git-dir"]).ok;
}

function currentBranch(repoPath: string): string | undefined {
	const result = git(repoPath, ["branch", "--show-current"]);
	return result.ok ? result.stdout : undefined;
}

function branchExists(repoPath: string, branch: string): boolean {
	return git(repoPath, ["show-ref", "--verify", `--refs/heads/${branch}`]).ok;
}

function createGitBranch(repoPath: string, branch: string, baseBranch?: string): { ok: boolean; message: string } {
	const args = baseBranch ? ["checkout", "-b", branch, baseBranch] : ["checkout", "-b", branch];
	const result = git(repoPath, args);
	return { ok: result.ok, message: result.ok ? `Created branch ${branch}` : result.stderr };
}

function checkoutGitBranch(repoPath: string, branch: string): { ok: boolean; message: string } {
	const result = git(repoPath, ["checkout", branch]);
	return { ok: result.ok, message: result.ok ? `Checked out ${branch}` : result.stderr };
}

function isWorktreeClean(repoPath: string): boolean {
	const result = git(repoPath, ["status", "--porcelain"]);
	return result.ok && result.stdout === "";
}

function buildToolResultText(payload: any): AgentToolResult<any> {
	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(payload, null, 2),
			},
		],
	};
}

function updateStateActiveWorkstream(repoPath: string, workstreamId?: string): void {
	const sp = statePath(repoPath);
	if (!fs.existsSync(sp)) return;
	const content = fs.readFileSync(sp, "utf8");
	const marker = /^(active_workstream:\s*.*)$/m;
	const replacement = workstreamId ? `active_workstream: ${workstreamId}` : "active_workstream: null";
	const newContent = marker.test(content)
		? content.replace(marker, replacement)
		: content.replace(/^(---\n[\s\S]*?\n)(---\n)/m, `$1${replacement}\n$2`);
	writeAtomic(sp, newContent);
}

export function registerWorkstreamTools(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_workstream",
		label: "GSD Workstream",
		description:
			"Manage parallel feature workstreams in .planning/WORKSTREAMS.md and their associated Git branches.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
			operation: Type.Union(
				[
					Type.Literal("list", { description: "List workstreams, optionally filtered" }),
					Type.Literal("add", { description: "Create a new workstream" }),
					Type.Literal("update", { description: "Update workstream fields" }),
					Type.Literal("switch", { description: "Activate a workstream and optionally checkout its branch" }),
					Type.Literal("pause", { description: "Pause a workstream" }),
					Type.Literal("resume", { description: "Resume a paused workstream" }),
					Type.Literal("merge", { description: "Mark a workstream as merged" }),
					Type.Literal("close", { description: "Close a workstream" }),
				],
				{ description: "Operation to perform" },
			),
			id: Type.Optional(Type.String({ description: "Workstream ID, e.g. WS-001 (for update/switch/pause/resume/merge/close)" })),
			name: Type.Optional(Type.String({ description: "Workstream name (for add/update)" })),
			branch: Type.Optional(Type.String({ description: "Git branch name (for add; defaults to workstream id)" })),
			baseBranch: Type.Optional(Type.String({ description: "Base branch to branch from (for add; defaults to current branch)" })),
			linkedPhase: Type.Optional(Type.String({ description: "Phase number linked to this workstream" })),
			linkedBacklogItem: Type.Optional(Type.String({ description: "Backlog item ID linked to this workstream" })),
			description: Type.Optional(Type.String({ description: "Workstream description (for add/update)" })),
			status: Type.Optional(Type.String({ description: "Filter by status (for list)" })),
			checkout: Type.Optional(Type.Boolean({ description: "Whether to checkout the branch on switch (default true)" })),
			createBranch: Type.Optional(Type.Boolean({ description: "Whether to create the Git branch on add (default true if repo is clean)" })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);

			if (params.operation === "list") {
				const listRead = readWorkstreams(repoPath, false);
				let filtered = listRead.items;
				if (params.status) filtered = filtered.filter((i) => i.status === params.status);
				return buildToolResultText({
					ok: true,
					path: workstreamsPath(repoPath),
					active: listRead.activeId,
					count: filtered.length,
					items: filtered,
				});
			}

			if (params.operation === "add") {
				if (!params.name) throw new Error("add requires a name");
				// Create the Git branch BEFORE touching any registry files so the worktree is still clean.
				const gitAvailable = isGitRepo(repoPath);
				let baseBranch = params.baseBranch;
				let branchCreated = false;
				let branchMessage: string | undefined;
				let branch: string | undefined;

				if (gitAvailable && params.createBranch !== false) {
					if (!baseBranch) {
						baseBranch = currentBranch(repoPath);
					}
					branch = params.branch || `ws${String(nextId([]).replace("WS-", "")).padStart(3, "0")}`;
					if (branchExists(repoPath, branch)) {
						branchMessage = `Branch ${branch} already exists; not recreated.`;
					} else if (isWorktreeClean(repoPath)) {
						const createResult = createGitBranch(repoPath, branch, baseBranch);
						branchCreated = createResult.ok;
						branchMessage = createResult.message;
					} else {
						branchMessage = "Worktree is dirty; branch not created. Create it manually or commit changes first.";
					}
				}

				const wp = ensureWorkstreamsFile(repoPath);
				const { content, items } = readWorkstreams(repoPath);
				const id = nextId(items);
				branch = params.branch || id.toLowerCase().replace("-", "");

				const newItem: Workstream = {
					id,
					name: params.name,
					branch,
					status: "active",
					created: today(),
					updated: today(),
					base_branch: baseBranch,
					linked_phase: params.linkedPhase,
					linked_backlog_item: params.linkedBacklogItem,
					description: params.description || "",
				};
				items.push(newItem);
				const newContent = rebuildWorkstreams(content, items, newItem);
				writeAtomic(wp, newContent);
				updateStateActiveWorkstream(repoPath, id);
				return buildToolResultText({
					ok: true,
					path: wp,
					operation: "add",
					item: newItem,
					branchCreated,
					branchMessage,
				});
			}

			const wp = ensureWorkstreamsFile(repoPath);
			const { content, items, activeId } = readWorkstreams(repoPath);

			if (!params.id) throw new Error(`${params.operation} requires an id`);
			const item = items.find((i) => i.id === params.id);
			if (!item) throw new Error(`Workstream not found: ${params.id}`);

			if (params.operation === "update") {
				if (params.name !== undefined) item.name = params.name;
				if (params.description !== undefined) item.description = params.description;
				if (params.linkedPhase !== undefined) item.linked_phase = params.linkedPhase;
				if (params.linkedBacklogItem !== undefined) item.linked_backlog_item = params.linkedBacklogItem;
				item.updated = today();
				const activeItem = activeId === item.id ? item : items.find((i) => i.id === activeId);
				const newContent = rebuildWorkstreams(content, items, activeItem);
				writeAtomic(wp, newContent);
				return buildToolResultText({ ok: true, path: wp, operation: "update", item });
			}

			if (params.operation === "switch") {
				const checkout = params.checkout !== false;
				let checkoutResult: { ok: boolean; message: string } | undefined;
				if (checkout && isGitRepo(repoPath)) {
					if (isWorktreeClean(repoPath)) {
						checkoutResult = checkoutGitBranch(repoPath, item.branch);
					} else {
						checkoutResult = { ok: false, message: "Worktree is dirty; cannot checkout branch. Commit or stash changes first." };
					}
				}
				const newContent = rebuildWorkstreams(content, items, item);
				writeAtomic(wp, newContent);
				updateStateActiveWorkstream(repoPath, item.id);
				return buildToolResultText({
					ok: true,
					path: wp,
					operation: "switch",
					item,
					checkoutResult,
				});
			}

			if (params.operation === "pause") {
				item.status = "paused";
			} else if (params.operation === "resume") {
				item.status = "active";
			} else if (params.operation === "merge") {
				item.status = "merged";
			} else if (params.operation === "close") {
				item.status = "closed";
			}
			item.updated = today();

			const stillActive = activeId === item.id && item.status === "active";
			const activeItem = stillActive
				? item
				: items.find((i) => i.id === activeId && i.status === "active");
			const newContent = rebuildWorkstreams(content, items, activeItem);
			writeAtomic(wp, newContent);

			if (activeId === item.id && item.status !== "active") {
				updateStateActiveWorkstream(repoPath, activeItem?.id);
			}

			return buildToolResultText({ ok: true, path: wp, operation: params.operation, item, active: activeItem?.id });
		},
	});
}
