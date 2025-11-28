# casino-web3

## Enlaces

**GitHub:** [https://github.com/alexisstdev/casino-web3](https://github.com/alexisstdev/casino-web3)

**Aplicación:** [https://casino-web3-ten.vercel.app/](https://casino-web3-ten.vercel.app/)

## Direcciones de Contratos Desplegados

| Contrato | Dirección |
|----------|-----------|
| CasinoToken | `0x7aa345bF4598024d9aB6dc09805adBbc97352b2f` |
| CasinoGame | `0xF74671Dbd4f72CA3FD2F92fc5F5D5Aa4722607A1` |

## Descripción de la Aplicación

Desarrollamos una aplicación descentralizada (DApp) de apuestas o casino con una economía de fichas de casino integrada. El objetivo principal fue crear una experiencia de usuario fluida y adictiva mediante una arquitectura híbrida con Web3.

La aplicación permite a los usuarios comprar fichas de casino con ETH, apostar en un juego de lanzar una moneda y en base a sus resultados intercambiar sus ganancias de vuelta a ETH.


## Capturas de Pantalla de la Interfaz

### Pantalla Principal
![Pantalla Principal](./screenshots/main.png)
> *[Insertar captura de la pantalla principal aquí]*

### Intercambio de fichas
![Intercambio de fichas](./screenshots/buy-chips.png)
> *[Insertar captura de la interfaz de intercambio de fichas aquí]*


## Arquitectura

Implementamos una arquitectura que combina la transparencia de la Blockchain con la velocidad de un servidor tradicional.

### Frontend

Utilizamos **React** con **Viem** y **Wagmi** para la interacción con la blockchain. Nos enfocamos en una interfaz atractiva, manejando estados de carga, animaciones y feedback auditivo para enmascarar los tiempos de espera de la red.

### Backend (El Oráculo)

Desarrollamos un servidor con **Express** que actúa como nuestro "Oráculo de Estado". En lugar de guardar variables como la "racha de victorias" de cada usuario directamente en la Blockchain (lo cual sería costoso y lento), las gestionamos en una base de datos local y las "inyectamos" al contrato mediante firmas criptográficas.

### Red

Desplegamos los contratos en la red **Ethereum Sepolia**.


## Seguridad e Integridad de Datos (El Patrón Oráculo)

Uno de los mayores desafíos fue: *¿Cómo evitamos que un usuario llame directamente al contrato inteligente y se invente una racha ganadora de 100 juegos?*

Para solucionar esto, implementamos un sistema de **Firma Digital EIP-191**:

1. **Solicitud:** Antes de cada jugada, el frontend solicita permiso al Backend.
2. **Firma:** El Backend verifica el estado real del jugador en su base de datos, obtiene el nonce (contador de transacciones) real del contrato y empaqueta estos datos. Luego, firma este paquete con una **Oracle Private Key** que solo el servidor conoce.
3. **Verificación On-Chain:** El usuario envía esta firma al contrato inteligente. El contrato utiliza `ECDSA.recover` para verificar que la firma proviene, efectivamente, de la dirección autorizada del Oráculo. Si los datos no coinciden o la firma es falsa, la transacción se revierte.

### Aleatoriedad

Para determinar el ganador, no confiamos en la aleatoriedad del frontend ni del backend (que podrían ser manipulados). Usamos una combinación de `block.prevrandao` (la fuente de aleatoriedad de la Beacon Chain de Ethereum) y `keccak256` con el timestamp y el nonce del usuario. Esto asegura que el resultado sea determinista en el momento de la ejecución del bloque, pero impredecible para el usuario antes de enviar la transacción.

```solidity
bool playerWon;
{
    uint256 random = uint256(
        keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                nonces[msg.sender]
            )
        )
    ) % 100;
    bool resultIsHeads = random < 50;
    playerWon = (choiceHeads == resultIsHeads);
}
```


## Explicación de los Contratos

Utilizamos dos contratos principales interactuando entre sí.

### 1. CasinoToken (`CasinoToken.sol`)

Es un contrato **ERC-20** estándar que representa las fichas del juego. Este contrato nos permite tener una economía interna dentro de la aplicación, separando el valor real (ETH) de las fichas de juego.

**Uso en la aplicación:** Los usuarios adquieren fichas para poder jugar. Esto nos permite controlar la economía del juego y aplicar comisiones en el intercambio.

**Funciones del Contrato:**

| Función | Descripción |
|---------|-------------|
| `faucet()` | Permite a cualquier usuario obtener 1,000 fichas gratis para pruebas. Útil para que nuevos usuarios prueben la aplicación sin gastar ETH. |
| `approve(spender, amount)` | Estándar ERC-20. Autoriza al contrato CasinoGame a gastar las fichas del usuario durante las apuestas. |
| `transfer(to, amount)` | Estándar ERC-20. Transfiere fichas entre direcciones. |
| `balanceOf(address)` | Estándar ERC-20. Consulta el balance de fichas de una dirección. |

### 2. CasinoGame (`CasinoGame.sol`)

Es el cerebro de la aplicación. Maneja la lógica de las apuestas, el intercambio de tokens y la verificación de seguridad.

**Uso en la aplicación:** Este contrato gestiona toda la lógica del juego, desde la compra/venta de fichas hasta la ejecución de las apuestas con verificación criptográfica.

**Funciones del Contrato:**

| Función | Descripción |
|---------|-------------|
| `flip(betAmount, currentStreak, currentKarmaPool, isKarmaReady, signature)` | Función principal del juego. Recibe la apuesta, el estado del usuario y la firma del oráculo. Verifica la firma, ejecuta la aleatoriedad y transfiere los tokens si el usuario gana. |
| `buyChips()` | Funciona como un DEX simplificado. Acepta ETH (`msg.value`) y envía fichas al usuario según una tasa de cambio definida. |
| `sellChips(amount)` | Permite al usuario cambiar sus fichas por ETH. El contrato retiene los chips y envía ETH de su reserva, cobrando un pequeño fee para la casa. |
| `setOracleAddress(address)` | Función administrativa. Permite cambiar la dirección del servidor de confianza si la clave privada se ve comprometida. |
| `setTreasuryAddress(address)` | Función administrativa. Define a dónde se envían las ganancias de la casa. |
| `setSellFeeBps(uint256)` | Función administrativa. Ajusta la comisión de venta en puntos base (1 bps = 0.01%). |
| `nonces(address)` | Consulta el nonce actual de un jugador. Usado para prevenir ataques de replay. |

> **Nota:** Las funciones administrativas (`set...`) solo pueden ser llamadas por el dueño del contrato.


## Casos de Uso con Comprobación

### Caso 1: Obtener Fichas (Faucet)

**Descripción:** Un usuario nuevo desea obtener fichas gratis para probar la aplicación.

**Pasos:**
1. El usuario conecta su wallet
2. Hace clic en "Faucet" 
3. Confirma la transacción en MetaMask
4. Recibe 1,000 fichas


### Caso 2: Comprar Fichas con ETH

**Descripción:** Un usuario desea comprar fichas utilizando ETH.

**Pasos:**
1. El usuario ingresa la cantidad de ETH a intercambiar
2. Hace clic en "Comprar Fichas"
3. Confirma la transacción
4. Recibe Fichas según la tasa de cambio


### Caso 3: Jugar una Partida (Flip)

**Descripción:** Un usuario apuesta fichas en un juego de cara o cruz.

**Pasos:**
1. El usuario selecciona la cantidad a apostar
2. El frontend solicita firma al backend
3. El usuario envía la transacción con la firma
4. El contrato verifica la firma y ejecuta el juego
5. Si gana, recibe el doble de su apuesta


### Caso 4: Vender fichas por ETH

**Descripción:** Un usuario desea retirar sus ganancias intercambiando fichas por ETH.

**Pasos:**
1. El usuario aprueba el gasto de fichas (approve)
2. Ingresa la cantidad de fichas a vender
3. Confirma la transacción de venta
4. Recibe ETH (menos la comisión de la casa)


## Snippets de Código

### Verificación de Integridad (Solidity)

Aquí es donde el contrato garantiza que los datos del backend son legítimos. Reconstruimos el hash exactamente igual que en el servidor y verificamos el firmante.

```solidity
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

address signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), signature);
require(signer == oracleAddress, "Firma invalida o datos manipulados");
```

### Servicio de Firma (Backend - TypeScript)

El backend utiliza `viem` para empaquetar los tipos de datos de forma idéntica a Solidity (`encodePacked`) y firmarlos.

```typescript
async signGameData(playerAddress, betAmount, streak, karmaPool, isReady, nonce, contractAddress) {
    const hash = keccak256(
      encodePacked(
        ["address", "uint256", "uint256", "uint256", "bool", "uint256", "address"],
        [
          playerAddress,
          betAmount,
          BigInt(streak),
          karmaPool,
          isReady,
          BigInt(nonce),
          contractAddress,
        ],
      ),
    );

    return await this.walletClient.signMessage({ message: { raw: hash } });
}
```