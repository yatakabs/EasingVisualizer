import type { EaseType } from './easeTypes'

export interface LEDFunction {
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

export const LED_FUNCTIONS: LEDFunction[] = [
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
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (x: number, easeType: EaseType) => {
      return applyEaseToFunction(x, (t) => Math.sqrt(t), easeType)
    },
    color: 'oklch(0.75 0.15 40)'
  }
]
