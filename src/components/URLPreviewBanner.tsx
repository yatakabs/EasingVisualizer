/**
 * URL Preview Banner Component
 * 
 * Displays a banner when URL state is detected, allowing users to:
 * - Apply the URL configuration
 * - Save it as a preset
 * - Dismiss it and keep their current state
 */

import { useState } from 'react'
import { X, Check, BookmarkSimple, XCircle } from '@phosphor-icons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AppState } from '@/lib/urlState'

export interface URLPreviewBannerProps {
  /** URL state to preview */
  urlState: AppState
  
  /** Callback when user applies URL state */
  onApply: () => void
  
  /** Callback when user dismisses URL state */
  onDismiss: () => void
  
  /** Callback when user saves URL state as preset */
  onSaveAsPreset: (name: string) => void
}

/**
 * Generate a summary of the URL state for display
 */
function generateStateSummary(state: AppState): string {
  const parts: string[] = []
  
  if (state.panels.length > 0) {
    parts.push(`${state.panels.length} panel${state.panels.length !== 1 ? 's' : ''}`)
  }
  
  if (state.savedSpeed !== 1) {
    parts.push(`${state.savedSpeed}x speed`)
  }
  
  if (state.savedGamma !== 2.2) {
    parts.push(`γ=${state.savedGamma}`)
  }
  
  if (state.enabledPreviews.length > 0) {
    parts.push(`${state.enabledPreviews.length} preview${state.enabledPreviews.length !== 1 ? 's' : ''}`)
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Configuration'
}

export function URLPreviewBanner({
  urlState,
  onApply,
  onDismiss,
  onSaveAsPreset
}: URLPreviewBannerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('Shared Configuration')
  
  const summary = generateStateSummary(urlState)
  
  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSaveAsPreset(presetName.trim())
      setShowSaveDialog(false)
      setPresetName('Shared Configuration')
    }
  }
  
  return (
    <>
      <Alert className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-3xl shadow-lg border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-500">
        <AlertDescription className="flex items-center gap-4 pr-8">
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Shared configuration detected
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {summary}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onApply}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Apply
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              <BookmarkSimple className="w-4 h-4 mr-1" />
              Save as Preset
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </AlertDescription>
      </Alert>
      
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>
              Save this shared configuration as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset()
                  }
                }}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Configuration preview:</p>
              <p>{summary}</p>
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
    </>
  )
}
