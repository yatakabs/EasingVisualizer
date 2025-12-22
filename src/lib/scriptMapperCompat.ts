/**
 * ScriptMapper Compatibility Module
 * 
 * Provides naming aliases and compatibility checks for Beat Saber's ScriptMapper tool.
 * ScriptMapper uses specific naming conventions (e.g., 'InSine', 'OutQuad', 'InOutCubic')
 * that differ from this visualizer's internal IDs.
 */

import type { EaseType } from './easeTypes'

/**
 * Map visualizer function IDs to ScriptMapper base names
 * (without In/Out/InOut prefix)
 */
export const SCRIPTMAPPER_NAMES: Record<string, string> = {
  'sine': 'Sine',
  'quadratic': 'Quad',
  'cubic': 'Cubic',
  'quartic': 'Quart',
  'quintic': 'Quint',
  'exponential': 'Expo',
  'circular': 'Circ',
  'back': 'Back',
  'elastic': 'Elastic',
  'bounce': 'Bounce',
  'drift': 'Drift',
}

/**
 * Set of function IDs that are compatible with ScriptMapper
 */
export const SCRIPTMAPPER_COMPATIBLE_IDS = new Set([
  'sine', 'quadratic', 'cubic', 'quartic', 'quintic',
  'exponential', 'circular', 'back', 'elastic', 'bounce', 'drift'
])

/**
 * Get the ScriptMapper base name for a visualizer function ID
 * @param visualizerId - Internal function ID (e.g., 'quadratic')
 * @returns ScriptMapper name (e.g., 'Quad') or null if not compatible
 */
export function getScriptMapperName(visualizerId: string): string | null {
  return SCRIPTMAPPER_NAMES[visualizerId] ?? null
}

/**
 * Check if a function is compatible with ScriptMapper
 * @param visualizerId - Internal function ID
 * @returns true if the function exists in ScriptMapper
 */
export function isScriptMapperCompatible(visualizerId: string): boolean {
  return SCRIPTMAPPER_COMPATIBLE_IDS.has(visualizerId)
}

/**
 * Format a function configuration as a ScriptMapper command string
 * @param functionId - Internal function ID
 * @param easeType - Ease type (easein/easeout/easeboth)
 * @param driftParams - Parameters for Drift function (x, y in range 0-10)
 * @returns ScriptMapper command string (e.g., 'InSine', 'OutQuad', 'ease_6_6') or null if not compatible
 */
export function formatAsScriptMapperCommand(
  functionId: string,
  easeType: EaseType,
  driftParams?: { x: number; y: number }
): string | null {
  // Drift function uses special format: ease_x_y
  if (functionId === 'drift') {
    if (!driftParams) return null
    return `ease_${driftParams.x}_${driftParams.y}`
  }
  
  // Get ScriptMapper base name
  const smName = getScriptMapperName(functionId)
  if (!smName) return null
  
  // Add In/Out/InOut prefix based on easeType
  const prefix = easeType === 'easein' ? 'In' 
               : easeType === 'easeout' ? 'Out' 
               : 'InOut'
  
  return `${prefix}${smName}`
}

/**
 * Parse a ScriptMapper command into visualizer parameters
 * @param command - ScriptMapper command (e.g., 'InSine', 'ease_3_7')
 * @returns Parsed parameters or null if invalid format
 */
export function parseScriptMapperCommand(command: string): {
  functionId: string
  easeType: EaseType
  params?: { x: number; y: number }
} | null {
  // Check for Drift format: ease_x_y
  const driftMatch = command.match(/^ease_(\d+)_(\d+)$/)
  if (driftMatch) {
    return {
      functionId: 'drift',
      easeType: 'easein',  // Drift doesn't use ease type transformations
      params: {
        x: parseInt(driftMatch[1], 10),
        y: parseInt(driftMatch[2], 10)
      }
    }
  }
  
  // Check for standard format: InName, OutName, InOutName
  // Use a more robust regex that handles InOut before In/Out
  let prefix: string
  let baseName: string
  
  if (command.startsWith('InOut')) {
    prefix = 'InOut'
    baseName = command.slice(5)  // Remove 'InOut' prefix
  } else if (command.startsWith('In')) {
    prefix = 'In'
    baseName = command.slice(2)  // Remove 'In' prefix
  } else if (command.startsWith('Out')) {
    prefix = 'Out'
    baseName = command.slice(3)  // Remove 'Out' prefix
  } else {
    return null
  }
  
  if (!baseName) return null
  
  // Map prefix to easeType
  const easeType: EaseType = prefix === 'In' ? 'easein'
                            : prefix === 'Out' ? 'easeout'
                            : 'easeboth'
  
  // Find function ID by ScriptMapper name
  const functionId = Object.entries(SCRIPTMAPPER_NAMES).find(
    ([, smName]) => smName === baseName
  )?.[0]
  
  if (!functionId) return null
  
  return { functionId, easeType }
}
