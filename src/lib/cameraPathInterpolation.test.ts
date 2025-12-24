/**
 * Tests for Camera Path Interpolation
 */
import { describe, it, expect } from 'vitest'
import {
  findSegmentAtTime,
  interpolateCameraPath,
  generatePathPreviewPoints,
  getSegmentBoundaries,
  calculateSegmentOutput,
  generateGraphPoints,
  calculatePathLength
} from './cameraPathInterpolation'
import type { CameraPath } from './scriptMapperTypes'

// Test fixture: Simple 2-point path
const simplePath: CameraPath = {
  id: 'test-simple',
  name: 'Simple',
  waypoints: [
    { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, name: 'Start' },
    { id: 'wp-1', position: { x: 10, y: 10, z: 10 }, time: 1, name: 'End' }
  ],
  segments: [
    {
      id: 'seg-0',
      fromWaypointId: 'wp-0',
      toWaypointId: 'wp-1',
      easingEnabled: false, // Linear for predictable testing
      functionId: 'linear',
      easeType: 'easein',
      duration: 1.0
    }
  ],
  totalDuration: 2000,
  coordinateSystem: 'left-handed'
}

// Test fixture: 3-point path with equal segments
const threepointPath: CameraPath = {
  id: 'test-3point',
  name: '3-Point',
  waypoints: [
    { id: 'wp-0', position: { x: 0, y: 0, z: 0 }, time: 0, name: 'Start' },
    { id: 'wp-1', position: { x: 5, y: 5, z: 5 }, time: 0.5, name: 'Middle' },
    { id: 'wp-2', position: { x: 10, y: 0, z: 10 }, time: 1, name: 'End' }
  ],
  segments: [
    {
      id: 'seg-0',
      fromWaypointId: 'wp-0',
      toWaypointId: 'wp-1',
      easingEnabled: false,
      functionId: 'linear',
      easeType: 'easein',
      duration: 1.0
    },
    {
      id: 'seg-1',
      fromWaypointId: 'wp-1',
      toWaypointId: 'wp-2',
      easingEnabled: false,
      functionId: 'linear',
      easeType: 'easein',
      duration: 1.0
    }
  ],
  totalDuration: 3000,
  coordinateSystem: 'left-handed'
}

describe('findSegmentAtTime', () => {
  it('returns segment 0 at time 0', () => {
    const result = findSegmentAtTime(threepointPath, 0)
    expect(result.segmentIndex).toBe(0)
    expect(result.localTime).toBe(0)
  })
  
  it('returns last segment at time 1', () => {
    const result = findSegmentAtTime(threepointPath, 1)
    expect(result.segmentIndex).toBe(1)
    expect(result.localTime).toBe(1)
  })
  
  it('correctly identifies segment for time in middle of path', () => {
    // At t=0.25, we're in segment 0 (time 0 to 0.5), local time = 0.5
    const result1 = findSegmentAtTime(threepointPath, 0.25)
    expect(result1.segmentIndex).toBe(0)
    expect(result1.localTime).toBeCloseTo(0.5, 5)
    
    // At t=0.75, we're in segment 1 (time 0.5 to 1), local time = 0.5
    const result2 = findSegmentAtTime(threepointPath, 0.75)
    expect(result2.segmentIndex).toBe(1)
    expect(result2.localTime).toBeCloseTo(0.5, 5)
  })
  
  it('handles segment boundary correctly', () => {
    // At t=0.5, we're at the boundary - should be in segment 0 with local time 1
    // or segment 1 with local time 0
    const result = findSegmentAtTime(threepointPath, 0.5)
    expect(result.segmentIndex).toBe(0)
    expect(result.localTime).toBeCloseTo(1, 5)
  })
})

describe('interpolateCameraPath', () => {
  it('returns first waypoint position at t=0', () => {
    const result = interpolateCameraPath(simplePath, 0)
    expect(result.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(result.currentSegmentIndex).toBe(0)
    expect(result.segmentLocalTime).toBe(0)
    expect(result.globalTime).toBe(0)
  })
  
  it('returns last waypoint position at t=1', () => {
    const result = interpolateCameraPath(simplePath, 1)
    expect(result.position).toEqual({ x: 10, y: 10, z: 10 })
    expect(result.segmentLocalTime).toBe(1)
    expect(result.globalTime).toBe(1)
  })
  
  it('interpolates linearly for disabled easing', () => {
    const result = interpolateCameraPath(simplePath, 0.5)
    expect(result.position.x).toBeCloseTo(5, 5)
    expect(result.position.y).toBeCloseTo(5, 5)
    expect(result.position.z).toBeCloseTo(5, 5)
  })
  
  it('clamps time values outside [0, 1]', () => {
    const resultNegative = interpolateCameraPath(simplePath, -0.5)
    expect(resultNegative.globalTime).toBe(0)
    expect(resultNegative.position).toEqual({ x: 0, y: 0, z: 0 })
    
    const resultOver = interpolateCameraPath(simplePath, 1.5)
    expect(resultOver.globalTime).toBe(1)
    expect(resultOver.position).toEqual({ x: 10, y: 10, z: 10 })
  })
  
  it('correctly interpolates multi-segment path', () => {
    // At t=0.25, first segment halfway
    const result1 = interpolateCameraPath(threepointPath, 0.25)
    expect(result1.position.x).toBeCloseTo(2.5, 5)
    expect(result1.currentSegmentIndex).toBe(0)
    
    // At t=0.5, exactly at middle waypoint
    const result2 = interpolateCameraPath(threepointPath, 0.5)
    expect(result2.position.x).toBeCloseTo(5, 5)
    
    // At t=0.75, second segment halfway
    const result3 = interpolateCameraPath(threepointPath, 0.75)
    expect(result3.position.x).toBeCloseTo(7.5, 5)
    expect(result3.currentSegmentIndex).toBe(1)
  })
  
  it('applies easing when enabled', () => {
    const pathWithEasing: CameraPath = {
      ...simplePath,
      segments: [{
        ...simplePath.segments[0],
        easingEnabled: true,
        functionId: 'quadratic',
        easeType: 'easein'
      }]
    }
    
    // With easein quadratic, t=0.5 should give 0.25 (0.5^2)
    const result = interpolateCameraPath(pathWithEasing, 0.5)
    expect(result.position.x).toBeCloseTo(2.5, 5) // 10 * 0.25 = 2.5
    expect(result.position.y).toBeCloseTo(2.5, 5)
    expect(result.position.z).toBeCloseTo(2.5, 5)
  })
})

describe('generatePathPreviewPoints', () => {
  it('generates correct number of points', () => {
    const points = generatePathPreviewPoints(simplePath, 10)
    expect(points).toHaveLength(11) // 10 steps + 1 (0 to 10 inclusive)
  })
  
  it('first and last points match waypoints', () => {
    const points = generatePathPreviewPoints(simplePath, 10)
    expect(points[0]).toEqual({ x: 0, y: 0, z: 0 })
    expect(points[10]).toEqual({ x: 10, y: 10, z: 10 })
  })
  
  it('handles single waypoint path', () => {
    const singleWaypoint: CameraPath = {
      id: 'single',
      name: 'Single',
      waypoints: [{ id: 'wp-0', position: { x: 1, y: 2, z: 3 }, time: 0 }],
      segments: [],
      totalDuration: 1000,
      coordinateSystem: 'left-handed'
    }
    
    const points = generatePathPreviewPoints(singleWaypoint, 10)
    expect(points).toHaveLength(1)
    expect(points[0]).toEqual({ x: 1, y: 2, z: 3 })
  })
})

describe('getSegmentBoundaries', () => {
  it('returns waypoint times', () => {
    const boundaries = getSegmentBoundaries(threepointPath)
    expect(boundaries).toEqual([0, 0.5, 1])
  })
})

describe('calculateSegmentOutput', () => {
  const linearSegment = simplePath.segments[0]
  
  it('returns linear output when easing disabled', () => {
    expect(calculateSegmentOutput(linearSegment, 0)).toBe(0)
    expect(calculateSegmentOutput(linearSegment, 0.5)).toBe(0.5)
    expect(calculateSegmentOutput(linearSegment, 1)).toBe(1)
  })
  
  it('clamps input to [0, 1]', () => {
    expect(calculateSegmentOutput(linearSegment, -0.5)).toBe(0)
    expect(calculateSegmentOutput(linearSegment, 1.5)).toBe(1)
  })
  
  it('applies easing when enabled', () => {
    const easedSegment = {
      ...linearSegment,
      easingEnabled: true,
      functionId: 'quadratic',
      easeType: 'easein' as const
    }
    
    // Quadratic easein: t^2
    expect(calculateSegmentOutput(easedSegment, 0.5)).toBeCloseTo(0.25, 5)
  })
})

describe('generateGraphPoints', () => {
  it('generates points for all segments', () => {
    const points = generateGraphPoints(threepointPath, 10)
    
    // Should have points for both segments
    const segment0Points = points.filter(p => p.segmentIndex === 0)
    const segment1Points = points.filter(p => p.segmentIndex === 1)
    
    expect(segment0Points.length).toBeGreaterThan(0)
    expect(segment1Points.length).toBeGreaterThan(0)
  })
  
  it('generates correct number of points per segment', () => {
    const points = generateGraphPoints(threepointPath, 10)
    
    // Each segment should have 11 points (0 to 10 inclusive)
    const segment0Points = points.filter(p => p.segmentIndex === 0)
    expect(segment0Points).toHaveLength(11)
  })
})

describe('calculatePathLength', () => {
  it('calculates correct length for simple path', () => {
    // From (0,0,0) to (10,10,10): sqrt(100+100+100) = sqrt(300) ≈ 17.32
    const length = calculatePathLength(simplePath)
    expect(length).toBeCloseTo(Math.sqrt(300), 5)
  })
  
  it('sums lengths of all segments', () => {
    // 3-point path: (0,0,0) → (5,5,5) → (10,0,10)
    // Segment 1: sqrt(25+25+25) = sqrt(75) ≈ 8.66
    // Segment 2: sqrt(25+25+25) = sqrt(75) ≈ 8.66
    // Total ≈ 17.32
    const length = calculatePathLength(threepointPath)
    expect(length).toBeCloseTo(2 * Math.sqrt(75), 5)
  })
})
