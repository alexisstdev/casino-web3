import { Wallet, ArrowLeftRight } from "lucide-react";
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
		<nav className="relative z-50 flex justify-between items-center p-4 border-b border-white/5 bg-[#0f0c18]/80 backdrop-blur-md h-20">
			<div />

			{!isConnected ? (
				<button
					type="button"
					onClick={handleConnect}
					disabled={isConnecting}
					className="group relative px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
				>
					<span className="relative z-10 flex items-center gap-2">
						<Wallet className="w-4 h-4" />{" "}
						{isConnecting ? "Conectando..." : "Conectar"}
					</span>
					<div className="absolute inset-0 bg-linear-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
				</button>
			) : (
				<div className="flex items-center gap-2">
					{/* Exchange Button */}
					<button
						type="button"
						onClick={onOpenExchange}
						className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full text-purple-400 hover:text-purple-300 transition-all text-xs font-medium"
						title="Comprar/Vender CHIPS"
					>
						<ArrowLeftRight className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">Exchange</span>
					</button>

					{/* Wallet Info */}
					<div className="flex items-center gap-3 bg-slate-900/50 rounded-full pl-4 pr-1 py-1 border border-white/10">
						<div className="flex flex-col items-end leading-none mr-2">
							<span className="text-[9px] uppercase font-bold text-slate-500">
								Saldo
							</span>
							<span className="text-sm font-mono font-bold text-yellow-400 flex items-center gap-1">
								{wallet.balance.toLocaleString()} CHIP
							</span>
						</div>
						<div className="w-8 h-8 bg-slate-800 rounded-full border border-green-500/30 flex items-center justify-center">
							<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};
