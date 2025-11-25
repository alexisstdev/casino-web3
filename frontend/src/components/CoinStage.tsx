import { TRANSACTION_STATUS, COIN_SIDE } from "../constants/game";
import type { TransactionStatus, CoinSide } from "../types/game";

interface UIState {
	status: TransactionStatus;
	coinSide: CoinSide;
	bet: number;
}

interface LastResult {
	win: boolean;
	amount: number;
}

interface CoinStageProps {
	uiState: UIState;
	lastResult: LastResult | null;
}

export const CoinStage = ({ uiState, lastResult }: CoinStageProps) => {
	const { status, coinSide } = uiState;

	const isSpinning =
		status === TRANSACTION_STATUS.MINING ||
		status === TRANSACTION_STATUS.SIGNING;
	const showResult = status === TRANSACTION_STATUS.RESULT && lastResult;

	return (
		<div className="grow flex flex-col items-center justify-center relative perspective-1000 min-h-[250px]">
			{showResult && (
				<div className="absolute top-0 z-30 animate-bounce">
					<span
						className={`text-4xl font-black drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] ${lastResult.win ? "text-green-400" : "text-red-400"}`}
					>
						{lastResult.win ? `+${lastResult.amount}` : `-${lastResult.amount}`}
					</span>
				</div>
			)}

			<div
				className={`relative w-48 h-48 transition-transform duration-700 transform-style-3d 
        ${isSpinning ? "animate-[spin_0.8s_linear_infinite]" : ""}
      `}
			>
				<div
					className={`absolute inset-0 rounded-full border-4 shadow-[0_0_60px_rgba(59,130,246,0.2)] flex items-center justify-center backface-hidden bg-linear-to-br from-slate-800 to-slate-950
          ${coinSide === COIN_SIDE.HEADS ? "border-blue-500" : "border-slate-700 opacity-0"}
        `}
				>
					<span className="text-7xl font-black text-blue-500 drop-shadow-lg">
						Ξ
					</span>
				</div>

				<div
					className={`absolute inset-0 rounded-full border-4 shadow-[0_0_60px_rgba(168,85,247,0.2)] flex items-center justify-center backface-hidden bg-linear-to-br from-slate-800 to-slate-950
          ${coinSide === COIN_SIDE.TAILS ? "border-purple-500" : "border-slate-700 opacity-0"}
        `}
				>
					<span className="text-7xl font-black text-purple-500 drop-shadow-lg">
						◈
					</span>
				</div>
			</div>

			<div className="absolute bottom-4 text-center">
				<p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
					{status === TRANSACTION_STATUS.IDLE ? "SISTEMA LISTO" : status}
				</p>
			</div>
		</div>
	);
};
