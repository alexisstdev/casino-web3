import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
	plugins: [hardhatToolboxViemPlugin],
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
			viaIR: true,
		},
	},
	networks: {
		arbSepolia: {
			type: "http",
			url: process.env.SEPOLIA_URL || configVariable("SEPOLIA_URL"), // La URL que obtuviste de Alchemy
			accounts: [
				process.env.SEPOLIA_PRIVATE_KEY ||
					configVariable("SEPOLIA_PRIVATE_KEY"),
			],
			chainId: 421614, // ID oficial de Arbitrum Sepolia
			// Se recomienda usar un gas price bajo en L2, aunque Ethers/Viem lo maneja automáticamente.
			// gasPrice: 100000000, // 0.1 gwei (opcional para L2)
		},
	},
};

export default config;
