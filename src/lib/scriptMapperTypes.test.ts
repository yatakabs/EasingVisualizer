/**
 * Tests for ScriptMapper Types
 */
import { describe, it, expect } from 'vitest'
import {
  validateCameraPath,
  generateSegmentsFromWaypoints,
  computeSegmentsFromWaypoints,
  extractEasingFromBookmarkCommand,
  parsePositionCommand,
  calculateLookAtRotation,
  createWaypoint,
  createSegment,
  type CameraPath
} from './scriptMapperTypes'

describe('validateCameraPath', () => {
  it('returns empty array for valid path', () => {
    const validPath: CameraPath = {
      id: 'test',
      name: 'Test Path',
      waypoints: [
        { id: 'wp-0', position: { x: 0, y: 1, z: -5 }, time: 0, name: 'Start' },
        { id: 'wp-1', position: { x: 0, y: 1, z: 5 }, time: 1, name: 'End' }
      ],
      segments: [
        {
          id: 'seg-0',
          fromWaypointId: 'wp-0',
          toWaypointId: 'wp-1',
          easingEnabled: true,
          functionId: 'quadratic',
          easeType: 'easeboth',
          duration: 1.0
        }
      ],
      totalDuration: 2000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(validPath)
    expect(errors).toHaveLength(0)
  })
  
  it('detects missing waypoints', () => {
    const path: CameraPath = {
      id: 'test',
      name: 'Test',
      waypoints: [{ id: 'wp-0', position: { x: 0, y: 1, z: 0 }, time: 0 }],
      segments: [],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(path)
    expect(errors).toContain('Path must have at least 2 waypoints')
  })
  
  it('detects first waypoint not at time 0', () => {
    const path: CameraPath = {
      id: 'test',
      name: 'Test',
      waypoints: [
        { id: 'wp-0', position: { x: 0, y: 1, z: 0 }, time: 0.1 },
        { id: 'wp-1', position: { x: 0, y: 1, z: 5 }, time: 1 }
      ],
      segments: [
        { id: 'seg-0', fromWaypointId: 'wp-0', toWaypointId: 'wp-1', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 }
      ],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(path)
    expect(errors.some(e => e.includes('First waypoint must be at time 0'))).toBe(true)
  })
  
  it('detects last waypoint not at time 1', () => {
    const path: CameraPath = {
      id: 'test',
      name: 'Test',
      waypoints: [
        { id: 'wp-0', position: { x: 0, y: 1, z: 0 }, time: 0 },
        { id: 'wp-1', position: { x: 0, y: 1, z: 5 }, time: 0.9 }
      ],
      segments: [
        { id: 'seg-0', fromWaypointId: 'wp-0', toWaypointId: 'wp-1', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 }
      ],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(path)
    expect(errors.some(e => e.includes('Last waypoint must be at time 1'))).toBe(true)
  })
  
  it('detects non-increasing waypoint times', () => {
    const path: CameraPath = {
      id: 'test',
      name: 'Test',
      waypoints: [
        { id: 'wp-0', position: { x: 0, y: 1, z: 0 }, time: 0 },
        { id: 'wp-1', position: { x: 1, y: 1, z: 0 }, time: 0.6 },
        { id: 'wp-2', position: { x: 2, y: 1, z: 0 }, time: 0.4 }, // Out of order
        { id: 'wp-3', position: { x: 3, y: 1, z: 0 }, time: 1 }
      ],
      segments: [
        { id: 'seg-0', fromWaypointId: 'wp-0', toWaypointId: 'wp-1', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 },
        { id: 'seg-1', fromWaypointId: 'wp-1', toWaypointId: 'wp-2', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 },
        { id: 'seg-2', fromWaypointId: 'wp-2', toWaypointId: 'wp-3', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 }
      ],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(path)
    expect(errors.some(e => e.includes('must be > previous time'))).toBe(true)
  })
  
  it('detects invalid segment waypoint references', () => {
    const path: CameraPath = {
      id: 'test',
      name: 'Test',
      waypoints: [
        { id: 'wp-0', position: { x: 0, y: 1, z: 0 }, time: 0 },
        { id: 'wp-1', position: { x: 0, y: 1, z: 5 }, time: 1 }
      ],
      segments: [
        { id: 'seg-0', fromWaypointId: 'wp-0', toWaypointId: 'wp-invalid', easingEnabled: true, functionId: 'linear', easeType: 'easein', duration: 1.0 }
      ],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const errors = validateCameraPath(path)
    expect(errors.some(e => e.includes('invalid toWaypointId'))).toBe(true)
  })
})

describe('generateSegmentsFromWaypoints', () => {
  it('returns empty array for less than 2 waypoints', () => {
    const segments = generateSegmentsFromWaypoints([
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0 }
    ])
    expect(segments).toHaveLength(0)
  })
  
  it('generates N-1 segments for N waypoints', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0 },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 0.5 },
      { id: 'wp-2', position: { x: 2, y: 0, z: 0 }, time: 1 }
    ]
    
    const segments = generateSegmentsFromWaypoints(waypoints)
    expect(segments).toHaveLength(2)
    expect(segments[0].fromWaypointId).toBe('wp-0')
    expect(segments[0].toWaypointId).toBe('wp-1')
    expect(segments[1].fromWaypointId).toBe('wp-1')
    expect(segments[1].toWaypointId).toBe('wp-2')
  })
  
  it('creates segments with default easing (InOutQuad)', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0 },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1 }
    ]
    
    const segments = generateSegmentsFromWaypoints(waypoints)
    expect(segments[0].easingEnabled).toBe(true)
    expect(segments[0].functionId).toBe('quadratic')
    expect(segments[0].easeType).toBe('easeboth')
  })
})

describe('createWaypoint', () => {
  it('creates waypoint with clamped time', () => {
    const wp1 = createWaypoint(-0.5)
    expect(wp1.time).toBe(0)
    
    const wp2 = createWaypoint(1.5)
    expect(wp2.time).toBe(1)
    
    const wp3 = createWaypoint(0.5)
    expect(wp3.time).toBe(0.5)
  })
  
  it('creates waypoint with default position', () => {
    const wp = createWaypoint(0.5)
    expect(wp.position).toEqual({ x: 0, y: 1, z: 0 })
  })
  
  it('creates waypoint with custom position and name', () => {
    const wp = createWaypoint(0.5, { x: 1, y: 2, z: 3 }, 'Test')
    expect(wp.position).toEqual({ x: 1, y: 2, z: 3 })
    expect(wp.name).toBe('Test')
  })
})

describe('createSegment', () => {
  it('creates segment with default easing', () => {
    const seg = createSegment('wp-0', 'wp-1')
    expect(seg.fromWaypointId).toBe('wp-0')
    expect(seg.toWaypointId).toBe('wp-1')
    expect(seg.easingEnabled).toBe(true)
    expect(seg.functionId).toBe('quadratic')
    expect(seg.easeType).toBe('easeboth')
    expect(seg.duration).toBe(1.0)
  })
  
  it('creates segment with custom easing', () => {
    const seg = createSegment('wp-0', 'wp-1', false, 'sine', 'easein')
    expect(seg.easingEnabled).toBe(false)
    expect(seg.functionId).toBe('sine')
    expect(seg.easeType).toBe('easein')
  })
})

describe('extractEasingFromBookmarkCommand', () => {
  it('returns null for undefined/empty input', () => {
    expect(extractEasingFromBookmarkCommand(undefined)).toBeNull()
    expect(extractEasingFromBookmarkCommand('')).toBeNull()
  })
  
  it('extracts IOSine (InOutSine) easing', () => {
    const result = extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,IOSine')
    expect(result).not.toBeNull()
    expect(result?.functionId).toBe('sine')
    expect(result?.easeType).toBe('easeboth')
    expect(result?.easingEnabled).toBe(true)
    expect(result?.rawCommand).toBe('IOSine')
  })
  
  it('extracts ISine (InSine) easing - slow start', () => {
    const result = extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,ISine')
    expect(result).not.toBeNull()
    expect(result?.functionId).toBe('sine')
    expect(result?.easeType).toBe('easein')   // ScriptMapper In → internal easein
    expect(result?.easingEnabled).toBe(true)
  })
  
  it('extracts OSine (OutSine) easing - slow end', () => {
    const result = extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,OSine')
    expect(result).not.toBeNull()
    expect(result?.functionId).toBe('sine')
    expect(result?.easeType).toBe('easeout')  // ScriptMapper Out → internal easeout
    expect(result?.easingEnabled).toBe(true)
  })
  
  it('extracts Drift (ease_x_y) format', () => {
    const result = extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,ease_6_6')
    expect(result).not.toBeNull()
    expect(result?.functionId).toBe('drift')
    expect(result?.easingEnabled).toBe(true)
    expect(result?.driftParams).toEqual({ x: 6, y: 6 })
    expect(result?.rawCommand).toBe('ease_6_6')
  })
  
  it('ignores non-easing commands', () => {
    expect(extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,stop')).toBeNull()
    expect(extractEasingFromBookmarkCommand('q_0_1_-5_0_0_0_60,next')).toBeNull()
    expect(extractEasingFromBookmarkCommand('spin45')).toBeNull()
    expect(extractEasingFromBookmarkCommand('->q_0_1_5_0_0_0_60')).toBeNull()
  })
  
  it('extracts easing from command with spin prefix', () => {
    const result = extractEasingFromBookmarkCommand('spin45,IOCubic')
    expect(result).not.toBeNull()
    expect(result?.functionId).toBe('cubic')
    expect(result?.easeType).toBe('easeboth')
  })
  
  it('extracts various easing functions', () => {
    const cases = [
      { input: 'q,IOQuad', expected: { functionId: 'quadratic', easeType: 'easeboth' } },
      { input: 'q,IOCubic', expected: { functionId: 'cubic', easeType: 'easeboth' } },
      { input: 'q,IOQuart', expected: { functionId: 'quartic', easeType: 'easeboth' } },
      { input: 'q,IOQuint', expected: { functionId: 'quintic', easeType: 'easeboth' } },
      { input: 'q,IOExpo', expected: { functionId: 'exponential', easeType: 'easeboth' } },
      { input: 'q,IOCirc', expected: { functionId: 'circular', easeType: 'easeboth' } },
      { input: 'q,IOBack', expected: { functionId: 'back', easeType: 'easeboth' } },
      { input: 'q,IOElastic', expected: { functionId: 'elastic', easeType: 'easeboth' } },
      { input: 'q,IOBounce', expected: { functionId: 'bounce', easeType: 'easeboth' } },
    ]
    
    for (const { input, expected } of cases) {
      const result = extractEasingFromBookmarkCommand(input)
      expect(result?.functionId).toBe(expected.functionId)
      expect(result?.easeType).toBe(expected.easeType)
    }
  })
})

describe('computeSegmentsFromWaypoints', () => {
  it('returns empty array for less than 2 waypoints', () => {
    const segments = computeSegmentsFromWaypoints([
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0 }
    ])
    expect(segments).toHaveLength(0)
  })
  
  it('generates N-1 segments for N waypoints with correct duration', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, bookmarkCommand: 'q,IOSine' },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 0.5, bookmarkCommand: 'q,IOQuad' },
      { id: 'wp-2', position: { x: 2, y: 0, z: 0 }, time: 1, bookmarkCommand: 'q,stop' }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints)
    expect(segments).toHaveLength(2)
    expect(segments[0].fromWaypointId).toBe('wp-0')
    expect(segments[0].toWaypointId).toBe('wp-1')
    expect(segments[0].duration).toBe(0.5)
    expect(segments[1].fromWaypointId).toBe('wp-1')
    expect(segments[1].toWaypointId).toBe('wp-2')
    expect(segments[1].duration).toBe(0.5)
  })
  
  it('extracts easing from waypoint bookmarkCommand', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, bookmarkCommand: 'q_0_1_-5_0_0_0_60,IOSine' },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1, bookmarkCommand: 'q_0_1_5_0_0_0_60,stop' }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints)
    expect(segments[0].easingEnabled).toBe(true)
    expect(segments[0].functionId).toBe('sine')
    expect(segments[0].easeType).toBe('easeboth')
    expect(segments[0].rawCommand).toBe('IOSine')
  })
  
  it('handles waypoints without bookmarkCommand (no easing)', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, bookmarkCommand: 'q_0_1_-5_0_0_0_60' },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1, bookmarkCommand: 'q_0_1_5_0_0_0_60,stop' }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints)
    expect(segments[0].easingEnabled).toBe(false)
    expect(segments[0].functionId).toBe('linear')
  })
  
  it('preserves bookmarkCommands in segment', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, bookmarkCommand: 'q_0_1_-5_0_0_0_60,IOSine' },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1, bookmarkCommand: 'q_0_1_5_0_0_0_60,stop' }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints)
    expect(segments[0].bookmarkCommands).toBe('q_0_1_-5_0_0_0_60,IOSine')
  })
  
  it('uses custom idPrefix', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0 },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1 }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints, 'preset-seg')
    expect(segments[0].id).toBe('preset-seg-0')
  })
  
  it('extracts Drift parameters', () => {
    const waypoints = [
      { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, bookmarkCommand: 'q,ease_3_7' },
      { id: 'wp-1', position: { x: 1, y: 0, z: 0 }, time: 1, bookmarkCommand: 'q,stop' }
    ]
    
    const segments = computeSegmentsFromWaypoints(waypoints)
    expect(segments[0].easingEnabled).toBe(true)
    expect(segments[0].functionId).toBe('drift')
    expect(segments[0].driftParams).toEqual({ x: 3, y: 7 })
  })
})

describe('parsePositionCommand', () => {
  it('parses q_ command format with position and rotation', () => {
    const result = parsePositionCommand('q_0_1_-5_0_0_0_60,IOSine')
    expect(result).toEqual({ 
      x: 0, 
      y: 1, 
      z: -5,
      rotation: { rx: 0, ry: 0, rz: 0 }
    })
  })
  
  it('parses q_ command with negative values and rotation', () => {
    const result = parsePositionCommand('q_-3.5_2.1_-10_0_0_0_60')
    expect(result).toEqual({ 
      x: -3.5, 
      y: 2.1, 
      z: -10,
      rotation: { rx: 0, ry: 0, rz: 0 }
    })
  })
  
  it('parses q_ command with non-zero rotation values', () => {
    const result = parsePositionCommand('q_0_1.5_-3_45_30_0_70')
    expect(result).toEqual({
      x: 0,
      y: 1.5,
      z: -3,
      rotation: { rx: 45, ry: 30, rz: 0 }
    })
  })
  
  it('parses q_ command with full format including duration and easing', () => {
    const result = parsePositionCommand('q_0_1.5_-3_45_30_0_70_2_easeOutCubic')
    expect(result).toEqual({
      x: 0,
      y: 1.5,
      z: -3,
      rotation: { rx: 45, ry: 30, rz: 0 }
    })
  })
  
  it('parses q_ command with negative rotation values', () => {
    const result = parsePositionCommand('q_1_2_3_-15_-30_-45_60')
    expect(result).toEqual({
      x: 1,
      y: 2,
      z: 3,
      rotation: { rx: -15, ry: -30, rz: -45 }
    })
  })
  
  it('parses q_ command with only position (no rotation)', () => {
    // Edge case: q_ with only 3 position values (missing rotation)
    const result = parsePositionCommand('q_1_2_3')
    expect(result).toEqual({ x: 1, y: 2, z: 3 })
    expect(result?.rotation).toBeUndefined()
  })
  
  it('parses dpos_ command format', () => {
    const result = parsePositionCommand('dpos_5_3_-2_60')
    expect(result?.x).toBe(5)
    expect(result?.y).toBe(3)
    expect(result?.z).toBe(-2)
    // dpos auto-calculates look-at rotation toward avatar (0, 1, 0)
    expect(result?.rotation).toBeDefined()
    expect(result?.rotation?.rz).toBe(0) // no roll
  })
  
  it('parses dpos_ command with decimal values', () => {
    const result = parsePositionCommand('dpos_1.5_0.5_-0.75_45')
    expect(result?.x).toBe(1.5)
    expect(result?.y).toBe(0.5)
    expect(result?.z).toBe(-0.75)
    // dpos auto-calculates look-at rotation toward avatar (0, 1, 0)
    expect(result?.rotation).toBeDefined()
    expect(result?.rotation?.rz).toBe(0) // no roll
  })
  
  it('returns null for spin commands', () => {
    const result = parsePositionCommand('spin45,IOCubic')
    expect(result).toBeNull()
  })
  
  it('returns null for stop command', () => {
    const result = parsePositionCommand('stop')
    expect(result).toBeNull()
  })
  
  it('returns null for next command', () => {
    const result = parsePositionCommand('next')
    expect(result).toBeNull()
  })
  
  it('returns null for easing-only commands', () => {
    const result = parsePositionCommand('IOSine')
    expect(result).toBeNull()
  })
})

describe('calculateLookAtRotation', () => {
  it('calculates rotation to look at default target (avatar head at y=1.5)', () => {
    // Camera behind avatar at head height, should look forward (no rotation)
    const result = calculateLookAtRotation({ x: 0, y: 1.5, z: -5 })
    expect(result.rx).toBeCloseTo(0)
    expect(result.ry).toBeCloseTo(0)
    expect(result.rz).toBe(0)
  })

  it('calculates yaw for camera positioned to the side', () => {
    // Camera to the right of avatar at head height, should look left (negative yaw)
    const result = calculateLookAtRotation({ x: 5, y: 1.5, z: 0 })
    expect(result.ry).toBeCloseTo(-90) // Looking left toward center
    expect(result.rx).toBeCloseTo(0)   // No pitch needed
    expect(result.rz).toBe(0)
  })

  it('calculates pitch for camera above target', () => {
    // Camera directly above avatar head, looking straight down
    const result = calculateLookAtRotation({ x: 0, y: 6.5, z: 0 })
    expect(result.rx).toBeCloseTo(90)  // Looking down
    expect(result.rz).toBe(0)
  })

  it('calculates pitch for camera below target', () => {
    // Camera below avatar head, looking up
    const result = calculateLookAtRotation({ x: 0, y: -3.5, z: -5 })
    expect(result.rx).toBeCloseTo(-45) // Looking up
    expect(result.ry).toBeCloseTo(0)
  })

  it('supports custom target point', () => {
    // Camera at origin, look at point (5, 0, 0) which is to the right
    const result = calculateLookAtRotation(
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 }
    )
    expect(result.ry).toBeCloseTo(90) // Looking right (positive x direction)
    expect(result.rx).toBeCloseTo(0)
  })

  it('handles diagonal positions correctly', () => {
    // Camera at 45 degree angle, should have both yaw and pitch
    const result = calculateLookAtRotation({ x: 5, y: 3, z: -5 })
    expect(result.ry).not.toBe(0)  // Has yaw
    expect(result.rx).not.toBe(0)  // Has pitch
    expect(result.rz).toBe(0)      // Never has roll
  })
})
