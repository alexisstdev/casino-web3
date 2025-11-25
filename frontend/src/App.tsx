import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "./App.css";
import { Background } from "./components/Background";
import { CoinStage } from "./components/CoinStage";
import { GameControls } from "./components/GameControls";
import { GameStats } from "./components/GameStats";
import { Navbar } from "./components/Navbar";
import { useUIState } from "./hooks/useGameState";
import { useWallet } from "./hooks/useWallet";

const queryClient = new QueryClient();

const AppContent = () => {
	const { wallet, setWallet, updateBalance } = useWallet();
	const { status, setStatus, coinSide, setCoinSide, bet, setBet } =
		useUIState();
	const [lastResult, setLastResult] = useState<{
		win: boolean;
		amount: number;
	} | null>(null);

	return (
		<div className="min-h-screen w-full font-sans text-slate-200 overflow-hidden relative selection:bg-purple-500 selection:text-white flex flex-col">
			<style>{`
				.transform-style-3d { transform-style: preserve-3d; }
				.backface-hidden { backface-visibility: hidden; }
				.perspective-1000 { perspective: 1000px; }
			`}</style>

			<Background />
			<Navbar
				wallet={wallet}
				onWalletConnect={setWallet}
				setStatus={setStatus}
			/>

			<main className="relative z-10 grow flex flex-col p-4 max-w-md mx-auto w-full gap-4">
				<GameStats walletAddress={wallet.address} />
				<CoinStage
					uiState={{ status, coinSide, bet }}
					lastResult={lastResult}
				/>
				<GameControls
					wallet={wallet}
					uiState={{ status, coinSide, bet }}
					onBalanceUpdate={updateBalance}
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
	<QueryClientProvider client={queryClient}>
		<AppContent />
	</QueryClientProvider>
);

export default App;
