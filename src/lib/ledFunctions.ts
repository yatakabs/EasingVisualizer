export interface LEDFunction {
  id: string
  name: string
  formula: string
  calculate: (t: number, cycleMultiplier?: number) => number
  color: string
}

export const LED_FUNCTIONS: LEDFunction[] = [
  {
    id: 'linear',
    name: 'Linear',
    formula: 'y = x',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return x
      }
      const normalizedX = x % 2
      return normalizedX < 1 ? normalizedX : 2 - normalizedX
    },
    color: 'oklch(0.75 0.15 200)'
  },
  {
    id: 'sine',
    name: 'Sine',
    formula: 'y = sin(πx)',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return Math.sin(Math.PI * x / 2)
      }
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return Math.sin(Math.PI * baseX / 2)
    },
    color: 'oklch(0.75 0.15 280)'
  },
  {
    id: 'quadratic',
    name: 'Quadratic',
    formula: 'y = x²',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return x * x
      }
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return baseX * baseX
    },
    color: 'oklch(0.75 0.15 160)'
  },
  {
    id: 'cubic',
    name: 'Cubic',
    formula: 'y = x³',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return x * x * x
      }
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return baseX * baseX * baseX
    },
    color: 'oklch(0.75 0.15 120)'
  },
  {
    id: 'quartic',
    name: 'Quartic',
    formula: 'y = x⁴',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return x * x * x * x
      }
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return baseX * baseX * baseX * baseX
    },
    color: 'oklch(0.75 0.15 80)'
  },
  {
    id: 'sqrt',
    name: 'Square Root',
    formula: 'y = √x',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      if (cycleMultiplier === 1) {
        return Math.sqrt(x)
      }
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return Math.sqrt(baseX)
    },
    color: 'oklch(0.75 0.15 40)'
  }
]
