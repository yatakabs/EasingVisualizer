/**
 * useURLState Hook Tests
 * 
 * Tests for URL state management hooks including debouncing and initial state reading.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useInitialURLState, 
  useDebouncedURLUpdate, 
  useURLState,
  URL_UPDATE_DEBOUNCE_MS 
} from './useURLState'
import { encodeState, type AppState } from '@/lib/urlState'

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
    ...overrides
  }
}

describe('useURLState hooks', () => {
  beforeEach(() => {
    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        href: 'http://localhost:3000/'
      },
      writable: true,
      configurable: true
    })

    // Setup window.history mock
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
        pushState: vi.fn()
      },
      writable: true,
      configurable: true
    })

    // Use fake timers for debounce testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('useInitialURLState', () => {
    it('should return null when no state in URL', () => {
      window.location.search = ''
      
      const { result } = renderHook(() => useInitialURLState())
      
      expect(result.current).toBeNull()
    })

    it('should return decoded state when valid state in URL', () => {
      const originalState = createMinimalState({ savedSpeed: 2.5 })
      const encoded = encodeState(originalState)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useInitialURLState())
      
      expect(result.current).not.toBeNull()
      expect(result.current!.savedSpeed).toBe(2.5)
    })

    it('should return null when invalid state in URL', () => {
      window.location.search = '?s=invalid-base64-data'
      
      const { result } = renderHook(() => useInitialURLState())
      
      expect(result.current).toBeNull()
    })

    it('should read URL only once (memoized)', () => {
      const originalState = createMinimalState()
      const encoded = encodeState(originalState)
      window.location.search = `?s=${encoded}`
      
      const { result, rerender } = renderHook(() => useInitialURLState())
      const firstResult = result.current
      
      // Change URL (simulating navigation, though in practice this wouldn't happen)
      window.location.search = ''
      
      // Rerender the hook
      rerender()
      
      // Should still return the original state (memoized)
      expect(result.current).toBe(firstResult)
    })

    it('should preserve all state fields from URL', () => {
      const originalState = createMinimalState({
        panels: [
          { id: 'panel-0', functionId: 'sine', easeType: 'easeout' }
        ],
        savedSpeed: 1.5,
        savedGamma: 2.4,
        enabledPreviews: ['camera', 'graph'],
        manualInputMode: true,
        triangularWaveMode: true,
        coordinateSystem: 'right-handed',
        showControlPanel: false
      })
      const encoded = encodeState(originalState)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useInitialURLState())
      
      expect(result.current).not.toBeNull()
      expect(result.current!.panels[0].functionId).toBe('sine')
      expect(result.current!.panels[0].easeType).toBe('easeout')
      expect(result.current!.savedSpeed).toBe(1.5)
      expect(result.current!.savedGamma).toBe(2.4)
      expect(result.current!.enabledPreviews).toEqual(['camera', 'graph'])
      expect(result.current!.manualInputMode).toBe(true)
      expect(result.current!.triangularWaveMode).toBe(true)
      expect(result.current!.coordinateSystem).toBe('right-handed')
      expect(result.current!.showControlPanel).toBe(false)
    })
  })

  describe('useDebouncedURLUpdate', () => {
    it('should return a function', () => {
      const { result } = renderHook(() => useDebouncedURLUpdate())
      
      expect(typeof result.current).toBe('function')
    })

    it('should debounce URL updates', () => {
      const { result } = renderHook(() => useDebouncedURLUpdate())
      
      const state1 = createMinimalState({ savedSpeed: 1 })
      const state2 = createMinimalState({ savedSpeed: 2 })
      
      // Call update multiple times rapidly
      act(() => {
        result.current(state1)
        result.current(state2)
      })
      
      // history.replaceState should not have been called yet
      expect(window.history.replaceState).not.toHaveBeenCalled()
      
      // Advance timers past debounce delay
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      
      // Now it should have been called once with the latest state
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    })

    it('should use custom debounce delay', () => {
      const customDelay = 500
      const { result } = renderHook(() => useDebouncedURLUpdate(customDelay))
      
      const state = createMinimalState()
      
      act(() => {
        result.current(state)
      })
      
      // Advance by default delay - should not have updated
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      expect(window.history.replaceState).not.toHaveBeenCalled()
      
      // Advance to custom delay
      act(() => {
        vi.advanceTimersByTime(customDelay - URL_UPDATE_DEBOUNCE_MS)
      })
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    })

    it('should cancel pending update when called again', () => {
      const { result } = renderHook(() => useDebouncedURLUpdate())
      
      const state1 = createMinimalState({ savedSpeed: 1 })
      const state2 = createMinimalState({ savedSpeed: 2 })
      
      act(() => {
        result.current(state1)
      })
      
      // Advance halfway through debounce
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS / 2)
      })
      
      // Call again with different state
      act(() => {
        result.current(state2)
      })
      
      // Advance past original debounce time
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS / 2)
      })
      
      // Should not have been called yet (timer was reset)
      expect(window.history.replaceState).not.toHaveBeenCalled()
      
      // Advance for full new debounce period
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS / 2)
      })
      
      // Now should have been called with state2
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    })

    it('should cleanup timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useDebouncedURLUpdate())
      
      const state = createMinimalState()
      
      act(() => {
        result.current(state)
      })
      
      // Unmount before timeout fires
      unmount()
      
      // Advance timers
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS * 2)
      })
      
      // Should not have been called (cleanup cancelled the timeout)
      expect(window.history.replaceState).not.toHaveBeenCalled()
    })

    it('should update URL with correct format', () => {
      window.location.pathname = '/visualizer'
      const { result } = renderHook(() => useDebouncedURLUpdate())
      
      const state = createMinimalState({ savedSpeed: 3 })
      
      act(() => {
        result.current(state)
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringMatching(/^\/visualizer\?s=.+$/)
      )
    })
  })

  describe('useURLState', () => {
    it('should return initialState, updateURL, and hasURLState', () => {
      const { result } = renderHook(() => useURLState())
      
      expect(result.current).toHaveProperty('initialState')
      expect(result.current).toHaveProperty('updateURL')
      expect(result.current).toHaveProperty('hasURLState')
      expect(typeof result.current.updateURL).toBe('function')
    })

    it('should indicate hasURLState=false when no URL state', () => {
      window.location.search = ''
      
      const { result } = renderHook(() => useURLState())
      
      expect(result.current.hasURLState).toBe(false)
      expect(result.current.initialState).toBeNull()
    })

    it('should indicate hasURLState=true when URL state exists', () => {
      const state = createMinimalState()
      const encoded = encodeState(state)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useURLState())
      
      expect(result.current.hasURLState).toBe(true)
      expect(result.current.initialState).not.toBeNull()
    })

    it('should accept custom debounce parameter', () => {
      const customDelay = 1000
      const { result } = renderHook(() => useURLState(customDelay))
      
      const state = createMinimalState()
      
      act(() => {
        result.current.updateURL(state)
      })
      
      // Advance by default delay
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      expect(window.history.replaceState).not.toHaveBeenCalled()
      
      // Advance to custom delay
      act(() => {
        vi.advanceTimersByTime(customDelay - URL_UPDATE_DEBOUNCE_MS)
      })
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    })

    it('should work with complete workflow (read then update)', () => {
      // Setup initial URL state
      const initialState = createMinimalState({ savedSpeed: 1.5 })
      const encoded = encodeState(initialState)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useURLState())
      
      // Check initial state was read
      expect(result.current.hasURLState).toBe(true)
      expect(result.current.initialState!.savedSpeed).toBe(1.5)
      
      // Update with new state
      const newState = createMinimalState({ savedSpeed: 2.5 })
      act(() => {
        result.current.updateURL(newState)
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      
      // Verify URL was updated
      expect(window.history.replaceState).toHaveBeenCalled()
    })
  })

  describe('URL_UPDATE_DEBOUNCE_MS', () => {
    it('should be exported and be a positive number', () => {
      expect(URL_UPDATE_DEBOUNCE_MS).toBeDefined()
      expect(typeof URL_UPDATE_DEBOUNCE_MS).toBe('number')
      expect(URL_UPDATE_DEBOUNCE_MS).toBeGreaterThan(0)
    })
  })

  describe('integration scenarios', () => {
    it('should handle state sharing workflow', () => {
      // 1. User A creates state and generates URL
      const stateA = createMinimalState({
        panels: [
          { id: 'p1', functionId: 'sine', easeType: 'easeout' },
          { id: 'p2', functionId: 'cubic', easeType: 'easeboth' }
        ],
        savedSpeed: 2.0,
        coordinateSystem: 'right-handed'
      })
      
      // Encode the state (as would happen when sharing)
      const encoded = encodeState(stateA)
      
      // 2. User B opens the shared URL
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useURLState())
      
      // 3. Verify state was restored correctly
      expect(result.current.hasURLState).toBe(true)
      const decodedState = result.current.initialState!
      
      expect(decodedState.panels).toHaveLength(2)
      expect(decodedState.panels[0].functionId).toBe('sine')
      expect(decodedState.panels[1].easeType).toBe('easeboth')
      expect(decodedState.savedSpeed).toBe(2.0)
      expect(decodedState.coordinateSystem).toBe('right-handed')
    })

    it('should handle rapid state changes with debouncing', () => {
      const { result } = renderHook(() => useURLState())
      
      // Simulate rapid user interactions
      const states = Array.from({ length: 10 }, (_, i) => 
        createMinimalState({ savedSpeed: i + 1 })
      )
      
      // Rapid updates
      for (const state of states) {
        act(() => {
          result.current.updateURL(state)
        })
        // Small delay between updates (less than debounce)
        act(() => {
          vi.advanceTimersByTime(50)
        })
      }
      
      // URL should not have been updated during rapid changes
      expect(window.history.replaceState).not.toHaveBeenCalled()
      
      // Wait for debounce to complete
      act(() => {
        vi.advanceTimersByTime(URL_UPDATE_DEBOUNCE_MS)
      })
      
      // Should have updated only once with the final state
      expect(window.history.replaceState).toHaveBeenCalledTimes(1)
    })

    it('should handle empty panels array', () => {
      const state = createMinimalState({ panels: [], activeCameraPanels: [] })
      const encoded = encodeState(state)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useURLState())
      
      expect(result.current.hasURLState).toBe(true)
      expect(result.current.initialState!.panels).toEqual([])
    })

    it('should handle state with all boolean combinations', () => {
      const state = createMinimalState({
        manualInputMode: true,
        triangularWaveMode: false,
        showControlPanel: true
      })
      const encoded = encodeState(state)
      window.location.search = `?s=${encoded}`
      
      const { result } = renderHook(() => useURLState())
      
      expect(result.current.initialState!.manualInputMode).toBe(true)
      expect(result.current.initialState!.triangularWaveMode).toBe(false)
      expect(result.current.initialState!.showControlPanel).toBe(true)
    })
  })
})
