import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	useAccount,
	useConnect,
	useDisconnect,
	useReadContract,
	useWriteContract,
	useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits, decodeEventLog, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
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
} from "../config/contracts";
import { wagmiConfig } from "../config/wagmi";
import { getPublicClient, waitForTransactionReceipt } from "@wagmi/core";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3007/api";

// =====================================================
// QUERY: Estado del juego desde el backend
// =====================================================
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

// =====================================================
// HOOK: Balance de CHIP tokens (usando Wagmi)
// =====================================================
export const useChipBalance = () => {
	const { address, isConnected } = useAccount();

	const { data: balance, refetch } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_TOKEN,
		abi: CASINO_TOKEN_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: isConnected && !!address,
		},
	});

	const formattedBalance = balance
		? Math.floor(Number(formatUnits(balance as bigint, 18)))
		: 0;

	return { balance: formattedBalance, refetch };
};

// =====================================================
// HOOK: Conexión de wallet (usando Wagmi)
// =====================================================
export const useWalletConnection = () => {
	const { address, isConnected, chainId } = useAccount();
	const { connect, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
	const { balance, refetch: refetchBalance } = useChipBalance();

	// Verificar si está en la red correcta
	const isCorrectChain = chainId === arbitrumSepolia.id;

	const connectWallet = () => {
		playSound("click");
		// Usar el primer conector disponible (generalmente injected/MetaMask)
		const connector = connectors[0];
		if (connector) {
			connect(
				{ connector, chainId: arbitrumSepolia.id },
				{
					onSuccess: () => {
						// Después de conectar, verificar si necesita cambiar de red
						if (chainId !== arbitrumSepolia.id) {
							switchChain({ chainId: arbitrumSepolia.id });
						}
					},
				},
			);
		}
	};

	const ensureCorrectChain = () => {
		if (chainId !== arbitrumSepolia.id) {
			switchChain({ chainId: arbitrumSepolia.id });
		}
	};

	return {
		address: address ?? null,
		isConnected,
		isConnecting: isConnecting || isSwitchingChain,
		isCorrectChain,
		balance,
		chainId,
		connectWallet,
		connectMetaMask: connectWallet, // Alias para compatibilidad
		disconnect,
		ensureCorrectChain,
		refetchBalance,
		connectors,
	};
};

// =====================================================
// MUTATION: Ejecutar jugada completa (usando Wagmi)
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

type FlipStatus = "SIGNING" | "MINING";

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
				queryClient.invalidateQueries({
					queryKey: ["gameState", address],
				});
			}
		},
		onError: (error) => {
			console.error("❌ [FLIP] Error en flip:", error);
			onError?.(error);
		},
	});
};
