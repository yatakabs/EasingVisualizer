/**
 * Camera Path Interpolation
 * 
 * Implements ScriptMapper-compliant interpolation for N-point camera paths.
 * Uses linear interpolation between waypoints with optional easing applied to the time parameter.
 * 
 * ScriptMapper interpolation formula:
 *   position = start + (end - start) * easedTime
 *   where easedTime = easingFunction(localTime) if easing enabled, else localTime
 */

import { EASING_FUNCTIONS } from './easingFunctions'
import type { CameraPath, CameraSegment, InterpolationResult } from './scriptMapperTypes'

/**
 * Find which segment contains the given global time
 * Maps globalTime (0-1) → (segmentIndex, localTime 0-1)
 * 
 * @param path - Camera path with N waypoints
 * @param globalTime - Normalized time (0-1) across entire path
 * @returns Segment index and local time within that segment
 */
export function findSegmentAtTime(
  path: CameraPath,
  globalTime: number
): { segmentIndex: number; localTime: number } {
  // Edge cases
  if (path.waypoints.length < 2 || globalTime <= 0) {
    return { segmentIndex: 0, localTime: 0 }
  }
  if (globalTime >= 1) {
    return { segmentIndex: path.segments.length - 1, localTime: 1 }
  }
  
  // Find which segment's time range contains globalTime
  for (let i = 0; i < path.segments.length; i++) {
    const segment = path.segments[i]
    const fromWp = path.waypoints.find(w => w.id === segment.fromWaypointId)
    const toWp = path.waypoints.find(w => w.id === segment.toWaypointId)
    
    if (!fromWp || !toWp) continue
    
    const segmentStart = fromWp.time
    const segmentEnd = toWp.time
    
    if (globalTime >= segmentStart && globalTime <= segmentEnd) {
      // Calculate local time within this segment
      const segmentDuration = segmentEnd - segmentStart
      const localTime = segmentDuration > 0 
        ? (globalTime - segmentStart) / segmentDuration 
        : 0
      
      return { segmentIndex: i, localTime }
    }
  }
  
  // Fallback (should not reach here if path is valid)
  return { segmentIndex: path.segments.length - 1, localTime: 1 }
}

/**
 * Interpolate camera position along multi-segment path
 * 
 * @param path - Camera path with N waypoints, N-1 segments
 * @param globalTime - Normalized time (0-1) across entire path
 * @returns Interpolated position and segment info
 */
export function interpolateCameraPath(
  path: CameraPath,
  globalTime: number
): InterpolationResult {
  // Clamp globalTime to [0, 1]
  const t = Math.max(0, Math.min(1, globalTime))
  
  // Handle degenerate cases
  if (path.waypoints.length === 0) {
    return {
      position: { x: 0, y: 1, z: 0 },
      currentSegment: path.segments[0] ?? createFallbackSegment(),
      currentSegmentIndex: 0,
      segmentLocalTime: 0,
      globalTime: t
    }
  }
  
  if (path.waypoints.length === 1) {
    return {
      position: { ...path.waypoints[0].position },
      currentSegment: path.segments[0] ?? createFallbackSegment(),
      currentSegmentIndex: 0,
      segmentLocalTime: 0,
      globalTime: t
    }
  }
  
  // Edge case: t = 0, return first waypoint
  if (t === 0) {
    const firstWp = path.waypoints[0]
    return {
      position: { ...firstWp.position },
      currentSegment: path.segments[0],
      currentSegmentIndex: 0,
      segmentLocalTime: 0,
      globalTime: 0
    }
  }
  
  // Edge case: t = 1, return last waypoint
  if (t === 1) {
    const lastWp = path.waypoints[path.waypoints.length - 1]
    const lastSegment = path.segments[path.segments.length - 1]
    return {
      position: { ...lastWp.position },
      currentSegment: lastSegment,
      currentSegmentIndex: path.segments.length - 1,
      segmentLocalTime: 1,
      globalTime: 1
    }
  }
  
  // Find current segment
  const { segmentIndex, localTime } = findSegmentAtTime(path, t)
  const segment = path.segments[segmentIndex]
  
  // Get waypoints for this segment
  const fromWp = path.waypoints.find(w => w.id === segment.fromWaypointId)
  const toWp = path.waypoints.find(w => w.id === segment.toWaypointId)
  
  if (!fromWp || !toWp) {
    // Fallback if waypoints not found
    return {
      position: { x: 0, y: 1, z: 0 },
      currentSegment: segment,
      currentSegmentIndex: segmentIndex,
      segmentLocalTime: localTime,
      globalTime: t
    }
  }
  
  // Apply easing if enabled
  let easedTime = localTime
  if (segment.easingEnabled) {
    const easingFn = EASING_FUNCTIONS.find(fn => fn.id === segment.functionId)
    if (easingFn) {
      easedTime = easingFn.calculate(localTime, segment.easeType, segment.driftParams)
    }
  }
  
  // ScriptMapper interpolation formula: start + (end - start) * easedTime
  const position = {
    x: fromWp.position.x + (toWp.position.x - fromWp.position.x) * easedTime,
    y: fromWp.position.y + (toWp.position.y - fromWp.position.y) * easedTime,
    z: fromWp.position.z + (toWp.position.z - fromWp.position.z) * easedTime
  }
  
  return {
    position,
    currentSegment: segment,
    currentSegmentIndex: segmentIndex,
    segmentLocalTime: localTime,
    globalTime: t
  }
}

/**
 * Generate path preview points for visualization (Three.js line)
 * 
 * @param path - Camera path
 * @param steps - Number of interpolation steps (default: 100)
 * @returns Array of positions along the path
 */
export function generatePathPreviewPoints(
  path: CameraPath,
  steps = 100
): Array<{ x: number; y: number; z: number }> {
  if (path.waypoints.length < 2) {
    return path.waypoints.map(w => ({ ...w.position }))
  }
  
  const points: Array<{ x: number; y: number; z: number }> = []
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const { position } = interpolateCameraPath(path, t)
    points.push(position)
  }
  
  return points
}

/**
 * Get segment boundaries for graph visualization
 * Returns normalized time positions of segment transitions
 * 
 * @param path - Camera path
 * @returns Array of time values (0-1) where segments change
 */
export function getSegmentBoundaries(path: CameraPath): number[] {
  return path.waypoints.map(w => w.time)
}

/**
 * Calculate the eased output value for a specific segment at a local time
 * Used for graph visualization
 * 
 * @param segment - The segment to calculate for
 * @param localTime - Time within segment (0-1)
 * @returns Eased output value (0-1)
 */
export function calculateSegmentOutput(
  segment: CameraSegment,
  localTime: number
): number {
  const t = Math.max(0, Math.min(1, localTime))
  
  if (!segment.easingEnabled) {
    return t // Linear
  }
  
  const easingFn = EASING_FUNCTIONS.find(fn => fn.id === segment.functionId)
  if (!easingFn) {
    return t // Fallback to linear
  }
  
  return easingFn.calculate(t, segment.easeType, segment.driftParams)
}

/**
 * Generate graph data points for all segments
 * Returns points with segment index for color coding
 * 
 * @param path - Camera path
 * @param pointsPerSegment - Points to generate per segment (default: 50)
 * @returns Array of { x, y, segmentIndex } for graphing
 */
export function generateGraphPoints(
  path: CameraPath,
  pointsPerSegment = 50
): Array<{ x: number; y: number; segmentIndex: number }> {
  const points: Array<{ x: number; y: number; segmentIndex: number }> = []
  
  for (let segIdx = 0; segIdx < path.segments.length; segIdx++) {
    const segment = path.segments[segIdx]
    const fromWp = path.waypoints.find(w => w.id === segment.fromWaypointId)
    const toWp = path.waypoints.find(w => w.id === segment.toWaypointId)
    
    if (!fromWp || !toWp) continue
    
    const segmentStart = fromWp.time
    const segmentEnd = toWp.time
    const segmentDuration = segmentEnd - segmentStart
    
    for (let i = 0; i <= pointsPerSegment; i++) {
      const localT = i / pointsPerSegment
      const globalX = segmentStart + localT * segmentDuration
      
      // Y is the eased output mapped from 0-1 within segment
      // Then scaled to segment's global range (segmentStart to segmentEnd)
      const easedLocalY = calculateSegmentOutput(segment, localT)
      const globalY = segmentStart + easedLocalY * segmentDuration
      
      points.push({
        x: globalX,
        y: globalY,
        segmentIndex: segIdx
      })
    }
  }
  
  return points
}

/**
 * Create a fallback segment for edge cases
 */
function createFallbackSegment(): CameraSegment {
  return {
    id: 'fallback',
    fromWaypointId: '',
    toWaypointId: '',
    easingEnabled: false,
    functionId: 'linear',
    easeType: 'easein',
    duration: 1.0
  }
}

/**
 * Calculate total path length (sum of segment distances)
 * Useful for understanding path complexity
 * 
 * @param path - Camera path
 * @returns Total distance in world units
 */
export function calculatePathLength(path: CameraPath): number {
  let totalLength = 0
  
  for (const segment of path.segments) {
    const fromWp = path.waypoints.find(w => w.id === segment.fromWaypointId)
    const toWp = path.waypoints.find(w => w.id === segment.toWaypointId)
    
    if (!fromWp || !toWp) continue
    
    const dx = toWp.position.x - fromWp.position.x
    const dy = toWp.position.y - fromWp.position.y
    const dz = toWp.position.z - fromWp.position.z
    
    totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  
  return totalLength
}
