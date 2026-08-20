#!/usr/bin/env node
/**
 * Lint agent and skill definitions for direct registry-file mutation.
 *
 * Registry files (.planning/STATE.md, .planning/BACKLOG.md, .planning/WORKSTREAMS.md)
 * must be mutated only through the dedicated host-side GSD tools:
 *   - gsd_state_load / gsd_state_update / gsd_state_advance / gsd_state_progress
 *   - gsd_backlog
 *   - gsd_workstream
 *
 * Agent/skill markdowns must not instruct a subagent to write these files directly
 * or offer "direct file edits" as a fallback.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const REGISTRY_FILES = [".planning/STATE.md", ".planning/BACKLOG.md", ".planning/WORKSTREAMS.md"];

// Exposed for tests.
export function getRepoRoot() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	return path.resolve(__dirname, "..");
}

function negated(content, matchIndex, windowChars = 40) {
	const prefix = content.slice(Math.max(0, matchIndex - windowChars), matchIndex).toLowerCase();
	const negations = [
		"do not",
		"don't",
		"never",
		"must not",
		"mustn't",
		"do not use",
		"never use",
		"must not use",
		"not use",
		"prohibited",
	];
	return negations.some((n) => prefix.includes(n));
}

const VIOLATION_RULES = [
	{
		name: "write-tool-registry-file",
		description: "instructs use of the write tool on a registry file",
		regex: /(use|with|the)\s+[`']?write[`']?\s+tool[^.]{0,200}\.planning\/(STATE|BACKLOG|WORKSTREAMS)\.md/is,
	},
	{
		name: "write-registry-file",
		description: "instructs writing a registry file",
		regex: /write[^.]{0,80}\.planning\/(STATE|BACKLOG|WORKSTREAMS)\.md/is,
	},
	{
		name: "direct-file-edits-backlog",
		description: "allows direct file edits on backlog",
		regex: /direct file edits.{0,120}BACKLOG/is,
	},
	{
		name: "direct-file-edits-workstreams",
		description: "allows direct file edits on workstreams",
		regex: /direct file edits.{0,120}WORKSTREAMS/is,
	},
];

export function findMarkdownFiles(dir) {
	const files = [];
	if (!fs.existsSync(dir)) return files;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(path.join(entry.parentPath ?? dir, entry.name));
		}
	}
	return files;
}

export function lintFile(filePath, basePath = getRepoRoot()) {
	const relative = path.relative(basePath, filePath).replace(/\\/g, "/");
	const content = fs.readFileSync(filePath, "utf8");
	const findings = [];

	for (const rule of VIOLATION_RULES) {
		const match = rule.regex.exec(content);
		if (match && !negated(content, match.index)) {
			// Find line number of the violation for readable reporting.
			const upToMatch = content.slice(0, match.index);
			const line = upToMatch.split(/\r?\n/).length;
			findings.push({
				rule: rule.name,
				description: rule.description,
				line,
				snippet: match[0].replace(/\s+/g, " ").trim().slice(0, 160),
			});
		}
	}

	return { file: relative, findings };
}

export function runLint(repoRoot = getRepoRoot()) {
	const targets = [path.join(repoRoot, "agents"), path.join(repoRoot, "skills"), path.join(repoRoot, "docs")];

	const files = [];
	for (const dir of targets) {
		files.push(...findMarkdownFiles(dir));
	}

	const results = files.map((f) => lintFile(f, repoRoot)).filter((r) => r.findings.length > 0);
	return results;
}

function printAndExit(results) {
	if (results.length === 0) {
		console.log("✓ No registry-file direct-write violations found.");
		process.exit(0);
	}

	console.error("✗ Registry-file direct-write violations found:\n");
	for (const result of results) {
		console.error(`  ${result.file}`);
		for (const finding of result.findings) {
			console.error(`    line ${finding.line}: [${finding.rule}] ${finding.description}`);
			console.error(`      > ${finding.snippet}`);
		}
		console.error("");
	}
	console.error(
		"Fix these by routing registry mutations through gsd_state_update / gsd_state_advance / gsd_state_progress / gsd_backlog / gsd_workstream.",
	);
	process.exit(1);
}

export function main() {
	printAndExit(runLint());
}

// Only run the CLI when this module is executed directly.
const isMainModule = import.meta.url.startsWith("file:") && process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
	main();
}
