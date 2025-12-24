import { memo, useState, useCallback } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { GearSix } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

interface MobileControlSheetProps {
  children: React.ReactNode
  /** Title shown in sheet header */
  title?: string
}

/**
 * Mobile-optimized control panel wrapper.
 * On mobile (<768px): Shows a floating action button that opens a bottom sheet.
 * On desktop: Renders children directly without wrapper.
 */
export const MobileControlSheet = memo(function MobileControlSheet({
  children,
  title = 'Settings'
}: MobileControlSheetProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
  }, [])

  // On desktop, render children directly
  if (!isMobile) {
    return <>{children}</>
  }

  // On mobile, wrap in bottom sheet
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          size="icon"
          aria-label="Open settings"
        >
          <GearSix size={24} weight="bold" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="max-h-[85vh] overflow-y-auto rounded-t-xl"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <GearSix size={20} className="text-muted-foreground" />
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="pb-safe">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
})
