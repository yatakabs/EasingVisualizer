import { memo } from 'react'
import type { LEDFunction } from '@/lib/ledFunctions'

interface ValuePreviewProps {
  input: number
  ledFunction: LEDFunction
  filteredOutput: number
}

export const ValuePreview = memo(function ValuePreview({ 
  input,
  ledFunction,
  filteredOutput
}: ValuePreviewProps) {
  return (
    <div className="w-full bg-secondary rounded px-3 py-2.5">
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] px-0.5">
            <span className="text-muted-foreground">Input</span>
            <span className="font-mono font-medium text-muted-foreground">
              {(input * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-1 overflow-hidden">
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

        <div className="space-y-1">
          <div className="flex justify-between text-[9px] px-0.5">
            <span className="text-muted-foreground">Output</span>
            <span className="font-mono font-medium text-primary">
              {(filteredOutput * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-1 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${filteredOutput * 100}%`,
                backgroundColor: ledFunction.color,
                boxShadow: `0 0 4px ${ledFunction.color}`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
