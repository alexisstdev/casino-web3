import { createPublicClient, http, type Block } from "viem";
import { sepolia } from "viem/chains";

const client = createPublicClient({
	chain: sepolia,
	transport: http("https://eth-sepolia.g.alchemy.com/v2/bhMHMpWhoaoIwZVcJ2EyZ"),
});

const block: Block = await client.getBlock({
	blockNumber: 123456n,
});

console.log(block);
