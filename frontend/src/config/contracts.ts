import CasinoGameABI from "../../artifacts/contracts/CasinoGame.sol/CasinoGame.json";
import CasinoTokenABI from "../../artifacts/contracts/CasinoToken.sol/CasinoToken.json";

export const CONTRACT_ADDRESSES = {
	CASINO_GAME: import.meta.env.VITE_CASINO_GAME_ADDRESS as `0x${string}`,
	CASINO_TOKEN: import.meta.env.VITE_CASINO_TOKEN_ADDRESS as `0x${string}`,
} as const;

// ABIs
export const CASINO_GAME_ABI = CasinoGameABI.abi;
export const CASINO_TOKEN_ABI = CasinoTokenABI.abi;

export const SEPOLIA_CHAIN_ID = "0x66eee";
export const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
