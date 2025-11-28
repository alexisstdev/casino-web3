import React, { useState, useEffect, useRef } from "react";
import {
	Wallet,
	Coins,
	RefreshCw,
	Zap,
	Lock,
	Unlock,
	ArrowRightLeft,
	TrendingUp,
	AlertTriangle,
	X,
	ArrowDown,
	Sparkles,
} from "lucide-react";
import "./App.css";

// --- UTILIDADES VISUALES Y DE AUDIO ---

const playSound = (type) => {
	// Simulación de motor de audio (Sintetizador Web Audio API)
	// En producción, esto sería un hook más robusto
	try {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) return;
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		const now = ctx.currentTime;

		if (type === "click") {
			osc.type = "triangle";
			osc.frequency.setValueAtTime(800, now);
			osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
			gain.gain.setValueAtTime(0.1, now);
			gain.gain.linearRampToValueAtTime(0, now + 0.1);
		} else if (type === "coin") {
			osc.type = "sine";
			osc.frequency.setValueAtTime(1200, now);
			osc.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
			gain.gain.setValueAtTime(0.1, now);
			gain.gain.linearRampToValueAtTime(0, now + 0.5);
		} else if (type === "error") {
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(200, now);
			osc.frequency.linearRampToValueAtTime(100, now + 0.3);
			gain.gain.setValueAtTime(0.1, now);
			gain.gain.linearRampToValueAtTime(0, now + 0.3);
		} else if (type === "open_store") {
			osc.type = "sine";
			osc.frequency.setValueAtTime(400, now);
			osc.frequency.linearRampToValueAtTime(800, now + 0.2);
			gain.gain.setValueAtTime(0.1, now);
			gain.gain.linearRampToValueAtTime(0, now + 0.3);
		}

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.5);
	} catch (e) {}
};

const vibrate = (pattern = 10) => {
	if (navigator.vibrate) navigator.vibrate(pattern);
};

// --- COMPONENTES UI ATÓMICOS ---

const Background = () => (
	<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0a12]">
		{/* Gradiente Base */}
		<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,0.15),transparent_70%)]" />

		{/* Grid animado */}
		<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-50" />

		{/* Efecto CRT Scanlines */}
		<div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-60 mix-blend-overlay" />

		{/* Vignette */}
		<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
	</div>
);

const Card = ({ children, className = "", glow = "none", onClick }) => {
	const glowStyles = {
		none: "border-slate-800 bg-slate-900/80",
		blue: "border-blue-500/50 bg-blue-950/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
		purple:
			"border-purple-500/50 bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
		gold: "border-amber-500/50 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
		red: "border-red-500/50 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
	};

	return (
		<div
			onClick={onClick}
			className={`relative rounded-xl border backdrop-blur-md transition-all duration-300 ${glowStyles[glow]} ${className}`}
		>
			{/* Efecto de brillo interior */}
			<div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
			{children}
		</div>
	);
};

// --- MODAL DE INTERCAMBIO (Estilo Clash Royale/Tienda) ---
const ExchangeModal = ({ isOpen, onClose, balanceEth, balanceChips }) => {
	const [mode, setMode] = useState("BUY"); // BUY | SELL
	const [amount, setAmount] = useState("");
	const [isSimulating, setIsSimulating] = useState(false);

	if (!isOpen) return null;

	const RATE = 10000; // 1 ETH = 10,000 CHIPS

	const calculatedValue = amount
		? mode === "BUY"
			? parseFloat(amount) * RATE
			: parseFloat(amount) / RATE
		: 0;

	const handleAction = () => {
		setIsSimulating(true);
		playSound("click");
		setTimeout(() => {
			setIsSimulating(false);
			setAmount("");
			playSound("coin");
		}, 1500);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
				onClick={onClose}
			/>

			<div className="relative w-full max-w-md bg-[#13111a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header Tienda */}
				<div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/50">
							<ArrowRightLeft className="w-5 h-5 text-blue-400" />
						</div>
						<div>
							<h2 className="text-white font-bold text-lg leading-none">
								Intercambio
							</h2>
							<span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
								CHIP Exchange Protocol
							</span>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-white/10 rounded-full transition-colors"
					>
						<X className="w-5 h-5 text-slate-400" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex p-2 bg-black/20 gap-2">
					<button
						onClick={() => {
							setMode("BUY");
							playSound("click");
						}}
						className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === "BUY" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-white/5"}`}
					>
						Comprar Chips
					</button>
					<button
						onClick={() => {
							setMode("SELL");
							playSound("click");
						}}
						className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === "SELL" ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:bg-white/5"}`}
					>
						Vender Chips
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Tasa de Cambio */}
					<div className="flex justify-center">
						<div className="bg-slate-900/50 border border-slate-700 rounded-full px-4 py-1 flex items-center gap-2 text-xs font-mono text-slate-400">
							<span>1 ETH</span>
							<ArrowRightLeft className="w-3 h-3" />
							<span className="text-blue-400 font-bold">
								{RATE.toLocaleString()} CHIPS
							</span>
						</div>
					</div>

					{/* Inputs */}
					<div className="space-y-4 relative">
						{/* Input Superior */}
						<div className="bg-slate-900 rounded-xl p-3 border border-slate-700 focus-within:border-blue-500 transition-colors">
							<div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase">
								<span>{mode === "BUY" ? "Pagas con ETH" : "Vendes CHIPS"}</span>
								<span>
									Saldo:{" "}
									{mode === "BUY"
										? balanceEth.toFixed(4)
										: balanceChips.toLocaleString()}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0.0"
									className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none placeholder-slate-600"
								/>
								<div
									className={`px-3 py-1 rounded font-bold text-xs ${mode === "BUY" ? "bg-slate-700 text-slate-300" : "bg-blue-900/50 text-blue-300 border border-blue-500/30"}`}
								>
									{mode === "BUY" ? "ETH" : "CHIP"}
								</div>
							</div>
						</div>

						{/* Icono flecha central */}
						<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center z-10 shadow-lg">
							<ArrowDown className="w-4 h-4 text-slate-400" />
						</div>

						{/* Input Inferior (Readonly) */}
						<div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
							<div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase">
								<span>{mode === "BUY" ? "Recibes CHIPS" : "Recibes ETH"}</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-full text-2xl font-mono font-bold text-slate-300">
									{calculatedValue > 0
										? calculatedValue.toLocaleString()
										: "0.0"}
								</div>
								<div
									className={`px-3 py-1 rounded font-bold text-xs ${mode === "BUY" ? "bg-blue-900/50 text-blue-300 border border-blue-500/30" : "bg-slate-700 text-slate-300"}`}
								>
									{mode === "BUY" ? "CHIP" : "ETH"}
								</div>
							</div>
						</div>
					</div>

					{/* Botón de Acción Principal */}
					<button
						onClick={handleAction}
						disabled={!amount || isSimulating}
						className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${
															mode === "BUY"
																? "bg-gradient-to-b from-blue-500 to-blue-700 shadow-blue-900/50 border-t border-blue-400 text-white"
																: "bg-gradient-to-b from-amber-500 to-amber-700 shadow-amber-900/50 border-t border-amber-400 text-white"
														}
                        `}
					>
						{isSimulating
							? "Procesando..."
							: mode === "BUY"
								? "Confirmar Compra"
								: "Confirmar Venta"}
					</button>

					{/* Faucet Section (Testnet Gift) */}
					<div className="pt-4 border-t border-dashed border-slate-700/50">
						<div className="flex items-center gap-2 mb-2">
							<Sparkles className="w-4 h-4 text-green-400" />
							<span className="text-xs font-bold text-green-400 uppercase">
								Zona de Testnet
							</span>
						</div>
						<div className="bg-green-900/10 border border-green-500/20 rounded-xl p-3 flex justify-between items-center">
							<div>
								<div className="text-white font-bold text-sm">
									Faucet Gratuito
								</div>
								<div className="text-[10px] text-green-300/70">
									Reclama 1,000 CHIPS para probar
								</div>
							</div>
							<button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-lg border-b-2 border-green-800 active:border-b-0 active:translate-y-[2px] transition-all">
								Reclamar
							</button>
						</div>
						<div className="text-center mt-2">
							<span className="text-[9px] text-slate-600 font-mono">
								Reservas del contrato: 50.0 ETH | 499,991 CHIPS
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// --- PANTALLA PRINCIPAL ---

const App = () => {
	// --- ESTADO ---
	const [balance, setBalance] = useState(1500);
	const [balanceEth, setBalanceEth] = useState(0.45); // ETH Simulado
	const [bet, setBet] = useState(100);
	const [streak, setStreak] = useState(0);
	const [karmaPool, setKarmaPool] = useState(85); // 85 CHIPS acumulados
	const [karmaTarget, setKarmaTarget] = useState(100);
	const [isStoreOpen, setIsStoreOpen] = useState(false);

	// Estados de animación
	const [coinState, setCoinState] = useState("IDLE"); // IDLE, FLIPPING, HEADS, TAILS
	const [result, setResult] = useState(null);

	// --- GAME LOGIC (SIMULADA PARA UI) ---
	const handleFlip = (choice) => {
		if (coinState === "FLIPPING") return;
		if (balance < bet) {
			vibrate(50);
			playSound("error");
			// Aquí iría un toast "Fondos insuficientes"
			return;
		}

		setBalance((prev) => prev - bet);
		setCoinState("FLIPPING");
		setResult(null);
		playSound("click");

		// Simular latencia de red L2 (1.5s)
		setTimeout(() => {
			const win = Math.random() > 0.5;
			const finalSide = win ? choice : choice === "HEADS" ? "TAILS" : "HEADS";

			setCoinState(finalSide);
			setResult({ win, amount: win ? Math.floor(bet * 1.9) : bet });

			if (win) {
				setBalance((prev) => prev + Math.floor(bet * 1.9));
				setStreak((prev) => prev + 1);
				// Si el Karma estaba listo, se sumaría aquí
				if (karmaPool >= karmaTarget) {
					setBalance((prev) => prev + karmaPool);
					setKarmaPool(0);
				}
				playSound("coin");
				vibrate([50, 50, 50]);
			} else {
				setStreak(0);
				// 10% de la pérdida al pool
				setKarmaPool((prev) => prev + bet * 0.1);
				playSound("error");
				vibrate(100);
			}

			// Reset coin visual after delay
			setTimeout(() => setCoinState("IDLE"), 3000);
		}, 1500);
	};

	const isKarmaReady = karmaPool >= karmaTarget;
	const karmaPercentage = Math.min(100, (karmaPool / karmaTarget) * 100);

	return (
		<div className="min-h-screen w-full font-sans text-slate-200 overflow-hidden relative select-none flex flex-col">
			<style>{`
                @keyframes spin-coin { 
                    0% { transform: rotateY(0deg); } 
                    100% { transform: rotateY(1800deg); } 
                }
                .animate-spin-coin { animation: spin-coin 1s ease-out infinite; }
                .text-shadow-neon { text-shadow: 0 0 10px currentColor; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
            `}</style>

			<Background />
			<ExchangeModal
				isOpen={isStoreOpen}
				onClose={() => setIsStoreOpen(false)}
				balanceEth={balanceEth}
				balanceChips={balance}
			/>

			{/* --- NAVBAR --- */}
			<nav className="relative z-20 h-16 border-b border-white/5 bg-[#0f0c18]/80 backdrop-blur-md flex justify-between items-center px-4">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center justify-center border border-white/10">
						<span className="font-black text-white text-lg">Ξ</span>
					</div>
					<div className="hidden md:block">
						<div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
							Protocolo
						</div>
						<div className="text-sm font-black text-white tracking-tight">
							CRYPTO<span className="text-indigo-400">FLIP</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Botón de Tienda */}
					<button
						onClick={() => {
							setIsStoreOpen(true);
							playSound("open_store");
						}}
						className="flex items-center gap-2 bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-500/30 px-3 py-1.5 rounded-full hover:bg-green-800/50 transition-all group"
					>
						<RefreshCw className="w-3 h-3 text-green-400 group-hover:rotate-180 transition-transform duration-500" />
						<div className="flex flex-col items-end leading-none">
							<span className="text-[8px] font-bold text-green-400 uppercase">
								Intercambio
							</span>
							<span className="text-xs font-bold text-white group-hover:text-green-200">
								Tienda
							</span>
						</div>
					</button>

					{/* Balance */}
					<div className="bg-slate-900/80 border border-slate-700 rounded-full pl-4 pr-1 py-1 flex items-center gap-3">
						<div className="flex flex-col items-end leading-none">
							<span className="text-[8px] font-bold text-slate-500 uppercase">
								Saldo
							</span>
							<span className="text-sm font-mono font-bold text-yellow-400">
								{balance.toLocaleString()}
							</span>
						</div>
						<div className="w-8 h-8 bg-slate-800 rounded-full border border-yellow-500/20 flex items-center justify-center">
							<Coins className="w-4 h-4 text-yellow-500" />
						</div>
					</div>
				</div>
			</nav>

			{/* --- CONTENIDO PRINCIPAL --- */}
			<main className="relative z-10 flex-grow flex flex-col p-4 max-w-lg mx-auto w-full gap-4">
				{/* 1. HUD: RACHA & KARMA */}
				<div className="grid grid-cols-2 gap-3 mt-2">
					{/* Tarjeta de Racha */}
					<Card
						glow={streak > 1 ? "gold" : "none"}
						className="p-3 flex flex-col justify-between h-24 overflow-hidden"
					>
						<div className="flex justify-between items-start z-10">
							<span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
								Racha
							</span>
							<TrendingUp
								className={`w-4 h-4 ${streak > 1 ? "text-amber-400" : "text-slate-600"}`}
							/>
						</div>
						<div className="flex items-baseline gap-1 z-10">
							<span
								className={`text-3xl font-black font-mono ${streak > 1 ? "text-white" : "text-slate-400"}`}
							>
								x{streak}
							</span>
							<span className="text-[10px] font-bold text-amber-500/80">
								+10% BONUS
							</span>
						</div>
						{streak > 2 && (
							<div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
						)}
					</Card>

					{/* Tarjeta de Karma (Bóveda) */}
					<Card
						glow={isKarmaReady ? "purple" : "none"}
						className="p-3 flex flex-col justify-between h-24 relative overflow-hidden group"
					>
						<div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
							<div
								className={`h-full transition-all duration-700 ease-out ${isKarmaReady ? "bg-purple-400 shadow-[0_0_10px_purple]" : "bg-purple-600/50"}`}
								style={{ width: `${karmaPercentage}%` }}
							/>
						</div>

						<div className="flex justify-between items-start z-10">
							<span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
								Bóveda Karma
							</span>
							{isKarmaReady ? (
								<Unlock className="w-4 h-4 text-purple-400 animate-bounce" />
							) : (
								<Lock className="w-4 h-4 text-slate-600" />
							)}
						</div>

						<div className="z-10">
							<div className="flex items-baseline gap-1">
								<span
									className={`text-2xl font-black font-mono ${isKarmaReady ? "text-white text-shadow-neon" : "text-slate-400"}`}
								>
									{karmaPool.toFixed(0)}
								</span>
								<span className="text-[10px] font-bold text-slate-500">
									CHIPS
								</span>
							</div>
							<div className="text-[9px] text-purple-300/80 font-bold mt-1 truncate">
								{isKarmaReady
									? "¡LISTO PARA COBRAR!"
									: `${(karmaTarget - karmaPool).toFixed(0)} para abrir`}
							</div>
						</div>
					</Card>
				</div>

				{/* 2. ÁREA DE JUEGO (COIN FLIP) */}
				<div className="flex-grow flex flex-col items-center justify-center relative min-h-[280px] perspective-1000">
					{/* Mensaje de Resultado Flotante */}
					{result && coinState !== "FLIPPING" && (
						<div className="absolute top-10 z-30 animate-in slide-in-from-bottom-4 fade-in duration-300">
							<div
								className={`px-6 py-2 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col items-center
                                ${result.win ? "bg-green-900/60 border-green-500/50" : "bg-red-900/60 border-red-500/50"}
                            `}
							>
								<span
									className={`text-3xl font-black drop-shadow-md ${result.win ? "text-green-400" : "text-red-400"}`}
								>
									{result.win ? `+${result.amount}` : `-${result.amount}`}
								</span>
								<span className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">
									{result.win ? "¡Victoria!" : "Suerte la próxima"}
								</span>
							</div>
						</div>
					)}

					{/* La Moneda 3D */}
					<div
						className={`relative w-56 h-56 transition-transform duration-500 preserve-3d
                        ${coinState === "FLIPPING" ? "animate-spin-coin" : ""}
                        ${coinState === "TAILS" ? "[transform:rotateY(180deg)]" : ""}
                    `}
					>
						{/* Lado Cara (Front) */}
						<div className="absolute inset-0 rounded-full border-[6px] border-slate-800 bg-[#1a1b26] shadow-[0_0_50px_rgba(59,130,246,0.3)] flex items-center justify-center backface-hidden">
							<div className="absolute inset-2 rounded-full border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-blue-900/20 flex items-center justify-center">
								<span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 drop-shadow-sm select-none">
									Ξ
								</span>
							</div>
							{/* Brillo */}
							<div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-full pointer-events-none" />
						</div>

						{/* Lado Cruz (Back) */}
						<div className="absolute inset-0 rounded-full border-[6px] border-slate-800 bg-[#1a1b26] shadow-[0_0_50px_rgba(168,85,247,0.3)] flex items-center justify-center backface-hidden [transform:rotateY(180deg)]">
							<div className="absolute inset-2 rounded-full border-2 border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-900/20 flex items-center justify-center">
								<span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-600 drop-shadow-sm select-none">
									◈
								</span>
							</div>
						</div>
					</div>

					{/* Estado del Sistema */}
					<div className="absolute bottom-4">
						<span
							className={`text-[10px] font-mono font-bold tracking-[0.2em] transition-colors duration-300
                            ${coinState === "FLIPPING" ? "text-yellow-400 animate-pulse" : "text-slate-600"}
                        `}
						>
							{coinState === "FLIPPING"
								? "PROCESANDO ORÁCULO..."
								: "SISTEMA EN ESPERA"}
						</span>
					</div>
				</div>

				{/* 3. CONTROLES DE JUEGO */}
				<div className="bg-[#13111c]/90 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-2xl shadow-2xl relative z-20">
					{/* Selector de Apuesta */}
					<div className="flex items-center gap-2 mb-1.5 bg-slate-950/50 p-2 rounded-xl border border-white/5">
						<div className="flex flex-col pl-2">
							<span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
								Monto
							</span>
							<div className="flex items-baseline gap-1">
								<span className="text-xl font-mono font-bold text-white">
									${bet}
								</span>
							</div>
						</div>

						<div className="flex-grow flex justify-end gap-1">
							{[10, 50, 100].map((amt) => (
								<button
									key={amt}
									onClick={() => {
										setBet(amt);
										playSound("click");
									}}
									className={`px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all border border-transparent
                                        ${
																					bet === amt
																						? "bg-slate-700 text-white border-slate-600 shadow-inner"
																						: "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
																				}
                                    `}
								>
									{amt}
								</button>
							))}
						</div>
					</div>

					{/* Botones de Acción Grandes */}
					<div className="flex gap-1.5 h-16">
						<button
							disabled={coinState === "FLIPPING"}
							onClick={() => handleFlip("HEADS")}
							onMouseDown={() => vibrate(10)}
							className="flex-1 bg-gradient-to-b from-blue-600 to-blue-800 rounded-xl shadow-[0_4px_0_#1e3a8a] active:shadow-none active:translate-y-1 active:border-t-0 border-t border-blue-400 transition-all flex flex-col items-center justify-center group disabled:opacity-50 disabled:grayscale"
						>
							<span className="text-lg font-black text-blue-100 uppercase tracking-wider group-hover:scale-110 transition-transform">
								Cara
							</span>
							<span className="text-[9px] text-blue-300 font-bold opacity-70">
								x1.9 Payout
							</span>
						</button>

						<button
							disabled={coinState === "FLIPPING"}
							onClick={() => handleFlip("TAILS")}
							onMouseDown={() => vibrate(10)}
							className="flex-1 bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl shadow-[0_4px_0_#581c87] active:shadow-none active:translate-y-1 active:border-t-0 border-t border-purple-400 transition-all flex flex-col items-center justify-center group disabled:opacity-50 disabled:grayscale"
						>
							<span className="text-lg font-black text-purple-100 uppercase tracking-wider group-hover:scale-110 transition-transform">
								Cruz
							</span>
							<span className="text-[9px] text-purple-300 font-bold opacity-70">
								x1.9 Payout
							</span>
						</button>
					</div>
				</div>
			</main>
		</div>
	);
};

export default App;
