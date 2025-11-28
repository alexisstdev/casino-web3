# 🎨 Casino Frontend - Design Context

## Estilo Visual: Balatro-Inspired

Este proyecto sigue una estética inspirada en el juego **Balatro**: vibrante, retro-moderna, con personalidad única y efectos visuales satisfactorios.

---

## 🎯 Principios de Diseño

### 1. **Colores**
- **Fondo principal**: `#0f0e17` (negro profundo con tinte púrpura)
- **Fondo secundario**: `#1a1b26` (gris oscuro cálido)
- **Bordes**: `slate-700/800` con opacidad variable
- **Acentos primarios**:
  - 🔵 **Azul (HEADS/Cara)**: `blue-500` → `blue-700` (gradientes)
  - 🟣 **Púrpura (TAILS/Cruz)**: `purple-500` → `purple-700` (gradientes)
  - 🟠 **Naranja (Racha)**: `orange-400` → `orange-600`
- **Estados**:
  - ✅ Victoria: `green-400/500`
  - ❌ Derrota: `red-400/500`
  - ⏳ Procesando: `yellow-400/500`

### 2. **Tipografía**
- **Números/Montos**: `font-mono font-black` - Bold, impactante
- **Labels**: `uppercase tracking-widest text-[10px]` - Pequeño, espaciado
- **Botones**: `font-black uppercase tracking-wider`

### 3. **Iconografía (lucide-react)**
**IMPORTANTE**: No usar emojis. Usar íconos de `lucide-react` para consistencia.

| Elemento | Ícono | Uso |
|----------|-------|-----|
| Racha | `Flame` | Sistema de racha/multiplicador |
| Bóveda Karma | `Vault` | Almacenamiento de karma |
| Bloqueado | `Lock` | Estado cerrado |
| Desbloqueado | `Unlock` | Estado abierto |
| Ayuda | `HelpCircle` | Botones de información |
| Cerrar | `X` | Cerrar modales |
| Progreso | `TrendingUp` | Indicar aumento |
| Efecto especial | `Sparkles` | Momentos importantes |
| Más/Menos | `Plus` / `Minus` | Ajuste de apuesta |

### 4. **Efectos y Sombras**
- **Sombras 3D en botones**: `shadow-[0_4px_0_color]` para efecto "presionable"
- **Glow en hover**: `shadow-[0_0_30px_rgba(color,0.5)]`
- **Bordes gruesos**: `border-4` o `border-[6px]` para elementos importantes
- **Inner shadows**: `shadow-inner` para elementos hundidos

### 5. **Animaciones**
- **Transiciones suaves**: `transition-all duration-300`
- **Hover lift**: `hover:-translate-y-1`
- **Active press**: `active:translate-y-0.5` + reducir border-bottom
- **Spin para carga**: Rotación 3D realista con `rotateY`
- **Bounce para resultados**: `animate-bounce`
- **Pulse para estados activos**: `animate-pulse`

---

## 🪙 Símbolos de la Moneda

| Lado | Símbolo | Color | Significado |
|------|---------|-------|-------------|
| HEADS (Cara) | **Ξ** | Azul (`blue-500`) | Símbolo Ethereum |
| TAILS (Cruz) | **◈** | Púrpura (`purple-500`) | Diamante/Gema |

**Importante**: Los botones de apuesta DEBEN mostrar el mismo símbolo y color que el lado correspondiente de la moneda para clara asociación visual.

---

## 🔥 Indicador: StreakMeter (Racha)

Indicador compacto del multiplicador por victorias consecutivas.

**Diseño:** Pastilla horizontal sutil (`px-3 py-2 rounded-xl bg-slate-800/50`)

**Contenido:**
- Ícono `Flame` (naranja si activo, gris si no)
- Multiplicador actual (ej: "2.1x")
- Número de racha entre paréntesis si > 0
- Botón (?) visible solo en hover

**Colores:**
- Activo: `text-orange-400`
- Inactivo: `text-slate-500/600`

---

## 🏦 Indicador: KarmaVault (Bóveda Karma)

Indicador compacto del sistema de recuperación de pérdidas.

**Diseño:** Pastilla horizontal sutil (`px-3 py-2 rounded-xl bg-slate-800/50`)

**Contenido:**
- Ícono `Lock` o `Unlock` según estado
- Mini barra de progreso (`w-12 h-2`)
- Cantidad actual en fichas (no ETH)
- Botón (?) visible solo en hover

**Colores:**
- Desbloqueado: `text-purple-400`
- Bloqueado: `text-slate-500/600`

**Unidades:** Fichas (tokens), no ETH. Target = 100 fichas.

---

## 📐 Espaciado y Layout

- **Gap entre elementos**: `gap-3`
- **Indicadores**: En fila horizontal, centrados (`flex items-center justify-center gap-3`)
- **Padding interno**: `p-3` para indicadores, `p-4` para cards
- **Border-radius**: `rounded-xl` para indicadores

---

## 💡 Modales de Ayuda

Simples y concisos. Máximo 2-3 oraciones.

**Estructura:**
```
- Overlay oscuro (bg-black/60)
- Card pequeña (max-w-xs)
- Header: ícono + título + botón X
- Un párrafo corto explicativo
```

**Regla:** Si necesitas más de 3 líneas de texto, simplifica.

---

## ✨ Efectos Especiales

### Shine Effect (Brillo)
```css
bg-linear-to-tr from-transparent via-white/10 to-transparent
```

### Glow Effect
```css
shadow-[0_0_30px_rgba(R,G,B,0.5)]
```

### 3D Button Press
```css
/* Normal */
border-b-4 border-X-900

/* Hover */
hover:-translate-y-1

/* Active */
active:translate-y-0.5 active:border-b-0
```

### Segmentos animados
```css
/* Delay escalonado para animación de llenado */
transition-delay: ${index * 50}ms
```

---

## 🚫 Evitar

- ❌ Emojis (usar lucide-react en su lugar)
- ❌ Colores planos sin gradientes en elementos interactivos
- ❌ Bordes de 1px (usar mínimo 2px para elementos importantes)
- ❌ Animaciones demasiado lentas (max 500ms para la mayoría)
- ❌ Texto gris claro sobre fondo oscuro (mantener contraste)
- ❌ Elementos sin feedback visual en hover/active
- ❌ Cards genéricas para conceptos únicos (cada sistema tiene su visualización)

---

## 📁 Estructura de Componentes

```
components/
├── CoinStage.tsx      # Moneda 3D con animación
├── GameControls.tsx   # Botones de apuesta y flip
├── GameStats.tsx      # Contenedor de estadísticas
├── StreakMeter.tsx    # Visualización de racha
├── KarmaVault.tsx     # Visualización de bóveda karma
├── Navbar.tsx         # Navegación superior
├── ChipExchange.tsx   # Intercambio de fichas
└── Background.tsx     # Fondo animado
```

---

## 🎮 Animaciones Requeridas en CSS Global

```css
@keyframes coinFlip {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(1800deg); } /* 5 vueltas completas */
}
```
