import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerTodoTools } from "./todo";

function createTempRepo(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gsd-todo-test-"));
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

const samplePlan = `---
phase: "04"
plan: "01"
wave: 1
depends_on: []
requirements:
  - REQ-11
must_haves:
  truths:
    - "Every PLAN.md can produce a matching TODOS.md with one entry per task."
  artifacts:
    - "extensions/gsd-commands/todo.ts"
  key_links:
    - "gsd_todo init reads PLAN.md and writes TODOS.md"
---

# Plan 04-01: Agent Todo FSM

## Objective
Implement a per-plan todo-list FSM.

## Tasks

### Task 1: Implement gsd_todo tool
- **Type:** auto
- **Action:** Create the tool.
- **Verify:** npm run typecheck
- **Acceptance criteria:**
  - init works

### Task 2: Add tests
- **Type:** auto
- **Action:** Cover operations.
- **Verify:** npm test
- **Acceptance criteria:**
  - all operations tested

### Task 3: Update executor
- **Type:** auto
- **Action:** Mention gsd_todo.
- **Verify:** Read agent definition
- **Acceptance criteria:**
  - mentions gsd_todo
`;

describe("todo tools", () => {
	let repoPath: string;
	let planPath: string;
	let todosPath: string;

	beforeEach(() => {
		repoPath = createTempRepo();
		fs.mkdirSync(path.join(repoPath, ".planning", "phases", "04-agent-todo-fsm"), { recursive: true });
		planPath = path.join(repoPath, ".planning", "phases", "04-agent-todo-fsm", "04-01-PLAN.md");
		todosPath = path.join(repoPath, ".planning", "phases", "04-agent-todo-fsm", "04-01-TODOS.md");
		fs.writeFileSync(planPath, samplePlan, "utf8");
	});

	afterEach(() => {
		fs.rmSync(repoPath, { recursive: true, force: true });
	});

	it("init creates TODOS.md from PLAN.md", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		const result = await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		expect(result.ok).toBe(true);
		expect(result.count).toBe(3);
		expect(fs.existsSync(todosPath)).toBe(true);
		const content = fs.readFileSync(todosPath, "utf8");
		expect(content).toContain("## Pending");
		expect(content).toContain("### task-1: Implement gsd_todo tool");
		expect(content).toContain("### task-2: Add tests");
		expect(content).toContain("### task-3: Update executor");
	});

	it("list returns all tasks and filters by state", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);

		const all = await pi.call("gsd_todo", { repoPath, planPath, operation: "list" }, repoPath);
		expect(all.count).toBe(3);

		const pending = await pi.call("gsd_todo", { repoPath, planPath, operation: "list", state: "pending" }, repoPath);
		expect(pending.count).toBe(3);

		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);

		const inProgress = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "list", state: "in_progress" },
			repoPath,
		);
		expect(inProgress.count).toBe(1);
		expect(inProgress.tasks[0].taskId).toBe("task-1");
	});

	it("transitions pending to in_progress", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		const result = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "pending", to: "in_progress" },
			repoPath,
		);
		expect(result.ok).toBe(true);
		expect(result.task.state).toBe("in_progress");
		expect(result.task.started).toBeDefined();
	});

	it("transitions in_progress to completed", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);
		const result = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "in_progress", to: "completed" },
			repoPath,
		);
		expect(result.ok).toBe(true);
		expect(result.task.state).toBe("completed");
		expect(result.task.completed).toBeDefined();
	});

	it("transitions in_progress to blocked and back", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);
		const blocked = await pi.call(
			"gsd_todo",
			{
				repoPath,
				planPath,
				operation: "transition",
				taskId: "task-1",
				from: "in_progress",
				to: "blocked",
				reason: "waiting for API key",
			},
			repoPath,
		);
		expect(blocked.ok).toBe(true);
		expect(blocked.task.state).toBe("blocked");
		expect(blocked.task.reason).toBe("waiting for API key");

		const back = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "blocked", to: "in_progress" },
			repoPath,
		);
		expect(back.ok).toBe(true);
		expect(back.task.state).toBe("in_progress");
	});

	it("transitions blocked to failed", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "blocked" },
			repoPath,
		);
		const result = await pi.call(
			"gsd_todo",
			{
				repoPath,
				planPath,
				operation: "transition",
				taskId: "task-1",
				from: "blocked",
				to: "failed",
				reason: "unrecoverable",
			},
			repoPath,
		);
		expect(result.ok).toBe(true);
		expect(result.task.state).toBe("failed");
	});

	it("rejects invalid transitions", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		const result = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "pending", to: "completed" },
			repoPath,
		);
		expect(result.ok).toBe(false);
		expect(result.error).toContain("Invalid transition");
	});

	it("rejects stale from state", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		const result = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "in_progress", to: "completed" },
			repoPath,
		);
		expect(result.ok).toBe(false);
		expect(result.error).toContain("Stale from state");
	});

	it("rejects transitions from terminal states", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "completed" },
			repoPath,
		);
		const result = await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", from: "completed", to: "in_progress" },
			repoPath,
		);
		expect(result.ok).toBe(false);
		expect(result.error).toContain("terminal state");
	});

	it("update changes reason without changing state", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		const result = await pi.call(
			"gsd_todo",
			{
				repoPath,
				planPath,
				operation: "update",
				taskId: "task-1",
				reason: "clarified scope",
			},
			repoPath,
		);
		expect(result.ok).toBe(true);
		expect(result.task.state).toBe("pending");
		expect(result.task.reason).toBe("clarified scope");
	});

	it("update changes dependencies", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		const result = await pi.call(
			"gsd_todo",
			{
				repoPath,
				planPath,
				operation: "update",
				taskId: "task-2",
				dependsOn: ["task-1"],
			},
			repoPath,
		);
		expect(result.ok).toBe(true);
		expect(result.task.dependsOn).toEqual(["task-1"]);
	});

	it("persists completed count in frontmatter", async () => {
		const pi = mockPi();
		registerTodoTools(pi as any);
		await pi.call("gsd_todo", { repoPath, planPath, operation: "init" }, repoPath);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "in_progress" },
			repoPath,
		);
		await pi.call(
			"gsd_todo",
			{ repoPath, planPath, operation: "transition", taskId: "task-1", to: "completed" },
			repoPath,
		);
		const content = fs.readFileSync(todosPath, "utf8");
		expect(content).toContain("completed_tasks: 1");
		expect(content).toContain("total_tasks: 3");
	});
});
