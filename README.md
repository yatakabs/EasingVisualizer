# Easing Function Visualizer

A visual comparison tool for easing functions designed for Beat Saber modding and animation workflows. Displays animated panels showing glow, graph, 3D camera, and value previews for 16+ mathematical easing functions.

## Features

### Core Functionality

- **Multiple Preview Types**: Glow (light intensity), Graph (2D curve), Camera (3D movement), Value (numerical output)
- **16+ Easing Functions**: Linear, Sine, Quadratic, Cubic, Quartic, Quintic, Exponential, Circular, Square Root, Back, Elastic, Bounce, Hermite, Bezier, Parabolic, Trigonometric
- **Easing Transformations**: EaseIn, EaseOut, EaseBoth for each function
- **Playback Controls**: Play/pause, speed adjustment (0.1x-10x), 60fps animation
- **Camera 3D Preview**: Configurable start/end positions, aspect ratios, left/right-handed coordinate systems
- **Input Modes**: Auto-play, Manual slider, Triangular wave

### Preset Management

Save and load complete app configurations with the preset system:

- **Save Current State**: Save your current panel layout, speed, gamma, and all settings as a named preset
- **Load Presets**: Quickly restore saved configurations
- **Export/Import**: Share presets as JSON files with others
- **URL Sharing**: Share configurations via URL - recipients see a preview banner to apply, save, or dismiss

#### Using Presets

1. **Save a Preset**:
   - Configure your panels and settings as desired
   - Click "Save Current State" (in Preset Manager or inline UI)
   - Enter a name and save

2. **Load a Preset**:
   - Open Preset Manager
   - Click "Load" on any preset to apply its configuration

3. **Export/Import Presets**:
   - **Export**: Click "Export" on a preset (or "Export All") to download JSON
   - **Import**: Click "Import" in Preset Manager, select JSON file, choose conflict resolution strategy

4. **URL Sharing with Preview Mode**:
   - When someone opens a shared URL, they see a preview banner instead of automatic state overwrite
   - Options:
     - **Apply**: Use the shared configuration
     - **Save as Preset**: Save the shared config as a preset for later
     - **Dismiss**: Keep current state and ignore the shared URL

#### Preset Limits

- Maximum 50 presets per user
- When limit reached, export old presets before creating new ones
- All presets stored in browser localStorage

### Advanced Settings

- **Gamma Correction**: Apply output filters with adjustable gamma (1.0-4.0)
- **Panel Scaling**: Adjust card size (0.5x-2.0x)
- **End Pause Duration**: Pause at animation end (0-5 seconds)
- **Manual Input Mode**: Scrub through animation manually
- **Triangular Wave Mode**: Convert linear input to triangular wave pattern

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Three.js (3D camera preview)
- Radix UI / shadcn/ui (UI components)
- Vitest (testing)

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Build for production
npm run test      # Run tests in watch mode
npm run test:run  # Run tests once (CI)
npm run lint      # Run ESLint
```

## Project Structure

- `/src/components/` - React components (panels, controls, UI)
- `/src/hooks/` - Custom hooks (useLocalKV, useURLState, usePresets)
- `/src/lib/` - Core logic (easing functions, input functions, output filters, presets)
- `/src/components/ui/` - Reusable UI components (shadcn/ui)

## State Management

- **Local Storage**: Settings persisted via `useLocalKV` hook (compatible with GitHub Spark)
- **URL State**: Shareable configurations encoded in URL query parameter
- **Presets**: Named saved states stored in localStorage under `easingviz.presets.v1`

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Use path alias `@/` for imports from `src/`
3. Add tests for new functionality
4. Ensure all tests pass: `npm run test:run`
5. Build successfully: `npm run build`

## License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
