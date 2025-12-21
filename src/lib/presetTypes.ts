/**
 * Preset Management Types and Utilities
 * 
 * Defines the schema for saving and loading application state presets.
 * Presets allow users to save, share, and restore complete app configurations.
 */

import type { AppState } from './urlState'

/**
 * Maximum number of presets allowed per user
 */
export const MAX_PRESETS = 50

/**
 * Preset source types
 */
export type PresetSource = 'local' | 'url' | 'import'

/**
 * Individual preset data structure
 */
export interface Preset {
  /** Unique identifier (UUID v4) */
  id: string
  
  /** User-provided preset name */
  name: string
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string
  
  /** Last update timestamp (ISO 8601) */
  updatedAt?: string
  
  /** Complete application state snapshot */
  data: AppState
  
  /** Preset metadata */
  meta: {
    /** Application identifier */
    app: string
    
    /** Preset schema version */
    version: number
    
    /** Origin of preset */
    source?: PresetSource
  }
}

/**
 * localStorage storage schema for presets
 */
export interface PresetStorage {
  /** Storage schema version */
  version: number
  
  /** Array of all saved presets */
  presets: Preset[]
}

/**
 * Storage key for presets in localStorage
 */
export const PRESET_STORAGE_KEY = 'easingviz.presets.v1'

/**
 * Current preset schema version
 */
export const PRESET_SCHEMA_VERSION = 1

/**
 * Generate a UUID v4 identifier for new presets
 */
export function generatePresetId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Type guard to validate if an object is a valid Preset
 */
export function validatePreset(obj: unknown): obj is Preset {
  if (!obj || typeof obj !== 'object') return false
  
  const preset = obj as Partial<Preset>
  
  // Check required fields
  if (typeof preset.id !== 'string' || !preset.id) return false
  if (typeof preset.name !== 'string' || !preset.name) return false
  if (typeof preset.createdAt !== 'string' || !preset.createdAt) return false
  if (!preset.data || typeof preset.data !== 'object') return false
  if (!preset.meta || typeof preset.meta !== 'object') return false
  
  // Check meta fields
  const meta = preset.meta
  if (typeof meta.app !== 'string' || meta.app !== 'EasingVisualizer') return false
  if (typeof meta.version !== 'number' || meta.version < 1) return false
  
  // Check optional fields if present
  if (preset.updatedAt !== undefined && typeof preset.updatedAt !== 'string') return false
  if (meta.source !== undefined && !['local', 'url', 'import'].includes(meta.source)) return false
  
  return true
}

/**
 * Type guard to validate if an object is valid PresetStorage
 */
export function validatePresetStorage(obj: unknown): obj is PresetStorage {
  if (!obj || typeof obj !== 'object') return false
  
  const storage = obj as Partial<PresetStorage>
  
  // Check required fields
  if (typeof storage.version !== 'number' || storage.version < 1) return false
  if (!Array.isArray(storage.presets)) return false
  
  // Validate each preset
  return storage.presets.every(validatePreset)
}

/**
 * Create an empty preset storage structure
 */
export function createEmptyStorage(): PresetStorage {
  return {
    version: PRESET_SCHEMA_VERSION,
    presets: []
  }
}

/**
 * Sanitize a preset name for safe display
 */
export function sanitizePresetName(name: string): string {
  return name.trim().slice(0, 100) // Limit to 100 characters
}
