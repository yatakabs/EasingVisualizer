# URL Sharing

EasingVisualizer supports sharing your entire configuration via URL, making it easy to share setups with others or bookmark specific configurations.

## How URL State Works

When you click the **Share** button, the current application state is encoded into the URL. This includes:

- **Panel configuration** - Which easing functions are displayed
- **Ease types** - Whether each panel uses easein, easeout, or easeboth
- **Speed settings** - Animation playback speed
- **Gamma correction** - Output filter settings
- **Preview type** - Current preview mode (glow, graph, camera, value)

The state is encoded using **base64url** encoding for compact, URL-safe representation.

## What Gets Saved

| Setting | Saved | Notes |
|---------|-------|-------|
| Visible panels | ✅ | Function ID and ease type for each panel |
| Animation speed | ✅ | Global speed multiplier |
| Gamma correction | ✅ | Output filter value |
| Input function | ✅ | Selected wave type |
| Preview type | ✅ | Current preview mode |
| Custom panel titles | ✅ | User-defined names |
| Presets | ❌ | Stored in localStorage only |

## Sharing URLs

### Creating a Share URL

1. Configure your panels and settings as desired
2. Click the **Share** button in the toolbar
3. The URL is automatically copied to your clipboard
4. Share the URL with others

### Using a Shared URL

1. Open the shared URL in your browser
2. A preview banner shows what will be loaded
3. Click **Apply** to load the shared configuration
4. Your previous settings are preserved until you apply

## URL State Format

The URL uses a compact serialization format with short keys:

| Key | Meaning |
|-----|---------|
| `p` | Panels array |
| `sp` | Speed |
| `gm` | Gamma |
| `in` | Input function |
| `pv` | Preview type |

### Version Compatibility

URLs include a version number (`STATE_VERSION`) for forward compatibility. When the format changes, migrations ensure older URLs still work.

## Technical Details

The URL state system is implemented in:

- [[Getting-Started]] - Basic usage overview
- See `src/lib/urlState.ts` for implementation details
- See `src/hooks/useURLState.ts` for the React hook

## Related Pages

- [[Getting-Started]]
- [[Preset-System]]
- [[Comparison-Mode]]
