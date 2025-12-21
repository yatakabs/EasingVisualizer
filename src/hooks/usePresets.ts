/**
 * Preset Management Hook
 * 
 * Provides CRUD operations for saving, loading, and managing app state presets.
 * Handles localStorage persistence with debounced writes and error handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppState } from '@/lib/urlState'
import {
  type Preset,
  type PresetStorage,
  type PresetSource,
  MAX_PRESETS,
  PRESET_STORAGE_KEY,
  PRESET_SCHEMA_VERSION,
  generatePresetId,
  validatePresetStorage,
  validatePreset,
  createEmptyStorage,
  sanitizePresetName
} from '@/lib/presetTypes'

/**
 * Result of import operation
 */
export interface ImportResult {
  /** Number of successfully imported presets */
  success: number
  
  /** Number of failed preset imports */
  failed: number
  
  /** Detailed error information for failed imports */
  errors: Array<{
    index: number
    preset: string
    reason: string
  }>
}

/**
 * Conflict resolution strategies for preset imports
 */
export type ConflictStrategy = 'merge' | 'replace' | 'rename'

/**
 * Hook return interface
 */
export interface UsePresetsReturn {
  /** Array of all saved presets */
  presets: Preset[]
  
  /** Loading state for initial load */
  isLoading: boolean
  
  /** Error state */
  error: string | null
  
  /** Whether more presets can be saved (under MAX_PRESETS) */
  canSaveMore: boolean
  
  /** Save current state as a new preset */
  savePreset: (name: string, state: AppState, source?: PresetSource) => Promise<Preset>
  
  /** Update an existing preset */
  updatePreset: (id: string, updates: Partial<Preset>) => Promise<void>
  
  /** Delete a preset */
  deletePreset: (id: string) => Promise<void>
  
  /** Export a single preset as JSON */
  exportPreset: (id: string) => void
  
  /** Export all presets as JSON */
  exportAllPresets: () => void
  
  /** Import presets from JSON */
  importPresets: (json: string, strategy: ConflictStrategy) => Promise<ImportResult>
  
  /** Force immediate write of pending changes */
  flushPendingWrites: () => void
}

/**
 * Preset management hook
 */
export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<Preset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track pending writes for debouncing
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingStorageRef = useRef<PresetStorage | null>(null)
  
  /**
   * Write storage to localStorage immediately
   */
  const writeToStorage = useCallback((storage: PresetStorage) => {
    try {
      const json = JSON.stringify(storage)
      localStorage.setItem(PRESET_STORAGE_KEY, json)
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete or export old presets.')
      }
      throw err
    }
  }, [])
  
  /**
   * Schedule a debounced write to localStorage
   */
  const scheduleWrite = useCallback((storage: PresetStorage) => {
    pendingStorageRef.current = storage
    
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current)
    }
    
    writeTimeoutRef.current = setTimeout(() => {
      if (pendingStorageRef.current) {
        try {
          writeToStorage(pendingStorageRef.current)
          pendingStorageRef.current = null
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save presets')
        }
      }
    }, 300)
  }, [writeToStorage])
  
  /**
   * Force immediate write of any pending changes
   */
  const flushPendingWrites = useCallback(() => {
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current)
      writeTimeoutRef.current = null
    }
    
    if (pendingStorageRef.current) {
      try {
        writeToStorage(pendingStorageRef.current)
        pendingStorageRef.current = null
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save presets')
      }
    }
  }, [writeToStorage])
  
  /**
   * Load presets from localStorage
   */
  const loadPresets = useCallback(() => {
    try {
      const json = localStorage.getItem(PRESET_STORAGE_KEY)
      
      if (!json) {
        // No presets yet - initialize with empty storage
        const emptyStorage = createEmptyStorage()
        setPresets([])
        setIsLoading(false)
        return
      }
      
      const parsed = JSON.parse(json)
      
      if (!validatePresetStorage(parsed)) {
        console.warn('Invalid preset storage format, resetting to empty')
        writeToStorage(createEmptyStorage())
        setPresets([])
        setIsLoading(false)
        return
      }
      
      setPresets(parsed.presets)
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to load presets:', err)
      setError('Failed to load presets')
      setPresets([])
      setIsLoading(false)
    }
  }, [writeToStorage])
  
  /**
   * Save a new preset
   */
  const savePreset = useCallback(async (
    name: string,
    state: AppState,
    source: PresetSource = 'local'
  ): Promise<Preset> => {
    // Check preset limit
    if (presets.length >= MAX_PRESETS) {
      throw new Error(`Preset limit reached (${MAX_PRESETS} max). Please delete or export old presets.`)
    }
    
    const sanitizedName = sanitizePresetName(name)
    if (!sanitizedName) {
      throw new Error('Preset name cannot be empty')
    }
    
    const now = new Date().toISOString()
    const newPreset: Preset = {
      id: generatePresetId(),
      name: sanitizedName,
      createdAt: now,
      data: state,
      meta: {
        app: 'EasingVisualizer',
        version: PRESET_SCHEMA_VERSION,
        source
      }
    }
    
    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    
    const storage: PresetStorage = {
      version: PRESET_SCHEMA_VERSION,
      presets: updatedPresets
    }
    
    scheduleWrite(storage)
    
    return newPreset
  }, [presets, scheduleWrite])
  
  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(async (
    id: string,
    updates: Partial<Preset>
  ): Promise<void> => {
    const presetIndex = presets.findIndex(p => p.id === id)
    if (presetIndex === -1) {
      throw new Error('Preset not found')
    }
    
    const now = new Date().toISOString()
    const updatedPreset: Preset = {
      ...presets[presetIndex],
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: now
    }
    
    // Sanitize name if being updated
    if (updates.name !== undefined) {
      updatedPreset.name = sanitizePresetName(updates.name)
      if (!updatedPreset.name) {
        throw new Error('Preset name cannot be empty')
      }
    }
    
    const updatedPresets = [...presets]
    updatedPresets[presetIndex] = updatedPreset
    setPresets(updatedPresets)
    
    const storage: PresetStorage = {
      version: PRESET_SCHEMA_VERSION,
      presets: updatedPresets
    }
    
    scheduleWrite(storage)
  }, [presets, scheduleWrite])
  
  /**
   * Delete a preset
   */
  const deletePreset = useCallback(async (id: string): Promise<void> => {
    const updatedPresets = presets.filter(p => p.id !== id)
    setPresets(updatedPresets)
    
    const storage: PresetStorage = {
      version: PRESET_SCHEMA_VERSION,
      presets: updatedPresets
    }
    
    // Flush immediately for delete operations
    try {
      writeToStorage(storage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset')
      throw err
    }
  }, [presets, writeToStorage])
  
  /**
   * Export a single preset as JSON file
   */
  const exportPreset = useCallback((id: string) => {
    // Flush pending writes before export
    flushPendingWrites()
    
    const preset = presets.find(p => p.id === id)
    if (!preset) {
      throw new Error('Preset not found')
    }
    
    const json = JSON.stringify([preset], null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}_preset.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [presets, flushPendingWrites])
  
  /**
   * Export all presets as JSON file
   */
  const exportAllPresets = useCallback(() => {
    // Flush pending writes before export
    flushPendingWrites()
    
    const json = JSON.stringify(presets, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const timestamp = new Date().toISOString().split('T')[0]
    a.download = `easingviz_presets_${timestamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [presets, flushPendingWrites])
  
  /**
   * Import presets from JSON with conflict resolution
   */
  const importPresets = useCallback(async (
    json: string,
    strategy: ConflictStrategy
  ): Promise<ImportResult> => {
    // Flush pending writes before import
    flushPendingWrites()
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    try {
      const parsed = JSON.parse(json)
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid JSON format: expected array of presets')
      }
      
      // Validate all presets first (transactional - all or nothing)
      const validPresets: Preset[] = []
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        if (!validatePreset(item)) {
          result.errors.push({
            index: i,
            preset: typeof item === 'object' && item !== null && 'name' in item ? String(item.name) : 'unknown',
            reason: 'Invalid preset format'
          })
          result.failed++
        } else {
          validPresets.push(item)
        }
      }
      
      // If any preset is invalid, abort entire import
      if (result.failed > 0) {
        return result
      }
      
      // Check if import would exceed MAX_PRESETS
      let finalPresets: Preset[] = []
      
      if (strategy === 'replace') {
        finalPresets = validPresets
      } else if (strategy === 'merge' || strategy === 'rename') {
        const existingNames = new Set(presets.map(p => p.name))
        
        finalPresets = [...presets]
        
        for (const importedPreset of validPresets) {
          let name = importedPreset.name
          
          if (strategy === 'rename' && existingNames.has(name)) {
            // Find unique name with suffix
            let suffix = 1
            while (existingNames.has(`${name} (${suffix})`)) {
              suffix++
            }
            name = `${name} (${suffix})`
          }
          
          const preset: Preset = {
            ...importedPreset,
            name,
            id: generatePresetId(), // Generate new ID for imported preset
            createdAt: new Date().toISOString()
          }
          
          finalPresets.push(preset)
          existingNames.add(name)
        }
      }
      
      if (finalPresets.length > MAX_PRESETS) {
        throw new Error(`Import would exceed preset limit (${MAX_PRESETS} max). Current: ${presets.length}, Importing: ${validPresets.length}`)
      }
      
      // Commit to storage
      setPresets(finalPresets)
      
      const storage: PresetStorage = {
        version: PRESET_SCHEMA_VERSION,
        presets: finalPresets
      }
      
      writeToStorage(storage)
      
      result.success = validPresets.length
      return result
      
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Import failed: ${err.message}`)
      }
      throw err
    }
  }, [presets, flushPendingWrites, writeToStorage])
  
  // Load presets on mount
  useEffect(() => {
    loadPresets()
  }, [loadPresets])
  
  // Flush pending writes on unmount
  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current)
      }
      if (pendingStorageRef.current) {
        try {
          writeToStorage(pendingStorageRef.current)
        } catch (err) {
          console.error('Failed to flush pending writes on unmount:', err)
        }
      }
    }
  }, [writeToStorage])
  
  // Flush pending writes before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingWrites()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [flushPendingWrites])
  
  return {
    presets,
    isLoading,
    error,
    canSaveMore: presets.length < MAX_PRESETS,
    savePreset,
    updatePreset,
    deletePreset,
    exportPreset,
    exportAllPresets,
    importPresets,
    flushPendingWrites
  }
}
