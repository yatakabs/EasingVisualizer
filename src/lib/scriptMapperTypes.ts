/**
 * ScriptMapper N-Point Camera Path Types
 * 
 * Type definitions for N-point camera paths compatible with Beat Saber's ScriptMapper.
 * Enables multi-waypoint camera animation with per-segment easing control.
 */

import type { EaseType } from './easeTypes'

/**
 * Calculate rotation angles to look at a target point from a given position.
 * Used for dpos commands which auto-calculate camera orientation toward avatar.
 * 
 * @param position Camera position
 * @param target Target point to look at (default: avatar head at y=1.5, ScriptMapper #height default)
 * @returns Rotation in degrees (rx=pitch, ry=yaw, rz=roll)
 */
export function calculateLookAtRotation(
  position: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number } = { x: 0, y: 1.5, z: 0 }
): { rx: number; ry: number; rz: number } {
  // Direction vector from camera to target
  const dx = target.x - position.x
  const dy = target.y - position.y
  const dz = target.z - position.z
  
  // Yaw: rotation around Y axis (horizontal angle)
  // atan2(dx, dz) gives angle in XZ plane
  const ry = Math.atan2(dx, dz) * (180 / Math.PI)
  
  // Pitch: rotation around X axis (vertical angle)
  const horizontalDist = Math.sqrt(dx * dx + dz * dz)
  const rx = -Math.atan2(dy, horizontalDist) * (180 / Math.PI)
  
  // Roll: typically 0 for look-at (no tilt)
  const rz = 0
  
  return { rx, ry, rz }
}

/**
 * A single waypoint in a camera path
 * Represents a camera position at a specific normalized time (0-1)
 * 
 * In the keyframe-centric model, each waypoint corresponds to exactly one
 * ScriptMapper bookmark. The bookmark contains:
 * - Position command (q_, dpos_, etc.) for this point
 * - Easing command for transition TO the next point
 * - The last waypoint typically includes 'stop' command
 */
export interface CameraWaypoint {
  /** Unique identifier */
  id: string
  /** 3D position in world space */
  position: { x: number; y: number; z: number }
  /** Normalized timeline position (0-1) */
  time: number
  /** Optional label (e.g., "Intro", "Drop") */
  name?: string
  /** Optional beat number (e.g., 0, 32, 64, 128) */
  beat?: number
  /**
   * ScriptMapper bookmark command string for this waypoint.
   * Contains comma-separated commands like 'q_x_y_z_rx_ry_rz_fov,InOutSine'.
   * The command includes:
   * - Position command (q_, dpos_, etc.) for this point's camera state
   * - Easing command for the transition TO the next point
   * For the last waypoint, typically includes 'stop' command.
   * 
   * Examples:
   * - First point: 'q_0_1_-5_0_0_0_60,InOutSine'
   * - Middle point: 'q_3_1_0_0_15_0_60,InOutQuad'
   * - Last point: 'q_0_3_5_0_0_0_60,stop'
   */
  bookmarkCommand?: string
}

/**
 * A segment between two waypoints with independent easing configuration
 * N waypoints = N-1 segments
 */
export interface CameraSegment {
  /** Unique identifier */
  id: string
  /** Reference to start waypoint ID */
  fromWaypointId: string
  /** Reference to end waypoint ID */
  toWaypointId: string
  /** Toggle: true = apply easing, false = linear interpolation */
  easingEnabled: boolean
  /** Easing function ID (e.g., 'quadratic', 'sine') */
  functionId: string
  /** Ease type: 'easein' | 'easeout' | 'easeboth' */
  easeType: EaseType
  /** Relative duration weight (default: 1.0) - reserved for future use */
  duration: number
  /** Parameters for Drift function only */
  driftParams?: { x: number; y: number }
  /**
   * Raw easing command from imported bookmark.
   * Preserved during import for display in graph legend.
   * Used during export if available, otherwise generated from easing settings.
   */
  rawCommand?: string
  /**
   * Full bookmark name/commands from imported _bookmarks._name field.
   * Contains ScriptMapper commands like 'q_x_y_z_rx_ry_rz_fov', 'dpos_x_y_z', 'spin60', etc.
   * Comma-separated list of commands when multiple commands exist.
   */
  bookmarkCommands?: string
}

/**
 * Complete camera path with N waypoints and N-1 segments
 */
export interface CameraPath {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Sorted by time (ascending) - first at time 0, last at time 1 */
  waypoints: CameraWaypoint[]
  /** Ordered from first to last segment */
  segments: CameraSegment[]
  /** Total animation time in ms (for display purposes) */
  totalDuration: number
  /** Coordinate system - matches existing CameraPreview setting */
  coordinateSystem: 'left-handed' | 'right-handed'
  /** Optional BPM for beat-based timing */
  bpm?: number
  /** Optional starting beat offset (default: 0) */
  beatOffset?: number
  /** Optional total duration in beats */
  beatDuration?: number
}

/**
 * Result of interpolating a camera path at a given time
 */
export interface InterpolationResult {
  /** Interpolated 3D position */
  position: { x: number; y: number; z: number }
  /** Current segment being traversed */
  currentSegment: CameraSegment
  /** Index of current segment (0-based) */
  currentSegmentIndex: number
  /** Local time within current segment (0-1) */
  segmentLocalTime: number
  /** Global time (0-1) */
  globalTime: number
  /** Interpolated rotation (if rotation data available) */
  rotation?: { rx: number; ry: number; rz: number }
}

/**
 * Validate camera path structure
 * @param path - Camera path to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCameraPath(path: CameraPath): string[] {
  const errors: string[] = []
  
  // Must have at least 2 waypoints
  if (path.waypoints.length < 2) {
    errors.push('Path must have at least 2 waypoints')
    return errors // Early return - can't validate further
  }
  
  // First waypoint must be at time 0
  if (path.waypoints[0].time !== 0) {
    errors.push('First waypoint must be at time 0')
  }
  
  // Last waypoint must be at time 1
  if (path.waypoints[path.waypoints.length - 1].time !== 1) {
    errors.push('Last waypoint must be at time 1')
  }
  
  // Waypoints must be sorted by time (strictly increasing)
  for (let i = 1; i < path.waypoints.length; i++) {
    if (path.waypoints[i].time <= path.waypoints[i - 1].time) {
      errors.push(`Waypoint ${i} time (${path.waypoints[i].time}) must be > previous time (${path.waypoints[i - 1].time})`)
    }
  }
  
  // Must have N-1 segments for N waypoints
  if (path.segments.length !== path.waypoints.length - 1) {
    errors.push(`Expected ${path.waypoints.length - 1} segments, got ${path.segments.length}`)
  }
  
  // Segments must reference valid waypoints
  const waypointIds = new Set(path.waypoints.map(w => w.id))
  for (const segment of path.segments) {
    if (!waypointIds.has(segment.fromWaypointId)) {
      errors.push(`Segment ${segment.id} references invalid fromWaypointId: ${segment.fromWaypointId}`)
    }
    if (!waypointIds.has(segment.toWaypointId)) {
      errors.push(`Segment ${segment.id} references invalid toWaypointId: ${segment.toWaypointId}`)
    }
  }
  
  // Segments must be sequential (from[i] = waypoint[i], to[i] = waypoint[i+1])
  for (let i = 0; i < path.segments.length; i++) {
    const segment = path.segments[i]
    const expectedFrom = path.waypoints[i]?.id
    const expectedTo = path.waypoints[i + 1]?.id
    
    if (segment.fromWaypointId !== expectedFrom) {
      errors.push(`Segment ${i} fromWaypointId should be ${expectedFrom}, got ${segment.fromWaypointId}`)
    }
    if (segment.toWaypointId !== expectedTo) {
      errors.push(`Segment ${i} toWaypointId should be ${expectedTo}, got ${segment.toWaypointId}`)
    }
  }
  
  return errors
}

/**
 * Parse position and rotation from ScriptMapper command
 * Supports: q_X_Y_Z_RX_RY_RZ_FOV, dpos_X_Y_Z_FOV
 * Returns null for non-position commands (spin, stop, etc.)
 * 
 * Format: q_X_Y_Z_RX_RY_RZ_FOV_DURATION_EASING
 * - X, Y, Z: position
 * - RX, RY, RZ: rotation in degrees
 * - FOV: field of view (optional)
 * - DURATION: beat duration (optional)
 * - EASING: easing type (optional)
 * 
 * @param command - ScriptMapper command string like 'q_0_1.5_-3_45_30_0_70,IOSine'
 * @returns Position and optional rotation, or null if not a position command
 */
export function parsePositionCommand(command: string): { 
  x: number; 
  y: number; 
  z: number;
  rotation?: { rx: number; ry: number; rz: number }
} | null {
  // q_X_Y_Z_RX_RY_RZ_FOV (rotation values are optional but typically present)
  // Match: q_X_Y_Z followed by optional _RX_RY_RZ_FOV...
  const qMatch = command.match(/^q_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)(?:_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+))?/)
  if (qMatch) {
    const position = { 
      x: parseFloat(qMatch[1]), 
      y: parseFloat(qMatch[2]), 
      z: parseFloat(qMatch[3]) 
    }
    
    // Extract rotation if present (groups 4, 5, 6)
    if (qMatch[4] !== undefined && qMatch[5] !== undefined && qMatch[6] !== undefined) {
      return {
        ...position,
        rotation: {
          rx: parseFloat(qMatch[4]),
          ry: parseFloat(qMatch[5]),
          rz: parseFloat(qMatch[6])
        }
      }
    }
    
    return position
  }
  
  // dpos_X_Y_Z_FOV - automatically calculate rotation to look at avatar/center
  const dposMatch = command.match(/^dpos_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)_/)
  if (dposMatch) {
    const position = {
      x: parseFloat(dposMatch[1]),
      y: parseFloat(dposMatch[2]),
      z: parseFloat(dposMatch[3])
    }
    return {
      ...position,
      rotation: calculateLookAtRotation(position)
    }
  }
  
  return null
}

/**
 * Extract easing information from a waypoint's bookmarkCommand.
 * Parses ScriptMapper command strings to get functionId and easeType.
 * 
 * @param bookmarkCommand - Command string like 'q_0_1_-5_0_0_0_60,InOutSine'
 * @returns Easing info or null if not found/parseable
 */
export function extractEasingFromBookmarkCommand(bookmarkCommand?: string): {
  functionId: string
  easeType: EaseType
  easingEnabled: boolean
  driftParams?: { x: number; y: number }
  rawCommand?: string
} | null {
  if (!bookmarkCommand) return null
  
  // Split by comma to get command parts
  const parts = bookmarkCommand.split(',')
  
  // Look for easing command (not position commands like q_, dpos_, spin, next, stop, ->)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim()
    
    // Skip non-easing commands
    if (
      part.startsWith('q_') || 
      part.startsWith('dpos_') || 
      part.startsWith('spin') ||
      part.startsWith('->') ||
      part === 'next' ||
      part === 'stop'
    ) {
      continue
    }
    
    // Check for Drift format: ease_x_y
    const driftMatch = part.match(/^ease_(\d+)_(\d+)$/)
    if (driftMatch) {
      return {
        functionId: 'drift',
        easeType: 'easein',
        easingEnabled: true,
        driftParams: {
          x: parseInt(driftMatch[1], 10),
          y: parseInt(driftMatch[2], 10)
        },
        rawCommand: part
      }
    }
    
    // Check for standard easing formats: InOut/IO, In/I, Out/O + Name
    // ScriptMapper naming directly matches internal naming:
    // - In/I: EaseIn = slow at START
    // - Out/O: EaseOut = slow at END
    const SCRIPTMAPPER_TO_INTERNAL: Record<string, string> = {
      'Sine': 'sine',
      'Quad': 'quadratic',
      'Cubic': 'cubic',
      'Quart': 'quartic',
      'Quint': 'quintic',
      'Expo': 'exponential',
      'Circ': 'circular',
      'Back': 'back',
      'Elastic': 'elastic',
      'Bounce': 'bounce'
    }
    
    const prefixes = [
      { keys: ['InOut', 'IO'], ease: 'easeboth' as EaseType },
      { keys: ['In', 'I'], ease: 'easein' as EaseType },    // ScriptMapper In → internal easein
      { keys: ['Out', 'O'], ease: 'easeout' as EaseType }   // ScriptMapper Out → internal easeout
    ]
    
    for (const group of prefixes) {
      for (const key of group.keys) {
        if (part.startsWith(key)) {
          const baseName = part.slice(key.length)
          if (!baseName) continue
          
          const functionId = SCRIPTMAPPER_TO_INTERNAL[baseName]
          if (functionId) {
            return {
              functionId,
              easeType: group.ease,
              easingEnabled: true,
              rawCommand: part
            }
          }
        }
      }
    }
  }
  
  return null
}

/**
 * Auto-generate segments from waypoints
 * Creates N-1 segments with default easing (InOutQuad)
 * @param waypoints - Array of waypoints (must be sorted by time)
 * @returns Array of segments linking consecutive waypoints
 */
export function generateSegmentsFromWaypoints(
  waypoints: CameraWaypoint[]
): CameraSegment[] {
  if (waypoints.length < 2) return []
  
  const segments: CameraSegment[] = []
  const timestamp = Date.now()
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    segments.push({
      id: `seg-${timestamp}-${i}`,
      fromWaypointId: waypoints[i].id,
      toWaypointId: waypoints[i + 1].id,
      easingEnabled: true,
      functionId: 'quadratic',
      easeType: 'easeboth',
      duration: 1.0
    })
  }
  
  return segments
}

/**
 * Compute segments from waypoints by extracting easing from bookmarkCommand.
 * This is the preferred method for creating segments from waypoint definitions.
 * 
 * N waypoints → N-1 segments
 * segment[i] represents the transition from waypoint[i] to waypoint[i+1]
 * Easing for segment[i] is extracted from waypoint[i].bookmarkCommand
 * 
 * @param waypoints - Array of waypoints with bookmarkCommand fields
 * @param idPrefix - Optional prefix for segment IDs (default: 'seg')
 * @returns Array of segments with easing extracted from waypoints
 */
export function computeSegmentsFromWaypoints(
  waypoints: CameraWaypoint[],
  idPrefix = 'seg'
): CameraSegment[] {
  if (waypoints.length < 2) return []
  
  return waypoints.slice(0, -1).map((wp, i) => {
    const nextWp = waypoints[i + 1]
    const easing = extractEasingFromBookmarkCommand(wp.bookmarkCommand)
    
    return {
      id: `${idPrefix}-${i}`,
      fromWaypointId: wp.id,
      toWaypointId: nextWp.id,
      easingEnabled: easing?.easingEnabled ?? false,
      functionId: easing?.functionId ?? 'linear',
      easeType: easing?.easeType ?? 'easein',
      duration: nextWp.time - wp.time,
      driftParams: easing?.driftParams,
      rawCommand: easing?.rawCommand,
      bookmarkCommands: wp.bookmarkCommand
    }
  })
}

/**
 * Create a unique waypoint ID
 */
export function createWaypointId(): string {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Create a unique segment ID
 */
export function createSegmentId(): string {
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Create a new waypoint with default values
 */
export function createWaypoint(
  time: number,
  position: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 },
  name?: string
): CameraWaypoint {
  return {
    id: createWaypointId(),
    position,
    time: Math.max(0, Math.min(1, time)),
    name
  }
}

/**
 * Create a new segment with default easing
 */
export function createSegment(
  fromWaypointId: string,
  toWaypointId: string,
  easingEnabled = true,
  functionId = 'quadratic',
  easeType: EaseType = 'easeboth'
): CameraSegment {
  return {
    id: createSegmentId(),
    fromWaypointId,
    toWaypointId,
    easingEnabled,
    functionId,
    easeType,
    duration: 1.0
  }
}

/**
 * BPM and Beat Conversion Utilities
 */

/**
 * Convert beat number to seconds
 * @param beat - Beat number
 * @param bpm - Beats per minute
 * @returns Time in seconds
 */
export function beatToSeconds(beat: number, bpm: number): number {
  if (bpm <= 0) return 0
  return (beat / bpm) * 60
}

/**
 * Convert seconds to beat number
 * @param seconds - Time in seconds
 * @param bpm - Beats per minute
 * @returns Beat number
 */
export function secondsToBeat(seconds: number, bpm: number): number {
  if (bpm <= 0) return 0
  return (seconds * bpm) / 60
}

/**
 * Convert normalized time (0-1) to beat number
 * @param normalized - Normalized time (0-1)
 * @param totalBeats - Total duration in beats
 * @param offset - Starting beat offset (default: 0)
 * @returns Beat number
 */
export function normalizedToBeat(
  normalized: number,
  totalBeats: number,
  offset = 0
): number {
  return normalized * totalBeats + offset
}

/**
 * Convert beat number to normalized time (0-1)
 * @param beat - Beat number
 * @param totalBeats - Total duration in beats
 * @param offset - Starting beat offset (default: 0)
 * @returns Normalized time (0-1)
 */
export function beatToNormalized(
  beat: number,
  totalBeats: number,
  offset = 0
): number {
  if (totalBeats <= 0) return 0
  return (beat - offset) / totalBeats
}

/**
 * Get the beat number for a waypoint if BPM is defined
 * @param waypoint - Waypoint to check
 * @param path - Camera path with BPM metadata
 * @returns Beat number or null if BPM not set
 */
export function getWaypointBeat(
  waypoint: CameraWaypoint,
  path: CameraPath
): number | null {
  if (!path.bpm || !path.beatDuration) return null
  if (waypoint.beat !== undefined) return waypoint.beat
  
  return normalizedToBeat(
    waypoint.time,
    path.beatDuration,
    path.beatOffset ?? 0
  )
}

/**
 * Calculate total beat duration from BPM and path duration
 * @param totalDurationMs - Total duration in milliseconds
 * @param bpm - Beats per minute
 * @returns Total beats
 */
export function calculateBeatDuration(
  totalDurationMs: number,
  bpm: number
): number {
  const durationSeconds = totalDurationMs / 1000
  const beatsPerSecond = bpm / 60
  return Math.round(durationSeconds * beatsPerSecond)
}
