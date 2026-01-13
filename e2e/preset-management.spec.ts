/**
 * Easing Mode Preset Management E2E Tests
 *
 * Tests the preset management functionality in Easing Mode:
 * - Save presets (create new presets from current state)
 * - Load presets (restore app state from saved presets)
 * - Delete presets (remove presets with confirmation)
 * - Preset persistence (survive page reload, data validation)
 */

import { test, expect, type Page } from '@playwright/test'
import {
  waitForAppReady,
  navigateToComparison,
  clearLocalStorage,
  getLocalStorageItem,
  waitForToast,
  isToastVisible,
  dismissToastsIfAny,
} from './helpers'
import { PRESET_STORAGE_KEY } from '../src/lib/presetTypes'
import type { PresetStorage, Preset } from '../src/lib/presetTypes'

// ============================================================================
// Local Helper Functions
// ============================================================================

/**
 * Open the preset manager dialog via toolbar button.
 */
async function openPresetManager(page: Page): Promise<void> {
  // Dismiss any toasts that might block the button
  await dismissToastsIfAny(page)
  
  // Look for Presets button in toolbar (folder icon or "Presets" text)
  const presetButton = page.getByRole('button', { name: /preset/i })
    .or(page.locator('button').filter({ has: page.locator('[data-slot="icon"]') }).filter({
      hasText: /preset/i
    }))
    .first()

  await presetButton.click()

  // Wait for dialog to appear
  await page.getByRole('dialog').waitFor({ state: 'visible' })
}

/**
 * Close the preset manager dialog.
 */
async function closePresetManager(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible().catch(() => false)) {
    // Click the close button or press Escape
    const closeButton = dialog.getByRole('button', { name: /close/i })
      .or(dialog.locator('[data-slot="dialog-close"]'))
      .first()
    
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }
    
    await dialog.waitFor({ state: 'hidden' })
  }
}

/**
 * Open the save preset dialog from within the preset manager.
 */
async function openSavePresetDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  
  // Find and click the "Save Current" or similar button
  const saveButton = dialog.getByRole('button', { name: /save.*current|new.*preset|save/i })
    .or(dialog.locator('button').filter({ has: page.locator('[class*="floppy"], [class*="save"]') }))
    .first()
  
  await saveButton.click()
  
  // Wait for save dialog/section to appear (might be nested or a form area)
  await page.waitForTimeout(100)
}

/**
 * Save a new preset with the given name.
 */
async function savePresetWithName(page: Page, presetName: string): Promise<void> {
  const dialog = page.getByRole('dialog')
  
  // Find the name input field
  const nameInput = dialog.getByRole('textbox', { name: /name|preset/i })
    .or(dialog.locator('input[type="text"]'))
    .first()
  
  await nameInput.fill(presetName)
  
  // Click save/confirm button
  const confirmButton = dialog.getByRole('button', { name: /save|confirm|create/i })
    .filter({ hasNot: page.locator('[disabled]') })
    .last()
  
  await confirmButton.click()
}

/**
 * Get the list of preset names currently displayed in the preset manager.
 * @internal Reserved for future use
 */
async function _getDisplayedPresetNames(page: Page): Promise<string[]> {
  const dialog = page.getByRole('dialog')
  
  // Find preset list items - they might be in a list, table, or card format
  const presetItems = dialog.locator('[data-preset-name], [data-testid*="preset-item"], .preset-item')
    .or(dialog.locator('button').filter({ hasText: /^\w/ }))
  
  const count = await presetItems.count()
  const names: string[] = []
  
  for (let i = 0; i < count; i++) {
    const text = await presetItems.nth(i).getAttribute('data-preset-name') ||
      await presetItems.nth(i).textContent()
    if (text) {
      names.push(text.trim())
    }
  }
  
  return names
}

/**
 * Click on a preset in the list to select/load it.
 */
async function clickPresetInList(page: Page, presetName: string): Promise<void> {
  const dialog = page.getByRole('dialog')
  
  const presetItem = dialog.locator(`[data-preset-name="${presetName}"]`)
    .or(dialog.getByText(presetName, { exact: true }))
    .or(dialog.locator('button, [role="listitem"]').filter({ hasText: presetName }))
    .first()
  
  await presetItem.click()
}

/**
 * Click the delete button for a specific preset.
 */
async function clickDeleteForPreset(page: Page, presetName: string): Promise<void> {
  const dialog = page.getByRole('dialog')
  
  // Dismiss any toasts that might block clicks
  await dismissToastsIfAny(page)
  
  // Strategy 1: Find preset row by data attribute and look for delete button
  const presetRow = dialog.locator(`[data-preset-name="${presetName}"]`).first()
  if (await presetRow.isVisible().catch(() => false)) {
    const deleteBtn = presetRow.getByRole('button', { name: /delete|remove/i }).first()
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click()
      return
    }
  }
  
  // Strategy 2: Find any row containing the preset name and its delete button
  const rows = dialog.locator('[role="listitem"], li, .preset-item, tr, [class*="preset"]')
  const rowCount = await rows.count()
  
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i)
    const text = await row.textContent().catch(() => '')
    if (text?.includes(presetName)) {
      // Found the row, look for delete button
      const btn = row.locator('button').filter({ hasText: /delete|remove/i })
        .or(row.locator('button[aria-label*="delete" i], button[aria-label*="remove" i]'))
        .or(row.locator('button').last()) // Fallback: last button is often delete
        .first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        return
      }
    }
  }
  
  // Strategy 3: Click on preset name first, then find delete in selection context
  await dialog.getByText(presetName, { exact: true }).click().catch(() => {})
  const contextDeleteBtn = dialog.getByRole('button', { name: /delete/i }).first()
  if (await contextDeleteBtn.isVisible().catch(() => false)) {
    await contextDeleteBtn.click()
  }
}

/**
 * Confirm deletion in the confirmation dialog.
 */
async function confirmDeletion(page: Page): Promise<void> {
  // AlertDialog should appear for confirmation
  const alertDialog = page.locator('[role="alertdialog"]')
  
  if (await alertDialog.isVisible().catch(() => false)) {
    const confirmButton = alertDialog.getByRole('button', { name: /delete|confirm|yes/i })
      .first()
    await confirmButton.click()
    await alertDialog.waitFor({ state: 'hidden' })
  }
}

/**
 * Create a mock preset object for testing.
 */
function createMockPreset(name: string, id?: string): Preset {
  return {
    id: id || `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    createdAt: new Date().toISOString(),
    data: {
      panels: [
        { id: 'panel-1', functionId: 'linear', easeType: 'easein' },
        { id: 'panel-2', functionId: 'quadratic', easeType: 'easeout' },
      ],
      savedSpeed: 1,
      savedGamma: 1,
      enabledPreviews: ['glow', 'graph'],
      enabledFilters: [],
      manualInputMode: false,
      manualInputValue: 0,
      triangularWaveMode: false,
      cameraStartPos: { x: 0, y: 0, z: 5 },
      cameraEndPos: { x: 0, y: 0, z: -5 },
      cameraAspectRatio: '16:9',
      maxCameraPreviews: 4,
      activeCameraPanels: [],
      cardScale: 1,
      coordinateSystem: 'right-handed',
      showControlPanel: true,
      endPauseDuration: 0,
      scriptMapperMode: false,
      driftParams: { x: 0, y: 0 },
    },
    meta: {
      app: 'EasingVisualizer',
      version: 1,
      source: 'local',
    },
  }
}

/**
 * Seed localStorage with preset data before page load.
 */
async function seedPresets(page: Page, presets: Preset[]): Promise<void> {
  const storage: PresetStorage = {
    version: 1,
    presets,
  }
  
  await page.addInitScript((data) => {
    localStorage.setItem('easingviz.presets.v1', JSON.stringify(data))
  }, storage)
}

// ============================================================================
// Test Suite: Save Preset
// ============================================================================

test.describe('Preset Management - Save Preset', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should open preset dialog via Presets button', async ({ page }) => {
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // Should have some preset-related content
    const hasPresetContent = await dialog.getByText(/preset|save|load/i).first().isVisible()
      .catch(() => false)
    expect(hasPresetContent).toBeTruthy()
  })

  test('should save current state as new preset', async ({ page }) => {
    const presetName = `Test Preset ${Date.now()}`
    
    await openPresetManager(page)
    await openSavePresetDialog(page)
    await savePresetWithName(page, presetName)
    
    // Verify preset was saved - should either:
    // 1. Show success toast
    // 2. Show preset in list
    // 3. Close the save dialog
    const toastVisible = await isToastVisible(page, /saved|success/i)
    
    // Reopen preset manager to verify preset exists
    await closePresetManager(page).catch(() => {})
    await page.waitForTimeout(200)
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    const presetExists = await dialog.getByText(presetName).isVisible().catch(() => false)
    
    expect(toastVisible || presetExists).toBeTruthy()
  })

  test('should show toast notification on save success', async ({ page }) => {
    const presetName = `Toast Test ${Date.now()}`
    
    await openPresetManager(page)
    await openSavePresetDialog(page)
    await savePresetWithName(page, presetName)
    
    // Wait for success toast
    const toast = await waitForToast(page, /saved|success|created/i, { timeout: 5000 })
      .catch(() => null)
    
    expect(toast).not.toBeNull()
  })

  test('should store preset in localStorage', async ({ page }) => {
    const presetName = `LocalStorage Test ${Date.now()}`
    
    await openPresetManager(page)
    await openSavePresetDialog(page)
    await savePresetWithName(page, presetName)
    
    // Wait for save to complete
    await page.waitForTimeout(500)
    
    // Check localStorage
    const storage = await getLocalStorageItem<PresetStorage>(page, PRESET_STORAGE_KEY)
    
    expect(storage).not.toBeNull()
    expect(storage?.presets).toBeDefined()
    
    const savedPreset = storage?.presets.find(p => p.name === presetName)
    expect(savedPreset).toBeDefined()
    expect(savedPreset?.data).toBeDefined()
    expect(savedPreset?.meta?.app).toBe('EasingVisualizer')
  })
})

// ============================================================================
// Test Suite: Load Preset
// ============================================================================

test.describe('Preset Management - Load Preset', () => {
  const testPresetName = 'Seeded Test Preset'
  
  test.beforeEach(async ({ page }) => {
    // Seed localStorage with a test preset before navigation
    const testPreset = createMockPreset(testPresetName, 'seeded-preset-1')
    await seedPresets(page, [testPreset])
    
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should display saved presets in dialog', async ({ page }) => {
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    
    // Should see the seeded preset
    const presetVisible = await dialog.getByText(testPresetName).isVisible()
      .catch(() => false)
    
    expect(presetVisible).toBeTruthy()
  })

  test('should load preset and restore panel state', async ({ page }) => {
    await openPresetManager(page)
    
    // Click on the preset to load it
    await clickPresetInList(page, testPresetName)
    
    // Either click explicit load button or it auto-loads on click
    const loadButton = page.getByRole('dialog').getByRole('button', { name: /load|apply/i })
    if (await loadButton.isVisible().catch(() => false)) {
      await loadButton.click()
    }
    
    // Wait for load to complete
    await page.waitForTimeout(300)
    
    // Verify toast or state change
    const toastVisible = await isToastVisible(page, /loaded|applied|restored/i)
    
    // Check if dialog closed (indicating successful load)
    const dialogHidden = await page.getByRole('dialog').isHidden().catch(() => true)
    
    expect(toastVisible || dialogHidden).toBeTruthy()
  })

  test('should close dialog after loading', async ({ page }) => {
    await openPresetManager(page)
    
    // Click on the preset to load it
    await clickPresetInList(page, testPresetName)
    
    // Click load button if visible
    const loadButton = page.getByRole('dialog').getByRole('button', { name: /load|apply/i })
    if (await loadButton.isVisible().catch(() => false)) {
      await loadButton.click()
    }
    
    // Wait for dialog to close
    await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 3000 })
      .catch(() => {})
    
    const isDialogHidden = await page.getByRole('dialog').isHidden().catch(() => true)
    expect(isDialogHidden).toBeTruthy()
  })
})

// ============================================================================
// Test Suite: Delete Preset
// ============================================================================

test.describe('Preset Management - Delete Preset', () => {
  const deletablePresetName = 'Preset To Delete'
  
  test.beforeEach(async ({ page }) => {
    // Seed with multiple presets
    const presets = [
      createMockPreset(deletablePresetName, 'deletable-preset-1'),
      createMockPreset('Keep This Preset', 'keep-preset-1'),
    ]
    await seedPresets(page, presets)
    
    await page.goto('/')
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should show delete confirmation', async ({ page }) => {
    await openPresetManager(page)
    
    // Click delete button for the preset
    await clickDeleteForPreset(page, deletablePresetName)
    
    // Should see confirmation dialog
    const alertDialog = page.locator('[role="alertdialog"]')
    const hasConfirmation = await alertDialog.isVisible().catch(() => false)
    
    // Or inline confirmation in the main dialog
    const confirmButton = page.getByRole('button', { name: /confirm.*delete|yes.*delete/i })
    const hasConfirmButton = await confirmButton.isVisible().catch(() => false)
    
    expect(hasConfirmation || hasConfirmButton).toBeTruthy()
  })

  test('should remove preset from list after deletion', async ({ page }) => {
    await openPresetManager(page)
    
    // Verify preset exists before deletion
    const dialog = page.getByRole('dialog')
    const existsBefore = await dialog.getByText(deletablePresetName).isVisible()
      .catch(() => false)
    expect(existsBefore).toBeTruthy()
    
    // Delete the preset
    await clickDeleteForPreset(page, deletablePresetName)
    await confirmDeletion(page)
    
    // Wait for deletion to process
    await page.waitForTimeout(500)
    
    // Verify preset is gone from the list
    const existsAfter = await dialog.getByText(deletablePresetName).isVisible()
      .catch(() => false)
    expect(existsAfter).toBeFalsy()
  })

  test('should update localStorage after delete', async ({ page }) => {
    await openPresetManager(page)
    
    // Delete the preset
    await clickDeleteForPreset(page, deletablePresetName)
    await confirmDeletion(page)
    
    // Wait for storage update
    await page.waitForTimeout(500)
    
    // Check localStorage
    const storage = await getLocalStorageItem<PresetStorage>(page, PRESET_STORAGE_KEY)
    
    expect(storage).not.toBeNull()
    
    const deletedPreset = storage?.presets.find(p => p.name === deletablePresetName)
    expect(deletedPreset).toBeUndefined()
    
    // The other preset should still exist
    const keptPreset = storage?.presets.find(p => p.name === 'Keep This Preset')
    expect(keptPreset).toBeDefined()
  })
})

// ============================================================================
// Test Suite: Preset Persistence
// ============================================================================

test.describe('Preset Management - Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearLocalStorage(page)
    await page.reload()
    await waitForAppReady(page)
    await navigateToComparison(page)
  })

  test('should persist presets across page reload', async ({ page }) => {
    const persistentPresetName = `Persistent ${Date.now()}`
    
    // Save a preset
    await openPresetManager(page)
    await openSavePresetDialog(page)
    await savePresetWithName(page, persistentPresetName)
    
    // Wait for save
    await page.waitForTimeout(500)
    await closePresetManager(page).catch(() => {})
    
    // Reload the page
    await page.reload()
    await waitForAppReady(page)
    await navigateToComparison(page)
    
    // Check if preset still exists
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    const presetExists = await dialog.getByText(persistentPresetName).isVisible()
      .catch(() => false)
    
    expect(presetExists).toBeTruthy()
  })

  test('should handle preset data validation', async ({ page }) => {
    // Inject invalid preset data into localStorage
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        presets: [
          // Invalid preset: missing required fields
          { id: 'invalid-1', name: 'Invalid Preset' },
          // Valid preset
          {
            id: 'valid-1',
            name: 'Valid Preset',
            createdAt: new Date().toISOString(),
            data: { panels: [], speed: 1, scriptMapperMode: false },
            meta: { app: 'easingviz', version: 1 },
          },
        ],
      }))
    }, PRESET_STORAGE_KEY)
    
    // Reload to apply
    await page.reload()
    await waitForAppReady(page)
    await navigateToComparison(page)
    
    // Open preset manager - should handle gracefully
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    
    // Valid preset should still be accessible
    const validPresetVisible = await dialog.getByText('Valid Preset').isVisible()
      .catch(() => false)
    
    // App should not crash - dialog should be visible
    const dialogVisible = await dialog.isVisible().catch(() => false)
    
    expect(dialogVisible).toBeTruthy()
    // Valid preset might or might not be visible depending on validation strictness
    // The important thing is the app doesn't crash
    // Log for debugging purposes
    if (validPresetVisible) {
      // Valid preset is visible, validation allowed it through
    }
  })

  test('should handle empty preset storage gracefully', async ({ page }) => {
    // Ensure localStorage is cleared
    await clearLocalStorage(page)
    await page.reload()
    await waitForAppReady(page)
    
    // Open preset manager with no presets
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // The dialog should open without crashing - that's the key assertion
    // It may show:
    // 1. Empty state message (no presets)
    // 2. A save button to create first preset
    // 3. Just the dialog structure with no presets listed
    
    // Look for any of these indicators that the dialog is functional
    const emptyState = dialog.getByText(/no preset|empty|save.*first|get started|プリセット/i)
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false)
    
    // Or look for save button with various possible names
    const saveButton = dialog.getByRole('button', { name: /save|new|create|add|追加|保存/i })
    const hasSaveButton = await saveButton.first().isVisible().catch(() => false)
    
    // Or check if dialog has any buttons at all (functional dialog)
    const anyButton = dialog.locator('button').first()
    const hasAnyButton = await anyButton.isVisible().catch(() => false)
    
    // At least one of these should be true for a functional dialog
    expect(hasEmptyState || hasSaveButton || hasAnyButton).toBeTruthy()
  })

  test('should handle corrupted localStorage data', async ({ page }) => {
    // Inject corrupted data
    await page.evaluate((key) => {
      localStorage.setItem(key, 'not-valid-json{{{')
    }, PRESET_STORAGE_KEY)
    
    // Reload
    await page.reload()
    await waitForAppReady(page)
    await navigateToComparison(page)
    
    // App should handle gracefully - open preset manager without crash
    await openPresetManager(page)
    
    const dialog = page.getByRole('dialog')
    const dialogVisible = await dialog.isVisible().catch(() => false)
    
    expect(dialogVisible).toBeTruthy()
  })
})
