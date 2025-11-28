import { Droplets, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useBuyChips } from "../hooks/useBuyChips";
import { useChipBalance } from "../hooks/useChipBalance";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { useFaucet } from "../hooks/useFaucet";
import { useSellChips } from "../hooks/useSellChips";
import { useWallet } from "../hooks/useWallet";

type TabType = "buy" | "sell";

interface ChipExchangeProps {
	isOpen: boolean;
	onClose: () => void;
	onBalanceUpdate: () => void;
}

export const ChipExchange = ({
	isOpen,
	onClose,
	onBalanceUpdate,
}: ChipExchangeProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("buy");
	const [buyAmount, setBuyAmount] = useState("");
	const [sellAmount, setSellAmount] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	const { isConnected } = useWallet();
	const { balance } = useChipBalance();
	const { chipsPerEth, sellFeePercent } = useExchangeRate();

	const buyChipsMutation = useBuyChips(
		() => {
			setBuyAmount("");
			onBalanceUpdate();
			onClose();
		},
		(error) => console.error("Error buying chips:", error),
	);

	const sellChipsMutation = useSellChips(
		() => {
			setSellAmount("");
			onBalanceUpdate();
			onClose();
		},
		(error) => console.error("Error selling chips:", error),
	);

	const faucetMutation = useFaucet(
		() => {
			onBalanceUpdate();
			onClose();
		},
		(error) => console.error("Error with faucet:", error),
	);

	const handleBuy = async () => {
		if (!buyAmount || Number(buyAmount) <= 0) return;
		setIsProcessing(true);
		try {
			await buyChipsMutation.mutateAsync({ ethAmount: buyAmount });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSell = async () => {
		if (!sellAmount || Number(sellAmount) <= 0 || Number(sellAmount) > balance)
			return;
		setIsProcessing(true);
		try {
			await sellChipsMutation.mutateAsync({ chipsAmount: sellAmount });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFaucet = async () => {
		if (!isConnected) return;
		setIsProcessing(true);
		try {
			await faucetMutation.mutateAsync();
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<>
			{!isOpen ? null : (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
					<div className="bg-[#0f0e17] border-2 border-slate-700/50 p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-xs relative overflow-hidden">
						{/* Decorative top shine */}
						<div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

						{/* Header */}
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<span className="font-black text-white text-sm uppercase tracking-wider">
									Intercambio
								</span>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors group"
							>
								<X className="w-4 h-4 text-slate-500 group-hover:text-white" />
							</button>
						</div>

						{/* Tabs - minimal style */}
						<div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl mb-4">
							<button
								type="button"
								onClick={() => setActiveTab("buy")}
								className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
									activeTab === "buy"
										? "bg-slate-700 text-white"
										: "text-slate-500 hover:text-slate-300"
								}`}
							>
								Comprar
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("sell")}
								className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
									activeTab === "sell"
										? "bg-slate-700 text-white"
										: "text-slate-500 hover:text-slate-300"
								}`}
							>
								Vender
							</button>
						</div>

						{/* Rate info */}
						<p className="text-[10px] text-slate-500 text-center mb-4 font-mono">
							1 ETH = {chipsPerEth.toLocaleString()} fichas
							{activeTab === "sell" && (
								<span className="text-orange-400">
									{" "}
									· {sellFeePercent}% fee
								</span>
							)}
						</p>

						{/* Buy Tab */}
						{activeTab === "buy" && (
							<div className="space-y-4">
								{/* Input */}
								<div className="bg-[#1a1b26] p-3 rounded-2xl border-2 border-slate-700/30">
									<span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block text-center mb-2">
										ETH a enviar
									</span>
									<input
										type="number"
										step="0.001"
										min="0"
										value={buyAmount}
										onChange={(e) => setBuyAmount(e.target.value)}
										placeholder="0.00"
										className="w-full bg-black/40 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-white border border-slate-700/50 focus:outline-none focus:border-slate-600 placeholder:text-slate-600"
									/>
								</div>

								{/* Buy button */}
								<button
									type="button"
									onClick={handleBuy}
									disabled={
										isProcessing || !buyAmount || Number(buyAmount) <= 0
									}
									className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2
										${
											isProcessing || !buyAmount || Number(buyAmount) <= 0
												? "bg-slate-800 text-slate-600 cursor-not-allowed"
												: "bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/25"
										}
									`}
								>
									{isProcessing ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										"Comprar Fichas"
									)}
								</button>
							</div>
						)}

						{/* Sell Tab */}
						{activeTab === "sell" && (
							<div className="space-y-4">
								{/* Input */}
								<div className="bg-[#1a1b26] p-3 rounded-2xl border-2 border-slate-700/30">
									<span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block text-center mb-2">
										Fichas a vender
									</span>
									<div className="relative">
										<input
											type="number"
											step="1"
											min="0"
											max={balance}
											value={sellAmount}
											onChange={(e) => setSellAmount(e.target.value)}
											placeholder="0"
											className="w-full bg-black/40 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-white border border-slate-700/50 focus:outline-none focus:border-slate-600 placeholder:text-slate-600"
										/>
										<button
											type="button"
											onClick={() => setSellAmount(balance.toString())}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600 transition-colors"
										>
											MAX
										</button>
									</div>
									<p className="text-[10px] text-slate-600 text-center mt-2">
										Disponible: {balance.toLocaleString()}
									</p>
								</div>

								{/* Sell button */}
								<button
									type="button"
									onClick={handleSell}
									disabled={
										isProcessing ||
										!sellAmount ||
										Number(sellAmount) <= 0 ||
										Number(sellAmount) > balance
									}
									className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2
										${
											isProcessing ||
											!sellAmount ||
											Number(sellAmount) <= 0 ||
											Number(sellAmount) > balance
												? "bg-slate-800 text-slate-600 cursor-not-allowed"
												: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25"
										}
									`}
								>
									{isProcessing ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										"Vender Fichas"
									)}
								</button>
							</div>
						)}

						{/* Faucet (testnet) */}
						<div className="mt-4 pt-3 border-t border-slate-800/50">
							<button
								type="button"
								onClick={handleFaucet}
								disabled={isProcessing || !isConnected}
								className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-medium text-slate-600 hover:text-purple-400 disabled:text-slate-700 transition-colors"
							>
								<Droplets className="w-3 h-3" />
								{isProcessing ? "..." : "+1000 fichas gratis (testnet)"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
