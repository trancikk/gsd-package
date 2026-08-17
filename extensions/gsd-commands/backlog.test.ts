/**
 * Manual test for gsd_backlog tool.
 *
 * Run with:
 *   npx tsx extensions/gsd-commands/backlog.test.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { registerBacklogTools } from "./backlog";

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

function assertEqual(actual: any, expected: any, msg: string) {
	const a = JSON.stringify(actual);
	const e = JSON.stringify(expected);
	if (a !== e) {
		console.error(`FAIL: ${msg}`);
		console.error(`  expected: ${e}`);
		console.error(`  actual:   ${a}`);
		process.exit(1);
	}
	console.log(`PASS: ${msg}`);
}

async function withTempRepo(cb: (repoPath: string) => Promise<void>) {
	const tmp = path.join(process.cwd(), `.tmp-backlog-test-${Date.now()}`);
	fs.mkdirSync(path.join(tmp, ".planning"), { recursive: true });
	try {
		await cb(tmp);
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

(async () => {
	await withTempRepo(async (repoPath) => {
		const pi = mockPi();
		registerBacklogTools(pi);

		// add
		const added = await pi.call("gsd_backlog", { repoPath, operation: "add", title: "Refactor auth middleware", type: "tech-debt", priority: "p1", description: "Current middleware is hard to test." }, repoPath);
		assertEqual(added.item.id, "B-001", "add assigns B-001");
		assertEqual(added.item.title, "Refactor auth middleware", "add title");
		assertEqual(added.item.status, "open", "add status open");

		// add second
		const added2 = await pi.call("gsd_backlog", { repoPath, operation: "add", title: "Add OAuth provider", type: "idea" }, repoPath);
		assertEqual(added2.item.id, "B-002", "add assigns B-002");

		// list
		const listed = await pi.call("gsd_backlog", { repoPath, operation: "list" }, repoPath);
		assertEqual(listed.count, 2, "list returns 2 items");
		assertEqual(listed.items[0].id, "B-001", "list first item");

		// list with filter
		const filtered = await pi.call("gsd_backlog", { repoPath, operation: "list", type: "idea" }, repoPath);
		assertEqual(filtered.count, 1, "list filter by type");
		assertEqual(filtered.items[0].id, "B-002", "list filtered item");

		// promote
		const promoted = await pi.call("gsd_backlog", { repoPath, operation: "promote", id: "B-001", linkedPhase: "03" }, repoPath);
		assertEqual(promoted.item.status, "in-progress", "promote status");
		assertEqual(promoted.item.linkedPhase, "03", "promote linked phase");

		// update
		const updated = await pi.call("gsd_backlog", { repoPath, operation: "update", id: "B-002", priority: "p0" }, repoPath);
		assertEqual(updated.item.priority, "p0", "update priority");

		// close
		const closed = await pi.call("gsd_backlog", { repoPath, operation: "close", id: "B-002" }, repoPath);
		assertEqual(closed.item.status, "closed", "close status");

		// list open
		const openItems = await pi.call("gsd_backlog", { repoPath, operation: "list", status: "open" }, repoPath);
		assertEqual(openItems.count, 0, "no open items after promote/close");

		// verify file exists and contains promoted item
		const bp = path.join(repoPath, ".planning/BACKLOG.md");
		const fileContent = fs.readFileSync(bp, "utf8");
		assertEqual(fileContent.includes("## In Progress"), true, "file has In Progress section");
		assertEqual(fileContent.includes("B-001"), true, "file contains B-001");
		assertEqual(fileContent.includes("B-002"), true, "file contains B-002");
		// Ensure items are in correct sections and not duplicated across sections
		const openIdx = fileContent.indexOf("## Open");
		const inProgressIdx = fileContent.indexOf("## In Progress");
		const blockedIdx = fileContent.indexOf("## Blocked");
		const closedIdx = fileContent.indexOf("## Closed");
		const b001Idx = fileContent.indexOf("### B-001:");
		const b002Idx = fileContent.indexOf("### B-002:");
		assertEqual(b001Idx > openIdx && b001Idx < inProgressIdx, false, "B-001 not in Open section");
		assertEqual(b001Idx > inProgressIdx && b001Idx < blockedIdx, true, "B-001 in In Progress section");
		assertEqual(b002Idx > closedIdx, true, "B-002 in Closed section");

		console.log("\nAll backlog tests passed.");
	});
})();
