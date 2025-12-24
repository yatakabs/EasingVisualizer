/**
 * ScriptMapper Preset Selector
 * 
 * Vertical scrollable preset selector for quick camera path selection.
 * Designed to be displayed alongside waypoints in a side-by-side layout.
 */

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CAMERA_PATH_PRESETS, clonePreset } from '@/lib/cameraPathPresets'
import type { CameraPath } from '@/lib/scriptMapperTypes'

interface ScriptMapperPresetSelectorProps {
  /** Currently active path ID */
  activePath: CameraPath | null
  /** Callback when a preset is selected */
  onSelectPreset: (path: CameraPath) => void
}

export const ScriptMapperPresetSelector = memo(function ScriptMapperPresetSelector({
  activePath,
  onSelectPreset
}: ScriptMapperPresetSelectorProps) {
  const handleSelect = useCallback((preset: CameraPath) => {
    // Clone preset to create a new user path
    const cloned = clonePreset(preset)
    onSelectPreset(cloned)
  }, [onSelectPreset])
  
  return (
    <div className="space-y-1 flex-shrink-0 w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Presets</span>
        <Badge variant="outline" className="text-[9px]">
          {CAMERA_PATH_PRESETS.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-[160px] border rounded-md bg-muted/30">
        <div className="flex flex-col gap-1 p-1">
          {CAMERA_PATH_PRESETS.map((preset) => {
            const isActive = activePath?.id === preset.id || 
                           activePath?.name.replace(' (Copy)', '') === preset.name
            const waypointCount = preset.waypoints.length
            const segmentCount = preset.segments.length
            const duration = (preset.totalDuration / 1000).toFixed(1)
            
            return (
              <Button
                key={preset.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="w-full h-auto py-1.5 px-2.5 text-[11px] flex flex-col items-start gap-0"
                onClick={() => handleSelect(preset)}
                title={`${preset.name}\n${waypointCount} waypoints, ${segmentCount} segments\n${preset.totalDuration}ms duration`}
              >
                <span className="font-medium w-full text-left leading-tight">{preset.name}</span>
                <span className="text-[9px] opacity-60 w-full text-left">
                  {waypointCount}pts · {segmentCount}seg · {duration}s
                </span>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
})
