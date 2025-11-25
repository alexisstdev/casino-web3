// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CasinoToken is ERC20, Ownable {
    // Definimos el token con nombre y símbolo
    constructor(
        address initialOwner
    ) ERC20("CasinoChip", "CHIP") Ownable(initialOwner) {
        // Mint inicial al creador para fondear la banca (1 millón de tokens)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Función para que el contrato del juego pueda mintear recompensas si la banca se queda vacía
    // (Opcional, depende de tu economía, aquí lo dejamos solo para el owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // FAUCET: Para que cualquiera obtenga 1000 tokens gratis para jugar (Solo Testnet)
    function faucet() public {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
