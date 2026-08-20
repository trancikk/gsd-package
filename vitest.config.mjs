import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["extensions/**/*.test.ts", "agents/**/*.test.ts", "scripts/**/*.test.mjs"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["extensions/**/*.ts"],
			exclude: ["**/*.test.ts", "**/node_modules/**"],
		},
	},
});
