import { useState, useEffect, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { PreviewPanel } from '@/components/PreviewPanel'
import { ControlPanel } from '@/components/ControlPanel'
import { FunctionSelector } from '@/components/FunctionSelector'
import { LED_FUNCTIONS, type LEDFunction } from '@/lib/ledFunctions'
import { applyFilters } from '@/lib/outputFilters'
import { type EaseType } from '@/lib/easeTypes'
import { type PreviewType } from '@/lib/previewTypes'
import { Toaster as Sonner } from 'sonner'
import { toast } from 'sonner'

const CYCLE_DURATION = 2000
const MAX_PANELS = 24

interface PanelData {
  id: string
  functionId: string
  easeType: EaseType
  title?: string
}

function App() {
  const [panels, setPanels] = useKV<PanelData[]>('led-panels', [
    { id: '1', functionId: 'linear', easeType: 'easein', title: 'Panel 1' },
    { id: '2', functionId: 'quadratic', easeType: 'easein', title: 'Panel 2' },
    { id: '3', functionId: 'sine', easeType: 'easein', title: 'Panel 3' }
  ])
  const [isPlaying, setIsPlaying] = useKV<boolean>('is-playing', true)
  const [savedSpeed, setSavedSpeed] = useKV<number>('animation-speed', 1)
  const [savedGamma, setSavedGamma] = useKV<number>('gamma-correction', 2.2)
  const [enabledPreviews, setEnabledPreviews] = useKV<PreviewType[]>('enabled-previews', ['led', 'value'])
  const [enabledFilters, setEnabledFilters] = useKV<string[]>('enabled-filters', [])
  const [manualInputMode, setManualInputMode] = useKV<boolean>('manual-input-mode', false)
  const [manualInputValue, setManualInputValue] = useKV<number>('manual-input-value', 0)
  const [triangularWaveMode, setTriangularWaveMode] = useKV<boolean>('triangular-wave-mode', false)
  const [cameraStartPos, setCameraStartPos] = useKV<{ x: number; y: number; z: number }>('camera-start-pos', { x: 2.0, y: 1.0, z: -5.0 })
  const [cameraEndPos, setCameraEndPos] = useKV<{ x: number; y: number; z: number }>('camera-end-pos', { x: 2.0, y: 1.0, z: 5.0 })
  const [cameraAspectRatio, setCameraAspectRatio] = useKV<string>('camera-aspect-ratio', '16/9')
  
  const [speed, setSpeed] = useState(1)
  const [gamma, setGamma] = useState(2.2)
  const [time, setTime] = useState(0)
  const [fps, setFps] = useState(60)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null)
  
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
    if (!isPlaying || (manualInputMode ?? false)) return

    let animationFrameId: number

    const animate = () => {
      const now = Date.now()
      const delta = now - lastFrameTime.current
      lastFrameTime.current = now

      fpsFrames.current.push(delta)
      if (fpsFrames.current.length > 30) {
        fpsFrames.current.shift()
      }
      
      if (fpsFrames.current.length > 0) {
        const avgDelta = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length
        setFps(Math.round(1000 / avgDelta))
      }

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
  }, [isPlaying, speed, manualInputMode])

  const getTriangularWave = (t: number): number => {
    const normalized = t % 1
    return normalized < 0.5 ? normalized * 2 : 2 - normalized * 2
  }

  const handleAddPanel = useCallback(() => {
    if ((panels || []).length >= MAX_PANELS) {
      toast.error(`Maximum ${MAX_PANELS} panels allowed`)
      return
    }
    setSelectorOpen(true)
  }, [panels])

  const handleSelectFunction = useCallback((func: LEDFunction) => {
    setPanels((currentPanels) => {
      const nextPanelNumber = (currentPanels || []).length + 1
      return [
        ...(currentPanels || []),
        {
          id: Date.now().toString(),
          functionId: func.id,
          easeType: 'easein' as EaseType,
          title: `Panel ${nextPanelNumber}`
        }
      ]
    })
    toast.success(`Added ${func.name} panel`)
  }, [setPanels])

  const handleRemovePanel = useCallback((id: string) => () => {
    setPanels((currentPanels) => (currentPanels || []).filter(panel => panel.id !== id))
  }, [setPanels])

  const handleDragStart = useCallback((panelId: string) => (e: React.DragEvent) => {
    setDraggedPanelId(panelId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedPanelId(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((targetPanelId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedPanelId || draggedPanelId === targetPanelId) {
      return
    }

    setPanels((currentPanels) => {
      const panels = currentPanels || []
      const draggedIndex = panels.findIndex(p => p.id === draggedPanelId)
      const targetIndex = panels.findIndex(p => p.id === targetPanelId)
      
      if (draggedIndex === -1 || targetIndex === -1) {
        return panels
      }

      const newPanels = [...panels]
      const [draggedPanel] = newPanels.splice(draggedIndex, 1)
      newPanels.splice(targetIndex, 0, draggedPanel)
      
      return newPanels
    })
  }, [draggedPanelId, setPanels])

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

  const handleManualInputModeChange = useCallback((enabled: boolean) => {
    setManualInputMode(() => enabled)
    if (enabled) {
      setTime(time)
      setManualInputValue(() => time)
    } else {
      lastFrameTime.current = Date.now()
      fpsFrames.current = []
    }
  }, [setManualInputMode, setManualInputValue, time])

  const handleInputValueChange = useCallback((value: number) => {
    setManualInputValue(() => value)
    setTime(value)
  }, [setManualInputValue])

  const handleSetAllEaseType = useCallback((easeType: EaseType) => {
    setPanels((currentPanels) => 
      (currentPanels || []).map(panel => ({ ...panel, easeType }))
    )
  }, [setPanels])

  const handleTogglePreview = useCallback((previewType: PreviewType) => {
    setEnabledPreviews((current) => {
      const previews = current ?? []
      if (previews.includes(previewType)) {
        return previews.filter(p => p !== previewType)
      } else {
        return [...previews, previewType]
      }
    })
  }, [setEnabledPreviews])

  const baseInputValue = (manualInputMode ?? false) ? (manualInputValue ?? 0) : time
  const currentInputValue = (triangularWaveMode ?? false) ? getTriangularWave(baseInputValue) : baseInputValue
  const usedFunctionIds = (panels || []).map(p => p.functionId)
  const isTriangularMode = triangularWaveMode ?? false

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sonner position="top-center" theme="dark" />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[120rem]">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1.5" style={{ letterSpacing: '-0.02em' }}>
            関数比較ビジュアライザー
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            異なる数学関数の出力を視覚的に比較
          </p>
        </header>

        <div className="space-y-4">
          <ControlPanel
            isPlaying={isPlaying ?? true}
            speed={speed ?? 1}
            gamma={gamma ?? 2.2}
            fps={fps}
            enabledPreviews={enabledPreviews ?? ['led', 'value']}
            enabledFilters={enabledFilters ?? []}
            inputValue={currentInputValue}
            baseInputValue={baseInputValue}
            manualInputMode={manualInputMode ?? false}
            triangularWaveMode={triangularWaveMode ?? false}
            onPlayPause={() => setIsPlaying((current) => !current)}
            onSpeedChange={handleSpeedChange}
            onGammaChange={handleGammaChange}
            onAddPanel={handleAddPanel}
            onTogglePreview={handleTogglePreview}
            onToggleFilter={(filterId) => {
              setEnabledFilters((current) => {
                const filters = current ?? []
                if (filters.includes(filterId)) {
                  return filters.filter(id => id !== filterId)
                } else {
                  return [...filters, filterId]
                }
              })
            }}
            onInputValueChange={handleInputValueChange}
            onManualInputModeChange={handleManualInputModeChange}
            onTriangularWaveModeChange={(enabled) => setTriangularWaveMode(() => enabled)}
            onSetAllEaseType={handleSetAllEaseType}
            cameraStartPos={cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 }}
            cameraEndPos={cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 }}
            cameraAspectRatio={cameraAspectRatio ?? '16/9'}
            onCameraStartPosChange={(pos) => setCameraStartPos(() => pos)}
            onCameraEndPosChange={(pos) => setCameraEndPos(() => pos)}
            onCameraAspectRatioChange={(aspectRatio) => setCameraAspectRatio(() => aspectRatio)}
          />

          {(panels || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
              <div className="text-6xl sm:text-7xl mb-4">📊</div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">パネルがありません</h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-md">
                最初のパネルを追加して関数の比較を開始
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 sm:gap-4">
              {(panels || []).map((panel, panelIndex) => {
                const func = LED_FUNCTIONS.find(f => f.id === panel.functionId)
                if (!func) return null

                const output = func.calculate(currentInputValue, panel.easeType)
                const filteredOutput = applyFilters(output, enabledFilters ?? [], { gamma: gamma ?? 2.2 })

                return (
                  <PreviewPanel
                    key={panel.id}
                    ledFunction={func}
                    output={output}
                    filteredOutput={filteredOutput}
                    input={currentInputValue}
                    baseInput={baseInputValue}
                    isTriangularMode={isTriangularMode}
                    easeType={panel.easeType}
                    enabledFilters={enabledFilters ?? []}
                    filterParams={{ gamma: gamma ?? 2.2 }}
                    enabledPreviews={enabledPreviews ?? ['led', 'value']}
                    cameraStartPos={cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 }}
                    cameraEndPos={cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 }}
                    cameraAspectRatio={cameraAspectRatio ?? '16/9'}
                    title={panel.title}
                    onRemove={(panels || []).length > 1 ? handleRemovePanel(panel.id) : undefined}
                    onEaseTypeChange={(newEaseType) => {
                      setPanels((currentPanels) =>
                        (currentPanels || []).map(p =>
                          p.id === panel.id ? { ...p, easeType: newEaseType } : p
                        )
                      )
                    }}
                    onDragStart={handleDragStart(panel.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(panel.id)}
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