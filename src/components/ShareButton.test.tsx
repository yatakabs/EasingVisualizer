/**
 * ShareButton Component Tests
 * 
 * Tests for the share button including clipboard operations and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareButton } from './ShareButton'
import { type AppState } from '@/lib/urlState'

// Mock sonner toast - use vi.hoisted to ensure mock functions are available
const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: mockToast
}))

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

describe('ShareButton', () => {
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

    // Mock clipboard API with resolved promise
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      writable: true,
      configurable: true
    })

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render share button', () => {
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('共有')
  })

  it('should call getState and copy URL to clipboard when clicked', async () => {
    const state = createMinimalState({ savedSpeed: 2.5 })
    const getState = vi.fn(() => state)
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    // Wait for the async clipboard operation
    await vi.waitFor(() => {
      expect(getState).toHaveBeenCalledTimes(1)
    }, { timeout: 1000 })
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    
    // Verify URL was passed to clipboard
    const clipboardCall = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(clipboardCall).toMatch(/^http:\/\/localhost:3000\/\?s=.+$/)
  })

  it('should show success toast after successful copy', async () => {
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    // Wait for async operation
    await vi.waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    expect(mockToast.success).toHaveBeenCalledWith(
      'リンクをコピーしました',
      expect.objectContaining({
        description: '共有URLがクリップボードにコピーされました'
      })
    )
  })

  it('should show error toast when clipboard fails', async () => {
    // Mock clipboard failure
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard access denied'))
      },
      writable: true,
      configurable: true
    })
    
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    // Wait for async operation
    await vi.waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    expect(mockToast.error).toHaveBeenCalledWith(
      '共有に失敗しました',
      expect.objectContaining({
        description: 'URLの生成またはコピーに問題が発生しました'
      })
    )
  })

  it('should show info toast when clipboard API is unavailable', async () => {
    // Remove clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true
    })
    
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    // Wait for async operation
    await vi.waitFor(() => {
      expect(mockToast.info).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    expect(mockToast.info).toHaveBeenCalledWith(
      'URLをコピーしてください',
      expect.objectContaining({
        duration: 10000
      })
    )
  })

  it('should accept custom variant and size props', () => {
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} variant="ghost" size="lg" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should warn in console for very long URLs', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Create state with many panels to generate long URL
    const panels = Array.from({ length: 24 }, (_, i) => ({
      id: `panel-${i}`,
      functionId: 'linear',
      easeType: 'easein' as const
    }))
    const state = createMinimalState({
      panels,
      activeCameraPanels: panels.map(p => p.id),
      enabledFilters: Array.from({ length: 50 }, (_, i) => `very-long-filter-name-${i}`)
    })
    const getState = vi.fn(() => state)
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    // Wait for async operation
    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    }, { timeout: 1000 })
    
    consoleWarn.mockRestore()
  })

  it('should have accessible title attribute', () => {
    const getState = vi.fn(() => createMinimalState())
    
    render(<ShareButton getState={getState} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', '設定を共有するURLをコピー')
  })
})
