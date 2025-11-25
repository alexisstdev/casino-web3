// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract CasinoGame is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    IERC20 public casinoToken;
    address public oracleAddress;

    event GameResult(
        address indexed player,
        bool won,
        uint256 amountWon,
        uint256 streak,
        uint256 karmaPoolReleased,
        uint256 timestamp
    );

    mapping(address => uint256) public nonces;

    constructor(
        address _tokenAddress,
        address _oracleAddress
    ) Ownable(msg.sender) {
        casinoToken = IERC20(_tokenAddress);
        oracleAddress = _oracleAddress;
    }

    function setOracleAddress(address _newOracle) external onlyOwner {
        oracleAddress = _newOracle;
    }

    function flip(
        bool choiceHeads,
        uint256 betAmount,
        uint256 currentStreak,
        uint256 currentKarmaPool,
        bool isKarmaReady,
        bytes calldata signature
    ) external nonReentrant {
        require(betAmount > 0, "La apuesta debe ser mayor a 0");
        require(
            casinoToken.balanceOf(address(this)) >= (betAmount * 5),
            "La banca no tiene fondos suficientes"
        );

        // 1. VERIFICAR FIRMA (Scope separado para liberar variables)
        {
            bytes32 hash = keccak256(
                abi.encodePacked(
                    msg.sender,
                    betAmount,
                    currentStreak,
                    currentKarmaPool,
                    isKarmaReady,
                    nonces[msg.sender],
                    address(this)
                )
            );

            bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(
                hash
            );
            address signer = ECDSA.recover(ethSignedHash, signature);
            require(
                signer == oracleAddress,
                "Firma invalida o datos manipulados"
            );
        }

        nonces[msg.sender]++;

        // 2. COBRAR APUESTA
        require(
            casinoToken.transferFrom(msg.sender, address(this), betAmount),
            "Fallo al cobrar apuesta"
        );

        // 3. GENERAR RESULTADO
        bool playerWon;
        {
            uint256 random = uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        msg.sender,
                        nonces[msg.sender]
                    )
                )
            ) % 100;
            bool resultIsHeads = random < 50;
            playerWon = (choiceHeads == resultIsHeads);
        }

        uint256 totalPayout = 0;
        uint256 karmaReleased = 0;

        // 4. CALCULAR PAGO (Scope separado)
        if (playerWon) {
            uint256 multiplier = 190;

            if (currentStreak > 0) {
                uint256 bonus = currentStreak * 10;
                if (bonus > 50) bonus = 50;
                multiplier += bonus;
            }

            totalPayout = (betAmount * multiplier) / 100;

            if (isKarmaReady) {
                totalPayout += currentKarmaPool;
                karmaReleased = currentKarmaPool;
            }

            require(
                casinoToken.transfer(msg.sender, totalPayout),
                "Fallo al pagar premio"
            );
        }

        // 5. EMITIR EVENTO
        emit GameResult(
            msg.sender,
            playerWon,
            totalPayout,
            playerWon ? currentStreak + 1 : 0,
            karmaReleased,
            block.timestamp
        );
    }

    function withdrawBankroll(uint256 amount) external onlyOwner {
        casinoToken.transfer(msg.sender, amount);
    }
}
