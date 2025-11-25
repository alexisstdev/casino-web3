import { useState } from "react";

interface WalletState {
	address: string | null;
	balance: number;
}

interface UseWalletReturn {
	wallet: WalletState;
	setWallet: (wallet: WalletState) => void;
	updateBalance: (delta: number) => void;
}

export const useWallet = (): UseWalletReturn => {
	const [wallet, setWallet] = useState<WalletState>({
		address: null,
		balance: 0,
	});

	const updateBalance = (delta: number) => {
		setWallet((prev) => ({
			...prev,
			balance: prev.balance + delta,
		}));
	};

	return {
		wallet,
		setWallet,
		updateBalance,
	};
};
