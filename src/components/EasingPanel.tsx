import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface LEDPanelProps {
  EasingFunction: EasingFunction
  output: number
  filteredOutput: number
  input: number
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
  title?: string
  onRemove?: () => void
  onEaseTypeChange: (easeType: EaseType) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export const LEDPanel = memo(function LEDPanel({ 
  EasingFunction, 
  output, 
  filteredOutput, 
  input,
  easeType,
  enabledFilters, 
  filterParams,
  title,
  onRemove,
  onEaseTypeChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: LEDPanelProps) {
  const glowIntensity = useMemo(() => {
    return Math.max(0, Math.min(1, filteredOutput))
  }, [filteredOutput])
  
  const displayOutput = useMemo(() => {
    return filteredOutput
  }, [filteredOutput])

  return (
    <Card 
      className="relative overflow-hidden border-2 border-border"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-1.5 right-1.5 z-10 h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
          onClick={onRemove}
        >
          <X size={14} />
        </Button>
      )}
      
      <CardHeader 
        className="pb-2 pt-3 px-3 cursor-move active:cursor-grabbing"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {title && (
          <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {title}
          </div>
        )}
        <CardTitle className="text-sm font-semibold tracking-tight">
          {EasingFunction.name}
        </CardTitle>
        <div className="space-y-1.5 mt-1">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">
            {EasingFunction.formula}
          </p>
          <ToggleGroup 
            type="single" 
            value={easeType}
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="easein" aria-label="EaseIn" className="text-[10px] px-1.5 h-6">
              EaseIn
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" aria-label="EaseOut" className="text-[10px] px-1.5 h-6">
              EaseOut
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" aria-label="EaseBoth" className="text-[10px] px-1.5 h-6">
              EaseBoth
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-2 pb-3 px-3">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg width="128" height="128" className="absolute inset-0">
            <defs>
              <radialGradient id={`glow-${EasingFunction.id}`}>
                <stop
                  offset="0%"
                  stopColor={EasingFunction.color}
                  stopOpacity={glowIntensity}
                />
                <stop
                  offset="50%"
                  stopColor={EasingFunction.color}
                  stopOpacity={glowIntensity * 0.6}
                />
                <stop
                  offset="100%"
                  stopColor={EasingFunction.color}
                  stopOpacity="0"
                />
              </radialGradient>
              <radialGradient id={`led-${EasingFunction.id}`}>
                <stop
                  offset="0%"
                  stopColor={EasingFunction.color}
                  stopOpacity={glowIntensity}
                />
                <stop
                  offset="70%"
                  stopColor={EasingFunction.color}
                  stopOpacity={glowIntensity * 0.8}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.2 0.02 250)"
                  stopOpacity="1"
                />
              </radialGradient>
            </defs>
            
            <circle
              cx="64"
              cy="64"
              r="56"
              fill={`url(#glow-${EasingFunction.id})`}
              className="transition-opacity duration-75"
            />
            
            <circle
              cx="64"
              cy="64"
              r="28"
              fill={`url(#led-${EasingFunction.id})`}
              className="transition-opacity duration-75"
            />
            
            <circle
              cx="64"
              cy="64"
              r="28"
              fill="none"
              stroke="oklch(0.4 0.03 250)"
              strokeWidth="2"
            />
          </svg>
        </div>
        
        <div className="w-full bg-secondary rounded-lg p-2 space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Input</span>
              <span className="font-mono font-medium text-muted-foreground">
                {(input * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full will-change-[width]"
                style={{
                  width: `${input * 100}%`,
                  backgroundColor: 'oklch(0.65 0.1 250)',
                  boxShadow: `0 0 4px oklch(0.65 0.1 250 / 0.5)`
                }}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Output</span>
              <span className="font-mono font-medium text-primary">
                {(displayOutput * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full will-change-[width]"
                style={{
                  width: `${displayOutput * 100}%`,
                  backgroundColor: EasingFunction.color,
                  boxShadow: `0 0 6px ${EasingFunction.color}`
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
