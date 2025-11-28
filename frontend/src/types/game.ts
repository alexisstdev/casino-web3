export type TransactionStatus = typeof import(
	"../constants/game",
).TRANSACTION_STATUS[keyof typeof import(
	"../constants/game",
).TRANSACTION_STATUS];
export type CoinSide = typeof import(
	"../constants/game",
).COIN_SIDE[keyof typeof import("../constants/game").COIN_SIDE];
export type SoundType = typeof import(
	"../constants/game",
).SOUND_TYPE[keyof typeof import("../constants/game").SOUND_TYPE];

export interface GameState {
	streak: number;
	karmaPool: number;
	karmaTarget: number;
}

export interface GameResult {
	win: boolean;
	amount: number;
}

export interface WalletState {
	address: string | null;
	balance: number;
}

export interface BackendGameState {
	address: string;
	streak: number;
	streakMultiplier: number;
	nextMultiplier: number;
	maxMultiplier: number;
	karmaPool: string;
	karmaPoolTokens: number;
	karmaTarget: number;
	karmaProgress: number;
	isKarmaReady: boolean;
	lastUpdate: string;
}

export interface SignFlipResponse {
	streak: number;
	karmaPool: string;
	karmaPoolEth: number;
	isKarmaReady: boolean;
	signature: string;
	nonce: number;
	oracleAddress: string;
}
