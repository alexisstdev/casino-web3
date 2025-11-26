import { Minus, Plus } from "lucide-react";
import { TRANSACTION_STATUS, COIN_SIDE } from "../constants/game";
import { playSound } from "../utils/sound";
import { useFlip } from "../hooks/useApi";
import type { TransactionStatus, CoinSide } from "../types/game";

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

export const GameControls = ({
	uiState,
	onBalanceUpdate,
	onStatusChange,
	onCoinSideChange,
	onBetChange,
	onLastResultChange,
}: GameControlsProps) => {
	const { bet, status } = uiState;

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
			}, 2500);
		},
		(error) => {
			// Error callback
			console.error("Flip error:", error);
			onStatusChange(TRANSACTION_STATUS.IDLE);
		},
		(status) => {
			// Status update callback - para cambiar a MINING cuando se envía la TX
			if (status === "MINING") {
				onStatusChange(TRANSACTION_STATUS.MINING);
			}
		},
	);

	const isDisabled = status !== TRANSACTION_STATUS.IDLE || isPending;

	const handleBetAdjust = (delta: number) => {
		playSound("hover");
		const newBet = Math.max(10, Math.min(1000, bet + delta));
		onBetChange(newBet);
	};

	const handleFlip = (
		choice: typeof COIN_SIDE.HEADS | typeof COIN_SIDE.TAILS,
	) => {
		if (isDisabled) return;
		onStatusChange(TRANSACTION_STATUS.SIGNING);
		flip({ choice, betAmount: bet });
	};

	return (
		<div className="bg-[#13111c] border border-slate-800/60 p-1 rounded-2xl shadow-2xl">
			<div className="flex justify-between items-center bg-black/40 p-3 rounded-xl mb-1 border border-white/5">
				<button
					type="button"
					onClick={() => handleBetAdjust(-10)}
					className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white font-bold text-2xl transition-colors"
				>
					<Minus className="w-6 h-6 mx-auto" />
				</button>

				<div className="flex flex-col items-center">
					<span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
						Apuesta
					</span>
					<span className="text-3xl font-mono font-black text-white tracking-tighter">
						${bet}
					</span>
				</div>

				<button
					type="button"
					onClick={() => handleBetAdjust(10)}
					className="w-12 h-12 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white font-bold text-2xl transition-colors"
				>
					<Plus className="w-6 h-6 mx-auto" />
				</button>
			</div>

			<div className="flex gap-1 mt-1">
				<button
					type="button"
					disabled={isDisabled}
					onClick={() => handleFlip(COIN_SIDE.HEADS)}
					className={`flex-1 py-5 rounded-xl font-black text-xl uppercase tracking-wider transition-all transform active:scale-95 relative overflow-hidden group
            ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"}
            bg-linear-to-b from-blue-600 to-blue-800 shadow-[0_4px_0_#1e3a8a]
          `}
				>
					<span className="relative z-10 flex flex-col items-center leading-none gap-1">
						<span className="text-blue-100">Cara</span>
					</span>
					<div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
				</button>

				<button
					type="button"
					disabled={isDisabled}
					onClick={() => handleFlip(COIN_SIDE.TAILS)}
					className={`flex-1 py-5 rounded-xl font-black text-xl uppercase tracking-wider transition-all transform active:scale-95 relative overflow-hidden group
            ${isDisabled ? "opacity-30 grayscale cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"}
            bg-linear-to-b from-purple-600 to-purple-800 shadow-[0_4px_0_#581c87]
          `}
				>
					<span className="relative z-10 flex flex-col items-center leading-none gap-1">
						<span className="text-purple-100">Cruz</span>
					</span>
					<div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
				</button>
			</div>
		</div>
	);
};
