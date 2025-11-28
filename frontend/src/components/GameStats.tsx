import { useBackendGameState } from "../hooks/useBackendGameState";
import { StreakMeter } from "./StreakMeter";
import { KarmaVault } from "./KarmaVault";

interface GameStatsProps {
	walletAddress: string | null;
}

export const GameStats = ({ walletAddress }: GameStatsProps) => {
	const { data: gameState } = useBackendGameState(walletAddress);

	if (!walletAddress) {
		return null;
	}

	return (
		<div className="flex items-center justify-center gap-3">
			<StreakMeter
				streak={gameState?.streak || 0}
				currentMultiplier={gameState?.streakMultiplier || 1.9}
			/>
			<KarmaVault
				currentAmount={gameState?.karmaPoolTokens || 0}
				targetAmount={gameState?.karmaTarget || 100}
				progress={gameState?.karmaProgress || 0}
				isReady={gameState?.isKarmaReady || false}
			/>
		</div>
	);
};
