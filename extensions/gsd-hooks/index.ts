/**
 * GSD Hooks for pi — brings GSD Core's hook behavior to pi's extension system.
 *
 * Implements:
 * 1. Context monitoring — warns when context usage is high (rot prevention)
 * 2. Phase boundary detection — reminds to update STATE.md on .planning/ writes
 * 3. Commit validation — enforces Conventional Commits format
 * 4. Commit reminder — detects uncommitted changes after phase work and reminds to commit
 * 5. Status display — shows GSD state in pi's footer
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType, isBashToolResult } from "@earendil-works/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";

// ── Config ──────────────────────────────────────────────────────────────────

const WARNING_THRESHOLD = 35;  // remaining percentage
const CRITICAL_THRESHOLD = 25;

// ── State ───────────────────────────────────────────────────────────────────

let gsdActive = false;
let gsdState: GsdState | null = null;
let lastContextWarning = "";

interface GsdState {
  milestone: string;
  milestoneName: string;
  status: string;
  activePhase: string | null;
  nextAction: string | null;
  nextPhases: string[] | null;
  percent: number | null;
  phaseNum: string | null;
  phaseTotal: string | null;
  phaseName: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findGsdRoot(cwd: string): string | null {
  let current = cwd;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(current, ".planning", "STATE.md"))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function parseStateMd(content: string): GsdState {
  const state: GsdState = {
    milestone: "",
    milestoneName: "",
    status: "",
    activePhase: null,
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
      if (key === "active_phase") state.activePhase = v === "null" || v === "" ? null : v;
      if (key === "next_action") state.nextAction = v === "null" || v === "" ? null : v;
      if (key === "percent") state.percent = parseInt(v, 10);
    }
    const npFlowMatch = fm.match(/^next_phases:\s*\[([^\]]*)\]/m);
    if (npFlowMatch) {
      state.nextPhases = npFlowMatch[1].split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
  }

  const phaseMatch = content.match(/^Phase:\s*(\d+)\s+of\s+(\d+)(?:\s+\(([^)]+)\))?/m);
  if (phaseMatch) {
    state.phaseNum = phaseMatch[1];
    state.phaseTotal = phaseMatch[2];
    state.phaseName = phaseMatch[3] || null;
  }

  return state;
}

function readGsdState(cwd: string): GsdState | null {
  const root = findGsdRoot(cwd);
  if (!root) return null;
  try {
    const content = readFileSync(join(root, ".planning", "STATE.md"), "utf8");
    return parseStateMd(content);
  } catch {
    return null;
  }
}

function formatStatus(state: GsdState): string {
  const parts: string[] = [];
  if (state.milestone) parts.push(state.milestone);
  if (state.activePhase) {
    parts.push(`Phase ${state.activePhase} ${state.status}`);
  } else if (state.nextAction && state.nextPhases) {
    parts.push(`next ${state.nextAction} ${state.nextPhases.join("/")}`);
  } else if (state.status) {
    parts.push(state.status);
  }
  return parts.join(" · ");
}

function renderProgressBar(percent: number): string {
  const filled = Math.floor(percent / 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + `] ${percent}%`;
}

// ── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Session start: detect GSD project ──────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const state = readGsdState(ctx.cwd);
    if (state) {
      gsdActive = true;
      gsdState = state;
      ctx.ui.setStatus("gsd", formatStatus(state));
    }
  });

  // ── Context monitoring (rot prevention) ────────────────────────────────
  pi.on("turn_end", async (_event, ctx) => {
    const usage = ctx.getContextUsage();
    if (!usage || usage.percent == null) return;

    const used = usage.percent;
    const remaining = 100 - used;

    // Update GSD state display on every turn
    if (gsdActive) {
      const state = readGsdState(ctx.cwd);
      if (state) {
        gsdState = state;
        ctx.ui.setStatus("gsd", formatStatus(state));
      }
    }

    // Context warnings
    if (remaining > WARNING_THRESHOLD) {
      lastContextWarning = "";
      return;
    }

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const prefix = isCritical ? "CONTEXT CRITICAL" : "CONTEXT WARNING";

    // Only warn once per severity level to avoid spam
    if (lastContextWarning === (isCritical ? "critical" : "warning")) return;
    lastContextWarning = isCritical ? "critical" : "warning";

    let message: string;
    if (isCritical) {
      message = `${prefix}: Usage at ${used}%. Remaining: ${remaining}%. ` +
        "Context is nearly exhausted. Do NOT start new complex work. " +
        "Inform the user so they can pause at the next natural stopping point.";
    } else {
      message = `${prefix}: Usage at ${used}%. Remaining: ${remaining}%. ` +
        "Context is getting limited. Avoid starting new complex work. " +
        "If not between defined plan steps, inform the user so they can prepare to pause.";
    }

    ctx.ui.notify(message, isCritical ? "error" : "warning");
  });

  // ── Phase boundary: detect .planning/ file writes ──────────────────────
  pi.on("tool_result", async (event, ctx) => {
    if (!gsdActive) return;

    // Check if a .planning/ file was modified
    const toolName = event.toolName;
    let filePath: string | null = null;

    if (toolName === "write" || toolName === "edit") {
      const input = event.input as { path?: string; file_path?: string };
      filePath = input.path || input.file_path || null;
    }

    if (!filePath) return;
    const isPlanningFile = filePath.includes(".planning/") || filePath.startsWith(".planning/");

    if (isPlanningFile) {
      ctx.ui.notify(
        `.planning/ file modified: ${filePath}\nCheck: Should STATE.md be updated to reflect this change?`,
        "info"
      );

      // Commit reminder: check for uncommitted changes after phase work
      try {
        const root = findGsdRoot(ctx.cwd);
        if (root) {
          const status = execSync("git status --porcelain", { cwd: root, encoding: "utf8" });
          if (status.trim()) {
            const state = readGsdState(ctx.cwd);
            const isPhaseComplete = state?.status?.includes("Complete");
            const phaseContext = isPhaseComplete
              ? `Phase complete — commit to archive your work.`
              : `Uncommitted changes detected after .planning/ update.`;
            ctx.ui.notify(
              `${phaseContext}\nRun: git add -A && git commit -m "<type>(<scope>): <subject>"`,
              isPhaseComplete ? "warning" : "info"
            );
          }
        }
      } catch {
        // git not available or not a repo, skip commit reminder
      }
    }
  });

  // ── Commit validation: enforce Conventional Commits ─────────────────────
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;

    const cmd = event.input.command || "";
    if (!cmd.includes("git commit")) return;

    // Extract message from -m flag
    let msg = "";
    const doubleMatch = cmd.match(/-m\s+"([^"]+)"/);
    const singleMatch = cmd.match(/-m\s+'([^']+)'/);
    if (doubleMatch) msg = doubleMatch[1];
    else if (singleMatch) msg = singleMatch[1];

    if (!msg) return;  // No -m flag, let it pass (might use editor)

    const subject = msg.split("\n")[0];
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:\s.+/;

    if (!conventionalPattern.test(subject)) {
      ctx.ui.notify(
        `Commit message must follow Conventional Commits: <type>(<scope>): <subject>\n` +
        `Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore\n` +
        `Subject must be <=72 chars, lowercase, imperative mood, no trailing period.`,
        "warning"
      );
    }
  });
}
