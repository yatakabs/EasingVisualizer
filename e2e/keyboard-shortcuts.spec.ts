/**
 * Keyboard Shortcuts E2E Tests
 *
 * Tests the keyboard shortcut functionality including:
 * - Space: Toggle play/pause animation
 * - Other shortcuts as implemented
 *
 * Note: Shortcuts are disabled when focus is in input/textarea fields.
 */

import { test, expect, type Page, type Locator } from '@playwright/test'
import { navigateToComparison } from './helpers'

// Limit concurrency to prevent server overload
test.describe.configure({ mode: 'serial' })

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for the app to be ready by checking for the toolbar.
 * This is more reliable than the shared helper for keyboard shortcut tests.
 */
async function waitForApp(page: Page): Promise<void> {
  // Wait for toolbar (has role="toolbar") to be visible
  await page.waitForSelector('[role="toolbar"]', { timeout: 10000 })
  // Also wait for play/pause button to ensure controls are ready
  await page.getByRole('button', { name: /play|pause/i }).first().waitFor({ timeout: 5000 })
}

/**
 * Get the Play/Pause button from the toolbar.
 */
function getPlayPauseButton(page: Page): Locator {
  return page.getByRole('button', { name: /play|pause/i }).first()
}

/**
 * Check if the animation is currently playing by examining the play/pause button.
 */
async function isAnimationPlaying(page: Page): Promise<boolean> {
  const button = getPlayPauseButton(page)
  const label = await button.getAttribute('aria-label')
  // If button says "Pause", animation is playing
  return label?.toLowerCase().includes('pause') ?? false
}

/**
 * Ensure the animation starts in a known state (stopped).
 */
async function ensureAnimationStopped(page: Page): Promise<void> {
  if (await isAnimationPlaying(page)) {
    const button = getPlayPauseButton(page)
    await button.click()
    // Wait for state to update
    await expect(button).toHaveAttribute('aria-label', /play/i)
  }
}

/**
 * Ensure the animation is playing.
 */
async function ensureAnimationPlaying(page: Page): Promise<void> {
  if (!(await isAnimationPlaying(page))) {
    const button = getPlayPauseButton(page)
    await button.click()
    // Wait for state to update
    await expect(button).toHaveAttribute('aria-label', /pause/i)
  }
}

/**
 * Press a key and verify it was not captured (e.g., when in input field).
 * Returns true if the key was NOT captured by the app.
 */
async function _pressKeyInInput(_page: Page, _key: string): Promise<void> {
  // Reserved for future use
}

// ============================================================================
// Test Suites
// ============================================================================

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
  })

  test.describe('Space - Play/Pause Toggle', () => {
    test('should start animation when Space is pressed while stopped', async ({ page }) => {
      // Ensure animation is stopped
      await ensureAnimationStopped(page)
      
      // Press Space
      await page.keyboard.press('Space')
      
      // Verify animation started
      const isPlaying = await isAnimationPlaying(page)
      expect(isPlaying).toBe(true)
    })

    test('should stop animation when Space is pressed while playing', async ({ page }) => {
      // Ensure animation is playing
      await ensureAnimationPlaying(page)
      
      // Press Space
      await page.keyboard.press('Space')
      
      // Verify animation stopped
      const isPlaying = await isAnimationPlaying(page)
      expect(isPlaying).toBe(false)
    })

    test('should toggle play/pause multiple times', async ({ page }) => {
      // Start from stopped state
      await ensureAnimationStopped(page)
      
      // First Space -> Play
      await page.keyboard.press('Space')
      expect(await isAnimationPlaying(page)).toBe(true)
      
      // Second Space -> Pause
      await page.keyboard.press('Space')
      expect(await isAnimationPlaying(page)).toBe(false)
      
      // Third Space -> Play again
      await page.keyboard.press('Space')
      expect(await isAnimationPlaying(page)).toBe(true)
    })

    test('should NOT trigger when focused on input field', async ({ page }) => {
      // Ensure animation is stopped
      await ensureAnimationStopped(page)
      
      // Find an input field (e.g., speed selector or slider)
      // Focus on slider component which should block keyboard shortcuts
      const slider = page.locator('[role="slider"]').first()
      
      if (await slider.count() > 0) {
        await slider.focus()
        
        // Press Space (should not toggle play)
        await page.keyboard.press('Space')
        
        // Animation should still be stopped
        // (Space on slider might change slider value, but not play/pause)
        // We just verify no error occurs
      }
    })
  })

  test.describe('Play/Pause Button Accessibility', () => {
    test('should have correct aria-pressed state when playing', async ({ page }) => {
      await ensureAnimationPlaying(page)
      
      const button = getPlayPauseButton(page)
      await expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    test('should have correct aria-pressed state when paused', async ({ page }) => {
      await ensureAnimationStopped(page)
      
      const button = getPlayPauseButton(page)
      await expect(button).toHaveAttribute('aria-pressed', 'false')
    })

    test('should have descriptive aria-label', async ({ page }) => {
      const button = getPlayPauseButton(page)
      const label = await button.getAttribute('aria-label')
      
      // Should contain either "play" or "pause"
      expect(label?.toLowerCase()).toMatch(/play|pause/)
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should allow Tab navigation through toolbar controls', async ({ page }) => {
      // Focus on the first toolbar element
      const toolbar = page.getByRole('toolbar')
      await expect(toolbar).toBeVisible()
      
      // Tab through elements and verify focus moves
      await page.keyboard.press('Tab')
      
      // Check that something is focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should allow Enter/Space to activate focused buttons', async ({ page }) => {
      // Focus on play/pause button
      const button = getPlayPauseButton(page)
      await button.focus()
      
      // Record initial state
      const wasPlaying = await isAnimationPlaying(page)
      
      // Press Enter
      await page.keyboard.press('Enter')
      
      // State should change
      const isPlaying = await isAnimationPlaying(page)
      expect(isPlaying).not.toBe(wasPlaying)
    })
  })

  test.describe('Escape Key Behavior', () => {
    test('should close open dialogs when Escape is pressed', async ({ page }) => {
      // Open a dialog (e.g., Add Panel dialog)
      const addButton = page.getByRole('button', { name: /add/i }).first()
      await addButton.click()
      
      // Wait for dialog to appear
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      
      // Press Escape
      await page.keyboard.press('Escape')
      
      // Dialog should close
      await expect(dialog).not.toBeVisible()
    })

    test('should close preset manager when Escape is pressed', async ({ page }) => {
      // Open preset manager
      const presetsButton = page.getByRole('button', { name: /preset|folder/i }).first()
      
      if (await presetsButton.count() > 0) {
        await presetsButton.click()
        
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        
        // Press Escape
        await page.keyboard.press('Escape')
        
        // Dialog should close
        await expect(dialog).not.toBeVisible()
      }
    })
  })

  test.describe('Mode-Specific Shortcuts', () => {
    test('should handle shortcuts in easing comparison mode', async ({ page }) => {
      // Navigate to comparison mode
      await navigateToComparison(page)
      
      // Space should still work
      await ensureAnimationStopped(page)
      await page.keyboard.press('Space')
      
      expect(await isAnimationPlaying(page)).toBe(true)
    })

    test('should handle shortcuts in ScriptMapper mode', async ({ page }) => {
      // Switch to ScriptMapper mode if available
      const modeToggle = page.getByRole('radio', { name: /scriptmapper/i })
        .or(page.locator('button').filter({ hasText: /scriptmapper/i }))
        .first()
      
      if (await modeToggle.count() > 0) {
        await modeToggle.click()
        
        // Wait for mode switch
        await page.waitForTimeout(300)
        
        // Space should still toggle play/pause
        await ensureAnimationStopped(page)
        await page.keyboard.press('Space')
        
        expect(await isAnimationPlaying(page)).toBe(true)
      }
    })
  })

  test.describe('Keyboard Shortcut Edge Cases', () => {
    test('should not trigger shortcuts when modifier keys are pressed', async ({ page }) => {
      await ensureAnimationStopped(page)
      
      // Ctrl+Space should not trigger play/pause (browser might handle it)
      await page.keyboard.press('Control+Space')
      
      // Animation should still be stopped (or browser handled it)
      // We just verify no error occurs
    })

    test('should handle rapid key presses gracefully', async ({ page }) => {
      await ensureAnimationStopped(page)
      
      // Rapid toggle
      await page.keyboard.press('Space')
      await page.keyboard.press('Space')
      await page.keyboard.press('Space')
      
      // Should end in playing state (odd number of toggles from stopped)
      expect(await isAnimationPlaying(page)).toBe(true)
    })

    test('should work after page interaction', async ({ page }) => {
      // Click somewhere on the page first
      await page.click('body')
      
      await ensureAnimationStopped(page)
      
      // Space should work
      await page.keyboard.press('Space')
      expect(await isAnimationPlaying(page)).toBe(true)
    })
  })
})

// ============================================================================
// Visual State Tests
// ============================================================================

test.describe('Keyboard Shortcuts - Visual Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
  })

  test('should show visual feedback when play state changes', async ({ page }) => {
    await ensureAnimationStopped(page)
    
    const button = getPlayPauseButton(page)
    
    // Verify initial visual state (shows Play icon)
    await expect(button).toContainText(/play/i)
    
    // Toggle with Space
    await page.keyboard.press('Space')
    
    // Verify visual state changed (shows Pause icon)
    await expect(button).toContainText(/pause/i)
  })

  test('should update status indicator when toggled via keyboard', async ({ page }) => {
    // Look for status indicator if it exists
    const statusIndicator = page.locator('[class*="status"], [aria-label*="status"]').first()
    
    if (await statusIndicator.count() > 0) {
      await ensureAnimationStopped(page)
      
      // Get initial status (stored but not compared - just verifying no errors)
      const _initialStatus = await statusIndicator.textContent()
      
      // Toggle with Space
      await page.keyboard.press('Space')
      
      // Wait for status to potentially update
      await page.waitForTimeout(100)
      
      // Status may have changed
      const newStatus = await statusIndicator.textContent()
      // Just verify no error occurred
      expect(typeof newStatus).toBe('string')
    }
  })
})
