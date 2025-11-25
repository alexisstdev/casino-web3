import { useGameState } from "../hooks/useApi";
import { StatCard } from "./StatCard";

interface GameStatsProps {
	walletAddress: string | null;
}

export const GameStats = ({ walletAddress }: GameStatsProps) => {
	const { data: gameState } = useGameState(walletAddress);

	if (!walletAddress) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
			<StatCard
				title="Racha"
				value={`${gameState?.streak || 0}x`}
				icon="🔥"
				color="orange"
			/>
			<StatCard
				title={`Pool Karma (Estado: ${gameState?.isKarmaReady ? "Desbloqueado" : "Bloqueado"})`}
				value={`${gameState?.karmaPoolEth?.toFixed(2) || "0.00"} ETH`}
				icon="⚡"
				color="purple"
			/>
		</div>
	);
};
