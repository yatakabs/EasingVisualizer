import { useMemo, memo } from 'react'
import type { EasingFunction } from '@/lib/easingFunctions'

interface GlowPreviewProps {
  easingFunction: EasingFunction
  filteredOutput: number
}

export const GlowPreview = memo(function GlowPreview({ 
  easingFunction, 
  filteredOutput
}: GlowPreviewProps) {
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, filteredOutput))
  }, [filteredOutput])

  return (
    <div className="w-full py-3">
      <div className="relative w-20 h-20 flex items-center justify-center mx-auto">
        <svg width="80" height="80" className="absolute inset-0" viewBox="0 0 80 80">
          <defs>
            <radialGradient id={`glow-${easingFunction.id}`}>
              <stop
                offset="0%"
                stopColor={easingFunction.color}
                stopOpacity={glowIntensity}
              />
              <stop
                offset="50%"
                stopColor={easingFunction.color}
                stopOpacity={glowIntensity * 0.6}
              />
              <stop
                offset="100%"
                stopColor={easingFunction.color}
                stopOpacity="0"
              />
            </radialGradient>
            <radialGradient id={`glow-inner-${easingFunction.id}`}>
              <stop
                offset="0%"
                stopColor={easingFunction.color}
                stopOpacity={glowIntensity}
              />
              <stop
                offset="70%"
                stopColor={easingFunction.color}
                stopOpacity={glowIntensity * 0.8}
              />
              <stop
                offset="100%"
                stopColor="oklch(0.2 0.02 250)"
                stopOpacity="1"
              />
            </radialGradient>
          </defs>
          
          <circle
            cx="40"
            cy="40"
            r="34"
            fill={`url(#glow-${easingFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="40"
            cy="40"
            r="17"
            fill={`url(#glow-inner-${easingFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="40"
            cy="40"
            r="17"
            fill="none"
            stroke="oklch(0.4 0.03 250)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  )
})
