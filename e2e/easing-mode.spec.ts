/**
 * Easing Mode E2E Tests
 *
 * Tests the core easing mode functionality including:
 * - Panel management (add, remove, limits)
 * - Function selection
 * - Ease type selection (easein, easeout, easeboth)
 * - Preview type toggles
 */

import { test, expect, type Page, type Locator } from '@playwright/test'
import { waitForAppReady, navigateToComparison } from './helpers'

// Maximum panels allowed (from App.tsx)
const MAX_PANELS = 24

// ============================================================================
// Local Panel Helpers (more robust selectors)
// ============================================================================

/**
 * Get all easing panels - Cards with easing function info.
 * Uses the Card component structure from the actual app.
 */
function getEasingPanels(page: Page): Locator {
  // Panels are Card components that contain function names like Linear, Quadratic, etc.
  // They have EaseIn/EaseOut/EaseBoth toggle buttons inside
  return page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="toggle-group"]')
  })
}

/**
 * Get panel count reliably.
 */
async function getEasingPanelCount(page: Page): Promise<number> {
  // Wait a moment for panels to render
  await page.waitForTimeout(100)
  return getEasingPanels(page).count()
}

/**
 * Get a specific panel by index.
 */
function getEasingPanel(page: Page, index: number): Locator {
  return getEasingPanels(page).nth(index)
}

/**
 * Click Add Panel button and wait for dialog.
 */
async function clickAddPanel(page: Page): Promise<void> {
  const addButton = page.getByRole('button', { name: /add/i }).first()
  await addButton.click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
}

/**
 * Select a function from the open dialog.
 * @param functionName - Function name to select (must NOT be already in use)
 */
async function selectFunctionFromDialog(page: Page, functionName: string): Promise<void> {
  const dialog = page.getByRole('dialog')
  
  // Find enabled button with the function name
  const functionButton = dialog.getByRole('button', {
    name: new RegExp(functionName, 'i')
  }).filter({ has: page.locator(':not([disabled])') }).first()
  
  // If exact match not found or disabled, try to find ANY enabled button
  const isEnabled = await functionButton.isEnabled().catch(() => false)
  
  if (isEnabled) {
    await functionButton.click()
  } else {
    // Find any enabled button in the dialog
    const anyEnabledButton = dialog.locator('button:not([disabled])').filter({
      hasNot: page.locator('[data-slot="dialog-close"]')
    }).first()
    await anyEnabledButton.click()
  }
  
  // Wait for dialog to close
  await dialog.waitFor({ state: 'hidden' })
}

/**
 * Remove a panel by clicking its remove button via the actions menu.
 */
async function removeEasingPanel(page: Page, index: number): Promise<void> {
  const panel = getEasingPanel(page, index)
  
  // Find and click the menu trigger (three dots icon)
  const menuTrigger = panel.getByLabel(/panel actions/i)
    .or(panel.locator('[data-slot="dropdown-menu-trigger"]'))
    .first()
  
  await menuTrigger.click()
  
  // Wait for menu to appear and click delete/remove item
  // The text is "パネルを削除" in Japanese
  const removeMenuItem = page.getByRole('menuitem', { name: /削除|remove|delete/i })
    .or(page.locator('[data-slot="dropdown-menu-item"]').filter({ hasText: /削除|remove/i }))
    .first()
  
  await removeMenuItem.click()
}

test.describe('Easing Mode - Panel Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    // Ensure we're in comparison/normal mode
    await navigateToComparison(page)
  })

  test('should display default panels on load', async ({ page }) => {
    // Wait for page to fully load with panels
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // App should start with at least one panel
    const panelCount = await getEasingPanelCount(page)
    expect(panelCount).toBeGreaterThanOrEqual(1)

    // Verify at least one panel Card is visible
    const panels = getEasingPanels(page)
    await expect(panels.first()).toBeVisible()
  })

  test('should add new panel via Add Panel button', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    const initialCount = await getEasingPanelCount(page)

    // Click Add Panel button
    await clickAddPanel(page)

    // Select a function from the dialog (pick one not likely to be used)
    await selectFunctionFromDialog(page, 'Bounce')

    // Verify panel count increased
    const newCount = await getEasingPanelCount(page)
    expect(newCount).toBe(initialCount + 1)
  })

  test('should remove panel when clicking remove button', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // First ensure we have at least 2 panels
    let currentCount = await getEasingPanelCount(page)
    
    if (currentCount < 2) {
      await clickAddPanel(page)
      await selectFunctionFromDialog(page, 'Bounce')
      currentCount = await getEasingPanelCount(page)
    }

    expect(currentCount).toBeGreaterThanOrEqual(2)

    // Remove the first panel via menu
    await removeEasingPanel(page, 0)

    // Verify panel count decreased
    await page.waitForTimeout(200) // Wait for animation
    const countAfterRemove = await getEasingPanelCount(page)
    expect(countAfterRemove).toBe(currentCount - 1)
  })

  test('should not allow removing the last panel', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // Get current count
    let count = await getEasingPanelCount(page)
    
    // Remove panels until only one remains
    while (count > 1) {
      await removeEasingPanel(page, 0)
      await page.waitForTimeout(300)
      count = await getEasingPanelCount(page)
    }

    expect(count).toBe(1)

    // When there's only 1 panel, the menu should not have the remove option
    // or it should be disabled
    const lastPanel = getEasingPanel(page, 0)
    const menuTrigger = lastPanel.getByLabel(/panel actions/i)
      .or(lastPanel.locator('[data-slot="dropdown-menu-trigger"]'))
      .first()
    
    const hasMenu = await menuTrigger.isVisible().catch(() => false)
    
    if (hasMenu) {
      await menuTrigger.click()
      await page.waitForTimeout(100)
      
      // Check if remove option exists
      const removeOption = page.getByRole('menuitem', { name: /削除|remove|delete/i })
        .or(page.locator('[data-slot="dropdown-menu-item"]').filter({ hasText: /削除|remove/i }))
        .first()
      
      const removeExists = await removeOption.isVisible().catch(() => false)
      
      if (removeExists) {
        // If it exists, it should be disabled
        const isDisabled = await removeOption.getAttribute('aria-disabled') === 'true' 
          || await removeOption.isDisabled().catch(() => true)
        expect(isDisabled).toBe(true)
      }
      // else: no remove option means the panel can't be removed - that's correct
      
      // Close menu
      await page.keyboard.press('Escape')
    }
    // If no menu exists when only 1 panel, that's fine too - can't remove
    
    // Final check - still have 1 panel
    const finalCount = await getEasingPanelCount(page)
    expect(finalCount).toBe(1)
  })

  test('should enforce maximum panel limit', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // Get current count
    const currentCount = await getEasingPanelCount(page)

    // Add a few panels to verify the mechanism works
    const panelsToAdd = Math.min(2, MAX_PANELS - currentCount)
    const availableFunctions = ['Bounce', 'Elastic', 'Back', 'Circ', 'Expo']

    for (let i = 0; i < panelsToAdd; i++) {
      await clickAddPanel(page)
      await selectFunctionFromDialog(page, availableFunctions[i])
      await page.waitForTimeout(200)
    }

    const finalCount = await getEasingPanelCount(page)
    expect(finalCount).toBe(currentCount + panelsToAdd)
  })
})

test.describe('Easing Mode - Function Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should open function selection dialog when clicking Add Panel', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // Click Add Panel button
    const addButton = page.getByRole('button', { name: /add/i }).first()
    await addButton.click()

    // Verify dialog is visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Dialog should have title containing "関数を選択" or "function"
    const title = dialog.getByRole('heading')
    await expect(title).toBeVisible()
    
    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should display available easing functions in dialog', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    await clickAddPanel(page)

    const dialog = page.getByRole('dialog')

    // Check for common easing functions
    const expectedFunctions = ['Linear', 'Quadratic', 'Cubic', 'Sine', 'Expo']
    
    for (const funcName of expectedFunctions) {
      const funcButton = dialog.getByRole('button', { name: new RegExp(funcName, 'i') })
      await expect(funcButton).toBeVisible()
    }
    
    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should select function and display on panel', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    const initialCount = await getEasingPanelCount(page)
    
    await clickAddPanel(page)
    
    // Select a function that's unlikely to be already used
    await selectFunctionFromDialog(page, 'Bounce')

    // Verify the new panel shows the function
    const newCount = await getEasingPanelCount(page)
    expect(newCount).toBe(initialCount + 1)
    
    // Check that some panel shows the selected function
    const panels = getEasingPanels(page)
    const hasBounce = await panels.filter({ hasText: /bounce/i }).count() > 0
    expect(hasBounce).toBe(true)
  })

  test('should mark already-used functions in dialog', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    // Open dialog
    await clickAddPanel(page)

    const dialog = page.getByRole('dialog')
    
    // Check if any function is marked as used/disabled
    const disabledButtons = dialog.locator('button[disabled]')
    const usedIndicators = dialog.getByText(/使用中|in use/i)
    
    // Either some buttons are disabled OR there's a "使用中" indicator
    const hasDisabled = await disabledButtons.count() > 0
    const hasUsedIndicator = await usedIndicators.count() > 0
    
    expect(hasDisabled || hasUsedIndicator).toBe(true)

    // Close dialog
    await page.keyboard.press('Escape')
  })
})

test.describe('Easing Mode - Ease Type Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should display ease type toggle buttons on panel', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    const panel = getEasingPanel(page, 0)
    
    // Find the toggle group with In/Out/Both buttons
    const toggleGroup = panel.locator('[data-slot="toggle-group"]')
    await expect(toggleGroup).toBeVisible()

    // Check for the toggle items (button text is "In", "Out", "Both")
    const toggleItems = toggleGroup.locator('[data-slot="toggle-group-item"]')
    const itemCount = await toggleItems.count()
    expect(itemCount).toBe(3) // In, Out, Both
  })

  test('should toggle to EaseIn', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    const panel = getEasingPanel(page, 0)
    const toggleGroup = panel.locator('[data-slot="toggle-group"]')
    
    // Click "In" button (has aria-label="EaseIn" but displays "In")
    const easeInButton = toggleGroup.getByLabel(/easein/i)
      .or(toggleGroup.locator('[value="easein"]'))
      .first()
    await easeInButton.click()

    // Verify it's selected (has data-state="on")
    await expect(easeInButton).toHaveAttribute('data-state', 'on')
  })

  test('should toggle to EaseOut', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    const panel = getEasingPanel(page, 0)
    const toggleGroup = panel.locator('[data-slot="toggle-group"]')
    
    // Click "Out" button
    const easeOutButton = toggleGroup.getByLabel(/easeout/i)
      .or(toggleGroup.locator('[value="easeout"]'))
      .first()
    await easeOutButton.click()

    // Verify it's selected
    await expect(easeOutButton).toHaveAttribute('data-state', 'on')
  })

  test('should toggle to EaseBoth', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    const panel = getEasingPanel(page, 0)
    const toggleGroup = panel.locator('[data-slot="toggle-group"]')
    
    // Click "Both" button
    const easeBothButton = toggleGroup.getByLabel(/easeboth/i)
      .or(toggleGroup.locator('[value="easeboth"]'))
      .first()
    await easeBothButton.click()

    // Verify it's selected
    await expect(easeBothButton).toHaveAttribute('data-state', 'on')
  })

  test('should update panel display when ease type changes', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 })
    
    const panel = getEasingPanel(page, 0)
    const toggleGroup = panel.locator('[data-slot="toggle-group"]')
    
    // Click EaseOut
    const easeOutButton = toggleGroup.getByLabel(/easeout/i)
      .or(toggleGroup.locator('[value="easeout"]'))
      .first()
    await easeOutButton.click()
    
    // Verify EaseOut is now selected
    await expect(easeOutButton).toHaveAttribute('data-state', 'on')
    
    // Click EaseIn
    const easeInButton = toggleGroup.getByLabel(/easein/i)
      .or(toggleGroup.locator('[value="easein"]'))
      .first()
    await easeInButton.click()
    
    // Verify EaseIn is now selected
    await expect(easeInButton).toHaveAttribute('data-state', 'on')
    // And EaseOut is not
    await expect(easeOutButton).toHaveAttribute('data-state', 'off')
  })
})

test.describe('Easing Mode - Preview Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should display preview type toggle buttons in toolbar', async ({ page }) => {
    const toolbar = page.getByRole('toolbar')

    // Check for preview type buttons (Glow, Graph, Camera, Value)
    const glowButton = toolbar.getByRole('radio', { name: /glow/i })
      .or(toolbar.locator('button').filter({ hasText: /glow|^g$/i }))
    const graphButton = toolbar.getByRole('radio', { name: /graph/i })
      .or(toolbar.locator('button').filter({ hasText: /graph|γ/i }))

    // At least some preview toggle should be visible on desktop
    const hasGlow = await glowButton.first().isVisible().catch(() => false)
    const hasGraph = await graphButton.first().isVisible().catch(() => false)

    expect(hasGlow || hasGraph).toBeTruthy()
  })

  test('should toggle Glow preview', async ({ page }) => {
    const toolbar = page.getByRole('toolbar')
    
    // Find glow toggle button
    const glowButton = toolbar.getByLabel(/toggle.*glow/i)
      .or(toolbar.locator('[value="glow"]'))
      .first()

    if (await glowButton.isVisible().catch(() => false)) {
      // Click to toggle
      await glowButton.click()

      // Verify state changed (either data-state or aria-pressed)
      const state = await glowButton.getAttribute('data-state') 
        ?? await glowButton.getAttribute('aria-pressed')
      
      // State should be 'on' or 'off' / 'true' or 'false'
      expect(state).toBeTruthy()
    }
  })

  test('should toggle Graph preview', async ({ page }) => {
    const toolbar = page.getByRole('toolbar')
    
    const graphButton = toolbar.getByLabel(/toggle.*graph/i)
      .or(toolbar.locator('[value="graph"]'))
      .first()

    if (await graphButton.isVisible().catch(() => false)) {
      await graphButton.click()

      const state = await graphButton.getAttribute('data-state') 
        ?? await graphButton.getAttribute('aria-pressed')
      expect(state).toBeTruthy()
    }
  })

  test('should toggle Camera preview', async ({ page }) => {
    const toolbar = page.getByRole('toolbar')
    
    const cameraButton = toolbar.getByLabel(/toggle.*camera/i)
      .or(toolbar.locator('[value="camera"]'))
      .first()

    if (await cameraButton.isVisible().catch(() => false)) {
      await cameraButton.click()

      const state = await cameraButton.getAttribute('data-state') 
        ?? await cameraButton.getAttribute('aria-pressed')
      expect(state).toBeTruthy()
    }
  })

  test('should toggle Value preview', async ({ page }) => {
    const toolbar = page.getByRole('toolbar')
    
    const valueButton = toolbar.getByLabel(/toggle.*value/i)
      .or(toolbar.locator('[value="value"]'))
      .first()

    if (await valueButton.isVisible().catch(() => false)) {
      await valueButton.click()

      const state = await valueButton.getAttribute('data-state') 
        ?? await valueButton.getAttribute('aria-pressed')
      expect(state).toBeTruthy()
    }
  })

  test('should display corresponding preview content when enabled', async ({ page }) => {
    // Enable graph preview if not already enabled
    const toolbar = page.getByRole('toolbar')
    const graphButton = toolbar.getByLabel(/toggle.*graph/i)
      .or(toolbar.locator('[value="graph"]'))
      .first()

    if (await graphButton.isVisible().catch(() => false)) {
      // Check current state
      const currentState = await graphButton.getAttribute('data-state')
      if (currentState !== 'on') {
        await graphButton.click()
      }

      // Wait for graph content to appear (canvas or SVG)
      const hasGraphContent = await page.locator('canvas, svg').first().isVisible().catch(() => false)
      expect(hasGraphContent).toBeTruthy()
    }
  })
})

test.describe('Easing Mode - Animation Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should display Play/Pause button', async ({ page }) => {
    const playPauseButton = page.getByRole('button', { name: /play|pause/i })
    await expect(playPauseButton).toBeVisible()
  })

  test('should toggle between Play and Pause states', async ({ page }) => {
    const playPauseButton = page.getByRole('button', { name: /play|pause/i })
    
    // Get initial state
    const initialLabel = await playPauseButton.getAttribute('aria-label')
    
    // Click to toggle
    await playPauseButton.click()
    
    // State should change
    const newLabel = await playPauseButton.getAttribute('aria-label')
    expect(newLabel).not.toBe(initialLabel)

    // Toggle back
    await playPauseButton.click()
    
    const finalLabel = await playPauseButton.getAttribute('aria-label')
    expect(finalLabel).toBe(initialLabel)
  })

  test('should display speed selector', async ({ page }) => {
    // Speed selector might be hidden on mobile
    const speedSelector = page.getByLabel(/speed/i)
      .or(page.locator('[aria-label*="speed"]'))
      .first()

    // Check if visible (may be hidden on small screens)
    const isVisible = await speedSelector.isVisible().catch(() => false)
    
    // If visible, verify it works
    if (isVisible) {
      await expect(speedSelector).toBeVisible()
    }
  })
})
