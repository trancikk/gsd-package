/**
 * GSD Hooks for pi — thin registration file.
 *
 * Context monitoring, phase boundary reminders, commit validation, prompt guard,
 * read-injection scanner, and workflow guard are implemented in focused modules
 * under this directory. This file only wires them to the extension API.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { handleCommitValidation } from "./commit-guard";
import { handleTurnEnd, resetContextWarnings } from "./context-guard";
import { handlePromptAndWorkflowGuard, handleReadInjection } from "./injection-guard";
import { handlePhaseBoundary } from "./phase-boundary-guard";
import { handleSessionStart } from "./status-renderer";

let gsdActive = false;

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		gsdActive = handleSessionStart(_event, ctx);
	});

	pi.on("turn_end", async (_event, ctx) => {
		handleTurnEnd(_event, ctx, gsdActive);
	});

	pi.on("tool_result", (_event, ctx) => handlePhaseBoundary(_event, ctx, gsdActive));
	pi.on("tool_result", handleReadInjection);

	pi.on("tool_call", handlePromptAndWorkflowGuard);
	pi.on("tool_call", handleCommitValidation);
}

// Allow tests to reset module state.
export { resetContextWarnings };
