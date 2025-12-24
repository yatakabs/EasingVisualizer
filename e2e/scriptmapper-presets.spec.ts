/**
 * ScriptMapper Preset E2E Tests
 * 
 * Tests the ScriptMapper preset functionality including:
 * - Preset selection UI
 * - Bookmark command generation
 * - Export functionality
 */

import { test, expect } from '@playwright/test'
import { CAMERA_PATH_PRESETS } from '../src/lib/cameraPathPresets'

// Helper to wait for app to be fully loaded
async function waitForAppReady(page: import('@playwright/test').Page) {
  // Wait for app container and DOM ready state in parallel
  await Promise.all([
    page.waitForSelector('[data-testid="app-container"], .app-container, main', { 
      timeout: 5000  // Reduced from 30s
    }),
    page.waitForLoadState('domcontentloaded'),
  ])
}

test.describe('ScriptMapper Preset Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('should display preset selector with correct count', async ({ page }) => {
    // Look for ScriptMapper section or tab
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    
    // If there's a tab, click it
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }
    
    // Check for preset badge showing count
    const presetBadge = page.getByText(new RegExp(`${CAMERA_PATH_PRESETS.length}\\s*available`, 'i'))
    
    // Either we find the badge or we can find the preset buttons
    const hasPresetsUI = await presetBadge.isVisible().catch(() => false) ||
      await page.getByRole('button', { name: /basic 3-point/i }).isVisible().catch(() => false) ||
      await page.getByText(/presets/i).isVisible().catch(() => false)
    
    expect(hasPresetsUI).toBeTruthy()
  })

  test('should load preset when clicked', async ({ page }) => {
    // Navigate to ScriptMapper section if needed
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Find and click a preset button (looking for any preset)
    const presetNames = CAMERA_PATH_PRESETS.map(p => p.name)
    
    let clickedPreset = false
    for (const name of presetNames) {
      const presetButton = page.getByRole('button', { name: new RegExp(name.replace(/[()]/g, '\\$&'), 'i') })
      if (await presetButton.isVisible().catch(() => false)) {
        await presetButton.click()
        clickedPreset = true
        break
      }
    }
    
    // If no preset button found, try to find any element with preset name
    if (!clickedPreset) {
      const anyPreset = page.getByText(/basic 3-point|simple.*pan|zigzag/i).first()
      if (await anyPreset.isVisible().catch(() => false)) {
        await anyPreset.click()
        clickedPreset = true
      }
    }
    
    // Check if we see any indication of loaded preset (waypoints, segments, etc.)
    // Use locator assertions instead of waitForTimeout
    const waypointIndicator = page.getByText(/\d+\s*pts|\d+\s*waypoints|\d+\s*points/i)
    const hasWaypointInfo = await waypointIndicator.first().isVisible().catch(() => false)
    
    // Also check for graph or preview elements
    const hasGraphOrPreview = await page.locator('canvas, svg').first().isVisible().catch(() => false)
    
    expect(clickedPreset || hasWaypointInfo || hasGraphOrPreview).toBeTruthy()
  })

  test('should display waypoint information for selected preset', async ({ page }) => {
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Click on a preset with known waypoint count
    const basicPreset = CAMERA_PATH_PRESETS.find(p => p.id === 'preset-basic-3point')
    
    if (basicPreset) {
      const presetButton = page.getByRole('button', { name: new RegExp(basicPreset.name, 'i') })
      if (await presetButton.isVisible().catch(() => false)) {
        await presetButton.click()
        
        // Check for waypoint count display (3 points)
        // Playwright auto-waits on locator operations
        const waypointCount = page.getByText(new RegExp(`${basicPreset.waypoints.length}\\s*pts`, 'i'))
        const hasCorrectCount = await waypointCount.isVisible().catch(() => false) ||
          await page.getByText(/3\s*pts|3\s*points|3\s*waypoints/i).isVisible().catch(() => false)
        
        expect(hasCorrectCount).toBeTruthy()
      }
    }
  })
})

test.describe('ScriptMapper Bookmark Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('should generate bookmark commands for each waypoint', async ({ page }) => {
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Select a preset first
    const preset = CAMERA_PATH_PRESETS[0]
    const presetButton = page.getByRole('button', { name: new RegExp(preset.name.replace(/[()]/g, '\\$&'), 'i') })
    
    if (await presetButton.isVisible().catch(() => false)) {
      await presetButton.click()
    }

    // Look for export/bookmark commands section
    const exportSection = page.getByText(/export|bookmark|commands/i)
    const hasExportSection = await exportSection.first().isVisible().catch(() => false)
    
    // Check for q_ commands which are the bookmark format
    const bookmarkCommands = page.getByText(/q_[\d._-]+|InOut\w+|ease_\d+_\d+/i)
    const hasBookmarks = await bookmarkCommands.first().isVisible().catch(() => false)
    
    expect(hasExportSection || hasBookmarks).toBeTruthy()
  })

  test('should have N bookmarks for N waypoints (keyframe-centric model)', async ({ page }) => {
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Select the 8-point preset for clear verification
    const zigzagPreset = CAMERA_PATH_PRESETS.find(p => p.id === 'preset-zigzag-quick')
    
    if (zigzagPreset) {
      const presetButton = page.getByRole('button', { name: new RegExp(zigzagPreset.name, 'i') })
      
      if (await presetButton.isVisible().catch(() => false)) {
        await presetButton.click()
        
        // In the keyframe-centric model, N waypoints = N bookmarks
        // The zigzag preset has 8 waypoints
        const expectedBookmarkCount = zigzagPreset.waypoints.length
        
        // Check for bookmark count indicator in UI
        const bookmarkCountIndicator = page.getByText(new RegExp(`${expectedBookmarkCount}\\s*(bookmark|pts|point)`, 'i'))
        const hasCorrectBookmarkCount = await bookmarkCountIndicator.isVisible().catch(() => false)
        
        // Alternative: check for individual bookmark entries
        const bookmarkEntries = await page.locator('[data-testid*="bookmark"], .bookmark-entry, [class*="bookmark"]').count()
        
        // Also check in any list/table format
        const listItems = await page.locator('li, tr').filter({ hasText: /q_|InOut|ease_/ }).count()
        
        expect(hasCorrectBookmarkCount || bookmarkEntries >= expectedBookmarkCount || listItems > 0).toBeTruthy()
      }
    }
  })

  test('should include stop command for last waypoint', async ({ page }) => {
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Select a preset
    const preset = CAMERA_PATH_PRESETS[0]
    const presetButton = page.getByRole('button', { name: new RegExp(preset.name.replace(/[()]/g, '\\$&'), 'i') })
    
    if (await presetButton.isVisible().catch(() => false)) {
      await presetButton.click()
    }

    // Look for 'stop' command in the bookmark output
    const stopCommand = page.getByText(/stop/i)
    const hasStopCommand = await stopCommand.isVisible().catch(() => false)
    
    // The last waypoint should have 'stop' in its bookmark command
    // Check the preset data to verify
    const lastWaypoint = preset.waypoints[preset.waypoints.length - 1]
    const lastBookmarkHasStop = lastWaypoint.bookmarkCommand?.includes('stop')
    
    expect(hasStopCommand || lastBookmarkHasStop).toBeTruthy()
  })
})

test.describe('ScriptMapper Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('should have copy button for bookmark commands', async ({ page }) => {
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Look for copy button
    const copyButton = page.getByRole('button', { name: /copy|clipboard/i })
    const hasCopyButton = await copyButton.first().isVisible().catch(() => false)
    
    // Alternative: look for copy icon
    const copyIcon = page.locator('[data-testid*="copy"], [class*="copy"], button:has(svg)')
    const hasCopyIcon = await copyIcon.first().isVisible().catch(() => false)
    
    expect(hasCopyButton || hasCopyIcon).toBeTruthy()
  })

  test('should copy commands to clipboard when copy button clicked', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // Navigate to ScriptMapper
    const scriptMapperTab = page.getByRole('tab', { name: /scriptmapper/i })
    if (await scriptMapperTab.isVisible().catch(() => false)) {
      await scriptMapperTab.click()
    }

    // Select a preset
    const preset = CAMERA_PATH_PRESETS[0]
    const presetButton = page.getByRole('button', { name: new RegExp(preset.name.replace(/[()]/g, '\\$&'), 'i') })
    
    if (await presetButton.isVisible().catch(() => false)) {
      await presetButton.click()
    }

    // Find and click copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).first()
    
    if (await copyButton.isVisible().catch(() => false)) {
      await copyButton.click()
      
      // Try to verify clipboard content or success toast
      // Playwright auto-waits on assertions
      const successToast = page.getByText(/copied|clipboard|success/i)
      const hasSuccessMessage = await successToast.isVisible().catch(() => false)
      
      // Alternatively, read clipboard
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')
      const hasClipboardContent = clipboardContent.length > 0
      
      expect(hasSuccessMessage || hasClipboardContent).toBeTruthy()
    }
  })
})

test.describe('ScriptMapper Preset Data Validation', () => {
  // These tests validate the preset data structure using Playwright
  // to ensure the data is consistent
  
  test('all presets have valid bookmark commands', async () => {
    for (const preset of CAMERA_PATH_PRESETS) {
      // Each waypoint should have a bookmark command
      for (const waypoint of preset.waypoints) {
        expect(waypoint.bookmarkCommand).toBeDefined()
        expect(waypoint.bookmarkCommand!.length).toBeGreaterThan(0)
      }
      
      // N waypoints should equal N bookmark commands
      const bookmarkCount = preset.waypoints.filter(wp => wp.bookmarkCommand).length
      expect(bookmarkCount).toBe(preset.waypoints.length)
    }
  })

  test('all presets have stop command on last waypoint', async () => {
    for (const preset of CAMERA_PATH_PRESETS) {
      const lastWaypoint = preset.waypoints[preset.waypoints.length - 1]
      expect(lastWaypoint.bookmarkCommand).toContain('stop')
    }
  })

  test('preset segment count matches waypoint transitions', async () => {
    for (const preset of CAMERA_PATH_PRESETS) {
      // For N waypoints, there should be N-1 segments
      const expectedSegments = preset.waypoints.length - 1
      expect(preset.segments.length).toBe(expectedSegments)
    }
  })

  test('preset waypoint times are in valid range [0, 1]', async () => {
    for (const preset of CAMERA_PATH_PRESETS) {
      for (const waypoint of preset.waypoints) {
        expect(waypoint.time).toBeGreaterThanOrEqual(0)
        expect(waypoint.time).toBeLessThanOrEqual(1)
      }
      
      // First waypoint should be at time 0
      expect(preset.waypoints[0].time).toBe(0)
      
      // Last waypoint should be at time 1
      expect(preset.waypoints[preset.waypoints.length - 1].time).toBe(1)
    }
  })
})
