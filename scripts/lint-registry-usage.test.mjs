import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findMarkdownFiles, lintFile, runLint } from "./lint-registry-usage.mjs";

describe("lint-registry-usage", () => {
	let tempDir;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-registry-test-"));
		fs.mkdirSync(path.join(tempDir, "agents"), { recursive: true });
		fs.mkdirSync(path.join(tempDir, "skills"), { recursive: true });
		fs.mkdirSync(path.join(tempDir, "docs"), { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	function write(relPath, content) {
		const target = path.join(tempDir, relPath);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, content, "utf8");
		return target;
	}

	it("finds markdown files recursively", () => {
		write("agents/foo.md", "# foo");
		write("skills/bar/SKILL.md", "# bar");
		const files = findMarkdownFiles(path.join(tempDir, "agents"));
		expect(files.length).toBe(1);
		expect(path.basename(files[0])).toBe("foo.md");
	});

	it("flags direct write tool instruction for STATE.md", () => {
		const f = write("agents/bad-agent.md", "Use the `write` tool to update `.planning/STATE.md`.");
		const result = lintFile(f, tempDir);
		expect(result.findings.length).toBeGreaterThanOrEqual(1);
		expect(result.findings.some((x) => x.rule === "write-tool-registry-file")).toBe(true);
	});

	it("flags direct file edits fallback for BACKLOG.md", () => {
		const f = write(
			"skills/bad-skill/SKILL.md",
			"Use the gsd_backlog tool or direct file edits on `.planning/BACKLOG.md`.",
		);
		const result = lintFile(f, tempDir);
		expect(result.findings.some((x) => x.rule === "direct-file-edits-backlog")).toBe(true);
	});

	it("allows negative guidance", () => {
		const f = write(
			"agents/good-agent.md",
			"Do not use the `write` tool on `.planning/STATE.md`. Use gsd_state_update instead.",
		);
		const result = lintFile(f, tempDir);
		expect(result.findings.length).toBe(0);
	});

	it("allows reading STATE.md as position tracker", () => {
		const f = write("skills/good-skill/SKILL.md", "Read `.planning/STATE.md` first to know the current position.");
		const result = lintFile(f, tempDir);
		expect(result.findings.length).toBe(0);
	});

	it("returns empty when no violations exist", () => {
		write("agents/good.md", "Use gsd_state_update to mutate state.");
		write("skills/good/SKILL.md", "Use gsd_backlog to manage backlog items.");
		const results = runLint(tempDir);
		expect(results.length).toBe(0);
	});

	it("returns violations across agents and skills", () => {
		write("agents/bad.md", "Use the `write` tool to update `.planning/STATE.md`.");
		write("skills/bad/SKILL.md", "Direct file edits on `.planning/WORKSTREAMS.md` are fine.");
		write("docs/README.md", "# docs\n\nThis doc mentions `.planning/BACKLOG.md` for reading only.");
		const results = runLint(tempDir);
		expect(results.length).toBe(2);
		expect(results.some((r) => r.file.startsWith("agents/"))).toBe(true);
		expect(results.some((r) => r.file.startsWith("skills/"))).toBe(true);
	});
});
