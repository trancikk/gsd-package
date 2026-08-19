import * as fs from "node:fs";
import * as path from "node:path";

export function toForwardSlash(input: string): string {
	return input.replace(/\\/g, "/");
}

export function resolveAbsolutePath(input: string, cwd: string): string {
	const normalized = toForwardSlash(input);
	return path.isAbsolute(normalized) ? normalized : toForwardSlash(path.resolve(cwd, normalized));
}

export function ensureOutputDir(outputPath: string): void {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

export function buildCrossPlatformGate(outputPath: string): string {
	const execPath = JSON.stringify(process.execPath.replace(/\\/g, "/"));
	const targetPath = JSON.stringify(outputPath);
	const script = `const fs=require('fs'); const p=process.argv[1]; try { const s=fs.statSync(p); process.exit(s.isFile() && s.size>0 ? 0 : 1); } catch (e) { process.exit(1); }`;
	return `${execPath} -e ${JSON.stringify(script)} ${targetPath}`;
}

/**
 * Atomically write a file by writing to a temp file and renaming it into place.
 * Prevents half-written files if the process crashes mid-write.
 *
 * On Windows, rename over an existing file can fail with EPERM if the target is
 * briefly locked. In that case we fall back to copy-then-unlink, then direct
 * write as a last resort, so the update still lands.
 */
export function writeAtomic(filePath: string, content: string): void {
	const dir = path.dirname(filePath);
	const tmpPath = path.join(dir, `.tmp-${path.basename(filePath)}-${Date.now()}`);
	fs.writeFileSync(tmpPath, content, "utf8");
	try {
		fs.renameSync(tmpPath, filePath);
	} catch (err: any) {
		if (err.code === "EPERM" || err.code === "EBUSY") {
			try {
				fs.copyFileSync(tmpPath, filePath);
				fs.unlinkSync(tmpPath);
				return;
			} catch (copyErr: any) {
				fs.writeFileSync(filePath, content, "utf8");
				try {
					fs.unlinkSync(tmpPath);
				} catch {
					// ignore cleanup failure
				}
				return;
			}
		}
		throw err;
	}
}

/**
 * Read a file if it exists, else return undefined.
 */
export function readFileOptional(filePath: string): string | undefined {
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch (err: any) {
		if (err.code === "ENOENT") return undefined;
		throw err;
	}
}
