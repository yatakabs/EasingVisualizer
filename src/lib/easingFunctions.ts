import type { EaseType } from './easeTypes'

export interface ParametricEasingParams {
  x?: number  // 0-10 range for Drift function
  y?: number  // 0-10 range for Drift function
}

export interface EasingFunction {
  id: string
  name: string
  formula: string
  calculate: (x: number, easeType: EaseType, params?: ParametricEasingParams) => number
  color: string
  scriptMapperName?: string  // ScriptMapper-compatible name (e.g., 'Sine', 'Cubic')
  scriptMapperCompatible: boolean  // Whether this function exists in ScriptMapper
  isParametric?: boolean  // Whether this function requires parameter controls
  defaultParams?: ParametricEasingParams  // Default parameter values for parametric functions
}

function applyEaseToFunction(
  x: number,
  baseFunction: (t: number) => number,
  easeType: EaseType
): number {
  switch (easeType) {
    case 'easein':
      return baseFunction(x)
    case 'easeout':
      return 1 - baseFunction(1 - x)
    case 'easeboth': {
      if (x < 0.5) {
        return baseFunction(2 * x) / 2
      } else {
        return 1 - baseFunction(2 * (1 - x)) / 2
      }
    }
    default:
      return baseFunction(x)
  }
}

export const EASING_FUNCTIONS: EasingFunction[] = [
  {
    id: 'linear',
    name: 'Linear',
    formula: 'y = x',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t, easeType)
    },
    color: 'oklch(0.75 0.15 200)',
    scriptMapperCompatible: false
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'y = sin(πx/2)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => Math.sin(Math.PI * t / 2), easeType)
    },
    color: 'oklch(0.75 0.15 280)',
    scriptMapperName: 'Sine',
    scriptMapperCompatible: true
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'y = x²',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t, easeType)
    },
    color: 'oklch(0.75 0.15 160)',
    scriptMapperName: 'Quad',
    scriptMapperCompatible: true
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = x³',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 120)',
    scriptMapperName: 'Cubic',
    scriptMapperCompatible: true
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'y = x⁴',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 80)',
    scriptMapperName: 'Quart',
    scriptMapperCompatible: true
  },
  {
    id: 'quintic',
    name: 'Quintic',
    formula: 'y = x⁵',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 50)',
    scriptMapperName: 'Quint',
    scriptMapperCompatible: true
  },
  {
    id: 'exponential',
    name: 'Exponential',
    formula: 'y = 2^(10(x-1))',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => {
        if (t === 0) return 0
        if (t === 1) return 1
        return Math.pow(2, 10 * (t - 1))
      }, easeType)
    },
    color: 'oklch(0.75 0.15 20)',
    scriptMapperName: 'Expo',
    scriptMapperCompatible: true
  },
  {
    id: 'circular',
    name: 'Circular',
    formula: 'y = 1 - √(1-x²)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => 1 - Math.sqrt(1 - t * t), easeType)
    },
    color: 'oklch(0.75 0.15 340)',
    scriptMapperName: 'Circ',
    scriptMapperCompatible: true
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => Math.sqrt(t), easeType)
    },
    color: 'oklch(0.75 0.15 40)',
    scriptMapperCompatible: false
  },
  {
    id: 'back',
    name: 'Back',
    formula: 'y = x²(2.70158x - 1.70158)',
    calculate: (x: number, easeType: EaseType) => {
      const c1 = 1.70158
      return applyEaseToFunction(x, (t) => {
        const c3 = c1 + 1
        return c3 * t * t * t - c1 * t * t
      }, easeType)
    },
    color: 'oklch(0.75 0.15 300)',
    scriptMapperName: 'Back',
    scriptMapperCompatible: true
  },
  {
    id: 'elastic',
    name: 'Elastic',
    formula: 'y = -2^(10(x-1))sin((x-1.1)×2π/0.4)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => {
        if (t === 0) return 0
        if (t === 1) return 1
        const c4 = (2 * Math.PI) / 3
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
      }, easeType)
    },
    color: 'oklch(0.75 0.15 260)',
    scriptMapperName: 'Elastic',
    scriptMapperCompatible: true
  },
  {
    id: 'bounce',
    name: 'Bounce',
    formula: 'Piecewise bounce function',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => {
        const n1 = 7.5625
        const d1 = 2.75
        
        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      }, easeType)
    },
    color: 'oklch(0.75 0.15 220)',
    scriptMapperName: 'Bounce',
    scriptMapperCompatible: true
  },
  {
    id: 'hermite',
    name: 'Hermite',
    formula: 'y = x²(3 - 2x)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * (3 - 2 * t), easeType)
    },
    color: 'oklch(0.75 0.15 180)',
    scriptMapperCompatible: false
  },
  {
    id: 'bezier',
    name: 'Bezier',
    formula: 'y = 3x²(1-x) + x³',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => {
        return 3 * t * t * (1 - t) + t * t * t
      }, easeType)
    },
    color: 'oklch(0.75 0.15 140)',
    scriptMapperCompatible: false
  },
  {
    id: 'parabolic',
    name: 'Parabolic',
    formula: 'y = 4x(1-x)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => 4 * t * (1 - t), easeType)
    },
    color: 'oklch(0.75 0.15 100)',
    scriptMapperCompatible: false
  },
  {
    id: 'trigonometric',
    name: 'Trigonometric',
    formula: 'y = (1 - cos(πx))/2',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => (1 - Math.cos(Math.PI * t)) / 2, easeType)
    },
    color: 'oklch(0.75 0.15 60)',
    scriptMapperCompatible: false
  },
  {
    id: 'drift',
    name: 'Drift',
    formula: 'Parametric (x, y)',
    calculate: (x: number, easeType: EaseType, params?: ParametricEasingParams) => {
      const xParam = (params?.x ?? 6) / 10  // Normalize 0-10 to 0-1
      const yParam = (params?.y ?? 6) / 10
      
      // Drift uses a custom curve based on ScriptMapper's implementation
      const driftCalc = (t: number): number => {
        // Handle edge cases to prevent division by zero
        if (xParam <= 0) return t < 0.001 ? 0 : yParam + (t / 1) * (1 - yParam)
        if (xParam >= 1) return Math.pow(t, 2) * yParam
        
        if (t < xParam) {
          return Math.pow(t / xParam, 2) * yParam
        } else {
          return yParam + ((t - xParam) / (1 - xParam)) * (1 - yParam)
        }
      }
      
      // Apply standard ease transformation
      return applyEaseToFunction(x, driftCalc, easeType)
    },
    color: 'oklch(0.75 0.18 330)',  // Distinct magenta
    scriptMapperName: 'Drift',
    scriptMapperCompatible: true,
    isParametric: true,
    defaultParams: { x: 6, y: 6 }
  }
]
