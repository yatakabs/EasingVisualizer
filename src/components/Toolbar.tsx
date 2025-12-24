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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Play, Pause, Plus, FolderOpen, Export, GearSix, DotsThreeVertical, SquaresFour, Video } from '@phosphor-icons/react'
import { type PreviewType } from '@/lib/previewTypes'
import { cn } from '@/lib/utils'

type AppMode = 'normal' | 'scriptmapper'

interface ToolbarProps {
  // Animation state
  isPlaying: boolean
  isPausedAtEnd: boolean
  manualMode: boolean
  speed: number
  inputValue: number
  
  // Preview settings
  enabledPreviews: PreviewType[]
  
  // Mode switching
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  
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
  mode,
  onModeChange,
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
      className="sticky top-0 z-sticky w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
      role="toolbar"
      aria-label="Animation controls"
    >
      <div className="container mx-auto px-2 sm:px-3 max-w-[120rem]">
        <div className="flex h-11 items-center gap-1.5 sm:gap-2 lg:gap-3">
          {/* Play/Pause Button - Primary action, always visible */}
          <Button
            size="sm"
            onClick={onPlayPause}
            disabled={manualMode}
            className="min-h-[36px] min-w-[36px] sm:min-w-[72px] gap-1 font-semibold btn-press"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause size={16} weight="fill" aria-hidden="true" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play size={16} weight="fill" aria-hidden="true" />
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

          {/* Mode Switcher - Desktop: ToggleGroup */}
          <div className="hidden md:flex items-center" role="group" aria-label="Application mode">
            <ToggleGroup 
              type="single" 
              value={mode}
              onValueChange={(value) => value && onModeChange(value as AppMode)}
              className="h-9 bg-muted/50 rounded-md"
            >
              <ToggleGroupItem 
                value="normal" 
                className="min-h-[36px] min-w-[36px] px-2 text-xs data-[state=on]:bg-background"
                aria-label="Normal mode - Easing function comparison"
              >
                <SquaresFour size={14} className="mr-1" aria-hidden="true" />
                <span className="hidden lg:inline">Easing</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="scriptmapper" 
                className="min-h-[36px] min-w-[36px] px-2 text-xs data-[state=on]:bg-background"
                aria-label="ScriptMapper mode - Camera paths"
              >
                <Video size={14} className="mr-1" aria-hidden="true" />
                <span className="hidden lg:inline">ScriptMapper</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Speed Dropdown */}
          <div className="hidden md:flex items-center gap-1.5">
            <Select value={speed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger 
                className="w-18 min-h-[32px]"
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

          {/* Input Value Slider - Show at md but narrower, full width at lg */}
          <div className="hidden md:flex flex-1 items-center gap-1.5 lg:gap-2 max-w-[12rem] lg:max-w-xs">
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
          <div className="flex-1 md:flex-none" />

          {/* Preview Type Toggles - Responsive text */}
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
                className="min-h-[36px] min-w-[36px] px-1.5 md:px-2 text-xs"
              >
                <span className="hidden lg:inline">Glow</span>
                <span className="lg:hidden">G</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="graph" 
                aria-label="Toggle graph preview"
                onClick={() => onTogglePreview('graph')}
                className="min-h-[36px] min-w-[36px] px-1.5 md:px-2 text-xs"
              >
                <span className="hidden lg:inline">Graph</span>
                <span className="lg:hidden">Γ</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="camera" 
                aria-label="Toggle camera preview"
                onClick={() => onTogglePreview('camera')}
                className="min-h-[36px] min-w-[36px] px-1.5 md:px-2 text-xs"
              >
                <span className="hidden lg:inline">Cam</span>
                <span className="lg:hidden">📷</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="value" 
                aria-label="Toggle value preview"
                onClick={() => onTogglePreview('value')}
                className="min-h-[36px] min-w-[36px] px-1.5 md:px-2 text-xs"
              >
                <span className="hidden lg:inline">Value</span>
                <span className="lg:hidden">#</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Add Panel Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onAddPanel}
            className="min-h-[36px] min-w-[36px] gap-1 btn-press"
            aria-label="Add new panel"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden md:inline">Add</span>
          </Button>

          {/* Desktop: Individual buttons for Presets, Share, Settings */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Presets Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenPresets}
              className="min-h-[36px] min-w-[36px] gap-1"
              aria-label="Open presets"
            >
              <FolderOpen size={16} aria-hidden="true" />
              <span className="hidden lg:inline">Presets</span>
            </Button>

            {/* Share Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={onShare}
              className="min-h-[36px] min-w-[36px] gap-1"
              aria-label="Share configuration"
            >
              <Export size={16} aria-hidden="true" />
              <span className="hidden lg:inline">Share</span>
            </Button>

            {/* Advanced Settings Toggle */}
            <Button
              size="sm"
              variant={showAdvanced ? "secondary" : "ghost"}
              onClick={onToggleAdvanced}
              className="min-h-[36px] min-w-[36px]"
              aria-label={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
              aria-expanded={showAdvanced}
            >
              <GearSix size={16} aria-hidden="true" />
            </Button>
          </div>

          {/* Mobile: Overflow menu for secondary actions */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-[36px] min-w-[36px]"
                  aria-label="More options"
                >
                  <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Mode Switcher - Mobile Only */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mode
                </div>
                <DropdownMenuItem 
                  onClick={() => onModeChange('normal')}
                  className={cn("gap-2 cursor-pointer", mode === 'normal' && "bg-accent")}
                >
                  <SquaresFour size={16} aria-hidden="true" />
                  Easing
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onModeChange('scriptmapper')}
                  className={cn("gap-2 cursor-pointer", mode === 'scriptmapper' && "bg-accent")}
                >
                  <Video size={16} aria-hidden="true" />
                  ScriptMapper
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenPresets} className="gap-2 cursor-pointer">
                  <FolderOpen size={16} aria-hidden="true" />
                  Presets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare} className="gap-2 cursor-pointer">
                  <Export size={16} aria-hidden="true" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleAdvanced} className="gap-2 cursor-pointer">
                  <GearSix size={16} aria-hidden="true" />
                  {showAdvanced ? 'Hide Settings' : 'Show Settings'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
})
