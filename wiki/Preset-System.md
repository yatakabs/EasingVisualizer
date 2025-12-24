# Preset System

The Preset System allows you to save, load, and share panel configurations in Easing Visualizer.

## Overview

Presets store your complete app state including:
- Panel arrangement and functions
- Ease types for each panel
- Animation speed settings
- Preview type selections
- Filter/gamma settings

## Built-in Presets

Easing Visualizer includes several pre-configured presets:

| Preset | Description |
|--------|-------------|
| **Default** | Standard 6-panel comparison layout |
| **All EaseIn** | All functions with EaseIn applied |
| **All EaseOut** | All functions with EaseOut applied |
| **Bounce Family** | Elastic and bounce functions |
| **Camera Paths** | Optimized for 3D camera preview |

> **Tip:** Press `1`-`5` to quickly load the first five presets.

## Creating Custom Presets

### Step-by-Step

1. Configure your panels as desired
2. Press `P` or click **Presets** in the toolbar
3. Click **Save Current State**
4. Enter a descriptive name
5. Click **Save**

### Naming Tips

- Use descriptive names: "Bounce Comparison", "Camera Test Setup"
- Include context: "ScriptMapper - Slow Transitions"
- Avoid duplicates - the system will rename automatically

## Managing Presets

### Preset Manager

Open with `P` or the **Presets** button to:

| Action | Description |
|--------|-------------|
| **Load** | Apply a saved preset |
| **Rename** | Change preset name |
| **Delete** | Remove unwanted presets |
| **Export** | Download as JSON file |
| **Import** | Load from JSON file |

### Preset Information

Each preset shows:
- **Name** - Your chosen identifier
- **Source** - Where it came from (local, url, import)
- **Created** - When it was saved
- **Panel Count** - Number of panels in the preset

## Local Storage

### How It Works

Presets are automatically saved to your browser's local storage:
- Persists between sessions
- Specific to the browser/device
- No account or login required

### Storage Limits

| Limit | Value |
|-------|-------|
| Maximum presets | 50 |
| Storage per preset | ~10 KB |
| Total storage | ~500 KB |

### Clearing Data

To remove all saved presets:
1. Open browser Developer Tools
2. Go to Application > Local Storage
3. Clear the EasingVisualizer entries

> **Warning:** This cannot be undone.

## URL Sharing

### Sharing Your Configuration

1. Set up your panels and settings
2. Press `S` or click the **Share** button
3. The URL is copied to your clipboard
4. Send the URL to others

### URL Format

The URL contains encoded state data:
```
https://yatakabs.github.io/EasingVisualizer/?state=BASE64_DATA
```

### Loading Shared URLs

Simply open the URL - the app automatically:
1. Decodes the state data
2. Restores all panel configurations
3. Applies settings and filters

### Save from URL

When you open a shared URL:
1. A banner shows "Viewing shared configuration"
2. Click **Save as Preset** to keep it
3. The configuration is added to your local presets

## Export and Import

### Exporting Presets

Export individual presets or all presets as JSON:

**Single Preset:**
1. Open Preset Manager (`P`)
2. Click the export icon on a preset
3. JSON file downloads automatically

**All Presets:**
1. Open Preset Manager
2. Click **Export All**
3. Single JSON file with all presets downloads

### Importing Presets

1. Open Preset Manager (`P`)
2. Click **Import**
3. Paste JSON or select file
4. Choose conflict handling strategy:
   - **Rename** - Keep both, add suffix to imported
   - **Replace** - Overwrite existing
   - **Skip** - Keep existing, ignore imported

### JSON Format

```json
{
  "name": "My Preset",
  "data": {
    "panels": [...],
    "speed": 1.0,
    "gamma": 1.0,
    ...
  },
  "source": "local",
  "createdAt": "2024-12-24T00:00:00.000Z"
}
```

## Workflow Tips

### Quick Iteration

1. Set up base configuration
2. Save as "Base Setup"
3. Make variations, save each
4. Use `1`-`5` to compare quickly

### Collaboration

1. Create useful presets
2. Export as JSON
3. Share file with team
4. Team imports and has same setups

### Backup

Periodically export all presets to avoid data loss:
- Browser updates
- Clearing cache
- Using different devices

## Troubleshooting

### Preset Won't Load

- Check if preset is corrupted (try export/re-import)
- Verify panel count doesn't exceed maximum (24)
- Clear local storage and reimport

### URL Too Long

Very complex configurations may create long URLs that some platforms truncate. Solutions:
- Save as preset and share JSON file instead
- Reduce number of panels
- Use simpler configurations

### Import Conflicts

When importing presets with same names:
1. Choose "Rename" to keep both versions
2. Or "Replace" to update existing
3. Review merged presets afterward

## Related Pages

- [[Getting-Started]] - Basic usage guide
- [[Comparison-Mode]] - Panel configuration
- [[Keyboard-Shortcuts]] - Quick access keys
- [[ScriptMapper-Mode]] - Beat Saber workflows
