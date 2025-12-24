# ScriptMapper Mode

ScriptMapper Mode provides specialized visualization for Beat Saber camera scripting workflows.

## What is ScriptMapper?

[ScriptMapper](https://github.com/hibit-at/Scriptmapper) is a tool for Beat Saber that generates camera scripts (`SongScript.json`) from bookmark-based commands in mapping software. It allows mappers to create smooth camera transitions, rotations, and movements that enhance the visual experience of custom levels.

Easing Visualizer's ScriptMapper Mode helps you preview how different easing functions will look in your camera movements before implementing them in your map.

## Enabling ScriptMapper Mode

1. Click the **ScriptMapper** toggle in the Control Panel
2. The interface switches to ScriptMapper-specific controls
3. Additional preview options become available

## Importing Bookmarks

ScriptMapper uses bookmarks in Beat Saber mapping software to define camera movements. You can import these bookmarks directly into Easing Visualizer:

### Bookmark Format

ScriptMapper bookmarks follow this structure:

```
startCommand,endCommand[,easing]
```

**Examples:**
- `center1,diagb3,OCubic` - OutCubic easing
- `center-2,side3,IOBounce` - InOutBounce easing

### Import Steps

1. Open the **ScriptMapper Controls** panel
2. Paste your bookmark text into the import field
3. Click **Import** to visualize the camera path
4. The preview updates to show your camera movement

## Preview Views

ScriptMapper Mode offers three specialized preview types:

### First Person View

Experience the camera movement from the player's perspective:
- Shows what players will see during gameplay
- Includes reference geometry (avatar position, notes, walls)
- Useful for checking motion sickness potential

### Graph View

Visualize the mathematical curves:
- X, Y, Z position over time
- Rotation angles (RX, RY, RZ)
- FOV changes
- Helps identify jerky transitions

### Combined View

Multi-panel display showing:
- First person preview
- Individual axis graphs
- Easing curve visualization
- Comprehensive overview of the camera path

## Supported Easing Types

ScriptMapper supports 11 easing function families with In/Out/InOut variations:

| Function | In | Out | InOut |
|----------|-----|-----|-------|
| **Sine** | InSine | OutSine | InOutSine |
| **Cubic** | InCubic | OutCubic | InOutCubic |
| **Quint** | InQuint | OutQuint | InOutQuint |
| **Circ** | InCirc | OutCirc | InOutCirc |
| **Elastic** | InElastic | OutElastic | InOutElastic |
| **Quad** | InQuad | OutQuad | InOutQuad |
| **Quart** | InQuart | OutQuart | InOutQuart |
| **Expo** | InExpo | OutExpo | InOutExpo |
| **Back** | InBack | OutBack | InOutBack |
| **Bounce** | InBounce | OutBounce | InOutBounce |

### Special: Drift Function

The `Drift` easing provides customizable acceleration:

```
Drift_X_Y
```

- X, Y: Parameters from 0-10 (scaled to 0-1 internally)
- Allows fine-tuned control over easing curves

### Shorthand Notation

ScriptMapper supports abbreviated easing names:

| Short | Full |
|-------|------|
| `I` + name | `In` + name |
| `O` + name | `Out` + name |
| `IO` + name | `InOut` + name |

**Examples:** `OCubic` = `OutCubic`, `IOBounce` = `InOutBounce`

## Camera Position Commands

ScriptMapper provides preset camera positions:

| Command | Description |
|---------|-------------|
| `center` | Front/back view of avatar |
| `top` | Above avatar |
| `side` | Side view (height 1.5m) |
| `diagf` | Diagonal front (height 3m) |
| `diagb` | Diagonal back (height 3m) |
| `random` | Random position within radius |

### Position Modifiers

| Modifier | Effect |
|----------|--------|
| `stop` | Hold position |
| `mirror` | Flip left/right |
| `zoom` | Adjust FOV |
| `spin` | Z-axis rotation |
| `slide` | Move left/right |
| `shift` | Move up/down |
| `push` | Move forward/back |
| `turn` | Rotate around avatar |

## Workflow Tips

1. **Start simple** - Test basic transitions before complex paths
2. **Use Drift sparingly** - Default easings cover most needs
3. **Preview in First Person** - Check for disorienting movements
4. **Test at different speeds** - Slow playback reveals issues
5. **Save working presets** - Build a library of useful camera moves

## Specification Reference

For complete ScriptMapper documentation, see:
- [ScriptMapper Specification](../scriptmapper-specification.md)
- [ScriptMapper GitHub Repository](https://github.com/hibit-at/Scriptmapper)
- [easings.net](https://easings.net/) - Visual easing reference

## Related Pages

- [[Comparison-Mode]] - Compare easing functions
- [[Preview-Types]] - Visualization options
- [[Easing-Functions]] - Function reference
- [[Getting-Started]] - Basic usage guide
