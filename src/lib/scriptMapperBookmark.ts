/**
 * ScriptMapper Bookmark Export/Import
 * 
 * Beat Saber v3 customData format with per-segment easing.
 * Handles conversion between CameraPath and ScriptMapper bookmark JSON.
 */

import type { CameraPath, CameraWaypoint } from './scriptMapperTypes'
import { formatAsScriptMapperShortCommand, parseScriptMapperCommand } from './scriptMapperCompat'
import { createWaypoint, generateSegmentsFromWaypoints } from './scriptMapperTypes'

/**
 * TIME_EPSILON: Tolerance for floating-point time comparisons
 * 
 * Value: 1e-6 (0.000001 seconds = 1 microsecond)
 * 
 * Rationale:
 * - Beat Saber exports times with ~6 decimal precision
 * - JavaScript float precision allows reliable comparison at this scale
 * - Covers typical rounding errors in time calculations
 */
export const TIME_EPSILON = 1e-6

/**
 * Compare two time values with epsilon tolerance
 * @returns true if times are considered equal
 */
export function timesAreEqual(a: number, b: number, epsilon = TIME_EPSILON): boolean {
  return Math.abs(a - b) < epsilon
}

/**
 * Check if time `a` is less than time `b` (with epsilon margin)
 * @returns true if a < b - epsilon
 */
export function timeIsLessThan(a: number, b: number, epsilon = TIME_EPSILON): boolean {
  return a < b - epsilon
}

/**
 * Check if time `a` is less than or equal to time `b` (with epsilon margin)
 * @returns true if a <= b + epsilon
 */
export function timeIsLessOrEqual(a: number, b: number, epsilon = TIME_EPSILON): boolean {
  return a <= b + epsilon
}

/**
 * Round time to a fixed precision for export
 * Uses 6 decimal places to match TIME_EPSILON
 */
export function roundTime(time: number): number {
  return Math.round(time * 1e6) / 1e6
}

/**
 * Beat Saber v3 Bookmark Types
 */

export interface BookmarkEntry {
  _time: number
  _name: string
  _color?: { r: number; g: number; b: number; a: number }
}

export interface PointDefinition {
  _name: string
  _points: Array<[number, number, number, number]> // [x, y, z, time]
}

export interface CustomEvent {
  _time: number
  _type: string
  _data: {
    _track?: string
    _duration?: number
    _easing?: string
  }
}

export interface EnvironmentEntry {
  _id: string
  _lookupMethod: string
  _track?: string
  _duplicate?: number
  _active?: boolean
  _scale?: [number, number, number]
  _position?: [number, number, number]
  _rotation?: [number, number, number]
  _localPosition?: [number, number, number]
  _localRotation?: [number, number, number]
}

export interface ScriptMapperBookmark {
  _version: string
  _customData: {
    _bookmarks?: BookmarkEntry[]
    _environment: EnvironmentEntry[]
    _pointDefinitions: PointDefinition[]
    _customEvents: CustomEvent[]
  }
}

/**
 * Find a waypoint at a specific time (with epsilon tolerance)
 * 
 * Uses binary search for efficiency with O(log n) complexity.
 * 
 * @param waypoints - Sorted array of waypoints (by time ascending)
 * @param targetTimeSeconds - Target time in seconds
 * @param totalDuration - Total path duration in seconds
 * @returns Matching waypoint index or -1 if not found
 */
export function findWaypointAtTime(
  waypoints: CameraWaypoint[],
  targetTimeSeconds: number,
  totalDuration: number
): number {
  // Convert target to normalized time (0-1)
  const targetNormalized = totalDuration > 0 
    ? targetTimeSeconds / totalDuration 
    : 0
  
  // Binary search with epsilon tolerance for efficiency
  let low = 0
  let high = waypoints.length - 1
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const wpTime = waypoints[mid].time
    
    if (timesAreEqual(wpTime, targetNormalized)) {
      return mid  // Found matching waypoint
    } else if (timeIsLessThan(wpTime, targetNormalized)) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  
  return -1  // No matching waypoint
}

/**
 * Validate point ordering (strictly increasing times)
 * 
 * @param waypoints - Array of waypoints to validate
 * @returns Array of validation errors
 */
export function validatePointOrdering(waypoints: CameraWaypoint[]): string[] {
  const errors: string[] = []
  
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1]
    const curr = waypoints[i]
    
    if (!timeIsLessThan(prev.time, curr.time)) {
      errors.push(
        `Waypoint times not strictly increasing: point ${i-1} (t=${prev.time}) ` +
        `>= point ${i} (t=${curr.time})`
      )
    }
  }
  
  // Validate boundary conditions
  if (waypoints.length > 0) {
    if (waypoints[0].time < 0) {
      errors.push(`First waypoint has negative time: ${waypoints[0].time}`)
    }
    if (waypoints[waypoints.length - 1].time > 1 + TIME_EPSILON) {
      errors.push(`Last waypoint exceeds normalized time 1.0: ${waypoints[waypoints.length - 1].time}`)
    }
  }
  
  return errors
}

/**
 * Validate event count matches waypoint structure
 * N waypoints must have exactly N-1 events
 * 
 * @param waypoints - Array of waypoints
 * @param events - Array of custom events
 * @returns Array of validation errors
 */
export function validateEventCount(
  waypoints: CameraWaypoint[],
  events: CustomEvent[]
): string[] {
  const errors: string[] = []
  const expectedEventCount = Math.max(0, waypoints.length - 1)
  
  if (events.length !== expectedEventCount) {
    errors.push(
      `Event count mismatch: expected ${expectedEventCount} events for ` +
      `${waypoints.length} waypoints, found ${events.length}`
    )
  }
  
  return errors
}

/**
 * Validate no gaps or overlaps between consecutive events
 * 
 * @param events - Array of events sorted by _time
 * @returns Array of validation errors
 */
export function validateEventContinuity(events: CustomEvent[]): string[] {
  const errors: string[] = []
  
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1]
    const curr = events[i]
    
    const prevEndTime = prev._time + (prev._data?._duration ?? 0)
    
    // Check for gap (previous event ends before current starts)
    if (timeIsLessThan(prevEndTime, curr._time)) {
      const gap = curr._time - prevEndTime
      errors.push(
        `Gap detected between events ${i-1} and ${i}: ` +
        `${gap.toFixed(6)}s gap at t=${prevEndTime.toFixed(6)}s`
      )
    }
    
    // Check for overlap (previous event ends after current starts)
    if (timeIsLessThan(curr._time, prevEndTime)) {
      const overlap = prevEndTime - curr._time
      errors.push(
        `Overlap detected between events ${i-1} and ${i}: ` +
        `${overlap.toFixed(6)}s overlap at t=${curr._time.toFixed(6)}s`
      )
    }
  }
  
  return errors
}

/**
 * Full segment-bookmark correspondence validation
 * Combines all validation checks
 * 
 * @param waypoints - Array of waypoints
 * @param events - Array of custom events
 * @param totalDuration - Total path duration in seconds
 * @returns Array of validation errors (empty if valid)
 */
export function validateSegmentBookmarkCorrespondence(
  waypoints: CameraWaypoint[],
  events: CustomEvent[],
  totalDuration: number
): string[] {
  const errors: string[] = []
  
  // 1. Validate point ordering (strictly increasing)
  errors.push(...validatePointOrdering(waypoints))
  
  // 2. Validate event count (N-1 events for N waypoints)
  errors.push(...validateEventCount(waypoints, events))
  
  // 3. Validate no gaps/overlaps between consecutive events
  const sortedEvents = [...events].sort((a, b) => a._time - b._time)
  errors.push(...validateEventContinuity(sortedEvents))
  
  // 4. Validate each event maps to consecutive waypoints
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i]
    const eventStart = event._time
    const eventEnd = eventStart + (event._data?._duration ?? 0)
    
    // Find matching waypoints for this event
    const startWpIdx = findWaypointAtTime(waypoints, eventStart, totalDuration)
    const endWpIdx = findWaypointAtTime(waypoints, eventEnd, totalDuration)
    
    if (startWpIdx === -1) {
      errors.push(
        `Event ${i} start time ${eventStart.toFixed(6)}s ` +
        `has no matching waypoint`
      )
    }
    
    if (endWpIdx === -1) {
      errors.push(
        `Event ${i} end time ${eventEnd.toFixed(6)}s ` +
        `has no matching waypoint`
      )
    }
    
    // Verify waypoints are consecutive
    if (startWpIdx !== -1 && endWpIdx !== -1 && endWpIdx !== startWpIdx + 1) {
      errors.push(
        `Event ${i} does not span consecutive waypoints: ` +
        `spans from index ${startWpIdx} to ${endWpIdx}`
      )
    }
  }
  
  return errors
}

/**
 * Export camera path to Beat Saber v3 bookmark JSON
 * 
 * @param path - Camera path to export
 * @param trackName - Track name for path animation (default: "CameraPath")
 * @param includeBookmarks - Include visual bookmark markers (default: true)
 * @returns ScriptMapper bookmark structure
 */
export function exportToBookmarkJSON(
  path: CameraPath,
  trackName = 'CameraPath',
  includeBookmarks = true
): ScriptMapperBookmark {
  const totalDurationSeconds = path.totalDuration / 1000
  
  // Convert waypoints to point definitions
  const points: Array<[number, number, number, number]> = path.waypoints.map(wp => [
    wp.position.x,
    wp.position.y,
    wp.position.z,
    roundTime(wp.time * totalDurationSeconds)
  ])
  
  // Generate custom events for each segment
  const customEvents: CustomEvent[] = path.segments.map((segment, idx) => {
    const fromWp = path.waypoints[idx]
    const toWp = path.waypoints[idx + 1]
    
    const eventStartTime = roundTime(fromWp.time * totalDurationSeconds)
    const eventDuration = roundTime((toWp.time - fromWp.time) * totalDurationSeconds)
    
    // Use rawCommand if available (preserves original imported format),
    // otherwise generate from easing settings
    let easingCommand: string
    if (segment.rawCommand) {
      easingCommand = segment.rawCommand
    } else if (segment.easingEnabled) {
      easingCommand = formatAsScriptMapperShortCommand(segment.functionId, segment.easeType, segment.driftParams)
    } else {
      easingCommand = 'easeLinear'
    }
    
    return {
      _time: eventStartTime,
      _type: 'AssignPathAnimation',
        _data: {
          _track: trackName,
          _duration: eventDuration,
          _easing: easingCommand
        }
    }
  })
  
  // Generate bookmarks for visual markers (optional)
  const bookmarks: BookmarkEntry[] | undefined = includeBookmarks
    ? path.waypoints.map(wp => ({
        _time: roundTime(wp.time * totalDurationSeconds),
        _name: wp.name ?? `Waypoint ${wp.id}`,
        _color: { r: 0, g: 0.8, b: 1, a: 1 }
      }))
    : undefined
  
  return {
    _version: '3.0.0',
    _customData: {
      _bookmarks: bookmarks,
      _environment: [],
      _pointDefinitions: [
        {
          _name: trackName,
          _points: points
        }
      ],
      _customEvents: customEvents
    }
  }
}

/**
 * Import camera path from Beat Saber v3 bookmark JSON
 * 
 * @param json - ScriptMapper bookmark structure
 * @param defaultBpm - Default BPM if not calculable (default: 120)
 * @returns Parsed camera path or null if invalid
 */
export function importFromBookmarkJSON(
  json: ScriptMapperBookmark,
  defaultBpm = 120
): CameraPath | null {
  try {
    const pointDefs = json._customData?._pointDefinitions
    if (!pointDefs || pointDefs.length === 0) {
      return null
    }
    
    const points = pointDefs[0]._points
    if (!points || points.length < 2) {
      return null
    }
    
    const trackName = pointDefs[0]._name || 'ImportedPath'
    
    // Calculate total duration from last point time
    const totalDurationSeconds = points[points.length - 1][3]
    const totalDurationMs = totalDurationSeconds * 1000
    
    // Convert points to waypoints
    const waypoints: CameraWaypoint[] = points.map((point, idx) => {
      const [x, y, z, timeSeconds] = point
      const normalizedTime = totalDurationSeconds > 0 
        ? timeSeconds / totalDurationSeconds 
        : idx / (points.length - 1)
      
      return createWaypoint(
        normalizedTime,
        { x, y, z },
        json._customData?._bookmarks?.[idx]?._name
      )
    })
    
    // Generate default segments (will be overridden if events exist)
    const segments = generateSegmentsFromWaypoints(waypoints)
    
    // Store bookmark commands for each segment
    // Each segment corresponds to the bookmark at its starting waypoint
    const bookmarks = json._customData?._bookmarks ?? []
    for (let i = 0; i < segments.length; i++) {
      if (bookmarks[i]?._name) {
        segments[i].bookmarkCommands = bookmarks[i]._name
      }
    }
    
    // Parse custom events to restore easing configuration
    const events = json._customData?._customEvents ?? []
    if (events.length > 0) {
      // Parse easing from events and update segments
      // Events are expected to be ordered by time and correspond to segments
      for (const ev of events) {
        const easingCmd = ev._data?._easing ?? 'easeLinear'

        // Determine total duration seconds (for mapping times to waypoint indices)
        const evStart = ev._time
        const evEnd = ev._time + (ev._data?._duration ?? 0)

        const startIdx = findWaypointAtTime(waypoints, evStart, totalDurationSeconds)
        const endIdx = findWaypointAtTime(waypoints, evEnd, totalDurationSeconds)

        if (startIdx === -1 || endIdx === -1) continue

        // Map to segment index (startIdx should correspond to from waypoint)
        const segIdx = startIdx
        if (segIdx < 0 || segIdx >= segments.length) continue

        const segment = segments[segIdx]
        
        // Store raw command for display in graph legend
        segment.rawCommand = easingCmd

        // If easing is linear, set easingEnabled to false and continue
        if (easingCmd === 'easeLinear' || easingCmd === 'linear') {
          segment.easingEnabled = false
          continue
        }

        // Parse command (supports drift and In/Out/InOut and short I/O/IO prefixes)
        const parsed = parseScriptMapperCommand(easingCmd)
        if (!parsed) continue

        segment.easingEnabled = true
        segment.functionId = parsed.functionId
        segment.easeType = parsed.easeType

        if (parsed.functionId === 'drift' && parsed.params) {
          segment.driftParams = { x: parsed.params.x, y: parsed.params.y }
        }
      }
    }
    
    return {
      id: `imported-${Date.now()}`,
      name: `${trackName} (Imported)`,
      waypoints,
      segments,
      totalDuration: totalDurationMs,
      coordinateSystem: 'left-handed',
      bpm: defaultBpm
    }
  } catch (error) {
    console.error('Failed to import bookmark JSON:', error)
    return null
  }
}

/**
 * Validate bookmark JSON structure
 * 
 * @param json - Unknown input to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateBookmarkStructure(json: unknown): string[] {
  const errors: string[] = []
  
  if (!json || typeof json !== 'object') {
    errors.push('Invalid JSON: not an object')
    return errors
  }
  
  const bookmark = json as Partial<ScriptMapperBookmark>
  
  if (!bookmark._version) {
    errors.push('Missing _version field')
  }
  
  if (!bookmark._customData) {
    errors.push('Missing _customData field')
    return errors
  }
  
  const customData = bookmark._customData
  
  if (!customData._pointDefinitions || customData._pointDefinitions.length === 0) {
    errors.push('Missing or empty _pointDefinitions')
  } else {
    const pointDef = customData._pointDefinitions[0]
    if (!pointDef._points || pointDef._points.length < 2) {
      errors.push('Point definition must have at least 2 waypoints')
    }
  }
  
  if (!customData._customEvents) {
    errors.push('Missing _customEvents array')
  }
  
  return errors
}

/**
 * Format bookmark JSON for export with pretty printing
 * 
 * @param bookmark - Bookmark structure
 * @returns Formatted JSON string
 */
export function formatBookmarkJSON(bookmark: ScriptMapperBookmark): string {
  return JSON.stringify(bookmark, null, 2)
}
