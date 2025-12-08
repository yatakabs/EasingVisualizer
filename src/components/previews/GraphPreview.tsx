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
    
    const padding = 18
    const innerWidth = 100 - padding * 2
    const innerHeight = 100 - padding * 2
    
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
    const graphWidth = 100
    const graphHeight = 100
    const padding = 18
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
    <div className="w-full py-3">
      <div className="relative w-full aspect-square flex items-center justify-center bg-secondary/30 rounded border border-border p-1.5">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100"
          className="absolute inset-0"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
        <defs>
          <filter id={`glow-rect-${ledFunction.id}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <line
          x1="18"
          y1="82"
          x2="82"
          y2="82"
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="1"
        />
        <line
          x1="18"
          y1="18"
          x2="18"
          y2="82"
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="1"
        />
        
        <line x1="16.5" y1="82" x2="19.5" y2="82" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="19.5" y1="82" x2="82" y2="82" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="15" y="83.5" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">0</text>
        
        <line x1="16.5" y1="50" x2="19.5" y2="50" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="19.5" y1="50" x2="82" y2="50" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="15" y="51.5" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">0.5</text>
        
        <line x1="16.5" y1="18" x2="19.5" y2="18" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="19.5" y1="18" x2="82" y2="18" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="15" y="19.5" textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">1</text>
        
        <line x1="18" y1="80.5" x2="18" y2="83.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="18" y1="18" x2="18" y2="80.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="18" y="91" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0</text>
        
        <line x1="50" y1="80.5" x2="50" y2="83.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="50" y1="18" x2="50" y2="80.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="50" y="91" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0.50</text>
        
        <line x1="82" y1="80.5" x2="82" y2="83.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.7" />
        <line x1="82" y1="18" x2="82" y2="80.5" stroke="oklch(0.5 0.05 250)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.3" />
        <text x="82" y="91" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">1.00</text>
        
        <text x="50" y="98" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
          Input (x)
        </text>
        <text x="6" y="50" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono" transform="rotate(-90 6 50)">
          Output (y)
        </text>
        
        <polyline
          points={originalGraphPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="2 2"
        />
        
        <polyline
          points={graphPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="1"
          opacity="0.3"
        />
        
        <polyline
          points={trailPath}
          fill="none"
          stroke={ledFunction.color}
          strokeWidth="1.5"
          opacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <rect
          x={position.x - 3}
          y={position.y - 3}
          width="6"
          height="6"
          fill={ledFunction.color}
          rx="1"
          filter={`url(#glow-rect-${ledFunction.id})`}
          style={{
            opacity: 0.7 + filteredOutput * 0.3
          }}
        />
        
        <circle
          cx={position.x}
          cy={position.y}
          r="1.5"
          fill="white"
          opacity="0.9"
        />
        
        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.svgX}
              y1={hoverPoint.svgY}
              x2={hoverPoint.svgX}
              y2="82"
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <line
              x1="18"
              y1={hoverPoint.svgY}
              x2={hoverPoint.svgX}
              y2={hoverPoint.svgY}
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <circle
              cx={hoverPoint.svgX}
              cy={hoverPoint.svgY}
              r="2.5"
              fill="oklch(0.75 0.15 200)"
              stroke="white"
              strokeWidth="1"
              opacity="0.9"
            />
            <rect
              x={hoverPoint.svgX - 18}
              y={hoverPoint.svgY - 20}
              width="36"
              height="16"
              fill="oklch(0.25 0.04 250)"
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="0.6"
              rx="2"
              opacity="0.95"
            />
            <text
              x={hoverPoint.svgX}
              y={hoverPoint.svgY - 12}
              textAnchor="middle"
              className="text-[9px] fill-primary font-mono font-medium"
            >
              x:{hoverPoint.xValue.toFixed(3)}
            </text>
            <text
              x={hoverPoint.svgX}
              y={hoverPoint.svgY - 6}
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
  )
})
