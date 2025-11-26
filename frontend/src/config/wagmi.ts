import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
	console.warn("⚠️ VITE_WALLETCONNECT_PROJECT_ID no está definido");
}

export const wagmiConfig = createConfig({
	chains: [arbitrumSepolia],
	storage: createStorage({
		storage: cookieStorage,
	}),
	transports: {
		[arbitrumSepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
	},
	connectors: [
		metaMask(),
		walletConnect({
			projectId: projectId || "default_project_id",
			showQrModal: true,
			metadata: {
				name: "Casino DApp",
				description: "A decentralized casino application",
				url: "https://casino-web3-ten.vercel.app",
				icons: ["https://casino-web3-ten.vercel.app/favicon.svg"],
			},
		}),
	],
});

declare module "wagmi" {
	interface Register {
		config: typeof wagmiConfig;
	}
}
