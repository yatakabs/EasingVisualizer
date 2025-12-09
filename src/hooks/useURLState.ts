/**
 * Custom hook for URL state management
 * 
 * Provides URL state restoration on mount and debounced URL updates.
 */

import { useEffect, useRef, useCallback } from 'react'
import { 
  type AppState, 
  getStateFromURL, 
  updateURLWithState 
} from '@/lib/urlState'

const URL_UPDATE_DEBOUNCE_MS = 300

/**
 * Hook to read initial state from URL
 * Returns the decoded state or null if no valid state in URL
 */
export function useInitialURLState(): AppState | null {
  // Use ref to ensure we only read URL once on initial mount
  const initialStateRef = useRef<AppState | null | undefined>(undefined)
  
  if (initialStateRef.current === undefined) {
    initialStateRef.current = getStateFromURL()
  }
  
  return initialStateRef.current
}

/**
 * Hook to create a debounced URL updater
 * Returns a function that updates the URL with the current state after a delay
 */
export function useDebouncedURLUpdate() {
  const timeoutRef = useRef<number | undefined>(undefined)
  
  const updateURL = useCallback((state: AppState) => {
    // Clear any pending update
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current)
    }
    
    // Schedule new update
    timeoutRef.current = window.setTimeout(() => {
      updateURLWithState(state)
      timeoutRef.current = undefined
    }, URL_UPDATE_DEBOUNCE_MS)
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return updateURL
}

/**
 * Combined hook for URL state management
 * - Provides initial state from URL on mount
 * - Returns debounced update function for syncing state to URL
 */
export function useURLState() {
  const initialState = useInitialURLState()
  const updateURL = useDebouncedURLUpdate()
  
  return {
    initialState,
    updateURL,
    hasURLState: initialState !== null
  }
}
