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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            関数を選択
          </DialogTitle>
          <DialogDescription>
            比較に追加する関数を選択してください
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
            {LED_FUNCTIONS.map((func) => {
              const isUsed = usedFunctionIds.includes(func.id)
              
              return (
                <Button
                  key={func.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2 hover:border-primary"
                  onClick={() => {
                    onSelect(func)
                    onOpenChange(false)
                  }}
                  disabled={isUsed}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: func.color,
                        boxShadow: `0 0 8px ${func.color}`
                      }}
                    />
                    <span className="font-semibold text-base">{func.name}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground text-left w-full">
                    {func.formula}
                  </span>
                  {isUsed && (
                    <span className="text-xs text-muted-foreground">
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
