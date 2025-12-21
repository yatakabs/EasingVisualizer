/**
 * Custom hook for URL state management
 * 
 * Provides URL state restoration on mount and debounced URL updates.
 * Supports "preview mode" where URL state is not automatically applied.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  type AppState, 
  getStateFromURL, 
  updateURLWithState 
} from '@/lib/urlState'

export const URL_UPDATE_DEBOUNCE_MS = 300

/**
 * Hook to read initial state from URL
 * Returns the decoded state or null if no valid state in URL
 */
export function useInitialURLState(): AppState | null {
  // Use ref to ensure we only read URL once on initial mount
  const initialStateRef = useRef<AppState | null | undefined>(undefined)
  
  if (initialStateRef.current === undefined) {
    // SSR guard
    if (typeof window === 'undefined') {
      initialStateRef.current = null
    } else {
      initialStateRef.current = getStateFromURL()
    }
  }
  
  return initialStateRef.current
}

/**
 * Hook to create a debounced URL updater
 * Returns a function that updates the URL with the current state after a delay
 */
export function useDebouncedURLUpdate(debounceMs: number = URL_UPDATE_DEBOUNCE_MS) {
  const timeoutRef = useRef<number | undefined>(undefined)
  
  const updateURL = useCallback((state: AppState) => {
    // SSR guard
    if (typeof window === 'undefined') {
      return
    }
    
    // Clear any pending update
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current)
    }
    
    // Schedule new update
    timeoutRef.current = window.setTimeout(() => {
      updateURLWithState(state)
      timeoutRef.current = undefined
    }, debounceMs)
  }, [debounceMs])
  
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
 * - Manages preview mode for URL state
 * @param debounceMs - Optional debounce delay in milliseconds (default: 300)
 */
export function useURLState(debounceMs?: number) {
  const initialState = useInitialURLState()
  const updateURL = useDebouncedURLUpdate(debounceMs)
  
  // Preview mode: true when URL state exists but not yet applied
  const [isPreviewMode, setIsPreviewMode] = useState(initialState !== null)
  
  /**
   * Apply URL state and exit preview mode
   * Parent should use this signal to force-update localStorage
   */
  const applyURLState = useCallback(() => {
    setIsPreviewMode(false)
  }, [])
  
  /**
   * Dismiss URL state and clear URL parameter
   */
  const dismissURLState = useCallback(() => {
    setIsPreviewMode(false)
    
    // Clear URL state parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('s')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])
  
  return {
    initialState,
    updateURL,
    hasURLState: initialState !== null,
    isPreviewMode,
    applyURLState,
    dismissURLState
  }
}
