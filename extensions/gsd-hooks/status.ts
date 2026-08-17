import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export interface GsdState {
	milestone: string;
	milestoneName: string;
	status: string;
	activePhase: string | null;
	currentPhaseName: string | null;
	currentPlan: string | null;
	activeWorkstream: string | null;
	nextAction: string | null;
	nextPhases: string[] | null;
	percent: number | null;
	phaseNum: string | null;
	phaseTotal: string | null;
	phaseName: string | null;
}

export function findGsdRoot(cwd: string): string | null {
	let current = cwd;
	for (let i = 0; i < 10; i++) {
		if (existsSync(join(current, ".planning", "STATE.md"))) return current;
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

export function parseStateMd(content: string): GsdState {
	const state: GsdState = {
		milestone: "",
		milestoneName: "",
		status: "",
		activePhase: null,
		currentPhaseName: null,
		currentPlan: null,
		activeWorkstream: null,
		nextAction: null,
		nextPhases: null,
		percent: null,
		phaseNum: null,
		phaseTotal: null,
		phaseName: null,
	};

	const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (fmMatch) {
		const fm = fmMatch[1];
		for (const line of fm.split(/\r?\n/)) {
			const m = line.match(/^(\w+):\s*(.+)/);
			if (!m) continue;
			const [, key, val] = m;
			const v = val.trim().replace(/^["']|["']$/g, "");
			if (key === "milestone") state.milestone = v;
			if (key === "milestone_name") state.milestoneName = v;
			if (key === "status") state.status = v === "null" ? "" : v;
			if (key === "active_phase")
				state.activePhase = v === "null" || v === "" ? null : v;
			if (key === "current_phase_name")
				state.currentPhaseName = v === "null" || v === "" ? null : v;
			if (key === "current_plan")
				state.currentPlan = v === "null" || v === "" ? null : v;
			if (key === "active_workstream")
				state.activeWorkstream = v === "null" || v === "" ? null : v;
			if (key === "next_action")
				state.nextAction = v === "null" || v === "" ? null : v;
			if (key === "percent") state.percent = parseInt(v, 10);
		}
		const progressMatch = fm.match(/^progress:\s*[\s\S]*?percent:\s*(\d+)/m);
		if (progressMatch) {
			state.percent = parseInt(progressMatch[1], 10);
		}
		const npFlowMatch = fm.match(/^next_phases:\s*\[([^\]]*)\]/m);
		if (npFlowMatch) {
			state.nextPhases = npFlowMatch[1]
				.split(",")
				.map((s) => s.trim().replace(/^["']|["']$/g, ""))
				.filter(Boolean);
		}
	}

	const phaseMatch = content.match(
		/^Phase:\s*(\d+)\s+of\s+(\d+)(?:\s+\(([^)]+)\))?/m,
	);
	if (phaseMatch) {
		state.phaseNum = phaseMatch[1];
		state.phaseTotal = phaseMatch[2];
		state.phaseName = phaseMatch[3] || null;
	}

	return state;
}

export function formatStatus(state: GsdState): string {
	const parts: string[] = [];
	if (state.milestone) parts.push(state.milestone);

	if (state.activePhase) {
		let phaseLabel = `Phase ${state.activePhase}`;
		if (state.currentPhaseName && state.currentPhaseName !== "null") {
			phaseLabel += ` — ${state.currentPhaseName}`;
		}
		if (state.status) {
			phaseLabel += ` · ${state.status}`;
		}
		parts.push(phaseLabel);
	} else if (state.nextAction && state.nextPhases) {
		parts.push(`next ${state.nextAction} ${state.nextPhases.join("/")}`);
	} else if (state.status) {
		parts.push(state.status);
	}

	if (state.currentPlan) {
		parts.push(`Plan ${state.currentPlan}`);
	}

	if (state.activeWorkstream) {
		parts.push(state.activeWorkstream);
	}

	if (state.percent != null && !Number.isNaN(state.percent)) {
		parts.push(`${state.percent}%`);
	}

	return parts.join(" · ");
}
