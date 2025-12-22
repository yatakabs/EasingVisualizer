/**
 * URL State Serialization Tests
 * 
 * Tests encoding/decoding of app state for URL sharing.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  encodeState,
  decodeState,
  getStateFromURL,
  updateURLWithState,
  generateShareURL,
  clearURLState,
  type AppState,
  STATE_VERSION
} from './urlState'
import type { PreviewType } from './previewTypes'

// Helper to create a valid minimal AppState
function createMinimalState(overrides: Partial<AppState> = {}): AppState {
  return {
    panels: [
      { id: 'panel-0', functionId: 'linear', easeType: 'easein' }
    ],
    savedSpeed: 1,
    savedGamma: 2.2,
    enabledPreviews: ['graph', 'value'],
    enabledFilters: [],
    manualInputMode: false,
    manualInputValue: 0,
    triangularWaveMode: false,
    cameraStartPos: { x: 0, y: 0, z: -5 },
    cameraEndPos: { x: 0, y: 0, z: 5 },
    cameraAspectRatio: '16/9',
    maxCameraPreviews: 6,
    activeCameraPanels: ['panel-0'],
    cardScale: 1.0,
    coordinateSystem: 'left-handed',
    showControlPanel: true,
    endPauseDuration: 2.0,
    scriptMapperMode: false,
    driftParams: { x: 6, y: 6 },
    ...overrides
  }
}

// Helper to create a complex AppState for thorough testing
function createComplexState(): AppState {
  return {
    panels: [
      { id: 'panel-0', functionId: 'linear', easeType: 'easein' },
      { id: 'panel-1', functionId: 'quadratic', easeType: 'easeout' },
      { id: 'panel-2', functionId: 'sine', easeType: 'easeboth' },
      { id: 'panel-3', functionId: 'cubic', easeType: 'easein' }
    ],
    savedSpeed: 1.5,
    savedGamma: 2.4,
    enabledPreviews: ['camera', 'graph', 'value', 'glow'],
    enabledFilters: ['invert', 'bounce'],
    manualInputMode: true,
    manualInputValue: 0.75,
    triangularWaveMode: true,
    cameraStartPos: { x: 2.5, y: 1.5, z: -10 },
    cameraEndPos: { x: -2.5, y: 3.0, z: 10 },
    cameraAspectRatio: '4/3',
    maxCameraPreviews: 4,
    activeCameraPanels: ['panel-0', 'panel-2'],
    cardScale: 0.8,
    coordinateSystem: 'right-handed',
    showControlPanel: false,
    endPauseDuration: 3.5,
    scriptMapperMode: true,
    driftParams: { x: 3, y: 7 }
  }
}

describe('urlState', () => {
  describe('encodeState', () => {
    it('should encode minimal state to a non-empty string', () => {
      const state = createMinimalState()
      const encoded = encodeState(state)
      
      expect(encoded).toBeTruthy()
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode state to URL-safe base64 (no +, /, or =)', () => {
      const state = createComplexState()
      const encoded = encodeState(state)
      
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
    })

    it('should produce different encoded strings for different states', () => {
      const state1 = createMinimalState({ savedSpeed: 1 })
      const state2 = createMinimalState({ savedSpeed: 2 })
      
      const encoded1 = encodeState(state1)
      const encoded2 = encodeState(state2)
      
      expect(encoded1).not.toBe(encoded2)
    })

    it('should handle empty panels array', () => {
      const state = createMinimalState({ panels: [], activeCameraPanels: [] })
      const encoded = encodeState(state)
      
      expect(encoded).toBeTruthy()
    })

    it('should handle all ease types', () => {
      const easeTypes = ['easein', 'easeout', 'easeboth'] as const
      
      for (const easeType of easeTypes) {
        const state = createMinimalState({
          panels: [{ id: 'panel-0', functionId: 'linear', easeType }]
        })
        const encoded = encodeState(state)
        expect(encoded).toBeTruthy()
      }
    })

    it('should handle both coordinate systems', () => {
      const leftHanded = createMinimalState({ coordinateSystem: 'left-handed' })
      const rightHanded = createMinimalState({ coordinateSystem: 'right-handed' })
      
      const encodedLeft = encodeState(leftHanded)
      const encodedRight = encodeState(rightHanded)
      
      expect(encodedLeft).not.toBe(encodedRight)
    })

    it('should handle special characters in function IDs', () => {
      const state = createMinimalState({
        panels: [{ id: 'panel-0', functionId: 'custom-function_123', easeType: 'easein' }]
      })
      const encoded = encodeState(state)
      
      expect(encoded).toBeTruthy()
    })

    it('should handle large number of panels', () => {
      const panels = Array.from({ length: 24 }, (_, i) => ({
        id: `panel-${i}`,
        functionId: 'linear',
        easeType: 'easein' as const
      }))
      const state = createMinimalState({ panels, activeCameraPanels: panels.map(p => p.id) })
      
      const encoded = encodeState(state)
      expect(encoded).toBeTruthy()
    })

    it('should handle decimal values in camera positions', () => {
      const state = createMinimalState({
        cameraStartPos: { x: 1.23456, y: -2.34567, z: 3.45678 },
        cameraEndPos: { x: -9.87654, y: 8.76543, z: -7.65432 }
      })
      const encoded = encodeState(state)
      
      expect(encoded).toBeTruthy()
    })

    it('should handle zero and negative values', () => {
      const state = createMinimalState({
        savedSpeed: 0,
        savedGamma: 0,
        cardScale: 0,
        manualInputValue: -1,
        cameraStartPos: { x: 0, y: 0, z: 0 },
        cameraEndPos: { x: -1, y: -2, z: -3 }
      })
      const encoded = encodeState(state)
      
      expect(encoded).toBeTruthy()
    })
  })

  describe('decodeState', () => {
    it('should decode an encoded state back to the original', () => {
      const originalState = createMinimalState()
      const encoded = encodeState(originalState)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.savedSpeed).toBe(originalState.savedSpeed)
      expect(decoded!.savedGamma).toBe(originalState.savedGamma)
      expect(decoded!.coordinateSystem).toBe(originalState.coordinateSystem)
      expect(decoded!.showControlPanel).toBe(originalState.showControlPanel)
    })

    it('should preserve panel data after encode/decode', () => {
      const originalState = createMinimalState({
        panels: [
          { id: 'panel-0', functionId: 'linear', easeType: 'easein' },
          { id: 'panel-1', functionId: 'quadratic', easeType: 'easeout' }
        ]
      })
      const encoded = encodeState(originalState)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.panels).toHaveLength(2)
      expect(decoded!.panels[0].functionId).toBe('linear')
      expect(decoded!.panels[0].easeType).toBe('easein')
      expect(decoded!.panels[1].functionId).toBe('quadratic')
      expect(decoded!.panels[1].easeType).toBe('easeout')
    })

    it('should preserve complex state after encode/decode', () => {
      const originalState = createComplexState()
      const encoded = encodeState(originalState)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.savedSpeed).toBe(originalState.savedSpeed)
      expect(decoded!.savedGamma).toBe(originalState.savedGamma)
      expect(decoded!.enabledPreviews).toEqual(originalState.enabledPreviews)
      expect(decoded!.enabledFilters).toEqual(originalState.enabledFilters)
      expect(decoded!.manualInputMode).toBe(originalState.manualInputMode)
      expect(decoded!.manualInputValue).toBe(originalState.manualInputValue)
      expect(decoded!.triangularWaveMode).toBe(originalState.triangularWaveMode)
      expect(decoded!.cameraStartPos).toEqual(originalState.cameraStartPos)
      expect(decoded!.cameraEndPos).toEqual(originalState.cameraEndPos)
      expect(decoded!.cameraAspectRatio).toBe(originalState.cameraAspectRatio)
      expect(decoded!.maxCameraPreviews).toBe(originalState.maxCameraPreviews)
      expect(decoded!.cardScale).toBe(originalState.cardScale)
      expect(decoded!.coordinateSystem).toBe(originalState.coordinateSystem)
      expect(decoded!.showControlPanel).toBe(originalState.showControlPanel)
      expect(decoded!.endPauseDuration).toBe(originalState.endPauseDuration)
    })

    it('should return null for empty string', () => {
      const decoded = decodeState('')
      expect(decoded).toBeNull()
    })

    it('should return null for invalid base64', () => {
      const decoded = decodeState('!!!invalid-base64!!!')
      expect(decoded).toBeNull()
    })

    it('should return null for valid base64 but invalid JSON', () => {
      // "not json" in base64url
      const invalidJson = btoa('not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(invalidJson)
      expect(decoded).toBeNull()
    })

    it('should return null for valid JSON but invalid state structure', () => {
      const invalidState = btoa(JSON.stringify({ foo: 'bar' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(invalidState)
      expect(decoded).toBeNull()
    })

    it('should return null for missing required fields', () => {
      // Missing 'p' (panels) field
      const incompleteState = {
        v: 1,
        sp: 1,
        gm: 2.2,
        // p is missing
        ep: [],
        ef: [],
        mi: false,
        mv: 0,
        tw: false,
        cs: [0, 0, 0],
        ce: [0, 0, 0],
        ca: '16/9',
        mc: 6,
        ap: [],
        sc: 1,
        co: 'l',
        cp: true
      }
      const encoded = btoa(JSON.stringify(incompleteState)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(encoded)
      expect(decoded).toBeNull()
    })

    it('should return null for invalid version', () => {
      const invalidVersion = {
        v: 999,  // Invalid version
        p: [],
        sp: 1,
        gm: 2.2,
        ep: [],
        ef: [],
        mi: false,
        mv: 0,
        tw: false,
        cs: [0, 0, 0],
        ce: [0, 0, 0],
        ca: '16/9',
        mc: 6,
        ap: [],
        sc: 1,
        co: 'l',
        cp: true
      }
      const encoded = btoa(JSON.stringify(invalidVersion)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(encoded)
      expect(decoded).toBeNull()
    })

    it('should handle null input', () => {
      const decoded = decodeState(null as unknown as string)
      expect(decoded).toBeNull()
    })

    it('should handle undefined input', () => {
      const decoded = decodeState(undefined as unknown as string)
      expect(decoded).toBeNull()
    })

    it('should regenerate panel IDs deterministically', () => {
      const originalState = createMinimalState({
        panels: [
          { id: 'custom-id-1', functionId: 'linear', easeType: 'easein' },
          { id: 'custom-id-2', functionId: 'sine', easeType: 'easeout' }
        ],
        activeCameraPanels: ['custom-id-1']
      })
      const encoded = encodeState(originalState)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      // IDs should be regenerated as panel-0, panel-1
      expect(decoded!.panels[0].id).toBe('panel-0')
      expect(decoded!.panels[1].id).toBe('panel-1')
      // Active camera panels should be updated to new IDs
      expect(decoded!.activeCameraPanels).toContain('panel-0')
    })

    it('should filter out invalid active camera panel indices', () => {
      // Manually create a compact state with out-of-bounds indices
      const compactState = {
        v: 1,
        p: [{ f: 'linear', e: 'i' }],  // Only one panel
        sp: 1,
        gm: 2.2,
        ep: [],
        ef: [],
        mi: false,
        mv: 0,
        tw: false,
        cs: [0, 0, 0],
        ce: [0, 0, 0],
        ca: '16/9',
        mc: 6,
        ap: [0, 5, 10],  // Indices 5 and 10 are out of bounds
        sc: 1,
        co: 'l',
        cp: true
      }
      const encoded = btoa(JSON.stringify(compactState)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.activeCameraPanels).toHaveLength(1)
      expect(decoded!.activeCameraPanels[0]).toBe('panel-0')
    })

    it('should clamp endPauseDuration between 0 and 10', () => {
      // Test with value too high
      const stateWithHighPause = createMinimalState({ endPauseDuration: 15 })
      const encodedHigh = encodeState(stateWithHighPause)
      const decodedHigh = decodeState(encodedHigh)
      expect(decodedHigh).not.toBeNull()
      expect(decodedHigh!.endPauseDuration).toBeLessThanOrEqual(10)
      
      // Test with negative value
      const stateWithNegativePause = createMinimalState({ endPauseDuration: -5 })
      const encodedNeg = encodeState(stateWithNegativePause)
      const decodedNeg = decodeState(encodedNeg)
      expect(decodedNeg).not.toBeNull()
      expect(decodedNeg!.endPauseDuration).toBeGreaterThanOrEqual(0)
    })

    it('should use default endPauseDuration when not present', () => {
      // Create a compact state without pd field
      const compactState = {
        v: 1,
        p: [{ f: 'linear', e: 'i' }],
        sp: 1,
        gm: 2.2,
        ep: [],
        ef: [],
        mi: false,
        mv: 0,
        tw: false,
        cs: [0, 0, 0],
        ce: [0, 0, 0],
        ca: '16/9',
        mc: 6,
        ap: [],
        sc: 1,
        co: 'l',
        cp: true
        // pd is intentionally missing
      }
      const encoded = btoa(JSON.stringify(compactState)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.endPauseDuration).toBe(2.0)  // Default value
    })
  })

  describe('roundtrip (encode → decode)', () => {
    it('should preserve all state fields through encode/decode cycle', () => {
      const testCases = [
        createMinimalState(),
        createComplexState(),
        createMinimalState({ enabledPreviews: [] }),
        createMinimalState({ enabledFilters: ['invert', 'clamp', 'abs'] }),
        createMinimalState({ panels: [] }),
      ]
      
      for (const originalState of testCases) {
        const encoded = encodeState(originalState)
        const decoded = decodeState(encoded)
        
        expect(decoded).not.toBeNull()
        expect(decoded!.savedSpeed).toBe(originalState.savedSpeed)
        expect(decoded!.savedGamma).toBe(originalState.savedGamma)
        expect(decoded!.enabledPreviews).toEqual(originalState.enabledPreviews)
        expect(decoded!.enabledFilters).toEqual(originalState.enabledFilters)
        expect(decoded!.manualInputMode).toBe(originalState.manualInputMode)
        expect(decoded!.triangularWaveMode).toBe(originalState.triangularWaveMode)
        expect(decoded!.cameraAspectRatio).toBe(originalState.cameraAspectRatio)
        expect(decoded!.maxCameraPreviews).toBe(originalState.maxCameraPreviews)
        expect(decoded!.cardScale).toBe(originalState.cardScale)
        expect(decoded!.coordinateSystem).toBe(originalState.coordinateSystem)
        expect(decoded!.showControlPanel).toBe(originalState.showControlPanel)
      }
    })

    it('should handle Unicode characters in string fields', () => {
      const state = createMinimalState({
        cameraAspectRatio: '日本語/テスト'
      })
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.cameraAspectRatio).toBe('日本語/テスト')
    })

    it('should handle empty strings', () => {
      const state = createMinimalState({
        cameraAspectRatio: ''
      })
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.cameraAspectRatio).toBe('')
    })

    it('should handle boundary numeric values', () => {
      const state = createMinimalState({
        savedSpeed: Number.MAX_SAFE_INTEGER,
        savedGamma: Number.MIN_VALUE,
        cardScale: 0.0001
      })
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
    })
  })

  describe('getStateFromURL', () => {
    beforeEach(() => {
      // Reset location.search for each test
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          pathname: '/',
          search: '',
          href: 'http://localhost:3000/'
        },
        writable: true
      })
    })

    it('should return null when no state parameter is present', () => {
      window.location.search = ''
      const state = getStateFromURL()
      expect(state).toBeNull()
    })

    it('should return null when state parameter is empty', () => {
      window.location.search = '?s='
      const state = getStateFromURL()
      expect(state).toBeNull()
    })

    it('should decode valid state from URL', () => {
      const originalState = createMinimalState()
      const encoded = encodeState(originalState)
      window.location.search = `?s=${encoded}`
      
      const state = getStateFromURL()
      expect(state).not.toBeNull()
      expect(state!.savedSpeed).toBe(originalState.savedSpeed)
    })

    it('should return null for invalid state parameter', () => {
      window.location.search = '?s=invalid-data'
      const state = getStateFromURL()
      expect(state).toBeNull()
    })

    it('should ignore other query parameters', () => {
      const originalState = createMinimalState()
      const encoded = encodeState(originalState)
      window.location.search = `?foo=bar&s=${encoded}&baz=qux`
      
      const state = getStateFromURL()
      expect(state).not.toBeNull()
    })
  })

  describe('updateURLWithState', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          pathname: '/app',
          search: '',
          href: 'http://localhost:3000/app'
        },
        writable: true
      })
      
      Object.defineProperty(window, 'history', {
        value: {
          replaceState: vi.fn()
        },
        writable: true
      })
    })

    it('should call history.replaceState with encoded state', () => {
      const state = createMinimalState()
      updateURLWithState(state)
      
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
      const [, , url] = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toMatch(/^\/app\?s=.+$/)
    })

    it('should preserve pathname in URL', () => {
      window.location.pathname = '/custom/path'
      const state = createMinimalState()
      updateURLWithState(state)
      
      const [, , url] = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toMatch(/^\/custom\/path\?s=.+$/)
    })
  })

  describe('generateShareURL', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          pathname: '/visualizer',
          search: '',
          href: 'http://localhost:3000/visualizer'
        },
        writable: true
      })
    })

    it('should generate a complete URL with encoded state', () => {
      const state = createMinimalState()
      const url = generateShareURL(state)
      
      expect(url).toMatch(/^http:\/\/localhost:3000\/visualizer\?s=.+$/)
    })

    it('should generate URL that can be decoded', () => {
      const originalState = createMinimalState()
      const url = generateShareURL(originalState)
      
      // Extract the state parameter from URL
      const stateParam = new URL(url).searchParams.get('s')
      expect(stateParam).not.toBeNull()
      
      const decoded = decodeState(stateParam!)
      expect(decoded).not.toBeNull()
      expect(decoded!.savedSpeed).toBe(originalState.savedSpeed)
    })

    it('should use current origin and pathname', () => {
      window.location.origin = 'https://example.com'
      window.location.pathname = '/easing'
      
      const state = createMinimalState()
      const url = generateShareURL(state)
      
      expect(url).toMatch(/^https:\/\/example\.com\/easing\?s=.+$/)
    })
  })

  describe('clearURLState', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          pathname: '/app',
          search: '?s=somestate',
          href: 'http://localhost:3000/app?s=somestate'
        },
        writable: true
      })
      
      Object.defineProperty(window, 'history', {
        value: {
          replaceState: vi.fn()
        },
        writable: true
      })
    })

    it('should call history.replaceState with pathname only', () => {
      clearURLState()
      
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
      const [, , url] = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toBe('/app')
    })
  })

  describe('STATE_VERSION', () => {
    it('should be version 1', () => {
      expect(STATE_VERSION).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should handle state with maximum panels count', () => {
      const panels = Array.from({ length: 24 }, (_, i) => ({
        id: `panel-${i}`,
        functionId: ['linear', 'quadratic', 'cubic', 'sine'][i % 4],
        easeType: (['easein', 'easeout', 'easeboth'] as const)[i % 3]
      }))
      const state = createMinimalState({
        panels,
        activeCameraPanels: panels.slice(0, 6).map(p => p.id)
      })
      
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.panels).toHaveLength(24)
    })

    it('should handle very long preview and filter arrays', () => {
      const state = createMinimalState({
        enabledPreviews: ['camera', 'graph', 'value', 'glow', 'input', 'output'] as PreviewType[],
        enabledFilters: Array.from({ length: 20 }, (_, i) => `filter-${i}`)
      })
      
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.enabledFilters).toHaveLength(20)
    })

    it('should handle extreme camera positions', () => {
      const state = createMinimalState({
        cameraStartPos: { x: -999999, y: 999999, z: 0 },
        cameraEndPos: { x: 999999, y: -999999, z: 0.0000001 }
      })
      
      const encoded = encodeState(state)
      const decoded = decodeState(encoded)
      
      expect(decoded).not.toBeNull()
      expect(decoded!.cameraStartPos.x).toBe(-999999)
      expect(decoded!.cameraEndPos.y).toBe(-999999)
    })
  })
})
