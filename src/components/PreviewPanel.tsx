import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Video, Cube } from '@phosphor-icons/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'
import type { PreviewType } from '@/lib/previewTypes'
import { GlowPreview } from '@/components/previews/GlowPreview'
import { GraphPreview } from '@/components/previews/GraphPreview'
import { CameraPreview } from '@/components/previews/CameraPreview'
import { ValuePreview } from '@/components/previews/ValuePreview'
import { EasingComparePreview } from '@/components/previews/EasingComparePreview'

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
  onRemove,
  onToggleCamera,
  onEaseTypeChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: PreviewPanelProps) {
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
        style={{ margin: 0, padding: '6px 8px', gap: 0 }}
      >
        <div className="flex items-center justify-between gap-1.5">
          <CardTitle className="text-sm font-semibold tracking-tight truncate flex-1 min-w-0" style={{ margin: 0, lineHeight: '1.4' }}>
            {title || easingFunction.name}
          </CardTitle>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canToggleCamera && (
              <Button
                size="icon"
                variant={showCamera ? "default" : "ghost"}
                className={`h-6 w-6 transition-colors ${
                  showCamera 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : canActivateCamera
                      ? "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      : "text-muted-foreground/50 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (showCamera || canActivateCamera) {
                    onToggleCamera()
                  }
                }}
                disabled={!showCamera && !canActivateCamera}
                title={
                  showCamera 
                    ? "カメラプレビューを無効化" 
                    : canActivateCamera
                      ? "カメラプレビューを有効化"
                      : "カメラプレビューの最大表示数に達しています"
                }
              >
                {showCamera ? <Cube size={14} weight="bold" /> : <Cube size={14} weight="regular" />}
              </Button>
            )}
            {onRemove && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                onClick={onRemove}
              >
                <X size={14} weight="bold" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <div className="px-2 py-1.5 border-b border-border/50">
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">
            {easingFunction.formula}
          </p>
          <ToggleGroup 
            type="single" 
            value={easeType}
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="easein" aria-label="EaseIn" className="text-xs px-2.5 h-7">
              In
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" aria-label="EaseOut" className="text-xs px-2.5 h-7">
              Out
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" aria-label="EaseBoth" className="text-xs px-2.5 h-7">
              Both
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <CardContent className="flex flex-col items-center gap-1.5" style={{ margin: 0, padding: '8px' }}>
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
      </CardContent>
    </Card>
  )
})
