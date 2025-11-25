export interface EnvConfig {
	SEPOLIA_URL: string;
	SEPOLIA_PRIVATE_KEY: string;
	SEPOLIA_PUBLIC_KEY: string;
	PINATA_API_KEY: string;
	PINATA_API_SECRET: string;
	NFT_CONTRACT_ADDRESS: string;
	PUBLIC_KEYS: string;
	PRIVATE_KEYS: string;
	PAYMENT_CONTRACT_ADDRESS: string;
	WALLET_CONTRACT_ADDRESS: string;
	PRODUCT_CONTRACT_ADDRESS: string;
	CASINO_GAME_CONTRACT_ADDRESS: string;
	CASINO_TOKEN_CONTRACT_ADDRESS: string;
	ORACLE_PRIVATE_KEY: string;
}

export interface PlayerState {
	address: string;
	streak: number;
	karmaPool: bigint;
	lastUpdate: number;
}

export interface SignFlipRequest {
	playerAddress: string;
	betAmount: string;
}

export interface SignFlipResponse {
	streak: number;
	karmaPool: string;
	isKarmaReady: boolean;
	signature: string;
	nonce: number;
}
