import { useQuery } from "@tanstack/react-query";
import type { BackendGameState } from "../types/game";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3007/api";

/**
 * Hook para obtener el estado del juego desde el backend
 */
export const useBackendGameState = (address: string | null) => {
	return useQuery<BackendGameState>({
		queryKey: ["gameState", address],
		queryFn: async () => {
			if (!address) throw new Error("No hay dirección");

			const response = await fetch(`${API_BASE_URL}/game-state/${address}`);
			if (!response.ok) throw new Error("Error al obtener estado del juego");

			return response.json();
		},
		enabled: !!address,
		refetchInterval: 5000,
	});
};
