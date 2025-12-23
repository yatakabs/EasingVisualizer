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
  // ScriptMapper naming directly matches internal naming:
  // - In (I): EaseIn = slow at START
  // - Out (O): EaseOut = slow at END
  const prefix = easeType === 'easein' ? 'In'    // Internal easein → ScriptMapper In
               : easeType === 'easeout' ? 'Out'  // Internal easeout → ScriptMapper Out
               : 'InOut'
  
  return `${prefix}${smName}`
}

/**
 * Format a function configuration as a ScriptMapper short command string
 * Uses abbreviated prefixes: I (In), O (Out), IO (InOut)
 * This matches the actual bookmark format used in Beat Saber maps
 * 
 * @param functionId - Internal function ID
 * @param easeType - Ease type (easein/easeout/easeboth)
 * @param driftParams - Parameters for Drift function (x, y in range 0-10)
 * @returns ScriptMapper short command string (e.g., 'ISine', 'OQuad', 'IOCubic', 'ease_6_6') or null if not compatible
 */
export function formatAsScriptMapperShortCommand(
  functionId: string,
  easeType: EaseType,
  driftParams?: { x: number; y: number }
): string | null {
  // Drift function uses special format: ease_x_y (no short form)
  if (functionId === 'drift') {
    if (!driftParams) return null
    return `ease_${driftParams.x}_${driftParams.y}`
  }
  
  // Get ScriptMapper base name
  const smName = getScriptMapperName(functionId)
  if (!smName) return null
  
  // Add abbreviated prefix based on easeType: I, O, IO
  // ScriptMapper naming directly matches internal naming:
  // - I: EaseIn = slow at START
  // - O: EaseOut = slow at END
  const prefix = easeType === 'easein' ? 'I'    // Internal easein → ScriptMapper I
               : easeType === 'easeout' ? 'O'   // Internal easeout → ScriptMapper O
               : 'IO'
  
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
  // Check for standard formats: InOutName / IOName / InName / IName / OutName / OName
  // Prefer longest prefixes first to avoid ambigous slicing
  // ScriptMapper naming directly matches internal naming:
  // - In/I: EaseIn = slow at START
  // - Out/O: EaseOut = slow at END
  const prefixes = [
    { keys: ['InOut', 'IO'], ease: 'easeboth' as EaseType },
    { keys: ['In', 'I'], ease: 'easein' as EaseType },    // ScriptMapper In → internal easein
    { keys: ['Out', 'O'], ease: 'easeout' as EaseType }   // ScriptMapper Out → internal easeout
  ]

  for (const group of prefixes) {
    for (const key of group.keys) {
      if (command.startsWith(key)) {
        const baseName = command.slice(key.length)
        if (!baseName) return null

        const easeType: EaseType = group.ease

        // Find function ID by ScriptMapper name
        const functionId = Object.entries(SCRIPTMAPPER_NAMES).find(
          ([, smName]) => smName === baseName
        )?.[0]

        if (!functionId) return null

        return { functionId, easeType }
      }
    }
  }

  return null
}

/**
 * Extract easing command from a bookmark name string.
 * 
 * Bookmark names in Beat Saber maps often contain comma-separated commands
 * where the easing appears as the last element (e.g., 'dpos_-0.5_3_-3,spin60,IBack').
 * 
 * This function iterates from the end of the parts to find the first valid
 * easing command, which aligns with observed patterns in real map data where
 * easing typically appears as the final element.
 * 
 * @param bookmarkName - Full bookmark name string (e.g., 'dpos_-0.5_3_-3,spin60,IBack')
 * @returns The easing command if found (e.g., 'IBack'), or null if no valid easing is present
 * 
 * @example
 * extractEasingFromBookmarkName('dpos_-0.5_3_-3,spin60,IBack')  // Returns 'IBack'
 * extractEasingFromBookmarkName('spin60,IOQuad')                // Returns 'IOQuad'
 * extractEasingFromBookmarkName('ease_3_7')                     // Returns 'ease_3_7'
 * extractEasingFromBookmarkName('dpos_0_0_0')                   // Returns null
 */
export function extractEasingFromBookmarkName(bookmarkName: string): string | null {
  // Split by comma to get individual command parts
  const parts = bookmarkName.split(',')
  
  // Iterate from end to find easing command (easing typically appears last)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim()
    
    // Try to parse as ScriptMapper command
    const parsed = parseScriptMapperCommand(part)
    if (parsed) {
      return part
    }
  }
  
  return null
}
