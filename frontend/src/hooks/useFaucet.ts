import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { CONTRACT_ADDRESSES, CASINO_TOKEN_ABI } from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";
import { playSound } from "../utils/sound";

interface FaucetResult {
	txHash: string;
	chipsReceived: number;
}

/**
 * Hook para obtener 1000 CHIPS gratis del faucet (solo testnet)
 */
export const useFaucet = (
	onSuccess?: (data: FaucetResult) => void,
	onError?: (error: Error) => void,
) => {
	const queryClient = useQueryClient();
	const { address } = useAccount();
	const { writeContractAsync } = useWriteContract();

	return useMutation<FaucetResult, Error, void>({
		mutationFn: async () => {
			console.log("🚰 [FAUCET] Solicitando tokens...");

			if (!address) throw new Error("No hay wallet conectado");

			playSound("click");

			const txHash = await writeContractAsync({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "faucet",
			});

			console.log("✅ [FAUCET] TX enviada:", txHash);

			const receipt = await waitForTransactionReceipt(wagmiConfig, {
				hash: txHash,
			});

			console.log("✅ [FAUCET] TX confirmada:", receipt.transactionHash);

			playSound("coin");

			return {
				txHash: receipt.transactionHash,
				chipsReceived: 1000,
			};
		},
		onSuccess: (data) => {
			console.log("✅ [FAUCET] Tokens recibidos:", data);
			onSuccess?.(data);

			// Invalidar queries de balance
			queryClient.invalidateQueries({ queryKey: ["balance"] });
		},
		onError: (error) => {
			console.error("❌ [FAUCET] Error:", error);
			onError?.(error);
		},
	});
};
