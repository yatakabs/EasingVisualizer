/**
 * ScriptMapper Preset Selector
 * 
 * Horizontal scrollable preset selector for quick camera path selection.
 */

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Play } from '@phosphor-icons/react'
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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Presets</span>
        <Badge variant="outline" className="text-[9px]">
          {CAMERA_PATH_PRESETS.length}
        </Badge>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-1.5 pb-1">
          {CAMERA_PATH_PRESETS.map((preset) => {
            const isActive = activePath?.id === preset.id || 
                           activePath?.name.replace(' (Copy)', '') === preset.name
            const waypointCount = preset.waypoints.length
            
            return (
              <Button
                key={preset.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0 h-auto py-1 px-2 text-[10px]"
                onClick={() => handleSelect(preset)}
                title={`${preset.name} (${waypointCount} waypoints)`}
              >
                {preset.name} <span className="ml-1 opacity-60">{waypointCount}</span>
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
})
