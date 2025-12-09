/**
 * Share Button Component
 * 
 * Copies the shareable URL to clipboard and shows toast notification.
 */

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ShareNetwork, Check, Link } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateShareURL, type AppState } from '@/lib/urlState'

interface ShareButtonProps {
  /** Current app state to encode in the URL */
  getState: () => AppState
  /** Optional additional class names */
  className?: string
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const ShareButton = memo(function ShareButton({
  getState,
  className,
  variant = 'outline',
  size = 'sm'
}: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    try {
      const state = getState()
      const shareURL = generateShareURL(state)
      
      // Check URL length
      if (shareURL.length > 8000) {
        console.warn(`URL length (${shareURL.length}) exceeds recommended limit`)
      }
      
      // Try to use clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareURL)
        toast.success('リンクをコピーしました', {
          description: '共有URLがクリップボードにコピーされました',
          icon: <Check size={18} weight="bold" className="text-green-500" />
        })
      } else {
        // Fallback: show URL in toast for manual copy
        toast.info('URLをコピーしてください', {
          description: shareURL,
          duration: 10000,
          icon: <Link size={18} />
        })
      }
    } catch (error) {
      console.error('Failed to share URL:', error)
      toast.error('共有に失敗しました', {
        description: 'URLの生成またはコピーに問題が発生しました'
      })
    }
  }, [getState])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      title="設定を共有するURLをコピー"
    >
      <ShareNetwork size={18} className="mr-1.5" />
      共有
    </Button>
  )
})
