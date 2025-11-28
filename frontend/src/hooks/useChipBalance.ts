import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES, CASINO_TOKEN_ABI } from "../config/contracts";

/**
 * Hook para obtener el balance de CHIP tokens del usuario
 */
export const useChipBalance = () => {
	const { address, isConnected } = useAccount();

	const { data: balance, refetch } = useReadContract({
		address: CONTRACT_ADDRESSES.CASINO_TOKEN,
		abi: CASINO_TOKEN_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: isConnected && !!address,
		},
	});

	const formattedBalance = balance
		? Math.floor(Number(formatUnits(balance as bigint, 18)))
		: 0;

	return {
		balance: formattedBalance,
		rawBalance: balance as bigint | undefined,
		refetch,
	};
};
