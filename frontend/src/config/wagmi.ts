import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

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
});

declare module "wagmi" {
	interface Register {
		config: typeof wagmiConfig;
	}
}
