import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const { publicVars } = loadEnv({ prefixes: ["VITE_"] });

// Docs: https://rsbuild.rs/config/
export default defineConfig({
	plugins: [pluginReact()],
	source: {
		define: publicVars,
	},
	html: {
		template: "./src/index.html",
	},
});
