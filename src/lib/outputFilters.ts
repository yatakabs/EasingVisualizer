export interface OutputFilter {
  id: string
  name: string
  apply: (output: number, params?: Record<string, number>) => number
  parameterNames?: string[]
}

export const OUTPUT_FILTERS: OutputFilter[] = [
  {
    id: 'gamma',
    name: 'Gamma Correction',
    apply: (output: number, params?: Record<string, number>) => {
      const gamma = params?.gamma ?? 2.2
      const sign = output < 0 ? -1 : 1
      const absValue = Math.abs(output)
      return sign * Math.pow(absValue, 1 / gamma)
    },
    parameterNames: ['gamma']
  },
  {
    id: 'identity',
    name: 'None',
    apply: (output: number) => output,
    parameterNames: []
  }
]

export function applyFilters(
  output: number, 
  filterIds: string[], 
  params?: Record<string, number>
): number {
  let result = output
  
  for (const filterId of filterIds) {
    const filter = OUTPUT_FILTERS.find(f => f.id === filterId)
    if (filter) {
      result = filter.apply(result, params)
    }
  }
  
  return result
}
