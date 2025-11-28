import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "viem/chains";
import { playSound } from "../utils/sound";

/**
 * Hook para manejar la conexión de wallet
 */
export const useWallet = () => {
	const { address, isConnected, chainId } = useAccount();
	const { connect, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const isCorrectChain = chainId === sepolia.id;

	const connectWallet = () => {
		playSound("click");
		const connector = connectors[0];
		if (connector) {
			connect(
				{ connector, chainId: sepolia.id },
				{
					onSuccess: () => {
						if (chainId !== sepolia.id) {
							switchChain({ chainId: sepolia.id });
						}
					},
				},
			);
		}
	};

	const ensureCorrectChain = () => {
		if (chainId !== sepolia.id) {
			switchChain({ chainId: sepolia.id });
		}
	};

	return {
		address: address ?? null,
		isConnected,
		isConnecting: isConnecting || isSwitchingChain,
		isCorrectChain,
		chainId,
		connectWallet,
		disconnect,
		ensureCorrectChain,
		connectors,
	};
};
