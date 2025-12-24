import { memo } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DotsThreeVertical, Cube, X } from '@phosphor-icons/react'

interface PanelActionsMenuProps {
  showCamera: boolean
  canToggleCamera: boolean
  canActivateCamera: boolean
  onToggleCamera: () => void
  onRemove?: () => void
}

/**
 * Consolidated dropdown menu for panel actions.
 * Contains camera toggle and remove actions to reduce header visual clutter.
 * Optimized for mouse-only operation with compact sizing.
 */
export const PanelActionsMenu = memo(function PanelActionsMenu({
  showCamera,
  canToggleCamera,
  canActivateCamera,
  onToggleCamera,
  onRemove,
}: PanelActionsMenuProps) {
  const hasCameraAction = canToggleCamera
  const hasRemoveAction = !!onRemove
  
  // If no actions available, don't render the menu
  if (!hasCameraAction && !hasRemoveAction) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-0"
          aria-label="Panel actions"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThreeVertical size={12} weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasCameraAction && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              if (showCamera || canActivateCamera) {
                onToggleCamera()
              }
            }}
            disabled={!showCamera && !canActivateCamera}
            className="gap-2 cursor-pointer"
          >
            <Cube
              size={16}
              weight={showCamera ? 'fill' : 'regular'}
              className={showCamera ? 'text-primary' : ''}
            />
            {showCamera ? 'カメラを非表示' : 'カメラを表示'}
            {!showCamera && !canActivateCamera && (
              <span className="text-xs text-muted-foreground ml-auto">最大数</span>
            )}
          </DropdownMenuItem>
        )}
        {hasRemoveAction && (
          <>
            {hasCameraAction && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <X size={16} />
              パネルを削除
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
