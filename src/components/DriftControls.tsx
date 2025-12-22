import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { formatAsScriptMapperCommand } from '@/lib/scriptMapperCompat'

interface DriftControlsProps {
  x: number
  y: number
  onXChange: (value: number) => void
  onYChange: (value: number) => void
  onReset: () => void
  visible: boolean
}

export const DriftControls = memo(function DriftControls({
  x,
  y,
  onXChange,
  onYChange,
  onReset,
  visible
}: DriftControlsProps) {
  if (!visible) return null

  const scriptMapperCommand = formatAsScriptMapperCommand('drift', 'easein', { x, y })

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Drift Parameters</h3>
          <p className="text-xs text-muted-foreground">Adjust Drift function parameters</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="gap-1"
        >
          <ArrowCounterClockwise className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* X Parameter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="drift-x" className="text-sm">X Parameter</Label>
          <Badge variant="secondary" className="font-mono text-xs">{x}</Badge>
        </div>
        <Slider
          id="drift-x"
          min={0}
          max={10}
          step={1}
          value={[x]}
          onValueChange={([value]) => onXChange(value)}
        />
      </div>

      {/* Y Parameter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="drift-y" className="text-sm">Y Parameter</Label>
          <Badge variant="secondary" className="font-mono text-xs">{y}</Badge>
        </div>
        <Slider
          id="drift-y"
          min={0}
          max={10}
          step={1}
          value={[y]}
          onValueChange={([value]) => onYChange(value)}
        />
      </div>

      {/* ScriptMapper Command Preview */}
      {scriptMapperCommand && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ScriptMapper:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {scriptMapperCommand}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  )
})
