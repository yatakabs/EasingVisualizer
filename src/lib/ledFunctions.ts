export interface LEDFunction {
  id: string
  name: string
  formula: string
  calculate: (t: number) => number
  color: string
}

export const LED_FUNCTIONS: LEDFunction[] = [
  {
    id: 'linear',
    name: 'Linear',
    formula: 'y = t < 0.5 ? 2t : 2(1-t)',
    calculate: (t: number) => t < 0.5 ? 2 * t : 2 * (1 - t),
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine Wave',
    formula: 'y = sin(πt)',
    calculate: (t: number) => Math.sin(Math.PI * t),
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'exponential',
    name: 'Exponential',
    formula: 'y = t < 0.5 ? 2t² : 2(1-t)²',
    calculate: (t: number) => t < 0.5 ? 2 * t * t : 2 * Math.pow(1 - t, 2),
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'inverse-exp',
    name: 'Inverse Exponential',
    formula: 'y = t < 0.5 ? 1 - 2(0.5-t)² : 1 - 2(t-0.5)²',
    calculate: (t: number) => t < 0.5 ? 1 - 2 * Math.pow(0.5 - t, 2) : 1 - 2 * Math.pow(t - 0.5, 2),
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quadratic-ease',
    name: 'Quadratic Ease In-Out',
    formula: 'y = t < 0.25 ? 4t² : t < 0.75 ? 1 - 4(0.5-t)² : 4(1-t)²',
    calculate: (t: number) => {
      if (t < 0.25) return 4 * t * t
      if (t < 0.75) return 1 - 4 * Math.pow(0.5 - t, 2)
      return 4 * Math.pow(1 - t, 2)
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'pulse',
    name: 'Pulse (Square Wave)',
    formula: 'y = t < 0.5 ? 1 : 0',
    calculate: (t: number) => t < 0.5 ? 1 : 0,
    color: 'oklch(0.75 0.15 40)'
  },
  {
    id: 'triangle',
    name: 'Triangle Wave',
    formula: 'y = t < 0.5 ? 2t : 2(1-t)',
    calculate: (t: number) => t < 0.5 ? 2 * t : 2 * (1 - t),
    color: 'oklch(0.75 0.15 320)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = t < 0.5 ? 2t³ : 2(1-t)³',
    calculate: (t: number) => t < 0.5 ? 2 * t * t * t : 2 * Math.pow(1 - t, 3),
    color: 'oklch(0.75 0.15 60)'
  },
  {
    id: 'elastic',
    name: 'Elastic',
    formula: 'y = |sin(13πt)| × (1 - |2t - 1|)',
    calculate: (t: number) => Math.abs(Math.sin(13 * Math.PI * t)) * (1 - Math.abs(2 * t - 1)),
    color: 'oklch(0.75 0.15 240)'
  },
  {
    id: 'bounce',
    name: 'Bounce',
    formula: 'y = |cos(πt × 7.5)| × sin(πt)',
    calculate: (t: number) => Math.abs(Math.cos(Math.PI * t * 7.5)) * Math.sin(Math.PI * t),
    color: 'oklch(0.75 0.15 180)'
  }
]
