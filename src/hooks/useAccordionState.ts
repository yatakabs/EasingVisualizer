import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'easing-visualizer-accordion-state'

interface AccordionState {
  [key: string]: string[]
}

/**
 * Hook to persist accordion open/closed state to localStorage.
 * @param sectionId - Unique identifier for the accordion section
 * @param defaultOpen - Array of item values that should be open by default
 */
export function useAccordionState(
  sectionId: string,
  defaultOpen: string[] = []
): [string[], (value: string[]) => void] {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultOpen
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: AccordionState = JSON.parse(stored)
        if (state[sectionId]) {
          return state[sectionId]
        }
      }
    } catch {
      // Ignore parse errors
    }
    return defaultOpen
  })

  const updateOpenItems = useCallback((value: string[]) => {
    setOpenItems(value)
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const state: AccordionState = stored ? JSON.parse(stored) : {}
      state[sectionId] = value
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }, [sectionId])

  // Sync with localStorage on mount (for SSR hydration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: AccordionState = JSON.parse(stored)
        if (state[sectionId] && JSON.stringify(state[sectionId]) !== JSON.stringify(openItems)) {
          setOpenItems(state[sectionId])
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [sectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  return [openItems, updateOpenItems]
}
