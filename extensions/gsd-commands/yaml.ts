/**
 * Minimal YAML parser/stringifier for GSD STATE.md frontmatter.
 *
 * Supports only the subset used by GSD artifacts:
 *   - null, boolean, number, string scalars
 *   - flow-style arrays: [a, b, c]
 *   - block-style objects with 2-space indentation
 *
 * This keeps the extension self-contained (no external YAML dependency).
 */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
	const match = content.match(FRONTMATTER_RE);
	if (!match) {
		throw new Error("File does not contain YAML frontmatter delimited by ---");
	}
	return {
		frontmatter: parseYaml(match[1]) as Record<string, any>,
		body: match[2],
	};
}

export function stringifyFrontmatter(frontmatter: Record<string, any>): string {
	return `---\n${stringifyYaml(frontmatter)}---\n\n`;
}

function parseYamlValue(raw: string): any {
	raw = raw.trim();
	if (raw === "" || raw === "null" || raw === "~") return null;
	if (raw === "true") return true;
	if (raw === "false") return false;
	if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
	if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
	if (raw.startsWith("[") && raw.endsWith("]")) {
		const inner = raw.slice(1, -1).trim();
		if (!inner) return [];
		return inner.split(",").map((s) => parseYamlValue(s.trim()));
	}
	if (raw.startsWith('"') && raw.endsWith('"')) {
		return raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "\t");
	}
	if (raw.startsWith("'") && raw.endsWith("'")) {
		return raw.slice(1, -1).replace(/''/g, "'");
	}
	return raw;
}

export function parseYaml(text: string): any {
	const lines = text.split(/\r?\n/);
	const root: Record<string, any> = {};
	const stack: { obj: Record<string, any>; indent: number }[] = [{ obj: root, indent: -1 }];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.trim()) continue;

		const indent = line.length - line.trimStart().length;
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;

		const key = line.slice(indent, colonIdx).trim();
		let valueStr = line.slice(colonIdx + 1).trim();

		// Pop stack until we are at the parent of the current indent
		while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
			stack.pop();
		}

		const current = stack[stack.length - 1].obj;

		// Peek next non-empty line to detect nested block object
		let j = i + 1;
		while (j < lines.length && !lines[j].trim()) j++;
		const nextIndent = j < lines.length ? lines[j].length - lines[j].trimStart().length : -1;

		if (valueStr === "" && nextIndent > indent) {
			const nested: Record<string, any> = {};
			current[key] = nested;
			stack.push({ obj: nested, indent });
		} else {
			current[key] = parseYamlValue(valueStr);
		}
	}

	return root;
}

function needsQuoting(s: string): boolean {
	if (s === "") return true;
	if (/^(null|true|false|~)$/i.test(s)) return true;
	if (/^-?\d+(\.\d+)?$/.test(s)) return true;
	if (/[\s:\[\]{}#,"'\\]/.test(s)) return true;
	return false;
}

export function stringifyYaml(value: any, indent = 0): string {
	const spaces = " ".repeat(indent);
	if (value === null) return "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return String(value);
	if (typeof value === "string") {
		if (needsQuoting(value)) return JSON.stringify(value);
		return value;
	}
	if (Array.isArray(value)) {
		return `[${value.map((v) => stringifyYaml(v, 0)).join(", ")}]`;
	}
	if (typeof value === "object") {
		let out = "";
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			const v = value[k];
			if (v !== null && typeof v === "object" && !Array.isArray(v)) {
				out += `${spaces}${k}:\n`;
				out += stringifyYaml(v, indent + 2);
			} else {
				out += `${spaces}${k}: ${stringifyYaml(v, 0)}\n`;
			}
		}
		return out;
	}
	return String(value);
}
