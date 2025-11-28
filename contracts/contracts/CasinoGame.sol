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
    address public treasuryAddress; // Dirección para recibir ganancias de la casa

    // Tasa de intercambio: 1 ETH = 10000 CHIPS (configurable)
    uint256 public chipsPerEth = 10000;

    // Fee de venta (5% = 500 basis points)
    uint256 public sellFeeBps = 500;

    event GameResult(
        address indexed player,
        bool won,
        uint256 amountWon,
        uint256 streak,
        uint256 karmaPoolReleased,
        uint256 timestamp
    );

    event ChipsPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 chipsAmount,
        uint256 timestamp
    );

    event ChipsSold(
        address indexed seller,
        uint256 chipsAmount,
        uint256 ethAmount,
        uint256 fee,
        uint256 timestamp
    );

    event TreasuryWithdrawal(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    mapping(address => uint256) public nonces;

    constructor(
        address _tokenAddress,
        address _oracleAddress,
        address _treasuryAddress
    ) Ownable(msg.sender) {
        casinoToken = IERC20(_tokenAddress);
        oracleAddress = _oracleAddress;
        treasuryAddress = _treasuryAddress;
    }

    // ============================================
    // CONFIGURACIÓN (Solo Owner)
    // ============================================

    function setOracleAddress(address _newOracle) external onlyOwner {
        oracleAddress = _newOracle;
    }

    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = _newTreasury;
    }

    function setChipsPerEth(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than 0");
        chipsPerEth = _newRate;
    }

    function setSellFeeBps(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 2000, "Fee cannot exceed 20%");
        sellFeeBps = _newFeeBps;
    }

    // ============================================
    // COMPRA/VENTA DE CHIPS
    // ============================================

    /// @notice Comprar CHIPS con ETH
    /// @dev Las fichas tienen 18 decimales, igual que ETH
    /// Ejemplo: 0.01 ETH * 10000 = 100 fichas (100e18 en raw units)
    function buyChips() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH to buy chips");

        // msg.value ya está en wei (18 decimales), multiplicamos por rate
        // Resultado: cantidad de fichas con 18 decimales
        uint256 chipsAmount = msg.value * chipsPerEth;
        require(chipsAmount > 0, "Amount too small");

        require(
            casinoToken.balanceOf(address(this)) >= chipsAmount,
            "Not enough chips in reserve"
        );

        require(
            casinoToken.transfer(msg.sender, chipsAmount),
            "Failed to transfer chips"
        );

        emit ChipsPurchased(
            msg.sender,
            msg.value,
            chipsAmount,
            block.timestamp
        );
    }

    /// @notice Vender CHIPS por ETH (con fee)
    /// @dev chipsAmount debe estar en raw units (con 18 decimales)
    /// Ejemplo: 100 fichas = 100e18 raw units → 0.01 ETH
    function sellChips(uint256 chipsAmount) external nonReentrant {
        require(chipsAmount > 0, "Must sell at least some chips");

        // Calcular ETH a devolver (chipsAmount ya tiene 18 decimales)
        // ethAmount = chipsAmount / chipsPerEth (mantiene 18 decimales)
        uint256 ethAmount = chipsAmount / chipsPerEth;

        // Aplicar fee
        uint256 fee = (ethAmount * sellFeeBps) / 10000;
        uint256 ethToSend = ethAmount - fee;

        require(
            address(this).balance >= ethToSend,
            "Not enough ETH in reserve"
        );

        // Transferir chips del usuario al contrato
        require(
            casinoToken.transferFrom(msg.sender, address(this), chipsAmount),
            "Failed to transfer chips"
        );

        // Enviar ETH al usuario
        (bool success, ) = payable(msg.sender).call{value: ethToSend}("");
        require(success, "Failed to send ETH");

        emit ChipsSold(
            msg.sender,
            chipsAmount,
            ethToSend,
            fee,
            block.timestamp
        );
    }

    /// @notice Obtener cantidad de CHIPS que se recibirían por X ETH
    /// @dev Retorna cantidad en unidades formateadas (no raw)
    function getChipsForEth(uint256 ethAmount) external view returns (uint256) {
        return ethAmount * chipsPerEth;
    }

    /// @notice Obtener cantidad de ETH que se recibiría por X CHIPS (después del fee)
    /// @dev chipsAmount debe estar en raw units (con 18 decimales)
    function getEthForChips(
        uint256 chipsAmount
    ) external view returns (uint256 ethAmount, uint256 fee) {
        uint256 grossEth = chipsAmount / chipsPerEth;
        fee = (grossEth * sellFeeBps) / 10000;
        ethAmount = grossEth - fee;
    }

    // ============================================
    // TREASURY (Retiro de ganancias de la casa)
    // ============================================

    /// @notice Retirar ETH de las ganancias al treasury
    function withdrawToTreasury(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Not enough ETH balance");

        (bool success, ) = payable(treasuryAddress).call{value: amount}("");
        require(success, "Failed to send ETH to treasury");

        emit TreasuryWithdrawal(treasuryAddress, amount, block.timestamp);
    }

    /// @notice Retirar todo el ETH al treasury
    function withdrawAllToTreasury() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(treasuryAddress).call{value: balance}("");
        require(success, "Failed to send ETH to treasury");

        emit TreasuryWithdrawal(treasuryAddress, balance, block.timestamp);
    }

    /// @notice Ver balance de ETH del contrato
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Ver balance de CHIPS del contrato
    function getChipsBalance() external view returns (uint256) {
        return casinoToken.balanceOf(address(this));
    }

    // Recibir ETH directamente (para fondear el contrato)
    receive() external payable {}

    // ============================================
    // JUEGO (Flip)
    // ============================================

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

    /// @notice Retirar CHIPS del bankroll al treasury
    function withdrawBankrollToTreasury(uint256 amount) external onlyOwner {
        require(
            casinoToken.transfer(treasuryAddress, amount),
            "Failed to transfer to treasury"
        );
    }
}
