import { useState, useCallback, useRef, useEffect } from 'react'

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
  
  /**
   * Debounce delay in milliseconds for localStorage writes.
   * Defaults to 500ms. Set to 0 to disable debouncing.
   */
  debounceMs?: number
}

/**
 * Local storage fallback for @github/spark useKV hook.
 * This hook provides the same API as useKV but uses localStorage instead of Spark KV store.
 * Used when running locally or when Spark backend is unavailable.
 * 
 * Features debounced writes to reduce main thread blocking and I/O overhead.
 */
export function useLocalKV<T>(
  key: string, 
  defaultValue: T,
  options?: UseLocalKVOptions
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `spark-kv-${key}`
  const forceValue = options?.forceValue ?? false
  const debounceMs = options?.debounceMs ?? 500
  
  // Track if we've already forced the value to avoid re-forcing on re-renders
  const hasForcedRef = useRef(false)
  
  // Refs for debounced write management
  const writeTimeoutRef = useRef<number | undefined>(undefined)
  const pendingValueRef = useRef<T | null>(null)
  
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

  // Cleanup: flush pending writes on unmount or before new writes
  useEffect(() => {
    return () => {
      // Cancel pending timeout
      if (writeTimeoutRef.current !== undefined) {
        clearTimeout(writeTimeoutRef.current)
        writeTimeoutRef.current = undefined
      }
      
      // Flush pending write immediately on unmount to prevent data loss
      if (pendingValueRef.current !== null) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(pendingValueRef.current))
        } catch {
          // Ignore errors during cleanup (e.g., storage full, private browsing)
        }
        pendingValueRef.current = null
      }
    }
  }, [storageKey])

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue
      
      // If debouncing is disabled, write immediately
      if (debounceMs === 0) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(resolved))
        } catch {
          console.warn(`Failed to save to localStorage: ${storageKey}`)
        }
        return resolved
      }
      
      // Schedule debounced write
      pendingValueRef.current = resolved
      
      // Clear existing timeout if any
      if (writeTimeoutRef.current !== undefined) {
        clearTimeout(writeTimeoutRef.current)
      }
      
      // Schedule new write
      writeTimeoutRef.current = window.setTimeout(() => {
        try {
          if (pendingValueRef.current !== null) {
            localStorage.setItem(storageKey, JSON.stringify(pendingValueRef.current))
          }
        } catch {
          console.warn(`Failed to save to localStorage: ${storageKey}`)
        }
        pendingValueRef.current = null
        writeTimeoutRef.current = undefined
      }, debounceMs) as unknown as number
      
      return resolved
    })
  }, [storageKey, debounceMs])

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
