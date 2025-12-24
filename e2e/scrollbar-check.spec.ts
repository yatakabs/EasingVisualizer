import { test } from '@playwright/test'

test('check scrollbar position', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 })
  await page.goto('http://localhost:5000/')
  await page.waitForTimeout(2500)
  
  // Identify scrollable containers
  const scrollInfo = await page.evaluate(() => {
    const results: any[] = []
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
  
  console.log('Scrollable containers:', JSON.stringify(scrollInfo, null, 2))
  
  await page.screenshot({ path: 'e2e/screenshots/scrollbar-check.png', fullPage: false })
})
