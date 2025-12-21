import { useState, useCallback, useRef } from 'react'

/**
 * Options for useLocalKV hook
 */
export interface UseLocalKVOptions {
  /**
   * When true, bypasses localStorage and uses defaultValue directly.
   * The defaultValue is also persisted to localStorage.
   * Useful when restoring state from URL - forces URL state to take priority.
   */
  forceValue?: boolean
}

/**
 * Local storage fallback for @github/spark useKV hook.
 * This hook provides the same API as useKV but uses localStorage instead of Spark KV store.
 * Used when running locally or when Spark backend is unavailable.
 */
export function useLocalKV<T>(
  key: string, 
  defaultValue: T,
  options?: UseLocalKVOptions
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `spark-kv-${key}`
  const forceValue = options?.forceValue ?? false
  
  // Track if we've already forced the value to avoid re-forcing on re-renders
  const hasForcedRef = useRef(false)
  
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    
    // When forceValue is true, bypass localStorage and use defaultValue
    if (forceValue && !hasForcedRef.current) {
      hasForcedRef.current = true
      // Persist the forced value to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(defaultValue))
      } catch {
        console.warn(`Failed to save forced value to localStorage: ${storageKey}`)
      }
      return defaultValue
    }
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        return JSON.parse(stored) as T
      }
    } catch {
      // Parse error, use default
    }
    return defaultValue
  })

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolved))
      } catch {
        // Storage full or unavailable
        console.warn(`Failed to save to localStorage: ${storageKey}`)
      }
      
      return resolved
    })
  }, [storageKey])

  return [value, setStoredValue]
}

/**
 * Check if running in Spark environment (has access to Spark KV backend)
 */
export function isSparkEnvironment(): boolean {
  // In production on Spark, the KV backend should be available
  // In local dev, we hit rate limits or 403 errors
  // We can detect this by checking if we're on localhost
  if (typeof window === 'undefined') return false
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
  
  // If we're on localhost, assume local development (no Spark backend)
  return !isLocalhost
}
