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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Presets</span>
        <Badge variant="outline" className="text-[10px]">
          {CAMERA_PATH_PRESETS.length} available
        </Badge>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {CAMERA_PATH_PRESETS.map((preset) => {
            const isActive = activePath?.id === preset.id || 
                           activePath?.name.replace(' (Copy)', '') === preset.name
            const waypointCount = preset.waypoints.length
            
            return (
              <Button
                key={preset.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0 h-auto py-2 px-3 flex flex-col items-start gap-0.5"
                onClick={() => handleSelect(preset)}
              >
                <span className="text-xs font-medium truncate max-w-[120px]">
                  {preset.name}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Play weight="fill" className="w-2.5 h-2.5" />
                  {waypointCount} waypoints
                </span>
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
})
