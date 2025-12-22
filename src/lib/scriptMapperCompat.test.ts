import { describe, it, expect } from 'vitest'
import {
  getScriptMapperName,
  isScriptMapperCompatible,
  formatAsScriptMapperCommand,
  parseScriptMapperCommand,
  SCRIPTMAPPER_NAMES,
  SCRIPTMAPPER_COMPATIBLE_IDS
} from './scriptMapperCompat'

describe('scriptMapperCompat', () => {
  describe('SCRIPTMAPPER_NAMES', () => {
    it('should have correct mappings', () => {
      expect(SCRIPTMAPPER_NAMES['sine']).toBe('Sine')
      expect(SCRIPTMAPPER_NAMES['quadratic']).toBe('Quad')
      expect(SCRIPTMAPPER_NAMES['cubic']).toBe('Cubic')
      expect(SCRIPTMAPPER_NAMES['quartic']).toBe('Quart')
      expect(SCRIPTMAPPER_NAMES['quintic']).toBe('Quint')
      expect(SCRIPTMAPPER_NAMES['exponential']).toBe('Expo')
      expect(SCRIPTMAPPER_NAMES['circular']).toBe('Circ')
      expect(SCRIPTMAPPER_NAMES['back']).toBe('Back')
      expect(SCRIPTMAPPER_NAMES['elastic']).toBe('Elastic')
      expect(SCRIPTMAPPER_NAMES['bounce']).toBe('Bounce')
      expect(SCRIPTMAPPER_NAMES['drift']).toBe('Drift')
    })
  })
  
  describe('SCRIPTMAPPER_COMPATIBLE_IDS', () => {
    it('should contain all compatible function IDs', () => {
      const expectedIds = ['sine', 'quadratic', 'cubic', 'quartic', 'quintic',
                          'exponential', 'circular', 'back', 'elastic', 'bounce', 'drift']
      
      expectedIds.forEach(id => {
        expect(SCRIPTMAPPER_COMPATIBLE_IDS.has(id), `Should include ${id}`).toBe(true)
      })
    })
    
    it('should have exactly 11 compatible functions', () => {
      expect(SCRIPTMAPPER_COMPATIBLE_IDS.size).toBe(11)
    })
  })
  
  describe('getScriptMapperName', () => {
    it('should return correct names for compatible functions', () => {
      expect(getScriptMapperName('sine')).toBe('Sine')
      expect(getScriptMapperName('quadratic')).toBe('Quad')
      expect(getScriptMapperName('cubic')).toBe('Cubic')
      expect(getScriptMapperName('drift')).toBe('Drift')
    })
    
    it('should return null for incompatible functions', () => {
      expect(getScriptMapperName('linear')).toBeNull()
      expect(getScriptMapperName('hermite')).toBeNull()
      expect(getScriptMapperName('bezier')).toBeNull()
    })
    
    it('should return null for non-existent functions', () => {
      expect(getScriptMapperName('nonexistent')).toBeNull()
    })
  })
  
  describe('isScriptMapperCompatible', () => {
    it('should return true for compatible functions', () => {
      expect(isScriptMapperCompatible('sine')).toBe(true)
      expect(isScriptMapperCompatible('quadratic')).toBe(true)
      expect(isScriptMapperCompatible('drift')).toBe(true)
    })
    
    it('should return false for incompatible functions', () => {
      expect(isScriptMapperCompatible('linear')).toBe(false)
      expect(isScriptMapperCompatible('hermite')).toBe(false)
      expect(isScriptMapperCompatible('sqrt')).toBe(false)
    })
    
    it('should return false for non-existent functions', () => {
      expect(isScriptMapperCompatible('nonexistent')).toBe(false)
    })
  })
  
  describe('formatAsScriptMapperCommand', () => {
    describe('standard functions', () => {
      it('should format easein commands', () => {
        expect(formatAsScriptMapperCommand('sine', 'easein')).toBe('InSine')
        expect(formatAsScriptMapperCommand('quadratic', 'easein')).toBe('InQuad')
        expect(formatAsScriptMapperCommand('cubic', 'easein')).toBe('InCubic')
      })
      
      it('should format easeout commands', () => {
        expect(formatAsScriptMapperCommand('sine', 'easeout')).toBe('OutSine')
        expect(formatAsScriptMapperCommand('exponential', 'easeout')).toBe('OutExpo')
        expect(formatAsScriptMapperCommand('bounce', 'easeout')).toBe('OutBounce')
      })
      
      it('should format easeboth commands', () => {
        expect(formatAsScriptMapperCommand('sine', 'easeboth')).toBe('InOutSine')
        expect(formatAsScriptMapperCommand('circular', 'easeboth')).toBe('InOutCirc')
        expect(formatAsScriptMapperCommand('elastic', 'easeboth')).toBe('InOutElastic')
      })
      
      it('should return null for incompatible functions', () => {
        expect(formatAsScriptMapperCommand('linear', 'easein')).toBeNull()
        expect(formatAsScriptMapperCommand('hermite', 'easeout')).toBeNull()
      })
    })
    
    describe('Drift function', () => {
      it('should format drift with default parameters', () => {
        const result = formatAsScriptMapperCommand('drift', 'easein', { x: 6, y: 6 })
        expect(result).toBe('ease_6_6')
      })
      
      it('should format drift with custom parameters', () => {
        expect(formatAsScriptMapperCommand('drift', 'easein', { x: 3, y: 7 })).toBe('ease_3_7')
        expect(formatAsScriptMapperCommand('drift', 'easein', { x: 0, y: 10 })).toBe('ease_0_10')
        expect(formatAsScriptMapperCommand('drift', 'easein', { x: 10, y: 0 })).toBe('ease_10_0')
      })
      
      it('should return null when drift params are missing', () => {
        expect(formatAsScriptMapperCommand('drift', 'easein')).toBeNull()
      })
    })
  })
  
  describe('parseScriptMapperCommand', () => {
    describe('standard functions', () => {
      it('should parse In commands', () => {
        expect(parseScriptMapperCommand('InSine')).toEqual({
          functionId: 'sine',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('InQuad')).toEqual({
          functionId: 'quadratic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('InCubic')).toEqual({
          functionId: 'cubic',
          easeType: 'easein'
        })
      })
      
      it('should parse Out commands', () => {
        expect(parseScriptMapperCommand('OutSine')).toEqual({
          functionId: 'sine',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OutExpo')).toEqual({
          functionId: 'exponential',
          easeType: 'easeout'
        })
      })
      
      it('should parse InOut commands', () => {
        expect(parseScriptMapperCommand('InOutSine')).toEqual({
          functionId: 'sine',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('InOutCirc')).toEqual({
          functionId: 'circular',
          easeType: 'easeboth'
        })
      })
      
      it('should return null for invalid commands', () => {
        expect(parseScriptMapperCommand('InvalidCommand')).toBeNull()
        expect(parseScriptMapperCommand('InUnknown')).toBeNull()
        expect(parseScriptMapperCommand('OutLinear')).toBeNull()
      })
      
      it('should return null for malformed commands', () => {
        expect(parseScriptMapperCommand('Sine')).toBeNull()
        expect(parseScriptMapperCommand('In')).toBeNull()
        expect(parseScriptMapperCommand('')).toBeNull()
      })
    })
    
    describe('Drift function', () => {
      it('should parse ease_x_y format', () => {
        expect(parseScriptMapperCommand('ease_6_6')).toEqual({
          functionId: 'drift',
          easeType: 'easein',
          params: { x: 6, y: 6 }
        })
      })
      
      it('should parse custom drift parameters', () => {
        expect(parseScriptMapperCommand('ease_3_7')).toEqual({
          functionId: 'drift',
          easeType: 'easein',
          params: { x: 3, y: 7 }
        })
        expect(parseScriptMapperCommand('ease_0_10')).toEqual({
          functionId: 'drift',
          easeType: 'easein',
          params: { x: 0, y: 10 }
        })
      })
      
      it('should return null for invalid drift format', () => {
        expect(parseScriptMapperCommand('ease_6')).toBeNull()
        expect(parseScriptMapperCommand('ease_6_')).toBeNull()
        expect(parseScriptMapperCommand('ease__6')).toBeNull()
        expect(parseScriptMapperCommand('ease')).toBeNull()
      })
    })
    
    describe('round-trip conversion', () => {
      it('should convert format -> parse -> format correctly', () => {
        // Standard functions
        const testCases: Array<{ id: string; easeType: 'easein' | 'easeout' | 'easeboth' }> = [
          { id: 'sine', easeType: 'easein' },
          { id: 'quadratic', easeType: 'easeout' },
          { id: 'cubic', easeType: 'easeboth' },
          { id: 'exponential', easeType: 'easein' }
        ]
        
        testCases.forEach(({ id, easeType }) => {
          const command = formatAsScriptMapperCommand(id, easeType)
          expect(command).toBeTruthy()
          
          const parsed = parseScriptMapperCommand(command!)
          expect(parsed).toBeTruthy()
          expect(parsed!.functionId).toBe(id)
          expect(parsed!.easeType).toBe(easeType)
        })
      })
      
      it('should convert drift format -> parse -> format correctly', () => {
        const params = { x: 3, y: 7 }
        const command = formatAsScriptMapperCommand('drift', 'easein', params)
        expect(command).toBe('ease_3_7')
        
        const parsed = parseScriptMapperCommand(command!)
        expect(parsed).toBeTruthy()
        expect(parsed!.functionId).toBe('drift')
        expect(parsed!.params).toEqual(params)
        
        // Convert back
        const command2 = formatAsScriptMapperCommand(parsed!.functionId, parsed!.easeType, parsed!.params)
        expect(command2).toBe(command)
      })
    })
  })
})
