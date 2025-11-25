import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// ¡IMPORTANTE! Reemplaza esto con la Public Key de la wallet de tu Backend
// Esta es la dirección que el contrato usará para verificar las firmas.
const ORACLE_ADDRESS = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
// ORACLE PRIVATE KEY (Temporal) = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

export default buildModule("CasinoModule", (m) => {
	// 1. Obtener la cuenta que está desplegando (el Owner)
	const deployer = m.getAccount(0);

	// 2. Desplegar el Token (CasinoToken)
	// Pasamos el deployer como el initialOwner
	const casinoToken = m.contract("CasinoToken", [deployer]);

	// 3. Desplegar el Juego (CoinFlipGame)
	// Pasamos la dirección del token recién creado y la dirección del Oráculo
	const coinFlipGame = m.contract("CasinoGame", [casinoToken, ORACLE_ADDRESS]);

	// 4. CONFIGURACIÓN POST-DESPLIEGUE (Funding the Bankroll)
	// Necesitamos transferir tokens al contrato del juego para que pueda pagar premios.
	// Transferimos 500,000 CHIPS del deployer al contrato del juego.

	const bankrollAmount = "500000000000000000000000"; // 500,000 tokens (con 18 decimales)

	m.call(casinoToken, "transfer", [coinFlipGame, bankrollAmount], {
		from: deployer,
		after: [coinFlipGame], // Aseguramos que se ejecute después de desplegar el juego
	});

	return { casinoToken, coinFlipGame };
});
