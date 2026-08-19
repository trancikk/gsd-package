import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerBacklogTools } from "./backlog";

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-backlog-test-"));
}

function mockPi() {
	const tools: Array<{ name: string; execute: Function }> = [];
	return {
		registerTool(def: any) {
			tools.push({ name: def.name, execute: def.execute });
		},
		async call(name: string, params: any, repoPath: string) {
			const tool = tools.find((t) => t.name === name);
			if (!tool) throw new Error(`Tool not found: ${name}`);
			const result = await tool.execute("test-id", params, undefined as any, undefined as any, { cwd: repoPath });
			return JSON.parse((result as any).content[0].text);
		},
	};
}

describe("backlog tools", () => {
	let repoPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
		fs.mkdirSync(path.join(repoPath, ".planning"), { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("adds items and assigns sequential IDs", async () => {
		const pi = mockPi();
		registerBacklogTools(pi as any);
		const added = await pi.call(
			"gsd_backlog",
			{
				repoPath,
				operation: "add",
				title: "Refactor auth middleware",
				type: "tech-debt",
				priority: "p1",
				description: "Current middleware is hard to test.",
			},
			repoPath,
		);
		expect(added.item.id).toBe("B-001");
		expect(added.item.title).toBe("Refactor auth middleware");
		expect(added.item.status).toBe("open");

		const added2 = await pi.call(
			"gsd_backlog",
			{ repoPath, operation: "add", title: "Add OAuth provider", type: "idea" },
			repoPath,
		);
		expect(added2.item.id).toBe("B-002");
	});

	it("lists and filters items", async () => {
		const pi = mockPi();
		registerBacklogTools(pi as any);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "A", type: "tech-debt" }, repoPath);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "B", type: "idea" }, repoPath);

		const listed = await pi.call("gsd_backlog", { repoPath, operation: "list" }, repoPath);
		expect(listed.count).toBe(2);

		const filtered = await pi.call("gsd_backlog", { repoPath, operation: "list", type: "idea" }, repoPath);
		expect(filtered.count).toBe(1);
		expect(filtered.items[0].title).toBe("B");
	});

	it("promotes an item to a phase", async () => {
		const pi = mockPi();
		registerBacklogTools(pi as any);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "A" }, repoPath);
		const promoted = await pi.call(
			"gsd_backlog",
			{ repoPath, operation: "promote", id: "B-001", linkedPhase: "03" },
			repoPath,
		);
		expect(promoted.item.status).toBe("in-progress");
		expect(promoted.item.linkedPhase).toBe("03");
	});

	it("updates and closes items", async () => {
		const pi = mockPi();
		registerBacklogTools(pi as any);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "A" }, repoPath);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "B" }, repoPath);
		await pi.call("gsd_backlog", { repoPath, operation: "promote", id: "B-001", linkedPhase: "03" }, repoPath);

		const updated = await pi.call(
			"gsd_backlog",
			{ repoPath, operation: "update", id: "B-002", priority: "p0" },
			repoPath,
		);
		expect(updated.item.priority).toBe("p0");

		const closed = await pi.call("gsd_backlog", { repoPath, operation: "close", id: "B-002" }, repoPath);
		expect(closed.item.status).toBe("closed");

		const openItems = await pi.call("gsd_backlog", { repoPath, operation: "list", status: "open" }, repoPath);
		expect(openItems.count).toBe(0);
	});

	it("writes items to correct sections", async () => {
		const pi = mockPi();
		registerBacklogTools(pi as any);
		await pi.call("gsd_backlog", { repoPath, operation: "add", title: "A" }, repoPath);
		await pi.call("gsd_backlog", { repoPath, operation: "promote", id: "B-001", linkedPhase: "03" }, repoPath);

		const bp = path.join(repoPath, ".planning/BACKLOG.md");
		const fileContent = fs.readFileSync(bp, "utf8");
		expect(fileContent).toContain("## In Progress");
		expect(fileContent).toContain("B-001");

		const openIdx = fileContent.indexOf("## Open");
		const inProgressIdx = fileContent.indexOf("## In Progress");
		const blockedIdx = fileContent.indexOf("## Blocked");
		const b001Idx = fileContent.indexOf("### B-001:");
		expect(b001Idx).toBeGreaterThan(inProgressIdx);
		expect(b001Idx).toBeLessThan(blockedIdx);
	});
});
