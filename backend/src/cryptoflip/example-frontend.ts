/**
 * Ejemplo de integración del Frontend con la API de CryptoFlip
 *
 * Este archivo muestra cómo usar viem para interactuar con el Smart Contract
 * y la API del backend.
 */

import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// =====================================================
// CONFIGURACIÓN
// =====================================================
const API_BASE_URL = "http://localhost:4000/api/cryptoflip";
const CASINO_GAME_ADDRESS = "0xbb9Faf7134f9Dd16af7535db00232277fF07fcd2";
const CASINO_TOKEN_ADDRESS = "0xbc7d01eF646230650484a97F3A514740CeA5d75d";

// ABI mínimo necesario (solo las funciones que usaremos)
const CASINO_GAME_ABI = [
	{
		name: "flip",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "choiceHeads", type: "bool" },
			{ name: "betAmount", type: "uint256" },
			{ name: "currentStreak", type: "uint256" },
			{ name: "currentKarmaPool", type: "uint256" },
			{ name: "isKarmaReady", type: "bool" },
			{ name: "signature", type: "bytes" },
		],
		outputs: [],
	},
] as const;

const CASINO_TOKEN_ABI = [
	{
		name: "approve",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		name: "balanceOf",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		name: "faucet",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
] as const;

// =====================================================
// CLASE PRINCIPAL
// =====================================================
export class CryptoFlipGame {
	private walletClient;
	private publicClient;
	private account;

	constructor(privateKey: string, rpcUrl: string) {
		this.account = privateKeyToAccount(`0x${privateKey}`);

		this.walletClient = createWalletClient({
			account: this.account,
			chain: sepolia,
			transport: http(rpcUrl),
		});

		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http(rpcUrl),
		});
	}

	/**
	 * Obtiene el estado actual del jugador desde el backend
	 */
	async getGameState() {
		const response = await fetch(
			`${API_BASE_URL}/game-state/${this.account.address}`,
		);

		if (!response.ok) {
			throw new Error(`Failed to get game state: ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Solicita al backend que firme los datos del juego
	 */
	async requestSignature(betAmount: string) {
		const response = await fetch(`${API_BASE_URL}/sign-flip`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				playerAddress: this.account.address,
				betAmount,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to request signature: ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Obtiene el balance de tokens del jugador
	 */
	async getTokenBalance() {
		const balance = await this.publicClient.readContract({
			address: CASINO_TOKEN_ADDRESS,
			abi: CASINO_TOKEN_ABI,
			functionName: "balanceOf",
			args: [this.account.address],
		});

		return balance;
	}

	/**
	 * Aprueba al contrato del juego para gastar tokens
	 */
	async approveTokens(amount: bigint) {
		const hash = await this.walletClient.writeContract({
			address: CASINO_TOKEN_ADDRESS,
			abi: CASINO_TOKEN_ABI,
			functionName: "approve",
			args: [CASINO_GAME_ADDRESS, amount],
		});

		console.log("✅ Approve transaction sent:", hash);

		// Esperar confirmación
		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
		console.log("✅ Approve confirmed!");

		return receipt;
	}

	/**
	 * Obtiene tokens gratis del faucet (solo testnet)
	 */
	async getFaucetTokens() {
		const hash = await this.walletClient.writeContract({
			address: CASINO_TOKEN_ADDRESS,
			abi: CASINO_TOKEN_ABI,
			functionName: "faucet",
		});

		console.log("💰 Faucet transaction sent:", hash);

		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
		console.log("💰 1000 CHIPS received!");

		return receipt;
	}

	/**
	 * Juega una partida
	 */
	async playFlip(choiceHeads: boolean, betAmount: string) {
		console.log("\n🎰 ===== STARTING GAME =====");
		console.log(`💰 Bet Amount: ${betAmount} CHIPS`);
		console.log(`🪙 Choice: ${choiceHeads ? "HEADS (Cara)" : "TAILS (Cruz)"}`);

		// 1. Obtener estado actual
		console.log("\n📊 Fetching game state...");
		const state = await this.getGameState();
		console.log(`   Streak: ${state.streak}`);
		console.log(`   Karma Pool: ${state.karmaPoolEth} CHIPS`);
		console.log(`   Karma Ready: ${state.isKarmaReady ? "YES" : "NO"}`);

		// 2. Verificar balance
		console.log("\n💰 Checking token balance...");
		const balance = await this.getTokenBalance();
		const balanceEth = Number(balance) / 1e18;
		console.log(`   Balance: ${balanceEth} CHIPS`);

		const betAmountWei = parseEther(betAmount);

		if (balance < betAmountWei) {
			throw new Error(
				`Insufficient balance. You have ${balanceEth} CHIPS but need ${betAmount} CHIPS`,
			);
		}

		// 3. Aprobar tokens si es necesario
		console.log("\n✅ Approving tokens...");
		await this.approveTokens(betAmountWei);

		// 4. Solicitar firma al backend
		console.log("\n🔐 Requesting signature from backend...");
		const signData = await this.requestSignature(betAmount);
		console.log(`   Signature: ${signData.signature.slice(0, 20)}...`);
		console.log(`   Nonce: ${signData.nonce}`);

		// 5. Llamar al contrato
		console.log("\n🎲 Sending flip transaction...");
		const hash = await this.walletClient.writeContract({
			address: CASINO_GAME_ADDRESS,
			abi: CASINO_GAME_ABI,
			functionName: "flip",
			args: [
				choiceHeads,
				betAmountWei,
				BigInt(signData.streak),
				BigInt(signData.karmaPool),
				signData.isKarmaReady,
				signData.signature,
			],
		});

		console.log(`   Transaction Hash: ${hash}`);

		// 6. Esperar confirmación
		console.log("\n⏳ Waiting for confirmation...");
		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

		console.log("✅ Transaction confirmed!");
		console.log(`   Block: ${receipt.blockNumber}`);
		console.log(`   Gas Used: ${receipt.gasUsed}`);

		// 7. Parsear logs para obtener el resultado
		const logs = receipt.logs;
		console.log(`   Total logs: ${logs.length}`);

		// El backend actualizará el estado automáticamente al escuchar el evento

		return {
			hash,
			receipt,
			success: receipt.status === "success",
		};
	}
}

// =====================================================
// EJEMPLO DE USO
// =====================================================
async function example() {
	// Crear instancia del juego
	const game = new CryptoFlipGame(
		"TU_PRIVATE_KEY_AQUI", // Sin el 0x
		"https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY",
	);

	try {
		// 1. Obtener tokens del faucet (solo una vez)
		// await game.getFaucetTokens();

		// 2. Ver estado actual
		const state = await game.getGameState();
		console.log("Current State:", state);

		// 3. Jugar una partida
		const result = await game.playFlip(true, "10"); // true = Cara, '10' = 10 CHIPS
		console.log("Game Result:", result);
	} catch (error) {
		console.error("❌ Error:", error);
	}
}

// Descomentar para ejecutar el ejemplo
// example();
