/**
 * Shared E2E Test Helpers
 *
 * Reusable helper functions for Playwright E2E tests.
 * Uses role-based selectors and await patterns (no hardcoded timeouts).
 */

import type { Page, Locator } from '@playwright/test'

// ============================================================================
// App Initialization Helpers
// ============================================================================

/**
 * Wait for the app to be fully loaded and ready for interaction.
 * Uses multiple fallback strategies to detect app readiness.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for DOM content loaded first
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
  
  // Wait for main content area (always present)
  await page.locator('#main-content').waitFor({ 
    state: 'attached', 
    timeout: 15000 
  })
  
  // Wait for either:
  // 1. Panel cards to be visible (normal mode with panels)
  // 2. Empty state (when no panels)
  // 3. ScriptMapper mode controls
  const panelCards = page.locator('[data-slot="card"]')
  const emptyState = page.locator('text=パネルがありません')
  const scriptMapperControls = page.locator('text=Third Person View')
  
  // Wait for any of these to appear, indicating app is rendered
  await Promise.race([
    panelCards.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    emptyState.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    scriptMapperControls.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  ])
  
  // Final check: toolbar should be visible (Play/Pause button)
  await page.getByRole('button', { name: /play|pause/i }).first().waitFor({ 
    state: 'visible', 
    timeout: 10000 
  })
}

// ============================================================================
// Panel Helpers
// ============================================================================

/**
 * Get all easing panels in the comparison grid.
 */
export function getAllPanels(page: Page): Locator {
  // Panels are Card components with data-slot="card" containing toggle-group
  return page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="toggle-group"]')
  })
}

/**
 * Get a specific panel by index (0-based).
 */
export async function getPanel(page: Page, index: number): Promise<Locator> {
  const panels = getAllPanels(page)
  return panels.nth(index)
}

/**
 * Get the panel count.
 */
export async function getPanelCount(page: Page): Promise<number> {
  return getAllPanels(page).count()
}

/**
 * Add a new panel via the Add Panel button in the toolbar.
 */
export async function addPanel(page: Page): Promise<void> {
  // Look for the Add Panel button (Plus icon)
  const addButton = page.getByRole('button', { name: /add panel|add|plus/i })
    .or(page.locator('button').filter({ has: page.locator('svg') }).filter({
      hasText: /add/i
    }))
    .first()

  await addButton.click()

  // Wait for function selector dialog to appear
  await page.getByRole('dialog').waitFor({ state: 'visible' })
}

/**
 * Remove a panel by index.
 * Does not work if it's the last panel (button will be disabled).
 */
export async function removePanel(page: Page, index: number): Promise<void> {
  const panel = await getPanel(page, index)
  const removeButton = panel.getByRole('button', { name: /remove|delete|close/i })
    .or(panel.locator('button').filter({ has: page.locator('[class*="close"], [class*="x"]') }))
    .first()

  await removeButton.click()
}

/**
 * Clear all panels except the last one (since at least one panel must remain).
 */
export async function clearAllPanels(page: Page): Promise<void> {
  let count = await getPanelCount(page)

  // Remove panels until only one remains
  while (count > 1) {
    await removePanel(page, 0)
    count = await getPanelCount(page)
  }
}

// ============================================================================
// Function Selection Helpers
// ============================================================================

/**
 * Open the function selector dialog.
 */
export async function openFunctionSelector(page: Page): Promise<void> {
  await addPanel(page)
}

/**
 * Select an easing function from the function selector dialog.
 * The dialog must already be open.
 *
 * @param page - Playwright page
 * @param functionIdOrName - Either the function ID (e.g., 'quadratic') or display name (e.g., 'Quadratic')
 */
export async function selectFunction(
  page: Page,
  functionIdOrName: string
): Promise<void> {
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })

  // Find the function button by name (case-insensitive)
  const functionButton = dialog.getByRole('button', {
    name: new RegExp(functionIdOrName, 'i')
  }).first()

  await functionButton.click()

  // Wait for dialog to close
  await dialog.waitFor({ state: 'hidden' })
}

/**
 * Select an easing function for a specific panel.
 * Opens the function selector, selects the function, and waits for the panel to update.
 *
 * @param page - Playwright page
 * @param panelIndex - Panel index to update (note: new panel is added, not replacing)
 * @param functionIdOrName - Function ID or display name
 */
export async function selectFunctionForPanel(
  page: Page,
  _panelIndex: number,
  functionIdOrName: string
): Promise<void> {
  await openFunctionSelector(page)
  await selectFunction(page, functionIdOrName)
}

// ============================================================================
// Ease Type Helpers
// ============================================================================

/**
 * Select an ease type for a specific panel.
 *
 * @param page - Playwright page
 * @param panelIndex - Panel index (0-based)
 * @param easeType - Ease type: 'easein' | 'easeout' | 'easeboth'
 */
export async function selectEaseType(
  page: Page,
  panelIndex: number,
  easeType: 'easein' | 'easeout' | 'easeboth'
): Promise<void> {
  const panel = await getPanel(page, panelIndex)

  // Find the toggle group within the panel
  const toggleGroup = panel.getByRole('group').first()

  // Map ease type to button text
  const buttonText = {
    easein: /in|ease\s*in/i,
    easeout: /out|ease\s*out/i,
    easeboth: /both|in.*out|ease\s*both/i,
  }[easeType]

  const easeButton = toggleGroup.getByRole('radio', { name: buttonText })
    .or(toggleGroup.locator('button').filter({ hasText: buttonText }))
    .first()

  await easeButton.click()
}

/**
 * Get the currently selected ease type for a panel.
 */
export async function getSelectedEaseType(
  page: Page,
  panelIndex: number
): Promise<'easein' | 'easeout' | 'easeboth' | null> {
  const panel = await getPanel(page, panelIndex)
  const toggleGroup = panel.getByRole('group').first()

  // Check which button has the active/pressed state
  const inButton = toggleGroup.locator('[data-state="on"], [aria-pressed="true"]').filter({
    hasText: /^in$/i
  })
  const outButton = toggleGroup.locator('[data-state="on"], [aria-pressed="true"]').filter({
    hasText: /^out$/i
  })
  const bothButton = toggleGroup.locator('[data-state="on"], [aria-pressed="true"]').filter({
    hasText: /both|in.*out/i
  })

  if (await inButton.isVisible().catch(() => false)) return 'easein'
  if (await outButton.isVisible().catch(() => false)) return 'easeout'
  if (await bothButton.isVisible().catch(() => false)) return 'easeboth'

  return null
}

// ============================================================================
// Mode Navigation Helpers
// ============================================================================

/**
 * Navigate to ScriptMapper mode.
 */
export async function navigateToScriptMapper(page: Page): Promise<void> {
  // Look for ScriptMapper tab/button in the mode switcher
  const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    .or(page.getByRole('button', { name: /scriptmapper/i }))
    .or(page.locator('[data-value="scriptmapper"]'))
    .first()

  if (await scriptMapperTab.isVisible().catch(() => false)) {
    await scriptMapperTab.click()
    // Wait for mode switch to complete
    await page.waitForSelector('[data-mode="scriptmapper"], [class*="scriptmapper"]', {
      timeout: 3000
    }).catch(() => {
      // Mode indicator may not exist, continue anyway
    })
  }
}

/**
 * Navigate to Comparison mode (normal mode).
 */
export async function navigateToComparison(page: Page): Promise<void> {
  // Look for Comparison/Normal tab/button
  const comparisonTab = page.getByRole('tab', { name: /comparison|normal|easing/i })
    .or(page.getByRole('button', { name: /comparison|normal/i }))
    .or(page.locator('[data-value="normal"]'))
    .first()

  if (await comparisonTab.isVisible().catch(() => false)) {
    await comparisonTab.click()
  }
}

// ============================================================================
// Preset Manager Helpers
// ============================================================================

/**
 * Open the preset manager dialog.
 */
export async function openPresetManager(page: Page): Promise<void> {
  // Look for preset button in toolbar
  const presetButton = page.getByRole('button', { name: /preset|folder|load/i })
    .or(page.locator('button').filter({ has: page.locator('[class*="folder"]') }))
    .first()

  await presetButton.click()

  // Wait for dialog to appear
  await page.getByRole('dialog').waitFor({ state: 'visible' })
}

/**
 * Save current state as a preset.
 *
 * @param page - Playwright page
 * @param presetName - Name for the new preset
 */
export async function savePreset(page: Page, presetName: string): Promise<void> {
  await openPresetManager(page)

  const dialog = page.getByRole('dialog')

  // Find the name input
  const nameInput = dialog.getByRole('textbox', { name: /name|preset/i })
    .or(dialog.locator('input[type="text"]'))
    .first()

  await nameInput.fill(presetName)

  // Click save button
  const saveButton = dialog.getByRole('button', { name: /save/i }).first()
  await saveButton.click()
}

/**
 * Load a preset by name.
 *
 * @param page - Playwright page
 * @param presetName - Name of the preset to load
 */
export async function loadPreset(page: Page, presetName: string): Promise<void> {
  await openPresetManager(page)

  const dialog = page.getByRole('dialog')

  // Find and click the preset in the list
  const presetItem = dialog.getByText(presetName, { exact: true })
    .or(dialog.locator(`[data-preset-name="${presetName}"]`))
    .first()

  await presetItem.click()

  // Click load button if separate from list click
  const loadButton = dialog.getByRole('button', { name: /load|apply/i })
  if (await loadButton.isVisible().catch(() => false)) {
    await loadButton.click()
  }

  // Wait for dialog to close
  await dialog.waitFor({ state: 'hidden' })
}

/**
 * Delete a preset by name.
 *
 * @param page - Playwright page
 * @param presetName - Name of the preset to delete
 */
export async function deletePreset(page: Page, presetName: string): Promise<void> {
  await openPresetManager(page)

  const dialog = page.getByRole('dialog')

  // Find the preset row/item
  const presetRow = dialog.locator(`[data-preset-name="${presetName}"]`)
    .or(dialog.locator('li, [role="listitem"]').filter({ hasText: presetName }))
    .first()

  // Click delete button within the row
  const deleteButton = presetRow.getByRole('button', { name: /delete|remove|trash/i })
    .or(presetRow.locator('button').filter({ has: page.locator('[class*="trash"]') }))
    .first()

  await deleteButton.click()

  // Handle confirmation dialog if present
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i })
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click()
  }
}

// ============================================================================
// LocalStorage Helpers
// ============================================================================

/**
 * Get an item from localStorage.
 *
 * @param page - Playwright page
 * @param key - Storage key
 * @returns The stored value or null if not found
 */
export async function getLocalStorageItem<T = unknown>(
  page: Page,
  key: string
): Promise<T | null> {
  return page.evaluate((k) => {
    const item = localStorage.getItem(k)
    if (item === null) return null
    try {
      return JSON.parse(item) as T
    } catch {
      return item as T
    }
  }, key)
}

/**
 * Set an item in localStorage.
 *
 * @param page - Playwright page
 * @param key - Storage key
 * @param value - Value to store (will be JSON-serialized)
 */
export async function setLocalStorageItem(
  page: Page,
  key: string,
  value: unknown
): Promise<void> {
  await page.evaluate(
    ({ k, v }) => {
      localStorage.setItem(k, JSON.stringify(v))
    },
    { k: key, v: value }
  )
}

/**
 * Remove an item from localStorage.
 *
 * @param page - Playwright page
 * @param key - Storage key to remove
 */
export async function removeLocalStorageItem(page: Page, key: string): Promise<void> {
  await page.evaluate((k) => {
    localStorage.removeItem(k)
  }, key)
}

/**
 * Clear all localStorage items.
 *
 * @param page - Playwright page
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
  })
}

/**
 * Generate a storage context script for seeding localStorage before navigation.
 * Use with page.addInitScript() to set up state before the app loads.
 *
 * @param data - Object mapping storage keys to values
 * @returns Script string to use with addInitScript
 */
export function seedLocalStorageScript(data: Record<string, unknown>): string {
  return `
    (() => {
      const data = ${JSON.stringify(data)};
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    })();
  `
}

/**
 * Seed localStorage with data before page navigation.
 * Must be called before page.goto().
 *
 * @param page - Playwright page
 * @param data - Object mapping storage keys to values
 */
export async function seedLocalStorage(
  page: Page,
  data: Record<string, unknown>
): Promise<void> {
  await page.addInitScript(seedLocalStorageScript(data))
}

// ============================================================================
// URL State Helpers
// ============================================================================

/**
 * Get the current URL search params.
 */
export async function getURLParams(page: Page): Promise<URLSearchParams> {
  const url = page.url()
  return new URL(url).searchParams
}

/**
 * Check if URL contains a shared state parameter.
 */
export async function hasSharedState(page: Page): Promise<boolean> {
  const params = await getURLParams(page)
  return params.has('s')
}

/**
 * Get the shared state value from URL.
 */
export async function getSharedState(page: Page): Promise<string | null> {
  const params = await getURLParams(page)
  return params.get('s')
}

// ============================================================================
// Animation Control Helpers
// ============================================================================

/**
 * Toggle play/pause state.
 */
export async function togglePlayPause(page: Page): Promise<void> {
  const playPauseButton = page.getByRole('button', { name: /play|pause/i }).first()
  await playPauseButton.click()
}

/**
 * Set the animation speed.
 *
 * @param page - Playwright page
 * @param speed - Speed multiplier (e.g., 0.5, 1, 2)
 */
export async function setAnimationSpeed(page: Page, speed: number): Promise<void> {
  // Find the speed selector/dropdown
  const speedSelector = page.getByRole('combobox', { name: /speed/i })
    .or(page.locator('[data-speed-selector]'))
    .first()

  await speedSelector.click()

  // Select the speed option
  const speedOption = page.getByRole('option', { name: new RegExp(`${speed}x`, 'i') })
    .or(page.locator(`[data-value="${speed}"]`))
    .first()

  await speedOption.click()
}

// ============================================================================
// Share Helpers
// ============================================================================

/**
 * Click the share button and copy URL to clipboard.
 */
export async function shareCurrentState(page: Page): Promise<void> {
  const shareButton = page.getByRole('button', { name: /share|export|copy.*url/i }).first()
  await shareButton.click()
}

/**
 * Dismiss the URL preview banner (when loading a shared URL).
 */
export async function dismissPreviewBanner(page: Page): Promise<void> {
  const dismissButton = page.getByRole('button', { name: /dismiss|close|apply/i })
    .or(page.locator('[data-testid="dismiss-banner"]'))
    .first()

  if (await dismissButton.isVisible().catch(() => false)) {
    await dismissButton.click()
  }
}

// ============================================================================
// Toast/Notification Helpers
// ============================================================================

/**
 * Wait for a toast notification with specific text.
 *
 * @param page - Playwright page
 * @param textPattern - Text pattern to match in the toast
 * @param options - Wait options
 */
export async function waitForToast(
  page: Page,
  textPattern: RegExp | string,
  options: { timeout?: number } = {}
): Promise<Locator> {
  const pattern = typeof textPattern === 'string' ? new RegExp(textPattern, 'i') : textPattern
  const toast = page.getByRole('status')
    .or(page.locator('[data-sonner-toast]'))
    .or(page.locator('[role="alert"]'))
    .filter({ hasText: pattern })
    .first()

  await toast.waitFor({ state: 'visible', timeout: options.timeout ?? 5000 })
  return toast
}

/**
 * Check if a toast with specific text is visible.
 */
export async function isToastVisible(page: Page, textPattern: RegExp | string): Promise<boolean> {
  try {
    await waitForToast(page, textPattern, { timeout: 1000 })
    return true
  } catch {
    return false
  }
}

/**
 * Dismiss all visible toast notifications.
 * Useful before performing actions that might be blocked by toasts.
 */
export async function dismissAllToasts(page: Page): Promise<void> {
  // Wait a moment for any pending toasts to appear
  await page.waitForTimeout(100)
  
  // Click all dismiss buttons on toasts
  const toasts = page.locator('[data-sonner-toast]')
  const count = await toasts.count()
  
  for (let i = 0; i < count; i++) {
    const toast = toasts.nth(i)
    const closeButton = toast.locator('button[aria-label="Close"], [data-close-button]').first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click().catch(() => {})
    }
  }
  
  // Wait for toasts to animate out
  if (count > 0) {
    await page.waitForTimeout(300)
  }
}

/**
 * Dismiss any visible toasts if present, without error.
 * Lighter-weight alternative to dismissAllToasts for use before UI interactions.
 * Does not wait or fail if no toasts are present.
 */
export async function dismissToastsIfAny(page: Page): Promise<void> {
  try {
    // Find visible toasts using multiple selectors
    const toasts = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
    const count = await toasts.count().catch(() => 0)
    
    if (count === 0) return
    
    // Try clicking outside any toast to dismiss (toasts often dismiss on click-away)
    // Or click close buttons if available
    for (let i = 0; i < count; i++) {
      const toast = toasts.nth(i)
      if (await toast.isVisible().catch(() => false)) {
        const closeButton = toast.locator('button').first()
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click().catch(() => {})
        }
      }
    }
    
    // Brief wait for animation
    await page.waitForTimeout(150)
  } catch {
    // Silently ignore any errors - toasts are not critical to dismiss
  }
}

/**
 * Wait for all toasts to disappear naturally.
 */
export async function waitForToastsToDisappear(page: Page): Promise<void> {
  await page.locator('[data-sonner-toast]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
    // If no toasts exist, that's fine
  })
}

/**
 * Clear URL state by navigating to base URL.
 */
export async function clearURLState(page: Page): Promise<void> {
  const currentUrl = new URL(page.url())
  if (currentUrl.searchParams.has('state')) {
    // Navigate to base URL without state parameter
    await page.goto(currentUrl.origin + currentUrl.pathname)
    await waitForAppReady(page)
  }
}
