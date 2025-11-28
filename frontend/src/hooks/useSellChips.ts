import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { getPublicClient, waitForTransactionReceipt } from "@wagmi/core";
import {
	CONTRACT_ADDRESSES,
	CASINO_GAME_ABI,
	CASINO_TOKEN_ABI,
} from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";
import { playSound } from "../utils/sound";

interface SellChipsParams {
	chipsAmount: string;
}

interface SellChipsResult {
	txHash: string;
	chipsSold: number;
	ethReceived: number;
	fee: number;
}

/**
 * Hook para vender CHIPS por ETH
 */
export const useSellChips = (
	onSuccess?: (data: SellChipsResult) => void,
	onError?: (error: Error) => void,
) => {
	const queryClient = useQueryClient();
	const { address } = useAccount();
	const { writeContractAsync } = useWriteContract();

	return useMutation<SellChipsResult, Error, SellChipsParams>({
		mutationFn: async ({ chipsAmount }) => {
			console.log("💸 [SELL CHIPS] Iniciando venta:", { chipsAmount });

			if (!address) throw new Error("No hay wallet conectado");

			playSound("click");

			const chipsAmountWei = parseUnits(chipsAmount, 18);
			const publicClient = getPublicClient(wagmiConfig);

			if (!publicClient) throw new Error("No se pudo obtener publicClient");

			// 1. Verificar y aprobar tokens si es necesario
			const allowance = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "allowance",
				args: [address, CONTRACT_ADDRESSES.CASINO_GAME],
			})) as bigint;

			if (allowance < chipsAmountWei) {
				console.log("📝 [SELL CHIPS] Aprobando tokens...");
				const MAX_APPROVAL = parseUnits("1000000", 18);

				const approveTx = await writeContractAsync({
					address: CONTRACT_ADDRESSES.CASINO_TOKEN,
					abi: CASINO_TOKEN_ABI,
					functionName: "approve",
					args: [CONTRACT_ADDRESSES.CASINO_GAME, MAX_APPROVAL],
				});

				await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });
				console.log("✅ [SELL CHIPS] Tokens aprobados");
			}

			// 2. Vender chips
			const txHash = await writeContractAsync({
				address: CONTRACT_ADDRESSES.CASINO_GAME,
				abi: CASINO_GAME_ABI,
				functionName: "sellChips",
				args: [chipsAmountWei],
			});

			console.log("✅ [SELL CHIPS] TX enviada:", txHash);

			const receipt = await waitForTransactionReceipt(wagmiConfig, {
				hash: txHash,
			});

			console.log("✅ [SELL CHIPS] TX confirmada:", receipt.transactionHash);

			const grossEth = Number(chipsAmount) / 10000;
			const fee = grossEth * 0.05;
			const ethReceived = grossEth - fee;

			playSound("coin");

			return {
				txHash: receipt.transactionHash,
				chipsSold: Number(chipsAmount),
				ethReceived,
				fee,
			};
		},
		onSuccess: (data) => {
			console.log("✅ [SELL CHIPS] Venta exitosa:", data);
			onSuccess?.(data);

			queryClient.invalidateQueries({ queryKey: ["balance"] });
			queryClient.invalidateQueries({ queryKey: ["contractBalances"] });
		},
		onError: (error) => {
			console.error("❌ [SELL CHIPS] Error:", error);
			onError?.(error);
		},
	});
};
