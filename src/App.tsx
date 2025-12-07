import { useState, useEffect, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { LEDPanel } from '@/components/LEDPanel'
import { RectangleMovement } from '@/components/RectangleMovement'
import { ControlPanel } from '@/components/ControlPanel'
import { FunctionSelector } from '@/components/FunctionSelector'
import { LED_FUNCTIONS, type LEDFunction } from '@/lib/ledFunctions'
import { Toaster as Sonner } from 'sonner'
import { toast } from 'sonner'

const CYCLE_DURATION = 2000
const MAX_PANELS = 12

interface PanelData {
  id: string
  functionId: string
}

function App() {
  const [panels, setPanels] = useKV<PanelData[]>('led-panels', [
    { id: '1', functionId: 'linear' },
    { id: '2', functionId: 'sine' },
    { id: '3', functionId: 'quadratic' },
    { id: '4', functionId: 'cubic' }
  ])
  const [isPlaying, setIsPlaying] = useKV<boolean>('is-playing', true)
  const [savedSpeed, setSavedSpeed] = useKV<number>('animation-speed', 1)
  const [savedGamma, setSavedGamma] = useKV<number>('gamma-correction', 2.2)
  const [visualizationMode, setVisualizationMode] = useKV<'led' | 'rectangle'>('visualization-mode', 'led')
  
  const [speed, setSpeed] = useState(1)
  const [gamma, setGamma] = useState(2.2)
  const [time, setTime] = useState(0)
  const [fps, setFps] = useState(60)
  const [selectorOpen, setSelectorOpen] = useState(false)
  
  const lastFrameTime = useRef(Date.now())
  const fpsFrames = useRef<number[]>([])
  const speedTimeoutRef = useRef<number | undefined>(undefined)
  const gammaTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (savedSpeed !== undefined && savedSpeed !== null) {
      setSpeed(savedSpeed)
    }
  }, [savedSpeed])

  useEffect(() => {
    if (savedGamma !== undefined && savedGamma !== null) {
      setGamma(savedGamma)
    }
  }, [savedGamma])

  useEffect(() => {
    if (!isPlaying) return

    let animationFrameId: number

    const animate = () => {
      const now = Date.now()
      const delta = now - lastFrameTime.current
      lastFrameTime.current = now

      fpsFrames.current.push(delta)
      if (fpsFrames.current.length > 30) {
        fpsFrames.current.shift()
      }
      
      const avgDelta = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length
      setFps(Math.round(1000 / avgDelta))

      setTime((prevTime) => {
        const newTime = prevTime + (delta * (speed || 1)) / CYCLE_DURATION
        return newTime % 1
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, speed])

  const handleAddPanel = useCallback(() => {
    if ((panels || []).length >= MAX_PANELS) {
      toast.error(`Maximum ${MAX_PANELS} panels allowed`)
      return
    }
    setSelectorOpen(true)
  }, [panels])

  const handleSelectFunction = useCallback((func: LEDFunction) => {
    setPanels((currentPanels) => [
      ...(currentPanels || []),
      {
        id: Date.now().toString(),
        functionId: func.id
      }
    ])
    toast.success(`Added ${func.name} panel`)
  }, [setPanels])

  const handleRemovePanel = useCallback((id: string) => () => {
    setPanels((currentPanels) => (currentPanels || []).filter(panel => panel.id !== id))
  }, [setPanels])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    
    if (speedTimeoutRef.current) {
      window.clearTimeout(speedTimeoutRef.current)
    }
    
    speedTimeoutRef.current = window.setTimeout(() => {
      setSavedSpeed(() => newSpeed)
    }, 500)
  }, [setSavedSpeed])

  const handleGammaChange = useCallback((newGamma: number) => {
    setGamma(newGamma)
    
    if (gammaTimeoutRef.current) {
      window.clearTimeout(gammaTimeoutRef.current)
    }
    
    gammaTimeoutRef.current = window.setTimeout(() => {
      setSavedGamma(() => newGamma)
    }, 500)
  }, [setSavedGamma])

  const usedFunctionIds = (panels || []).map(p => p.functionId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sonner position="top-center" theme="dark" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            関数比較ビジュアライザー
          </h1>
          <p className="text-muted-foreground text-lg">
            異なる数学関数の出力を視覚的に比較
          </p>
        </header>

        <div className="space-y-6">
          <ControlPanel
            isPlaying={isPlaying ?? true}
            speed={speed ?? 1}
            gamma={gamma ?? 2.2}
            fps={fps}
            visualizationMode={visualizationMode ?? 'led'}
            onPlayPause={() => setIsPlaying((current) => !current)}
            onSpeedChange={handleSpeedChange}
            onGammaChange={handleGammaChange}
            onAddPanel={handleAddPanel}
            onVisualizationModeChange={(mode) => setVisualizationMode(() => mode)}
          />

          {(panels || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold mb-2">パネルがありません</h2>
              <p className="text-muted-foreground mb-6">
                最初のパネルを追加して関数の比較を開始
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(panels || []).map((panel) => {
                const func = LED_FUNCTIONS.find(f => f.id === panel.functionId)
                if (!func) return null

                const rawBrightness = func.calculate(time)
                const brightness = Math.pow(rawBrightness, 1 / (gamma ?? 2.2))

                const PanelComponent = visualizationMode === 'rectangle' ? RectangleMovement : LEDPanel

                return (
                  <PanelComponent
                    key={panel.id}
                    ledFunction={func}
                    brightness={brightness}
                    rawBrightness={rawBrightness}
                    onRemove={(panels || []).length > 1 ? handleRemovePanel(panel.id) : undefined}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      <FunctionSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectFunction}
        usedFunctionIds={usedFunctionIds}
      />
    </div>
  )
}

export default App