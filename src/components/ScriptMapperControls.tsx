/**
 * ScriptMapper Controls
 * 
 * Main control panel for ScriptMapper N-point camera path mode.
 * Includes preset selection, path info display, and segment overview.
 * Supports direct editing of raw ScriptMapper commands.
 */

import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Video, 
  Path, 
  Info,
  Play,
  Pause,
  Copy,
  Download,
} from '@phosphor-icons/react'
import { ScriptMapperPresetSelector } from '@/components/ScriptMapperPresetSelector'
import { CAMERA_PATH_PRESETS } from '@/lib/cameraPathPresets'
import { EASING_FUNCTIONS } from '@/lib/easingFunctions'
import { 
  formatAsScriptMapperShortCommand,
} from '@/lib/scriptMapperCompat'
import { 
  exportToBookmarkJSON, 
  formatBookmarkJSON 
} from '@/lib/scriptMapperBookmark'
import { 
  normalizedToBeat, 
  calculateBeatDuration,
} from '@/lib/scriptMapperTypes'
import type { CameraPath, CameraSegment, CameraWaypoint } from '@/lib/scriptMapperTypes'
import { WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Command mode type
 * - 'q': Manual rotation mode (q_X_Y_Z_RX_RY_RZ_FOV)
 * - 'dpos': Look-At mode (dpos_X_Y_Z_FOV) - auto faces player
 */
type CommandMode = 'q' | 'dpos'

/**
 * Detect command mode from a bookmarkCommand string
 * Returns 'dpos' if starts with dpos_, otherwise 'q'
 */
function detectCommandMode(bookmarkCommand?: string): CommandMode {
  if (!bookmarkCommand) return 'q'
  const firstPart = bookmarkCommand.split(',')[0]?.trim() ?? ''
  return firstPart.startsWith('dpos_') ? 'dpos' : 'q'
}

/**
 * Convert a q command to dpos command
 * q_0_1_-5_0_0_0_60 → dpos_0_1_-5_60
 */
function qToDpos(bookmarkCommand: string): string {
  return bookmarkCommand.replace(
    /q_([^_]+)_([^_]+)_([^_]+)_[^_]+_[^_]+_[^_]+_([^_,]+)/g,
    'dpos_$1_$2_$3_$4'
  )
}

/**
 * Convert a dpos command to q command
 * dpos_0_1_-5_60 → q_0_1_-5_0_0_0_60 (rotation defaults to 0)
 */
function dposToQ(bookmarkCommand: string): string {
  return bookmarkCommand.replace(
    /dpos_([^_]+)_([^_]+)_([^_]+)_([^_,]+)/g,
    'q_$1_$2_$3_0_0_0_$4'
  )
}

/**
 * Parse position from bookmarkCommand
 * Extracts x, y, z from q_X_Y_Z_... or dpos_X_Y_Z_...
 */
function parsePositionFromCommand(bookmarkCommand?: string): { x: number; y: number; z: number } | null {
  if (!bookmarkCommand) return null
  
  // Try q format: q_X_Y_Z_RX_RY_RZ_FOV
  const qMatch = bookmarkCommand.match(/q_([^_]+)_([^_]+)_([^_]+)_/)
  if (qMatch) {
    return {
      x: parseFloat(qMatch[1]) || 0,
      y: parseFloat(qMatch[2]) || 0,
      z: parseFloat(qMatch[3]) || 0,
    }
  }
  
  // Try dpos format: dpos_X_Y_Z_FOV
  const dposMatch = bookmarkCommand.match(/dpos_([^_]+)_([^_]+)_([^_]+)_/)
  if (dposMatch) {
    return {
      x: parseFloat(dposMatch[1]) || 0,
      y: parseFloat(dposMatch[2]) || 0,
      z: parseFloat(dposMatch[3]) || 0,
    }
  }
  
  return null
}

/**
 * Valid command prefixes that don't require parameters
 * These are preset names or control commands
 */
const VALID_COMMAND_PREFIXES = [
  'spin', 'stop', 'next', '->', '|', 'center', 'side', 'top', 
  'diagf', 'diagb', 'orbit', 'shake', 'dolly', 'pan', 'tilt',
  'Ease', 'ease', 'Linear', 'linear' // easing command shortcuts
]

/**
 * Validate a ScriptMapper command string
 * Returns error message if invalid, null if valid
 */
function validateCommand(command: string): string | null {
  // Check for empty command
  if (!command.trim()) {
    return 'Command is required'
  }
  
  const trimmed = command.trim()
  const firstPart = trimmed.split(',')[0]
  
  // Validate q_ command format: q_X_Y_Z_RX_RY_RZ_FOV
  if (firstPart.startsWith('q_')) {
    const parts = firstPart.split('_')
    if (parts.length < 8) {
      return 'q_ requires 7 parameters: X_Y_Z_RX_RY_RZ_FOV'
    }
    // Check each numeric parameter (indices 1-7)
    for (let i = 1; i <= 7; i++) {
      if (parts[i] === undefined || parts[i] === '') {
        return `Parameter ${i} is missing`
      }
      if (isNaN(parseFloat(parts[i]))) {
        return `Parameter ${i} must be a number`
      }
    }
    return null
  }
  
  // Validate dpos_ command format: dpos_X_Y_Z_FOV
  if (firstPart.startsWith('dpos_')) {
    const parts = firstPart.split('_')
    if (parts.length < 5) {
      return 'dpos_ requires 4 parameters: X_Y_Z_FOV'
    }
    // Check each numeric parameter (indices 1-4)
    for (let i = 1; i <= 4; i++) {
      if (parts[i] === undefined || parts[i] === '') {
        return `Parameter ${i} is missing`
      }
      if (isNaN(parseFloat(parts[i]))) {
        return `Parameter ${i} must be a number`
      }
    }
    return null
  }
  
  // Allow known command prefixes (preset names, control commands)
  if (VALID_COMMAND_PREFIXES.some(prefix => firstPart.startsWith(prefix))) {
    return null
  }
  
  // Check for In/Out/InOut easing shortcuts like "InSine", "OutQuad", etc.
  if (/^(In|Out|InOut)[A-Z][a-z]+/.test(firstPart)) {
    return null
  }
  
  return 'Unknown command. Use q_, dpos_, or preset names'
}

interface ScriptMapperControlsProps {
  /** ScriptMapper mode enabled */
  enabled: boolean
  /** Callback to toggle ScriptMapper mode */
  onToggleEnabled: (enabled: boolean) => void
  /** Current camera path */
  activePath: CameraPath | null
  /** Callback when a path is selected or modified */
  onSelectPath: (path: CameraPath) => void
  /** Current animation time (0-1) */
  globalTime: number
  /** Whether animation is playing */
  isPlaying: boolean
  /** Callback to toggle play/pause */
  onTogglePlay: () => void
}

// Segment colors matching the preview components
const SEGMENT_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#00ff00', // Green
  '#ff8800', // Orange
  '#8800ff', // Purple
  '#ff0088', // Pink
  '#00ff88', // Teal
]

/**
 * Get display name for a segment's easing
 */
function getSegmentEasingName(segment: CameraSegment): string {
  if (!segment.easingEnabled) {
    return 'Linear'
  }
  
  const fn = EASING_FUNCTIONS.find(f => f.id === segment.functionId)
  const fnName = fn?.name ?? segment.functionId
  
  const typeLabel = segment.easeType === 'easein' ? 'In'
                  : segment.easeType === 'easeout' ? 'Out'
                  : 'InOut'
  
  return `${typeLabel}${fnName}`
}

export const ScriptMapperControls = memo(function ScriptMapperControls({
  enabled,
  onToggleEnabled,
  activePath,
  onSelectPath,
  globalTime,
  isPlaying,
  onTogglePlay
}: ScriptMapperControlsProps) {
  // BPM input state
  const [bpmInput, setBpmInput] = useState<string>('')
  
  // Command validation errors for each waypoint
  const [commandErrors, setCommandErrors] = useState<{ [waypointIndex: number]: string | null }>({})
  
  // Initialize/update errors when path changes
  useEffect(() => {
    if (!activePath) {
      setCommandErrors({})
      return
    }
    
    // Validate all waypoints on path change
    const errors: { [waypointIndex: number]: string | null } = {}
    activePath.waypoints.forEach((wp, idx) => {
      if (wp.bookmarkCommand) {
        errors[idx] = validateCommand(wp.bookmarkCommand)
      }
    })
    setCommandErrors(errors)
  }, [activePath?.id, activePath?.waypoints.length])
  
  // Check if current path is a preset (presets are read-only)
  const isPreset = useMemo(() => {
    if (!activePath) return false
    return CAMERA_PATH_PRESETS.some(p => p.id === activePath.id)
  }, [activePath])
  
  // Current segment info
  const currentSegmentInfo = useMemo(() => {
    if (!activePath || activePath.segments.length === 0) {
      return { index: 0, total: 0, name: '', localTime: 0 }
    }
    
    // Find current segment based on global time
    for (let i = 0; i < activePath.segments.length; i++) {
      const segment = activePath.segments[i]
      const fromWp = activePath.waypoints.find(w => w.id === segment.fromWaypointId)
      const toWp = activePath.waypoints.find(w => w.id === segment.toWaypointId)
      
      if (!fromWp || !toWp) continue
      
      if (globalTime >= fromWp.time && globalTime <= toWp.time) {
        const localTime = (globalTime - fromWp.time) / (toWp.time - fromWp.time)
        return {
          index: i,
          total: activePath.segments.length,
          name: getSegmentEasingName(segment),
          localTime
        }
      }
    }
    
    return {
      index: activePath.segments.length - 1,
      total: activePath.segments.length,
      name: getSegmentEasingName(activePath.segments[activePath.segments.length - 1]),
      localTime: 1
    }
  }, [activePath, globalTime])
  
  // Handle preset selection from dropdown
  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = CAMERA_PATH_PRESETS.find(p => p.id === presetId)
    if (preset) {
      // Create a copy for user editing
      const copy = {
        ...preset,
        id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${preset.name} (Copy)`,
        waypoints: preset.waypoints.map(wp => ({ ...wp })),
        segments: preset.segments.map(seg => ({ ...seg }))
      }
      onSelectPath(copy)
    }
  }, [onSelectPath])
  
  /**
   * Toggle command mode for a specific waypoint (q ↔ dpos)
   */
  const handleToggleWaypointMode = useCallback((waypointIndex: number) => {
    if (!activePath || isPreset) return
    
    const waypoint = activePath.waypoints[waypointIndex]
    if (!waypoint?.bookmarkCommand) return
    
    const currentMode = detectCommandMode(waypoint.bookmarkCommand)
    const convertFn = currentMode === 'q' ? qToDpos : dposToQ
    const newCommand = convertFn(waypoint.bookmarkCommand)
    
    // Parse new position from converted command
    const newPosition = parsePositionFromCommand(newCommand)
    
    const updatedWaypoint: CameraWaypoint = {
      ...waypoint,
      bookmarkCommand: newCommand,
      position: newPosition ?? waypoint.position,
    }
    
    const newWaypoints = [...activePath.waypoints]
    newWaypoints[waypointIndex] = updatedWaypoint
    
    onSelectPath({
      ...activePath,
      waypoints: newWaypoints,
    })
  }, [activePath, isPreset, onSelectPath])
  
  /**
   * Update raw command for a specific waypoint
   * Validates immediately and updates preview in real-time
   */
  const handleCommandChange = useCallback((waypointIndex: number, newCommand: string) => {
    if (!activePath || isPreset) return
    
    const waypoint = activePath.waypoints[waypointIndex]
    
    // Validate command immediately (no debounce)
    const error = validateCommand(newCommand)
    setCommandErrors(prev => ({
      ...prev,
      [waypointIndex]: error
    }))
    
    // Parse position from command for internal state update
    const newPosition = parsePositionFromCommand(newCommand)
    
    const updatedWaypoint: CameraWaypoint = {
      ...waypoint,
      bookmarkCommand: newCommand,
      position: newPosition ?? waypoint.position,
    }
    
    const newWaypoints = [...activePath.waypoints]
    newWaypoints[waypointIndex] = updatedWaypoint
    
    onSelectPath({
      ...activePath,
      waypoints: newWaypoints,
    })
  }, [activePath, isPreset, onSelectPath])
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Video weight="duotone" className="w-5 h-5" />
            ScriptMapper Mode
          </CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={onToggleEnabled}
            aria-label="Toggle ScriptMapper mode"
          />
        </div>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-3">
          {/* Path Selection Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm">Active Path</Label>
            <Select
              value={activePath?.id ?? ''}
              onValueChange={handlePresetSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a camera path...">
                  {activePath?.name ?? 'Select a path'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CAMERA_PATH_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <Path className="w-4 h-4" />
                      <span>{preset.name}</span>
                      <Badge variant="secondary" className="text-[9px] ml-1">
                        {preset.waypoints.length}pts
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Path Info */}
          {activePath && (
            <>
              <Separator />
              
              <div className="space-y-2">
                {/* Compact Path Info - single row */}
                <div className="flex items-center gap-3 text-xs">
                  <Info weight="duotone" className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Pts:</span>
                  <span className="font-mono">{activePath.waypoints.length}</span>
                  <span className="text-muted-foreground">Dur:</span>
                  <span className="font-mono">{activePath.totalDuration}ms</span>
                  <span className="text-muted-foreground">Coord:</span>
                  <span className="font-mono">{activePath.coordinateSystem}</span>
                </div>
                
                {/* BPM Section - compact single row */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs flex-shrink-0">BPM:</Label>
                  <Input
                    type="number"
                    placeholder="140"
                    value={bpmInput}
                    onChange={(e) => setBpmInput(e.target.value)}
                    className="h-7 text-xs w-16"
                    min={60}
                    max={300}
                    step={1}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const bpm = parseInt(bpmInput, 10)
                      if (bpm >= 60 && bpm <= 300) {
                        const beatDuration = calculateBeatDuration(activePath.totalDuration, bpm)
                        onSelectPath({
                          ...activePath,
                          bpm,
                          beatOffset: 0,
                          beatDuration
                        })
                      }
                    }}
                    disabled={!bpmInput || parseInt(bpmInput, 10) < 60 || parseInt(bpmInput, 10) > 300}
                  >
                    Apply
                  </Button>
                  {activePath.bpm && activePath.beatDuration && (
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {activePath.beatDuration} beats
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Waypoints and Presets - Side by Side Layout */}
              <div className="flex gap-2">
                {/* Left: Waypoints Overview */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Waypoints</span>
                    {isPreset && (
                      <Badge variant="outline" className="text-[9px]">Read-only</Badge>
                    )}
                  </div>
                  {/* Column headers */}
                  <div className="flex items-center gap-1.5 px-1.5 text-[9px] text-muted-foreground">
                    <span className="w-2 flex-shrink-0" /> {/* Color dot spacer */}
                    <span className="w-10 flex-shrink-0 text-center">Mode</span>
                    <span className="flex-1">Command</span>
                    <span className="w-5" /> {/* Copy button spacer */}
                  </div>
                  <div className="space-y-0.5 h-[160px] overflow-y-auto pr-0.5 border rounded-md p-1 bg-muted/30">
                    {activePath.waypoints.map((waypoint, idx) => {
                      // Check if current time is at or past this waypoint
                      const isActive = globalTime >= waypoint.time && 
                        (idx === activePath.waypoints.length - 1 || globalTime < activePath.waypoints[idx + 1].time)

                      // Detect current command mode from bookmarkCommand
                      const currentMode = detectCommandMode(waypoint.bookmarkCommand)

                      // Raw command for display and edit
                      const rawCommand = waypoint.bookmarkCommand ?? ''

                      // Get validation error for this waypoint
                      const error = commandErrors[idx]

                      // Waypoint beat数（timeが0-1正規化、activePath.beatDurationがあればそれを使う）
                      let beat: string | number = ''
                      if (typeof waypoint.time === 'number' && activePath.beatDuration) {
                        // 0-1正規化time × beatDuration で小数第2位まで
                        beat = (waypoint.time * activePath.beatDuration).toFixed(2)
                      } else if (typeof waypoint.time === 'number') {
                        beat = waypoint.time.toFixed(3)
                      }

                      return (
                        <div
                          key={waypoint.id}
                          className={cn(
                            'rounded text-xs p-1.5',
                            isActive ? 'bg-primary/10 border border-primary/30' : 'bg-background',
                            error && 'border-destructive/50'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {/* Color dot with active indicator */}
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                              style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                            />

                            {/* q/dpos toggle button */}
                            <Button
                              size="sm"
                              variant={currentMode === 'q' ? 'default' : 'secondary'}
                              className="h-5 w-10 px-1 text-[9px] font-mono flex-shrink-0"
                              onClick={() => handleToggleWaypointMode(idx)}
                              disabled={isPreset}
                              title={currentMode === 'q' 
                                ? 'Manual Rotation - Click for dpos' 
                                : 'Look-At Player - Click for q'}
                            >
                              {currentMode}
                            </Button>

                            {/* Editable Command input - takes most of the width */}
                            <Input
                              type="text"
                              value={rawCommand}
                              onChange={(e) => handleCommandChange(idx, e.target.value)}
                              className={cn(
                                'h-5 text-[10px] font-mono flex-1 min-w-0 px-1',
                                error && 'border-destructive focus-visible:ring-destructive'
                              )}
                              placeholder="q_0_1_-5_0_0_0_60"
                              disabled={isPreset}
                              title={rawCommand}
                            />

                            {/* Copy button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 flex-shrink-0 hover:bg-primary/10"
                              onClick={() => {
                                const textToCopy = `${rawCommand}${beat !== '' ? ` | ${beat}` : ''}`
                                navigator.clipboard.writeText(textToCopy)
                              }}
                              title={`Copy: ${rawCommand}${beat !== '' ? ` | ${beat}` : ''}`}
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>

                          {/* Error message display - inline */}
                          {error && (
                            <div className="flex items-center gap-1 mt-1 text-destructive">
                              <WarningCircle className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="text-[9px] truncate">{error}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Right: Preset Selector */}
                <ScriptMapperPresetSelector
                  activePath={activePath}
                  onSelectPreset={onSelectPath}
                />
              </div>
              
              <Separator />
              
              {/* Export Section - collapsed by default with max-height */}
              <Accordion type="single" collapsible defaultValue="" className="w-full">
                <AccordionItem value="export" className="border-none">
                  <AccordionTrigger className="py-1.5 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Export</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1 max-h-[180px] overflow-y-auto">
                    {/* Segment Commands */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Segment Commands</Label>
                      <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                        {activePath.segments.map((segment, idx) => {
                          const command = formatAsScriptMapperShortCommand(
                            segment.functionId,
                            segment.easeType,
                            segment.driftParams
                          )
                          const fromWp = activePath.waypoints.find(w => w.id === segment.fromWaypointId)
                          const toWp = activePath.waypoints.find(w => w.id === segment.toWaypointId)
                          
                          return (
                            <div key={segment.id} className="flex items-center gap-2 text-xs">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[10px] truncate">
                                  {fromWp?.name ?? `P${idx}`} → {toWp?.name ?? `P${idx + 1}`}
                                </div>
                                <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                                  {command ?? 'Linear'}
                                </code>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(command ?? 'easeLinear')
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const commands = activePath.segments.map(seg => 
                            formatAsScriptMapperShortCommand(seg.functionId, seg.easeType, seg.driftParams) ?? 'easeLinear'
                          )
                          navigator.clipboard.writeText(JSON.stringify(commands, null, 2))
                        }}
                      >
                        <Copy className="w-3 h-3 mr-2" /> Copy All Commands
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    {/* Full Bookmark Export */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Full Bookmark JSON</Label>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          const bookmark = exportToBookmarkJSON(activePath, 'CameraPath', true)
                          const json = formatBookmarkJSON(bookmark)
                          navigator.clipboard.writeText(json)
                        }}
                      >
                        <Download className="w-3 h-3 mr-2" /> Export Bookmark JSON
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        Beat Saber v3 format with _pointDefinitions and _customEvents
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <Separator />
              
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTogglePlay}
                  className="flex-1"
                >
                  {isPlaying ? (
                    <>
                      <Pause weight="fill" className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play weight="fill" className="w-4 h-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
                <div className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                  {(globalTime * 100).toFixed(1)}%
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
})
