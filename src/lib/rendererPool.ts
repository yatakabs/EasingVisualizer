/**
 * WebGLRenderer Pool
 * 
 * Manages a shared pool of WebGL renderers to reduce GPU memory consumption
 * and prevent WebGL context exhaustion when multiple Three.js scenes are active.
 * 
 * Browser WebGL context limits:
 * - Chrome/Edge: ~16 contexts
 * - Firefox: ~200 contexts (but high memory cost)
 * - Safari: ~8 contexts
 * 
 * This pool limits concurrent renderers to 4, which is sufficient for typical
 * usage (6-8 panels) while staying well under browser limits.
 */

import * as THREE from 'three'

interface RendererPoolEntry {
  renderer: THREE.WebGLRenderer
  canvas: HTMLCanvasElement
  inUse: boolean
  lastUsedTime: number
}

class RendererPool {
  private pool: RendererPoolEntry[] = []
  private maxRenderers = 4  // Conservative limit for cross-browser compatibility
  
  /**
   * Update the maximum number of renderers allowed in the pool.
   * Clamps to safe browser limits (1-12).
   * 
   * @param max The new maximum number of renderers
   */
  setMaxRenderers(max: number): void {
    // Clamp to browser safe limits
    this.maxRenderers = Math.min(Math.max(max, 1), 12)
  }
  
  /**
   * Acquire a WebGL renderer from the pool.
   * Creates a new renderer if pool has capacity, or reuses an available one.
   * 
   * @returns Renderer and canvas if available, null if pool is exhausted
   */
  acquire(): { renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement } | null {
    // Find available (unused) renderer
    const available = this.pool.find(entry => !entry.inUse)
    if (available) {
      available.inUse = true
      available.lastUsedTime = Date.now()
      return { renderer: available.renderer, canvas: available.canvas }
    }
    
    // Create new renderer if under limit
    if (this.pool.length < this.maxRenderers) {
      const canvas = document.createElement('canvas')
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      })
      
      // Limit pixel ratio to reduce memory cost (2x is sufficient for most displays)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      // Add context loss/restore handlers for robustness
      canvas.addEventListener('webglcontextlost', this.handleContextLost, false)
      canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false)
      
      const entry: RendererPoolEntry = { 
        renderer, 
        canvas, 
        inUse: true,
        lastUsedTime: Date.now()
      }
      this.pool.push(entry)
      
      return { renderer, canvas }
    }
    
    // Pool exhausted
    console.warn('[RendererPool] Maximum WebGL contexts reached. Consider reducing active camera previews.')
    return null
  }
  
  /**
   * Release a renderer back to the pool for reuse.
   * 
   * @param renderer The renderer to release
   */
  release(renderer: THREE.WebGLRenderer): void {
    const entry = this.pool.find(e => e.renderer === renderer)
    if (entry) {
      entry.inUse = false
      entry.lastUsedTime = Date.now()
      
      // Clear renderer state to prevent leaks between uses
      // Note: We don't call dispose() here - renderer is reused
      renderer.clear()
    } else {
      console.warn('[RendererPool] Attempted to release unknown renderer')
    }
  }
  
  /**
   * Handle WebGL context loss event.
   * This can happen when:
   * - GPU crashes or resets
   * - Too many contexts created
   * - Browser tab backgrounded for extended period
   */
  private handleContextLost = (event: Event): void => {
    console.warn('[RendererPool] WebGL context lost', event)
    event.preventDefault()  // Prevent default handling to allow restoration
  }
  
  /**
   * Handle WebGL context restore event.
   * Renderer will automatically reinitialize when rendering resumes.
   */
  private handleContextRestored = (event: Event): void => {
    console.log('[RendererPool] WebGL context restored', event)
  }
  
  /**
   * Get pool statistics for debugging.
   */
  getStats(): { total: number; inUse: number; available: number } {
    const inUse = this.pool.filter(e => e.inUse).length
    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse
    }
  }
  
  /**
   * Dispose of the entire pool.
   * Call this only when shutting down the application.
   */
  dispose(): void {
    this.pool.forEach(entry => {
      entry.canvas.removeEventListener('webglcontextlost', this.handleContextLost)
      entry.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored)
      entry.renderer.dispose()
    })
    this.pool = []
  }
}

// Singleton instance
export const rendererPool = new RendererPool()

// Export for testing
export type { RendererPoolEntry }
export { RendererPool }
