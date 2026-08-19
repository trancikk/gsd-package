/**
 * Context monitoring guard.
 *
 * Watches context usage on every turn and warns when remaining context falls
 * below configured thresholds. Also refreshes the GSD status display.
 */
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { formatStatus, readGsdState } from "./status";

const WARNING_THRESHOLD = 35; // remaining percentage
const CRITICAL_THRESHOLD = 25;

let lastContextWarning = "";

export function resetContextWarnings(): void {
	lastContextWarning = "";
}

export function handleTurnEnd(_event: any, ctx: ExtensionContext, gsdActive: boolean): void {
	const usage = ctx.getContextUsage();
	if (!usage || usage.percent == null) return;

	const used = usage.percent;
	const remaining = 100 - used;

	if (gsdActive) {
		const state = readGsdState(ctx.cwd);
		if (state) {
			ctx.ui.setStatus("gsd", formatStatus(state));
		}
	}

	if (remaining > WARNING_THRESHOLD) {
		lastContextWarning = "";
		return;
	}

	const isCritical = remaining <= CRITICAL_THRESHOLD;
	const prefix = isCritical ? "CONTEXT CRITICAL" : "CONTEXT WARNING";

	if (lastContextWarning === (isCritical ? "critical" : "warning")) return;
	lastContextWarning = isCritical ? "critical" : "warning";

	let message: string;
	if (isCritical) {
		message =
			`${prefix}: Usage at ${used}%. Remaining: ${remaining}%. ` +
			"Context is nearly exhausted. Do NOT start new complex work. " +
			"Inform the user so they can pause at the next natural stopping point.";
	} else {
		message =
			`${prefix}: Usage at ${used}%. Remaining: ${remaining}%. ` +
			"Context is getting limited. Avoid starting new complex work. " +
			"If not between defined plan steps, inform the user so they can prepare to pause.";
	}

	ctx.ui.notify(message, isCritical ? "error" : "warning");
}
