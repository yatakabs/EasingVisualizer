import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { LEDFunction } from '@/lib/ledFunctions'
import { applyFilters } from '@/lib/outputFilters'

interface RectangleMovementProps {
  ledFunction: LEDFunction
  output: number
  filteredOutput: number
  input: number
  cycleMultiplier: number
  enabledFilters: string[]
  filterParams: Record<string, number>
  onRemove?: () => void
}

export const RectangleMovement = memo(function RectangleMovement({ 
  ledFunction, 
  output,
  filteredOutput,
  input,
  cycleMultiplier,
  enabledFilters,
  filterParams,
  onRemove 
}: RectangleMovementProps) {
  const displayOutput = useMemo(() => {
    return filteredOutput
  }, [filteredOutput])

  const { position, graphPath, inputValue, trailPath, originalGraphPath } = useMemo(() => {
    const graphWidth = 200
    const graphHeight = 200
    const padding = 30
    const innerWidth = graphWidth - padding * 2
    const innerHeight = graphHeight - padding * 2
    
    const x = padding + input * innerWidth
    const y = padding + (1 - filteredOutput) * innerHeight
    
    const points: string[] = []
    const originalPoints: string[] = []
    const steps = 100
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const xPos = padding + t * innerWidth
      const yVal = ledFunction.calculate(t, cycleMultiplier)
      
      const originalYPos = padding + (1 - yVal) * innerHeight
      originalPoints.push(`${xPos},${originalYPos}`)
      
      const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
      const yPos = padding + (1 - filteredYVal) * innerHeight
      points.push(`${xPos},${yPos}`)
    }
    
    const trailPoints: string[] = []
    const currentStep = Math.floor(input * steps)
    for (let i = 0; i <= currentStep; i++) {
      const t = i / steps
      const xPos = padding + t * innerWidth
      const yVal = ledFunction.calculate(t, cycleMultiplier)
      const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
      const yPos = padding + (1 - filteredYVal) * innerHeight
      trailPoints.push(`${xPos},${yPos}`)
    }
    
    return {
      position: { x, y },
      graphPath: points.join(' '),
      trailPath: trailPoints.join(' '),
      originalGraphPath: originalPoints.join(' '),
      inputValue: input
    }
  }, [input, filteredOutput, ledFunction, cycleMultiplier, enabledFilters, filterParams])

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
        <div className="space-y-0.5 mt-1">
          <p className="text-xs font-mono text-muted-foreground">
            {ledFunction.formula}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-4 pb-8">
        <div className="relative w-[200px] h-[200px] flex items-center justify-center bg-secondary/30 rounded-lg border-2 border-border">
          <svg width="200" height="200" className="absolute inset-0">
            <defs>
              <filter id={`glow-rect-${ledFunction.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <line
              x1="30"
              y1="170"
              x2="170"
              y2="170"
              stroke="oklch(0.5 0.05 250)"
              strokeWidth="2"
            />
            <line
              x1="30"
              y1="30"
              x2="30"
              y2="170"
              stroke="oklch(0.5 0.05 250)"
              strokeWidth="2"
            />
            
            <line x1="28" y1="170" x2="32" y2="170" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="32" y1="170" x2="170" y2="170" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="22" y="172" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">0</text>
            
            <line x1="28" y1="100" x2="32" y2="100" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="32" y1="100" x2="170" y2="100" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="22" y="102" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">0.5</text>
            
            <line x1="28" y1="30" x2="32" y2="30" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="32" y1="30" x2="170" y2="30" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="22" y="32" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">1</text>
            
            <line x1="30" y1="168" x2="30" y2="172" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="30" y1="30" x2="30" y2="168" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="30" y="182" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0</text>
            
            <line x1="100" y1="168" x2="100" y2="172" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="100" y1="30" x2="100" y2="168" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="100" y="182" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">{(0.5 * cycleMultiplier).toFixed(1)}</text>
            
            <line x1="170" y1="168" x2="170" y2="172" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
            <line x1="170" y1="30" x2="170" y2="168" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <text x="170" y="182" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">{(1 * cycleMultiplier).toFixed(1)}</text>
            
            <text x="100" y="195" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
              Input (x)
            </text>
            <text x="10" y="100" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono" transform="rotate(-90 10 100)">
              Output (y)
            </text>
            
            <polyline
              points={originalGraphPath}
              fill="none"
              stroke={ledFunction.color}
              strokeWidth="2"
              opacity="0.2"
              strokeDasharray="4 4"
            />
            
            <polyline
              points={graphPath}
              fill="none"
              stroke={ledFunction.color}
              strokeWidth="2"
              opacity="0.3"
            />
            
            <polyline
              points={trailPath}
              fill="none"
              stroke={ledFunction.color}
              strokeWidth="3"
              opacity="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            <rect
              x={position.x - 6}
              y={position.y - 6}
              width="12"
              height="12"
              fill={ledFunction.color}
              rx="2"
              filter={`url(#glow-rect-${ledFunction.id})`}
              style={{
                opacity: 0.7 + filteredOutput * 0.3
              }}
            />
            
            <circle
              cx={position.x}
              cy={position.y}
              r="3"
              fill="white"
              opacity="0.9"
            />
          </svg>
        </div>
        
        <div className="w-full bg-secondary rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Input (x)</span>
              <span className="font-mono font-medium text-muted-foreground">
                {(inputValue * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full will-change-[width]"
                style={{
                  width: `${inputValue * 100}%`,
                  backgroundColor: 'oklch(0.65 0.1 250)',
                  boxShadow: `0 0 6px oklch(0.65 0.1 250 / 0.5)`
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Output (y)</span>
              <span className="font-mono font-medium text-primary">
                {(displayOutput * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full will-change-[width]"
                style={{
                  width: `${displayOutput * 100}%`,
                  backgroundColor: ledFunction.color,
                  boxShadow: `0 0 8px ${ledFunction.color}`
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
