import { useMemo, memo, useState, useCallback } from 'react'
import type { LEDFunction } from '@/lib/ledFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { applyFilters } from '@/lib/outputFilters'

interface GraphPreviewProps {
  ledFunction: LEDFunction
  filteredOutput: number
  input: number
  baseInput: number
  isTriangularMode: boolean
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
}

export const GraphPreview = memo(function GraphPreview({ 
  ledFunction, 
  filteredOutput,
  input,
  baseInput,
  isTriangularMode,
  easeType,
  enabledFilters,
  filterParams
}: GraphPreviewProps) {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const padding = 25
    const innerWidth = 150 - padding * 2
    const innerHeight = 150 - padding * 2
    
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
    const graphWidth = 150
    const graphHeight = 150
    const padding = 25
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
    <div className="relative w-full aspect-square flex items-center justify-center bg-secondary/30 rounded border border-border p-1.5">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 150 150"
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <filter id={`glow-rect-${ledFunction.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <line
          x1="25"
          y1="125"
          x2="125"
          y2="125"
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="1.5"
        />
        <line
          x1="25"
          y1="25"
          x2="25"
          y2="125"
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="1.5"
        />
        
        <line x1="23" y1="125" x2="27" y2="125" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="27" y1="125" x2="125" y2="125" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="20" y="127" textAnchor="end" className="text-[8px] fill-muted-foreground font-mono">0</text>
        
        <line x1="23" y1="75" x2="27" y2="75" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="27" y1="75" x2="125" y2="75" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="20" y="77" textAnchor="end" className="text-[8px] fill-muted-foreground font-mono">0.5</text>
        
        <line x1="23" y1="25" x2="27" y2="25" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="27" y1="25" x2="125" y2="25" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="20" y="27" textAnchor="end" className="text-[8px] fill-muted-foreground font-mono">1</text>
        
        <line x1="25" y1="123" x2="25" y2="127" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="25" y1="25" x2="25" y2="123" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="25" y="136" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">0</text>
        
        <line x1="75" y1="123" x2="75" y2="127" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="75" y1="25" x2="75" y2="123" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="75" y="136" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">0.50</text>
        
        <line x1="125" y1="123" x2="125" y2="127" stroke="oklch(0.5 0.05 250)" strokeWidth="1" />
        <line x1="125" y1="25" x2="125" y2="123" stroke="oklch(0.5 0.05 250)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <text x="125" y="136" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">1.00</text>
        
        <text x="75" y="146" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">
          Input (x)
        </text>
        <text x="8" y="75" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono" transform="rotate(-90 8 75)">
          Output (y)
        </text>
        
        <polyline
          points={originalGraphPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="1.5"
          opacity="0.2"
          strokeDasharray="3 3"
        />
        
        <polyline
          points={graphPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="1.5"
          opacity="0.3"
        />
        
        <polyline
          points={trailPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="2"
          opacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <rect
          x={position.x - 4}
          y={position.y - 4}
          width="8"
          height="8"
          fill={ledFunction.color}
          rx="1.5"
          filter={`url(#glow-rect-${ledFunction.id})`}
          style={{
            opacity: 0.7 + filteredOutput * 0.3
          }}
        />
        
        <circle
          cx={position.x}
          cy={position.y}
          r="2"
          fill="white"
          opacity="0.9"
        />
        
        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.svgX}
              y1={hoverPoint.svgY}
              x2={hoverPoint.svgX}
              y2="125"
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <line
              x1="25"
              y1={hoverPoint.svgY}
              x2={hoverPoint.svgX}
              y2={hoverPoint.svgY}
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <circle
              cx={hoverPoint.svgX}
              cy={hoverPoint.svgY}
              r="3.5"
              fill="oklch(0.75 0.15 200)"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <rect
              x={hoverPoint.svgX - 22}
              y={hoverPoint.svgY - 24}
              width="44"
              height="18"
              fill="oklch(0.25 0.04 250)"
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="0.8"
              rx="3"
              opacity="0.95"
            />
            <text
              x={hoverPoint.svgX}
              y={hoverPoint.svgY - 14}
              textAnchor="middle"
              className="text-[8px] fill-primary font-mono font-medium"
            >
              x:{hoverPoint.xValue.toFixed(3)}
            </text>
            <text
              x={hoverPoint.svgX}
              y={hoverPoint.svgY - 7}
              textAnchor="middle"
              className="text-[8px] fill-primary font-mono font-medium"
            >
              y:{hoverPoint.yValue.toFixed(3)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
})
