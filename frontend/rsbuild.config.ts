import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const { publicVars } = loadEnv({ prefixes: ["VITE_"] });

// Docs: https://rsbuild.rs/config/
export default defineConfig({
	plugins: [pluginReact()],
	source: {
		define: publicVars,
	},

	output: {
		manifest: true,
	},

	html: {
		meta: {
			viewport: "width=device-width, initial-scale=1.0",
		},
		tags: [
			{
				tag: "link",
				attrs: {
					rel: "manifest",
					href: "/manifest.json",
				},
			},
		],
	},
});
