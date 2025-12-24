import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook for making screen reader announcements via aria-live regions.
 * Returns a function to announce messages to screen readers.
 */
export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null)

  // Create the announcer element on mount
  useEffect(() => {
    // Check if announcer already exists
    let announcer = document.getElementById('sr-announcements') as HTMLDivElement | null
    
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'sr-announcements'
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `
      document.body.appendChild(announcer)
    }
    
    announcerRef.current = announcer

    return () => {
      // Don't remove on unmount as other components might use it
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = announcerRef.current || document.getElementById('sr-announcements')
    
    if (announcer) {
      // Update aria-live if needed
      announcer.setAttribute('aria-live', priority)
      
      // Clear first to ensure announcement is made even if same message
      announcer.textContent = ''
      
      // Use requestAnimationFrame to ensure the clear happens first
      requestAnimationFrame(() => {
        if (announcer) {
          announcer.textContent = message
        }
      })
    }
  }, [])

  return announce
}

/**
 * Hook for announcing state changes automatically.
 * @param message - The message to announce
 * @param deps - Dependencies that trigger the announcement
 */
export function useAnnounceEffect(message: string, deps: React.DependencyList) {
  const announce = useAnnounce()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (message) {
      announce(message)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
