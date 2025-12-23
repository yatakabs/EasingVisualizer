/**
 * ScriptMapper Multi-Segment Graph
 * 
 * SVG-based visualization of N-point camera path timing.
 * Shows per-segment easing curves with segment boundaries.
 */

import { useMemo, memo, useState, useCallback } from 'react'
import type { CameraPath } from '@/lib/scriptMapperTypes'
import { 
  getSegmentBoundaries, 
  calculateSegmentOutput,
  interpolateCameraPath
} from '@/lib/cameraPathInterpolation'
import { EASING_FUNCTIONS } from '@/lib/easingFunctions'
import { cn } from '@/lib/utils'

interface ScriptMapperGraphProps {
  /** Camera path to visualize */
  cameraPath: CameraPath
  /** Current animation time (0-1) */
  globalTime: number
}

// Graph configuration constants
const GRAPH_CONFIG = {
  viewBoxWidth: 220,
  viewBoxHeight: 220,
  paddingLeft: 38,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 40,
  get innerWidth() { return this.viewBoxWidth - this.paddingLeft - this.paddingRight },
  get innerHeight() { return this.viewBoxHeight - this.paddingTop - this.paddingBottom },
  get graphRight() { return this.paddingLeft + this.innerWidth },
  get graphBottom() { return this.paddingTop + this.innerHeight },
}

// Segment colors matching the 3D preview
const SEGMENT_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#00ff00', // Green
  '#ff8800', // Orange
  '#8800ff', // Purple
  '#ff0088', // Pink
  '#00ff88', // Teal
]

export const ScriptMapperGraph = memo(function ScriptMapperGraph({
  cameraPath,
  globalTime
}: ScriptMapperGraphProps) {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null)
  
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
  
  // Get segment boundaries
  const boundaries = useMemo(() => getSegmentBoundaries(cameraPath), [cameraPath])
  
  // Current interpolation result
  const currentResult = useMemo(() => {
    return interpolateCameraPath(cameraPath, globalTime)
  }, [cameraPath, globalTime])
  
  // Generate segment paths with extended metadata
  const segmentPaths = useMemo(() => {
    const { paddingLeft, paddingTop, innerWidth, innerHeight } = GRAPH_CONFIG
    const paths: Array<{ 
      d: string; 
      color: string; 
      label: string;
      segmentIndex: number;
      timeRange: { from: number; to: number };
      beatRange?: { from: number; to: number };
      waypointNames?: { from: string; to: string };
      bookmarkCommands?: string;
    }> = []
    
    for (let i = 0; i < cameraPath.segments.length; i++) {
      const segment = cameraPath.segments[i]
      const fromWp = cameraPath.waypoints.find(w => w.id === segment.fromWaypointId)
      const toWp = cameraPath.waypoints.find(w => w.id === segment.toWaypointId)
      
      if (!fromWp || !toWp) continue
      
      const segmentStart = fromWp.time
      const segmentEnd = toWp.time
      const segmentDuration = segmentEnd - segmentStart
      
      const points: string[] = []
      const steps = 50
      
      for (let j = 0; j <= steps; j++) {
        const localT = j / steps
        const globalX = segmentStart + localT * segmentDuration
        
        // Calculate eased output Y
        const easedLocalY = calculateSegmentOutput(segment, localT)
        // Map to segment's global Y range (output goes from segmentStart to segmentEnd)
        const globalY = segmentStart + easedLocalY * segmentDuration
        
        const xPos = paddingLeft + globalX * innerWidth
        const yPos = paddingTop + (1 - globalY) * innerHeight
        
        points.push(`${xPos},${yPos}`)
      }
      
      // Get easing label for legend
      // Use rawCommand if available (truncate at 30 chars), otherwise derive from settings
      let easingLabel: string
      if (segment.rawCommand) {
        easingLabel = segment.rawCommand.length > 30
          ? segment.rawCommand.substring(0, 30) + '…'
          : segment.rawCommand
      } else {
        const easingFn = EASING_FUNCTIONS.find(fn => fn.id === segment.functionId)
        easingLabel = segment.easingEnabled 
          ? `${easingFn?.name ?? segment.functionId} (${segment.easeType.replace('ease', '')})`
          : 'Linear'
      }
      
      // Extract waypoint names with fallback to beat numbers
      const fromLabel = fromWp.name ?? (fromWp.beat !== undefined ? `b${fromWp.beat}` : undefined)
      const toLabel = toWp.name ?? (toWp.beat !== undefined ? `b${toWp.beat}` : undefined)
      
      paths.push({
        d: `M ${points.join(' L ')}`,
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        label: easingLabel,
        segmentIndex: i,
        timeRange: { from: segmentStart, to: segmentEnd },
        beatRange: fromWp.beat !== undefined && toWp.beat !== undefined 
          ? { from: fromWp.beat, to: toWp.beat } 
          : undefined,
        waypointNames: fromLabel || toLabel 
          ? { from: fromLabel ?? '', to: toLabel ?? '' } 
          : undefined,
        bookmarkCommands: segment.bookmarkCommands
      })
    }
    
    return paths
  }, [cameraPath])
  
  // Current position on graph
  const currentPos = useMemo(() => {
    const { paddingLeft, paddingTop, innerWidth, innerHeight } = GRAPH_CONFIG
    
    // X is global time
    const x = paddingLeft + globalTime * innerWidth
    
    // Y is the eased output at current segment
    const segment = currentResult.currentSegment
    const localY = calculateSegmentOutput(segment, currentResult.segmentLocalTime)
    
    // Map to global Y (from segment start to end)
    const fromWp = cameraPath.waypoints.find(w => w.id === segment.fromWaypointId)
    const toWp = cameraPath.waypoints.find(w => w.id === segment.toWaypointId)
    
    if (fromWp && toWp) {
      const segmentDuration = toWp.time - fromWp.time
      const globalY = fromWp.time + localY * segmentDuration
      const y = paddingTop + (1 - globalY) * innerHeight
      return { x, y }
    }
    
    return { x, y: paddingTop + (1 - globalTime) * innerHeight }
  }, [globalTime, currentResult, cameraPath.waypoints])
  
  // Hover point calculation
  const hoverPoint = useMemo(() => {
    if (!hoverPosition) return null
    
    const { paddingLeft, paddingTop, innerWidth, innerHeight } = GRAPH_CONFIG
    const hoverTime = hoverPosition.x
    
    // Interpolate at hover position
    const hoverResult = interpolateCameraPath(cameraPath, hoverTime)
    const segment = hoverResult.currentSegment
    const localY = calculateSegmentOutput(segment, hoverResult.segmentLocalTime)
    
    const fromWp = cameraPath.waypoints.find(w => w.id === segment.fromWaypointId)
    const toWp = cameraPath.waypoints.find(w => w.id === segment.toWaypointId)
    
    if (fromWp && toWp) {
      const segmentDuration = toWp.time - fromWp.time
      const globalY = fromWp.time + localY * segmentDuration
      
      return {
        x: paddingLeft + hoverTime * innerWidth,
        y: paddingTop + (1 - globalY) * innerHeight,
        inputValue: hoverTime,
        outputValue: globalY,
        segmentIndex: hoverResult.currentSegmentIndex,
        localTime: hoverResult.segmentLocalTime
      }
    }
    
    return null
  }, [hoverPosition, cameraPath])
  
  const { paddingLeft, paddingTop, innerWidth, innerHeight, graphBottom, graphRight } = GRAPH_CONFIG
  
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <svg
        viewBox={`0 0 ${GRAPH_CONFIG.viewBoxWidth} ${GRAPH_CONFIG.viewBoxHeight}`}
        className="w-full bg-card rounded border border-border"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        <g className="text-muted-foreground/30">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={`h-${v}`}
              x1={paddingLeft}
              y1={paddingTop + (1 - v) * innerHeight}
              x2={graphRight}
              y2={paddingTop + (1 - v) * innerHeight}
              stroke="currentColor"
              strokeWidth={v === 0 || v === 1 ? 1 : 0.5}
              strokeDasharray={v === 0 || v === 1 ? '' : '2,2'}
            />
          ))}
          
          {/* Vertical grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={`v-${v}`}
              x1={paddingLeft + v * innerWidth}
              y1={paddingTop}
              x2={paddingLeft + v * innerWidth}
              y2={graphBottom}
              stroke="currentColor"
              strokeWidth={v === 0 || v === 1 ? 1 : 0.5}
              strokeDasharray={v === 0 || v === 1 ? '' : '2,2'}
            />
          ))}
        </g>
        
        {/* Segment boundaries (vertical dashed lines at waypoint times) with waypoint labels */}
        <g>
          {boundaries.slice(1, -1).map((time, i) => {
            const waypoint = cameraPath.waypoints[i + 1]
            const label = waypoint?.name ?? (waypoint?.beat !== undefined ? `b${waypoint.beat}` : '')
            const xPos = paddingLeft + time * innerWidth
            
            return (
              <g key={`boundary-${i}`}>
                <line
                  x1={xPos}
                  y1={paddingTop}
                  x2={xPos}
                  y2={graphBottom}
                  stroke={SEGMENT_COLORS[(i + 1) % SEGMENT_COLORS.length]}
                  strokeWidth={1}
                  strokeDasharray="4,2"
                  opacity={0.6}
                />
                {label && (
                  <text
                    x={xPos}
                    y={graphBottom + 24}
                    textAnchor="middle"
                    fontSize="7"
                    fill={SEGMENT_COLORS[(i + 1) % SEGMENT_COLORS.length]}
                    className="select-none"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
        
        {/* Diagonal reference line (y=x, linear interpolation reference) */}
        <line
          x1={paddingLeft}
          y1={graphBottom}
          x2={graphRight}
          y2={paddingTop}
          stroke="currentColor"
          className="text-muted-foreground/20"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        
        {/* Segment curves with interactive highlighting */}
        <g>
          {segmentPaths.map((path, i) => (
            <g
              key={`segment-${i}`}
              onMouseEnter={() => setHoveredSegmentIndex(i)}
              onMouseLeave={() => setHoveredSegmentIndex(null)}
              className="cursor-pointer"
            >
              {/* Semi-transparent background region when segment is hovered */}
              {hoveredSegmentIndex === i && (
                <rect
                  x={paddingLeft + path.timeRange.from * innerWidth}
                  y={paddingTop}
                  width={(path.timeRange.to - path.timeRange.from) * innerWidth}
                  height={innerHeight}
                  fill={path.color}
                  opacity={0.08}
                />
              )}
              <path
                d={path.d}
                fill="none"
                stroke={path.color}
                strokeWidth={hoveredSegmentIndex === i ? 3 : 2}
                opacity={hoveredSegmentIndex !== null && hoveredSegmentIndex !== i ? 0.4 : 1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
        
        {/* Current time indicator (vertical line) */}
        <line
          x1={currentPos.x}
          y1={paddingTop}
          x2={currentPos.x}
          y2={graphBottom}
          stroke="#ff4444"
          strokeWidth={1}
          opacity={0.6}
        />
        
        {/* Current position dot */}
        <circle
          cx={currentPos.x}
          cy={currentPos.y}
          r={5}
          fill={SEGMENT_COLORS[currentResult.currentSegmentIndex % SEGMENT_COLORS.length]}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
        
        {/* Hover indicator */}
        {hoverPoint && (
          <>
            <line
              x1={hoverPoint.x}
              y1={paddingTop}
              x2={hoverPoint.x}
              y2={graphBottom}
              stroke="#ffffff"
              strokeWidth={0.5}
              opacity={0.4}
            />
            <line
              x1={paddingLeft}
              y1={hoverPoint.y}
              x2={graphRight}
              y2={hoverPoint.y}
              stroke="#ffffff"
              strokeWidth={0.5}
              opacity={0.4}
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={4}
              fill="#ffffff"
              opacity={0.8}
            />
          </>
        )}
        
        {/* Axis labels */}
        <g className="text-muted-foreground" fill="currentColor" fontSize="9">
          {/* Y-axis labels */}
          <text x={paddingLeft - 4} y={paddingTop + 3} textAnchor="end">1.0</text>
          <text x={paddingLeft - 4} y={paddingTop + innerHeight / 2 + 3} textAnchor="end">0.5</text>
          <text x={paddingLeft - 4} y={graphBottom + 3} textAnchor="end">0.0</text>
          
          {/* X-axis labels */}
          <text x={paddingLeft} y={graphBottom + 14} textAnchor="middle">0</text>
          <text x={paddingLeft + innerWidth / 2} y={graphBottom + 14} textAnchor="middle">0.5</text>
          <text x={graphRight} y={graphBottom + 14} textAnchor="middle">1</text>
          
          {/* Axis titles */}
          <text x={paddingLeft + innerWidth / 2} y={graphBottom + 26} textAnchor="middle" className="text-[8px]">
            Time (0→1)
          </text>
          <text 
            x={8} 
            y={paddingTop + innerHeight / 2} 
            textAnchor="middle" 
            transform={`rotate(-90, 8, ${paddingTop + innerHeight / 2})`}
            className="text-[8px]"
          >
            Output
          </text>
        </g>
        
        {/* Enhanced hover tooltip with bookmark context */}
        {hoverPoint && (() => {
          const segment = cameraPath.segments[hoverPoint.segmentIndex]
          const fromWp = cameraPath.waypoints.find(w => w.id === segment.fromWaypointId)
          const toWp = cameraPath.waypoints.find(w => w.id === segment.toWaypointId)
          
          const fromLabel = fromWp?.name ?? (fromWp?.beat !== undefined ? `b${fromWp.beat}` : '?')
          const toLabel = toWp?.name ?? (toWp?.beat !== undefined ? `b${toWp.beat}` : '?')
          const segmentColor = SEGMENT_COLORS[hoverPoint.segmentIndex % SEGMENT_COLORS.length]
          
          return (
            <g transform={`translate(${Math.min(hoverPoint.x + 8, GRAPH_CONFIG.viewBoxWidth - 90)}, ${Math.max(hoverPoint.y - 50, 10)})`}>
              <rect
                x={0}
                y={0}
                width={85}
                height={55}
                fill="rgba(0,0,0,0.9)"
                rx={4}
              />
              <text x={4} y={11} fill={segmentColor} fontSize="8" fontWeight="600">
                Segment {hoverPoint.segmentIndex + 1}
              </text>
              <text x={4} y={22} fill="#ffffff" fontSize="7">
                t: {hoverPoint.inputValue.toFixed(3)} → {hoverPoint.outputValue.toFixed(3)}
              </text>
              <text x={4} y={33} fill="#aaaaaa" fontSize="7">
                {(hoverPoint.localTime * 100).toFixed(0)}% through segment
              </text>
              <text x={4} y={44} fill="#aaaaaa" fontSize="7">
                {fromLabel} → {toLabel}
              </text>
            </g>
          )
        })()}
      </svg>
      
      {/* Enhanced Legend with Time/Beat Ranges and Interactive Highlighting */}
      <div className="w-full bg-secondary rounded px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Path</span>
          <span className="font-medium">{cameraPath.name}</span>
        </div>
        <div className={cn(
          "space-y-1.5",
          segmentPaths.length > 6 && "max-h-32 overflow-y-auto pr-1"
        )}>
          {segmentPaths.map((path, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-start gap-2 text-[9px] leading-relaxed rounded px-1.5 py-1 transition-colors",
                "cursor-pointer",
                hoveredSegmentIndex === i && "bg-accent/50"
              )}
              onMouseEnter={() => setHoveredSegmentIndex(i)}
              onMouseLeave={() => setHoveredSegmentIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`Highlight segment ${i + 1}: ${path.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setHoveredSegmentIndex(hoveredSegmentIndex === i ? null : i)
                }
              }}
            >
              <span 
                className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0"
                style={{ backgroundColor: path.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {i + 1}: {path.label}
                </div>
                <div className="text-muted-foreground text-[8px]">
                  {path.timeRange.from.toFixed(2)} → {path.timeRange.to.toFixed(2)}
                  {path.beatRange && ` (b${path.beatRange.from}→b${path.beatRange.to})`}
                </div>
                {path.bookmarkCommands && (
                  <div className="text-primary/80 text-[8px] font-mono break-all" title={path.bookmarkCommands}>
                    {path.bookmarkCommands.length > 50 
                      ? path.bookmarkCommands.substring(0, 50) + '…'
                      : path.bookmarkCommands}
                  </div>
                )}
                {path.waypointNames && (path.waypointNames.from || path.waypointNames.to) && !path.bookmarkCommands && (
                  <div className="text-muted-foreground/70 text-[8px] italic">
                    {path.waypointNames.from || '?'} → {path.waypointNames.to || '?'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
