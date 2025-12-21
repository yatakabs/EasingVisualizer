/**
 * Vitest setup for jsdom environment
 * Configures mocks for browser APIs used in URL state management
 */

import { beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Store original implementations
const originalLocation = global.location
const originalHistory = global.history

beforeEach(() => {
  // Mock window.location for URL testing
  delete (global as any).location
  global.location = {
    ...originalLocation,
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    href: 'http://localhost:3000/',
  } as Location

  // Mock window.history for URL state management
  delete (global as any).history
  global.history = {
    ...originalHistory,
    replaceState: vi.fn(),
    pushState: vi.fn(),
  } as unknown as History

  // Mock setTimeout/clearTimeout for debounce testing
  vi.useFakeTimers()
})

afterEach(() => {
  // Restore timers
  vi.useRealTimers()
  
  // Clear all mocks
  vi.clearAllMocks()
})
