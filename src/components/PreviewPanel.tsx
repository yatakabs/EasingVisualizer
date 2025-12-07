import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { LEDFunction } from '@/lib/ledFunctions'
import type { EaseType } from '@/lib/easeTypes'
import type { PreviewType } from '@/lib/previewTypes'
import { LEDPreview } from '@/components/previews/LEDPreview'
import { GraphPreview } from '@/components/previews/GraphPreview'
import { CameraPreview } from '@/components/previews/CameraPreview'
import { ValuePreview } from '@/components/previews/ValuePreview'

interface PreviewPanelProps {
  ledFunction: LEDFunction
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
  title?: string
  onRemove?: () => void
  onEaseTypeChange: (easeType: EaseType) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export const PreviewPanel = memo(function PreviewPanel({
  ledFunction,
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
  title,
  onRemove,
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
        style={{ margin: 0, padding: '10px 14px', gap: 0 }}
      >
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-semibold tracking-tight truncate flex-1 min-w-0 !leading-none" style={{ margin: 0 }}>
            {title || ledFunction.name}
          </CardTitle>
          {onRemove && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
              onClick={onRemove}
            >
              <X size={12} weight="bold" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <div className="px-4 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">
            {ledFunction.formula}
          </p>
          <ToggleGroup 
            type="single" 
            value={easeType}
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="easein" aria-label="EaseIn" className="text-[10px] px-2 h-6">
              In
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" aria-label="EaseOut" className="text-[10px] px-2 h-6">
              Out
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" aria-label="EaseBoth" className="text-[10px] px-2 h-6">
              Both
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <CardContent className="flex flex-col items-center gap-3" style={{ margin: 0, padding: '12px 14px' }}>
        {enabledPreviews.includes('camera') && (
          <CameraPreview
            ledFunction={ledFunction}
            output={output}
            filteredOutput={filteredOutput}
            baseInput={baseInput}
            enabledFilters={enabledFilters}
            startPos={cameraStartPos}
            endPos={cameraEndPos}
            aspectRatio={cameraAspectRatio}
          />
        )}
        
        {enabledPreviews.includes('led') && (
          <LEDPreview
            ledFunction={ledFunction}
            filteredOutput={filteredOutput}
          />
        )}
        
        {enabledPreviews.includes('graph') && (
          <GraphPreview
            ledFunction={ledFunction}
            filteredOutput={filteredOutput}
            input={input}
            baseInput={baseInput}
            isTriangularMode={isTriangularMode}
            easeType={easeType}
            enabledFilters={enabledFilters}
            filterParams={filterParams}
          />
        )}
        
        {enabledPreviews.includes('value') && (
          <div className="w-full mt-auto">
            <ValuePreview
              input={input}
              ledFunction={ledFunction}
              filteredOutput={filteredOutput}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
