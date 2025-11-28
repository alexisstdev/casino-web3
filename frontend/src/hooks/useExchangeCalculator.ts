import { useReadContract } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, CASINO_GAME_ABI } from "../config/contracts";

/**
 * Hook para calcular cuántos CHIPS se recibirían por X ETH
 */
export const useChipsForEth = (ethAmount: string) => {
	const { data } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getChipsForEth",
		args:
			ethAmount && Number(ethAmount) > 0 ? [parseEther(ethAmount)] : undefined,
		query: {
			enabled: !!ethAmount && Number(ethAmount) > 0,
		},
	});

	return data ? Math.floor(Number(formatUnits(data as bigint, 18))) : 0;
};

/**
 * Hook para calcular cuánto ETH se recibiría por X CHIPS (después del fee)
 */
export const useEthForChips = (chipsAmount: string) => {
	const { data } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_GAME,
		abi: CASINO_GAME_ABI,
		functionName: "getEthForChips",
		args:
			chipsAmount && Number(chipsAmount) > 0
				? [parseUnits(chipsAmount, 18)]
				: undefined,
		query: {
			enabled: !!chipsAmount && Number(chipsAmount) > 0,
		},
	});

	if (!data) return { ethAmount: 0, fee: 0 };

	const [ethAmount, fee] = data as [bigint, bigint];
	return {
		ethAmount: Number(formatEther(ethAmount)),
		fee: Number(formatEther(fee)),
	};
};
