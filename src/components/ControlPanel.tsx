import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Plus } from '@phosphor-icons/react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ControlPanelProps {
  isPlaying: boolean
  speed: number
  gamma: number
  fps: number
  visualizationMode: 'led' | 'rectangle'
  cycleMultiplier: number
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onGammaChange: (gamma: number) => void
  onAddPanel: () => void
  onVisualizationModeChange: (mode: 'led' | 'rectangle') => void
  onCycleMultiplierChange: (multiplier: number) => void
}

export function ControlPanel({
  isPlaying,
  speed,
  gamma,
  fps,
  visualizationMode,
  cycleMultiplier,
  onPlayPause,
  onSpeedChange,
  onGammaChange,
  onAddPanel,
  onVisualizationModeChange,
  onCycleMultiplierChange
}: ControlPanelProps) {
  return (
    <div className="w-full bg-card border-2 border-border rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            size="lg"
            onClick={onPlayPause}
            className="gap-2 font-semibold"
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
              <TabsTrigger value="0.25">4倍</TabsTrigger>
              <TabsTrigger value="0.5">2倍</TabsTrigger>
              <TabsTrigger value="1">1倍</TabsTrigger>
              <TabsTrigger value="2">1/2倍</TabsTrigger>
              <TabsTrigger value="4">1/4倍</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs value={visualizationMode} onValueChange={(value) => onVisualizationModeChange(value as 'led' | 'rectangle')}>
            <TabsList>
              <TabsTrigger value="led">LED</TabsTrigger>
              <TabsTrigger value="rectangle">四角形</TabsTrigger>
            </TabsList>
          </Tabs>
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
      </div>
    </div>
  )
}
