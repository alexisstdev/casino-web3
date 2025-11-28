import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { CONTRACT_ADDRESSES, CASINO_GAME_ABI } from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";
import { playSound } from "../utils/sound";

interface BuyChipsParams {
	ethAmount: string;
}

interface BuyChipsResult {
	txHash: string;
	ethSpent: number;
	chipsReceived: number;
}

/**
 * Hook para comprar CHIPS con ETH
 */
export const useBuyChips = (
	onSuccess?: (data: BuyChipsResult) => void,
	onError?: (error: Error) => void,
) => {
	const queryClient = useQueryClient();
	const { address } = useAccount();
	const { writeContractAsync } = useWriteContract();

	return useMutation<BuyChipsResult, Error, BuyChipsParams>({
		mutationFn: async ({ ethAmount }) => {
			console.log("💰 [BUY CHIPS] Iniciando compra:", { ethAmount });

			if (!address) throw new Error("No hay wallet conectado");

			playSound("click");

			const ethAmountWei = parseEther(ethAmount);

			const txHash = await writeContractAsync({
				address: CONTRACT_ADDRESSES.CASINO_GAME,
				abi: CASINO_GAME_ABI,
				functionName: "buyChips",
				value: ethAmountWei,
			});

			console.log("✅ [BUY CHIPS] TX enviada:", txHash);

			const receipt = await waitForTransactionReceipt(wagmiConfig, {
				hash: txHash,
			});

			console.log("✅ [BUY CHIPS] TX confirmada:", receipt.transactionHash);

			const chipsReceived = Number(ethAmount) * 10000;

			playSound("coin");

			return {
				txHash: receipt.transactionHash,
				ethSpent: Number(ethAmount),
				chipsReceived,
			};
		},
		onSuccess: (data) => {
			console.log("✅ [BUY CHIPS] Compra exitosa:", data);
			onSuccess?.(data);

			queryClient.invalidateQueries({ queryKey: ["balance"] });
			queryClient.invalidateQueries({ queryKey: ["contractBalances"] });
		},
		onError: (error) => {
			console.error("❌ [BUY CHIPS] Error:", error);
			onError?.(error);
		},
	});
};
