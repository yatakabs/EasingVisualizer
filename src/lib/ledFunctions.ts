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
    formula: 'y = x',
    calculate: (t: number) => {
      return t < 0.5 ? 2 * t : 2 * (1 - t)
    },
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'y = sin(πx)',
    calculate: (t: number) => {
      const x = t < 0.5 ? 2 * t : 2 * (1 - t)
      return Math.sin(Math.PI * x / 2)
    },
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'y = x²',
    calculate: (t: number) => {
      const x = t < 0.5 ? 2 * t : 2 * (1 - t)
      return x * x
    },
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = x³',
    calculate: (t: number) => {
      const x = t < 0.5 ? 2 * t : 2 * (1 - t)
      return x * x * x
    },
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'y = x⁴',
    calculate: (t: number) => {
      const x = t < 0.5 ? 2 * t : 2 * (1 - t)
      return x * x * x * x
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (t: number) => {
      const x = t < 0.5 ? 2 * t : 2 * (1 - t)
      return Math.sqrt(x)
    },
    color: 'oklch(0.75 0.15 40)'
  }
]
