import { describe, it, expect } from 'vitest'
import {
  getScriptMapperName,
  isScriptMapperCompatible,
  formatAsScriptMapperCommand,
  formatAsScriptMapperShortCommand,
  parseScriptMapperCommand,
  extractEasingFromBookmarkName,
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

    describe('short-form prefix parsing', () => {
      // Tests for abbreviated prefixes: I (In), O (Out), IO (InOut)
      // These are used in real Beat Saber map bookmarks (e.g., ExpertPlusStandard.dat)
      
      it('should parse I (short In) commands', () => {
        expect(parseScriptMapperCommand('ISine')).toEqual({
          functionId: 'sine',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IBack')).toEqual({
          functionId: 'back',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IQuad')).toEqual({
          functionId: 'quadratic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IQuint')).toEqual({
          functionId: 'quintic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('ICubic')).toEqual({
          functionId: 'cubic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IQuart')).toEqual({
          functionId: 'quartic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IExpo')).toEqual({
          functionId: 'exponential',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('ICirc')).toEqual({
          functionId: 'circular',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IElastic')).toEqual({
          functionId: 'elastic',
          easeType: 'easein'
        })
        expect(parseScriptMapperCommand('IBounce')).toEqual({
          functionId: 'bounce',
          easeType: 'easein'
        })
      })
      
      it('should parse O (short Out) commands', () => {
        expect(parseScriptMapperCommand('OSine')).toEqual({
          functionId: 'sine',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OBack')).toEqual({
          functionId: 'back',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OQuad')).toEqual({
          functionId: 'quadratic',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OQuint')).toEqual({
          functionId: 'quintic',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OCubic')).toEqual({
          functionId: 'cubic',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OQuart')).toEqual({
          functionId: 'quartic',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OExpo')).toEqual({
          functionId: 'exponential',
          easeType: 'easeout'
        })
        expect(parseScriptMapperCommand('OCirc')).toEqual({
          functionId: 'circular',
          easeType: 'easeout'
        })
      })
      
      it('should parse IO (short InOut) commands', () => {
        expect(parseScriptMapperCommand('IOSine')).toEqual({
          functionId: 'sine',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOBack')).toEqual({
          functionId: 'back',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOQuad')).toEqual({
          functionId: 'quadratic',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOQuint')).toEqual({
          functionId: 'quintic',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOCubic')).toEqual({
          functionId: 'cubic',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOQuart')).toEqual({
          functionId: 'quartic',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOExpo')).toEqual({
          functionId: 'exponential',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOCirc')).toEqual({
          functionId: 'circular',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOElastic')).toEqual({
          functionId: 'elastic',
          easeType: 'easeboth'
        })
        expect(parseScriptMapperCommand('IOBounce')).toEqual({
          functionId: 'bounce',
          easeType: 'easeboth'
        })
      })
      
      it('should round-trip short-form commands correctly', () => {
        // Use formatAsScriptMapperShortCommand -> parseScriptMapperCommand -> verify
        const testCases: Array<{ id: string; easeType: 'easein' | 'easeout' | 'easeboth' }> = [
          { id: 'sine', easeType: 'easein' },
          { id: 'back', easeType: 'easein' },
          { id: 'quadratic', easeType: 'easeout' },
          { id: 'quintic', easeType: 'easeout' },
          { id: 'cubic', easeType: 'easeboth' },
          { id: 'exponential', easeType: 'easeboth' }
        ]
        
        testCases.forEach(({ id, easeType }) => {
          const shortCommand = formatAsScriptMapperShortCommand(id, easeType)
          expect(shortCommand).toBeTruthy()
          
          const parsed = parseScriptMapperCommand(shortCommand!)
          expect(parsed).toBeTruthy()
          expect(parsed!.functionId).toBe(id)
          expect(parsed!.easeType).toBe(easeType)
        })
      })
    })
  })
  
  describe('extractEasingFromBookmarkName', () => {
    describe('basic extraction', () => {
      it('should extract easing from simple bookmark name', () => {
        expect(extractEasingFromBookmarkName('IBack')).toBe('IBack')
        expect(extractEasingFromBookmarkName('IOQuad')).toBe('IOQuad')
        expect(extractEasingFromBookmarkName('OSine')).toBe('OSine')
      })
      
      it('should extract easing from comma-separated bookmark name', () => {
        expect(extractEasingFromBookmarkName('dpos_-0.5_3_-3,spin60,IBack')).toBe('IBack')
        expect(extractEasingFromBookmarkName('spin60,IOQuad')).toBe('IOQuad')
        expect(extractEasingFromBookmarkName('foo,bar,OQuint')).toBe('OQuint')
      })
      
      it('should extract long-form easing commands', () => {
        expect(extractEasingFromBookmarkName('InSine')).toBe('InSine')
        expect(extractEasingFromBookmarkName('OutQuad')).toBe('OutQuad')
        expect(extractEasingFromBookmarkName('InOutCubic')).toBe('InOutCubic')
        expect(extractEasingFromBookmarkName('dpos_0_0_0,InBack')).toBe('InBack')
      })
      
      it('should extract Drift easing', () => {
        expect(extractEasingFromBookmarkName('ease_6_6')).toBe('ease_6_6')
        expect(extractEasingFromBookmarkName('ease_3_7')).toBe('ease_3_7')
        expect(extractEasingFromBookmarkName('dpos_0_0_0,ease_5_5')).toBe('ease_5_5')
      })
    })
    
    describe('edge cases', () => {
      it('should return null for bookmark with no easing', () => {
        expect(extractEasingFromBookmarkName('dpos_0_0_0')).toBeNull()
        expect(extractEasingFromBookmarkName('spin60')).toBeNull()
        expect(extractEasingFromBookmarkName('foo,bar,baz')).toBeNull()
      })
      
      it('should return null for empty string', () => {
        expect(extractEasingFromBookmarkName('')).toBeNull()
      })
      
      it('should handle whitespace around parts', () => {
        expect(extractEasingFromBookmarkName('foo, IBack')).toBe('IBack')
        expect(extractEasingFromBookmarkName('spin60 , IOQuad')).toBe('IOQuad')
      })
      
      it('should find easing even if not at the end', () => {
        // While easing typically appears last, the function searches from end
        // and returns the first valid easing found
        expect(extractEasingFromBookmarkName('IBack,dpos_0_0_0')).toBe('IBack')
      })
      
      it('should return the rightmost easing when multiple exist', () => {
        // Searches from end, so returns last valid easing
        expect(extractEasingFromBookmarkName('ISine,OBack')).toBe('OBack')
      })
    })
    
    describe('real-world bookmark names from Beat Saber maps', () => {
      // Test cases derived from actual ExpertPlusStandard.dat data
      it('should extract easing from real bookmark patterns', () => {
        expect(extractEasingFromBookmarkName('dpos_-0.5_3_-3,spin60,IBack')).toBe('IBack')
        expect(extractEasingFromBookmarkName('rot_15_-15_0,IOQuad')).toBe('IOQuad')
        expect(extractEasingFromBookmarkName('spin_90,OBack')).toBe('OBack')
        expect(extractEasingFromBookmarkName('spin_-30,ease_3_7')).toBe('ease_3_7')
        expect(extractEasingFromBookmarkName('dpos_0_2_-2,IOExpo')).toBe('IOExpo')
      })
    })
  })
})
