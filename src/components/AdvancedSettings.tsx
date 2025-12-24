import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CaretDown, ArrowsInLineHorizontal } from '@phosphor-icons/react'
import { type EaseType } from '@/lib/easeTypes'
import { cn } from '@/lib/utils'

interface AdvancedSettingsProps {
  // Visibility
  open: boolean
  onOpenChange: (open: boolean) => void
  
  // Gamma
  gamma: number
  onGammaChange: (gamma: number) => void
  
  // Input mode
  manualInputMode: boolean
  triangularWaveMode: boolean
  inputValue: number
  onManualInputModeChange: (enabled: boolean) => void
  onTriangularWaveModeChange: (enabled: boolean) => void
  onInputValueChange: (value: number) => void
  
  // Global ease type
  onSetAllEaseType?: (easeType: EaseType) => void
  
  // Camera settings
  showCameraSettings: boolean
  cameraStartPos: { x: number; y: number; z: number }
  cameraEndPos: { x: number; y: number; z: number }
  cameraAspectRatio: string
  maxCameraPreviews: number
  coordinateSystem: 'left-handed' | 'right-handed'
  onCameraStartPosChange: (pos: { x: number; y: number; z: number }) => void
  onCameraEndPosChange: (pos: { x: number; y: number; z: number }) => void
  onCameraAspectRatioChange: (aspectRatio: string) => void
  onMaxCameraPreviewsChange: (max: number) => void
  onCoordinateSystemChange: (system: 'left-handed' | 'right-handed') => void
  
  // Display settings
  cardScale: number
  endPauseDuration: number
  onCardScaleChange: (scale: number) => void
  onEndPauseDurationChange: (duration: number) => void
}

const ASPECT_RATIOS = ['16/9', '4/3', '21/9', '1/1']

/**
 * Collapsible advanced settings panel at the bottom of the page.
 * Contains less-frequently used controls organized by category.
 */
export const AdvancedSettings = memo(function AdvancedSettings({
  open,
  onOpenChange,
  gamma,
  onGammaChange,
  manualInputMode,
  triangularWaveMode,
  inputValue,
  onManualInputModeChange,
  onTriangularWaveModeChange,
  onInputValueChange,
  onSetAllEaseType,
  showCameraSettings,
  cameraStartPos,
  cameraEndPos,
  cameraAspectRatio,
  maxCameraPreviews,
  coordinateSystem,
  onCameraStartPosChange,
  onCameraEndPosChange,
  onCameraAspectRatioChange,
  onMaxCameraPreviewsChange,
  onCoordinateSystemChange,
  cardScale,
  endPauseDuration,
  onCardScaleChange,
  onEndPauseDurationChange
}: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-10 rounded-none flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            aria-label={open ? "Hide advanced settings" : "Show advanced settings"}
          >
            <span className="text-sm font-medium">Advanced Settings</span>
            <CaretDown 
              size={16} 
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="container mx-auto px-3 sm:px-4 py-4 max-w-[120rem]">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Input Controls */}
              <div className="space-y-3 sm:border-r sm:border-border/30 sm:pr-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input Controls</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manual-mode" className="text-sm">Manual Control</Label>
                    <Switch
                      id="manual-mode"
                      checked={manualInputMode}
                      onCheckedChange={onManualInputModeChange}
                    />
                  </div>
                  
                  {manualInputMode && (
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[inputValue]}
                        onValueChange={([v]) => onInputValueChange(v)}
                        min={0}
                        max={1}
                        step={0.001}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={inputValue.toFixed(3)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0 && val <= 1) {
                            onInputValueChange(val)
                          }
                        }}
                        step={0.001}
                        min={0}
                        max={1}
                        className="w-20 font-mono text-sm h-8"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="triangular-mode" className="text-sm">Triangular Wave</Label>
                    <Switch
                      id="triangular-mode"
                      checked={triangularWaveMode}
                      onCheckedChange={onTriangularWaveModeChange}
                    />
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-3 lg:border-r lg:border-border/30 lg:pr-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Settings</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Gamma</Label>
                      <span className="text-sm font-mono text-muted-foreground">{gamma.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[gamma]}
                      onValueChange={([v]) => onGammaChange(v)}
                      min={1.0}
                      max={3.0}
                      step={0.1}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Card Scale</Label>
                      <span className="text-sm font-mono text-muted-foreground">{(cardScale * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[cardScale]}
                      onValueChange={([v]) => onCardScaleChange(v)}
                      min={0.5}
                      max={1.5}
                      step={0.1}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">End Pause</Label>
                      <span className="text-sm font-mono text-muted-foreground">{endPauseDuration.toFixed(1)}s</span>
                    </div>
                    <Slider
                      value={[endPauseDuration]}
                      onValueChange={([v]) => onEndPauseDurationChange(v)}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Global Ease Type */}
              <div className="space-y-3 sm:border-r sm:border-border/30 sm:pr-4 lg:border-r-0 lg:pr-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Global Ease Type</h3>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetAllEaseType?.('easein')}
                    className="justify-start gap-2 min-h-[44px]"
                  >
                    <ArrowsInLineHorizontal size={16} aria-hidden="true" />
                    Set All → Ease In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetAllEaseType?.('easeout')}
                    className="justify-start gap-2 min-h-[44px]"
                  >
                    <ArrowsInLineHorizontal size={16} className="rotate-180" aria-hidden="true" />
                    Set All → Ease Out
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetAllEaseType?.('easeboth')}
                    className="justify-start gap-2 min-h-[44px]"
                  >
                    <ArrowsInLineHorizontal size={16} aria-hidden="true" />
                    Set All → Ease Both
                  </Button>
                </div>
              </div>

              {/* Camera Settings - Only when camera preview is visible */}
              {showCameraSettings && (
                <div className="space-y-3 lg:border-l lg:border-border/30 lg:pl-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Camera Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                        <Select value={cameraAspectRatio} onValueChange={onCameraAspectRatioChange}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASPECT_RATIOS.map(ar => (
                              <SelectItem key={ar} value={ar}>{ar}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Previews</Label>
                        <Select 
                          value={maxCameraPreviews.toString()} 
                          onValueChange={(v) => onMaxCameraPreviewsChange(parseInt(v))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,8,10,12].map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Coordinate System</Label>
                      <ToggleGroup 
                        type="single" 
                        value={coordinateSystem}
                        onValueChange={(v) => v && onCoordinateSystemChange(v as 'left-handed' | 'right-handed')}
                        className="justify-start mt-1"
                      >
                        <ToggleGroupItem value="left-handed" className="text-xs h-7 px-2">
                          Left-handed
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right-handed" className="text-xs h-7 px-2">
                          Right-handed
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start X</Label>
                        <Input
                          type="number"
                          value={cameraStartPos.x}
                          onChange={(e) => onCameraStartPosChange({ ...cameraStartPos, x: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Y</Label>
                        <Input
                          type="number"
                          value={cameraStartPos.y}
                          onChange={(e) => onCameraStartPosChange({ ...cameraStartPos, y: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Z</Label>
                        <Input
                          type="number"
                          value={cameraStartPos.z}
                          onChange={(e) => onCameraStartPosChange({ ...cameraStartPos, z: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <Label className="text-xs text-muted-foreground">End X</Label>
                        <Input
                          type="number"
                          value={cameraEndPos.x}
                          onChange={(e) => onCameraEndPosChange({ ...cameraEndPos, x: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Y</Label>
                        <Input
                          type="number"
                          value={cameraEndPos.y}
                          onChange={(e) => onCameraEndPosChange({ ...cameraEndPos, y: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Z</Label>
                        <Input
                          type="number"
                          value={cameraEndPos.z}
                          onChange={(e) => onCameraEndPosChange({ ...cameraEndPos, z: parseFloat(e.target.value) || 0 })}
                          step={0.5}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
})
