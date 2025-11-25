import { useState } from "react";
import type { CoinSide, TransactionStatus } from "../types/game";
import { TRANSACTION_STATUS, COIN_SIDE } from "../constants/game";

interface UseUIStateReturn {
	status: TransactionStatus;
	setStatus: (status: TransactionStatus) => void;
	coinSide: CoinSide;
	setCoinSide: (side: CoinSide) => void;
	bet: number;
	setBet: (bet: number) => void;
	adjustBet: (delta: number, maxBalance: number) => void;
}

export const useUIState = (): UseUIStateReturn => {
	const [status, setStatus] = useState<TransactionStatus>(
		TRANSACTION_STATUS.DISCONNECTED,
	);
	const [coinSide, setCoinSide] = useState<CoinSide>(COIN_SIDE.HEADS);
	const [bet, setBet] = useState(100);

	const adjustBet = (delta: number, maxBalance: number) => {
		setBet((prev) => {
			const newBet = prev + delta;
			return Math.max(10, Math.min(maxBalance, newBet));
		});
	};

	return {
		status,
		setStatus,
		coinSide,
		setCoinSide,
		bet,
		setBet,
		adjustBet,
	};
};
