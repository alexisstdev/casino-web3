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
	tools: {
		rspack: {
			resolve: {
				fallback: {
					"@coinbase/wallet-sdk": false,
					"@gemini-wallet/core": false,
					"@metamask/sdk": false,
					"@walletconnect/ethereum-provider": false,
				},
			},
		},
	},
});
