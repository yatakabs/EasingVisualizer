/**
 * Build information utilities
 * 
 * Provides access to version and build metadata injected at compile time
 * by Vite's define feature.
 */

export interface BuildInfo {
  version: string
  commit: string
  timestamp: string
  environment: string
  buildDate: Date
}

/**
 * Get build information from compile-time constants
 */
export function getBuildInfo(): BuildInfo {
  return {
    version: __APP_VERSION__,
    commit: __BUILD_COMMIT__,
    timestamp: __BUILD_TIMESTAMP__,
    environment: __BUILD_ENV__,
    buildDate: new Date(__BUILD_TIMESTAMP__),
  }
}

/**
 * Log build information to console with styled formatting
 */
export function logBuildInfo(): void {
  const info = getBuildInfo()
  
  console.groupCollapsed(
    `%c🎨 Easing Visualizer %cv${info.version}`,
    'font-weight: bold; color: #a855f7',
    'font-weight: normal; color: #94a3b8'
  )
  console.log(`Commit:      ${info.commit}`)
  console.log(`Built:       ${info.buildDate.toLocaleString()}`)
  console.log(`Environment: ${info.environment}`)
  console.groupEnd()
  
  // Expose build info for debugging
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __BUILD_INFO__: BuildInfo }).__BUILD_INFO__ = info
  }
}
