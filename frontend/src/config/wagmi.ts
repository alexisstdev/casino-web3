import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

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
