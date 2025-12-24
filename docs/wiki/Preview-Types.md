# Preview Types

Easing Visualizer offers five visualization types to help you understand how easing functions behave.

## Overview

| Preview Type | Purpose | Best For |
|--------------|---------|----------|
| **Glow** | Visual intensity | Quick visual comparison |
| **Graph** | Mathematical curve | Understanding function shape |
| **Camera** | 3D movement | Beat Saber camera paths |
| **Value** | Numeric display | Precise value checking |
| **Easing Compare** | Side-by-side | Comparing ease variations |

## Glow Preview

The Glow preview displays a circular element whose brightness varies based on the easing function output.

### Features

- **Radial glow effect** - Soft gradient centered on the panel
- **Real-time brightness** - Intensity maps directly to output value (0-1)
- **Color customization** - Each function has a unique accent color

### Use Cases

- Quickly scan multiple functions for visual character
- Understand how smooth vs. abrupt transitions look
- Preview LED/light animations

### Technical Details

- Output value 0 = minimum brightness
- Output value 1 = maximum brightness
- Uses OKLCH color space for consistent saturation

## Graph Preview

The Graph preview shows a 2D plot of the easing function curve.

### Features

- **X-axis**: Time/input (0 to 1)
- **Y-axis**: Output value (0 to 1)
- **Animated cursor**: Shows current position on the curve
- **Reference lines**: Grid helps visualize key points

### Reading the Graph

| Curve Shape | Meaning |
|-------------|---------|
| Steep slope | Rapid change |
| Gentle slope | Slow change |
| S-curve | Accelerate then decelerate |
| Overshoots | Goes beyond 0-1 range |

### Use Cases

- Understand the mathematical behavior
- Compare curve shapes precisely
- Identify overshoots (Back, Elastic functions)
- Educational purposes

### Options

- Toggle between raw output and gamma-corrected output
- Show/hide reference grid
- Display function formula

## Camera Preview

The Camera preview renders a 3D scene showing camera movement based on the easing function.

### Features

- **3D viewport** - Perspective view of the scene
- **Animated camera** - Position interpolates using the easing function
- **Reference geometry** - Grid floor, coordinate axes
- **Avatar placeholder** - Visual target for camera focus

### Camera Settings

| Setting | Description |
|---------|-------------|
| **Start Position** | Camera starting point (X, Y, Z) |
| **End Position** | Camera ending point (X, Y, Z) |
| **FOV** | Field of view angle |
| **Aspect Ratio** | Viewport dimensions |

### Use Cases

- Preview Beat Saber camera paths
- Visualize 3D animation curves
- Test camera movement smoothness
- [[ScriptMapper-Mode]] workflows

### Technical Details

- Rendered with Three.js
- 60fps target frame rate
- Supports left-handed and right-handed coordinate systems

## Value Preview

The Value preview displays numeric input and output values.

### Features

- **Input value** - Current normalized time (0-1)
- **Output value** - Result of easing function
- **Real-time updates** - Values change during animation
- **High precision** - Multiple decimal places shown

### Display

```
Input:  0.500
Output: 0.750
```

### Use Cases

- Verify exact values at specific times
- Debug animation issues
- Educational - see how input maps to output
- Accessibility - non-visual verification

## Easing Compare Preview

The Easing Compare preview shows all three ease types side-by-side for a single function.

### Features

- **Three sub-panels** - EaseIn, EaseOut, EaseBoth
- **Synchronized animation** - All three run together
- **Same function** - Compares variations of one function

### Layout

```
┌──────────┬──────────┬──────────┐
│  EaseIn  │ EaseOut  │ EaseBoth │
└──────────┴──────────┴──────────┘
```

### Use Cases

- Understand In/Out/Both differences
- Quickly select the right ease type
- Compare acceleration vs. deceleration
- Teaching easing concepts

## Switching Preview Types

### Per-Panel

1. Click on a panel
2. Use the Preview Type selector
3. Choose your preferred visualization

### Keyboard Shortcut

Press `C` to toggle camera view on the selected panel.

### Global Default

Set the default preview type in Settings to apply to new panels.

## Performance Considerations

| Preview Type | Performance Impact |
|--------------|-------------------|
| Glow | Light |
| Graph | Light |
| Value | Very Light |
| Camera | Medium-Heavy |
| Easing Compare | Light (3x Graph) |

> **Tip:** Use fewer Camera previews on lower-end devices for smoother animation.

## Related Pages

- [[Comparison-Mode]] - Default visualization mode
- [[ScriptMapper-Mode]] - Beat Saber integration
- [[Getting-Started]] - Basic usage guide
- [[Easing-Functions]] - Available functions
