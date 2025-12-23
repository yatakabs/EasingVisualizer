import { memo } from 'react'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  isPlaying: boolean
  isPausedAtEnd: boolean
  manualMode: boolean
  className?: string
}

/**
 * Status indicator showing current animation state:
 * - Playing (green) - Animation is actively running
 * - Paused (amber) - Paused at end of cycle
 * - Manual (blue) - User is controlling input manually
 * - Stopped (gray) - Playback is stopped
 */
export const StatusIndicator = memo(function StatusIndicator({
  isPlaying,
  isPausedAtEnd,
  manualMode,
  className
}: StatusIndicatorProps) {
  const status = manualMode 
    ? { label: 'Manual', color: 'blue' as const }
    : isPausedAtEnd 
      ? { label: 'Paused', color: 'amber' as const }
      : isPlaying 
        ? { label: 'Playing', color: 'green' as const }
        : { label: 'Stopped', color: 'gray' as const }

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        "px-2.5 py-1 rounded-full select-none",
        "transition-colors duration-150",
        status.color === 'green' && "bg-green-500/20 text-green-400",
        status.color === 'amber' && "bg-amber-500/20 text-amber-400",
        status.color === 'blue' && "bg-blue-500/20 text-blue-400",
        status.color === 'gray' && "bg-gray-500/20 text-gray-400",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Animation status: ${status.label}`}
    >
      <span 
        className={cn(
          "w-2 h-2 rounded-full",
          "motion-safe:animate-pulse",
          status.color === 'green' && "bg-green-500",
          status.color === 'amber' && "bg-amber-500",
          status.color === 'blue' && "bg-blue-500",
          status.color === 'gray' && "bg-gray-400"
        )} 
        aria-hidden="true"
      />
      {status.label}
    </span>
  )
})
