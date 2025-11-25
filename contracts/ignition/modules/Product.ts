import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ProductModule", (m) => {
	const owners = [
		"0x5864d8b2d2f4d4832b93a911eB1FFEF36A525285",
		"0x845D532E43dFC3DF4ac967B24d2b06B5DF348C7b",
	];

	const shares = [80, 20];

	const product = m.contract("ProductContract", [owners, owners, shares]);

	return { product };
});
