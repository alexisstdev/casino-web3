import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, formatUnits, decodeEventLog, type Address } from "viem";
import { getPublicClient, waitForTransactionReceipt } from "@wagmi/core";
import type { CoinSide, SignFlipResponse } from "../types/game";
import { COIN_SIDE } from "../constants/game";
import { playSound } from "../utils/sound";
import {
	CONTRACT_ADDRESSES,
	CASINO_GAME_ABI,
	CASINO_TOKEN_ABI,
} from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3007/api";

interface FlipParams {
	choice: CoinSide;
	betAmount: number;
}

interface FlipResult {
	win: boolean;
	amount: number;
	coinSide: CoinSide;
	newBalance: number;
	result: { win: boolean; amount: number };
}

type FlipStatus = "SIGNING" | "MINING";

/**
 * Hook para ejecutar una jugada (flip)
 */
export const useFlip = (
	onSuccess: (data: FlipResult) => void,
	onError?: (error: Error) => void,
	onStatusUpdate?: (status: FlipStatus) => void,
) => {
	const { address } = useAccount();
	const queryClient = useQueryClient();
	const { writeContractAsync } = useWriteContract();

	return useMutation<FlipResult, Error, FlipParams>({
		mutationFn: async ({ choice, betAmount }) => {
			console.log("🎲 [FLIP] Iniciando jugada:", {
				choice,
				betAmount,
				address,
			});

			if (!address) throw new Error("No hay wallet conectado");

			playSound("click");

			// 1. Get signature from backend
			console.log("🔐 [FLIP] Solicitando firma al backend...");
			playSound("sign");
			const signResponse = await fetch(`${API_BASE_URL}/sign-flip`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					playerAddress: address,
					betAmount: betAmount.toString(),
				}),
			});

			if (!signResponse.ok) {
				throw new Error("Error al obtener firma del oráculo");
			}

			const signData: SignFlipResponse = await signResponse.json();
			console.log("✅ [FLIP] Firma recibida:", signData);

			// 2. Check and approve tokens if needed
			const betAmountWei = parseUnits(betAmount.toString(), 18);
			const publicClient = getPublicClient(wagmiConfig);

			if (!publicClient) throw new Error("No se pudo obtener publicClient");

			const allowance = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "allowance",
				args: [address, CONTRACT_ADDRESSES.CASINO_GAME],
			})) as bigint;

			console.log("💰 [FLIP] Allowance actual:", allowance.toString());

			if (allowance < betAmountWei) {
				console.log("📝 [FLIP] Aprobando tokens...");
				const MAX_APPROVAL = parseUnits("1000000", 18);

				const approveTx = await writeContractAsync({
					address: CONTRACT_ADDRESSES.CASINO_TOKEN,
					abi: CASINO_TOKEN_ABI,
					functionName: "approve",
					args: [CONTRACT_ADDRESSES.CASINO_GAME, MAX_APPROVAL],
				});

				await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });
				console.log("✅ [FLIP] Tokens aprobados");
			}

			// 3. Call flip function
			console.log("🎰 [FLIP] Llamando función flip...");
			const choiceHeads = choice === COIN_SIDE.HEADS;

			const flipTx = await writeContractAsync({
				address: CONTRACT_ADDRESSES.CASINO_GAME,
				abi: CASINO_GAME_ABI,
				functionName: "flip",
				args: [
					choiceHeads,
					betAmountWei,
					BigInt(signData.streak),
					parseUnits(signData.karmaPool, 18),
					signData.isKarmaReady,
					signData.signature as `0x${string}`,
				],
				gas: 700_000n,
			});

			console.log("✅ [FLIP] TX enviada:", flipTx);
			onStatusUpdate?.("MINING");

			// 4. Wait for confirmation
			console.log("⏳ [FLIP] Esperando confirmación...");
			const receipt = await waitForTransactionReceipt(wagmiConfig, {
				hash: flipTx,
			});
			console.log("✅ [FLIP] TX confirmada:", receipt.transactionHash);

			// 5. Parse GameResult event
			const gameResultLog = receipt.logs.find((log) => {
				try {
					const decoded = decodeEventLog({
						abi: CASINO_GAME_ABI,
						data: log.data,
						topics: log.topics,
					});
					return decoded.eventName === "GameResult";
				} catch {
					return false;
				}
			});

			if (!gameResultLog) {
				throw new Error("No se encontró evento GameResult");
			}

			const gameResult = decodeEventLog({
				abi: CASINO_GAME_ABI,
				data: gameResultLog.data,
				topics: gameResultLog.topics,
			});

			interface GameResultArgs {
				player: Address;
				won: boolean;
				amountWon: bigint;
				streak: bigint;
				karmaPoolReleased: bigint;
				timestamp: bigint;
			}

			const args = gameResult.args as unknown as GameResultArgs;
			const won = args.won;
			const amountWon = args.amountWon;
			const amount = Number(formatUnits(won ? amountWon : betAmountWei, 18));

			const resultSide = won
				? choice
				: choice === COIN_SIDE.HEADS
					? COIN_SIDE.TAILS
					: COIN_SIDE.HEADS;

			// 6. Get updated balance
			const newBalanceBigInt = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "balanceOf",
				args: [address],
			})) as bigint;

			const newBalance = Math.floor(Number(formatUnits(newBalanceBigInt, 18)));

			console.log("🎉 [FLIP] Jugada completada!", { won, amount, newBalance });

			return {
				win: won,
				amount: Math.floor(amount),
				coinSide: resultSide,
				newBalance,
				result: { win: won, amount: Math.floor(amount) },
			};
		},
		onSuccess: (data) => {
			console.log("✅ [FLIP] onSuccess callback:", data);
			onSuccess(data);
			playSound(data.win ? "coin" : "hover");

			if (address) {
				queryClient.invalidateQueries({ queryKey: ["gameState", address] });
			}
		},
		onError: (error) => {
			console.error("❌ [FLIP] Error en flip:", error);
			onError?.(error);
		},
	});
};
