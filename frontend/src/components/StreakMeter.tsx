import { useState } from "react";
import { Flame, HelpCircle } from "lucide-react";
import { Dialog } from "./Dialog";

interface StreakMeterProps {
	streak: number;
	currentMultiplier: number;
}

export const StreakMeter = ({
	streak,
	currentMultiplier,
}: StreakMeterProps) => {
	const [showHelp, setShowHelp] = useState(false);
	const hasStreak = streak > 0;

	return (
		<>
			<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 relative group">
				<Flame
					className={`w-4 h-4 transition-colors ${
						hasStreak ? "text-orange-400" : "text-slate-600"
					}`}
					fill={hasStreak ? "currentColor" : "none"}
				/>
				<span
					className={`text-sm font-bold font-mono ${
						hasStreak ? "text-orange-400" : "text-slate-500"
					}`}
				>
					{currentMultiplier.toFixed(1)}x
				</span>
				{hasStreak && (
					<span className="text-xs text-slate-500">({streak})</span>
				)}
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
				title="Racha"
			>
				<p className="text-xs text-slate-400 leading-relaxed">
					Gana seguido para aumentar tu multiplicador. Cada victoria suma{" "}
					<span className="text-white">+0.1x</span> hasta un máximo de{" "}
					<span className="text-white">2.4x</span>. Si pierdes, vuelve a 1.9x.
				</p>
			</Dialog>
		</>
	);
};
