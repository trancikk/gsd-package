import * as fs from "node:fs";
import * as path from "node:path";
import { Type } from "typebox";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import { resolveAbsolutePath } from "./utils";
import * as registry from "./registry";

const SECTIONS = ["Open", "In Progress", "Blocked", "Closed"] as const;
type Section = (typeof SECTIONS)[number];

interface BacklogItem {
	id: string;
	title: string;
	type: string;
	priority: string;
	captured: string;
	source: string;
	status: string;
	linkedPhase?: string;
	linkedDecision?: string;
	description: string;
	section: Section;
}

function backlogPath(repoPath: string): string {
	return registry.artifactPath("backlog", repoPath);
}

function defaultTemplate(): string {
	return `# Backlog

Pending items captured during discussions, reviews, and execution that are not yet assigned to a phase.

## How to use this file

- Each item has a unique ID (\`B-NNN\`).
- Items are triaged into sections by status.
- Promote an item to a phase by moving it to \`## In Progress\` and setting \`Linked phase:\`.
- Close an item by moving it to \`## Closed\` and setting \`Status: closed\`.

## Open

## In Progress

*(Items currently being worked in a phase.)*

## Blocked

*(Items waiting on a decision, dependency, or external event.)*

## Closed

*(Items completed or explicitly rejected.)*
`;
}

function ensureBacklog(repoPath: string): string {
	const bp = backlogPath(repoPath);
	if (!fs.existsSync(bp)) {
		fs.mkdirSync(path.dirname(bp), { recursive: true });
		fs.writeFileSync(bp, defaultTemplate(), "utf8");
	}
	return bp;
}

function readBacklog(repoPath: string): { content: string; items: BacklogItem[] } {
	const bp = ensureBacklog(repoPath);
	const { body: content } = registry.load("backlog", repoPath);
	return { content, items: parseBacklog(content) };
}

function parseBacklog(content: string): BacklogItem[] {
	const items: BacklogItem[] = [];
	const sectionMatches = content.matchAll(/## (Open|In Progress|Blocked|Closed)\b([\s\S]*?)(?=\n## |\n# |$)/g);

	for (const sectionMatch of sectionMatches) {
		const section = sectionMatch[1] as Section;
		const sectionBody = sectionMatch[2];
		if (!sectionBody) continue;

		const itemMatches = sectionBody.matchAll(/### (B-\d+):\s*(.*?)\n([\s\S]*?)(?=\n### B-\d+:|\n## |$)/g);
		for (const itemMatch of itemMatches) {
			const id = itemMatch[1];
			const title = itemMatch[2].trim();
			const body = itemMatch[3];

			items.push({
				id,
				title,
				type: extractField(body, "Type") || "idea",
				priority: extractField(body, "Priority") || "p2",
				captured: extractField(body, "Captured") || new Date().toISOString().slice(0, 10),
				source: extractField(body, "Source") || "capture",
				status: extractField(body, "Status") || sectionToStatus(section),
				linkedPhase: extractField(body, "Linked phase") || undefined,
				linkedDecision: extractField(body, "Linked decision") || undefined,
				description: extractDescription(body),
				section,
			});
		}
	}

	return items;
}

function extractField(body: string, fieldName: string): string | undefined {
	const re = new RegExp(`^- \\*\\*${fieldName}:\\*\\*\\s*(.+?)\\s*$`, "im");
	const match = body.match(re);
	if (!match) return undefined;
	const value = match[1].trim();
	return value === "—" ? undefined : value;
}

function extractDescription(body: string): string {
	const lines = body.split(/\r?\n/);
	const descLines: string[] = [];
	let inDescription = false;
	for (const line of lines) {
		if (line.match(/^- \*\*[A-Za-z ]+:\*\*/)) {
			continue;
		}
		if (line.trim() === "" && !inDescription) continue;
		inDescription = true;
		descLines.push(line);
	}
	return descLines.join("\n").trim();
}

function sectionToStatus(section: Section): string {
	switch (section) {
		case "Open":
			return "open";
		case "In Progress":
			return "in-progress";
		case "Blocked":
			return "blocked";
		case "Closed":
			return "closed";
	}
}

function statusToSection(status: string): Section {
	switch (status) {
		case "open":
			return "Open";
		case "in-progress":
			return "In Progress";
		case "blocked":
			return "Blocked";
		case "closed":
			return "Closed";
		default:
			return "Open";
	}
}

function renderItem(item: BacklogItem): string {
	const section = statusToSection(item.status);
	const linkedPhase = item.linkedPhase || "—";
	const linkedDecision = item.linkedDecision || "—";
	return `### ${item.id}: ${item.title}
- **Type:** ${item.type}
- **Priority:** ${item.priority}
- **Captured:** ${item.captured}
- **Source:** ${item.source}
- **Status:** ${item.status}
- **Linked phase:** ${linkedPhase}
- **Linked decision:** ${linkedDecision}

${item.description}
`;
}

function rebuildBacklog(content: string, items: BacklogItem[]): string {
	// Preserve headers and intro text before the first ## Open
	const introMatch = content.match(/^(.*?)## Open\b/s);
	const intro = introMatch ? introMatch[1].trimEnd() + "\n\n" : "# Backlog\n\n";

	const bySection: Record<Section, BacklogItem[]> = {
		Open: [],
		"In Progress": [],
		Blocked: [],
		Closed: [],
	};
	for (const item of items) {
		bySection[statusToSection(item.status)].push(item);
	}

	let out = intro;
	for (const section of SECTIONS) {
		const sectionItems = bySection[section];
		out += `## ${section}\n\n`;
		if (sectionItems.length === 0) {
			out += section === "Open" ? "" : `*(No ${section.toLowerCase()} items.)*\n\n`;
		} else {
			for (const item of sectionItems) {
				out += renderItem(item);
				out += "\n";
			}
		}
	}
	return out.trimEnd() + "\n";
}

function nextId(items: BacklogItem[]): string {
	let max = 0;
	for (const item of items) {
		const num = parseInt(item.id.replace("B-", ""), 10);
		if (!isNaN(num) && num > max) max = num;
	}
	return `B-${String(max + 1).padStart(3, "0")}`;
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

export function registerBacklogTools(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_backlog",
		label: "GSD Backlog",
		description: "Manage the .planning/BACKLOG.md file: list, add, update, close, or promote items.",
		parameters: Type.Object({
			repoPath: Type.String({ description: "Path to the repo (absolute or relative to session cwd)" }),
			operation: Type.Union(
				[
					Type.Literal("list", { description: "List backlog items, optionally filtered" }),
					Type.Literal("add", { description: "Add a new backlog item" }),
					Type.Literal("update", { description: "Update fields of an existing item" }),
					Type.Literal("close", { description: "Close an item" }),
					Type.Literal("promote", { description: "Promote an item to a phase (sets status in-progress and linked phase)" }),
				],
				{ description: "Operation to perform" },
			),
			status: Type.Optional(Type.String({ description: "Filter by status (for list)" })),
			type: Type.Optional(Type.String({ description: "Filter by type (for list)" })),
			priority: Type.Optional(Type.String({ description: "Filter by priority (for list)" })),
			id: Type.Optional(Type.String({ description: "Item ID, e.g. B-001 (for update/close/promote)" })),
			title: Type.Optional(Type.String({ description: "Item title (for add/update)" })),
			description: Type.Optional(Type.String({ description: "Item description (for add/update)" })),
			source: Type.Optional(Type.String({ description: "Where the item came from (for add/update)" })),
			linkedPhase: Type.Optional(Type.String({ description: "Phase number the item is linked to (for update/promote)" })),
			linkedDecision: Type.Optional(Type.String({ description: "Decision ID the item is linked to (for update)" })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<any>> {
			const repoPath = resolveAbsolutePath(params.repoPath, ctx.cwd);
			const bp = ensureBacklog(repoPath);
			let { content, items } = readBacklog(repoPath);

			if (params.operation === "list") {
				let filtered = items;
				if (params.status) filtered = filtered.filter((i) => i.status === params.status);
				if (params.type) filtered = filtered.filter((i) => i.type === params.type);
				if (params.priority) filtered = filtered.filter((i) => i.priority === params.priority);
				return buildToolResultText({ ok: true, path: bp, count: filtered.length, items: filtered });
			}

			if (params.operation === "add") {
				if (!params.title) throw new Error("add requires a title");
				const today = new Date().toISOString().slice(0, 10);
				const newItem: BacklogItem = {
					id: nextId(items),
					title: params.title,
					type: params.type || "idea",
					priority: params.priority || "p2",
					captured: today,
					source: params.source || "capture",
					status: "open",
					linkedPhase: params.linkedPhase,
					linkedDecision: params.linkedDecision,
					description: params.description || "",
					section: "Open",
				};
				items.push(newItem);
				const newContent = rebuildBacklog(content, items);
				registry.save("backlog", repoPath, { body: newContent });
				return buildToolResultText({ ok: true, path: bp, operation: "add", item: newItem });
			}

			if (params.operation === "update" || params.operation === "close" || params.operation === "promote") {
				if (!params.id) throw new Error(`${params.operation} requires an id`);
				const item = items.find((i) => i.id === params.id);
				if (!item) throw new Error(`Backlog item not found: ${params.id}`);

				if (params.operation === "close") {
					item.status = "closed";
				} else if (params.operation === "promote") {
					if (!params.linkedPhase) throw new Error("promote requires linkedPhase");
					item.status = "in-progress";
					item.linkedPhase = params.linkedPhase;
				} else {
					// update
					if (params.title !== undefined) item.title = params.title;
					if (params.type !== undefined) item.type = params.type;
					if (params.priority !== undefined) item.priority = params.priority;
					if (params.description !== undefined) item.description = params.description;
					if (params.source !== undefined) item.source = params.source;
					if (params.linkedPhase !== undefined) item.linkedPhase = params.linkedPhase;
					if (params.linkedDecision !== undefined) item.linkedDecision = params.linkedDecision;
					if (params.status !== undefined) {
						item.status = params.status;
						item.section = statusToSection(params.status);
					}
				}

				const newContent = rebuildBacklog(content, items);
				registry.save("backlog", repoPath, { body: newContent });
				return buildToolResultText({ ok: true, path: bp, operation: params.operation, item });
			}

			throw new Error(`Unknown operation: ${params.operation}`);
		},
	});
}
