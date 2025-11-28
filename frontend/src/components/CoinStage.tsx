import { Bird, CircleDollarSign } from "lucide-react";
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

	// Determinar la rotación final basada en el resultado
	const getFinalRotation = () => {
		if (isSpinning) return "rotateY(0deg)";
		// HEADS = 0deg (frente), TAILS = 180deg (reverso)
		return coinSide === COIN_SIDE.TAILS ? "rotateY(180deg)" : "rotateY(0deg)";
	};

	return (
		<div
			className="grow flex flex-col items-center justify-center relative min-h-[280px]"
			style={{ perspective: "1200px" }}
		>
			{/* CSS para animación de giro realista */}
			<style>{`
				@keyframes realisticCoinFlip {
					0% {
						transform: rotateY(0deg);
					}
					100% {
						transform: rotateY(1080deg);
					}
				}
			`}</style>

			{/* Result display */}
			{showResult && (
				<div className="absolute top-4 z-30 animate-bounce">
					<div
						className={`px-5 py-2 rounded-2xl border-4 backdrop-blur-sm shadow-2xl ${
							lastResult.win
								? "bg-green-900/80 border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.4)]"
								: "bg-red-900/80 border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.4)]"
						}`}
					>
						<span
							className={`text-3xl font-black font-mono tracking-tight ${
								lastResult.win ? "text-green-400" : "text-red-400"
							} drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]`}
						>
							{lastResult.win
								? `+${lastResult.amount}`
								: `-${lastResult.amount}`}
						</span>
					</div>
				</div>
			)}

			{/* 3D Coin Container */}
			<div
				className={`relative w-52 h-52 transition-transform ${isSpinning ? "" : "duration-700"}`}
				style={{
					transformStyle: "preserve-3d",
					transform: getFinalRotation(),
					animation: isSpinning
						? "realisticCoinFlip 0.8s linear infinite"
						: undefined,
				}}
			>
				{/* HEADS side (front) - Águila (Amber/Dorado) */}
				<div
					className="absolute inset-0 rounded-full border-[6px] border-amber-400 flex items-center justify-center bg-linear-to-br from-amber-700 via-amber-800 to-amber-900 shadow-[0_0_60px_rgba(217,119,6,0.4),inset_0_-8px_20px_rgba(0,0,0,0.6)]"
					style={{
						backfaceVisibility: "hidden",
					}}
				>
					{/* Inner ring decoration */}
					<div className="absolute inset-3 rounded-full border-2 border-amber-500/30" />
					<div className="absolute inset-5 rounded-full border border-amber-500/20" />
					{/* Edge effect - simula el grosor de la moneda */}
					<div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(217,119,6,0.3)]" />
					{/* Symbol */}
					<Bird className="w-24 h-24 text-amber-300 drop-shadow-[0_0_20px_rgba(217,119,6,0.8)]" />
					{/* Shine effect */}
					<div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
				</div>

				{/* TAILS side (back) - Sello (Emerald/Verde) */}
				<div
					className="absolute inset-0 rounded-full border-[6px] border-emerald-400 flex items-center justify-center bg-linear-to-br from-emerald-700 via-emerald-800 to-emerald-900 shadow-[0_0_60px_rgba(16,185,129,0.4),inset_0_-8px_20px_rgba(0,0,0,0.6)]"
					style={{
						backfaceVisibility: "hidden",
						transform: "rotateY(180deg)",
					}}
				>
					{/* Inner ring decoration */}
					<div className="absolute inset-3 rounded-full border-2 border-emerald-500/30" />
					<div className="absolute inset-5 rounded-full border border-emerald-500/20" />
					{/* Edge effect */}
					<div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(16,185,129,0.3)]" />
					{/* Symbol */}
					<CircleDollarSign className="w-24 h-24 text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
					{/* Shine effect */}
					<div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
				</div>
			</div>

			{/* Status indicator */}
			<div className="absolute bottom-6 text-center">
				<div
					className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all ${
						status === TRANSACTION_STATUS.IDLE
							? "border-slate-700 bg-slate-900/60 text-slate-500"
							: status === TRANSACTION_STATUS.RESULT
								? lastResult?.win
									? "border-green-500/50 bg-green-900/30 text-green-400"
									: "border-red-500/50 bg-red-900/30 text-red-400"
								: "border-yellow-500/50 bg-yellow-900/30 text-yellow-400"
					}`}
				>
					{status !== TRANSACTION_STATUS.IDLE &&
						status !== TRANSACTION_STATUS.RESULT && (
							<span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
						)}
					{status === TRANSACTION_STATUS.RESULT && (
						<span
							className={`w-2 h-2 rounded-full ${lastResult?.win ? "bg-green-400" : "bg-red-400"}`}
						/>
					)}
					<p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
						{status === TRANSACTION_STATUS.IDLE && "LISTO"}
						{status === TRANSACTION_STATUS.SIGNING && "FIRMANDO..."}
						{status === TRANSACTION_STATUS.MINING && "PROCESANDO..."}
						{status === TRANSACTION_STATUS.RESULT &&
							(lastResult?.win ? "¡GANASTE!" : "PERDISTE")}
					</p>
				</div>
			</div>
		</div>
	);
};
