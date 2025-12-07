export interface InputFunction {
  id: string
  name: string
  formula: string
  calculate: (t: number, cycleMultiplier: number) => number
}

export const INPUT_FUNCTIONS: InputFunction[] = [
  {
    id: 'triangle',
    name: 'Triangle Wave',
    formula: 'x = (t × c) % 2, triangle',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = t * cycleMultiplier
      const normalizedX = x % 2
      const baseX = normalizedX < 1 ? normalizedX : 2 - normalizedX
      return baseX
    }
  },
  {
    id: 'linear',
    name: 'Linear',
    formula: 'x = (t × c) % 1',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      return (t * cycleMultiplier) % 1
    }
  },
  {
    id: 'sawtooth',
    name: 'Sawtooth',
    formula: 'x = 1 - ((t × c) % 1)',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      return 1 - ((t * cycleMultiplier) % 1)
    }
  },
  {
    id: 'sine',
    name: 'Sine Wave',
    formula: 'x = (sin(2πt × c) + 1) / 2',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      return (Math.sin(2 * Math.PI * t * cycleMultiplier) + 1) / 2
    }
  },
  {
    id: 'square',
    name: 'Square Wave',
    formula: 'x = ((t × c) % 1) < 0.5 ? 0 : 1',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      return ((t * cycleMultiplier) % 1) < 0.5 ? 0 : 1
    }
  },
  {
    id: 'ease-in-out',
    name: 'Ease In-Out',
    formula: 'x = smoothstep(t × c)',
    calculate: (t: number, cycleMultiplier: number = 1) => {
      const x = (t * cycleMultiplier) % 1
      return x * x * (3 - 2 * x)
    }
  }
]
