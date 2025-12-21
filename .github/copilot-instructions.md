# Easing Visualizer - Copilot Instructions

## Project Overview

A visual comparison tool for easing functions targeting Beat Saber modding and animation workflows. Displays animated panels showing glow, graph, 3D camera, and value previews for 16+ mathematical easing functions.

**Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Three.js, Radix UI (shadcn/ui), Vitest

## Architecture

### Core Data Flow
```
InputFunction → EasingFunction(easeType) → OutputFilter → Preview Components
```

- **Input layer** ([src/lib/inputFunctions.ts](src/lib/inputFunctions.ts)): Triangle, Linear, Sawtooth, Sine, Square, Ease In-Out waves
- **Easing layer** ([src/lib/easingFunctions.ts](src/lib/easingFunctions.ts)): 16 functions with `applyEaseToFunction()` pattern supporting easein/easeout/easeboth transformations
- **Filter layer** ([src/lib/outputFilters.ts](src/lib/outputFilters.ts)): Gamma correction and identity filters
- **Preview layer** ([src/components/previews/](src/components/previews/)): GlowPreview, GraphPreview, CameraPreview (Three.js), ValuePreview

### State Management
- **Local persistence**: `useLocalKV` hook ([src/hooks/useLocalKV.ts](src/hooks/useLocalKV.ts)) wraps localStorage, compatible with GitHub Spark's `useKV` API
- **URL sharing**: `useURLState` hook ([src/hooks/useURLState.ts](src/hooks/useURLState.ts)) with base64url encoding for shareable configurations
- **Animation loop**: Single `requestAnimationFrame` loop in App.tsx drives all panels at 60fps

### Key Types
```typescript
type EaseType = 'easein' | 'easeout' | 'easeboth'     // src/lib/easeTypes.ts
type PreviewType = 'glow' | 'graph' | 'camera' | 'value'  // src/lib/previewTypes.ts
interface PanelData { id, functionId, easeType, title? }   // src/lib/urlState.ts
```

## Development Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # TypeScript check + Vite build
npm run test       # Vitest watch mode
npm run test:run   # Single test run (CI)
npm run lint       # ESLint
```

## Conventions

### Path Aliases
Use `@/` for all imports from src: `import { Button } from '@/components/ui/button'`

### Adding Easing Functions
Add to `EASING_FUNCTIONS` array in [src/lib/easingFunctions.ts](src/lib/easingFunctions.ts):
```typescript
{
  id: 'myfunction',
  name: 'My Function',
  formula: 'y = f(x)',  // Display formula
  calculate: (x: number, easeType: EaseType) => {
    return applyEaseToFunction(x, (t) => /* math */, easeType)
  },
  color: 'oklch(0.75 0.15 HUE)'  // Use OKLCH for consistent saturation
}
```

### Adding Preview Types
1. Create component in [src/components/previews/](src/components/previews/)
2. Add type to `PreviewType` union in [src/lib/previewTypes.ts](src/lib/previewTypes.ts)
3. Register in `PREVIEW_CONFIGS` array
4. Add rendering case in `PreviewPanel.tsx`

### Component Patterns
- Use `memo()` for all preview components (frequent re-renders from animation)
- Three.js components: cleanup refs in `useEffect` return, dispose geometries/materials
- UI components from [src/components/ui/](src/components/ui/) (shadcn/ui with Radix primitives)

### URL State Serialization
Compact keys in `ShareableStateV1` ([src/lib/urlState.ts](src/lib/urlState.ts)): `p`=panels, `sp`=speed, `gm`=gamma, etc.
When adding new state: add to `AppState`, `ShareableStateV1`, encode/decode functions, and bump `STATE_VERSION` for migrations.

## Testing

- Tests colocated with source: `*.test.ts` next to implementation
- jsdom environment with mocked `window.location` and `history` for URL tests
- Use `vi.useFakeTimers()` for debounce testing (setup in [src/test/setup.ts](src/test/setup.ts))

## GitHub Spark Compatibility

The app supports both standalone and GitHub Spark deployment:
- Spark plugins auto-disabled in CI via `GITHUB_ACTIONS` or `VITE_SPARK_DISABLED` env vars
- `useLocalKV` provides localStorage fallback when Spark KV unavailable
- Base path configured for GitHub Pages (`/EasingVisualizer/`) vs local (`/`)
