import { describe, it, expect } from 'vitest'
import { EASING_FUNCTIONS, type ParametricEasingParams } from './easingFunctions'

describe('easingFunctions', () => {
  describe('Drift function', () => {
    const driftFunction = EASING_FUNCTIONS.find(f => f.id === 'drift')!
    
    it('should exist in EASING_FUNCTIONS array', () => {
      expect(driftFunction).toBeDefined()
      expect(driftFunction.name).toBe('Drift')
      expect(driftFunction.isParametric).toBe(true)
    })
    
    it('should have default parameters', () => {
      expect(driftFunction.defaultParams).toEqual({ x: 6, y: 6 })
    })
    
    it('should be ScriptMapper compatible', () => {
      expect(driftFunction.scriptMapperCompatible).toBe(true)
      expect(driftFunction.scriptMapperName).toBe('Drift')
    })
    
    describe('calculation with default parameters (x=6, y=6)', () => {
      it('should return 0 at t=0', () => {
        const result = driftFunction.calculate(0, 'easein')
        expect(result).toBeCloseTo(0, 5)
      })
      
      it('should return 1 at t=1', () => {
        const result = driftFunction.calculate(1, 'easein')
        expect(result).toBeCloseTo(1, 5)
      })
      
      it('should calculate value at t=0.5', () => {
        const result = driftFunction.calculate(0.5, 'easein')
        // With x=6 (0.6), y=6 (0.6):
        // t=0.5 < 0.6, so: (0.5 / 0.6)^2 * 0.6 ≈ 0.4167
        expect(result).toBeCloseTo(0.4167, 3)
      })
      
      it('should calculate value at t=0.7', () => {
        const result = driftFunction.calculate(0.7, 'easein')
        // With x=6 (0.6), y=6 (0.6):
        // t=0.7 > 0.6, so: 0.6 + ((0.7 - 0.6) / (1 - 0.6)) * (1 - 0.6) = 0.7
        expect(result).toBeCloseTo(0.7, 3)
      })
    })
    
    describe('calculation with custom parameters', () => {
      it('should handle x=0 edge case', () => {
        const params: ParametricEasingParams = { x: 0, y: 5 }
        const result = driftFunction.calculate(0.5, 'easein', params)
        // With x=0, formula uses fallback: yParam + (t / 1) * (1 - yParam)
        // 0.5 + 0.5 * 0.5 = 0.75
        expect(result).toBeCloseTo(0.75, 3)
      })
      
      it('should handle x=10 edge case', () => {
        const params: ParametricEasingParams = { x: 10, y: 5 }
        const result = driftFunction.calculate(0.5, 'easein', params)
        // With x=10 (1.0), formula uses: t^2 * yParam = 0.25 * 0.5 = 0.125
        expect(result).toBeCloseTo(0.125, 3)
      })
      
      it('should handle x=3, y=7', () => {
        const params: ParametricEasingParams = { x: 3, y: 7 }
        const result = driftFunction.calculate(0.2, 'easein', params)
        // With x=3 (0.3), y=7 (0.7):
        // t=0.2 < 0.3, so: (0.2 / 0.3)^2 * 0.7 ≈ 0.3111
        expect(result).toBeCloseTo(0.3111, 3)
      })
      
      it('should handle different parameters for t > xParam', () => {
        const params: ParametricEasingParams = { x: 3, y: 7 }
        const result = driftFunction.calculate(0.5, 'easein', params)
        // With x=3 (0.3), y=7 (0.7):
        // t=0.5 > 0.3, so: 0.7 + ((0.5 - 0.3) / (1 - 0.3)) * (1 - 0.7)
        // = 0.7 + (0.2 / 0.7) * 0.3 ≈ 0.7857
        expect(result).toBeCloseTo(0.7857, 3)
      })
    })
    
    describe('easeType transformations', () => {
      it('should apply easein correctly', () => {
        const result = driftFunction.calculate(0.5, 'easein')
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(1)
      })
      
      it('should apply easeout correctly', () => {
        const result = driftFunction.calculate(0.5, 'easeout')
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(1)
      })
      
      it('should apply easeboth correctly', () => {
        const result = driftFunction.calculate(0.5, 'easeboth')
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(1)
      })
    })
  })
  
  describe('ScriptMapper compatibility', () => {
    it('should mark compatible functions correctly', () => {
      const compatibleIds = ['sine', 'quadratic', 'cubic', 'quartic', 'quintic',
                             'exponential', 'circular', 'back', 'elastic', 'bounce', 'drift']
      
      compatibleIds.forEach(id => {
        const fn = EASING_FUNCTIONS.find(f => f.id === id)
        expect(fn?.scriptMapperCompatible, `${id} should be compatible`).toBe(true)
      })
    })
    
    it('should mark non-compatible functions correctly', () => {
      const incompatibleIds = ['linear', 'sqrt', 'hermite', 'bezier', 'parabolic', 'trigonometric']
      
      incompatibleIds.forEach(id => {
        const fn = EASING_FUNCTIONS.find(f => f.id === id)
        expect(fn?.scriptMapperCompatible, `${id} should not be compatible`).toBe(false)
      })
    })
    
    it('should have correct ScriptMapper names', () => {
      const nameMap = {
        'sine': 'Sine',
        'quadratic': 'Quad',
        'cubic': 'Cubic',
        'quartic': 'Quart',
        'quintic': 'Quint',
        'exponential': 'Expo',
        'circular': 'Circ',
        'back': 'Back',
        'elastic': 'Elastic',
        'bounce': 'Bounce',
        'drift': 'Drift'
      }
      
      Object.entries(nameMap).forEach(([id, expectedName]) => {
        const fn = EASING_FUNCTIONS.find(f => f.id === id)
        expect(fn?.scriptMapperName).toBe(expectedName)
      })
    })
  })
  
  describe('all functions', () => {
    it('should have scriptMapperCompatible field', () => {
      EASING_FUNCTIONS.forEach(fn => {
        expect(fn).toHaveProperty('scriptMapperCompatible')
        expect(typeof fn.scriptMapperCompatible).toBe('boolean')
      })
    })
    
    it('should have scriptMapperName for compatible functions', () => {
      EASING_FUNCTIONS.forEach(fn => {
        if (fn.scriptMapperCompatible) {
          expect(fn.scriptMapperName, `${fn.id} should have scriptMapperName`).toBeTruthy()
        }
      })
    })
    
    it('should produce values in [0,1] range at boundaries', () => {
      EASING_FUNCTIONS.forEach(fn => {
        // Skip parabolic function which has known boundary behavior (returns 0 at t=1)
        if (fn.id === 'parabolic') return
        
        const easeTypes: Array<'easein' | 'easeout' | 'easeboth'> = ['easein', 'easeout', 'easeboth']
        easeTypes.forEach(easeType => {
          const result0 = fn.calculate(0, easeType)
          const result1 = fn.calculate(1, easeType)
          
          expect(result0, `${fn.id} ${easeType} at t=0`).toBeCloseTo(0, 5)
          expect(result1, `${fn.id} ${easeType} at t=1`).toBeCloseTo(1, 5)
        })
      })
    })
  })
})
