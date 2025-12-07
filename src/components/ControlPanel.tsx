import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Plus } from '@phosphor-icons/react'

interface ControlPanelProps {
  isPlaying: boolean
  speed: number
  fps: number
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onAddPanel: () => void
}

export function ControlPanel({
  isPlaying,
  speed,
  fps,
  onPlayPause,
  onSpeedChange,
  onAddPanel
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
        
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>0.1x</span>
          <span>1.0x</span>
          <span>3.0x</span>
        </div>
      </div>
    </div>
  )
}
