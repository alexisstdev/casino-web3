import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import {
	CONTRACT_ADDRESSES,
	CASINO_GAME_ABI,
	CASINO_TOKEN_ABI,
} from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";
import { playSound } from "../utils/sound";

// =====================================================
// QUERIES: Información del exchange
// =====================================================

/**
 * Hook para obtener la tasa de cambio CHIPS/ETH
 */
export const useExchangeRate = () => {
	const { data: chipsPerEth, refetch } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "chipsPerEth",
	});

	const { data: sellFeeBps } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "sellFeeBps",
	});

	return {
		chipsPerEth: chipsPerEth ? Number(chipsPerEth) : 10000,
		sellFeePercent: sellFeeBps ? Number(sellFeeBps) / 100 : 5,
		refetch,
	};
};

/**
 * Hook para obtener los balances del contrato (ETH y CHIPS disponibles)
 */
export const useContractBalances = () => {
	const { data: ethBalance, refetch: refetchEth } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getEthBalance",
	});

	const { data: chipsBalance, refetch: refetchChips } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getChipsBalance",
	});

	const refetch = () => {
		refetchEth();
		refetchChips();
	};

	return {
		ethBalance: ethBalance ? Number(formatEther(ethBalance as bigint)) : 0,
		chipsBalance: chipsBalance
			? Number(formatUnits(chipsBalance as bigint, 18))
			: 0,
		refetch,
	};
};

/**
 * Hook para calcular cuántos CHIPS se recibirían por X ETH
 */
export const useChipsForEth = (ethAmount: string) => {
	const { data } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getChipsForEth",
		args: ethAmount ? [parseEther(ethAmount || "0")] : undefined,
		query: {
			enabled: !!ethAmount && Number(ethAmount) > 0,
		},
	});

	return data ? Math.floor(Number(formatUnits(data as bigint, 18))) : 0;
};

/**
 * Hook para calcular cuánto ETH se recibiría por X CHIPS (después del fee)
 */
export const useEthForChips = (chipsAmount: string) => {
	const { data } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getEthForChips",
		args: chipsAmount ? [parseUnits(chipsAmount || "0", 18)] : undefined,
		query: {
			enabled: !!chipsAmount && Number(chipsAmount) > 0,
		},
	});

	if (!data) return { ethAmount: 0, fee: 0 };

	const [ethAmount, fee] = data as [bigint, bigint];
	return {
		ethAmount: Number(formatEther(ethAmount)),
		fee: Number(formatEther(fee)),
	};
};

// =====================================================
// MUTATIONS: Compra y Venta de CHIPS
// =====================================================

interface BuyChipsParams {
	ethAmount: string; // En ETH (ej: "0.1")
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

			// Calcular chips recibidos (aproximado basado en la tasa)
			const chipsReceived = Number(ethAmount) * 10000; // Tasa por defecto

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

			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			queryClient.invalidateQueries({ queryKey: ["contractBalances"] });
		},
		onError: (error) => {
			console.error("❌ [BUY CHIPS] Error:", error);
			onError?.(error);
		},
	});
};

interface SellChipsParams {
	chipsAmount: string; // En CHIPS (ej: "1000")
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

			// 1. Verificar y aprobar tokens si es necesario
			const { getPublicClient } = await import("@wagmi/core");
			const publicClient = getPublicClient(wagmiConfig);

			if (!publicClient) throw new Error("No se pudo obtener publicClient");

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

			// Calcular ETH recibido (aproximado)
			const grossEth = Number(chipsAmount) / 10000;
			const fee = grossEth * 0.05; // 5% fee
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

			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: ["balance"] });
			queryClient.invalidateQueries({ queryKey: ["contractBalances"] });
		},
		onError: (error) => {
			console.error("❌ [SELL CHIPS] Error:", error);
			onError?.(error);
		},
	});
};
