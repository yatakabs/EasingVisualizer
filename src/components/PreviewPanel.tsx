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
import { InputPreview } from '@/components/previews/InputPreview'
import { OutputPreview } from '@/components/previews/OutputPreview'

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
          {ledFunction.name}
        </CardTitle>
        <div className="space-y-1.5 mt-1">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">
            {ledFunction.formula}
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
      
      <CardContent className="flex flex-col items-center gap-3 pb-3 px-3">
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
        
        <div className="w-full flex flex-col gap-3 mt-auto">
          {enabledPreviews.includes('input') && (
            <InputPreview
              input={input}
            />
          )}
          
          {enabledPreviews.includes('output') && (
            <OutputPreview
              ledFunction={ledFunction}
              filteredOutput={filteredOutput}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
})
