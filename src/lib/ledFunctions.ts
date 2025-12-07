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
    formula: 'y = t',
    calculate: (t: number) => t,
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine Wave',
    formula: 'y = (sin(2πt) + 1) / 2',
    calculate: (t: number) => (Math.sin(2 * Math.PI * t) + 1) / 2,
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'exponential',
    name: 'Exponential',
    formula: 'y = t²',
    calculate: (t: number) => t * t,
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'inverse-exp',
    name: 'Inverse Exponential',
    formula: 'y = 1 - (1 - t)²',
    calculate: (t: number) => 1 - Math.pow(1 - t, 2),
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quadratic-ease',
    name: 'Quadratic Ease In-Out',
    formula: 'y = t < 0.5 ? 2t² : 1 - 2(1-t)²',
    calculate: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
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
    formula: 'y = t³',
    calculate: (t: number) => t * t * t,
    color: 'oklch(0.75 0.15 60)'
  },
  {
    id: 'elastic',
    name: 'Elastic',
    formula: 'y = sin(13πt/2) × 2^(-10t)',
    calculate: (t: number) => Math.sin((13 * Math.PI * t) / 2) * Math.pow(2, -10 * t),
    color: 'oklch(0.75 0.15 240)'
  },
  {
    id: 'bounce',
    name: 'Bounce',
    formula: 'y = 1 - |cos(πt × 7.5)| × (1-t)',
    calculate: (t: number) => 1 - Math.abs(Math.cos(Math.PI * t * 7.5)) * (1 - t),
    color: 'oklch(0.75 0.15 180)'
  }
]
