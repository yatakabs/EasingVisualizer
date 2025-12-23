import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StatusIndicator } from '@/components/StatusIndicator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Play, Pause, Plus, FolderOpen, Export, GearSix } from '@phosphor-icons/react'
import { type PreviewType } from '@/lib/previewTypes'

interface ToolbarProps {
  // Animation state
  isPlaying: boolean
  isPausedAtEnd: boolean
  manualMode: boolean
  speed: number
  inputValue: number
  
  // Preview settings
  enabledPreviews: PreviewType[]
  
  // Handlers
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onInputValueChange: (value: number) => void
  onAddPanel: () => void
  onTogglePreview: (previewType: PreviewType) => void
  onOpenPresets: () => void
  onShare: () => void
  onToggleAdvanced: () => void
  
  // Advanced panel state
  showAdvanced: boolean
}

const SPEED_OPTIONS = [
  { value: '0.25', label: '0.25x' },
  { value: '0.5', label: '0.5x' },
  { value: '0.75', label: '0.75x' },
  { value: '1', label: '1x' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
]

/**
 * Sticky toolbar with essential animation controls.
 * Contains: Play/Pause, Speed, Input slider, Preview toggles, Add Panel, Presets, Share, Settings
 */
export const Toolbar = memo(function Toolbar({
  isPlaying,
  isPausedAtEnd,
  manualMode,
  speed,
  inputValue,
  enabledPreviews,
  onPlayPause,
  onSpeedChange,
  onInputValueChange,
  onAddPanel,
  onTogglePreview,
  onOpenPresets,
  onShare,
  onToggleAdvanced,
  showAdvanced
}: ToolbarProps) {
  const handleSpeedChange = useCallback((value: string) => {
    onSpeedChange(parseFloat(value))
  }, [onSpeedChange])

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
      role="toolbar"
      aria-label="Animation controls"
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-[120rem]">
        <div className="flex h-14 items-center gap-2 sm:gap-4">
          {/* Play/Pause Button - Primary action, always visible */}
          <Button
            size="sm"
            onClick={onPlayPause}
            disabled={manualMode}
            className="min-h-[44px] min-w-[44px] sm:min-w-[80px] gap-1.5 font-semibold"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause size={18} weight="fill" aria-hidden="true" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play size={18} weight="fill" aria-hidden="true" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </Button>

          {/* Status Indicator */}
          <StatusIndicator
            isPlaying={isPlaying}
            isPausedAtEnd={isPausedAtEnd}
            manualMode={manualMode}
            className="hidden sm:flex"
          />

          {/* Speed Dropdown */}
          <div className="hidden md:flex items-center gap-2">
            <Select value={speed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger 
                className="w-20 min-h-[36px]"
                aria-label="Animation speed"
              >
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                {SPEED_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input Value Slider - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 items-center gap-3 max-w-md">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Input
            </span>
            <Slider
              value={[inputValue]}
              onValueChange={([value]) => onInputValueChange(value)}
              min={0}
              max={1}
              step={0.001}
              disabled={!manualMode}
              className="flex-1"
              aria-label="Input value"
            />
            <span className="text-sm font-mono text-primary w-14 text-right">
              {inputValue.toFixed(3)}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1 lg:flex-none" />

          {/* Preview Type Toggles */}
          <div role="group" aria-label="Preview type selection" className="hidden sm:block">
            <ToggleGroup 
              type="multiple" 
              value={enabledPreviews}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem 
                value="glow" 
                aria-label="Toggle glow preview"
                onClick={() => onTogglePreview('glow')}
                className="min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm"
              >
                G
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="graph" 
                aria-label="Toggle graph preview"
                onClick={() => onTogglePreview('graph')}
                className="min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm"
              >
                Γ
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="camera" 
                aria-label="Toggle camera preview"
                onClick={() => onTogglePreview('camera')}
                className="min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm"
              >
                📷
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="value" 
                aria-label="Toggle value preview"
                onClick={() => onTogglePreview('value')}
                className="min-h-[44px] min-w-[44px] px-2 sm:px-3 text-xs sm:text-sm"
              >
                #
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Add Panel Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onAddPanel}
            className="min-h-[44px] min-w-[44px] gap-1.5"
            aria-label="Add new panel"
          >
            <Plus size={18} aria-hidden="true" />
            <span className="hidden md:inline">Add</span>
          </Button>

          {/* Presets Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenPresets}
            className="min-h-[44px] min-w-[44px] gap-1.5"
            aria-label="Open presets"
          >
            <FolderOpen size={18} aria-hidden="true" />
            <span className="hidden lg:inline">Presets</span>
          </Button>

          {/* Share Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            className="min-h-[44px] min-w-[44px] gap-1.5"
            aria-label="Share configuration"
          >
            <Export size={18} aria-hidden="true" />
            <span className="hidden lg:inline">Share</span>
          </Button>

          {/* Advanced Settings Toggle */}
          <Button
            size="sm"
            variant={showAdvanced ? "secondary" : "ghost"}
            onClick={onToggleAdvanced}
            className="min-h-[44px] min-w-[44px]"
            aria-label={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            aria-expanded={showAdvanced}
          >
            <GearSix size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
})
