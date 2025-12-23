/**
 * Camera Path Presets
 * 
 * Pre-defined camera paths demonstrating various use cases for ScriptMapper.
 * Each preset showcases different easing combinations and movement patterns.
 * 
 * KEYFRAME-CENTRIC MODEL:
 * Each waypoint has a `bookmarkCommand` field that contains:
 * - Position command (q_, dpos_, etc.) for that point's camera state
 * - Easing command for the transition TO the next point
 * - Last waypoint typically includes 'stop' command
 * 
 * This ensures N waypoints generate N bookmarks (not N-1).
 * 
 * SEGMENT AUTO-COMPUTATION:
 * Segments are automatically computed from waypoints using computeSegmentsFromWaypoints().
 * - N waypoints → N-1 segments
 * - segment[i] = transition from waypoint[i] to waypoint[i+1]
 * - Easing extracted from waypoint[i].bookmarkCommand
 */

import type { CameraPath, CameraWaypoint } from './scriptMapperTypes'
import { computeSegmentsFromWaypoints, parsePositionCommand } from './scriptMapperTypes'

/**
 * Helper to create a waypoint from beat and ScriptMapper command
 * 
 * @param index - Waypoint index for ID generation
 * @param beat - Beat number (0, 1, 2, etc.) - will be normalized later
 * @param command - Full ScriptMapper command string
 * @param prevPosition - Optional fallback position for non-position commands (spin, etc.)
 */
function wp(
  index: number,
  beat: number,
  command: string,
  prevPosition?: { x: number; y: number; z: number }
): CameraWaypoint {
  const position = parsePositionCommand(command) || prevPosition || { x: 0, y: 0, z: 0 }
  return {
    id: `preset-wp-${index}`,
    position,
    time: beat, // Store beat, normalized later in definitionToPath()
    bookmarkCommand: command
  }
}

/**
 * Preset waypoints definitions (segments computed automatically)
 */
interface PresetDefinition {
  id: string
  name: string
  waypoints: CameraWaypoint[]
  totalDuration: number
  coordinateSystem: 'left-handed' | 'right-handed'
  bpm?: number
  beatOffset?: number
  beatDuration?: number
}

/**
 * Raw preset definitions (waypoints only, segments computed automatically)
 * 
 * KEYFRAME-CENTRIC MODEL:
 * Each waypoint has bookmarkCommand containing:
 * - Position command for this point (q_x_y_z_rx_ry_rz_fov)
 * - Easing for transition TO next point
 * - Last point has 'stop' command
 */
const PRESET_DEFINITIONS: PresetDefinition[] = [
  // ============================================
  // 1. Basic 3-Point Path (Center → Side → Top)
  // Demonstrates: q command with rotation parameters
  // 3 waypoints = 3 bookmarks, 8 beats total
  // ============================================
  {
    id: 'preset-basic-3point',
    name: 'Basic 3-Point Path',
    beatDuration: 8,
    waypoints: [
      wp(0, 0, 'q_0_1_-5_0_0_0_60,IOSine'),
      wp(1, 4, 'q_3_1_0_0_15_0_60,IOQuad'),
      wp(2, 8, 'q_0_3_5_0_0_0_60,stop')
    ],
    totalDuration: 3000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 2. EaseIn Demo (HOLD → EASED → HOLD)
  // Demonstrates: q command with stop, OCubic easing (slow start)
  // 4 waypoints = 4 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-easein-demo',
    name: 'EaseIn Demo (HOLD→EASED→HOLD)',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_-3_1_-5_0_0_0_60'),
      wp(1, 3.2, 'q_-3_1_-5_0_0_0_60,OCubic'),
      wp(2, 12.8, 'q_3_1_5_0_0_0_60'),
      wp(3, 16, 'q_3_1_5_0_0_0_60,stop')
    ],
    totalDuration: 4000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 3. EaseOut Demo (EASED → HOLD → LINEAR)
  // Demonstrates: IQuad easing (slow end)
  // 4 waypoints = 4 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-easeout-demo',
    name: 'EaseOut Demo (EASED→HOLD→LINEAR)',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_0_1_-5_0_0_0_60,IQuad'),
      wp(1, 6.4, 'q_0_2_0_0_0_0_60'),
      wp(2, 9.6, 'q_0_2_0_0_0_0_60'),
      wp(3, 16, 'q_0_1_5_0_0_0_60,stop')
    ],
    totalDuration: 3500,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 4. Complex 5-Point Path
  // Demonstrates: spin commands with rotation
  // 5 waypoints = 5 bookmarks, 16 beats total
  // Note: spin commands use prevPosition fallback
  // ============================================
  {
    id: 'preset-complex-5point',
    name: 'Complex 5-Point Path',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_-4_0.5_-4_0_0_0_60,IOQuad'),
      wp(1, 4, 'spin45,IOCubic', { x: 0, y: 3, z: -2 }),
      wp(2, 8, 'spin-30,IOQuart', { x: 4, y: 1, z: 0 }),
      wp(3, 12, 'spin90,IOQuint', { x: 0, y: 2, z: 2 }),
      wp(4, 16, 'q_-4_0.5_4_0_0_0_60,stop')
    ],
    totalDuration: 5000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 5. Zigzag Quick Motion (8 points)
  // Demonstrates: diverse easing types (Back, Elastic, Bounce)
  // 8 waypoints = 8 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-zigzag-quick',
    name: 'Zigzag Quick Motion',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_-3_1_-3_0_0_0_60,OBack'),
      wp(1, 2.24, 'q_3_2_-2_0_0_0_60,IBack'),
      wp(2, 4.48, 'q_-3_1_-1_0_0_0_60,OElastic'),
      wp(3, 6.72, 'q_3_2_0_0_0_0_60,IElastic'),
      wp(4, 9.12, 'q_-3_1_1_0_0_0_60,OBounce'),
      wp(5, 11.36, 'q_3_2_2_0_0_0_60,IBounce'),
      wp(6, 13.6, 'q_-3_1_3_0_0_0_60,IOExpo'),
      wp(7, 16, 'q_0_1.5_4_0_0_0_60,stop')
    ],
    totalDuration: 3000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 6. Around the Block (4-corner tour)
  // Demonstrates: rotation (ry) parameter in q command
  // 5 waypoints = 5 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-around-block',
    name: 'Around the Block (4 corners)',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_5_1_0_0_0_0_60,IOSine'),
      wp(1, 4, 'q_0_1_5_0_90_0_60,IOSine'),
      wp(2, 8, 'q_-5_1_0_0_180_0_60,IOSine'),
      wp(3, 12, 'q_0_1_-5_0_270_0_60,IOSine'),
      wp(4, 16, 'q_5_1_0_0_360_0_60,stop')
    ],
    totalDuration: 4000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 7. Cinematic Sweep (3 points)
  // Demonstrates: FOV changes and rx (pitch) rotation
  // 3 waypoints = 3 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-cinematic-sweep',
    name: 'Cinematic Sweep',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'q_-5_2_-5_-10_0_0_45,IOQuint'),
      wp(1, 8, 'q_0_1_0_0_0_0_60,IOCirc'),
      wp(2, 16, 'q_5_0.5_5_10_0_0_75,stop')
    ],
    totalDuration: 4500,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 8. Simple 2-Point Pan (backward compatible)
  // Demonstrates: ease_x_y (Drift) symmetric curve
  // 2 waypoints = 2 bookmarks, 8 beats total
  // ============================================
  {
    id: 'preset-simple-pan',
    name: 'Simple 2-Point Pan',
    beatDuration: 8,
    waypoints: [
      wp(0, 0, 'q_-3_1.5_-4_0_0_0_60,ease_6_6'),
      wp(1, 8, 'q_3_1.5_4_0_0_0_60,stop')
    ],
    totalDuration: 2000,
    coordinateSystem: 'left-handed'
  }
]

/**
 * Convert preset definition to CameraPath with computed segments
 * Normalizes beat-based waypoint times to 0-1 range
 */
function definitionToPath(def: PresetDefinition): CameraPath {
  const bd = def.beatDuration || 16
  const normalizedWaypoints = def.waypoints.map(wp => ({
    ...wp,
    time: wp.time / bd // beat → 0-1 normalized
  }))
  return {
    ...def,
    waypoints: normalizedWaypoints,
    segments: computeSegmentsFromWaypoints(normalizedWaypoints, 'preset-seg')
  }
}

/**
 * Default camera path presets (with auto-computed segments)
 */
export const CAMERA_PATH_PRESETS: CameraPath[] = PRESET_DEFINITIONS.map(definitionToPath)

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): CameraPath | undefined {
  return CAMERA_PATH_PRESETS.find(p => p.id === id)
}

/**
 * Clone a preset for user modification
 * Creates new unique IDs for waypoints; segments are recomputed automatically
 */
export function clonePreset(preset: CameraPath): CameraPath {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 7)
  
  // Create new waypoint IDs
  const newWaypoints = preset.waypoints.map((waypoint, index) => ({
    ...waypoint,
    id: `wp-${timestamp}-${random}-${index}`
  }))
  
  // Compute segments from cloned waypoints (auto-updates IDs)
  const newSegments = computeSegmentsFromWaypoints(newWaypoints, `seg-${timestamp}-${random}`)
  
  return {
    ...preset,
    id: `path-${timestamp}-${random}`,
    name: `${preset.name} (Copy)`,
    waypoints: newWaypoints,
    segments: newSegments
  }
}

/**
 * Default camera path (Simple 2-Point Pan)
 */
export const DEFAULT_CAMERA_PATH = CAMERA_PATH_PRESETS.find(p => p.id === 'preset-simple-pan')!
