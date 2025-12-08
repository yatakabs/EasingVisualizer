import { memo } from 'react'
import type { EasingFunction } from '@/lib/easingFunctions'

interface ValuePreviewProps {
  input: number
  easingFunction: EasingFunction
  filteredOutput: number
}

export const ValuePreview = memo(function ValuePreview({ 
  input,
  easingFunction,
  filteredOutput
}: ValuePreviewProps) {
  return (
    <div className="w-full bg-secondary rounded px-4 py-3">
      <div className="space-y-2.5">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs px-0.5">
            <span className="text-muted-foreground">Input</span>
            <span className="font-mono font-medium text-muted-foreground">
              {(input * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${input * 100}%`,
                backgroundColor: 'oklch(0.65 0.1 250)',
                boxShadow: `0 0 3px oklch(0.65 0.1 250 / 0.5)`
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs px-0.5">
            <span className="text-muted-foreground">Output</span>
            <span className="font-mono font-medium text-primary">
              {(filteredOutput * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${filteredOutput * 100}%`,
                backgroundColor: easingFunction.color,
                boxShadow: `0 0 4px ${easingFunction.color}`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
