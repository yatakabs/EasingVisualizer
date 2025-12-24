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
  },
  
  // ============================================
  // 9. Orbit Around Player (dpos)
  // Demonstrates: dpos auto-look-at functionality
  // Camera circles around avatar, always facing center
  // 5 waypoints = 5 bookmarks, 16 beats total
  // ============================================
  {
    id: 'preset-dpos-orbit',
    name: 'Orbit Around Player (dpos)',
    beatDuration: 16,
    waypoints: [
      wp(0, 0, 'dpos_0_1.5_-5_60,IOSine'),     // Front
      wp(1, 4, 'dpos_5_1.5_0_60,IOSine'),      // Right
      wp(2, 8, 'dpos_0_1.5_5_60,IOSine'),      // Back
      wp(3, 12, 'dpos_-5_1.5_0_60,IOSine'),    // Left
      wp(4, 16, 'dpos_0_1.5_-5_60,stop')       // Return to front
    ],
    totalDuration: 4000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 10. Dynamic Height Sweep (dpos)
  // Demonstrates: dpos with varying heights
  // Camera sweeps up and down while moving around
  // 4 waypoints = 4 bookmarks, 12 beats total
  // ============================================
  {
    id: 'preset-dpos-height',
    name: 'Dynamic Height Sweep (dpos)',
    beatDuration: 12,
    waypoints: [
      wp(0, 0, 'dpos_3_0.5_-4_60,IOQuad'),    // Low right-front
      wp(1, 4, 'dpos_-2_3_-3_50,IOQuad'),     // High left-front
      wp(2, 8, 'dpos_0_1.5_-5_65,IOQuad'),    // Center front
      wp(3, 12, 'dpos_4_2_2_55,stop')         // Behind high-right
    ],
    totalDuration: 3500,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 11. Cinematic Pull Back (dpos)
  // Demonstrates: dramatic zoom-out with dpos
  // Simple 2-point close-up to wide shot
  // 2 waypoints = 2 bookmarks, 8 beats total
  // ============================================
  {
    id: 'preset-dpos-pullback',
    name: 'Cinematic Pull Back (dpos)',
    beatDuration: 8,
    waypoints: [
      wp(0, 0, 'dpos_0_1.2_-2_75,IOExpo'),    // Close-up
      wp(1, 8, 'dpos_0_2_-8_45,stop')         // Wide shot
    ],
    totalDuration: 2500,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 12. Figure-8 Pattern (dpos)
  // Demonstrates: complex path with auto-look
  // Camera traces a figure-8 pattern around player
  // 9 waypoints = 9 bookmarks, 24 beats total
  // ============================================
  {
    id: 'preset-dpos-figure8',
    name: 'Figure-8 Pattern (dpos)',
    beatDuration: 24,
    waypoints: [
      wp(0, 0, 'dpos_0_1.5_-4_60,IOCubic'),    // Start front
      wp(1, 3, 'dpos_3_1.5_-2_60,IOCubic'),    // Right-front
      wp(2, 6, 'dpos_4_1.5_2_60,IOCubic'),     // Right-back
      wp(3, 9, 'dpos_0_1.5_4_60,IOCubic'),     // Center back
      wp(4, 12, 'dpos_-4_1.5_2_60,IOCubic'),   // Left-back
      wp(5, 15, 'dpos_-3_1.5_-2_60,IOCubic'),  // Left-front
      wp(6, 18, 'dpos_0_1.5_-4_60,IOCubic'),   // Return front (cross point)
      wp(7, 21, 'dpos_2_2_-3_55,IOCubic'),     // Rise slightly
      wp(8, 24, 'dpos_0_1.5_-4_60,stop')       // End front
    ],
    totalDuration: 6000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 13. Mixed q_ and dpos Demo
  // Demonstrates: combining explicit rotation with auto-look
  // Shows transition between manual and auto camera control
  // 6 waypoints = 6 bookmarks, 20 beats total
  // ============================================
  {
    id: 'preset-mixed-qdpos',
    name: 'Mixed q_ and dpos Demo',
    beatDuration: 20,
    waypoints: [
      wp(0, 0, 'q_0_1.5_-5_0_0_0_60,IOQuad'),      // Manual: straight ahead
      wp(1, 4, 'dpos_3_1.5_-3_60,IOQuad'),         // Auto: look at center
      wp(2, 8, 'q_4_2_0_0_-45_0_55,IOQuad'),       // Manual: angled left
      wp(3, 12, 'dpos_0_2.5_3_50,IOQuad'),         // Auto: from behind
      wp(4, 16, 'q_-3_1_-4_15_30_0_65,IOQuad'),    // Manual: tilted view
      wp(5, 20, 'dpos_0_1.5_-5_60,stop')           // Auto: return front
    ],
    totalDuration: 5000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 14. Spiral Descent (dpos)
  // Demonstrates: vertical spiral motion with dpos
  // Camera spirals down while orbiting
  // 7 waypoints = 7 bookmarks, 21 beats total
  // ============================================
  {
    id: 'preset-dpos-spiral',
    name: 'Spiral Descent (dpos)',
    beatDuration: 21,
    waypoints: [
      wp(0, 0, 'dpos_0_4_-5_45,IOSine'),       // High front
      wp(1, 3, 'dpos_4_3.5_-2_50,IOSine'),     // High right
      wp(2, 6, 'dpos_3_3_3_55,IOSine'),        // Mid back-right
      wp(3, 9, 'dpos_-2_2.5_4_55,IOSine'),     // Mid back-left
      wp(4, 12, 'dpos_-4_2_-1_60,IOSine'),     // Low left
      wp(5, 15, 'dpos_-1_1.5_-4_60,IOSine'),   // Low front-left
      wp(6, 18, 'dpos_2_1_-3_65,IOSine'),      // Low front-right
      wp(7, 21, 'dpos_0_0.8_-2.5_70,stop')     // Close-up low
    ],
    totalDuration: 5500,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 15. Easing Showcase (Multi-Easing)
  // Demonstrates: different easings for each transition
  // Each segment uses a unique easing function
  // 8 waypoints = 8 bookmarks, 28 beats total
  // ============================================
  {
    id: 'preset-easing-showcase',
    name: 'Easing Showcase',
    beatDuration: 28,
    waypoints: [
      wp(0, 0, 'q_0_1.5_-5_0_0_0_60,IQuad'),       // Start: ease-in quad
      wp(1, 4, 'q_3_1.5_-3_0_-30_0_55,OQuad'),     // Out quad
      wp(2, 8, 'q_4_2_0_0_-60_0_50,ICubic'),       // In cubic
      wp(3, 12, 'q_2_2.5_3_-15_-120_0_45,OCubic'), // Out cubic
      wp(4, 16, 'q_-2_2_3_-10_120_0_50,IExpo'),    // In expo (dramatic)
      wp(5, 20, 'q_-4_1.5_0_0_60_0_55,OExpo'),     // Out expo
      wp(6, 24, 'q_-2_1_-4_10_30_0_60,IOBack'),    // In-out back (overshoot)
      wp(7, 28, 'q_0_1.5_-5_0_0_0_60,stop')        // Return to start
    ],
    totalDuration: 7000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 16. Bounce & Elastic Demo (Multi-Easing)
  // Demonstrates: bouncy and elastic easings
  // Great for energetic/playful movements
  // 6 waypoints = 6 bookmarks, 24 beats total
  // ============================================
  {
    id: 'preset-bounce-elastic',
    name: 'Bounce & Elastic Demo',
    beatDuration: 24,
    waypoints: [
      wp(0, 0, 'dpos_0_1.5_-5_60,IBounce'),       // In bounce (bouncy start)
      wp(1, 4, 'dpos_4_1_-2_65,OBounce'),         // Out bounce
      wp(2, 8, 'dpos_3_2.5_2_50,IElastic'),       // In elastic (spring)
      wp(3, 12, 'dpos_-2_2_3_55,OElastic'),       // Out elastic
      wp(4, 18, 'dpos_-4_1.5_-1_60,IOBounce'),    // In-out bounce
      wp(5, 24, 'dpos_0_1.5_-5_60,stop')          // Return to start
    ],
    totalDuration: 6000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 17. Dramatic Transitions (Multi-Easing)
  // Demonstrates: contrasting slow and fast easings
  // Combines smooth and snappy movements
  // 7 waypoints = 7 bookmarks, 24 beats total
  // ============================================
  {
    id: 'preset-dramatic-transitions',
    name: 'Dramatic Transitions',
    beatDuration: 24,
    waypoints: [
      wp(0, 0, 'q_0_1.5_-6_0_0_0_55,OCirc'),       // Slow start, fast end
      wp(1, 4, 'q_5_2_-2_-5_-45_0_50,ICirc'),      // Fast start, slow end
      wp(2, 8, 'dpos_4_3_2_45,OQuint'),            // Very slow end
      wp(3, 12, 'dpos_-1_1_4_60,IQuint'),          // Very fast start
      wp(4, 16, 'q_-4_2_0_10_75_0_50,IOExpo'),     // Dramatic in-out
      wp(5, 20, 'dpos_-3_1.5_-3_55,OBack'),        // Overshoot finish
      wp(6, 24, 'q_0_1.5_-5_0_0_0_60,stop')        // End position
    ],
    totalDuration: 6000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 18. Action Sequence (Multi-Easing)
  // Demonstrates: fast-paced easing combinations
  // Quick cuts with varied timing
  // 10 waypoints = 10 bookmarks, 20 beats total
  // ============================================
  {
    id: 'preset-action-sequence',
    name: 'Action Sequence',
    beatDuration: 20,
    waypoints: [
      wp(0, 0, 'dpos_0_1.5_-4_65,OExpo'),         // Quick zoom in
      wp(1, 2, 'dpos_3_1_-2_70,IExpo'),           // Snap to side
      wp(2, 4, 'q_4_2_1_-10_-60_5_55,OQuad'),     // Fast pan
      wp(3, 6, 'dpos_0_2.5_3_45,IBack'),          // Overshoot high
      wp(4, 8, 'dpos_-3_1_2_65,OCirc'),           // Smooth behind
      wp(5, 10, 'q_-4_1.5_-1_5_50_-5_60,IOCubic'),// Stabilize
      wp(6, 12, 'dpos_-2_0.8_-3_75,OExpo'),       // Low angle
      wp(7, 14, 'dpos_2_1_-3_70,IQuad'),          // Side shift
      wp(8, 17, 'q_3_2_-2_-5_-30_0_55,OElastic'), // Elastic settle
      wp(9, 20, 'dpos_0_1.5_-4_60,stop')          // Return front
    ],
    totalDuration: 5000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 19. Smooth Cinematic (Multi-Easing)
  // Demonstrates: smooth professional easings
  // Film-like camera movements
  // 6 waypoints = 6 bookmarks, 32 beats total
  // ============================================
  {
    id: 'preset-smooth-cinematic',
    name: 'Smooth Cinematic',
    beatDuration: 32,
    waypoints: [
      wp(0, 0, 'q_-3_1.2_-5_5_15_0_65,IOSine'),    // Gentle start
      wp(1, 8, 'q_0_1.8_-3_0_0_0_55,IOQuad'),      // Slow push in
      wp(2, 14, 'dpos_2_2_-2_50,IOCubic'),         // Smooth arc
      wp(3, 20, 'q_3_1.5_1_-5_-45_0_55,IOSine'),   // Graceful pan
      wp(4, 26, 'dpos_0_2.5_2_45,IOQuad'),         // Rise behind
      wp(5, 32, 'q_-2_1.5_-4_5_20_0_60,stop')      // Settle front-left
    ],
    totalDuration: 8000,
    coordinateSystem: 'left-handed'
  },
  
  // ============================================
  // 20. Easing Sampler (All Categories)
  // Demonstrates: one example from each easing family
  // Educational preset showing easing variety
  // 12 waypoints = 12 bookmarks, 44 beats total
  // ============================================
  {
    id: 'preset-easing-sampler',
    name: 'Easing Sampler (All Types)',
    beatDuration: 44,
    waypoints: [
      wp(0, 0, 'dpos_0_1.5_-5_60,Linear'),         // Linear (no easing)
      wp(1, 4, 'dpos_3_1.5_-3_60,IOSine'),         // Sine (smooth wave)
      wp(2, 8, 'dpos_4_2_0_55,IOQuad'),            // Quad (gentle curve)
      wp(3, 12, 'dpos_3_2_3_50,IOCubic'),          // Cubic (medium curve)
      wp(4, 16, 'dpos_0_2.5_4_45,IOQuart'),        // Quart (strong curve)
      wp(5, 20, 'dpos_-3_2_3_50,IOQuint'),         // Quint (very strong)
      wp(6, 24, 'dpos_-4_1.5_0_55,IOExpo'),        // Expo (extreme)
      wp(7, 28, 'dpos_-3_1_-3_60,IOCirc'),         // Circ (circular)
      wp(8, 32, 'dpos_0_1.5_-4_60,IOBack'),        // Back (overshoot)
      wp(9, 36, 'dpos_2_2_-3_55,IOElastic'),       // Elastic (spring)
      wp(10, 40, 'dpos_3_1.5_-2_60,IOBounce'),     // Bounce (bouncy)
      wp(11, 44, 'dpos_0_1.5_-5_60,stop')          // End
    ],
    totalDuration: 11000,
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
