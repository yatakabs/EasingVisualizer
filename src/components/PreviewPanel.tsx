import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Video, Cube, DotsSixVertical, ArrowCounterClockwise, CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'
import type { PreviewType } from '@/lib/previewTypes'
import { GlowPreview } from '@/components/previews/GlowPreview'
import { GraphPreview } from '@/components/previews/GraphPreview'
import { CameraPreview } from '@/components/previews/CameraPreview'
import { ValuePreview } from '@/components/previews/ValuePreview'
import { EasingComparePreview } from '@/components/previews/EasingComparePreview'
import { PanelActionsMenu } from '@/components/PanelActionsMenu'

interface PreviewPanelProps {
  easingFunction: EasingFunction
  output: number
  filteredOutput: number
  input: number
  baseInput: number
  isTriangularMode: boolean
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
  enabledPreviews: PreviewType[]
  cameraStartPos: { x: number; y: number; z: number }
  cameraEndPos: { x: number; y: number; z: number }
  cameraAspectRatio: string
  coordinateSystem: 'left-handed' | 'right-handed'
  showCamera: boolean
  canToggleCamera: boolean
  canActivateCamera: boolean
  title?: string
  scriptMapperMode?: boolean
  driftParams?: { x: number; y: number }
  onDriftXChange?: (x: number) => void
  onDriftYChange?: (y: number) => void
  onDriftReset?: () => void
  onRemove?: () => void
  onToggleCamera: () => void
  onEaseTypeChange: (easeType: EaseType) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export const PreviewPanel = memo(function PreviewPanel({
  easingFunction,
  output,
  filteredOutput,
  input,
  baseInput,
  isTriangularMode,
  easeType,
  enabledFilters,
  filterParams,
  enabledPreviews,
  cameraStartPos,
  cameraEndPos,
  cameraAspectRatio,
  coordinateSystem,
  showCamera,
  canToggleCamera,
  canActivateCamera,
  title,
  scriptMapperMode = false,
  driftParams,
  onDriftXChange,
  onDriftYChange,
  onDriftReset,
  onRemove,
  onToggleCamera,
  onEaseTypeChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: PreviewPanelProps) {
  const [driftExpanded, setDriftExpanded] = useState(false)
  
  return (
    <Card 
      className="relative overflow-hidden"
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ padding: 0, gap: 0 }}
    >
      <CardHeader 
        className="cursor-move active:cursor-grabbing bg-primary/10"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ margin: 0, padding: '2px 6px', gap: 0 }}
      >
        <div className="flex items-center justify-between gap-0.5">
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            <DotsSixVertical 
              size={11} 
              className="text-muted-foreground/60 flex-shrink-0 hover:text-muted-foreground transition-colors" 
              weight="bold"
              aria-hidden="true"
            />
            <CardTitle className="text-[11px] font-semibold tracking-tight truncate flex-1 min-w-0" style={{ margin: 0, lineHeight: '1' }}>
              {title || easingFunction.name}
            </CardTitle>
          </div>
          <PanelActionsMenu
            showCamera={showCamera}
            canToggleCamera={canToggleCamera}
            canActivateCamera={canActivateCamera}
            onToggleCamera={onToggleCamera}
            onRemove={onRemove}
          />
        </div>
      </CardHeader>
      
      <div className="px-2 py-1 border-b border-border/50">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight flex-1 min-w-0 truncate">
            {easingFunction.formula}
          </p>
          <ToggleGroup 
            type="single" 
            value={easeType}
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            variant="outline"
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="easein" aria-label="EaseIn" className="text-[10px] px-1 leading-none" style={{ height: 16, minHeight: 16 }}>
              In
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" aria-label="EaseOut" className="text-[10px] px-1 leading-none" style={{ height: 16, minHeight: 16 }}>
              Out
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" aria-label="EaseBoth" className="text-[10px] px-1 leading-none" style={{ height: 16, minHeight: 16 }}>
              Both
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <CardContent className="flex flex-col items-center gap-1" style={{ margin: 0, padding: '6px' }}>
        {enabledPreviews.includes('camera') && (
          showCamera ? (
            <CameraPreview
              easingFunction={easingFunction}
              output={output}
              filteredOutput={filteredOutput}
              baseInput={baseInput}
              enabledFilters={enabledFilters}
              startPos={cameraStartPos}
              endPos={cameraEndPos}
              aspectRatio={cameraAspectRatio}
              coordinateSystem={coordinateSystem}
            />
          ) : (
            <div className="w-full relative bg-card border border-border/50 rounded-md flex items-center justify-center" 
                 style={{ 
                   aspectRatio: cameraAspectRatio.includes('/') 
                     ? cameraAspectRatio.replace('/', ' / ')
                     : cameraAspectRatio 
                 }}>
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <Video size={32} weight="duotone" className="text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground text-center">
                  カメラプレビュー無効
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (canActivateCamera) {
                      onToggleCamera()
                    }
                  }}
                  disabled={!canActivateCamera}
                >
                  <Cube size={14} weight="bold" className="mr-1" />
                  表示を有効化
                </Button>
                {!canActivateCamera && (
                  <p className="text-[10px] text-muted-foreground/70 text-center max-w-[200px]">
                    最大表示数に達しています
                  </p>
                )}
              </div>
            </div>
          )
        )}
        
        {enabledPreviews.includes('glow') && (
          <GlowPreview
            easingFunction={easingFunction}
            filteredOutput={filteredOutput}
          />
        )}
        
        {enabledPreviews.includes('easing-compare') && (
          <EasingComparePreview
            easingFunction={easingFunction}
            input={input}
            easeType={easeType}
          />
        )}
        
        {enabledPreviews.includes('graph') && (
          <GraphPreview
            easingFunction={easingFunction}
            filteredOutput={filteredOutput}
            input={input}
            baseInput={baseInput}
            isTriangularMode={isTriangularMode}
            easeType={easeType}
            enabledFilters={enabledFilters}
            filterParams={filterParams}
            scriptMapperMode={scriptMapperMode}
            driftParams={driftParams}
          />
        )}
        
        {enabledPreviews.includes('value') && (
          <div className="w-full mt-auto">
            <ValuePreview
              input={input}
              easingFunction={easingFunction}
              filteredOutput={filteredOutput}
            />
          </div>
        )}
        
        {/* Inline Drift Controls - only for parametric functions in non-ScriptMapper mode */}
        {!scriptMapperMode && easingFunction.isParametric && driftParams && onDriftXChange && onDriftYChange && (
          <Collapsible open={driftExpanded} onOpenChange={setDriftExpanded} className="w-full mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <CaretDown className={cn("w-3 h-3 transition-transform duration-200", driftExpanded && "rotate-180")} />
                  Drift Parameters
                  <Badge variant="outline" className="font-mono text-[9px] h-4 px-1 ml-1">X:{driftParams.x} Y:{driftParams.y}</Badge>
                </button>
              </CollapsibleTrigger>
              {onDriftReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDriftReset}
                  className="h-5 px-1.5 text-[10px] gap-0.5"
                >
                  <ArrowCounterClockwise className="w-3 h-3" />
                  Reset
                </Button>
              )}
            </div>
            
            <CollapsibleContent className="space-y-2 pt-2">
              {/* X Parameter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`drift-x-${easingFunction.id}`} className="text-[10px]">X</Label>
                  <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1">{driftParams.x}</Badge>
                </div>
                <Slider
                  id={`drift-x-${easingFunction.id}`}
                  min={0}
                  max={10}
                  step={1}
                  value={[driftParams.x]}
                  onValueChange={([value]) => onDriftXChange(value)}
                  className="h-4"
                />
              </div>
              
              {/* Y Parameter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`drift-y-${easingFunction.id}`} className="text-[10px]">Y</Label>
                  <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1">{driftParams.y}</Badge>
                </div>
                <Slider
                  id={`drift-y-${easingFunction.id}`}
                  min={0}
                  max={10}
                  step={1}
                  value={[driftParams.y]}
                  onValueChange={([value]) => onDriftYChange(value)}
                  className="h-4"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
})
