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
		sepolia: {
			type: "http",
			url: process.env.SEPOLIA_URL || configVariable("SEPOLIA_URL"),
			accounts: [
				process.env.SEPOLIA_PRIVATE_KEY ||
					configVariable("SEPOLIA_PRIVATE_KEY"),
			],
			chainId: 11155111,
		},
	},
};

export default config;
