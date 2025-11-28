import { Wallet, ArrowLeftRight, Coins } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

interface WalletState {
	address: string | null;
	balance: number;
}

interface NavbarProps {
	wallet: WalletState;
	onOpenExchange?: () => void;
}

export const Navbar = ({ wallet, onOpenExchange }: NavbarProps) => {
	const { connectWallet, isConnecting } = useWallet();

	const handleConnect = () => {
		connectWallet();
	};

	const isConnected = !!wallet.address;

	return (
		<div className="relative z-50 flex justify-center items-center py-4">
			{!isConnected ? (
				<button
					type="button"
					onClick={handleConnect}
					disabled={isConnecting}
					className="flex items-center gap-2 px-5 py-3 bg-[#1a1b26] border-2 border-slate-700/50 hover:border-slate-600 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 active:shadow-none active:translate-y-1"
				>
					<Wallet className="w-4 h-4 text-slate-400" />
					{isConnecting ? "Conectando..." : "Conectar Wallet"}
				</button>
			) : (
				<div className="flex items-center bg-[#0f0e17] border-2 border-slate-700/50 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden">
					<button
						type="button"
						onClick={onOpenExchange}
						className="flex items-center justify-center w-12 h-12 bg-slate-800/80 hover:bg-slate-700 border-r-2 border-slate-700/50 transition-all group"
					>
						<ArrowLeftRight className="w-5 h-5 text-slate-400 group-hover:text-yellow-400 transition-colors" />
					</button>

					<div className="flex items-center gap-2 px-4 py-2">
						<span className="text-xl font-mono font-black text-white tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
							{wallet.balance.toLocaleString()}
						</span>
						<span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
							fichas
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
