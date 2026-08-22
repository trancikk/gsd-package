import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import registerGsdTools from "./index";
import { toForwardSlash } from "./utils";

interface ToolDef {
	name: string;
	execute: (
		_id: string,
		params: Record<string, unknown>,
		_signal: AbortSignal | undefined,
		_onUpdate: unknown,
		ctx: { cwd: string },
	) => Promise<AgentToolResult<unknown>>;
}

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-scaffold-test-"));
}

function mockPi() {
	const tools: ToolDef[] = [];
	return {
		registerTool(def: ToolDef) {
			tools.push(def);
		},
		async call(name: string, params: Record<string, unknown>, cwd: string) {
			const tool = tools.find((t) => t.name === name);
			if (!tool) throw new Error(`Tool not found: ${name}`);
			return tool.execute("test-id", params, undefined, undefined, { cwd });
		},
	};
}

describe("gsd_scaffold tool", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("creates the full scaffold and AGENTS.md", async () => {
		const pi = mockPi();
		registerGsdTools(pi as unknown as ExtensionAPI);

		const result = await pi.call("gsd_scaffold", { repoPath, projectName: "test-project" }, os.tmpdir());

		const typedResult = result as AgentToolResult<{ repoPath: string; created: string[] }>;
		expect(typedResult.details?.repoPath).toBe(toForwardSlash(repoPath));
		expect(typedResult.details?.created).toContain("AGENTS.md");
		expect(typedResult.details?.created).toContain(".planning/PROJECT.md");
		expect(typedResult.details?.created).toContain(".planning/STATE.md");
		expect(typedResult.content[0].text).toContain("Scaffold created");

		expect(fs.statSync(path.join(repoPath, "AGENTS.md")).isFile()).toBe(true);
		expect(fs.statSync(path.join(repoPath, ".planning", "PROJECT.md")).isFile()).toBe(true);
		expect(fs.statSync(path.join(repoPath, ".planning", "config.json")).isFile()).toBe(true);

		const agentsMd = fs.readFileSync(path.join(repoPath, "AGENTS.md"), "utf8");
		expect(agentsMd).toContain("<!-- GSD:project-start source:.planning/PROJECT.md -->");
		expect(agentsMd).toContain("/skill:init-project");
	});

	it("defaults projectName to the directory name", async () => {
		const pi = mockPi();
		registerGsdTools(pi as unknown as ExtensionAPI);

		const result = await pi.call("gsd_scaffold", { repoPath }, os.tmpdir());

		const typedResult = result as AgentToolResult<{ repoPath: string; created: string[] }>;
		expect(typedResult.details?.repoPath).toBe(toForwardSlash(repoPath));
		expect(typedResult.content[0].text).toContain("Scaffold created");
		expect(fs.statSync(path.join(repoPath, "AGENTS.md")).isFile()).toBe(true);
	});
});

describe("gsd_research_project tool", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("prepares a subagent call for gsd-phase-researcher", async () => {
		const pi = mockPi();
		registerGsdTools(pi as unknown as ExtensionAPI);

		const result = await pi.call("gsd_research_project", { repoPath, scope: "auth domain" }, os.tmpdir());

		const typedResult = result as AgentToolResult<{ repoPath: string; outputPath: string; call: string }>;
		expect(typedResult.details?.repoPath).toBe(toForwardSlash(repoPath));
		expect(typedResult.details?.outputPath).toContain(".planning/research/RESEARCH.md");
		expect(typedResult.details?.call).toContain("agent: 'gsd-phase-researcher'");
		expect(typedResult.details?.call).toContain("Research this new project's domain");
		expect(typedResult.content[0].text).toContain("Prepared GSD subagent call");
	});
});
