import * as fs from "node:fs";
import * as path from "node:path";
import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { resolveAbsolutePath, writeAtomic } from "./utils";
import { parseFrontmatter, stringifyFrontmatter } from "./yaml";

const STATES = ["pending", "in_progress", "blocked", "completed", "failed", "skipped"] as const;
type State = (typeof STATES)[number];

const SECTION_TITLES: Record<State, string> = {
	pending: "Pending",
	in_progress: "In Progress",
	blocked: "Blocked",
	completed: "Completed",
	failed: "Failed",
	skipped: "Skipped",
};

export interface TodoTask {
	taskId: string;
	title: string;
	state: State;
	started?: string;
	completed?: string;
	reason?: string;
	dependsOn?: string[];
}

interface TodoFrontmatter {
	plan: string;
	phase: string;
	status: string;
	created: string;
	updated: string;
	completed_tasks: number;
	total_tasks: number;
}

function isState(value: string): value is State {
	return (STATES as readonly string[]).includes(value);
}

function sectionNameToState(section: string): State | undefined {
	for (const state of STATES) {
		if (SECTION_TITLES[state] === section) return state;
	}
	return undefined;
}

function defaultFrontmatter(plan: string, phase: string): TodoFrontmatter {
	const now = new Date().toISOString();
	return {
		plan,
		phase,
		status: "pending",
		created: now,
		updated: now,
		completed_tasks: 0,
		total_tasks: 0,
	};
}

function todosPathFromPlan(planPath: string): string {
	const parsed = path.parse(planPath);
	return path.join(parsed.dir, `${parsed.name.replace(/-PLAN$/, "")}-TODOS.md`);
}

function ensureDir(filePath: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadTodos(todosPath: string): { frontmatter: TodoFrontmatter; body: string; tasks: TodoTask[] } {
	if (!fs.existsSync(todosPath)) {
		throw new Error(`TODOS.md not found: ${todosPath}`);
	}
	const content = fs.readFileSync(todosPath, "utf8");
	const { frontmatter, body } = parseFrontmatter(content);
	return {
		frontmatter: frontmatter as TodoFrontmatter,
		body,
		tasks: parseTodos(body),
	};
}

function saveTodos(todosPath: string, frontmatter: TodoFrontmatter, tasks: TodoTask[]): void {
	const total = tasks.length;
	const completed = tasks.filter((t) => t.state === "completed").length;
	frontmatter.total_tasks = total;
	frontmatter.completed_tasks = completed;
	frontmatter.updated = new Date().toISOString();
	if (completed === total && total > 0) {
		frontmatter.status = "completed";
	} else if (completed > 0 || tasks.some((t) => t.state === "in_progress")) {
		frontmatter.status = "in_progress";
	} else if (tasks.some((t) => t.state === "blocked" || t.state === "failed")) {
		frontmatter.status = "in_progress";
	} else {
		frontmatter.status = "pending";
	}
	const body = renderTodos(tasks);
	writeAtomic(todosPath, stringifyFrontmatter(frontmatter) + body);
}

function parseTodos(body: string): TodoTask[] {
	const tasks: TodoTask[] = [];
	const sectionMatches = body.matchAll(
		/## (Pending|In Progress|Blocked|Completed|Failed|Skipped)\b([\s\S]*?)(?=\n## |\n# |$)/g,
	);

	for (const sectionMatch of sectionMatches) {
		const state = sectionNameToState(sectionMatch[1]);
		if (!state) continue;
		const sectionBody = sectionMatch[2];
		if (!sectionBody) continue;

		const taskMatches = sectionBody.matchAll(
			/### (task-\d+|\d+):\s*(.*?)\n([\s\S]*?)(?=\n### (?:task-\d+|\d+):|\n## |$)/g,
		);

		for (const taskMatch of taskMatches) {
			const taskId = taskMatch[1];
			const title = taskMatch[2].trim();
			const taskBody = taskMatch[3];

			tasks.push({
				taskId,
				title,
				state,
				started: extractField(taskBody, "Started"),
				completed: extractField(taskBody, "Completed"),
				reason: extractField(taskBody, "Reason"),
				dependsOn: extractArrayField(taskBody, "Depends on"),
			});
		}
	}

	return tasks;
}

function extractField(body: string, fieldName: string): string | undefined {
	const re = new RegExp(`^- \\*\\*${fieldName}:\\*\\*\\s*(.+?)\\s*$`, "im");
	const match = body.match(re);
	if (!match) return undefined;
	const value = match[1].trim();
	return value === "—" || value === "" ? undefined : value;
}

function extractArrayField(body: string, fieldName: string): string[] | undefined {
	const value = extractField(body, fieldName);
	if (!value) return undefined;
	return value
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0 && s !== "—");
}

function renderTask(task: TodoTask): string {
	const started = task.started || "—";
	const completed = task.completed || "—";
	const reason = task.reason || "—";
	const dependsOn = task.dependsOn && task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "—";
	return `### ${task.taskId}: ${task.title}
- **State:** ${task.state}
- **Started:** ${started}
- **Completed:** ${completed}
- **Reason:** ${reason}
- **Depends on:** ${dependsOn}
`;
}

function renderTodos(tasks: TodoTask[]): string {
	const byState: Record<State, TodoTask[]> = {
		pending: [],
		in_progress: [],
		blocked: [],
		completed: [],
		failed: [],
		skipped: [],
	};
	for (const task of tasks) {
		byState[task.state].push(task);
	}

	let out = `# Todo List

Execution state for the linked plan. Tasks are moved between sections by the \`gsd_todo\` tool only.

`;
	for (const state of STATES) {
		out += `## ${SECTION_TITLES[state]}\n\n`;
		const sectionTasks = byState[state];
		if (sectionTasks.length === 0) {
			out += `*(No ${state.replace("_", " ")} tasks.)*\n\n`;
		} else {
			for (const task of sectionTasks) {
				out += renderTask(task);
				out += "\n";
			}
		}
	}
	return `${out.trimEnd()}\n`;
}

function extractPlanTasks(planPath: string): Array<{ taskId: string; title: string }> {
	if (!fs.existsSync(planPath)) {
		throw new Error(`PLAN.md not found: ${planPath}`);
	}
	const content = fs.readFileSync(planPath, "utf8");
	const tasks: Array<{ taskId: string; title: string }> = [];

	const taskMatches = content.matchAll(/^### Task (\d+):\s*(.*?)\s*$/gm);
	for (const match of taskMatches) {
		tasks.push({
			taskId: `task-${match[1]}`,
			title: match[2].trim(),
		});
	}

	return tasks;
}

function validTransitions(from: State): State[] {
	switch (from) {
		case "pending":
			return ["in_progress"];
		case "in_progress":
			return ["completed", "blocked", "failed", "skipped"];
		case "blocked":
			return ["in_progress", "failed", "skipped"];
		case "completed":
		case "failed":
		case "skipped":
			return [];
	}
}

function isTerminal(state: State): boolean {
	return state === "completed" || state === "failed" || state === "skipped";
}

function buildToolResultText<T>(payload: T): AgentToolResult<T> {
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

export function registerTodoTools(pi: ExtensionAPI) {
	pi.registerTool({
		name: "gsd_todo",
		label: "GSD Todo",
		description:
			"Manage a per-plan TODOS.md file with FSM-tracked task states. Initialize from a PLAN.md, list, transition, or update tasks.",
		parameters: Type.Object({
			repoPath: Type.String({
				description: "Path to the repo (absolute or relative to session cwd)",
			}),
			planPath: Type.String({
				description: "Path to the PLAN.md file (absolute or relative to session cwd)",
			}),
			operation: Type.Union(
				[
					Type.Literal("init", { description: "Create TODOS.md from PLAN.md" }),
					Type.Literal("list", { description: "List tasks, optionally filtered by state" }),
					Type.Literal("transition", { description: "Move a task to a new state" }),
					Type.Literal("update", { description: "Update task title, reason, or dependencies" }),
				],
				{ description: "Operation to perform" },
			),
			taskId: Type.Optional(Type.String({ description: "Task ID, e.g. task-1 (for transition/update)" })),
			from: Type.Optional(Type.String({ description: "Expected current state (for transition)" })),
			to: Type.Optional(Type.String({ description: "Target state (for transition)" })),
			state: Type.Optional(Type.String({ description: "Filter by state (for list)" })),
			title: Type.Optional(Type.String({ description: "New title (for update)" })),
			reason: Type.Optional(Type.String({ description: "Reason or note (for transition/update)" })),
			dependsOn: Type.Optional(
				Type.Array(Type.String(), { description: "Task IDs this task depends on (for update)" }),
			),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx): Promise<AgentToolResult<unknown>> {
			const planPath = resolveAbsolutePath(params.planPath, ctx.cwd);
			const todosPath = todosPathFromPlan(planPath);

			if (params.operation === "init") {
				ensureDir(todosPath);
				const planTasks = extractPlanTasks(planPath);
				let phase = "";
				let plan = path.basename(planPath, ".md");
				if (fs.existsSync(planPath)) {
					const { frontmatter } = parseFrontmatter(fs.readFileSync(planPath, "utf8"));
					if (frontmatter.phase) phase = String(frontmatter.phase);
					if (frontmatter.plan)
						plan = `${String(frontmatter.phase).padStart(2, "0")}-${String(frontmatter.plan).padStart(2, "0")}`;
				}
				const tasks: TodoTask[] = planTasks.map((t) => ({
					taskId: t.taskId,
					title: t.title,
					state: "pending",
				}));
				saveTodos(todosPath, defaultFrontmatter(plan, phase), tasks);
				return buildToolResultText({
					ok: true,
					path: todosPath,
					operation: "init",
					count: tasks.length,
					tasks,
				});
			}

			const { frontmatter, tasks } = loadTodos(todosPath);

			if (params.operation === "list") {
				let filtered = tasks;
				if (params.state) {
					if (!isState(params.state)) {
						return buildToolResultText({ ok: false, error: `Invalid state: ${params.state}` });
					}
					filtered = filtered.filter((t) => t.state === params.state);
				}
				return buildToolResultText({
					ok: true,
					path: todosPath,
					count: filtered.length,
					tasks: filtered,
				});
			}

			if (params.operation === "transition" || params.operation === "update") {
				if (!params.taskId) {
					return buildToolResultText({ ok: false, error: "taskId is required" });
				}
				const task = tasks.find((t) => t.taskId === params.taskId);
				if (!task) {
					return buildToolResultText({ ok: false, error: `Task not found: ${params.taskId}` });
				}

				if (params.operation === "transition") {
					if (!params.from) {
						return buildToolResultText({ ok: false, error: "from is required for transition" });
					}
					if (!params.to) {
						return buildToolResultText({ ok: false, error: "to is required for transition" });
					}
					if (!isState(params.to)) {
						return buildToolResultText({ ok: false, error: `Invalid target state: ${params.to}` });
					}
					if (isTerminal(task.state)) {
						return buildToolResultText({
							ok: false,
							error: `Cannot transition from terminal state ${task.state}`,
						});
					}
					if (params.from !== task.state) {
						return buildToolResultText({
							ok: false,
							error: `Stale from state: expected ${task.state}, got ${params.from}`,
						});
					}
					const allowed = validTransitions(task.state);
					if (!allowed.includes(params.to)) {
						return buildToolResultText({
							ok: false,
							error: `Invalid transition: ${task.state} → ${params.to}`,
						});
					}

					task.state = params.to;
					if (params.to === "in_progress") {
						task.started = new Date().toISOString();
					}
					if (params.to === "completed") {
						task.completed = new Date().toISOString();
					}
					if (params.reason) {
						task.reason = params.reason;
					}
				} else {
					// update
					if (params.title !== undefined) task.title = params.title;
					if (params.reason !== undefined) task.reason = params.reason;
					if (params.dependsOn !== undefined) task.dependsOn = params.dependsOn;
				}

				saveTodos(todosPath, frontmatter, tasks);
				return buildToolResultText({
					ok: true,
					path: todosPath,
					operation: params.operation,
					task,
				});
			}

			return buildToolResultText({ ok: false, error: `Unknown operation: ${params.operation}` });
		},
	});
}
