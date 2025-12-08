import type { EaseType } from './easeTypes'

export interface EasingFunction {
  id: string
  name: string
  formula: string
  calculate: (x: number, easeType: EaseType) => number
  color: string
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
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'y = sin(πx/2)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => Math.sin(Math.PI * t / 2), easeType)
    },
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'y = x²',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t, easeType)
    },
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = x³',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'y = x⁴',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'quintic',
    name: 'Quintic',
    formula: 'y = x⁵',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * t * t * t, easeType)
    },
    color: 'oklch(0.75 0.15 50)'
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
    color: 'oklch(0.75 0.15 20)'
  },
  {
    id: 'circular',
    name: 'Circular',
    formula: 'y = 1 - √(1-x²)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => 1 - Math.sqrt(1 - t * t), easeType)
    },
    color: 'oklch(0.75 0.15 340)'
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => Math.sqrt(t), easeType)
    },
    color: 'oklch(0.75 0.15 40)'
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
    color: 'oklch(0.75 0.15 300)'
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
    color: 'oklch(0.75 0.15 260)'
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
    color: 'oklch(0.75 0.15 220)'
  },
  {
    id: 'hermite',
    name: 'Hermite',
    formula: 'y = x²(3 - 2x)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => t * t * (3 - 2 * t), easeType)
    },
    color: 'oklch(0.75 0.15 180)'
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
    color: 'oklch(0.75 0.15 140)'
  },
  {
    id: 'parabolic',
    name: 'Parabolic',
    formula: 'y = 4x(1-x)',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => 4 * t * (1 - t), easeType)
    },
    color: 'oklch(0.75 0.15 100)'
  },
  {
    id: 'trigonometric',
    name: 'Trigonometric',
    formula: 'y = (1 - cos(πx))/2',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => (1 - Math.cos(Math.PI * t)) / 2, easeType)
    },
    color: 'oklch(0.75 0.15 60)'
  }
]
