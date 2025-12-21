/**
 * Tests for preset types and utilities
 */

import { describe, it, expect } from 'vitest'
import {
  MAX_PRESETS,
  PRESET_STORAGE_KEY,
  PRESET_SCHEMA_VERSION,
  generatePresetId,
  validatePreset,
  validatePresetStorage,
  createEmptyStorage,
  sanitizePresetName,
  type Preset,
  type PresetStorage
} from './presetTypes'

describe('presetTypes', () => {
  describe('constants', () => {
    it('should have correct constant values', () => {
      expect(MAX_PRESETS).toBe(50)
      expect(PRESET_STORAGE_KEY).toBe('easingviz.presets.v1')
      expect(PRESET_SCHEMA_VERSION).toBe(1)
    })
  })
  
  describe('generatePresetId', () => {
    it('should generate valid UUID v4 format', () => {
      const id = generatePresetId()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })
    
    it('should generate unique IDs', () => {
      const id1 = generatePresetId()
      const id2 = generatePresetId()
      expect(id1).not.toBe(id2)
    })
  })
  
  describe('validatePreset', () => {
    const validPreset: Preset = {
      id: 'test-id',
      name: 'Test Preset',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        panels: [],
        savedSpeed: 1,
        savedGamma: 2.2,
        enabledPreviews: ['graph'],
        enabledFilters: [],
        manualInputMode: false,
        manualInputValue: 0,
        triangularWaveMode: false,
        cameraStartPos: { x: 0, y: 0, z: 0 },
        cameraEndPos: { x: 0, y: 0, z: 0 },
        cameraAspectRatio: '16/9',
        maxCameraPreviews: 6,
        activeCameraPanels: [],
        cardScale: 1.0,
        coordinateSystem: 'left-handed',
        showControlPanel: true,
        endPauseDuration: 2.0
      },
      meta: {
        app: 'EasingVisualizer',
        version: 1
      }
    }
    
    it('should validate correct preset', () => {
      expect(validatePreset(validPreset)).toBe(true)
    })
    
    it('should reject null and undefined', () => {
      expect(validatePreset(null)).toBe(false)
      expect(validatePreset(undefined)).toBe(false)
    })
    
    it('should reject non-object', () => {
      expect(validatePreset('string')).toBe(false)
      expect(validatePreset(123)).toBe(false)
    })
    
    it('should reject missing required fields', () => {
      const { id: _id, ...noId } = validPreset
      expect(validatePreset(noId)).toBe(false)
      
      const { name: _name, ...noName } = validPreset
      expect(validatePreset(noName)).toBe(false)
      
      const { data: _data, ...noData } = validPreset
      expect(validatePreset(noData)).toBe(false)
    })
    
    it('should reject invalid meta fields', () => {
      expect(validatePreset({ ...validPreset, meta: { ...validPreset.meta, app: 'WrongApp' } })).toBe(false)
      expect(validatePreset({ ...validPreset, meta: { ...validPreset.meta, version: 0 } })).toBe(false)
    })
    
    it('should accept optional fields', () => {
      const withOptional: Preset = {
        ...validPreset,
        updatedAt: '2025-01-02T00:00:00Z',
        meta: {
          ...validPreset.meta,
          source: 'url'
        }
      }
      expect(validatePreset(withOptional)).toBe(true)
    })
  })
  
  describe('validatePresetStorage', () => {
    const validStorage: PresetStorage = {
      version: 1,
      presets: []
    }
    
    it('should validate correct storage', () => {
      expect(validatePresetStorage(validStorage)).toBe(true)
    })
    
    it('should reject invalid version', () => {
      expect(validatePresetStorage({ ...validStorage, version: 0 })).toBe(false)
    })
    
    it('should reject non-array presets', () => {
      expect(validatePresetStorage({ ...validStorage, presets: 'not-array' as unknown as Preset[] })).toBe(false)
    })
  })
  
  describe('createEmptyStorage', () => {
    it('should create valid empty storage', () => {
      const storage = createEmptyStorage()
      expect(storage.version).toBe(PRESET_SCHEMA_VERSION)
      expect(storage.presets).toEqual([])
      expect(validatePresetStorage(storage)).toBe(true)
    })
  })
  
  describe('sanitizePresetName', () => {
    it('should trim whitespace', () => {
      expect(sanitizePresetName('  test  ')).toBe('test')
    })
    
    it('should limit length to 100 characters', () => {
      const longName = 'a'.repeat(150)
      expect(sanitizePresetName(longName)).toHaveLength(100)
    })
    
    it('should preserve normal names', () => {
      expect(sanitizePresetName('My Preset')).toBe('My Preset')
    })
  })
})
