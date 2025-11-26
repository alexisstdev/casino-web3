import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState, useEffect } from "react";
import "./App.css";
import "./manifest.json";
import { Background } from "./components/Background";
import { CoinStage } from "./components/CoinStage";
import { GameControls } from "./components/GameControls";
import { GameStats } from "./components/GameStats";
import { Navbar } from "./components/Navbar";
import { useUIState } from "./hooks/useGameState";
import { useWalletConnection } from "./hooks/useApi";
import { wagmiConfig } from "./config/wagmi";
import { TRANSACTION_STATUS } from "./constants/game";

const queryClient = new QueryClient();

const AppContent = () => {
	const { status, setStatus, coinSide, setCoinSide, bet, setBet } =
		useUIState();
	const [lastResult, setLastResult] = useState<{
		win: boolean;
		amount: number;
	} | null>(null);

	const { address, isConnected, balance, refetchBalance } =
		useWalletConnection();

	// Actualizar status cuando se conecta/desconecta
	useEffect(() => {
		if (isConnected && status === TRANSACTION_STATUS.DISCONNECTED) {
			setStatus(TRANSACTION_STATUS.IDLE);
		} else if (!isConnected && status !== TRANSACTION_STATUS.DISCONNECTED) {
			setStatus(TRANSACTION_STATUS.DISCONNECTED);
		}
	}, [isConnected, status, setStatus]);

	return (
		<div className="min-h-screen w-full font-sans text-slate-200 overflow-hidden relative selection:bg-purple-500 selection:text-white flex flex-col">
			<style>{`
				.transform-style-3d { transform-style: preserve-3d; }
				.backface-hidden { backface-visibility: hidden; }
				.perspective-1000 { perspective: 1000px; }
			`}</style>

			<Background />
			<Navbar wallet={{ address, balance }} />

			<main className="relative z-10 grow flex flex-col p-4 max-w-md mx-auto w-full gap-4">
				<GameStats walletAddress={address} />
				<CoinStage
					uiState={{ status, coinSide, bet }}
					lastResult={lastResult}
				/>
				<GameControls
					wallet={{ address, balance }}
					uiState={{ status, coinSide, bet }}
					onBalanceUpdate={() => refetchBalance()}
					onStatusChange={setStatus}
					onCoinSideChange={setCoinSide}
					onBetChange={setBet}
					onLastResultChange={setLastResult}
				/>
			</main>
		</div>
	);
};

const App = () => (
	<WagmiProvider config={wagmiConfig}>
		<QueryClientProvider client={queryClient}>
			<AppContent />
		</QueryClientProvider>
	</WagmiProvider>
);

export default App;
