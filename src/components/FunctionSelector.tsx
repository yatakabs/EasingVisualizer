import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LED_FUNCTIONS, type LEDFunction } from '@/lib/ledFunctions'

interface FunctionSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (func: LEDFunction) => void
  usedFunctionIds: string[]
}

export function FunctionSelector({
  open,
  onOpenChange,
  onSelect,
  usedFunctionIds
}: FunctionSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            関数を選択
          </DialogTitle>
          <DialogDescription className="text-sm">
            比較に追加する関数を選択してください
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-3">
            {LED_FUNCTIONS.map((func) => {
              const isUsed = usedFunctionIds.includes(func.id)
              
              return (
                <Button
                  key={func.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-2 gap-1 hover:border-primary transition-colors"
                  onClick={() => {
                    onSelect(func)
                    onOpenChange(false)
                  }}
                  disabled={isUsed}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: func.color,
                        boxShadow: `0 0 6px ${func.color}`
                      }}
                    />
                    <span className="font-semibold text-xs truncate">{func.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground text-left w-full leading-tight">
                    {func.formula}
                  </span>
                  {isUsed && (
                    <span className="text-[10px] text-muted-foreground">
                      (使用中)
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
