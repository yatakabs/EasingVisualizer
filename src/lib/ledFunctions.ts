export interface LEDFunction {
  id: string
  name: string
  formula: string
  calculate: (x: number) => number
  color: string
}

export const LED_FUNCTIONS: LEDFunction[] = [
  {
    id: 'linear',
    name: 'Linear',
    formula: 'y = x',
    calculate: (x: number) => {
      return x
    },
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'y = sin(πx/2)',
    calculate: (x: number) => {
      return Math.sin(Math.PI * x / 2)
    },
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'y = x²',
    calculate: (x: number) => {
      return x * x
    },
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = x³',
    calculate: (x: number) => {
      return x * x * x
    },
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'y = x⁴',
    calculate: (x: number) => {
      return x * x * x * x
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (x: number) => {
      return Math.sqrt(x)
    },
    color: 'oklch(0.75 0.15 40)'
  }
]
