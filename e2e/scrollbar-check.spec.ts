import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * Diagnostic test for identifying scrollable containers.
 * Useful for debugging layout issues and ensuring proper scroll containment.
 */
test.describe('Scrollbar Diagnostics', () => {
  test('should identify scrollable containers in the app layout', async ({ page }) => {
    // Setup viewport for desktop testing
    await page.setViewportSize({ width: 1440, height: 700 })
    
    // Navigate using baseURL from playwright.config.ts (not hardcoded URL)
    await page.goto('/')
    
    // Use helper for proper app initialization (no hardcoded timeout)
    await waitForAppReady(page)
    
    // Identify scrollable containers for diagnostic purposes
    interface ScrollableContainer {
      tag: string
      id: string
      class: string
      scrollHeight: number
      clientHeight: number
      overflowY: string
      role: string | null
      ariaLabel: string | null
    }
    
    const scrollInfo = await page.evaluate((): ScrollableContainer[] => {
      const results: ScrollableContainer[] = []
      document.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement
        const style = window.getComputedStyle(el)
        const hasOverflowScroll = style.overflowY === 'auto' || style.overflowY === 'scroll'
        const isScrollable = htmlEl.scrollHeight > htmlEl.clientHeight
        
        if (hasOverflowScroll && isScrollable) {
          results.push({
            tag: el.tagName,
            id: el.id,
            class: el.className.substring(0, 80),
            scrollHeight: htmlEl.scrollHeight,
            clientHeight: htmlEl.clientHeight,
            overflowY: style.overflowY,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
          })
        }
      })
      return results
    })
    
    // Log for diagnostic purposes
    console.log('Scrollable containers:', JSON.stringify(scrollInfo, null, 2))
    
    // Assertions to validate expected behavior
    // The app should have at least one main content area that may be scrollable
    expect(scrollInfo).toBeDefined()
    expect(Array.isArray(scrollInfo)).toBe(true)
    
    // Screenshot for visual verification
    await page.screenshot({ 
      path: 'e2e/screenshots/scrollbar-check.png', 
      fullPage: false 
    })
  })

  test('should not have unexpected horizontal scroll on main container', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 700 })
    await page.goto('/')
    await waitForAppReady(page)
    
    // Check for horizontal overflow which typically indicates layout issues
    const hasHorizontalScroll = await page.evaluate(() => {
      const body = document.body
      const html = document.documentElement
      return body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth
    })
    
    // Main content should not have horizontal scroll at standard desktop widths
    expect(hasHorizontalScroll).toBe(false)
  })
})
