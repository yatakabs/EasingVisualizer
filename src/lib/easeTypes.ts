export type EaseType = 'easein' | 'easeout' | 'easeboth'

export interface EaseTransform {
  id: EaseType
  name: string
  apply: (t: number) => number
}

export const EASE_TRANSFORMS: EaseTransform[] = [
  {
    id: 'easein',
    name: 'EaseIn',
    apply: (t: number) => t * t
  },
  {
    id: 'easeout',
    name: 'EaseOut',
    apply: (t: number) => Math.sqrt(t)
  },
  {
    id: 'easeboth',
    name: 'EaseBoth',
    apply: (t: number) => Math.sin(Math.PI * t / 2)
  }
]

export function applyEase(t: number, easeType: EaseType): number {
  const ease = EASE_TRANSFORMS.find(e => e.id === easeType)
  return ease ? ease.apply(t) : t
}
