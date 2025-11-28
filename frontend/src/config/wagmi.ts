import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
	chains: [sepolia],
	storage: createStorage({
		storage: cookieStorage,
	}),
	transports: {
		[sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
	},
});

declare module "wagmi" {
	interface Register {
		config: typeof wagmiConfig;
	}
}
