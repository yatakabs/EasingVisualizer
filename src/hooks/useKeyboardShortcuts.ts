import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

/**
 * Hook for registering global keyboard shortcuts.
 * @param shortcuts - Array of keyboard shortcut definitions
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
      const shiftMatch = !!shortcut.shift === event.shiftKey
      const altMatch = !!shortcut.alt === event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

/**
 * Common keyboard shortcuts for the easing visualizer.
 */
export const COMMON_SHORTCUTS = {
  PLAY_PAUSE: ' ', // Space
  ADD_PANEL: 'n',
  OPEN_PRESETS: 'p',
  SHARE: 's',
  TOGGLE_SETTINGS: ',',
} as const

/**
 * Panel-specific keyboard shortcuts.
 */
export const PANEL_SHORTCUTS = {
  EASE_IN: 'i',
  EASE_OUT: 'o',
  EASE_BOTH: 'b',
  REMOVE: 'Delete',
  TOGGLE_CAMERA: 'c',
} as const
