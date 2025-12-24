# Contributing

Welcome! This guide will help you set up a development environment and contribute to EasingVisualizer.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Git** for version control

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/EasingVisualizer.git
cd EasingVisualizer
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Single test run (for CI) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/          # React components
│   ├── previews/       # Preview type components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Core logic and utilities
│   ├── easingFunctions.ts  # Easing function definitions
│   ├── inputFunctions.ts   # Input wave functions
│   ├── outputFilters.ts    # Output filters (gamma)
│   ├── previewTypes.ts     # Preview type definitions
│   └── urlState.ts         # URL serialization
├── styles/             # CSS and theme
└── test/               # Test setup
```

## Adding New Easing Functions

1. Open `src/lib/easingFunctions.ts`
2. Add your function to the `EASING_FUNCTIONS` array:

```typescript
{
  id: 'myfunction',           // Unique identifier
  name: 'My Function',        // Display name
  formula: 'y = f(x)',        // LaTeX-style formula for display
  calculate: (x: number, easeType: EaseType) => {
    return applyEaseToFunction(x, (t) => {
      // Your easing math here
      return t * t;  // Example: quadratic
    }, easeType)
  },
  color: 'oklch(0.75 0.15 180)'  // Use OKLCH for consistent saturation
}
```

3. The function will automatically appear in the selector

### Easing Function Guidelines

- Use `applyEaseToFunction()` to support all ease types (in/out/both)
- Return values should be in range [0, 1] for input [0, 1]
- Use OKLCH colors for visual consistency
- Add tests in `easingFunctions.test.ts`

## Adding New Preview Types

1. Create component in `src/components/previews/`:

```typescript
// src/components/previews/MyPreview.tsx
import { memo } from 'react'

interface MyPreviewProps {
  value: number        // Current eased value (0-1)
  color: string        // Function's theme color
  functionId: string   // For identification
}

export const MyPreview = memo(function MyPreview({ 
  value, 
  color 
}: MyPreviewProps) {
  return (
    <div style={{ /* use value for animation */ }}>
      {/* Your preview visualization */}
    </div>
  )
})
```

2. Add type to `src/lib/previewTypes.ts`:

```typescript
export type PreviewType = 'glow' | 'graph' | 'camera' | 'value' | 'mypreview'

export const PREVIEW_CONFIGS = [
  // ... existing configs
  {
    id: 'mypreview',
    name: 'My Preview',
    icon: MyIcon,
    description: 'Description for tooltip'
  }
]
```

3. Register in `PreviewPanel.tsx` render switch

## Testing

Tests are colocated with source files:

```
src/lib/easingFunctions.ts
src/lib/easingFunctions.test.ts
```

### Running Tests

```bash
# Watch mode (development)
npm run test

# Single run (CI)
npm run test:run
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(0.5)).toBe(0.25)
  })
})
```

## Code Style

- **TypeScript** - Strict mode enabled
- **Path aliases** - Use `@/` for src imports: `import { Button } from '@/components/ui/button'`
- **Components** - Use `memo()` for preview components
- **Formatting** - ESLint handles code style

## Pull Request Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run `npm run build` to verify no errors
5. Run `npm run test:run` to verify tests pass
6. Submit a pull request with a clear description

## Related Pages

- [[Getting-Started]]
- [[Easing-Functions]]
- [[Preview-Types]]
