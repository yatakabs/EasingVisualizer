/**
 * URL State Serialization Utilities
 * 
 * Provides encoding/decoding for sharing app state via URL.
 * Uses base64url encoding for URL-safe representation.
 */

import type { EaseType } from './easeTypes'
import type { PreviewType } from './previewTypes'

// Version for future migrations
export const STATE_VERSION = 1

/**
 * Compact panel representation for URL serialization
 */
export interface CompactPanel {
  f: string                         // functionId
  e: 'i' | 'o' | 'b'               // easeType (i=easein, o=easeout, b=easeboth)
}

/**
 * Full panel data as used in the app
 */
export interface PanelData {
  id: string
  functionId: string
  easeType: EaseType
  title?: string
}

/**
 * Compact URL state schema (Version 1)
 */
export interface ShareableStateV1 {
  v: 1                              // Version for future migrations
  p: CompactPanel[]                 // panels (short key)
  sp: number                        // speed
  gm: number                        // gamma
  ep: string[]                      // enabledPreviews  
  ef: string[]                      // enabledFilters
  mi: boolean                       // manualInputMode
  mv: number                        // manualInputValue
  tw: boolean                       // triangularWaveMode
  cs: [number, number, number]      // cameraStartPos as tuple
  ce: [number, number, number]      // cameraEndPos as tuple
  ca: string                        // cameraAspectRatio
  mc: number                        // maxCameraPreviews
  ap: number[]                      // activeCameraPanels (indices into panels)
  sc: number                        // cardScale
  co: 'l' | 'r'                     // coordinateSystem (l=left, r=right)
  cp: boolean                       // showControlPanel
  pd?: number                       // pauseDuration (optional for backward compatibility)
}

/**
 * Full app state interface for type safety
 */
export interface AppState {
  panels: PanelData[]
  savedSpeed: number
  savedGamma: number
  enabledPreviews: PreviewType[]
  enabledFilters: string[]
  manualInputMode: boolean
  manualInputValue: number
  triangularWaveMode: boolean
  cameraStartPos: { x: number; y: number; z: number }
  cameraEndPos: { x: number; y: number; z: number }
  cameraAspectRatio: string
  maxCameraPreviews: number
  activeCameraPanels: string[]
  cardScale: number
  coordinateSystem: 'left-handed' | 'right-handed'
  showControlPanel: boolean
  endPauseDuration: number  // End-of-cycle pause duration in seconds
}

// EaseType mapping for compact representation
const EASE_TYPE_TO_COMPACT: Record<EaseType, 'i' | 'o' | 'b'> = {
  'easein': 'i',
  'easeout': 'o',
  'easeboth': 'b'
}

const COMPACT_TO_EASE_TYPE: Record<'i' | 'o' | 'b', EaseType> = {
  'i': 'easein',
  'o': 'easeout',
  'b': 'easeboth'
}

// Coordinate system mapping
const COORD_TO_COMPACT: Record<'left-handed' | 'right-handed', 'l' | 'r'> = {
  'left-handed': 'l',
  'right-handed': 'r'
}

const COMPACT_TO_COORD: Record<'l' | 'r', 'left-handed' | 'right-handed'> = {
  'l': 'left-handed',
  'r': 'right-handed'
}

/**
 * Encode a string to base64url (URL-safe base64)
 */
function toBase64Url(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode a base64url string
 */
function fromBase64Url(str: string): string {
  // Restore standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }
  return decodeURIComponent(escape(atob(base64)))
}

/**
 * Type guard: Check if value is a valid compact easing type
 */
function isCompactEaseType(value: unknown): value is 'i' | 'o' | 'b' {
  return value === 'i' || value === 'o' || value === 'b'
}

/**
 * Type guard: Check if value is a valid compact coordinate system
 */
function isCompactCoordSystem(value: unknown): value is 'l' | 'r' {
  return value === 'l' || value === 'r'
}

/**
 * Type guard: Check if value is a number tuple [x, y, z]
 */
function isNumberTuple(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && 
         value.length === 3 && 
         value.every(v => typeof v === 'number')
}

/**
 * Type guard: Check if object is a valid CompactPanel
 */
function isCompactPanel(obj: unknown): obj is CompactPanel {
  if (!obj || typeof obj !== 'object') return false
  const panel = obj as Record<string, unknown>
  return typeof panel.f === 'string' && isCompactEaseType(panel.e)
}

/**
 * Type guard: Validate ShareableStateV1 structure
 */
function isShareableStateV1(obj: unknown): obj is ShareableStateV1 {
  if (!obj || typeof obj !== 'object') return false
  const state = obj as Record<string, unknown>
  
  return (
    state.v === 1 &&
    Array.isArray(state.p) &&
    state.p.every(isCompactPanel) &&
    typeof state.sp === 'number' &&
    typeof state.gm === 'number' &&
    Array.isArray(state.ep) &&
    state.ep.every((v: unknown) => typeof v === 'string') &&
    Array.isArray(state.ef) &&
    state.ef.every((v: unknown) => typeof v === 'string') &&
    typeof state.mi === 'boolean' &&
    typeof state.mv === 'number' &&
    typeof state.tw === 'boolean' &&
    isNumberTuple(state.cs) &&
    isNumberTuple(state.ce) &&
    typeof state.ca === 'string' &&
    typeof state.mc === 'number' &&
    Array.isArray(state.ap) &&
    state.ap.every((v: unknown) => typeof v === 'number') &&
    typeof state.sc === 'number' &&
    isCompactCoordSystem(state.co) &&
    typeof state.cp === 'boolean'
  )
}

/**
 * Encode app state to a URL-safe string
 */
export function encodeState(state: AppState): string {
  // Convert panels to compact format
  const compactPanels: CompactPanel[] = state.panels.map(panel => ({
    f: panel.functionId,
    e: EASE_TYPE_TO_COMPACT[panel.easeType]
  }))

  // Convert activeCameraPanels (IDs) to indices
  const panelIdToIndex = new Map(state.panels.map((p, i) => [p.id, i]))
  const activeCameraIndices = state.activeCameraPanels
    .map(id => panelIdToIndex.get(id))
    .filter((idx): idx is number => idx !== undefined)

  // Build compact state object
  const compact: ShareableStateV1 = {
    v: STATE_VERSION,
    p: compactPanels,
    sp: state.savedSpeed,
    gm: state.savedGamma,
    ep: state.enabledPreviews,
    ef: state.enabledFilters,
    mi: state.manualInputMode,
    mv: state.manualInputValue,
    tw: state.triangularWaveMode,
    cs: [state.cameraStartPos.x, state.cameraStartPos.y, state.cameraStartPos.z],
    ce: [state.cameraEndPos.x, state.cameraEndPos.y, state.cameraEndPos.z],
    ca: state.cameraAspectRatio,
    mc: state.maxCameraPreviews,
    ap: activeCameraIndices,
    sc: state.cardScale,
    co: COORD_TO_COMPACT[state.coordinateSystem],
    cp: state.showControlPanel,
    pd: state.endPauseDuration
  }

  const json = JSON.stringify(compact)
  return toBase64Url(json)
}

/**
 * Decode a URL-safe string to app state
 * Returns null if decoding fails or state is invalid
 */
export function decodeState(encoded: string): AppState | null {
  if (!encoded || typeof encoded !== 'string') {
    console.warn('Invalid encoded state: must be a non-empty string')
    return null
  }
  
  try {
    const json = fromBase64Url(encoded)
    const parsed = JSON.parse(json)
    
    // Validate version and structure
    if (!isShareableStateV1(parsed)) {
      console.warn('Invalid URL state structure')
      return null
    }

    // Migrate if needed (currently only v1)
    const compact = migrateState(parsed)
    
    // Convert compact panels to full format with deterministic IDs
    const panels: PanelData[] = compact.p.map((cp, index) => ({
      id: `panel-${index}`,
      functionId: cp.f,
      easeType: COMPACT_TO_EASE_TYPE[cp.e]
    }))

    // Convert active camera indices back to IDs
    const activeCameraPanels = compact.ap
      .filter(idx => idx >= 0 && idx < panels.length)
      .map(idx => panels[idx].id)

    // Build full app state
    const appState: AppState = {
      panels,
      savedSpeed: compact.sp,
      savedGamma: compact.gm,
      enabledPreviews: compact.ep as PreviewType[],
      enabledFilters: compact.ef,
      manualInputMode: compact.mi,
      manualInputValue: compact.mv,
      triangularWaveMode: compact.tw,
      cameraStartPos: { x: compact.cs[0], y: compact.cs[1], z: compact.cs[2] },
      cameraEndPos: { x: compact.ce[0], y: compact.ce[1], z: compact.ce[2] },
      cameraAspectRatio: compact.ca,
      maxCameraPreviews: compact.mc,
      activeCameraPanels,
      cardScale: compact.sc,
      coordinateSystem: COMPACT_TO_COORD[compact.co],
      showControlPanel: compact.cp,
      endPauseDuration: Math.max(0, Math.min(10, compact.pd ?? 2.0))  // Default 2.0s, clamped 0-10
    }

    return appState
  } catch (error) {
    console.error('Failed to decode URL state:', error)
    return null
  }
}

/**
 * Migrate state from older versions to current version
 * Currently only v1 exists, but this framework enables future migrations
 */
function migrateState(state: ShareableStateV1): ShareableStateV1 {
  switch (state.v) {
    case 1:
      return state
    default:
      // Unknown version - should not happen due to type guard
      console.warn(`Unknown state version: ${(state as { v: number }).v}`)
      return state
  }
}

/**
 * Get state from URL search params
 * Looks for the 's' parameter containing encoded state
 */
export function getStateFromURL(): AppState | null {
  // SSR guard
  if (typeof window === 'undefined') {
    return null
  }
  
  const params = new URLSearchParams(window.location.search)
  const stateParam = params.get('s')
  
  if (!stateParam) {
    return null
  }
  
  return decodeState(stateParam)
}

/**
 * Update URL with encoded state using replaceState (no history pollution)
 */
export function updateURLWithState(state: AppState): void {
  // SSR guard
  if (typeof window === 'undefined') {
    return
  }
  
  const encoded = encodeState(state)
  const newURL = `${window.location.pathname}?s=${encoded}`
  window.history.replaceState({}, '', newURL)
}

/**
 * Generate a shareable URL for the given state
 */
export function generateShareURL(state: AppState): string {
  // SSR guard
  if (typeof window === 'undefined') {
    return ''
  }
  
  const encoded = encodeState(state)
  return `${window.location.origin}${window.location.pathname}?s=${encoded}`
}

/**
 * Clear state parameter from URL
 */
export function clearURLState(): void {
  // SSR guard
  if (typeof window === 'undefined') {
    return
  }
  
  window.history.replaceState({}, '', window.location.pathname)
}
