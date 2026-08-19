/**
 * Commit validation guard.
 *
 * Warns when a `git commit` command does not follow Conventional Commits.
 */
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export function handleCommitValidation(event: any, ctx: ExtensionContext): void {
	if (!isToolCallEventType("bash", event)) return;

	const cmd = event.input.command || "";
	if (!cmd.includes("git commit")) return;

	let msg = "";
	const doubleMatch = cmd.match(/-m\s+"([^"]+)"/);
	const singleMatch = cmd.match(/-m\s+'([^']+)'/);
	if (doubleMatch) msg = doubleMatch[1];
	else if (singleMatch) msg = singleMatch[1];

	if (!msg) return;

	const subject = msg.split("\n")[0];
	const conventionalPattern =
		/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:\s.+/;

	if (!conventionalPattern.test(subject)) {
		ctx.ui.notify(
			`Commit message must follow Conventional Commits: <type>(<scope>): <subject>\n` +
				`Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore\n` +
				`Subject must be <=72 chars, lowercase, imperative mood, no trailing period.`,
			"warning",
		);
	}
}
