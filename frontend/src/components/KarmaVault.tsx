import { useState } from "react";
import { HelpCircle, Lock, Unlock } from "lucide-react";
import { Dialog } from "./Dialog";

interface KarmaVaultProps {
	currentAmount: number;
	targetAmount: number;
	progress: number;
	isReady: boolean;
}

export const KarmaVault = ({
	currentAmount,
	targetAmount,
	progress,
	isReady,
}: KarmaVaultProps) => {
	const [showHelp, setShowHelp] = useState(false);

	return (
		<>
			<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 relative group">
				<div className="relative">
					{isReady ? (
						<Unlock className="w-4 h-4 text-purple-400" />
					) : (
						<Lock className="w-4 h-4 text-slate-600" />
					)}
				</div>

				{/* Mini barra de progreso */}
				<div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full transition-all duration-300 ${
							isReady ? "bg-purple-400" : "bg-purple-600/50"
						}`}
						style={{ width: `${progress}%` }}
					/>
				</div>

				<span
					className={`text-sm font-bold font-mono ${
						isReady ? "text-purple-400" : "text-slate-500"
					}`}
				>
					{currentAmount.toFixed(0)}
				</span>

				<button
					type="button"
					onClick={() => setShowHelp(true)}
					className="ml-1"
				>
					<HelpCircle className="w-3 h-3 text-slate-600 hover:text-slate-400" />
				</button>
			</div>

			<Dialog
				isOpen={showHelp}
				onClose={() => setShowHelp(false)}
				title="Recuperación"
			>
				<p className="text-xs text-slate-400 leading-relaxed">
					Al perder, el <span className="text-white">10%</span> de tu apuesta se
					acumula. Al llegar a{" "}
					<span className="text-purple-400">{targetAmount} fichas</span>, tu
					próxima victoria lo libera.
				</p>
			</Dialog>
		</>
	);
};
