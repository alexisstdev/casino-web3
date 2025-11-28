import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Dirección que el usa para verificar las firmas.
const ORACLE_ADDRESS = "0x4cec873bd53a3f1240c1882cb2a86b1771bfadb6";

// Dirección del treasury para recibir las ganancias de la casa
const TREASURY_ADDRESS = "0x5864d8b2d2f4d4832b93a911eb1ffef36a525285";

export default buildModule("CasinoModule", (m) => {
	const deployer = m.getAccount(0);

	const casinoToken = m.contract("CasinoToken", [deployer]);

	const coinFlipGame = m.contract("CasinoGame", [
		casinoToken,
		ORACLE_ADDRESS,
		TREASURY_ADDRESS,
	]);

	// Necesitamos transferir tokens al contrato del juego para que pueda pagar premios.
	const bankrollAmount = "500000000000000000000000"; // 500,000 Chips

	m.call(casinoToken, "transfer", [coinFlipGame, bankrollAmount], {
		from: deployer,
		after: [coinFlipGame],
	});

	return { casinoToken, coinFlipGame };
});
