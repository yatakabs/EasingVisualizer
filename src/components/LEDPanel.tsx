import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { LEDFunction } from '@/lib/ledFunctions'

interface LEDPanelProps {
  ledFunction: LEDFunction
  brightness: number
  rawBrightness: number
  onRemove?: () => void
}

export const LEDPanel = memo(function LEDPanel({ ledFunction, brightness, rawBrightness, onRemove }: LEDPanelProps) {
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, brightness))
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
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg width="160" height="160" className="absolute inset-0">
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
              cx="80"
              cy="80"
              r="70"
              fill={`url(#glow-${ledFunction.id})`}
              className="transition-opacity duration-75"
            />
            
            <circle
              cx="80"
              cy="80"
              r="35"
              fill={`url(#led-${ledFunction.id})`}
              className="transition-opacity duration-75"
            />
            
            <circle
              cx="80"
              cy="80"
              r="35"
              fill="none"
              stroke="oklch(0.4 0.03 250)"
              strokeWidth="2"
            />
          </svg>
        </div>
        
        <div className="w-full bg-secondary rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Output</span>
            <span className="font-mono font-medium text-primary">
              {(glowIntensity * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${glowIntensity * 100}%`,
                backgroundColor: ledFunction.color,
                boxShadow: `0 0 8px ${ledFunction.color}`,
                transition: 'width 0.05s linear'
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
