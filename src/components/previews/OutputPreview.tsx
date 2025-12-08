import { useMemo, memo } from 'react'
import type { EasingFunction } from '@/lib/easingFunctions'

interface OutputPreviewProps {
  EasingFunction: EasingFunction
  filteredOutput: number
}

export const OutputPreview = memo(function OutputPreview({ 
  EasingFunction,
  filteredOutput
}: OutputPreviewProps) {
  const displayOutput = useMemo(() => {
    return filteredOutput
  }, [filteredOutput])

  return (
    <div className="w-full bg-secondary rounded-lg p-2">
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
              backgroundColor: EasingFunction.color,
              boxShadow: `0 0 6px ${EasingFunction.color}`
            }}
          />
        </div>
      </div>
    </div>
  )
})
