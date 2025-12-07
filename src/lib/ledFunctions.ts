export interface LEDFunction {
  id: string
  name: string
  formula: string
  calculate: (t: number) => number
  color: string
}

function triangle(t: number): number {
  return t < 0.5 ? 2 * t : 2 * (1 - t)
}

export const LED_FUNCTIONS: LEDFunction[] = [
  {
    id: 'linear',
    name: 'Linear',
    formula: 'triangle(t)',
    calculate: triangle,
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'sin(πt)',
    calculate: (t: number) => Math.sin(Math.PI * t),
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'triangle(t)²',
    calculate: (t: number) => {
      const v = triangle(t)
      return v * v
    },
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'triangle(t)³',
    calculate: (t: number) => {
      const v = triangle(t)
      return v * v * v
    },
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'triangle(t)⁴',
    calculate: (t: number) => {
      const v = triangle(t)
      return v * v * v * v
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: '√triangle(t)',
    calculate: (t: number) => Math.sqrt(triangle(t)),
    color: 'oklch(0.75 0.15 40)'
  }
]
