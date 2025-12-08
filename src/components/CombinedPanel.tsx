import { useMemo, memo, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { LEDFunction } from '@/lib/ledFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { applyFilters } from '@/lib/outputFilters'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface CombinedPanelProps {
  ledFunction: LEDFunction
  output: number
  filteredOutput: number
  input: number
  baseInput: number
  isTriangularMode: boolean
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
  title?: string
  onRemove?: () => void
  onEaseTypeChange: (easeType: EaseType) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export const CombinedPanel = memo(function CombinedPanel({ 
  ledFunction, 
  output,
  filteredOutput,
  input,
  baseInput,
  isTriangularMode,
  easeType,
  enabledFilters,
  filterParams,
  title,
  onRemove,
  onEaseTypeChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: CombinedPanelProps) {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)
  
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, filteredOutput))
  }, [filteredOutput])
  
  const displayOutput = useMemo(() => {
    return filteredOutput
  }, [filteredOutput])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const padding = 30
    const innerWidth = 200 - padding * 2
    const innerHeight = 200 - padding * 2
    
    if (x >= padding && x <= padding + innerWidth && y >= padding && y <= padding + innerHeight) {
      const normalizedX = (x - padding) / innerWidth
      const normalizedY = 1 - (y - padding) / innerHeight
      setHoverPosition({ x: normalizedX, y: normalizedY })
    } else {
      setHoverPosition(null)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null)
  }, [])

  const { position, graphPath, inputValue, trailPath, originalGraphPath, hoverPoint } = useMemo(() => {
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
    
    if (isTriangularMode) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const triangularT = t < 0.5 ? t * 2 : 2 - t * 2
        const xPos = padding + t * innerWidth
        const yVal = ledFunction.calculate(triangularT, easeType)
        
        const originalYPos = padding + (1 - yVal) * innerHeight
        originalPoints.push(`${xPos},${originalYPos}`)
        
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = padding + (1 - filteredYVal) * innerHeight
        points.push(`${xPos},${yPos}`)
      }
    } else {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const xPos = padding + t * innerWidth
        const yVal = ledFunction.calculate(t, easeType)
        
        const originalYPos = padding + (1 - yVal) * innerHeight
        originalPoints.push(`${xPos},${originalYPos}`)
        
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = padding + (1 - filteredYVal) * innerHeight
        points.push(`${xPos},${yPos}`)
      }
    }
    
    const trailPoints: string[] = []
    const currentStep = Math.floor(baseInput * steps)
    
    if (isTriangularMode) {
      for (let i = 0; i <= currentStep; i++) {
        const t = i / steps
        const triangularT = t < 0.5 ? t * 2 : 2 - t * 2
        const xPos = padding + t * innerWidth
        const yVal = ledFunction.calculate(triangularT, easeType)
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = padding + (1 - filteredYVal) * innerHeight
        trailPoints.push(`${xPos},${yPos}`)
      }
    } else {
      for (let i = 0; i <= currentStep; i++) {
        const t = i / steps
        const xPos = padding + t * innerWidth
        const yVal = ledFunction.calculate(t, easeType)
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = padding + (1 - filteredYVal) * innerHeight
        trailPoints.push(`${xPos},${yPos}`)
      }
    }
    
    let hoverPointData: {
      svgX: number
      svgY: number
      xValue: number
      yValue: number
    } | null = null
    if (hoverPosition) {
      const hoverX = hoverPosition.x
      const triangularHoverX = isTriangularMode 
        ? (hoverX < 0.5 ? hoverX * 2 : 2 - hoverX * 2)
        : hoverX
      const hoverYVal = ledFunction.calculate(triangularHoverX, easeType)
      const filteredHoverYVal = applyFilters(hoverYVal, enabledFilters, filterParams)
      
      hoverPointData = {
        svgX: padding + hoverX * innerWidth,
        svgY: padding + (1 - filteredHoverYVal) * innerHeight,
        xValue: hoverX,
        yValue: filteredHoverYVal
      }
    }
    
    return {
      position: { x: padding + baseInput * innerWidth, y },
      graphPath: points.join(' '),
      trailPath: trailPoints.join(' '),
      originalGraphPath: originalPoints.join(' '),
      inputValue: baseInput,
      hoverPoint: hoverPointData
    }
  }, [input, baseInput, filteredOutput, ledFunction, enabledFilters, filterParams, easeType, isTriangularMode, hoverPosition])

  return (
    <Card 
      className="relative overflow-hidden border-2 border-border"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-1.5 right-1.5 z-10 h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
          onClick={onRemove}
        >
          <X size={14} />
        </Button>
      )}
      
      <CardHeader 
        className="pb-2 pt-3 px-3 cursor-move active:cursor-grabbing"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <CardTitle className="text-sm font-semibold tracking-tight">
          {ledFunction.name}
        </CardTitle>
        <div className="space-y-1.5 mt-1">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">
            {ledFunction.formula}
          </p>
          <ToggleGroup 
            type="single" 
            value={easeType}
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="easein" aria-label="EaseIn" className="text-[10px] px-1.5 h-6">
              EaseIn
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" aria-label="EaseOut" className="text-[10px] px-1.5 h-6">
              EaseOut
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" aria-label="EaseBoth" className="text-[10px] px-1.5 h-6">
              EaseBoth
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-2 pb-3 px-3">
        <div className="flex flex-col gap-2 items-center justify-center w-full">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg width="96" height="96" className="absolute inset-0">
              <defs>
                <radialGradient id={`glow-combined-${ledFunction.id}`}>
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
                <radialGradient id={`led-combined-${ledFunction.id}`}>
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
                cx="48"
                cy="48"
                r="42"
                fill={`url(#glow-combined-${ledFunction.id})`}
                className="transition-opacity duration-75"
              />
              
              <circle
                cx="48"
                cy="48"
                r="21"
                fill={`url(#led-combined-${ledFunction.id})`}
                className="transition-opacity duration-75"
              />
              
              <circle
                cx="48"
                cy="48"
                r="21"
                fill="none"
                stroke="oklch(0.4 0.03 250)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="relative w-[200px] h-[200px] flex items-center justify-center bg-secondary/30 rounded-lg border-2 border-border flex-shrink-0">
            <svg 
              width="200" 
              height="200" 
              className="absolute inset-0"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <filter id={`glow-rect-combined-${ledFunction.id}`}>
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
              <text x="100" y="182" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0.50</text>
              
              <line x1="170" y1="168" x2="170" y2="172" stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
              <line x1="170" y1="30" x2="170" y2="168" stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x="170" y="182" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">1.00</text>
              
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
                filter={`url(#glow-rect-combined-${ledFunction.id})`}
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
              
              {hoverPoint && (
                <g>
                  <line
                    x1={hoverPoint.svgX}
                    y1={hoverPoint.svgY}
                    x2={hoverPoint.svgX}
                    y2="170"
                    stroke="oklch(0.75 0.15 200)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                  <line
                    x1="30"
                    y1={hoverPoint.svgY}
                    x2={hoverPoint.svgX}
                    y2={hoverPoint.svgY}
                    stroke="oklch(0.75 0.15 200)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                  <circle
                    cx={hoverPoint.svgX}
                    cy={hoverPoint.svgY}
                    r="5"
                    fill="oklch(0.75 0.15 200)"
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.9"
                  />
                  <rect
                    x={hoverPoint.svgX - 28}
                    y={hoverPoint.svgY - 30}
                    width="56"
                    height="24"
                    fill="oklch(0.25 0.04 250)"
                    stroke="oklch(0.75 0.15 200)"
                    strokeWidth="1"
                    rx="4"
                    opacity="0.95"
                  />
                  <text
                    x={hoverPoint.svgX}
                    y={hoverPoint.svgY - 18}
                    textAnchor="middle"
                    className="text-[9px] fill-primary font-mono font-medium"
                  >
                    x:{hoverPoint.xValue.toFixed(3)}
                  </text>
                  <text
                    x={hoverPoint.svgX}
                    y={hoverPoint.svgY - 9}
                    textAnchor="middle"
                    className="text-[9px] fill-primary font-mono font-medium"
                  >
                    y:{hoverPoint.yValue.toFixed(3)}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
        
        <div className="w-full bg-secondary rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
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
                  boxShadow: `0 0 6px oklch(0.65 0.1 250 / 0.5)`
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Output</span>
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
