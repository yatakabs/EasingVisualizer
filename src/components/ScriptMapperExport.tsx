import { memo, useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Copy, Check, Upload, Lightning } from '@phosphor-icons/react'
import { formatAsScriptMapperCommand, parseScriptMapperCommand } from '@/lib/scriptMapperCompat'
import { EASING_FUNCTIONS } from '@/lib/easingFunctions'
import { toast } from 'sonner'
import type { EaseType } from '@/lib/easeTypes'

/**
 * Default ScriptMapper command presets
 * Categorized by common use cases in Beat Saber mapping
 */
const DEFAULT_PRESETS = [
  // Smooth/Natural Movement
  { command: 'InOutSine', label: 'Smooth', category: 'Basic' },
  { command: 'InOutQuad', label: 'Standard', category: 'Basic' },
  { command: 'InOutCubic', label: 'Natural', category: 'Basic' },
  
  // Acceleration (Start slow, end fast)
  { command: 'InQuad', label: 'Accel Soft', category: 'Ease In' },
  { command: 'InCubic', label: 'Accel Med', category: 'Ease In' },
  { command: 'InExpo', label: 'Accel Strong', category: 'Ease In' },
  
  // Deceleration (Start fast, end slow)
  { command: 'OutQuad', label: 'Decel Soft', category: 'Ease Out' },
  { command: 'OutCubic', label: 'Decel Med', category: 'Ease Out' },
  { command: 'OutExpo', label: 'Decel Strong', category: 'Ease Out' },
  
  // Dramatic/Stylized
  { command: 'InOutBack', label: 'Overshoot', category: 'Effect' },
  { command: 'InOutElastic', label: 'Bounce', category: 'Effect' },
  { command: 'OutBounce', label: 'Impact', category: 'Effect' },
  
  // Drift variations (common values)
  { command: 'ease_5_5', label: 'Drift Balanced', category: 'Drift' },
  { command: 'ease_3_7', label: 'Drift Slow→Fast', category: 'Drift' },
  { command: 'ease_7_3', label: 'Drift Fast→Slow', category: 'Drift' },
] as const

// Color coding for ease types
const EASE_TYPE_COLORS: Record<EaseType, string> = {
  easein: 'oklch(0.65 0.12 120)',    // Green
  easeout: 'oklch(0.65 0.12 280)',   // Purple
  easeboth: 'oklch(0.65 0.12 200)'   // Cyan
}

/**
 * Generate SVG path points for a mini curve preview
 */
function generateMiniCurvePath(
  functionId: string,
  easeType: EaseType,
  params?: { x: number; y: number },
  size = 24,
  padding = 2
): string {
  const easingFn = EASING_FUNCTIONS.find(fn => fn.id === functionId)
  if (!easingFn) return ''
  
  const innerSize = size - padding * 2
  const steps = 20
  const points: string[] = []
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = padding + t * innerSize
    const y = easingFn.calculate(t, easeType, params)
    // Clamp y to prevent overflow for elastic/back functions
    const clampedY = Math.max(0, Math.min(1, y))
    const yPos = padding + (1 - clampedY) * innerSize
    points.push(`${x.toFixed(1)},${yPos.toFixed(1)}`)
  }
  
  return points.join(' ')
}

/**
 * Mini curve preview component for preset buttons
 */
const MiniCurvePreview = memo(function MiniCurvePreview({
  command,
  size = 24
}: {
  command: string
  size?: number
}) {
  const parsed = useMemo(() => parseScriptMapperCommand(command), [command])
  
  const curvePath = useMemo(() => {
    if (!parsed) return ''
    return generateMiniCurvePath(parsed.functionId, parsed.easeType, parsed.params, size, 2)
  }, [parsed, size])
  
  const strokeColor = parsed ? EASE_TYPE_COLORS[parsed.easeType] : 'currentColor'
  
  if (!parsed || !curvePath) return null
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
    >
      {/* Background */}
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        fill="oklch(0.18 0.02 250)"
        rx="2"
      />
      {/* Diagonal reference line */}
      <line
        x1="2"
        y1={size - 2}
        x2={size - 2}
        y2="2"
        stroke="oklch(0.35 0.02 250)"
        strokeWidth="0.5"
        strokeDasharray="1 1"
      />
      {/* Curve */}
      <polyline
        points={curvePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
})

interface ScriptMapperExportProps {
  functionId: string
  easeType: EaseType
  driftParams?: { x: number; y: number }
  onImport: (functionId: string, easeType: EaseType, params?: { x: number; y: number }) => void
  visible: boolean
}

export const ScriptMapperExport = memo(function ScriptMapperExport({
  functionId,
  easeType,
  driftParams,
  onImport,
  visible
}: ScriptMapperExportProps) {
  const [importValue, setImportValue] = useState('')
  const [copied, setCopied] = useState(false)

  const exportCommand = formatAsScriptMapperCommand(functionId, easeType, driftParams)
  
  // Find the easing function for preview generation
  const easingFunction = useMemo(() => 
    EASING_FUNCTIONS.find(fn => fn.id === functionId),
    [functionId]
  )

  // Generate mini curve preview path
  const curvePath = useMemo(() => {
    if (!easingFunction) return ''
    
    const size = 50
    const padding = 4
    const innerSize = size - padding * 2
    const steps = 30
    const points: string[] = []
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = padding + t * innerSize
      const y = easingFunction.calculate(t, easeType, driftParams)
      const yPos = padding + (1 - y) * innerSize
      points.push(`${x},${yPos}`)
    }
    
    return points.join(' ')
  }, [easingFunction, easeType, driftParams])

  // Ease type label mapping
  const easeTypeLabel = {
    easein: 'In',
    easeout: 'Out',
    easeboth: 'InOut'
  }

  if (!visible) return null

  const handleCopy = async () => {
    if (!exportCommand) return
    
    try {
      await navigator.clipboard.writeText(exportCommand)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleImport = () => {
    if (!importValue.trim()) {
      toast.error('Please enter a ScriptMapper command')
      return
    }

    const parsed = parseScriptMapperCommand(importValue.trim())
    if (!parsed) {
      toast.error('Invalid ScriptMapper command format')
      return
    }

    onImport(parsed.functionId, parsed.easeType, parsed.params)
    toast.success(`Imported: ${importValue.trim()}`)
    setImportValue('')
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">ScriptMapper Export/Import</h3>
        <p className="text-xs text-muted-foreground">
          Copy commands for ScriptMapper or import from clipboard
        </p>
      </div>

      {/* Export Section */}
      <div className="space-y-2">
        <Label className="text-sm">Current Command</Label>
        <div className="flex gap-2 items-center">
          {easingFunction && exportCommand && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              {/* Mini curve preview */}
              <div
                className="rounded border border-border/50"
                style={{ width: 50, height: 50 }}
              >
                <svg
                  width={50}
                  height={50}
                  viewBox="0 0 50 50"
                >
                  {/* Background */}
                  <rect
                    x="0"
                    y="0"
                    width="50"
                    height="50"
                    fill="oklch(0.15 0.02 250)"
                  />

                  {/* Grid lines */}
                  <line
                    x1="4"
                    y1="25"
                    x2="46"
                    y2="25"
                    stroke="oklch(0.3 0.03 250)"
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                  />
                  <line
                    x1="25"
                    y1="4"
                    x2="25"
                    y2="46"
                    stroke="oklch(0.3 0.03 250)"
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                  />

                  {/* Curve path */}
                  <polyline
                    points={curvePath}
                    fill="none"
                    stroke={EASE_TYPE_COLORS[easeType]}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              {/* Ease type label */}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4"
                style={{
                  borderColor: EASE_TYPE_COLORS[easeType],
                  color: EASE_TYPE_COLORS[easeType]
                }}
              >
                {easeTypeLabel[easeType]}
              </Badge>
            </div>
          )}
          <Badge 
            variant="outline" 
            className="flex-1 justify-center font-mono text-sm py-2"
          >
            {exportCommand || 'Not compatible'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!exportCommand}
            className="gap-1 flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-2 pt-2 border-t">
        <Label htmlFor="import-command" className="text-sm">Import Command</Label>
        <div className="flex gap-2">
          <Input
            id="import-command"
            type="text"
            placeholder="e.g., InSine, ease_3_7"
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleImport()
              }
            }}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={!importValue.trim()}
            className="gap-1"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a ScriptMapper command and click Import to apply it
        </p>
      </div>

      {/* Quick Presets Section */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Lightning className="w-4 h-4 text-amber-500" weight="fill" />
          <Label className="text-sm">Quick Presets</Label>
        </div>
        <ScrollArea className="h-[220px] rounded-md border">
          <div className="p-3 space-y-3">
            <TooltipProvider delayDuration={200}>
              {(['Basic', 'Ease In', 'Ease Out', 'Effect', 'Drift'] as const).map(category => {
                const presetsInCategory = DEFAULT_PRESETS.filter(p => p.category === category)
                if (presetsInCategory.length === 0) return null
                
                return (
                  <div key={category}>
                    <div className="text-xs font-medium text-muted-foreground mb-1.5">{category}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetsInCategory.map(preset => (
                        <Tooltip key={preset.command}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-1.5 gap-1.5 text-xs font-mono hover:bg-accent"
                              onClick={() => {
                                const parsed = parseScriptMapperCommand(preset.command)
                                if (parsed) {
                                  onImport(parsed.functionId, parsed.easeType, parsed.params)
                                  toast.success(`Applied: ${preset.command}`)
                                }
                              }}
                            >
                              <MiniCurvePreview command={preset.command} size={20} />
                              <span className="text-[11px]">{preset.command}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="flex items-center gap-2">
                            <MiniCurvePreview command={preset.command} size={40} />
                            <div className="text-xs">
                              <div className="font-medium">{preset.label}</div>
                              <div className="text-muted-foreground">{preset.command}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )
              })}
            </TooltipProvider>
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground">
          Click a preset to quickly apply common ScriptMapper easings
        </p>
      </div>
    </Card>
  )
})
