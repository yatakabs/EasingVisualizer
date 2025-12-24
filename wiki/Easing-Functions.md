# Easing Functions Reference

Easing Visualizer supports **16 mathematical easing functions**, each with three ease type transformations.

## Ease Types

Each function can be applied with three different transformations:

| Ease Type | Behavior | Formula Application |
|-----------|----------|---------------------|
| **EaseIn** | Starts slow, ends fast | `f(x)` |
| **EaseOut** | Starts fast, ends slow | `1 - f(1 - x)` |
| **EaseBoth** | Slow at both ends | Blended: slow→fast→slow |

## Function Reference

### Basic Functions

#### Linear
- **Formula:** `y = x`
- **Description:** No easing - constant rate of change
- **ScriptMapper:** ❌ Not available

#### Quadratic
- **Formula:** `y = x²`
- **Description:** Gentle acceleration curve
- **ScriptMapper:** ✅ `Quad`

#### Cubic
- **Formula:** `y = x³`
- **Description:** Moderate acceleration curve
- **ScriptMapper:** ✅ `Cubic`

#### Quartic
- **Formula:** `y = x⁴`
- **Description:** Strong acceleration curve
- **ScriptMapper:** ✅ `Quart`

#### Quintic
- **Formula:** `y = x⁵`
- **Description:** Very strong acceleration curve
- **ScriptMapper:** ✅ `Quint`

### Smooth Functions

#### Sine
- **Formula:** `y = 1 - cos(πx/2)`
- **Description:** Smooth sinusoidal easing
- **ScriptMapper:** ✅ `Sine`

#### Circular
- **Formula:** `y = 1 - √(1-x²)`
- **Description:** Circular arc movement
- **ScriptMapper:** ✅ `Circ`

#### Exponential
- **Formula:** `y = 2^(10(x-1))`
- **Description:** Extreme acceleration using exponential growth
- **ScriptMapper:** ✅ `Expo`

#### Square Root
- **Formula:** `y = √x`
- **Description:** Inverse of quadratic - starts fast
- **ScriptMapper:** ❌ Not available

### Advanced Functions

#### Back
- **Formula:** `y = x²(2.70158x - 1.70158)`
- **Description:** Overshoots then returns - "wind up" effect
- **ScriptMapper:** ✅ `Back`

#### Elastic
- **Formula:** `y = -2^(10(x-1))sin((x-1.1)×2π/0.4)`
- **Description:** Springy oscillation effect
- **ScriptMapper:** ✅ `Elastic`

#### Bounce
- **Formula:** Piecewise bounce function
- **Description:** Ball bouncing effect
- **ScriptMapper:** ✅ `Bounce`

### Specialized Functions

#### Hermite
- **Formula:** `y = x²(3 - 2x)`
- **Description:** Smooth S-curve interpolation
- **ScriptMapper:** ❌ Not available

#### Bezier
- **Formula:** `y = 3x²(1-x) + x³`
- **Description:** Cubic Bezier-style curve
- **ScriptMapper:** ❌ Not available

#### Parabolic
- **Formula:** `y = 4x(1-x)`
- **Description:** Parabola peaking at midpoint
- **ScriptMapper:** ❌ Not available

#### Trigonometric
- **Formula:** `y = (1 - cos(πx))/2`
- **Description:** Smooth cosine-based S-curve
- **ScriptMapper:** ❌ Not available

### Parametric Functions

#### Drift
- **Formula:** Parametric (x, y parameters)
- **Description:** Custom curve with adjustable control points
- **ScriptMapper:** ✅ `Drift`
- **Parameters:** X (0-10), Y (0-10) control the curve shape

## ScriptMapper Compatibility

Functions marked with ✅ are compatible with Beat Saber's ScriptMapper and can be directly used for camera movements.

| Function | ScriptMapper Name |
|----------|-------------------|
| Sine | `Sine` |
| Quadratic | `Quad` |
| Cubic | `Cubic` |
| Quartic | `Quart` |
| Quintic | `Quint` |
| Exponential | `Expo` |
| Circular | `Circ` |
| Back | `Back` |
| Elastic | `Elastic` |
| Bounce | `Bounce` |
| Drift | `Drift` |

→ Learn more: [[ScriptMapper-Mode|ScriptMapper Mode]]

## See Also

- [[Preview-Types|Preview Types]] - Visualize these functions
- [[Comparison-Mode|Comparison Mode]] - Compare functions side-by-side
- [[Getting-Started|Getting Started]] - Basic usage guide
