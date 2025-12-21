/**
 * Preset Manager Component
 * 
 * Full-featured UI for managing app state presets:
 * - View all saved presets
 * - Load presets to apply configurations
 * - Export/import presets as JSON
 * - Delete unwanted presets
 */

import { useState, useCallback } from 'react'
import { 
  FileArrowDown, 
  FileArrowUp, 
  Trash, 
  Copy, 
  FloppyDisk,
  X 
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePresets, type ConflictStrategy } from '@/hooks/usePresets'
import type { Preset } from '@/lib/presetTypes'
import type { AppState } from '@/lib/urlState'
import { toast } from 'sonner'

export interface PresetManagerProps {
  /** Whether the dialog is open */
  open: boolean
  
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  
  /** Callback when user loads a preset */
  onLoadPreset: (state: AppState) => void
  
  /** Current app state for saving new presets */
  currentState: AppState
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

/**
 * Get badge variant for preset source
 */
function getSourceBadgeVariant(source?: string): 'default' | 'secondary' | 'outline' {
  switch (source) {
    case 'url': return 'default'
    case 'import': return 'secondary'
    default: return 'outline'
  }
}

export function PresetManager({
  open,
  onOpenChange,
  onLoadPreset,
  currentState
}: PresetManagerProps) {
  const {
    presets,
    isLoading,
    error,
    canSaveMore,
    savePreset,
    updatePreset,
    deletePreset,
    exportPreset,
    exportAllPresets,
    importPresets
  } = usePresets()
  
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
  const [presetName, setPresetName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [importJson, setImportJson] = useState('')
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('rename')
  
  const handleSavePreset = useCallback(async () => {
    try {
      await savePreset(presetName, currentState, 'local')
      setShowSaveDialog(false)
      setPresetName('')
      toast.success(`Preset "${presetName}" saved`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preset')
    }
  }, [presetName, currentState, savePreset])
  
  const handleLoadPreset = useCallback((preset: Preset) => {
    onLoadPreset(preset.data)
    onOpenChange(false)
    toast.success(`Loaded preset "${preset.name}"`)
  }, [onLoadPreset, onOpenChange])
  
  const handleDeletePreset = useCallback(async () => {
    if (!selectedPreset) return
    
    try {
      await deletePreset(selectedPreset.id)
      setShowDeleteDialog(false)
      setSelectedPreset(null)
      toast.success(`Preset "${selectedPreset.name}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete preset')
    }
  }, [selectedPreset, deletePreset])
  
  const handleDuplicatePreset = useCallback(async (preset: Preset) => {
    try {
      const copyName = `${preset.name} (Copy)`
      await savePreset(copyName, preset.data, preset.meta.source)
      toast.success(`Preset duplicated as "${copyName}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate preset')
    }
  }, [savePreset])
  
  const handleExportPreset = useCallback((preset: Preset) => {
    try {
      exportPreset(preset.id)
      toast.success(`Preset "${preset.name}" exported`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export preset')
    }
  }, [exportPreset])
  
  const handleExportAll = useCallback(() => {
    try {
      exportAllPresets()
      toast.success(`All presets exported`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export presets')
    }
  }, [exportAllPresets])
  
  const handleImport = useCallback(async () => {
    try {
      const result = await importPresets(importJson, conflictStrategy)
      
      if (result.failed > 0) {
        toast.error(
          `Import failed: ${result.failed} preset${result.failed !== 1 ? 's' : ''} invalid`,
          {
            description: result.errors.slice(0, 3).map(e => e.reason).join(', ')
          }
        )
      } else {
        toast.success(`Imported ${result.success} preset${result.success !== 1 ? 's' : ''}`)
        setShowImportDialog(false)
        setImportJson('')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import presets')
    }
  }, [importJson, conflictStrategy, importPresets])
  
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setImportJson(text)
      }
    }
    reader.readAsText(file)
  }, [])
  
  const handleStartEdit = useCallback((preset: Preset) => {
    setEditingId(preset.id)
    setEditingName(preset.name)
  }, [])
  
  const handleSaveEdit = useCallback(async (preset: Preset) => {
    if (editingName.trim() === preset.name) {
      setEditingId(null)
      return
    }
    
    try {
      await updatePreset(preset.id, { name: editingName.trim() })
      setEditingId(null)
      toast.success('Preset renamed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename preset')
    }
  }, [editingName, updatePreset])
  
  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingName('')
  }, [])
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preset Manager</DialogTitle>
            <DialogDescription>
              Manage your saved configurations
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between gap-2 py-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!canSaveMore}
            >
              <FloppyDisk className="w-4 h-4 mr-2" />
              Save Current
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <FileArrowUp className="w-4 h-4 mr-2" />
                Import
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={presets.length === 0}
              >
                <FileArrowDown className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
          
          {!canSaveMore && (
            <Alert>
              <AlertDescription>
                Preset limit reached (50 max). Delete or export old presets to save more.
              </AlertDescription>
            </Alert>
          )}
          
          <ScrollArea className="flex-1 pr-4" style={{ maxHeight: '400px' }}>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading presets...
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">No presets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Save your first configuration to get started
                </p>
                <Button onClick={() => setShowSaveDialog(true)}>
                  <FloppyDisk className="w-4 h-4 mr-2" />
                  Save Current State
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {editingId === preset.id ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(preset)
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(preset)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <h4
                            className="font-medium mb-1 cursor-pointer hover:text-primary"
                            onClick={() => handleStartEdit(preset)}
                            title="Click to edit"
                          >
                            {preset.name}
                          </h4>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatRelativeTime(preset.createdAt)}</span>
                          {preset.meta.source && (
                            <Badge variant={getSourceBadgeVariant(preset.meta.source)}>
                              {preset.meta.source}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {preset.data.panels.length} panel{preset.data.panels.length !== 1 ? 's' : ''}
                          {preset.data.savedSpeed !== 1 && `, ${preset.data.savedSpeed}x speed`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Load
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportPreset(preset)}
                          title="Export"
                        >
                          <FileArrowDown className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicatePreset(preset)}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPreset(preset)
                            setShowDeleteDialog(true)
                          }}
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Save your current configuration as a preset
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-preset-name">Preset Name</Label>
              <Input
                id="new-preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Configuration"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && presetName.trim()) {
                    handleSavePreset()
                  }
                }}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Current configuration:</p>
              <p>
                {currentState.panels.length} panel{currentState.panels.length !== 1 ? 's' : ''}
                {currentState.savedSpeed !== 1 && `, ${currentState.savedSpeed}x speed`}
                {currentState.savedGamma !== 2.2 && `, γ=${currentState.savedGamma}`}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Presets</DialogTitle>
            <DialogDescription>
              Import presets from a JSON file or paste JSON directly
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportFile}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="import-json">Or Paste JSON</Label>
              <textarea
                id="import-json"
                className="w-full h-32 px-3 py-2 text-sm border rounded-md"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"id": "...", "name": "...", ...}]'
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conflict-strategy">If preset names conflict:</Label>
              <Select
                value={conflictStrategy}
                onValueChange={(value) => setConflictStrategy(value as ConflictStrategy)}
              >
                <SelectTrigger id="conflict-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rename">Rename imported presets</SelectItem>
                  <SelectItem value="merge">Keep both (skip duplicates)</SelectItem>
                  <SelectItem value="replace">Replace existing presets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importJson.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPreset(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
