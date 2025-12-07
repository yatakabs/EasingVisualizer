import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { LEDFunction } from '@/lib/ledFunctions'

interface RectangleMovementProps {
  ledFunction: LEDFunction
  brightness: number
  rawBrightness: number
  onRemove?: () => void
}

export const RectangleMovement = memo(function RectangleMovement({ 
  ledFunction, 
  brightness, 
  rawBrightness, 
  onRemove 
}: RectangleMovementProps) {
  const position = useMemo(() => {
    const progress = brightness
    const pathLength = 4
    const segment = progress * pathLength
    
    const size = 120
    const padding = 20
    const squareSize = 20
    
    if (segment < 1) {
      return {
        x: padding,
        y: padding + (size - padding * 2) * (1 - segment)
      }
    } else if (segment < 2) {
      return {
        x: padding + (size - padding * 2) * (segment - 1),
        y: padding
      }
    } else if (segment < 3) {
      return {
        x: size - padding - squareSize,
        y: padding + (size - padding * 2) * (segment - 2)
      }
    } else {
      return {
        x: padding + (size - padding * 2) * (1 - (segment - 3)),
        y: size - padding - squareSize
      }
    }
  }, [brightness])

  return (
    <Card className="relative overflow-hidden border-2 border-border">
      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
          onClick={onRemove}
        >
          <X size={16} />
        </Button>
      )}
      
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          {ledFunction.name}
        </CardTitle>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {ledFunction.formula}
        </p>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-4 pb-8">
        <div className="relative w-40 h-40 flex items-center justify-center bg-secondary/30 rounded-lg border-2 border-border">
          <svg width="160" height="160" className="absolute inset-0">
            <defs>
              <filter id={`glow-rect-${ledFunction.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <rect
              x="20"
              y="20"
              width="120"
              height="120"
              fill="none"
              stroke="oklch(0.4 0.03 250)"
              strokeWidth="2"
              strokeDasharray="4 4"
              rx="4"
            />
            
            <rect
              x={position.x}
              y={position.y}
              width="20"
              height="20"
              fill={ledFunction.color}
              rx="3"
              filter={`url(#glow-rect-${ledFunction.id})`}
              style={{
                opacity: 0.3 + brightness * 0.7
              }}
            />
          </svg>
        </div>
        
        <div className="w-full bg-secondary rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Position</span>
            <span className="font-mono font-medium text-primary">
              {(brightness * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full will-change-[width]"
              style={{
                width: `${brightness * 100}%`,
                backgroundColor: ledFunction.color,
                boxShadow: `0 0 8px ${ledFunction.color}`
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs pt-1">
            <span className="text-muted-foreground">Raw Value</span>
            <span className="font-mono font-medium text-muted-foreground">
              {(rawBrightness * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
