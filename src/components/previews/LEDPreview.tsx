import { useMemo, memo } from 'react'
import type { LEDFunction } from '@/lib/ledFunctions'

interface LEDPreviewProps {
  ledFunction: LEDFunction
  filteredOutput: number
  input: number
}

export const LEDPreview = memo(function LEDPreview({ 
  ledFunction, 
  filteredOutput,
  input
}: LEDPreviewProps) {
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, filteredOutput))
  }, [filteredOutput])
  
  const displayOutput = useMemo(() => {
    return filteredOutput
  }, [filteredOutput])

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg width="128" height="128" className="absolute inset-0">
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
            cx="64"
            cy="64"
            r="56"
            fill={`url(#glow-${ledFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="64"
            cy="64"
            r="28"
            fill={`url(#led-${ledFunction.id})`}
            className="transition-opacity duration-75"
          />
          
          <circle
            cx="64"
            cy="64"
            r="28"
            fill="none"
            stroke="oklch(0.4 0.03 250)"
            strokeWidth="2"
          />
        </svg>
      </div>
      
      <div className="w-full bg-secondary rounded-lg p-2 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Input</span>
            <span className="font-mono font-medium text-muted-foreground">
              {(input * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${input * 100}%`,
                backgroundColor: 'oklch(0.65 0.1 250)',
                boxShadow: `0 0 4px oklch(0.65 0.1 250 / 0.5)`
              }}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Output</span>
            <span className="font-mono font-medium text-primary">
              {(displayOutput * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${displayOutput * 100}%`,
                backgroundColor: ledFunction.color,
                boxShadow: `0 0 6px ${ledFunction.color}`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
