/**
 * Shared .planning/ registry module.
 *
 * Centralizes artifact path resolution, frontmatter parsing, atomic writes,
 * partial frontmatter updates, and phase directory listing for GSD tools.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { resolveAbsolutePath, writeAtomic } from "./utils";
import { parseFrontmatter, stringifyFrontmatter } from "./yaml";

export type ArtifactName =
	| "state"
	| "backlog"
	| "workstreams"
	| "project"
	| "roadmap"
	| "requirements"
	| "conventions"
	| "config";

export interface LoadedArtifact {
	path: string;
	frontmatter: Record<string, any>;
	body: string;
}

export interface PhaseMetadata {
	num: string;
	slug: string;
	dir: string;
	path: string;
	plans: number;
	summaries: number;
	hasVerification: boolean;
}

const ARTIFACT_FILENAMES: Record<ArtifactName, string> = {
	state: ".planning/STATE.md",
	backlog: ".planning/BACKLOG.md",
	workstreams: ".planning/WORKSTREAMS.md",
	project: ".planning/PROJECT.md",
	roadmap: ".planning/ROADMAP.md",
	requirements: ".planning/REQUIREMENTS.md",
	conventions: ".planning/CONVENTIONS.md",
	config: ".planning/config.json",
};

function isFrontmatterArtifact(artifact: ArtifactName): boolean {
	return artifact !== "backlog" && artifact !== "workstreams" && artifact !== "config";
}

export function artifactPath(artifact: ArtifactName, repoPath: string): string {
	return path.join(repoPath, ARTIFACT_FILENAMES[artifact]);
}

function hasFrontmatter(content: string): boolean {
	return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(content);
}

export function load(artifact: ArtifactName, repoPath: string): LoadedArtifact {
	const p = artifactPath(artifact, repoPath);
	if (!fs.existsSync(p)) {
		throw new Error(`Artifact not found: ${p}`);
	}
	const content = fs.readFileSync(p, "utf8");
	if (isFrontmatterArtifact(artifact) && hasFrontmatter(content)) {
		const { frontmatter, body } = parseFrontmatter(content);
		return { path: p, frontmatter, body };
	}
	return { path: p, frontmatter: {}, body: content };
}

export function loadOptional(artifact: ArtifactName, repoPath: string): LoadedArtifact | undefined {
	try {
		return load(artifact, repoPath);
	} catch (err: any) {
		if (err.message?.startsWith("Artifact not found:")) return undefined;
		throw err;
	}
}

export interface ArtifactData {
	frontmatter?: Record<string, any>;
	body?: string;
}

export function save(artifact: ArtifactName, repoPath: string, data: ArtifactData): void {
	const p = artifactPath(artifact, repoPath);
	let content: string;
	if (isFrontmatterArtifact(artifact)) {
		const frontmatter = data.frontmatter ?? {};
		const body = data.body ?? "\n";
		content = stringifyFrontmatter(frontmatter) + body;
	} else {
		content = data.body ?? "";
	}
	writeAtomic(p, content);
}

function getByPath(obj: Record<string, any>, pathStr: string): any {
	return pathStr.split(".").reduce((o, key) => (o == null ? undefined : o[key]), obj);
}

function setByPath(obj: Record<string, any>, pathStr: string, value: any): void {
	const keys = pathStr.split(".");
	const last = keys.pop()!;
	let target: Record<string, any> = obj;
	for (const key of keys) {
		if (target[key] == null || typeof target[key] !== "object" || Array.isArray(target[key])) {
			target[key] = {};
		}
		target = target[key];
	}
	target[last] = value;
}

export function updateField(
	artifact: ArtifactName,
	repoPath: string,
	field: string,
	value: any,
): { previous: any; current: any; path: string } {
	if (!isFrontmatterArtifact(artifact)) {
		throw new Error(`Artifact ${artifact} does not support frontmatter field updates`);
	}
	const { frontmatter, body, path: p } = load(artifact, repoPath);
	const previous = getByPath(frontmatter, field);
	setByPath(frontmatter, field, value);
	save(artifact, repoPath, { frontmatter, body });
	return { previous, current: value, path: p };
}

export function listPhases(repoPath: string): PhaseMetadata[] {
	const phasesDir = path.join(repoPath, ".planning/phases");
	if (!fs.existsSync(phasesDir)) return [];

	return fs
		.readdirSync(phasesDir, { withFileTypes: true })
		.filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
		.map((d) => {
			const phasePath = path.join(phasesDir, d.name);
			const num = d.name.slice(0, 2);
			const slug = d.name.slice(3);
			const files = fs.readdirSync(phasePath, { withFileTypes: true });
			const plans = files.filter((f) => f.isFile() && /^\d{2}-\d{2}-PLAN\.md$/.test(f.name)).length;
			const summaries = files.filter((f) => f.isFile() && /^\d{2}-\d{2}-SUMMARY\.md$/.test(f.name)).length;
			const hasVerification = files.some((f) => f.isFile() && f.name === `${d.name}-VERIFICATION.md`);
			return {
				num,
				slug,
				dir: d.name,
				path: phasePath,
				plans,
				summaries,
				hasVerification,
			};
		})
		.sort((a, b) => a.num.localeCompare(b.num));
}

export function resolveRepoPath(input: string, cwd: string): string {
	return resolveAbsolutePath(input, cwd);
}
