import { useMemo, memo, useState, useCallback } from 'react'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { applyFilters } from '@/lib/outputFilters'

interface GraphPreviewProps {
  easingFunction: EasingFunction
  filteredOutput: number
  input: number
  baseInput: number
  isTriangularMode: boolean
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
  scriptMapperMode?: boolean
  driftParams?: { x: number; y: number }
}

// Graph configuration constants
const GRAPH_CONFIG = {
  viewBoxWidth: 220,
  viewBoxHeight: 210,
  paddingLeft: 38,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 30,
  get innerWidth() { return this.viewBoxWidth - this.paddingLeft - this.paddingRight },
  get innerHeight() { return this.viewBoxHeight - this.paddingTop - this.paddingBottom },
  get graphRight() { return this.paddingLeft + this.innerWidth },
  get graphBottom() { return this.paddingTop + this.innerHeight },
}

export const GraphPreview = memo(function GraphPreview({ 
  easingFunction, 
  filteredOutput,
  input,
  baseInput,
  isTriangularMode,
  easeType,
  enabledFilters,
  filterParams,
  scriptMapperMode = false,
  driftParams
}: GraphPreviewProps) {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = GRAPH_CONFIG.viewBoxWidth / rect.width
    const scaleY = GRAPH_CONFIG.viewBoxHeight / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY
    
    const { paddingLeft, paddingTop, innerWidth, innerHeight } = GRAPH_CONFIG
    
    if (svgX >= paddingLeft && svgX <= paddingLeft + innerWidth && 
        svgY >= paddingTop && svgY <= paddingTop + innerHeight) {
      const normalizedX = (svgX - paddingLeft) / innerWidth
      const normalizedY = 1 - (svgY - paddingTop) / innerHeight
      setHoverPosition({ x: normalizedX, y: normalizedY })
    } else {
      setHoverPosition(null)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null)
  }, [])

  const { position, graphPath, trailPath, originalGraphPath, baseGraphPath, hoverPoint } = useMemo(() => {
    const { paddingLeft, paddingTop, innerWidth, innerHeight } = GRAPH_CONFIG
    
    const x = paddingLeft + input * innerWidth
    const y = paddingTop + (1 - filteredOutput) * innerHeight
    
    const points: string[] = []
    const originalPoints: string[] = []
    const basePoints: string[] = []
    const steps = 100
    
    // ScriptMapper mode: always use linear input (0→1), no triangular wave
    // ScriptMapper curves map input 0-1 directly to output 0-1
    if (scriptMapperMode) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(t, easeType, driftParams)
        
        // Base function (always easein - the raw function without transformation)
        const baseYVal = easingFunction.calculate(t, 'easein', driftParams)
        const baseYPos = paddingTop + (1 - baseYVal) * innerHeight
        basePoints.push(`${xPos},${baseYPos}`)
        
        const originalYPos = paddingTop + (1 - yVal) * innerHeight
        originalPoints.push(`${xPos},${originalYPos}`)
        
        // In ScriptMapper mode, no filters are applied - raw easing curve
        const yPos = paddingTop + (1 - yVal) * innerHeight
        points.push(`${xPos},${yPos}`)
      }
    } else if (isTriangularMode) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const triangularT = t < 0.5 ? t * 2 : 2 - t * 2
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(triangularT, easeType, driftParams)
        
        // Base function (always easein - the raw function without transformation)
        const baseYVal = easingFunction.calculate(triangularT, 'easein', driftParams)
        const baseYPos = paddingTop + (1 - baseYVal) * innerHeight
        basePoints.push(`${xPos},${baseYPos}`)
        
        const originalYPos = paddingTop + (1 - yVal) * innerHeight
        originalPoints.push(`${xPos},${originalYPos}`)
        
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = paddingTop + (1 - filteredYVal) * innerHeight
        points.push(`${xPos},${yPos}`)
      }
    } else {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(t, easeType, driftParams)
        
        // Base function (always easein - the raw function without transformation)
        const baseYVal = easingFunction.calculate(t, 'easein', driftParams)
        const baseYPos = paddingTop + (1 - baseYVal) * innerHeight
        basePoints.push(`${xPos},${baseYPos}`)
        
        const originalYPos = paddingTop + (1 - yVal) * innerHeight
        originalPoints.push(`${xPos},${originalYPos}`)
        
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = paddingTop + (1 - filteredYVal) * innerHeight
        points.push(`${xPos},${yPos}`)
      }
    }
    
    const trailPoints: string[] = []
    const currentStep = Math.floor(baseInput * steps)
    
    // ScriptMapper mode: simple linear trail from 0 to current position
    if (scriptMapperMode) {
      for (let i = 0; i <= currentStep; i++) {
        const t = i / steps
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(t, easeType, driftParams)
        const yPos = paddingTop + (1 - yVal) * innerHeight
        trailPoints.push(`${xPos},${yPos}`)
      }
    } else if (isTriangularMode) {
      for (let i = 0; i <= currentStep; i++) {
        const t = i / steps
        const triangularT = t < 0.5 ? t * 2 : 2 - t * 2
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(triangularT, easeType, driftParams)
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = paddingTop + (1 - filteredYVal) * innerHeight
        trailPoints.push(`${xPos},${yPos}`)
      }
    } else {
      for (let i = 0; i <= currentStep; i++) {
        const t = i / steps
        const xPos = paddingLeft + t * innerWidth
        const yVal = easingFunction.calculate(t, easeType, driftParams)
        const filteredYVal = applyFilters(yVal, enabledFilters, filterParams)
        const yPos = paddingTop + (1 - filteredYVal) * innerHeight
        trailPoints.push(`${xPos},${yPos}`)
      }
    }
    
    let hoverPointData: {
      svgX: number
      svgY: number
      xValue: number
      yValue: number
      baseYValue: number
    } | null = null
    if (hoverPosition) {
      const hoverX = hoverPosition.x
      // ScriptMapper mode: no triangular transformation on hover
      const effectiveHoverX = scriptMapperMode 
        ? hoverX 
        : (isTriangularMode ? (hoverX < 0.5 ? hoverX * 2 : 2 - hoverX * 2) : hoverX)
      const hoverYVal = easingFunction.calculate(effectiveHoverX, easeType, driftParams)
      const filteredHoverYVal = scriptMapperMode 
        ? hoverYVal 
        : applyFilters(hoverYVal, enabledFilters, filterParams)
      
      // Calculate base value for hover tooltip
      const baseHoverYVal = easingFunction.calculate(effectiveHoverX, 'easein', driftParams)
      
      hoverPointData = {
        svgX: paddingLeft + hoverX * innerWidth,
        svgY: paddingTop + (1 - filteredHoverYVal) * innerHeight,
        xValue: hoverX,
        yValue: filteredHoverYVal,
        baseYValue: baseHoverYVal
      }
    }
    
    return {
      position: { x: paddingLeft + baseInput * innerWidth, y },
      graphPath: points.join(' '),
      trailPath: trailPoints.join(' '),
      originalGraphPath: originalPoints.join(' '),
      baseGraphPath: basePoints.join(' '),
      hoverPoint: hoverPointData
    }
  }, [input, baseInput, filteredOutput, easingFunction, enabledFilters, filterParams, easeType, isTriangularMode, hoverPosition, scriptMapperMode, driftParams])

  const { paddingLeft, paddingTop, innerWidth, innerHeight, graphRight, graphBottom, viewBoxWidth, viewBoxHeight } = GRAPH_CONFIG
  const graphMidX = paddingLeft + innerWidth / 2
  const graphMidY = paddingTop + innerHeight / 2

  return (
    <div className="relative w-full aspect-square flex items-center justify-center bg-secondary/30 rounded border border-border">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <filter id={`glow-rect-${easingFunction.id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* X axis */}
        <line
          x1={paddingLeft}
          y1={graphBottom}
          x2={graphRight}
          y2={graphBottom}
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="2"
        />
        {/* Y axis */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={graphBottom}
          stroke="oklch(0.5 0.05 250)"
          strokeWidth="2"
        />
        
        {/* Y axis ticks and labels */}
        <line x1={paddingLeft - 2} y1={graphBottom} x2={paddingLeft + 2} y2={graphBottom} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={paddingLeft + 2} y1={graphBottom} x2={graphRight} y2={graphBottom} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={paddingLeft - 5} y={graphBottom + 3} textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">0</text>
        
        <line x1={paddingLeft - 2} y1={graphMidY} x2={paddingLeft + 2} y2={graphMidY} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={paddingLeft + 2} y1={graphMidY} x2={graphRight} y2={graphMidY} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={paddingLeft - 5} y={graphMidY + 3} textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">.5</text>
        
        <line x1={paddingLeft - 2} y1={paddingTop} x2={paddingLeft + 2} y2={paddingTop} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={paddingLeft + 2} y1={paddingTop} x2={graphRight} y2={paddingTop} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={paddingLeft - 5} y={paddingTop + 3} textAnchor="end" className="text-[9px] fill-muted-foreground font-mono">1</text>
        
        {/* X axis ticks and labels */}
        <line x1={paddingLeft} y1={graphBottom - 2} x2={paddingLeft} y2={graphBottom + 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={graphBottom - 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={paddingLeft} y={graphBottom + 12} textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0</text>
        
        <line x1={graphMidX} y1={graphBottom - 2} x2={graphMidX} y2={graphBottom + 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={graphMidX} y1={paddingTop} x2={graphMidX} y2={graphBottom - 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={graphMidX} y={graphBottom + 12} textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">.50</text>
        
        <line x1={graphRight} y1={graphBottom - 2} x2={graphRight} y2={graphBottom + 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1.5" />
        <line x1={graphRight} y1={paddingTop} x2={graphRight} y2={graphBottom - 2} stroke="oklch(0.5 0.05 250)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <text x={graphRight} y={graphBottom + 12} textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">1.0</text>
        
        {/* Axis labels */}
        <text x={graphMidX} y={graphBottom + 24} textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
          Input (x)
        </text>
        <text x={8} y={graphMidY} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-muted-foreground font-mono" transform={`rotate(-90 8 ${graphMidY})`}>
          Output (y)
        </text>
        
        {/* Legend - only show when easeType is not 'easein' */}
        {easeType !== 'easein' && (
          <g>
            <text x={graphRight - 2} y={paddingTop + 8} textAnchor="end" className="text-[9px] fill-muted-foreground font-medium">
              Legend:
            </text>
            <line
              x1={graphRight - 26}
              y1={paddingTop + 16}
              x2={graphRight - 14}
              y2={paddingTop + 16}
              stroke="oklch(0.5 0.08 250)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.35"
            />
            <text x={graphRight - 12} y={paddingTop + 18} textAnchor="start" className="text-[9px] fill-muted-foreground font-mono">
              Base
            </text>
            <line
              x1={graphRight - 26}
              y1={paddingTop + 24}
              x2={graphRight - 14}
              y2={paddingTop + 24}
              stroke={easingFunction.color}
              strokeWidth="2"
            />
            <text x={graphRight - 12} y={paddingTop + 26} textAnchor="start" className="text-[9px] fill-muted-foreground font-mono">
              Eased
            </text>
          </g>
        )}
        
        {/* Base curve (dotted line) - only show when easeType is not 'easein' */}
        {easeType !== 'easein' && (
          <polyline
            points={baseGraphPath}
            fill="none"
            stroke="oklch(0.5 0.08 250)"
            strokeWidth="1.5"
            opacity="0.35"
            strokeDasharray="4 4"
          />
        )}
        
        {/* Original curve (before filters) */}
        <polyline
          points={originalGraphPath}
          fill="none"
          stroke={easingFunction.color}
          strokeWidth="2"
          opacity="0.2"
          strokeDasharray="4 4"
        />
        
        {/* Full curve */}
        <polyline
          points={graphPath}
          fill="none"
          stroke={easingFunction.color}
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* Trail (progress indicator) */}
        <polyline
          points={trailPath}
          fill="none"
          stroke={easingFunction.color}
          strokeWidth="3"
          opacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Current position indicator */}
        <rect
          x={position.x - 6}
          y={position.y - 6}
          width="12"
          height="12"
          fill={easingFunction.color}
          rx="2"
          filter={`url(#glow-rect-${easingFunction.id})`}
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
        
        {/* Hover tooltip */}
        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.svgX}
              y1={hoverPoint.svgY}
              x2={hoverPoint.svgX}
              y2={graphBottom}
              stroke="oklch(0.75 0.15 200)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <line
              x1={paddingLeft}
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
            {/* Tooltip - position dynamically based on hover location */}
            {(() => {
              const showBase = easeType !== 'easein'
              const tooltipWidth = 64
              const tooltipHeight = showBase ? 36 : 24
              const tooltipMargin = 8
              
              // Determine tooltip position based on hover point location
              // Check if tooltip would go outside viewBox boundaries
              const wouldOverflowTop = hoverPoint.svgY - tooltipHeight - tooltipMargin < paddingTop
              const wouldOverflowRight = hoverPoint.svgX + tooltipWidth / 2 > viewBoxWidth - 4
              const wouldOverflowLeft = hoverPoint.svgX - tooltipWidth / 2 < 4
              
              // Calculate tooltip X position
              let tooltipX = hoverPoint.svgX
              if (wouldOverflowRight) {
                tooltipX = hoverPoint.svgX - tooltipWidth / 2 - tooltipMargin
              } else if (wouldOverflowLeft) {
                tooltipX = hoverPoint.svgX + tooltipWidth / 2 + tooltipMargin
              }
              
              // Calculate tooltip Y position (show below if would overflow top)
              const tooltipY = wouldOverflowTop 
                ? hoverPoint.svgY + tooltipMargin + tooltipHeight / 2
                : hoverPoint.svgY - tooltipMargin - tooltipHeight / 2
              
              return (
                <>
                  <rect
                    x={tooltipX - tooltipWidth / 2}
                    y={tooltipY - tooltipHeight / 2}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill="oklch(0.25 0.04 250)"
                    stroke="oklch(0.75 0.15 200)"
                    strokeWidth="1"
                    rx="4"
                    opacity="0.95"
                  />
                  <text
                    x={tooltipX}
                    y={tooltipY - (showBase ? 9 : 3)}
                    textAnchor="middle"
                    className="text-[10px] fill-primary font-mono font-medium"
                  >
                    x:{hoverPoint.xValue.toFixed(3)}
                  </text>
                  <text
                    x={tooltipX}
                    y={tooltipY + (showBase ? 0 : 6)}
                    textAnchor="middle"
                    className="text-[10px] fill-primary font-mono font-medium"
                  >
                    y:{hoverPoint.yValue.toFixed(3)}
                  </text>
                  {showBase && (
                    <text
                      x={tooltipX}
                      y={tooltipY + 9}
                      textAnchor="middle"
                      className="text-[9px] fill-muted-foreground font-mono"
                    >
                      base:{hoverPoint.baseYValue.toFixed(3)}
                    </text>
                  )}
                </>
              )
            })()}
          </g>
        )}
      </svg>
    </div>
  )
})
