import { useMemo, memo } from 'react'
import type { LEDFunction } from '@/lib/ledFunctions'

interface LEDPreviewProps {
  ledFunction: LEDFunction
  filteredOutput: number
}

export const LEDPreview = memo(function LEDPreview({ 
  ledFunction, 
  filteredOutput
}: LEDPreviewProps) {
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, filteredOutput))
  }, [filteredOutput])

  return (
    <div className="w-full py-2">
      <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
        <svg width="112" height="112" className="absolute inset-0" viewBox="0 0 112 112">
          <defs>
            <radialGradient id={`glow-${ledFunction.id}`}>
              <stop
                offset="0%"
                stopColor={ledFunction.color}
                stopOpacity={glowIntensity}
              />
              <stop
                offset="50%"
                stopColor={ledFunction.color}
                stopOpacity={glowIntensity * 0.6}
              />
              <stop
                offset="100%"
                stopColor={ledFunction.color}
                stopOpacity="0"
              />
            </radialGradient>
            <radialGradient id={`led-${ledFunction.id}`}>
              <stop
                offset="0%"
                stopColor={ledFunction.color}
                stopOpacity={glowIntensity}
              />
              <stop
                offset="70%"
                stopColor={ledFunction.color}
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
            cx="56"
            cy="56"
            r="48"
            fill={`url(#glow-${ledFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="56"
            cy="56"
            r="24"
            fill={`url(#led-${ledFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="56"
            cy="56"
            r="24"
            fill="none"
            stroke="oklch(0.4 0.03 250)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  )
})
