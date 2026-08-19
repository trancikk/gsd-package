/**
 * Save Last Response extension for pi
 *
 * Provides the /save-last slash command to write the most recent assistant
 * response to a Markdown file in the current working directory. If no file
 * name is supplied, a random name is generated automatically.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	SessionEntry,
	SessionMessageEntry,
} from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";

function isAssistantMessageEntry(
	entry: SessionEntry,
): entry is SessionMessageEntry & { message: AssistantMessage } {
	return entry.type === "message" && entry.message.role === "assistant";
}

function extractAssistantText(message: AssistantMessage): string {
	return message.content
		.flatMap((block) => (block.type === "text" ? [block.text] : []))
		.join("\n\n");
}

function resolveFilePath(input: string, cwd: string): string {
	const normalized = input.replace(/\\/g, "/");
	const resolved = path.isAbsolute(normalized)
		? normalized
		: path.resolve(cwd, normalized);
	return resolved.replace(/\\/g, "/");
}

function ensureMdExtension(name: string): string {
	const trimmed = name.trim();
	if (trimmed.toLowerCase().endsWith(".md")) return trimmed;
	return `${trimmed}.md`;
}

function generateFileName(): string {
	const timestamp = Date.now();
	const id = randomUUID().split("-")[0];
	return `response-${timestamp}-${id}.md`;
}

async function saveLastResponse(
	args: string,
	ctx: ExtensionCommandContext,
): Promise<void> {
	const branch = ctx.sessionManager.getBranch();

	let target: AssistantMessage | undefined;
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (isAssistantMessageEntry(entry)) {
			target = entry.message;
			break;
		}
	}

	if (!target) {
		if (ctx.hasUI) {
			ctx.ui.notify(
				"No assistant response found in the current session.",
				"warning",
			);
		}
		return;
	}

	const text = extractAssistantText(target);
	if (!text.trim()) {
		if (ctx.hasUI) {
			ctx.ui.notify(
				"The last assistant response contains no text to save.",
				"warning",
			);
		}
		return;
	}

	const rawName = args.trim() || generateFileName();
	const fileName = ensureMdExtension(rawName);
	const filePath = resolveFilePath(fileName, ctx.cwd);

	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, text, "utf8");

	if (ctx.hasUI) {
		ctx.ui.notify(`Saved last response to ${filePath}`, "info");
	}
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("save-last", {
		description:
			"Save the last assistant response to a Markdown file in the current directory",
		handler: saveLastResponse,
	});

	pi.registerCommand("save-response", {
		description: "Alias for /save-last",
		handler: saveLastResponse,
	});
}
