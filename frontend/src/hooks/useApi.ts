import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createPublicClient,
	createWalletClient,
	custom,
	parseUnits,
	formatUnits,
	http,
	decodeEventLog,
	type Address,
} from "viem";
import { sepolia } from "viem/chains";
import type {
	BackendGameState,
	SignFlipResponse,
	CoinSide,
} from "../types/game";
import { COIN_SIDE } from "../constants/game";
import { playSound } from "../utils/sound";
import {
	CONTRACT_ADDRESSES,
	CASINO_GAME_ABI,
	CASINO_TOKEN_ABI,
	SEPOLIA_RPC_URL,
} from "../config/contracts";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3007/api";

interface EthereumProvider {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
	isMetaMask?: boolean;
}

declare global {
	interface Window {
		ethereum?: EthereumProvider;
	}
}

export const useGameState = (address: string | null) => {
	return useQuery<BackendGameState>({
		queryKey: ["gameState", address],
		queryFn: async () => {
			if (!address) throw new Error("No hay dirección");

			const response = await fetch(`${API_BASE_URL}/game-state/${address}`);
			if (!response.ok) throw new Error("Error al obtener estado del juego");

			return response.json();
		},
		enabled: !!address,
		refetchInterval: 5000,
	});
};

interface SignFlipParams {
	playerAddress: string;
	betAmount: string;
}

export const useSignFlip = () => {
	return useMutation<SignFlipResponse, Error, SignFlipParams>({
		mutationFn: async ({ playerAddress, betAmount }) => {
			const response = await fetch(`${API_BASE_URL}/sign-flip`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ playerAddress, betAmount }),
			});

			if (!response.ok) throw new Error("Error al firmar transacción");

			return response.json();
		},
	});
};

export const useConnectWallet = (
	onSuccess: (data: { address: string; balance: number }) => void,
) => {
	return useMutation<{ address: string; balance: number }, Error, void>({
		mutationFn: async () => {
			playSound("click");

			// Connect to MetaMask wallet
			const { ethereum } = window;
			if (!ethereum) {
				throw new Error("MetaMask no está instalado");
			}

			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			const address = (accounts as string[])[0];

			// Get CHIP token balance using viem public client
			const publicClient = createPublicClient({
				chain: sepolia,
				transport: http(SEPOLIA_RPC_URL),
			});

			// Read token balance
			const balance = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "balanceOf",
				args: [address as Address],
			})) as bigint;

			// Convert from wei to tokens (18 decimals)
			const chipBalance = Number(formatUnits(balance, 18));

			return { address, balance: Math.floor(chipBalance) };
		},
		onSuccess: (data) => {
			onSuccess(data);
			playSound("coin");
		},
	});
};

// =====================================================
// MUTATION: Ejecutar jugada completa
// =====================================================
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

export const useFlip = (
	walletAddress: string | null,
	onSuccess: (data: FlipResult) => void,
	onError?: (error: Error) => void,
) => {
	const queryClient = useQueryClient();

	return useMutation<FlipResult, Error, FlipParams>({
		mutationFn: async ({ choice, betAmount }) => {
			if (!walletAddress) throw new Error("No hay wallet conectado");

			const { ethereum } = window;
			if (!ethereum) throw new Error("MetaMask no disponible");

			playSound("click");

			// 1. Get signature from backend
			playSound("sign");
			const signResponse = await fetch(`${API_BASE_URL}/sign-flip`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					playerAddress: walletAddress,
					betAmount: betAmount.toString(),
				}),
			});

			if (!signResponse.ok) {
				throw new Error("Error al obtener firma del oráculo");
			}

			const signData: SignFlipResponse = await signResponse.json();

			// 2. Setup viem clients
			const publicClient = createPublicClient({
				chain: sepolia,
				transport: http(SEPOLIA_RPC_URL),
			});

			const walletClient = createWalletClient({
				account: walletAddress as Address,
				chain: sepolia,
				transport: custom(ethereum),
			});

			// 3. Approve tokens if needed (check allowance first)
			const betAmountWei = parseUnits(betAmount.toString(), 18);

			const allowance = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "allowance",
				args: [walletAddress as Address, CONTRACT_ADDRESSES.CASINO_GAME],
			})) as bigint;

			if (allowance < betAmountWei) {
				// Approve tokens
				const approveTx = await walletClient.writeContract({
					address: CONTRACT_ADDRESSES.CASINO_TOKEN,
					abi: CASINO_TOKEN_ABI,
					functionName: "approve",
					args: [CONTRACT_ADDRESSES.CASINO_GAME, betAmountWei],
				});

				// Wait for approval confirmation
				await publicClient.waitForTransactionReceipt({ hash: approveTx });
			}

			// 4. Call flip function on contract
			const choiceHeads = choice === COIN_SIDE.HEADS;

			const flipTx = await walletClient.writeContract({
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
			});

			// 5. Wait for transaction and get receipt
			const receipt = await publicClient.waitForTransactionReceipt({
				hash: flipTx,
			});

			// 6. Parse GameResult event from logs
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

			// Extract result data
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

			// Determine coin side from result
			const resultSide = won
				? choice
				: choice === COIN_SIDE.HEADS
					? COIN_SIDE.TAILS
					: COIN_SIDE.HEADS;

			// 7. Get updated balance
			const newBalanceBigInt = (await publicClient.readContract({
				address: CONTRACT_ADDRESSES.CASINO_TOKEN,
				abi: CASINO_TOKEN_ABI,
				functionName: "balanceOf",
				args: [walletAddress as Address],
			})) as bigint;

			const newBalance = Math.floor(Number(formatUnits(newBalanceBigInt, 18)));

			return {
				win: won,
				amount: Math.floor(amount),
				coinSide: resultSide,
				newBalance,
				result: { win: won, amount: Math.floor(amount) },
			};
		},
		onSuccess: (data) => {
			onSuccess(data);
			playSound(data.win ? "coin" : "hover");

			// Invalidar query para refetch del servidor
			if (walletAddress) {
				queryClient.invalidateQueries({
					queryKey: ["gameState", walletAddress],
				});
			}
		},
		onError: (error) => {
			console.error("Error en flip:", error);
			onError?.(error);
		},
	});
};
