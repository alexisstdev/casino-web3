export const GAME_CONFIG = {
	MIN_BET: 10,
	BET_STEP: 10,
	KARMA_TARGET: 100,
	WIN_MULTIPLIER: 1.9,
	KARMA_PERCENTAGE: 0.1,
	STREAK_BONUS_MULTIPLIER: 0.1,
	MAX_STREAK_BONUS: 0.5,
} as const;

export const TRANSACTION_STATUS = {
	DISCONNECTED: "DISCONNECTED",
	IDLE: "IDLE",
	SIGNING: "SIGNING",
	MINING: "MINING",
	RESULT: "RESULT",
} as const;

export const COIN_SIDE = {
	HEADS: "HEADS",
	TAILS: "TAILS",
} as const;

export const SOUND_TYPE = {
	HOVER: "hover",
	CLICK: "click",
	SIGN: "sign",
	COIN: "coin",
} as const;
