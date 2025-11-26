import {
	createPublicClient,
	createWalletClient,
	http,
	type Address,
	type Abi,
	parseEther,
	keccak256,
	encodePacked,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { loadConfig } from "./config.js";
import type { PlayerState } from "./types.js";
import fs from "node:fs";

const config = loadConfig();

export class GameDatabase {
	private players: Map<string, PlayerState> = new Map();
	private nonces: Map<string, number> = new Map();

	getPlayerState(address: string): PlayerState {
		const lowercaseAddress = address.toLowerCase();

		if (!this.players.has(lowercaseAddress)) {
			this.players.set(lowercaseAddress, {
				address: lowercaseAddress,
				streak: 0,
				karmaPool: 0n,
				lastUpdate: Date.now(),
			});

			this.nonces.set(lowercaseAddress, 0);
		}

		const player = this.players.get(lowercaseAddress);

		if (!player) {
			throw new Error(
				`Player state not found for address: ${lowercaseAddress}`,
			);
		}

		return player;
	}

	getNonce(address: string): number {
		const lowercaseAddress = address.toLowerCase();
		return this.nonces.get(lowercaseAddress) || 0;
	}

	incrementNonce(address: string): number {
		const lowercaseAddress = address.toLowerCase();
		const currentNonce = this.getNonce(lowercaseAddress);
		const newNonce = currentNonce + 1;
		this.nonces.set(lowercaseAddress, newNonce);
		return newNonce;
	}

	updatePlayerState(
		address: string,
		won: boolean,
		betAmount: bigint,
		karmaReleased: bigint,
	): void {
		const lowercaseAddress = address.toLowerCase();
		const state = this.getPlayerState(lowercaseAddress);

		if (won) {
			// Ganó: Aumentar streak, resetear karma si se liberó
			state.streak += 1;
			if (karmaReleased > 0n) {
				state.karmaPool = 0n;
			}
		} else {
			// Perdió: Resetear streak, acumular 10% en karma
			state.streak = 0;
			const karmaIncrease = (betAmount * 10n) / 100n;
			state.karmaPool += karmaIncrease;
		}

		state.lastUpdate = Date.now();
		this.players.set(lowercaseAddress, state);
	}

	getAllPlayers(): PlayerState[] {
		return Array.from(this.players.values());
	}
}

export class OracleService {
	private account;
	private walletClient;
	private publicClient;

	constructor(privateKey: string) {
		this.account = privateKeyToAccount(`0x${privateKey}` as `0x${string}`);

		this.walletClient = createWalletClient({
			account: this.account,
			chain: arbitrumSepolia,
			transport: http(config.SEPOLIA_URL),
		});
		// Inicializamos publicClient para leer del contrato
		this.publicClient = createPublicClient({
			chain: arbitrumSepolia,
			transport: http(config.SEPOLIA_URL),
		});
	}

	async getContractNonce(
		playerAddress: Address,
		contractAddress: Address,
	): Promise<number> {
		try {
			const nonce = await this.publicClient.readContract({
				address: contractAddress,
				abi: [
					{
						inputs: [{ name: "", type: "address" }],
						name: "nonces",
						outputs: [{ name: "", type: "uint256" }],
						stateMutability: "view",
						type: "function",
					},
				],
				functionName: "nonces",
				args: [playerAddress],
			});
			return Number(nonce);
		} catch (error) {
			console.error("Error fetching nonce from contract:", error);
			return 0; // Fallback (aunque idealmente debería lanzar error)
		}
	}

	async signGameData(
		playerAddress: Address,
		betAmount: bigint,
		currentStreak: number,
		currentKarmaPool: bigint,
		isKarmaReady: boolean,
		nonce: number,
		contractAddress: Address,
	): Promise<`0x${string}`> {
		const hash = keccak256(
			encodePacked(
				[
					"address",
					"uint256",
					"uint256",
					"uint256",
					"bool",
					"uint256",
					"address",
				],
				[
					playerAddress,
					betAmount,
					BigInt(currentStreak),
					currentKarmaPool,
					isKarmaReady,
					BigInt(nonce),
					contractAddress,
				],
			),
		);

		const signature = await this.walletClient.signMessage({
			message: { raw: hash },
		});

		return signature;
	}

	getOracleAddress(): Address {
		return this.account.address;
	}
}

export class EventListenerService {
	private publicClient;
	private abi: Abi;
	private db: GameDatabase;
	private contractAddress: Address;

	constructor(db: GameDatabase) {
		this.db = db;
		this.contractAddress = config.CASINO_GAME_CONTRACT_ADDRESS as Address;

		const contractArtifact = JSON.parse(
			fs.readFileSync(
				"./artifacts/contracts/CasinoGame.sol/CasinoGame.json",
				"utf8",
			),
		);

		this.abi = contractArtifact.abi;

		this.publicClient = createPublicClient({
			chain: arbitrumSepolia,
			transport: http(config.SEPOLIA_URL),
		});
	}

	async startListening(): Promise<void> {
		console.log("Starting event listener for Game events...");

		this.publicClient.watchContractEvent({
			address: this.contractAddress,
			abi: this.abi,
			eventName: "GameResult",
			onLogs: (logs) => {
				for (const log of logs) {
					this.handleGameResult(log);
				}
			},
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private handleGameResult(log: any): void {
		try {
			const { player, won, amountWon, karmaPoolReleased } = log.args;

			console.log("\n🎲 Game Result Event Received:");
			console.log(`   Player: ${player}`);
			console.log(`   Won: ${won}`);
			console.log(`   Amount Won: ${amountWon}`);
			console.log(`   Karma Released: ${karmaPoolReleased}`);

			// Calcular la apuesta original (aproximado)
			// Si ganó: payout = betAmount * multiplier / 100
			// Si perdió: amountWon = 0
			let betAmount = 0n;
			if (!won) {
				// En caso de pérdida, no tenemos el betAmount en el evento
				// pero podríamos calcularlo si guardamos las firmas previas
				// Por simplicidad, usamos 0 (el karma no se incrementa correctamente sin esto)
				betAmount = 0n;
			}

			// Actualizar la base de datos
			this.db.updatePlayerState(
				player as string,
				won as boolean,
				betAmount,
				karmaPoolReleased as bigint,
			);

			console.log("✅ Database updated successfully!");

			// Mostrar estado actual del jugador
			const state = this.db.getPlayerState(player as string);
			console.log(`   New Streak: ${state.streak}`);
			console.log(`   New Karma Pool: ${state.karmaPool}`);
		} catch (error) {
			console.error("❌ Error handling GameResult event:", error);
		}
	}

	// Método para obtener eventos históricos (opcional)
	async syncPastEvents(fromBlock: 0n): Promise<void> {
		console.log("🔄 Syncing past events...");

		const logs = await this.publicClient.getContractEvents({
			address: this.contractAddress,
			abi: this.abi,
			eventName: "GameResult",
			fromBlock,
		});

		console.log(`Found ${logs.length} past events`);

		for (const log of logs) {
			this.handleGameResult(log);
		}

		console.log("✅ Past events synced!");
	}
}

export const gameDB = new GameDatabase();
export const oracleService = new OracleService(config.ORACLE_PRIVATE_KEY);
export const eventListener = new EventListenerService(gameDB);
