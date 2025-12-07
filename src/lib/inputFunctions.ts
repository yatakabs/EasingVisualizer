export interface InputFunction {
  id: string
  name: string
  formula: string
  calculate: (t: number) => number
}

export const INPUT_FUNCTIONS: InputFunction[] = [
  {
    id: 'triangle',
    name: 'Triangle Wave',
    formula: 'x = t % 2, triangle',
    calculate: (t: number) => {
      const normalizedX = t % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return baseX
    }
  },
  {
    id: 'linear',
    name: 'Linear',
    formula: 'x = t % 1',
    calculate: (t: number) => {
      return t % 1
    }
  },
  {
    id: 'sawtooth',
    name: 'Sawtooth',
    formula: 'x = 1 - (t % 1)',
    calculate: (t: number) => {
      return 1 - (t % 1)
    }
  },
  {
    id: 'sine',
    name: 'Sine Wave',
    formula: 'x = (sin(2πt) + 1) / 2',
    calculate: (t: number) => {
      return (Math.sin(2 * Math.PI * t) + 1) / 2
    }
  },
  {
    id: 'square',
    name: 'Square Wave',
    formula: 'x = (t % 1) < 0.5 ? 0 : 1',
    calculate: (t: number) => {
      return (t % 1) < 0.5 ? 0 : 1
    }
  },
  {
    id: 'ease-in-out',
    name: 'Ease In-Out',
    formula: 'x = smoothstep(t)',
    calculate: (t: number) => {
      const x = t % 1
      return x * x * (3 - 2 * x)
    }
  }
]
