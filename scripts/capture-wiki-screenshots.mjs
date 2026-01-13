// Capture wiki screenshots with consistent cropping and high-contrast Japanese annotations.
// Requires Vite dev server running on http://localhost:5000/ (npm run dev).

import path from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = 'http://localhost:5000/'
const outDir = path.resolve('wiki/screenshots')
const viewport = { width: 1600, height: 1000 }

const overlayId = 'doc-annot-overlay'

// Minimal padding for tight crops
const pad = (box, padding = 8) => ({
  x: Math.max(0, box.x - padding),
  y: Math.max(0, box.y - padding),
  width: box.width + padding * 2,
  height: box.height + padding * 2,
})

// Expand clip area to accommodate annotations that extend beyond the element
// Uses larger margins for Japanese text labels which require more space
const expandForAnnotations = (clip, annotations = [], extra = 60) => {
  if (!annotations || annotations.length === 0) return clip

  let minX = clip.x
  let minY = clip.y
  let maxX = clip.x + clip.width
  let maxY = clip.y + clip.height

  for (const ann of annotations) {
    if (ann.type === 'label') {
      // Japanese text needs more width - increased margins
      minY = Math.min(minY, ann.y - 90)
      minX = Math.min(minX, ann.x - 300)
      maxX = Math.max(maxX, ann.x + 300)
      maxY = Math.max(maxY, ann.y + 50)
    }
    if (ann.type === 'arrow') {
      minX = Math.min(minX, ann.from.x - 40, ann.to.x - 40)
      minY = Math.min(minY, ann.from.y - 40, ann.to.y - 40)
      maxX = Math.max(maxX, ann.from.x + 40, ann.to.x + 40)
      maxY = Math.max(maxY, ann.from.y + 40, ann.to.y + 40)
      if (ann.label) {
        minY = Math.min(minY, ann.label.y - 90)
        minX = Math.min(minX, ann.label.x - 300)
        maxX = Math.max(maxX, ann.label.x + 300)
        maxY = Math.max(maxY, ann.label.y + 50)
      }
    }
  }

  return {
    x: Math.max(0, minX - extra),
    y: Math.max(0, minY - extra),
    width: maxX - minX + extra * 2,
    height: maxY - minY + extra * 2,
  }
}

const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 })

async function addOverlay(page, items) {
  await page.evaluate(
    ({ items, overlayId }) => {
      document.getElementById(overlayId)?.remove()
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.id = overlayId
      Object.assign(svg.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '9999',
      })

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')

      // Proper arrow marker with stem line style and high-contrast white outline
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
      marker.id = 'arrow-head'
      marker.setAttribute('viewBox', '0 0 20 20')
      marker.setAttribute('refX', '17')
      marker.setAttribute('refY', '10')
      marker.setAttribute('markerWidth', '14')
      marker.setAttribute('markerHeight', '14')
      marker.setAttribute('orient', 'auto')
      marker.setAttribute('markerUnits', 'strokeWidth')

      // White outline for high contrast against dark backgrounds
      const arrowOutline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      arrowOutline.setAttribute('d', 'M 2 5 L 16 10 L 2 15 L 6 10 Z')
      arrowOutline.setAttribute('fill', '#fff')
      arrowOutline.setAttribute('stroke', '#fff')
      arrowOutline.setAttribute('stroke-width', '4.5')
      arrowOutline.setAttribute('stroke-linejoin', 'round')
      marker.appendChild(arrowOutline)

      // Main arrow fill - bright red for visibility
      const arrowFill = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      arrowFill.setAttribute('d', 'M 2 5 L 16 10 L 2 15 L 6 10 Z')
      arrowFill.setAttribute('fill', '#ff2244')
      arrowFill.setAttribute('stroke', '#ff2244')
      arrowFill.setAttribute('stroke-width', '1.5')
      arrowFill.setAttribute('stroke-linejoin', 'round')
      marker.appendChild(arrowFill)

      defs.appendChild(marker)
      svg.appendChild(defs)

      // Large, high-contrast text style for Japanese labels - increased font size
      const textStyle = {
        fill: '#fff',
        stroke: '#000',
        'stroke-width': '7',
        'paint-order': 'stroke fill',
        'font-size': '32px',
        'font-weight': '900',
        'font-family': '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif',
      }

      const addLine = (from, to, color = '#ff2244') => {
        // Wide white shadow for high contrast against dark backgrounds
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        shadow.setAttribute('x1', String(from.x))
        shadow.setAttribute('y1', String(from.y))
        shadow.setAttribute('x2', String(to.x))
        shadow.setAttribute('y2', String(to.y))
        shadow.setAttribute('stroke', '#fff')
        shadow.setAttribute('stroke-width', '18')
        shadow.setAttribute('stroke-linecap', 'round')
        svg.appendChild(shadow)

        // Main colored line with arrow marker
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(from.x))
        line.setAttribute('y1', String(from.y))
        line.setAttribute('x2', String(to.x))
        line.setAttribute('y2', String(to.y))
        line.setAttribute('stroke', color)
        line.setAttribute('stroke-width', '8')
        line.setAttribute('stroke-linecap', 'round')
        line.setAttribute('marker-end', 'url(#arrow-head)')
        svg.appendChild(line)

        // Start dot indicator with larger white outline
        const startDotOutline = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        startDotOutline.setAttribute('cx', String(from.x))
        startDotOutline.setAttribute('cy', String(from.y))
        startDotOutline.setAttribute('r', '12')
        startDotOutline.setAttribute('fill', '#fff')
        svg.appendChild(startDotOutline)

        const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        startDot.setAttribute('cx', String(from.x))
        startDot.setAttribute('cy', String(from.y))
        startDot.setAttribute('r', '9')
        startDot.setAttribute('fill', color)
        svg.appendChild(startDot)
      }

      const addRect = (rect, color = '#ff2244') => {
        // White outer border for high contrast
        const outer = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        outer.setAttribute('x', String(rect.x))
        outer.setAttribute('y', String(rect.y))
        outer.setAttribute('width', String(rect.width))
        outer.setAttribute('height', String(rect.height))
        outer.setAttribute('rx', '10')
        outer.setAttribute('ry', '10')
        outer.setAttribute('fill', 'rgba(255,255,255,0.18)')
        outer.setAttribute('stroke', '#fff')
        outer.setAttribute('stroke-width', '10')
        svg.appendChild(outer)

        // Inner color border
        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        inner.setAttribute('x', String(rect.x))
        inner.setAttribute('y', String(rect.y))
        inner.setAttribute('width', String(rect.width))
        inner.setAttribute('height', String(rect.height))
        inner.setAttribute('rx', '10')
        inner.setAttribute('ry', '10')
        inner.setAttribute('fill', 'none')
        inner.setAttribute('stroke', color)
        inner.setAttribute('stroke-width', '5')
        svg.appendChild(inner)
      }

      const addLabel = (label) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        const anchor = label.anchor ?? 'middle'
        const fontSize = 32
        const padX = 26
        const padY = 20

        // Width estimate for Japanese text (wider chars) - increased for better fit
        const textLen = Math.max(3, String(label.text ?? '').length)
        const estWidth = Math.max(220, textLen * 34)
        const estHeight = fontSize + padY * 2

        let x0 = label.x - estWidth / 2
        if (anchor === 'start') x0 = label.x
        if (anchor === 'end') x0 = label.x - estWidth
        const y0 = label.y - estHeight + 14

        // White outline for label background - high visibility
        const bgOutline = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        bgOutline.setAttribute('x', String(x0 - 4))
        bgOutline.setAttribute('y', String(y0 - 4))
        bgOutline.setAttribute('width', String(estWidth + 8))
        bgOutline.setAttribute('height', String(estHeight + 8))
        bgOutline.setAttribute('rx', '18')
        bgOutline.setAttribute('ry', '18')
        bgOutline.setAttribute('fill', '#fff')
        group.appendChild(bgOutline)

        // Semi-transparent background with border
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        bg.setAttribute('x', String(x0))
        bg.setAttribute('y', String(y0))
        bg.setAttribute('width', String(estWidth))
        bg.setAttribute('height', String(estHeight))
        bg.setAttribute('rx', '14')
        bg.setAttribute('ry', '14')
        bg.setAttribute('fill', 'rgba(25,25,30,0.95)')
        bg.setAttribute('stroke', 'rgba(255,255,255,0.9)')
        bg.setAttribute('stroke-width', '3')
        group.appendChild(bg)

        // Text with stroke outline for visibility
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = label.text
        text.setAttribute('x', String(label.x))
        text.setAttribute('y', String(label.y))
        Object.entries(textStyle).forEach(([k, v]) => text.setAttribute(k, v))
        text.setAttribute('text-anchor', anchor)
        group.appendChild(text)

        svg.appendChild(group)
      }

      for (const item of items) {
        if (item.type === 'arrow') {
          addLine(item.from, item.to, item.color)
          if (item.label) addLabel(item.label)
        }
        if (item.type === 'rect') addRect(item.rect, item.color)
        if (item.type === 'label') addLabel(item)
      }

      document.body.appendChild(svg)
    },
    { items, overlayId },
  )
}

async function clearOverlay(page) {
  await page.evaluate((overlayId) => document.getElementById(overlayId)?.remove(), overlayId)
}

async function clipShot(page, locator, fileName, options = {}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error(`No bounding box for ${fileName}`)
  let clip = pad(box, options.padding ?? 8)
  if (options.overlay) {
    clip = expandForAnnotations(clip, options.overlay, options.annotationPadding ?? 45)
    await addOverlay(page, options.overlay)
  }
  await page.screenshot({ path: path.join(outDir, fileName), clip })
  if (options.overlay) await clearOverlay(page)
}

async function shotByBox(page, box, fileName, overlay, padding = 8) {
  let clip = pad(box, padding)
  if (overlay) {
    clip = expandForAnnotations(clip, overlay, 45)
    await addOverlay(page, overlay)
  }
  await page.screenshot({ path: path.join(outDir, fileName), clip })
  if (overlay) await clearOverlay(page)
}

async function getElementBox(page, finder) {
  const box = await page.evaluate(finder)
  if (!box) throw new Error('Bounding box not found')
  return box
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl })
  const page = await context.newPage()
  await page.goto(baseUrl)
  await page.waitForTimeout(600)

  // === Normal mode captures ===
  const normalRadio = page.getByRole('radio', { name: /Normal mode/i })
  await normalRadio.click()
  await page.waitForTimeout(400)
  const previewToolbar = page.getByRole('group', { name: /Preview type selection/i })
  const applicationMode = page.getByRole('group', { name: /Application mode/i })

  // Turn on all previews for overview
  const glowToggle = page.getByRole('button', { name: /Toggle glow preview/i })
  const glowState = await glowToggle.getAttribute('aria-pressed')
  if (glowState !== 'true') await glowToggle.click()

  // Overview - comparison mode
  const mainPanels = page.getByRole('main', { name: /Easing function panels/i })
  await clipShot(page, mainPanels, 'comparison-mode-overview.png', {
    padding: 10,
    overlay: [
      { type: 'label', text: '比較モード：複数関数を同時比較', x: viewport.width / 2, y: 55 },
    ],
    annotationPadding: 55,
  })

  // Mode switcher
  const normalBox = await normalRadio.boundingBox()
  const scriptRadio = page.getByRole('radio', { name: /ScriptMapper mode/i })
  const scriptBox = await scriptRadio.boundingBox()
  const modeOverlay = normalBox && scriptBox
    ? [
        { type: 'rect', rect: pad(normalBox, 4) },
        { type: 'rect', rect: pad(scriptBox, 4) },
        {
          type: 'arrow',
          from: { x: normalBox.x - 30, y: normalBox.y + normalBox.height + 55 },
          to: { x: normalBox.x + normalBox.width / 2, y: normalBox.y + normalBox.height + 5 },
          label: { text: '比較モード', x: normalBox.x - 35, y: normalBox.y + normalBox.height + 50, anchor: 'end' },
        },
        {
          type: 'arrow',
          from: { x: scriptBox.x + scriptBox.width + 30, y: scriptBox.y + scriptBox.height + 55 },
          to: { x: scriptBox.x + scriptBox.width / 2, y: scriptBox.y + scriptBox.height + 5 },
          label: { text: 'ScriptMapperモード', x: scriptBox.x + scriptBox.width + 35, y: scriptBox.y + scriptBox.height + 50, anchor: 'start' },
        },
      ]
    : undefined
  await clipShot(page, applicationMode, 'ui-mode-switcher.png', { overlay: modeOverlay, padding: 10, annotationPadding: 70 })

  // Display mode toolbar
  const glowBox = await glowToggle.boundingBox()
  const graphToggle = page.getByRole('button', { name: /Toggle graph preview/i })
  const graphBox = await graphToggle.boundingBox()
  const camToggle = page.getByRole('button', { name: /Toggle camera preview/i })
  const camBox = await camToggle.boundingBox()
  const valueToggle = page.getByRole('button', { name: /Toggle value preview/i })
  const valueBox = await valueToggle.boundingBox()
  
  const displayItems = [
    { key: 'Glow', box: glowBox },
    { key: 'Graph', box: graphBox },
    { key: 'Camera', box: camBox },
    { key: 'Value', box: valueBox },
  ].filter((x) => x.box)

  const displayOverlay = displayItems.flatMap(({ key, box }) => [
    { type: 'rect', rect: pad(box, 3) },
    {
      type: 'arrow',
      from: { x: box.x + box.width / 2, y: box.y + box.height + 50 },
      to: { x: box.x + box.width / 2, y: box.y + box.height + 4 },
      label: { text: `${key}表示`, x: box.x + box.width / 2, y: box.y + box.height + 45 },
    },
  ])
  await clipShot(page, previewToolbar, 'display-mode-toolbar.png', { overlay: displayOverlay, padding: 8, annotationPadding: 60 })

  // Add button
  const addButton = page.getByRole('button', { name: /Add new panel/i })
  const addBox = await addButton.boundingBox()
  await clipShot(page, addButton, 'add-easing-panel.png', {
    padding: 8,
    overlay: [
      { type: 'rect', rect: pad(addBox, 3) },
      {
        type: 'label',
        text: 'パネル追加',
        x: addBox.x + addBox.width / 2,
        y: addBox.y - 25,
      },
    ],
    annotationPadding: 55,
  })

  // Speed selector
  const speedCombo = page.getByRole('combobox', { name: /Animation speed/i })
  const speedBox = await speedCombo.boundingBox()
  await clipShot(page, speedCombo, 'speed-selector.png', {
    padding: 8,
    overlay: [
      { type: 'rect', rect: pad(speedBox, 4) },
      {
        type: 'arrow',
        from: { x: speedBox.x + speedBox.width + 35, y: speedBox.y + speedBox.height / 2 },
        to: { x: speedBox.x + speedBox.width + 5, y: speedBox.y + speedBox.height / 2 },
        label: { text: '再生速度', x: speedBox.x + speedBox.width + 40, y: speedBox.y + speedBox.height / 2 - 8, anchor: 'start' },
      },
    ],
    annotationPadding: 85,
  })

  // Advanced settings: Manual Input & Gamma
  const advancedButton = page.getByRole('button', { name: /Advanced Settings|Show advanced settings/i }).first()
  await advancedButton.click()
  await page.waitForTimeout(400)

  // Manual input switch area
  const manualBox = await getElementBox(page, () => {
    const label = [...document.querySelectorAll('body *')].find((el) => /Manual (Input|Control)/i.test(el.textContent ?? ''))
    if (!label) return null
    const container = label.closest('section') ?? label.closest('div') ?? label
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  await shotByBox(page, manualBox, 'manual-input-mode.png', [
    { type: 'rect', rect: pad(manualBox, 3) },
    { type: 'label', text: '手動入力モード', x: manualBox.x + manualBox.width / 2, y: manualBox.y - 25 },
  ], 8)

  // Gamma slider area
  const gammaBox = await getElementBox(page, () => {
    const label = [...document.querySelectorAll('body *')].find((el) => /Gamma/i.test(el.textContent ?? ''))
    if (!label) return null
    const container = label.closest('section') ?? label.closest('div') ?? label
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  await shotByBox(page, gammaBox, 'gamma-correction.png', [
    { type: 'rect', rect: pad(gammaBox, 3) },
    { type: 'label', text: 'Gamma補正', x: gammaBox.x + gammaBox.width / 2, y: gammaBox.y - 25 },
  ], 8)

  // Close advanced settings
  await advancedButton.click()
  await page.waitForTimeout(300)

  // Share toast
  const shareButton = page.getByRole('button', { name: /Share configuration/i })
  await shareButton.click({ force: true })

  const toastItem = page.getByRole('region', { name: /Notifications/i }).locator('li').first()
  await toastItem.waitFor({ state: 'visible', timeout: 8000 })
  const toastBox = await toastItem.boundingBox()
  await clipShot(page, toastItem, 'share-dialog.png', {
    padding: 10,
    overlay: [
      { type: 'rect', rect: pad(toastBox, 3) },
      {
        type: 'label',
        text: '共有URLをコピー',
        x: toastBox.x + toastBox.width / 2,
        y: toastBox.y - 25,
      },
    ],
    annotationPadding: 55,
  })
  await page.waitForTimeout(600)

  // === Individual preview captures ===
  // Wait for any toast to disappear
  await page.waitForTimeout(2500)

  // Glow preview
  const glowPanel = page.locator('[data-preview-type="glow"]').first()
  if (await glowPanel.isVisible()) {
    const glowPanelBox = await glowPanel.boundingBox()
    await shotByBox(page, glowPanelBox, 'glow-preview.png', [
      { type: 'label', text: 'Glow：光の明るさで変化を表現', x: glowPanelBox.x + glowPanelBox.width / 2, y: glowPanelBox.y - 25 },
    ], 6)
  }

  // Graph preview
  const graphPanel = page.locator('[data-preview-type="graph"]').first()
  if (await graphPanel.isVisible()) {
    const graphPanelBox = await graphPanel.boundingBox()
    await shotByBox(page, graphPanelBox, 'graph-preview.png', [
      { type: 'label', text: 'Graph：カーブを2Dグラフで確認', x: graphPanelBox.x + graphPanelBox.width / 2, y: graphPanelBox.y - 25 },
    ], 6)
  }

  // Camera preview
  const cameraPanel = page.locator('[data-preview-type="camera"]').first()
  if (await cameraPanel.isVisible()) {
    const cameraPanelBox = await cameraPanel.boundingBox()
    await shotByBox(page, cameraPanelBox, 'camera-preview.png', [
      { type: 'label', text: 'Camera：3D空間でカメラの動き', x: cameraPanelBox.x + cameraPanelBox.width / 2, y: cameraPanelBox.y - 25 },
    ], 6)
  }

  // Value preview
  const valuePanel = page.locator('[data-preview-type="value"]').first()
  if (await valuePanel.isVisible()) {
    const valuePanelBox = await valuePanel.boundingBox()
    await shotByBox(page, valuePanelBox, 'value-preview.png', [
      { type: 'label', text: 'Value：数値で入出力を確認', x: valuePanelBox.x + valuePanelBox.width / 2, y: valuePanelBox.y - 25 },
    ], 6)
  }

  // === ScriptMapper mode captures ===
  await scriptRadio.click()
  await page.waitForTimeout(800)

  // Ensure ScriptMapper mode is actually enabled (there is an in-panel toggle as well).
  const scriptToggle = page.getByRole('switch', { name: /Toggle ScriptMapper mode/i })
  await scriptToggle.waitFor({ state: 'visible', timeout: 5000 })
  const scriptToggleChecked = await scriptToggle.getAttribute('aria-checked')
  if (scriptToggleChecked !== 'true') {
    await scriptToggle.click()
    await page.waitForTimeout(500)
  }

  // Ensure camera preview is on so the three views exist.
  const cameraToggle = page.getByRole('button', { name: /Toggle camera preview/i })
  const camPressed = await cameraToggle.getAttribute('aria-pressed')
  if (camPressed !== 'true') {
    await cameraToggle.click()
    await page.waitForTimeout(500)
  }

  await page.getByText(/Third Person View|First Person View|Timing Graph/i).first().waitFor({
    state: 'visible',
    timeout: 5000,
  })
  // Wait longer for 3D canvases to fully render
  await page.waitForTimeout(1500)

  // Input area (left panel with waypoints)
  const inputArea = await getElementBox(page, () => {
    const label = [...document.querySelectorAll('body *')].find((el) => el.textContent?.includes('Active Path'))
    if (!label) return null
    const container = label.closest('section') ?? label.closest('div.card') ?? label.parentElement?.parentElement
    if (!container) return null
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 480) }
  })
  await shotByBox(page, inputArea, 'scriptmapper-input-area.png', [
    { type: 'rect', rect: pad(inputArea, 3) },
    { type: 'label', text: 'ブックマーク入力・経路設定', x: inputArea.x + inputArea.width / 2, y: inputArea.y - 25 },
  ], 10)

  // Preset selector list
  const presetList = await getElementBox(page, () => {
    const label = [...document.querySelectorAll('body *')].find((el) => el.textContent?.trim() === 'Presets')
    if (!label) return null
    const ul = label.parentElement?.querySelector('button')?.parentElement
    const container = ul?.parentElement ?? label.parentElement
    if (!container) return null
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 380) }
  })
  await shotByBox(page, presetList, 'preset-selector.png', [
    { type: 'rect', rect: pad(presetList, 3) },
    { type: 'label', text: 'プリセット選択', x: presetList.x + presetList.width / 2, y: presetList.y - 25 },
  ], 10)

  // Bookmarks area example
  await page.getByText(/Waypoints|ブックマーク/i).first().waitFor({ state: 'visible', timeout: 5000 })
  const bookmarkArea = await getElementBox(page, () => {
    const label = [...document.querySelectorAll('body *')].find((el) => /Waypoints|ブックマーク/i.test((el.textContent ?? '').trim()))
    if (!label) return null

    const container = label.closest('section') ?? label.closest('div') ?? label.parentElement
    if (!container) return null

    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 380) }
  })
  await shotByBox(page, bookmarkArea, 'scriptmapper-example-bookmarks.png', [
    { type: 'rect', rect: pad(bookmarkArea, 3) },
    { type: 'label', text: 'ScriptMapper形式のブックマーク', x: bookmarkArea.x + bookmarkArea.width / 2, y: bookmarkArea.y - 25 },
  ], 10)

  // View panels: union
  // The view canvases are created asynchronously; ensure they're present before measuring.
  await page.locator('canvas[data-engine]').first().waitFor({ state: 'visible', timeout: 8000 })
  // Wait extra time for Three.js to fully render the scene with humanoid model
  await page.waitForTimeout(1500)

  const thirdBox = await getElementBox(page, () => {
    const header = [...document.querySelectorAll('body *')].find((el) => (el.textContent ?? '').trim() === 'Third Person View')
    if (!header) return null
    const container = header.closest('div')?.parentElement
    if (!container) return null
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })

  const fpBox = await getElementBox(page, () => {
    const header = [...document.querySelectorAll('body *')].find((el) => (el.textContent ?? '').trim() === 'First Person View')
    if (!header) return null
    const container = header.closest('div')?.parentElement
    if (!container) return null
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })

  const graphViewBox = await getElementBox(page, () => {
    const header = [...document.querySelectorAll('body *')].find((el) => (el.textContent ?? '').trim() === 'Timing Graph')
    if (!header) return null
    const container = header.closest('div')?.parentElement
    if (!container) return null
    const r = container.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })

  // Union of all three views
  const viewUnion = {
    x: Math.min(thirdBox.x, fpBox.x, graphViewBox.x),
    y: Math.min(thirdBox.y, fpBox.y, graphViewBox.y),
    width: Math.max(thirdBox.x + thirdBox.width, fpBox.x + fpBox.width, graphViewBox.x + graphViewBox.width) - Math.min(thirdBox.x, fpBox.x, graphViewBox.x),
    height: Math.max(thirdBox.y + thirdBox.height, fpBox.y + fpBox.height, graphViewBox.y + graphViewBox.height) - Math.min(thirdBox.y, fpBox.y, graphViewBox.y),
  }

  // Labels positioned at top of each view panel with adequate spacing
  const viewOverlay = [
    { type: 'rect', rect: pad(thirdBox, 5) },
    { type: 'rect', rect: pad(fpBox, 5) },
    { type: 'rect', rect: pad(graphViewBox, 5) },
    {
      type: 'arrow',
      from: { x: thirdBox.x + 45, y: thirdBox.y + 80 },
      to: { x: thirdBox.x + thirdBox.width / 2, y: thirdBox.y + thirdBox.height / 2 },
      label: { text: 'Third Person（俯瞰）', x: thirdBox.x + thirdBox.width / 2, y: thirdBox.y + 40, anchor: 'middle' },
    },
    {
      type: 'arrow',
      from: { x: fpBox.x + 45, y: fpBox.y + 80 },
      to: { x: fpBox.x + fpBox.width / 2, y: fpBox.y + fpBox.height / 2 },
      label: { text: 'First Person（視点）', x: fpBox.x + fpBox.width / 2, y: fpBox.y + 40, anchor: 'middle' },
    },
    {
      type: 'arrow',
      from: { x: graphViewBox.x + 45, y: graphViewBox.y + 80 },
      to: { x: graphViewBox.x + graphViewBox.width / 2, y: graphViewBox.y + graphViewBox.height / 2 },
      label: { text: 'Timing Graph（時間軸）', x: graphViewBox.x + graphViewBox.width / 2, y: graphViewBox.y + 40, anchor: 'middle' },
    },
  ]
  await shotByBox(page, viewUnion, 'scriptmapper-mode-three-views.png', viewOverlay, 14)

  // Individual views
  await shotByBox(page, thirdBox, 'third-person-view.png', [
    { type: 'label', text: 'Third Person View', x: thirdBox.x + thirdBox.width / 2, y: thirdBox.y - 25 },
  ], 6)

  await shotByBox(page, fpBox, 'first-person-view.png', [
    { type: 'label', text: 'First Person View', x: fpBox.x + fpBox.width / 2, y: fpBox.y - 25 },
  ], 6)

  await shotByBox(page, graphViewBox, 'timing-graph.png', [
    { type: 'label', text: 'Timing Graph', x: graphViewBox.x + graphViewBox.width / 2, y: graphViewBox.y - 25 },
  ], 6)

  // Full ScriptMapper view (all three + left panel)
  const fullScriptMapperBox = await getElementBox(page, () => {
    const main = document.querySelector('main[aria-label*="Easing"]')
    if (!main) return null
    const r = main.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  await shotByBox(page, fullScriptMapperBox, 'scriptmapper-all-views.png', [
    { type: 'label', text: 'ScriptMapperモード：3ビュー同時表示', x: fullScriptMapperBox.x + fullScriptMapperBox.width / 2, y: fullScriptMapperBox.y - 25 },
  ], 12)

  await context.close()
  await browser.close()
  console.log('Screenshots captured successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})