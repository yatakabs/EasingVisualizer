/**
 * Tests for ScriptMapper Bookmark Export/Import
 */

import { describe, it, expect } from 'vitest'
import {
  TIME_EPSILON,
  timesAreEqual,
  timeIsLessThan,
  timeIsLessOrEqual,
  roundTime,
  findWaypointAtTime,
  validatePointOrdering,
  validateEventCount,
  validateEventContinuity,
  validateSegmentBookmarkCorrespondence,
  exportToBookmarkJSON,
  importFromBookmarkJSON,
  validateBookmarkStructure,
  formatBookmarkJSON,
  type CustomEvent,
  type ScriptMapperBookmark
} from './scriptMapperBookmark'
import { createWaypoint } from './scriptMapperTypes'

describe('Time comparison utilities', () => {
  describe('TIME_EPSILON constant', () => {
    it('is 1e-6 (1 microsecond)', () => {
      expect(TIME_EPSILON).toBe(1e-6)
    })
  })
  
  describe('timesAreEqual', () => {
    it('returns true for identical values', () => {
      expect(timesAreEqual(0.5, 0.5)).toBe(true)
    })
    
    it('returns true for values within epsilon', () => {
      expect(timesAreEqual(0.5, 0.5 + 1e-7)).toBe(true)
      expect(timesAreEqual(0.5, 0.5 - 1e-7)).toBe(true)
    })
    
    it('returns false for values outside epsilon', () => {
      expect(timesAreEqual(0.5, 0.5 + 1e-5)).toBe(false)
    })
    
    it('handles values near zero', () => {
      expect(timesAreEqual(0, 1e-7)).toBe(true)
      expect(timesAreEqual(0, 1e-5)).toBe(false)
    })
  })
  
  describe('timeIsLessThan', () => {
    it('returns true when a < b - epsilon', () => {
      expect(timeIsLessThan(0.5, 0.6)).toBe(true)
    })
    
    it('returns false when values are within epsilon', () => {
      expect(timeIsLessThan(0.5, 0.5 + 1e-7)).toBe(false)
    })
  })
  
  describe('timeIsLessOrEqual', () => {
    it('returns true when a <= b + epsilon', () => {
      expect(timeIsLessOrEqual(0.5, 0.5)).toBe(true)
      expect(timeIsLessOrEqual(0.5, 0.6)).toBe(true)
    })
    
    it('returns false when a > b + epsilon', () => {
      expect(timeIsLessOrEqual(0.6, 0.5)).toBe(false)
    })
  })
  
  describe('roundTime', () => {
    it('rounds to 6 decimal places', () => {
      expect(roundTime(0.1234567890)).toBe(0.123457)
    })
    
    it('handles edge case values', () => {
      expect(roundTime(0)).toBe(0)
      expect(roundTime(1)).toBe(1)
      expect(roundTime(0.999999999)).toBe(1)
    })
  })
})

describe('Float precision edge cases', () => {
  it('handles 0.1 + 0.2 floating point precision issue', () => {
    // Classic float precision problem: 0.1 + 0.2 = 0.30000000000000004
    const result = 0.1 + 0.2
    expect(timesAreEqual(result, 0.3)).toBe(true)
  })
  
  it('roundtrip preserves precision for problematic fractions', () => {
    const problematicValues = [0.1, 0.2, 0.3, 1/3, 1/6, 1/7]
    for (const val of problematicValues) {
      const exported = roundTime(val)
      expect(timesAreEqual(exported, val)).toBe(true)
    }
  })
  
  it('handles very small time differences', () => {
    const base = 0.5
    const almostSame = base + 1e-10
    expect(timesAreEqual(base, almostSame)).toBe(true)
  })
})

describe('Boundary conditions', () => {
  describe('time = 0', () => {
    it('findWaypointAtTime finds waypoint at t=0', () => {
      const waypoints = [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        createWaypoint(1, { x: 1, y: 1, z: 1 })
      ]
      expect(findWaypointAtTime(waypoints, 0, 1)).toBe(0)
    })
    
    it('validatePointOrdering accepts time = 0 for first waypoint', () => {
      const waypoints = [createWaypoint(0, { x: 0, y: 0, z: 0 })]
      expect(validatePointOrdering(waypoints)).toEqual([])
    })
  })
  
  describe('time = 1', () => {
    it('findWaypointAtTime finds waypoint at t=1', () => {
      const waypoints = [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        createWaypoint(1, { x: 1, y: 1, z: 1 })
      ]
      expect(findWaypointAtTime(waypoints, 1, 1)).toBe(1)
    })
    
    it('validatePointOrdering accepts time = 1 for last waypoint', () => {
      const waypoints = [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        createWaypoint(1, { x: 1, y: 1, z: 1 })
      ]
      expect(validatePointOrdering(waypoints)).toEqual([])
    })
  })
  
  describe('negative times', () => {
    it('validatePointOrdering rejects negative first waypoint time', () => {
      const waypoints = [
        { ...createWaypoint(0, { x: 0, y: 0, z: 0 }), time: -0.1 },
        createWaypoint(1, { x: 1, y: 1, z: 1 })
      ]
      const errors = validatePointOrdering(waypoints)
      expect(errors.some(e => e.includes('negative'))).toBe(true)
    })
  })
  
  describe('time > 1', () => {
    it('validatePointOrdering rejects last waypoint time > 1', () => {
      const waypoints = [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        { ...createWaypoint(1, { x: 1, y: 1, z: 1 }), time: 1.5 }
      ]
      const errors = validatePointOrdering(waypoints)
      expect(errors.some(e => e.includes('exceeds'))).toBe(true)
    })
  })
})

describe('findWaypointAtTime', () => {
  it('finds waypoint using binary search', () => {
    const waypoints = [
      createWaypoint(0, { x: 0, y: 0, z: 0 }),
      createWaypoint(0.25, { x: 1, y: 0, z: 0 }),
      createWaypoint(0.5, { x: 2, y: 0, z: 0 }),
      createWaypoint(0.75, { x: 3, y: 0, z: 0 }),
      createWaypoint(1, { x: 4, y: 0, z: 0 })
    ]
    
    expect(findWaypointAtTime(waypoints, 0, 1)).toBe(0)
    expect(findWaypointAtTime(waypoints, 0.25, 1)).toBe(1)
    expect(findWaypointAtTime(waypoints, 0.5, 1)).toBe(2)
    expect(findWaypointAtTime(waypoints, 0.75, 1)).toBe(3)
    expect(findWaypointAtTime(waypoints, 1, 1)).toBe(4)
  })
  
  it('returns -1 for non-matching time', () => {
    const waypoints = [
      createWaypoint(0, { x: 0, y: 0, z: 0 }),
      createWaypoint(1, { x: 1, y: 1, z: 1 })
    ]
    
    expect(findWaypointAtTime(waypoints, 0.5, 1)).toBe(-1)
  })
  
  it('handles epsilon tolerance for near-matches', () => {
    const waypoints = [
      createWaypoint(0, { x: 0, y: 0, z: 0 }),
      createWaypoint(0.5, { x: 1, y: 0, z: 0 }),
      createWaypoint(1, { x: 2, y: 0, z: 0 })
    ]
    
    // Should match 0.5 within epsilon
    expect(findWaypointAtTime(waypoints, 0.5 + 1e-7, 1)).toBe(1)
    expect(findWaypointAtTime(waypoints, 0.5 - 1e-7, 1)).toBe(1)
  })
})

describe('validateEventCount', () => {
  it('accepts N-1 events for N waypoints', () => {
    const waypoints = [
      createWaypoint(0, { x: 0, y: 0, z: 0 }),
      createWaypoint(0.5, { x: 1, y: 0, z: 0 }),
      createWaypoint(1, { x: 2, y: 0, z: 0 })
    ]
    
    const events: CustomEvent[] = [
      { _time: 0, _type: 'AssignPathAnimation', _data: { _duration: 0.5 } },
      { _time: 0.5, _type: 'AssignPathAnimation', _data: { _duration: 0.5 } }
    ]
    
    expect(validateEventCount(waypoints, events)).toEqual([])
  })
  
  it('rejects incorrect event count', () => {
    const waypoints = [
      createWaypoint(0, { x: 0, y: 0, z: 0 }),
      createWaypoint(1, { x: 1, y: 1, z: 1 })
    ]
    
    const events: CustomEvent[] = []
    
    const errors = validateEventCount(waypoints, events)
    expect(errors.some(e => e.includes('mismatch'))).toBe(true)
  })
})

describe('validateEventContinuity', () => {
  it('accepts consecutive events with no gaps', () => {
    const events: CustomEvent[] = [
      { _time: 0, _type: 'AssignPathAnimation', _data: { _duration: 0.5 } },
      { _time: 0.5, _type: 'AssignPathAnimation', _data: { _duration: 0.5 } }
    ]
    
    expect(validateEventContinuity(events)).toEqual([])
  })
  
  it('detects gaps between events', () => {
    const events: CustomEvent[] = [
      { _time: 0, _type: 'AssignPathAnimation', _data: { _duration: 0.4 } },
      { _time: 0.6, _type: 'AssignPathAnimation', _data: { _duration: 0.4 } }
    ]
    
    const errors = validateEventContinuity(events)
    expect(errors.some(e => e.includes('Gap'))).toBe(true)
  })
  
  it('detects overlaps between events', () => {
    const events: CustomEvent[] = [
      { _time: 0, _type: 'AssignPathAnimation', _data: { _duration: 0.6 } },
      { _time: 0.4, _type: 'AssignPathAnimation', _data: { _duration: 0.6 } }
    ]
    
    const errors = validateEventContinuity(events)
    expect(errors.some(e => e.includes('Overlap'))).toBe(true)
  })
})

describe('validateBookmarkStructure', () => {
  it('rejects null input', () => {
    const errors = validateBookmarkStructure(null)
    expect(errors.length).toBeGreaterThan(0)
  })
  
  it('rejects non-object input', () => {
    const errors = validateBookmarkStructure("not an object")
    expect(errors.length).toBeGreaterThan(0)
  })
  
  it('rejects missing _version', () => {
    const invalid = { _customData: {} }
    const errors = validateBookmarkStructure(invalid)
    expect(errors.some(e => e.includes('version'))).toBe(true)
  })
  
  it('rejects missing _customData', () => {
    const invalid = { _version: "3.0.0" }
    const errors = validateBookmarkStructure(invalid)
    expect(errors.some(e => e.includes('customData'))).toBe(true)
  })
  
  it('rejects missing _pointDefinitions', () => {
    const invalid: Partial<ScriptMapperBookmark> = {
      _version: "3.0.0",
      _customData: { _environment: [], _pointDefinitions: [], _customEvents: [] }
    }
    const errors = validateBookmarkStructure(invalid)
    expect(errors.some(e => e.includes('pointDefinitions'))).toBe(true)
  })
  
  it('rejects empty waypoints', () => {
    const invalid: Partial<ScriptMapperBookmark> = {
      _version: "3.0.0",
      _customData: {
        _pointDefinitions: [{ _name: "path", _points: [] }],
        _customEvents: [],
        _environment: []
      }
    }
    const errors = validateBookmarkStructure(invalid)
    expect(errors.some(e => e.includes('waypoint'))).toBe(true)
  })
  
  it('accepts valid structure', () => {
    const valid: ScriptMapperBookmark = {
      _version: "3.0.0",
      _customData: {
        _pointDefinitions: [
          {
            _name: "path",
            _points: [
              [0, 0, 0, 0],
              [1, 1, 1, 1]
            ]
          }
        ],
        _customEvents: [
          { _time: 0, _type: 'AssignPathAnimation', _data: { _duration: 1 } }
        ],
        _environment: []
      }
    }
    
    const errors = validateBookmarkStructure(valid)
    expect(errors).toEqual([])
  })
})

describe('exportToBookmarkJSON', () => {
  it('exports valid v3 bookmark structure', () => {
    const path = {
      id: 'test-path',
      name: 'Test Path',
      waypoints: [
        createWaypoint(0, { x: 0, y: 0, z: 0 }, 'Start'),
        createWaypoint(1, { x: 10, y: 5, z: 10 }, 'End')
      ],
      segments: [
        {
          id: 'seg-1',
          fromWaypointId: '',
          toWaypointId: '',
          easingEnabled: true,
          functionId: 'quadratic',
          easeType: 'easeboth' as const,
          duration: 1
        }
      ],
      totalDuration: 8000, // 8 seconds
      coordinateSystem: 'left-handed' as const
    }
    
    // Fix segment waypoint references
    path.segments[0].fromWaypointId = path.waypoints[0].id
    path.segments[0].toWaypointId = path.waypoints[1].id
    
    const bookmark = exportToBookmarkJSON(path, 'TestTrack', true)
    
    expect(bookmark._version).toBe('3.0.0')
    expect(bookmark._customData._pointDefinitions).toHaveLength(1)
    expect(bookmark._customData._pointDefinitions[0]._points).toHaveLength(2)
    expect(bookmark._customData._customEvents).toHaveLength(1)
    expect(bookmark._customData._bookmarks).toHaveLength(2)
  })
  
  it('calculates correct event timing', () => {
    const path = {
      id: 'test-path',
      name: 'Test Path',
      waypoints: [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        createWaypoint(0.5, { x: 5, y: 0, z: 0 }),
        createWaypoint(1, { x: 10, y: 0, z: 0 })
      ],
      segments: [
        {
          id: 'seg-1',
          fromWaypointId: '',
          toWaypointId: '',
          easingEnabled: false,
          functionId: 'linear',
          easeType: 'easeboth' as const,
          duration: 1
        },
        {
          id: 'seg-2',
          fromWaypointId: '',
          toWaypointId: '',
          easingEnabled: false,
          functionId: 'linear',
          easeType: 'easeboth' as const,
          duration: 1
        }
      ],
      totalDuration: 10000, // 10 seconds
      coordinateSystem: 'left-handed' as const
    }
    
    // Fix segment waypoint references
    path.segments[0].fromWaypointId = path.waypoints[0].id
    path.segments[0].toWaypointId = path.waypoints[1].id
    path.segments[1].fromWaypointId = path.waypoints[1].id
    path.segments[1].toWaypointId = path.waypoints[2].id
    
    const bookmark = exportToBookmarkJSON(path)
    const events = bookmark._customData._customEvents
    
    expect(events[0]._time).toBe(0)
    expect(events[0]._data._duration).toBe(5) // 50% of 10s
    expect(events[1]._time).toBe(5)
    expect(events[1]._data._duration).toBe(5) // 50% of 10s
  })
  
  it('formats easing commands correctly', () => {
    const path = {
      id: 'test-path',
      name: 'Test Path',
      waypoints: [
        createWaypoint(0, { x: 0, y: 0, z: 0 }),
        createWaypoint(1, { x: 10, y: 0, z: 0 })
      ],
      segments: [
        {
          id: 'seg-1',
          fromWaypointId: '',
          toWaypointId: '',
          easingEnabled: true,
          functionId: 'sine',
          easeType: 'easein' as const,
          duration: 1
        }
      ],
      totalDuration: 5000,
      coordinateSystem: 'left-handed' as const
    }
    
    path.segments[0].fromWaypointId = path.waypoints[0].id
    path.segments[0].toWaypointId = path.waypoints[1].id
    
    const bookmark = exportToBookmarkJSON(path)
    const event = bookmark._customData._customEvents[0]
    
    // Short form is used: 'I' prefix instead of 'In' (matches real ScriptMapper bookmark format)
    expect(event._data._easing).toBe('ISine')
  })
})

describe('importFromBookmarkJSON', () => {
  it('parses valid bookmark to CameraPath', () => {
    const bookmark: ScriptMapperBookmark = {
      _version: '3.0.0',
      _customData: {
        _pointDefinitions: [
          {
            _name: 'TestPath',
            _points: [
              [0, 0, 0, 0],
              [10, 5, 10, 8]
            ]
          }
        ],
        _customEvents: [
          {
            _time: 0,
            _type: 'AssignPathAnimation',
            _data: { _duration: 8, _easing: 'InOutQuad' }
          }
        ],
        _environment: []
      }
    }
    
    const path = importFromBookmarkJSON(bookmark)
    
    expect(path).not.toBeNull()
    expect(path?.waypoints).toHaveLength(2)
    expect(path?.segments).toHaveLength(1)
    expect(path?.totalDuration).toBe(8000) // 8 seconds -> ms
  })
  
  it('returns null for invalid structure', () => {
    const invalid = { _version: '3.0.0', _customData: {} }
    const path = importFromBookmarkJSON(invalid as ScriptMapperBookmark)
    
    expect(path).toBeNull()
  })
  
  it('handles missing optional fields', () => {
    const bookmark: ScriptMapperBookmark = {
      _version: '3.0.0',
      _customData: {
        _pointDefinitions: [
          {
            _name: 'MinimalPath',
            _points: [
              [0, 0, 0, 0],
              [1, 0, 0, 1]
            ]
          }
        ],
        _customEvents: [],
        _environment: []
      }
    }
    
    const path = importFromBookmarkJSON(bookmark)
    
    expect(path).not.toBeNull()
    expect(path?.waypoints).toHaveLength(2)
  })
})

describe('formatBookmarkJSON', () => {
  it('produces pretty-printed JSON', () => {
    const bookmark: ScriptMapperBookmark = {
      _version: '3.0.0',
      _customData: {
        _pointDefinitions: [],
        _customEvents: [],
        _environment: []
      }
    }
    
    const formatted = formatBookmarkJSON(bookmark)
    
    expect(formatted).toContain('\n') // Has newlines
    expect(formatted).toContain('  ') // Has indentation
    expect(JSON.parse(formatted)).toEqual(bookmark) // Valid JSON
  })
})

describe('rawCommand preservation', () => {
  describe('import preserves rawCommand', () => {
    it('stores rawCommand from event easing on import', () => {
      const bookmark: ScriptMapperBookmark = {
        _version: '3.0.0',
        _customData: {
          _pointDefinitions: [
            {
              _name: 'TestPath',
              _points: [
                [0, 0, 0, 0],
                [10, 5, 10, 4],
                [20, 10, 20, 8]
              ]
            }
          ],
          _customEvents: [
            {
              _time: 0,
              _type: 'AssignPathAnimation',
              _data: { _duration: 4, _easing: 'InOutQuad' }
            },
            {
              _time: 4,
              _type: 'AssignPathAnimation',
              _data: { _duration: 4, _easing: 'easeOutElastic' }
            }
          ],
          _environment: []
        }
      }
      
      const path = importFromBookmarkJSON(bookmark)
      
      expect(path).not.toBeNull()
      expect(path?.segments[0].rawCommand).toBe('InOutQuad')
      expect(path?.segments[1].rawCommand).toBe('easeOutElastic')
    })
    
    it('stores rawCommand for linear easing', () => {
      const bookmark: ScriptMapperBookmark = {
        _version: '3.0.0',
        _customData: {
          _pointDefinitions: [
            {
              _name: 'TestPath',
              _points: [
                [0, 0, 0, 0],
                [10, 5, 10, 4]
              ]
            }
          ],
          _customEvents: [
            {
              _time: 0,
              _type: 'AssignPathAnimation',
              _data: { _duration: 4, _easing: 'easeLinear' }
            }
          ],
          _environment: []
        }
      }
      
      const path = importFromBookmarkJSON(bookmark)
      
      expect(path).not.toBeNull()
      expect(path?.segments[0].rawCommand).toBe('easeLinear')
      expect(path?.segments[0].easingEnabled).toBe(false)
    })
  })
  
  describe('export uses rawCommand when present', () => {
    it('uses rawCommand in export if available', () => {
      const path = {
        id: 'test-path',
        name: 'Test Path',
        waypoints: [
          createWaypoint(0, { x: 0, y: 0, z: 0 }),
          createWaypoint(1, { x: 10, y: 0, z: 0 })
        ],
        segments: [
          {
            id: 'seg-1',
            fromWaypointId: '',
            toWaypointId: '',
            easingEnabled: true,
            functionId: 'quadratic',
            easeType: 'easeboth' as const,
            duration: 1,
            rawCommand: 'InOutQuad'  // Original imported format
          }
        ],
        totalDuration: 4000,
        coordinateSystem: 'left-handed' as const
      }
      
      path.segments[0].fromWaypointId = path.waypoints[0].id
      path.segments[0].toWaypointId = path.waypoints[1].id
      
      const bookmark = exportToBookmarkJSON(path)
      const event = bookmark._customData._customEvents[0]
      
      // Should use rawCommand, not generated format
      expect(event._data._easing).toBe('InOutQuad')
    })
    
    it('generates easing command when rawCommand not present', () => {
      const path = {
        id: 'test-path',
        name: 'Test Path',
        waypoints: [
          createWaypoint(0, { x: 0, y: 0, z: 0 }),
          createWaypoint(1, { x: 10, y: 0, z: 0 })
        ],
        segments: [
          {
            id: 'seg-1',
            fromWaypointId: '',
            toWaypointId: '',
            easingEnabled: true,
            functionId: 'sine',
            easeType: 'easeout' as const,
            duration: 1
            // No rawCommand
          }
        ],
        totalDuration: 4000,
        coordinateSystem: 'left-handed' as const
      }
      
      path.segments[0].fromWaypointId = path.waypoints[0].id
      path.segments[0].toWaypointId = path.waypoints[1].id
      
      const bookmark = exportToBookmarkJSON(path)
      const event = bookmark._customData._customEvents[0]
      
      // Should generate from easing settings
      expect(event._data._easing).toBe('OSine')
    })
  })
  
  describe('round-trip preserves rawCommand', () => {
    it('import then export preserves original easing command', () => {
      const originalBookmark: ScriptMapperBookmark = {
        _version: '3.0.0',
        _customData: {
          _pointDefinitions: [
            {
              _name: 'RoundTripTest',
              _points: [
                [0, 0, 0, 0],
                [5, 2, 5, 2],
                [10, 4, 10, 4]
              ]
            }
          ],
          _customEvents: [
            {
              _time: 0,
              _type: 'AssignPathAnimation',
              _data: { _duration: 2, _easing: 'InOutQuad' }
            },
            {
              _time: 2,
              _type: 'AssignPathAnimation',
              _data: { _duration: 2, _easing: 'easeOutBounce' }
            }
          ],
          _environment: []
        }
      }
      
      // Import
      const path = importFromBookmarkJSON(originalBookmark)
      expect(path).not.toBeNull()
      
      // Export
      const exportedBookmark = exportToBookmarkJSON(path!)
      
      // Verify easing commands are preserved
      expect(exportedBookmark._customData._customEvents[0]._data._easing).toBe('InOutQuad')
      expect(exportedBookmark._customData._customEvents[1]._data._easing).toBe('easeOutBounce')
    })
    
    it('round-trip preserves linear easing command', () => {
      const originalBookmark: ScriptMapperBookmark = {
        _version: '3.0.0',
        _customData: {
          _pointDefinitions: [
            {
              _name: 'LinearTest',
              _points: [
                [0, 0, 0, 0],
                [10, 5, 10, 4]
              ]
            }
          ],
          _customEvents: [
            {
              _time: 0,
              _type: 'AssignPathAnimation',
              _data: { _duration: 4, _easing: 'easeLinear' }
            }
          ],
          _environment: []
        }
      }
      
      const path = importFromBookmarkJSON(originalBookmark)
      const exportedBookmark = exportToBookmarkJSON(path!)
      
      expect(exportedBookmark._customData._customEvents[0]._data._easing).toBe('easeLinear')
    })
  })
})
