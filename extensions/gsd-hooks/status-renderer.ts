/**
 * GSD status renderer.
 *
 * Detects whether the current workspace is a GSD project on session start and
 * sets the footer status accordingly.
 */
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { formatStatus, readGsdState } from "./status";

export function handleSessionStart(_event: any, ctx: ExtensionContext): boolean {
	const state = readGsdState(ctx.cwd);
	if (state) {
		ctx.ui.setStatus("gsd", formatStatus(state));
		return true;
	}
	return false;
}
