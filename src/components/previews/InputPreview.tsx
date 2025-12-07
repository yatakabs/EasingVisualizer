import { memo } from 'react'

interface InputPreviewProps {
  input: number
}

export const InputPreview = memo(function InputPreview({ 
  input
}: InputPreviewProps) {
  return (
    <div className="w-full bg-secondary rounded-lg p-2">
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
    </div>
  )
})
