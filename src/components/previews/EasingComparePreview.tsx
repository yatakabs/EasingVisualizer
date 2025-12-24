import { useMemo, memo } from 'react'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'

interface EasingComparePreviewProps {
  easingFunction: EasingFunction
  input: number
  easeType: EaseType
}

// Mini graph configuration
const MINI_GRAPH_SIZE = 40
const PADDING = 4
const INNER_SIZE = MINI_GRAPH_SIZE - PADDING * 2

export const EasingComparePreview = memo(function EasingComparePreview({
  easingFunction,
  input,
  easeType
}: EasingComparePreviewProps) {
  const { easeInPath, easeOutPath, easeBothPath, easeInValue, easeOutValue, easeBothValue } = useMemo(() => {
    const steps = 30
    const easeInPoints: string[] = []
    const easeOutPoints: string[] = []
    const easeBothPoints: string[] = []

    // Generate curve paths for each ease type
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = PADDING + t * INNER_SIZE

      const yIn = easingFunction.calculate(t, 'easein')
      const yOut = easingFunction.calculate(t, 'easeout')
      const yBoth = easingFunction.calculate(t, 'easeboth')

      easeInPoints.push(`${x},${PADDING + (1 - yIn) * INNER_SIZE}`)
      easeOutPoints.push(`${x},${PADDING + (1 - yOut) * INNER_SIZE}`)
      easeBothPoints.push(`${x},${PADDING + (1 - yBoth) * INNER_SIZE}`)
    }

    return {
      easeInPath: easeInPoints.join(' '),
      easeOutPath: easeOutPoints.join(' '),
      easeBothPath: easeBothPoints.join(' '),
      easeInValue: easingFunction.calculate(input, 'easein'),
      easeOutValue: easingFunction.calculate(input, 'easeout'),
      easeBothValue: easingFunction.calculate(input, 'easeboth')
    }
  }, [easingFunction, input])

  const renderMiniGraph = (
    path: string,
    value: number,
    type: EaseType,
    label: string,
    isSelected: boolean
  ) => {
    const dotX = PADDING + input * INNER_SIZE
    const dotY = PADDING + (1 - value) * INNER_SIZE

    // Color coding for ease types
    const colors = {
      easein: 'oklch(0.65 0.12 120)',    // Green
      easeout: 'oklch(0.65 0.12 280)',   // Purple
      easeboth: 'oklch(0.65 0.12 200)'   // Cyan
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`rounded border-2 transition-all ${
            isSelected
              ? 'border-primary shadow-sm'
              : 'border-border/30'
          }`}
          style={{
            width: MINI_GRAPH_SIZE,
            height: MINI_GRAPH_SIZE
          }}
        >
          <svg
            width={MINI_GRAPH_SIZE}
            height={MINI_GRAPH_SIZE}
            viewBox={`0 0 ${MINI_GRAPH_SIZE} ${MINI_GRAPH_SIZE}`}
          >
            {/* Background */}
            <rect
              x="0"
              y="0"
              width={MINI_GRAPH_SIZE}
              height={MINI_GRAPH_SIZE}
              fill="oklch(0.15 0.02 250)"
            />

            {/* Grid lines */}
            <line
              x1={PADDING}
              y1={MINI_GRAPH_SIZE / 2}
              x2={MINI_GRAPH_SIZE - PADDING}
              y2={MINI_GRAPH_SIZE / 2}
              stroke="oklch(0.3 0.03 250)"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            <line
              x1={MINI_GRAPH_SIZE / 2}
              y1={PADDING}
              x2={MINI_GRAPH_SIZE / 2}
              y2={MINI_GRAPH_SIZE - PADDING}
              stroke="oklch(0.3 0.03 250)"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />

            {/* Curve path */}
            <polyline
              points={path}
              fill="none"
              stroke={colors[type]}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Current position dot */}
            <circle
              cx={dotX}
              cy={dotY}
              r="2"
              fill={colors[type]}
              style={{
                filter: `drop-shadow(0 0 2px ${colors[type]})`
              }}
            />
          </svg>
        </div>
        <span
          className={`text-[10px] font-medium transition-colors ${
            isSelected ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className="w-full py-2 px-2">
      <div className="flex justify-around items-start">
        {renderMiniGraph(easeInPath, easeInValue, 'easein', 'In', easeType === 'easein')}
        {renderMiniGraph(easeOutPath, easeOutValue, 'easeout', 'Out', easeType === 'easeout')}
        {renderMiniGraph(easeBothPath, easeBothValue, 'easeboth', 'Both', easeType === 'easeboth')}
      </div>
    </div>
  )
})
