# Comparison Mode

Comparison Mode is the default visualization mode in Easing Visualizer, designed for viewing multiple easing functions side-by-side.

## Overview

Comparison Mode displays a grid of animated panels, each showing how a different easing function transforms input values over time. This makes it easy to compare the visual characteristics of various easing curves and select the right one for your animation needs.

## Adding and Removing Panels

### Adding Panels

1. Click the **Add Panel** button in the toolbar (or press `N`)
2. A new panel appears with default settings
3. You can add up to 24 panels for comprehensive comparisons

### Removing Panels

1. Click the **×** button on the panel you want to remove
2. Or select the panel and press `Delete`

> **Tip:** Start with fewer panels for better performance on lower-end devices.

## Selecting Easing Functions

Each panel can display a different easing function:

1. Click on a panel to select it
2. Use the **Function Selector** dropdown
3. Choose from 16+ available functions:
   - Linear, Sine, Quadratic, Cubic
   - Quartic, Quintic, Exponential, Circular
   - Square Root, Back, Elastic, Bounce
   - Hermite, Bezier, Parabolic, Trigonometric

### Ease Types

Each function supports three easing variations:

| Type | Description | Keyboard |
|------|-------------|----------|
| **EaseIn** | Starts slow, accelerates | `I` |
| **EaseOut** | Starts fast, decelerates | `O` |
| **EaseBoth** | Slow start and end, fast middle | `B` |

## Adjusting Animation Speed

Control the animation playback speed using the **Speed** slider:

- Range: 0.1x to 10x
- Default: 1.0x
- Slower speeds are useful for studying subtle differences
- Faster speeds help visualize overall motion characteristics

### Playback Controls

| Control | Action |
|---------|--------|
| **Play/Pause** | Start or stop all animations (`Space`) |
| **Reset** | Return to animation start (`R`) |
| **Manual Mode** | Scrub through animations with a slider |

## Using with Presets

Presets allow you to save and restore panel configurations quickly.

### Quick Preset Selection

Press number keys `1` through `5` to instantly load saved presets.

### Built-in Presets

The app includes several pre-configured comparison setups:
- **All EaseIn** - Compare all functions with EaseIn
- **All EaseOut** - Compare all functions with EaseOut
- **Bounce Comparison** - Focus on bouncy/elastic functions

### Creating Custom Presets

1. Configure your panels as desired
2. Open the [[Preset-System|Preset Manager]]
3. Click **Save Current State**
4. Name your preset and save

## Preview Types

Each panel supports multiple [[Preview-Types|visualization modes]]:

- **Glow** - Animated brightness intensity
- **Graph** - 2D function curve
- **Camera** - 3D camera movement
- **Value** - Numeric input/output display
- **Easing Compare** - Side-by-side In/Out/Both comparison

## Tips for Effective Comparison

1. **Limit initial panels** - Start with 4-6 panels for clarity
2. **Use consistent ease types** - Compare same ease type across functions
3. **Try different previews** - Graph view shows mathematical differences clearly
4. **Slow down playback** - Lower speed reveals subtle variations
5. **Save useful setups** - Create presets for common comparison scenarios

## Related Pages

- [[Getting-Started]] - Basic usage guide
- [[Preview-Types]] - Visualization options
- [[Preset-System]] - Save and share configurations
- [[Keyboard-Shortcuts]] - Quick access keys
- [[Easing-Functions]] - Function reference
