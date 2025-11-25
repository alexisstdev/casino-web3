import type { Request, Response } from "express";
import { gameDB, oracleService } from "./service.js";
import { parseEther, type Address } from "viem";
import { loadConfig } from "../utils/config.js";

const config = loadConfig();

const KARMA_THRESHOLD = parseEther("100"); // 100 tokens

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

			res.json({
				address: state.address,
				streak: state.streak,
				karmaPool: state.karmaPool.toString(),
				karmaPoolEth: Number(state.karmaPool) / 1e18,
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

			const currentNonce = gameDB.getNonce(playerAddress);

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
