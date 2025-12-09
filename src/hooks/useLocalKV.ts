import { useState, useCallback } from 'react'

/**
 * Local storage fallback for @github/spark useKV hook.
 * This hook provides the same API as useKV but uses localStorage instead of Spark KV store.
 * Used when running locally or when Spark backend is unavailable.
 */
export function useLocalKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `spark-kv-${key}`
  
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
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
