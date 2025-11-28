import { Bird, CircleDollarSign, Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { COIN_SIDE, TRANSACTION_STATUS } from "../constants/game";
import { useFlip } from "../hooks/useFlip";
import type { CoinSide, TransactionStatus } from "../types/game";
import { playSound } from "../utils/sound";

interface WalletState {
	address: string | null;
	balance: number;
}

interface UIState {
	status: TransactionStatus;
	coinSide: CoinSide;
	bet: number;
}

interface GameControlsProps {
	wallet: WalletState;
	uiState: UIState;
	onBalanceUpdate: () => void;
	onStatusChange: (status: TransactionStatus) => void;
	onCoinSideChange: (side: CoinSide) => void;
	onBetChange: (bet: number) => void;
	onLastResultChange: (result: { win: boolean; amount: number } | null) => void;
}

type SelectedChoice = typeof COIN_SIDE.HEADS | typeof COIN_SIDE.TAILS | null;

export const GameControls = ({
	uiState,
	onBalanceUpdate,
	onStatusChange,
	onCoinSideChange,
	onBetChange,
	onLastResultChange,
}: GameControlsProps) => {
	const { bet, status } = uiState;
	const [selectedChoice, setSelectedChoice] = useState<SelectedChoice>(null);

	const { mutate: flip, isPending } = useFlip(
		(data) => {
			// Success callback - mostrar resultado
			onStatusChange(TRANSACTION_STATUS.RESULT);
			onCoinSideChange(data.coinSide);
			onLastResultChange(data.result);
			onBalanceUpdate();

			// Volver a IDLE después de mostrar el resultado
			setTimeout(() => {
				onStatusChange(TRANSACTION_STATUS.IDLE);
				onLastResultChange(null);
				setSelectedChoice(null);
			}, 2500);
		},
		(error) => {
			// Error callback
			console.error("Flip error:", error);
			onStatusChange(TRANSACTION_STATUS.IDLE);
			setSelectedChoice(null);
		},
		(status) => {
			// Status update callback - para cambiar a MINING cuando se envía la TX
			if (status === "MINING") {
				onStatusChange(TRANSACTION_STATUS.MINING);
			}
		},
	);

	const isProcessing = status !== TRANSACTION_STATUS.IDLE || isPending;
	const isDisabled = isProcessing;

	const handleBetAdjust = useCallback(
		(delta: number) => {
			if (isProcessing) return;
			playSound("hover");
			const newBet = Math.max(10, Math.min(1000, bet + delta));
			onBetChange(newBet);
		},
		[isProcessing, onBetChange, bet],
	);

	const handleFlip = (
		choice: typeof COIN_SIDE.HEADS | typeof COIN_SIDE.TAILS,
	) => {
		if (isDisabled) return;
		setSelectedChoice(choice);
		onStatusChange(TRANSACTION_STATUS.SIGNING);
		flip({ choice, betAmount: bet });
	};

	const getButtonState = (
		buttonChoice: typeof COIN_SIDE.HEADS | typeof COIN_SIDE.TAILS,
	) => {
		if (!isProcessing) return "idle";
		if (selectedChoice === buttonChoice) return "selected";
		return "disabled";
	};

	return (
		<div className="bg-[#0f0e17] border-2 border-slate-700/50 p-3 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
			{/* Decorative top shine */}
			<div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

			{/* Bet adjustment section */}
			<div className="flex justify-between items-center bg-[#1a1b26] p-4 rounded-2xl mb-3 border-2 border-slate-700/30 shadow-inner">
				<button
					type="button"
					onClick={() => handleBetAdjust(-10)}
					disabled={isProcessing}
					className="w-14 h-14 rounded-xl bg-slate-800 border-b-4 border-slate-950 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-b-2 hover:translate-y-0.5 active:border-b-0 active:translate-y-1 font-black text-2xl transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Minus className="w-6 h-6" />
				</button>

				<div className="flex flex-col items-center">
					<span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">
						Apuesta
					</span>
					<div className="bg-black/50 px-6 py-2 rounded-xl border-2 border-slate-700/50 shadow-inner">
						<span className="text-4xl font-mono font-black text-white tracking-tighter drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]">
							${bet}
						</span>
					</div>
				</div>

				<button
					type="button"
					onClick={() => handleBetAdjust(10)}
					disabled={isProcessing}
					className="w-14 h-14 rounded-xl bg-slate-800 border-b-4 border-slate-950 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-b-2 hover:translate-y-0.5 active:border-b-0 active:translate-y-1 font-black text-2xl transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Plus className="w-6 h-6" />
				</button>
			</div>

			{/* Flip buttons */}
			<div className="flex gap-3">
				<button
					type="button"
					disabled={isDisabled}
					onClick={() => handleFlip(COIN_SIDE.HEADS)}
					className={`flex-1 py-5 rounded-2xl font-black text-xl transition-all relative overflow-hidden group
						${
							getButtonState(COIN_SIDE.HEADS) === "selected"
								? "bg-amber-600 border-b-0 translate-y-1 shadow-[0_0_30px_rgba(217,119,6,0.6)]"
								: getButtonState(COIN_SIDE.HEADS) === "disabled"
									? "opacity-30 grayscale cursor-not-allowed bg-slate-800 border-b-4 border-slate-900"
									: "bg-linear-to-b from-amber-500 to-amber-700 border-b-4 border-amber-900 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] active:translate-y-0.5 active:border-b-0"
						}
					`}
				>
					<span className="relative z-10 flex flex-col items-center gap-1">
						<Bird className="w-10 h-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" />
						<span className="text-amber-100 text-xs font-black tracking-[0.2em]">
							ÁGUILA
						</span>
					</span>
					{getButtonState(COIN_SIDE.HEADS) === "idle" && (
						<div className="absolute inset-0 bg-linear-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
					)}
					{getButtonState(COIN_SIDE.HEADS) === "selected" && (
						<div className="absolute inset-0 bg-amber-400/20 animate-pulse" />
					)}
				</button>

				<button
					type="button"
					disabled={isDisabled}
					onClick={() => handleFlip(COIN_SIDE.TAILS)}
					className={`flex-1 py-5 rounded-2xl font-black text-xl transition-all relative overflow-hidden group
						${
							getButtonState(COIN_SIDE.TAILS) === "selected"
								? "bg-emerald-600 border-b-0 translate-y-1 shadow-[0_0_30px_rgba(16,185,129,0.6)]"
								: getButtonState(COIN_SIDE.TAILS) === "disabled"
									? "opacity-30 grayscale cursor-not-allowed bg-slate-800 border-b-4 border-slate-900"
									: "bg-linear-to-b from-emerald-500 to-emerald-700 border-b-4 border-emerald-900 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:translate-y-0.5 active:border-b-0"
						}
					`}
				>
					<span className="relative z-10 flex flex-col items-center gap-1">
						<CircleDollarSign className="w-10 h-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" />
						<span className="text-emerald-100 text-xs font-black tracking-[0.2em]">
							SELLO
						</span>
					</span>
					{getButtonState(COIN_SIDE.TAILS) === "idle" && (
						<div className="absolute inset-0 bg-linear-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
					)}
					{getButtonState(COIN_SIDE.TAILS) === "selected" && (
						<div className="absolute inset-0 bg-emerald-400/20 animate-pulse" />
					)}
				</button>
			</div>
		</div>
	);
};
