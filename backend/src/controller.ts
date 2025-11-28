import type { Request, Response } from "express";
import { gameDB, oracleService } from "./service.js";
import { parseEther, type Address } from "viem";
import { loadConfig } from "./config.js";

const config = loadConfig();

const KARMA_THRESHOLD = parseEther("100"); // 100 tokens
const KARMA_THRESHOLD_TOKENS = 100; // Para cálculos de porcentaje (en fichas)

// Constantes de multiplicadores (deben coincidir con el contrato)
const BASE_MULTIPLIER = 1.9;
const STREAK_BONUS = 0.1; // 10% por cada racha
const MAX_STREAK_BONUS = 0.5; // Máximo 50% adicional

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class CryptoFlipController {
	static async getGameState(req: Request, res: Response): Promise<void> {
		try {
			const { address } = req.params;

			if (!address || !address.startsWith("0x")) {
				res.status(400).json({
					error: "Invalid address format",
				});
				return;
			}

			const state = gameDB.getPlayerState(address);
			const karmaPoolTokens = Number(state.karmaPool) / 1e18; // Convertir a fichas

			// Calcular multiplicador actual basado en la racha
			const streakBonus = Math.min(
				state.streak * STREAK_BONUS,
				MAX_STREAK_BONUS,
			);
			const currentMultiplier = BASE_MULTIPLIER + streakBonus;

			// Calcular porcentaje de llenado del karma vault
			const karmaProgress = Math.min(
				(karmaPoolTokens / KARMA_THRESHOLD_TOKENS) * 100,
				100,
			);

			res.json({
				address: state.address,
				streak: state.streak,
				streakMultiplier: currentMultiplier,
				nextMultiplier:
					state.streak < 5
						? currentMultiplier + STREAK_BONUS
						: currentMultiplier,
				maxMultiplier: BASE_MULTIPLIER + MAX_STREAK_BONUS,
				karmaPool: state.karmaPool.toString(),
				karmaPoolTokens: karmaPoolTokens,
				karmaTarget: KARMA_THRESHOLD_TOKENS,
				karmaProgress: karmaProgress,
				isKarmaReady: state.karmaPool >= KARMA_THRESHOLD,
				lastUpdate: new Date(state.lastUpdate).toISOString(),
			});
		} catch (error) {
			console.error("Error in getGameState:", error);
			res.status(500).json({
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	static async signFlip(req: Request, res: Response): Promise<void> {
		console.log("[FLIP] Solicitando firma...");

		try {
			const { playerAddress, betAmount } = req.body;

			if (!playerAddress || !playerAddress.startsWith("0x")) {
				res.status(400).json({
					error: "Invalid playerAddress format",
				});
				return;
			}

			if (!betAmount) {
				res.status(400).json({
					error: "betAmount is required",
				});
				return;
			}

			const betAmountWei = parseEther(betAmount);

			const state = gameDB.getPlayerState(playerAddress);
			const isKarmaReady = state.karmaPool >= KARMA_THRESHOLD;

			const currentNonce = await oracleService.getContractNonce(
				playerAddress as Address,
				config.CASINO_GAME_CONTRACT_ADDRESS as Address,
			);

			const signature = await oracleService.signGameData(
				playerAddress as Address,
				betAmountWei,
				state.streak,
				state.karmaPool,
				isKarmaReady,
				currentNonce,
				config.CASINO_GAME_CONTRACT_ADDRESS as Address,
			);

			// NO incrementar el nonce aquí, el contrato lo incrementará después de verificar la firma

			console.log("[FLIP] Firma generada para", playerAddress);

			res.json({
				streak: state.streak,
				karmaPool: state.karmaPool.toString(),
				karmaPoolEth: Number(state.karmaPool) / 1e18,
				isKarmaReady,
				signature,
				nonce: currentNonce,
				oracleAddress: oracleService.getOracleAddress(),
			});
		} catch (error) {
			console.error("Error in signFlip:", error);
			res.status(500).json({
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}
}
