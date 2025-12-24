# FAQ

Frequently asked questions about EasingVisualizer.

## General

### What is this tool for?

EasingVisualizer is a visual comparison tool for **easing functions**, designed specifically for:

- **Beat Saber modding** - Visualize animation curves for maps and mods
- **ScriptMapper users** - Preview exactly how easing functions will look in-game
- **Animation workflows** - Understand and compare different easing behaviors
- **Learning** - See mathematical easing functions in action

### Who made this?

EasingVisualizer was created for the Beat Saber mapping community to help visualize easing functions used in ScriptMapper and other animation tools.

## ScriptMapper

### What is ScriptMapper?

ScriptMapper is a scripting tool for Beat Saber that enables advanced animations and effects in custom maps. It uses easing functions to control how values change over time.

See [[ScriptMapper-Mode]] for more details.

### Which easing functions work with ScriptMapper?

All the standard easing functions in EasingVisualizer are compatible with ScriptMapper:

- **Quad, Cubic, Quart, Quint** - Polynomial curves
- **Sine, Expo, Circ** - Smooth curves
- **Back, Elastic, Bounce** - Special effects
- **Linear** - No easing

Each can be used as `easeIn`, `easeOut`, or `easeInOut` in ScriptMapper.

### How do I use ScriptMapper mode?

1. Enable **ScriptMapper Mode** in Advanced Settings
2. Panels will show ScriptMapper-compatible function names
3. Use the ScriptMapper preset selector for common configurations

## Sharing & Saving

### How do I share my configuration?

1. Set up your panels as desired
2. Click the **Share** button in the toolbar
3. The URL is copied to your clipboard
4. Send the URL to anyone - they'll see your exact configuration

See [[URL-Sharing]] for details.

### Are my settings saved?

Yes! Your settings are automatically saved to your browser's **localStorage**:

- Panel configurations
- Speed and gamma settings
- Custom presets

Settings persist across browser sessions but are device-specific.

### How do I save a preset?

1. Configure your panels
2. Click **Save Preset** in the preset manager
3. Enter a name for your preset
4. Access it anytime from the preset dropdown

See [[Preset-System]] for details.

## Technical

### What browsers are supported?

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Opera 76+ | ✅ Full |

Older browsers may work but are not officially supported.

### Does it work on mobile?

Yes! EasingVisualizer is fully responsive with:

- Touch-optimized controls
- Mobile control sheet
- Responsive panel grid

See [[Mobile-Support]] for details.

### What are the system requirements?

- **WebGL support** - Required for camera preview
- **Modern browser** - See browser support above
- **JavaScript enabled** - Required for functionality

### Why is the camera preview slow?

The camera preview uses Three.js for 3D rendering. If it's slow:

1. Close other browser tabs
2. Use fewer panels
3. Switch to simpler preview types (glow, value)
4. Check if hardware acceleration is enabled in your browser

## Features

### What do the different preview types show?

| Preview | Shows |
|---------|-------|
| **Glow** | Opacity/intensity changes |
| **Graph** | Mathematical curve visualization |
| **Camera** | 3D camera movement path |
| **Value** | Numeric value display |

See [[Preview-Types]] for detailed explanations.

### What's the difference between easein, easeout, and easeboth?

- **easein** - Starts slow, ends fast
- **easeout** - Starts fast, ends slow
- **easeboth** (easeInOut) - Slow at both ends, fast in middle

See [[Easing-Functions]] for visual comparisons.

### Can I add custom easing functions?

For developers, yes! See [[Contributing]] for instructions on adding new easing functions to the codebase.

## Troubleshooting

### The app isn't loading

1. Clear your browser cache
2. Disable browser extensions
3. Try a different browser
4. Check the browser console for errors

### My settings disappeared

Settings are stored in localStorage. They may be cleared if:

- You cleared browser data
- You're using private/incognito mode
- You switched browsers or devices

Use [[URL-Sharing]] to backup important configurations.

### Animations are stuttering

1. Close other applications
2. Reduce the number of visible panels
3. Use simpler preview types
4. Enable hardware acceleration in browser settings

## Related Pages

- [[Getting-Started]]
- [[Keyboard-Shortcuts]]
- [[Contributing]]
