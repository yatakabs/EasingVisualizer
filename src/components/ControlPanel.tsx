import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Play, Pause, Plus } from '@phosphor-icons/react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ControlPanelProps {
  isPlaying: boolean
  speed: number
  gamma: number
  fps: number
  showLED: boolean
  showRectangle: boolean
  cycleMultiplier: number
  enabledFilters: string[]
  inputValue: number
  manualInputMode: boolean
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onGammaChange: (gamma: number) => void
  onAddPanel: () => void
  onToggleLED: () => void
  onToggleRectangle: () => void
  onCycleMultiplierChange: (multiplier: number) => void
  onToggleFilter: (filterId: string) => void
  onInputValueChange: (value: number) => void
  onManualInputModeChange: (enabled: boolean) => void
}

export function ControlPanel({
  isPlaying,
  speed,
  gamma,
  fps,
  showLED,
  showRectangle,
  cycleMultiplier,
  enabledFilters,
  inputValue,
  manualInputMode,
  onPlayPause,
  onSpeedChange,
  onGammaChange,
  onAddPanel,
  onToggleLED,
  onToggleRectangle,
  onCycleMultiplierChange,
  onToggleFilter,
  onInputValueChange,
  onManualInputModeChange
}: ControlPanelProps) {
  return (
    <div className="w-full bg-card border-2 border-border rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            size="lg"
            onClick={onPlayPause}
            className="gap-2 font-semibold"
            disabled={manualInputMode}
          >
            {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={onAddPanel}
            className="gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Panel
          </Button>
          
          <Badge variant="secondary" className="text-sm px-3 py-1.5 font-mono">
            {fps} FPS
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Tabs value={cycleMultiplier.toString()} onValueChange={(value) => onCycleMultiplierChange(parseFloat(value))}>
            <TabsList>
              <TabsTrigger value="0.25">1/4倍</TabsTrigger>
              <TabsTrigger value="0.5">1/2倍</TabsTrigger>
              <TabsTrigger value="1">1倍</TabsTrigger>
              <TabsTrigger value="2">2倍</TabsTrigger>
              <TabsTrigger value="4">4倍</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <ToggleGroup 
            type="multiple" 
            value={[
              ...(showLED ? ['led'] : []),
              ...(showRectangle ? ['rectangle'] : [])
            ]}
            variant="outline"
          >
            <ToggleGroupItem 
              value="led" 
              aria-label="LED表示"
              onClick={onToggleLED}
            >
              LED
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="rectangle" 
              aria-label="四角形表示"
              onClick={onToggleRectangle}
            >
              四角形
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Input Value
          </label>
          <span className="text-sm font-mono text-primary">
            {inputValue.toFixed(3)}
          </span>
        </div>
        
        <Slider
          value={[inputValue]}
          onValueChange={([value]) => onInputValueChange(value)}
          min={0}
          max={1}
          step={0.001}
          className="w-full"
          disabled={!manualInputMode}
        />
        
        <div className="relative text-xs text-muted-foreground font-mono">
          <span className="absolute left-0">0.000</span>
          <span className="absolute left-1/2 -translate-x-1/2">0.500</span>
          <span className="absolute right-0">1.000</span>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Switch
              id="manual-input-mode"
              checked={manualInputMode}
              onCheckedChange={onManualInputModeChange}
            />
            <Label htmlFor="manual-input-mode" className="text-sm font-medium cursor-pointer">
              手動制御モード
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              id="input-value-field"
              type="number"
              value={inputValue.toFixed(3)}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value) && value >= 0 && value <= 1) {
                  onInputValueChange(value)
                }
              }}
              step={0.001}
              min={0}
              max={1}
              className="w-24 font-mono text-sm"
              disabled={!manualInputMode}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Animation Speed
          </label>
          <span className="text-sm font-mono text-primary">
            {speed.toFixed(1)}x
          </span>
        </div>
        
        <Slider
          value={[speed]}
          onValueChange={([value]) => onSpeedChange(value)}
          min={0.1}
          max={3}
          step={0.1}
          className="w-full"
          disabled={manualInputMode}
        />
        
        <div className="relative text-xs text-muted-foreground font-mono">
          <span className="absolute left-0">0.1x</span>
          <span className="absolute" style={{ left: `${((1.0 - 0.1) / (3.0 - 0.1)) * 100}%`, transform: 'translateX(-50%)' }}>1.0x</span>
          <span className="absolute right-0">3.0x</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Gamma Correction
          </label>
          <span className="text-sm font-mono text-primary">
            γ = {gamma.toFixed(1)}
          </span>
        </div>
        
        <Slider
          value={[gamma]}
          onValueChange={([value]) => onGammaChange(value)}
          min={1.0}
          max={3.0}
          step={0.1}
          className="w-full"
        />
        
        <div className="relative text-xs text-muted-foreground font-mono">
          <span className="absolute left-0">1.0</span>
          <span className="absolute" style={{ left: `${((2.2 - 1.0) / (3.0 - 1.0)) * 100}%`, transform: 'translateX(-50%)' }}>2.2</span>
          <span className="absolute right-0">3.0</span>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Switch
            id="apply-gamma-filter"
            checked={enabledFilters.includes('gamma')}
            onCheckedChange={() => onToggleFilter('gamma')}
          />
          <Label htmlFor="apply-gamma-filter" className="text-sm font-medium cursor-pointer">
            ガンマ補正フィルタを適用
          </Label>
        </div>
      </div>
    </div>
  )
}
