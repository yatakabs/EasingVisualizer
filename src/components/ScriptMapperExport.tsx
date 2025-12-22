import { memo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Upload } from '@phosphor-icons/react'
import { formatAsScriptMapperCommand, parseScriptMapperCommand } from '@/lib/scriptMapperCompat'
import { toast } from 'sonner'
import type { EaseType } from '@/lib/easeTypes'

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

  if (!visible) return null

  const exportCommand = formatAsScriptMapperCommand(functionId, easeType, driftParams)

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
        <div className="flex gap-2">
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
            className="gap-1"
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
    </Card>
  )
})
