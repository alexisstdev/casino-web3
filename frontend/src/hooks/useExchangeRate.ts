import { useReadContract } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, CASINO_GAME_ABI } from "../config/contracts";

/**
 * Hook para obtener la tasa de cambio CHIPS/ETH
 */
export const useExchangeRate = () => {
	const { data: chipsPerEth, refetch } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "chipsPerEth",
	});

	const { data: sellFeeBps } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "sellFeeBps",
	});

	return {
		chipsPerEth: chipsPerEth ? Number(chipsPerEth) : 10000,
		sellFeePercent: sellFeeBps ? Number(sellFeeBps) / 100 : 5,
		refetch,
	};
};

/**
 * Hook para obtener los balances del contrato (ETH y CHIPS disponibles)
 */
export const useContractBalances = () => {
	const { data: ethBalance, refetch: refetchEth } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getEthBalance",
	});

	const { data: chipsBalance, refetch: refetchChips } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getChipsBalance",
	});

	const refetch = () => {
		refetchEth();
		refetchChips();
	};

	return {
		ethBalance: ethBalance ? Number(formatEther(ethBalance as bigint)) : 0,
		chipsBalance: chipsBalance
			? Number(formatUnits(chipsBalance as bigint, 18))
			: 0,
		refetch,
	};
};
