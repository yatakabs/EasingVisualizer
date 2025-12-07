import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Play, Pause, Plus } from '@phosphor-icons/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { type EaseType } from '@/lib/easeTypes'

interface ControlPanelProps {
  isPlaying: boolean
  speed: number
  gamma: number
  fps: number
  showLED: boolean
  showRectangle: boolean
  enabledFilters: string[]
  inputValue: number
  manualInputMode: boolean
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onGammaChange: (gamma: number) => void
  onAddPanel: () => void
  onToggleLED: () => void
  onToggleRectangle: () => void
  onToggleFilter: (filterId: string) => void
  onInputValueChange: (value: number) => void
  onManualInputModeChange: (enabled: boolean) => void
  onSetAllEaseType?: (easeType: EaseType) => void
}

export function ControlPanel({
  isPlaying,
  speed,
  gamma,
  fps,
  showLED,
  showRectangle,
  enabledFilters,
  inputValue,
  manualInputMode,
  onPlayPause,
  onSpeedChange,
  onGammaChange,
  onAddPanel,
  onToggleLED,
  onToggleRectangle,
  onToggleFilter,
  onInputValueChange,
  onManualInputModeChange,
  onSetAllEaseType
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
      
      {onSetAllEaseType && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            全パネル一括設定
          </label>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSetAllEaseType('easein')
                toast.success('全パネルをEaseInに設定しました')
              }}
              className="font-semibold"
            >
              全てEaseIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSetAllEaseType('easeout')
                toast.success('全パネルをEaseOutに設定しました')
              }}
              className="font-semibold"
            >
              全てEaseOut
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSetAllEaseType('easeboth')
                toast.success('全パネルをEaseBothに設定しました')
              }}
              className="font-semibold"
            >
              全てEaseBoth
            </Button>
          </div>
        </div>
      )}
      
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
          disabled={!manualInputMode}
        />
        
        <div className="relative text-xs text-muted-foreground font-mono h-8 px-2">
          <div className="absolute inset-x-2 flex items-start pt-1">
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((mark) => (
              <div
                key={mark}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${mark * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-px ${mark % 0.5 === 0 ? 'h-3 bg-muted-foreground' : mark % 0.1 === 0 ? 'h-2 bg-muted-foreground/50' : 'h-1 bg-muted-foreground/30'}`} />
                {mark % 0.5 === 0 && (
                  <span className="text-[10px]">{mark.toFixed(1)}</span>
                )}
              </div>
            ))}
          </div>
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
          disabled={manualInputMode}
        />
        
        <div className="relative text-xs text-muted-foreground font-mono h-8 px-2">
          <div className="absolute inset-x-2 flex items-start pt-1">
            {[0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((mark) => {
              const position = ((mark - 0.1) / (3.0 - 0.1)) * 100
              const isMajor = mark === 0.1 || mark === 1.0 || mark === 2.0 || mark === 3.0
              return (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-px ${isMajor ? 'h-3 bg-muted-foreground' : 'h-2 bg-muted-foreground/50'}`} />
                  {isMajor && (
                    <span className="text-[10px]">{mark.toFixed(1)}x</span>
                  )}
                </div>
              )
            })}
          </div>
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
        />
        
        <div className="relative text-xs text-muted-foreground font-mono h-8 px-2">
          <div className="absolute inset-x-2 flex items-start pt-1">
            {[1.0, 1.4, 1.8, 2.2, 2.6, 3.0].map((mark) => {
              const position = ((mark - 1.0) / (3.0 - 1.0)) * 100
              const isMajor = mark === 1.0 || mark === 2.2 || mark === 3.0
              return (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-px ${isMajor ? 'h-3 bg-muted-foreground' : 'h-2 bg-muted-foreground/50'}`} />
                  {isMajor && (
                    <span className="text-[10px]">{mark.toFixed(1)}</span>
                  )}
                </div>
              )
            })}
          </div>
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
