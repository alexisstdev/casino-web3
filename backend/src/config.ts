import * as dotenv from "dotenv";
import type { EnvConfig } from "./types.js";

dotenv.config();

export function loadConfig(): EnvConfig {
	const config = {
		SEPOLIA_URL: process.env.SEPOLIA_URL,
		SEPOLIA_PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY,
		SEPOLIA_PUBLIC_KEY: process.env.SEPOLIA_PUBLIC_KEY,

		CASINO_GAME_CONTRACT_ADDRESS: process.env.CASINO_GAME_CONTRACT_ADDRESS,
		CASINO_TOKEN_CONTRACT_ADDRESS: process.env.CASINO_TOKEN_CONTRACT_ADDRESS,
		ORACLE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY,
	};

	for (const [key, value] of Object.entries(config)) {
		if (!value) {
			throw new Error(`Variable de entorno requerida: ${key}`);
		}
	}

	return config as EnvConfig;
}
