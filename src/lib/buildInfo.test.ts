import { describe, it, expect } from 'vitest'
import { getBuildInfo } from './buildInfo'

describe('buildInfo', () => {
  describe('getBuildInfo', () => {
    it('returns BuildInfo with all required properties', () => {
      const info = getBuildInfo()
      
      expect(info).toHaveProperty('version')
      expect(info).toHaveProperty('commit')
      expect(info).toHaveProperty('timestamp')
      expect(info).toHaveProperty('environment')
      expect(info).toHaveProperty('buildDate')
    })

    it('returns non-empty string values', () => {
      const info = getBuildInfo()
      
      expect(info.version).toBeTruthy()
      expect(typeof info.version).toBe('string')
      expect(info.version.length).toBeGreaterThan(0)
      
      expect(info.commit).toBeTruthy()
      expect(typeof info.commit).toBe('string')
      expect(info.commit.length).toBeGreaterThan(0)
      
      expect(info.timestamp).toBeTruthy()
      expect(typeof info.timestamp).toBe('string')
      expect(info.timestamp.length).toBeGreaterThan(0)
      
      expect(info.environment).toBeTruthy()
      expect(typeof info.environment).toBe('string')
      expect(info.environment.length).toBeGreaterThan(0)
    })

    it('returns valid Date object for buildDate', () => {
      const info = getBuildInfo()
      
      expect(info.buildDate).toBeInstanceOf(Date)
      expect(isNaN(info.buildDate.getTime())).toBe(false)
    })

    it('timestamp is in ISO 8601 format', () => {
      const info = getBuildInfo()
      
      // Should be parseable as ISO 8601
      const parsedDate = new Date(info.timestamp)
      expect(isNaN(parsedDate.getTime())).toBe(false)
      
      // Should match ISO format pattern
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      expect(info.timestamp).toMatch(isoPattern)
    })

    it('environment is either production or development', () => {
      const info = getBuildInfo()
      
      expect(['production', 'development', 'test']).toContain(info.environment)
    })

    it('version follows semantic versioning pattern', () => {
      const info = getBuildInfo()
      
      // Should match X.Y.Z pattern (with optional pre-release/build metadata)
      const semverPattern = /^\d+\.\d+\.\d+/
      expect(info.version).toMatch(semverPattern)
    })

    it('buildDate matches timestamp', () => {
      const info = getBuildInfo()
      
      const expectedDate = new Date(info.timestamp)
      expect(info.buildDate.getTime()).toBe(expectedDate.getTime())
    })
  })
})
