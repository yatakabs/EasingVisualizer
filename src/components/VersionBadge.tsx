/**
 * Version Badge Component
 * 
 * Displays version and build information in bottom-right corner with tooltip.
 * Click to copy full build info to clipboard.
 */

import { memo, useCallback } from 'react'
import { getBuildInfo } from '@/lib/buildInfo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Check } from '@phosphor-icons/react'

export const VersionBadge = memo(function VersionBadge() {
  const info = getBuildInfo()
  
  const handleClick = useCallback(() => {
    const buildInfoText = `Easing Visualizer v${info.version}\nCommit: ${info.commit}\nBuilt: ${info.buildDate.toLocaleString()}\nEnvironment: ${info.environment}`
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(buildInfoText)
        .then(() => {
          toast.success('Build info copied', {
            description: 'Version information copied to clipboard',
            icon: <Check size={18} weight="bold" className="text-green-500" />
          })
        })
        .catch((err) => {
          console.error('Failed to copy:', err)
          toast.error('Failed to copy', {
            description: 'Could not copy to clipboard'
          })
        })
    }
  }, [info])
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="fixed bottom-2 right-2 z-50 px-2 py-1 text-xs rounded-md 
                     bg-black/30 text-white/50 hover:text-white/90 
                     transition-all duration-200 cursor-pointer
                     backdrop-blur-sm border border-white/10 hover:border-white/20"
        >
          v{info.version} ({info.commit})
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        <div className="space-y-1">
          <div className="font-semibold">Easing Visualizer</div>
          <div>Version: {info.version}</div>
          <div>Commit: {info.commit}</div>
          <div>Built: {info.buildDate.toLocaleDateString()}</div>
          <div>Environment: {info.environment}</div>
          <div className="text-white/60 mt-2 pt-1 border-t border-white/10">
            Click to copy build info
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
})
