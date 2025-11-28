import { useState } from "react";
import { useBuyChips } from "../hooks/useBuyChips";
import { useSellChips } from "../hooks/useSellChips";
import { useExchangeRate, useContractBalances } from "../hooks/useExchangeRate";
import { useChipsForEth, useEthForChips } from "../hooks/useExchangeCalculator";
import { useFaucet } from "../hooks/useFaucet";
import { useWallet } from "../hooks/useWallet";
import { useChipBalance } from "../hooks/useChipBalance";

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
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { isConnected } = useWallet();
	const { balance } = useChipBalance();
	const { chipsPerEth, sellFeePercent } = useExchangeRate();
	const { ethBalance, chipsBalance } = useContractBalances();
	const chipsToReceive = useChipsForEth(buyAmount);
	const { ethAmount: ethToReceive, fee: sellFee } = useEthForChips(sellAmount);

	const buyChipsMutation = useBuyChips(
		(data) => {
			setSuccessMessage(
				`¡Compraste ${data.chipsReceived.toLocaleString()} CHIPS!`,
			);
			setBuyAmount("");
			onBalanceUpdate();
			setTimeout(() => setSuccessMessage(null), 3000);
		},
		(error) => {
			console.error("Error buying chips:", error);
		},
	);

	const sellChipsMutation = useSellChips(
		(data) => {
			setSuccessMessage(
				`¡Vendiste ${data.chipsSold.toLocaleString()} CHIPS por ${data.ethReceived.toFixed(6)} ETH!`,
			);
			setSellAmount("");
			onBalanceUpdate();
			setTimeout(() => setSuccessMessage(null), 3000);
		},
		(error) => {
			console.error("Error selling chips:", error);
		},
	);

	const faucetMutation = useFaucet(
		(data) => {
			setSuccessMessage(`¡Recibiste ${data.chipsReceived} CHIPS gratis!`);
			onBalanceUpdate();
			setTimeout(() => setSuccessMessage(null), 3000);
		},
		(error) => {
			console.error("Error with faucet:", error);
		},
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
		if (!sellAmount || Number(sellAmount) <= 0) return;
		if (Number(sellAmount) > balance) return;
		setIsProcessing(true);
		try {
			await sellChipsMutation.mutateAsync({ chipsAmount: sellAmount });
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFaucet = async () => {
		setIsProcessing(true);
		try {
			await faucetMutation.mutateAsync();
		} finally {
			setIsProcessing(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-purple-500/20">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
						💰 Intercambio de CHIPS
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors text-2xl"
					>
						×
					</button>
				</div>

				{/* Success Message */}
				{successMessage && (
					<div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center text-sm">
						{successMessage}
					</div>
				)}

				{/* Tabs */}
				<div className="flex gap-2 mb-6">
					<button
						type="button"
						onClick={() => setActiveTab("buy")}
						className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
							activeTab === "buy"
								? "bg-green-500 text-white"
								: "bg-slate-800 text-slate-400 hover:bg-slate-700"
						}`}
					>
						Comprar
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("sell")}
						className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
							activeTab === "sell"
								? "bg-red-500 text-white"
								: "bg-slate-800 text-slate-400 hover:bg-slate-700"
						}`}
					>
						Vender
					</button>
				</div>

				{/* Exchange Rate Info */}
				<div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm">
					<div className="flex justify-between text-slate-400">
						<span>Tasa de cambio:</span>
						<span className="text-white">
							1 ETH = {chipsPerEth.toLocaleString()} CHIPS
						</span>
					</div>
					{activeTab === "sell" && (
						<div className="flex justify-between text-slate-400 mt-1">
							<span>Fee de venta:</span>
							<span className="text-amber-400">{sellFeePercent}%</span>
						</div>
					)}
				</div>

				{/* Buy Tab */}
				{activeTab === "buy" && (
					<div className="space-y-4">
						<div>
							<label
								htmlFor="buyAmount"
								className="block text-sm text-slate-400 mb-2"
							>
								Cantidad de ETH a gastar
							</label>
							<input
								id="buyAmount"
								type="number"
								step="0.001"
								min="0"
								value={buyAmount}
								onChange={(e) => setBuyAmount(e.target.value)}
								placeholder="0.01"
								className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
							/>
						</div>

						{buyAmount && Number(buyAmount) > 0 && (
							<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
								<div className="flex justify-between">
									<span className="text-slate-400">Recibirás:</span>
									<span className="text-green-400 font-bold">
										{chipsToReceive.toLocaleString()} CHIPS
									</span>
								</div>
							</div>
						)}

						<button
							type="button"
							onClick={handleBuy}
							disabled={isProcessing || !buyAmount || Number(buyAmount) <= 0}
							className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
						>
							{isProcessing ? (
								<span className="flex items-center justify-center gap-2">
									<span className="animate-spin">⏳</span> Procesando...
								</span>
							) : (
								"Comprar CHIPS"
							)}
						</button>
					</div>
				)}

				{/* Sell Tab */}
				{activeTab === "sell" && (
					<div className="space-y-4">
						<div>
							<label
								htmlFor="sellAmount"
								className="block text-sm text-slate-400 mb-2"
							>
								Cantidad de CHIPS a vender
							</label>
							<div className="relative">
								<input
									id="sellAmount"
									type="number"
									step="1"
									min="0"
									max={balance}
									value={sellAmount}
									onChange={(e) => setSellAmount(e.target.value)}
									placeholder="1000"
									className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
								/>
								<button
									type="button"
									onClick={() => setSellAmount(balance.toString())}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-2 py-1 rounded"
								>
									MAX
								</button>
							</div>
							<p className="text-xs text-slate-500 mt-1">
								Balance disponible: {balance.toLocaleString()} CHIPS
							</p>
						</div>

						{sellAmount && Number(sellAmount) > 0 && (
							<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
								<div className="flex justify-between text-sm">
									<span className="text-slate-400">
										Fee ({sellFeePercent}%):
									</span>
									<span className="text-red-400">
										-{sellFee.toFixed(6)} ETH
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-400">Recibirás:</span>
									<span className="text-green-400 font-bold">
										{ethToReceive.toFixed(6)} ETH
									</span>
								</div>
							</div>
						)}

						<button
							type="button"
							onClick={handleSell}
							disabled={
								isProcessing ||
								!sellAmount ||
								Number(sellAmount) <= 0 ||
								Number(sellAmount) > balance
							}
							className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
						>
							{isProcessing ? (
								<span className="flex items-center justify-center gap-2">
									<span className="animate-spin">⏳</span> Procesando...
								</span>
							) : (
								"Vender CHIPS"
							)}
						</button>
					</div>
				)}

				{/* Divider */}
				<div className="border-t border-slate-700 my-6" />

				{/* Faucet Section (Testnet only) */}
				<div className="text-center">
					<p className="text-xs text-slate-500 mb-3">
						🧪 Testnet: Obtén CHIPS gratis para probar
					</p>
					<button
						type="button"
						onClick={handleFaucet}
						disabled={isProcessing || !isConnected}
						className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-all text-sm"
					>
						{isProcessing ? "Procesando..." : "🚰 Faucet (+1000 CHIPS)"}
					</button>
				</div>

				{/* Contract Stats */}
				<div className="mt-6 pt-4 border-t border-slate-800">
					<p className="text-xs text-slate-500 text-center">
						Reservas del contrato: {ethBalance.toFixed(4)} ETH |{" "}
						{chipsBalance.toLocaleString()} CHIPS
					</p>
				</div>
			</div>
		</div>
	);
};
