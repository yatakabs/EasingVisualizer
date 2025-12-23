import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocalKV } from '@/hooks/useLocalKV'
import { usePresets } from '@/hooks/usePresets'
import { PreviewPanel } from '@/components/PreviewPanel'
import { Toolbar } from '@/components/Toolbar'
import { AdvancedSettings } from '@/components/AdvancedSettings'
import { FunctionSelector } from '@/components/FunctionSelector'
import { PresetManager } from '@/components/PresetManager'
import { URLPreviewBanner } from '@/components/URLPreviewBanner'
import { DriftControls } from '@/components/DriftControls'
import { ScriptMapperExport } from '@/components/ScriptMapperExport'
import { ScriptMapperControls } from '@/components/ScriptMapperControls'
import { ScriptMapperPreview } from '@/components/previews/ScriptMapperPreview'
import { ScriptMapperFirstPersonView } from '@/components/previews/ScriptMapperFirstPersonView'
import { ScriptMapperGraph } from '@/components/previews/ScriptMapperGraph'
import { VersionBadge } from '@/components/VersionBadge'
import { Button } from '@/components/ui/button'
import { EASING_FUNCTIONS, type EasingFunction } from '@/lib/easingFunctions'
import { applyFilters } from '@/lib/outputFilters'
import { type EaseType } from '@/lib/easeTypes'
import { type PreviewType } from '@/lib/previewTypes'
import { type AppState } from '@/lib/urlState'
import { useURLState } from '@/hooks/useURLState'
import type { CameraPath } from '@/lib/scriptMapperTypes'
import { CAMERA_PATH_PRESETS } from '@/lib/cameraPathPresets'
import { Toaster as Sonner } from 'sonner'
import { toast } from 'sonner'

// Use local storage for state persistence (works both locally and in production)
const useKV = useLocalKV

const CYCLE_DURATION = 2000
const MAX_PANELS = 24

interface PanelData {
  id: string
  functionId: string
  easeType: EaseType
  title?: string
}

function App() {
  // URL state management - read initial state from URL if present
  const { 
    initialState: urlState, 
    updateURL, 
    hasURLState,
    isPreviewMode,
    applyURLState,
    dismissURLState
  } = useURLState()
  
  // When URL state is present AND not in preview mode, force it to take priority over localStorage
  const forceURLState = { forceValue: hasURLState && !isPreviewMode }
  
  // State to track preview banner visibility
  const [showPreviewBanner, setShowPreviewBanner] = useState(isPreviewMode)
  
  // Preset management
  const { savePreset } = usePresets()
  
  // Use URL state as initial values if available, otherwise use defaults
  const [panels, setPanels] = useKV<PanelData[]>('easing-panels', 
    urlState?.panels ?? [
      { id: '1', functionId: 'linear', easeType: 'easein' },
      { id: '2', functionId: 'quadratic', easeType: 'easein' },
      { id: '3', functionId: 'sine', easeType: 'easein' }
    ],
    forceURLState
  )
  const [isPlaying, setIsPlaying] = useKV<boolean>('is-playing', true)
  const [savedSpeed, setSavedSpeed] = useKV<number>('animation-speed', urlState?.savedSpeed ?? 1, forceURLState)
  const [savedGamma, setSavedGamma] = useKV<number>('gamma-correction', urlState?.savedGamma ?? 2.2, forceURLState)
  const [enabledPreviews, setEnabledPreviews] = useKV<PreviewType[]>('enabled-previews', urlState?.enabledPreviews ?? ['camera', 'graph', 'value'], forceURLState)
  const [enabledFilters, setEnabledFilters] = useKV<string[]>('enabled-filters', urlState?.enabledFilters ?? [], forceURLState)
  const [manualInputMode, setManualInputMode] = useKV<boolean>('manual-input-mode', urlState?.manualInputMode ?? false, forceURLState)
  const [manualInputValue, setManualInputValue] = useKV<number>('manual-input-value', urlState?.manualInputValue ?? 0, forceURLState)
  const [triangularWaveMode, setTriangularWaveMode] = useKV<boolean>('triangular-wave-mode', urlState?.triangularWaveMode ?? false, forceURLState)
  const [cameraStartPos, setCameraStartPos] = useKV<{ x: number; y: number; z: number }>('camera-start-pos', urlState?.cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 }, forceURLState)
  const [cameraEndPos, setCameraEndPos] = useKV<{ x: number; y: number; z: number }>('camera-end-pos', urlState?.cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 }, forceURLState)
  const [cameraAspectRatio, setCameraAspectRatio] = useKV<string>('camera-aspect-ratio', urlState?.cameraAspectRatio ?? '16/9', forceURLState)
  const [maxCameraPreviews, setMaxCameraPreviews] = useKV<number>('max-camera-previews', urlState?.maxCameraPreviews ?? 6, forceURLState)
  const [activeCameraPanels, setActiveCameraPanels] = useKV<string[]>('active-camera-panels', urlState?.activeCameraPanels ?? [], forceURLState)
  const [cardScale, setCardScale] = useKV<number>('card-scale', urlState?.cardScale ?? 1.0, forceURLState)
  const [coordinateSystem, setCoordinateSystem] = useKV<'left-handed' | 'right-handed'>('coordinate-system', urlState?.coordinateSystem ?? 'left-handed', forceURLState)
  const [showControlPanel, setShowControlPanel] = useKV<boolean>('show-control-panel', urlState?.showControlPanel ?? true, forceURLState)
  const [endPauseDuration, setEndPauseDuration] = useKV<number>('end-pause-duration', urlState?.endPauseDuration ?? 2.0, forceURLState)
  const [scriptMapperMode, setScriptMapperMode] = useKV<boolean>('scriptmapper-mode', urlState?.scriptMapperMode ?? false, forceURLState)
  const [driftParams, setDriftParams] = useKV<{ x: number; y: number }>('drift-params', urlState?.driftParams ?? { x: 6, y: 6 }, forceURLState)
  const [activeCameraPath, setActiveCameraPath] = useKV<CameraPath | null>('active-camera-path', CAMERA_PATH_PRESETS[0] ?? null, forceURLState)
  
  const [speed, setSpeed] = useState(1)
  const [gamma, setGamma] = useState(2.2)
  const [time, setTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseProgress, setPauseProgress] = useState(0)
  const [fps, setFps] = useState(60)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [presetManagerOpen, setPresetManagerOpen] = useState(false)
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  
  const lastFrameTime = useRef(Date.now())
  const fpsFrames = useRef<number[]>([])
  const speedTimeoutRef = useRef<number | undefined>(undefined)
  const gammaTimeoutRef = useRef<number | undefined>(undefined)
  const pauseTimeoutRef = useRef<number | undefined>(undefined)
  const pauseStartTimeRef = useRef<number>(0)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const [scaledGridHeight, setScaledGridHeight] = useState<number>(0)

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
    const currentPanels = panels || []
    const currentActive = activeCameraPanels || []
    const currentMax = maxCameraPreviews ?? 6
    
    const validActivePanels = currentActive.filter(id => 
      currentPanels.some(panel => panel.id === id)
    )
    
    if (validActivePanels.length === 0 && currentPanels.length > 0) {
      const initialActive = currentPanels
        .slice(0, Math.min(currentMax, currentPanels.length))
        .map(p => p.id)
      setActiveCameraPanels(() => initialActive)
    } else if (validActivePanels.length !== currentActive.length) {
      setActiveCameraPanels(() => validActivePanels)
    }
  }, [panels, activeCameraPanels, maxCameraPreviews, setActiveCameraPanels])

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

      // If paused at end, update pause progress but skip time update
      if (isPaused) {
        const pauseDuration = (endPauseDuration ?? 2.0) * 1000
        if (pauseDuration > 0 && pauseStartTimeRef.current > 0) {
          const elapsed = now - pauseStartTimeRef.current
          const progress = Math.min(elapsed / pauseDuration, 1)
          setPauseProgress(progress)
        }
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      setTime((prevTime) => {
        const newTime = prevTime + (delta * (speed || 1)) / CYCLE_DURATION
        if (newTime >= 1) {
          // End reached - clamp to 1.0 if pause duration > 0
          if ((endPauseDuration ?? 2.0) > 0) {
            return 1  // Clamp at 1.0, useEffect below will handle pause
          }
          return newTime % 1  // No pause, wrap immediately
        }
        return newTime
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, speed, manualInputMode, isPaused, endPauseDuration])

  // End-of-cycle pause detection: trigger pause when time reaches 1.0
  useEffect(() => {
    if ((manualInputMode ?? false) || !isPlaying) return
    
    if (time >= 1 && !isPaused && (endPauseDuration ?? 2.0) > 0) {
      setIsPaused(true)
      setPauseProgress(0)
      pauseStartTimeRef.current = Date.now()
      
      // Clear any existing timeout
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
      }
      
      // Schedule resume after endPauseDuration
      pauseTimeoutRef.current = window.setTimeout(() => {
        setIsPaused(false)
        setPauseProgress(0)
        pauseStartTimeRef.current = 0
        setTime(0)  // Reset to start new cycle
      }, (endPauseDuration ?? 2.0) * 1000)
    }
  }, [time, isPaused, endPauseDuration, manualInputMode, isPlaying])

  // Clear pause state when playback is stopped
  useEffect(() => {
    if (!isPlaying && isPaused) {
      setIsPaused(false)
      setPauseProgress(0)
      pauseStartTimeRef.current = 0
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = undefined
      }
    }
  }, [isPlaying, isPaused])

  // Cleanup timer refs on unmount
  useEffect(() => {
    return () => {
      if (speedTimeoutRef.current) {
        window.clearTimeout(speedTimeoutRef.current)
      }
      if (gammaTimeoutRef.current) {
        window.clearTimeout(gammaTimeoutRef.current)
      }
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  // Keyboard shortcut: Space → Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is in an input field or slider
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).closest('[role="slider"]')
      ) {
        return
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (!(manualInputMode ?? false)) {
          setIsPlaying((current) => !current)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [manualInputMode, setIsPlaying])

  // ResizeObserver to measure grid height and compensate for scaling
  useEffect(() => {
    const gridContainer = gridContainerRef.current
    if (!gridContainer) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        setScaledGridHeight(height * (cardScale ?? 1.0))
      }
    })

    observer.observe(gridContainer)
    return () => observer.disconnect()
  }, [cardScale])

  // Function to collect current app state for URL sharing
  const getAppState = useCallback((): AppState => ({
    panels: panels ?? [],
    savedSpeed: savedSpeed ?? 1,
    savedGamma: savedGamma ?? 2.2,
    enabledPreviews: enabledPreviews ?? ['camera', 'graph', 'value'],
    enabledFilters: enabledFilters ?? [],
    manualInputMode: manualInputMode ?? false,
    manualInputValue: manualInputValue ?? 0,
    triangularWaveMode: triangularWaveMode ?? false,
    cameraStartPos: cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 },
    cameraEndPos: cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 },
    cameraAspectRatio: cameraAspectRatio ?? '16/9',
    maxCameraPreviews: maxCameraPreviews ?? 6,
    activeCameraPanels: activeCameraPanels ?? [],
    cardScale: cardScale ?? 1.0,
    coordinateSystem: coordinateSystem ?? 'left-handed',
    showControlPanel: showControlPanel ?? true,
    endPauseDuration: endPauseDuration ?? 2.0,
    scriptMapperMode: scriptMapperMode ?? false,
    driftParams: driftParams ?? { x: 6, y: 6 }
  }), [
    panels, savedSpeed, savedGamma, enabledPreviews, enabledFilters,
    manualInputMode, manualInputValue, triangularWaveMode,
    cameraStartPos, cameraEndPos, cameraAspectRatio,
    maxCameraPreviews, activeCameraPanels, cardScale,
    coordinateSystem, showControlPanel, endPauseDuration,
    scriptMapperMode, driftParams
  ])

  // Track if initial URL state has been applied
  const urlStateAppliedRef = useRef(false)
  
  // Sync state to URL (debounced) - skip isPlaying as it's transient
  useEffect(() => {
    // On first render with URL state, mark as applied but don't update URL yet
    if (hasURLState && !urlStateAppliedRef.current) {
      urlStateAppliedRef.current = true
      return
    }
    
    // Update URL on all subsequent state changes
    updateURL(getAppState())
  }, [
    panels, savedSpeed, savedGamma, enabledPreviews, enabledFilters,
    manualInputMode, manualInputValue, triangularWaveMode,
    cameraStartPos, cameraEndPos, cameraAspectRatio,
    maxCameraPreviews, activeCameraPanels, cardScale,
    coordinateSystem, showControlPanel, endPauseDuration,
    scriptMapperMode, driftParams,
    updateURL, getAppState, hasURLState
  ])

  // Preview mode handlers
  const handleApplyURLState = useCallback(() => {
    if (!urlState) return
    
    // Apply URL state to all localStorage-backed state
    applyURLState()
    
    // Force update all state from URL
    setPanels(urlState.panels)
    setSavedSpeed(urlState.savedSpeed)
    setSavedGamma(urlState.savedGamma)
    setEnabledPreviews(urlState.enabledPreviews)
    setEnabledFilters(urlState.enabledFilters)
    setManualInputMode(urlState.manualInputMode)
    setManualInputValue(urlState.manualInputValue)
    setTriangularWaveMode(urlState.triangularWaveMode)
    setCameraStartPos(urlState.cameraStartPos)
    setCameraEndPos(urlState.cameraEndPos)
    setCameraAspectRatio(urlState.cameraAspectRatio)
    setMaxCameraPreviews(urlState.maxCameraPreviews)
    setActiveCameraPanels(urlState.activeCameraPanels)
    setCardScale(urlState.cardScale)
    setCoordinateSystem(urlState.coordinateSystem)
    setShowControlPanel(urlState.showControlPanel)
    setEndPauseDuration(urlState.endPauseDuration)
    setScriptMapperMode(urlState.scriptMapperMode)
    setDriftParams(urlState.driftParams)
    
    // Hide banner
    setShowPreviewBanner(false)
    
    toast.success('URL configuration applied')
  }, [
    urlState, applyURLState,
    setPanels, setSavedSpeed, setSavedGamma, setEnabledPreviews,
    setEnabledFilters, setManualInputMode, setManualInputValue,
    setTriangularWaveMode, setCameraStartPos, setCameraEndPos,
    setCameraAspectRatio, setMaxCameraPreviews, setActiveCameraPanels,
    setCardScale, setCoordinateSystem, setShowControlPanel, setEndPauseDuration,
    setScriptMapperMode, setDriftParams
  ])

  const handleDismissURLState = useCallback(() => {
    dismissURLState()
    setShowPreviewBanner(false)
    toast.info('URL configuration dismissed')
  }, [dismissURLState])

  const handleSaveURLAsPreset = useCallback(async (name: string) => {
    if (!urlState) return
    
    try {
      await savePreset(name, urlState, 'url')
      setShowPreviewBanner(false)
      dismissURLState()
      toast.success(`Preset "${name}" saved`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preset')
    }
  }, [urlState, savePreset, dismissURLState])

  const handleLoadPreset = useCallback((state: AppState) => {
    setPanels(state.panels)
    setSavedSpeed(state.savedSpeed)
    setSavedGamma(state.savedGamma)
    setEnabledPreviews(state.enabledPreviews)
    setEnabledFilters(state.enabledFilters)
    setManualInputMode(state.manualInputMode)
    setManualInputValue(state.manualInputValue)
    setTriangularWaveMode(state.triangularWaveMode)
    setCameraStartPos(state.cameraStartPos)
    setCameraEndPos(state.cameraEndPos)
    setCameraAspectRatio(state.cameraAspectRatio)
    setMaxCameraPreviews(state.maxCameraPreviews)
    setActiveCameraPanels(state.activeCameraPanels)
    setCardScale(state.cardScale)
    setCoordinateSystem(state.coordinateSystem)
    setShowControlPanel(state.showControlPanel)
    setEndPauseDuration(state.endPauseDuration)
    setPresetManagerOpen(false)
  }, [
    setPanels, setSavedSpeed, setSavedGamma, setEnabledPreviews,
    setEnabledFilters, setManualInputMode, setManualInputValue,
    setTriangularWaveMode, setCameraStartPos, setCameraEndPos,
    setCameraAspectRatio, setMaxCameraPreviews, setActiveCameraPanels,
    setCardScale, setCoordinateSystem, setShowControlPanel, setEndPauseDuration
  ])

  const getTriangularWave = (t: number): number => {
    const normalized = t % 1
    return normalized < 0.5 ? normalized * 2 : 2 - normalized * 2
  }

  const handleAddPanel = useCallback(() => {
    setPanels((currentPanels) => {
      if ((currentPanels || []).length >= MAX_PANELS) {
        toast.error(`Maximum ${MAX_PANELS} panels allowed`)
        return currentPanels || []
      }
      setSelectorOpen(true)
      return currentPanels || []
    })
  }, [setPanels])

  const handleSelectFunction = useCallback((func: EasingFunction) => {
    setPanels((currentPanels) => {
      const nextPanelNumber = (currentPanels || []).length + 1
      const newPanelId = Date.now().toString()
      
      setActiveCameraPanels((currentActive) => {
        const active = currentActive || []
        const currentMax = maxCameraPreviews ?? 6
        if (active.length < currentMax) {
          return [...active, newPanelId]
        }
        return active
      })
      
      return [
        ...(currentPanels || []),
        {
          id: newPanelId,
          functionId: func.id,
          easeType: 'easein' as EaseType
        }
      ]
    })
    toast.success(`Added ${func.name} panel`)
  }, [setPanels, setActiveCameraPanels, maxCameraPreviews])

  const handleRemovePanel = useCallback((id: string) => () => {
    setPanels((currentPanels) => (currentPanels || []).filter(panel => panel.id !== id))
    setActiveCameraPanels((currentActive) => (currentActive || []).filter(panelId => panelId !== id))
  }, [setPanels, setActiveCameraPanels])

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

  const handleEndPauseDurationChange = useCallback((newDuration: number) => {
    setEndPauseDuration(() => newDuration)
  }, [setEndPauseDuration])

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

  const handleDriftParamsChange = useCallback((x: number, y: number) => {
    setDriftParams(() => ({ x, y }))
  }, [setDriftParams])

  const handleDriftReset = useCallback(() => {
    setDriftParams(() => ({ x: 6, y: 6 }))
  }, [setDriftParams])

  const handleScriptMapperImport = useCallback((functionId: string, easeType: EaseType, params?: { x: number; y: number }) => {
    // If params are provided (Drift function), update drift params
    if (params) {
      setDriftParams(() => params)
    }
    
    // Add a new panel with the imported function
    const func = EASING_FUNCTIONS.find(f => f.id === functionId)
    if (func) {
      handleAddPanel()
      // Update the newly added panel with the correct function and ease type
      setPanels((currentPanels) => {
        const panels = currentPanels || []
        if (panels.length === 0) return panels
        const lastPanel = panels[panels.length - 1]
        return panels.map(panel => 
          panel.id === lastPanel.id 
            ? { ...panel, functionId, easeType } 
            : panel
        )
      })
    }
  }, [setDriftParams, handleAddPanel, setPanels])

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

  const handleToggleFilter = useCallback((filterId: string) => {
    setEnabledFilters((current) => {
      const filters = current ?? []
      if (filters.includes(filterId)) {
        return filters.filter(id => id !== filterId)
      } else {
        return [...filters, filterId]
      }
    })
  }, [setEnabledFilters])

  const handleToggleCameraForPanel = useCallback((panelId: string) => {
    setActiveCameraPanels((currentActive) => {
      const active = currentActive || []
      if (active.includes(panelId)) {
        return active.filter(id => id !== panelId)
      } else {
        const currentMax = maxCameraPreviews ?? 6
        if (active.length >= currentMax) {
          toast.error(`最大${currentMax}個のカメラプレビューまで表示可能です`)
          return active
        }
        return [...active, panelId]
      }
    })
  }, [setActiveCameraPanels, maxCameraPreviews])

  // Share handler - uses ShareButton's internal logic but provides callback for Toolbar
  const handleShare = useCallback(async () => {
    const state = getAppState()
    try {
      const { encodeAppState } = await import('@/lib/urlState')
      const encoded = encodeAppState(state)
      const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`
      await navigator.clipboard.writeText(url)
      toast.success('Share URL copied to clipboard!')
    } catch (err) {
      toast.error('Failed to generate share URL')
    }
  }, [getAppState])

  const handleEaseTypeChange = useCallback((panelId: string, newEaseType: EaseType) => {
    setPanels((currentPanels) =>
      (currentPanels || []).map(p =>
        p.id === panelId ? { ...p, easeType: newEaseType } : p
      )
    )
  }, [setPanels])

  const baseInputValue = (manualInputMode ?? false) ? (manualInputValue ?? 0) : time
  const currentInputValue = (triangularWaveMode ?? false) ? getTriangularWave(baseInputValue) : baseInputValue
  const usedFunctionIds = (panels || []).map(p => p.functionId)
  const isTriangularMode = triangularWaveMode ?? false
  const showCameraSettings = (enabledPreviews ?? []).includes('camera')

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Sonner position="top-center" theme="dark" />
      
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link focus-ring">
        Skip to main content
      </a>
      
      {/* URL Preview Banner */}
      {showPreviewBanner && urlState && (
        <URLPreviewBanner
          urlState={urlState}
          onApply={handleApplyURLState}
          onDismiss={handleDismissURLState}
          onSaveAsPreset={handleSaveURLAsPreset}
        />
      )}
      
      {/* Sticky Toolbar */}
      <Toolbar
        isPlaying={isPlaying ?? true}
        isPausedAtEnd={isPaused}
        manualMode={manualInputMode ?? false}
        speed={speed}
        inputValue={currentInputValue}
        enabledPreviews={enabledPreviews ?? ['camera', 'graph', 'value']}
        mode={scriptMapperMode ? 'scriptmapper' : 'normal'}
        onModeChange={(mode) => setScriptMapperMode(() => mode === 'scriptmapper')}
        onPlayPause={() => setIsPlaying((current) => !current)}
        onSpeedChange={handleSpeedChange}
        onInputValueChange={handleInputValueChange}
        onAddPanel={handleAddPanel}
        onTogglePreview={handleTogglePreview}
        onOpenPresets={() => setPresetManagerOpen(true)}
        onShare={handleShare}
        onToggleAdvanced={() => setShowAdvancedSettings(prev => !prev)}
        showAdvanced={showAdvancedSettings}
      />
      
      {/* Main Content Area - Fills remaining viewport height */}
      <main id="main-content" className="flex-1 overflow-auto min-h-0" aria-label="Easing function panels">
        <div className="h-full px-3 sm:px-4 py-3 sm:py-4">
          {/* ScriptMapper Controls - conditionally visible */}
          {scriptMapperMode && (
            <div className="space-y-2 mb-2 max-h-[calc(100vh-60px)] overflow-y-auto">
              {/* ScriptMapper Controls - path selection, segment overview */}
              <ScriptMapperControls
                enabled={scriptMapperMode ?? false}
                onToggleEnabled={(enabled) => setScriptMapperMode(() => enabled)}
                activePath={activeCameraPath ?? null}
                onSelectPath={(path) => setActiveCameraPath(() => path)}
                globalTime={baseInputValue}
                isPlaying={isPlaying ?? true}
                onTogglePlay={() => setIsPlaying((current) => !current)}
              />
              
              {/* ScriptMapper Previews - only if a path is selected */}
              {activeCameraPath && (
                <div>
                  {/* Camera Views and Graph - Three columns on large screens with equal height */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:h-[180px]">
                    {/* 3D Camera Path Preview (Third Person / Orbit View) */}
                    <div className="flex flex-col h-full">
                      <div className="text-xs text-muted-foreground mb-0.5 px-1 flex-shrink-0">Third Person View</div>
                      <div className="flex-1 min-h-0">
                        <ScriptMapperPreview
                          cameraPath={activeCameraPath}
                          globalTime={baseInputValue}
                          aspectRatio={cameraAspectRatio ?? '16/9'}
                          coordinateSystem={coordinateSystem ?? 'left-handed'}
                        />
                      </div>
                    </div>
                    
                    {/* First Person View (Camera POV) */}
                    <div className="flex flex-col h-full">
                      <div className="text-xs text-muted-foreground mb-0.5 px-1 flex-shrink-0">First Person View</div>
                      <div className="flex-1 min-h-0">
                        <ScriptMapperFirstPersonView
                          cameraPath={activeCameraPath}
                          globalTime={baseInputValue}
                          aspectRatio={cameraAspectRatio ?? '16/9'}
                          coordinateSystem={coordinateSystem ?? 'left-handed'}
                        />
                      </div>
                    </div>
                    
                    {/* Timing Graph with Segment List - Same row as camera views */}
                    <div className="flex flex-col h-full">
                      <div className="text-xs text-muted-foreground mb-0.5 px-1 flex-shrink-0">Timing Graph</div>
                      <div className="flex-1 min-h-0">
                        <ScriptMapperGraph
                          cameraPath={activeCameraPath}
                          globalTime={baseInputValue}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Drift Controls - only visible when at least one panel uses Drift */}
              {(panels || []).some(panel => panel.functionId === 'drift') && (
                <DriftControls
                  x={driftParams?.x ?? 6}
                  y={driftParams?.y ?? 6}
                  onXChange={(x) => handleDriftParamsChange(x, driftParams?.y ?? 6)}
                  onYChange={(y) => handleDriftParamsChange(driftParams?.x ?? 6, y)}
                  onReset={handleDriftReset}
                  visible={true}
                />
              )}

              {/* ScriptMapper Export/Import */}
              <ScriptMapperExport
                functionId={(panels || [])[0]?.functionId ?? 'linear'}
                easeType={(panels || [])[0]?.easeType ?? 'easein'}
                driftParams={driftParams ?? { x: 6, y: 6 }}
                onImport={handleScriptMapperImport}
                visible={true}
              />
            </div>
          )}

          {/* Panels Grid or Empty State */}
          {(panels || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl sm:text-7xl mb-4">📊</div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">パネルがありません</h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-md">
                最初のパネルを追加して関数の比較を開始
              </p>
              <Button onClick={handleAddPanel} size="lg" className="min-h-[44px]">
                Add Panel
              </Button>
            </div>
          ) : (
            <div 
              className="h-full"
              style={{ 
                minHeight: scaledGridHeight > 0 ? scaledGridHeight : undefined 
              }}
            >
              <div
                ref={gridContainerRef}
                style={{
                  transform: `scale(${cardScale ?? 1.0})`,
                  transformOrigin: 'top left',
                  width: `calc(100% / ${cardScale ?? 1.0})`,
                }}
              >
                {/* Responsive Auto-fit Grid */}
                <div className="panel-grid">
                  {(panels || []).map((panel) => {
                    const func = EASING_FUNCTIONS.find(f => f.id === panel.functionId)
                    if (!func) return null

                    // Pass drift params if the function is Drift
                    const params = panel.functionId === 'drift' ? driftParams : undefined
                    const output = func.calculate(currentInputValue, panel.easeType, params)
                    const filteredOutput = applyFilters(output, enabledFilters ?? [], { gamma: gamma ?? 2.2 })
                    
                    const isCameraActive = (activeCameraPanels || []).includes(panel.id)
                    const canActivateCamera = !isCameraActive && (activeCameraPanels || []).length < (maxCameraPreviews ?? 6)

                    return (
                      <div key={panel.id} className="panel-card">
                        <PreviewPanel
                          easingFunction={func}
                          output={output}
                          filteredOutput={filteredOutput}
                          input={currentInputValue}
                          baseInput={baseInputValue}
                          isTriangularMode={isTriangularMode}
                          easeType={panel.easeType}
                          enabledFilters={enabledFilters ?? []}
                          filterParams={{ gamma: gamma ?? 2.2 }}
                          enabledPreviews={enabledPreviews ?? ['glow', 'value']}
                          cameraStartPos={cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 }}
                          cameraEndPos={cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 }}
                          cameraAspectRatio={cameraAspectRatio ?? '16/9'}
                          coordinateSystem={coordinateSystem ?? 'left-handed'}
                          showCamera={isCameraActive}
                          canToggleCamera={enabledPreviews?.includes('camera') ?? false}
                          canActivateCamera={canActivateCamera}
                          onRemove={(panels || []).length > 1 ? handleRemovePanel(panel.id) : undefined}
                          onToggleCamera={() => handleToggleCameraForPanel(panel.id)}
                          onEaseTypeChange={(newEaseType) => handleEaseTypeChange(panel.id, newEaseType)}
                          onDragStart={handleDragStart(panel.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop(panel.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Collapsible Advanced Settings */}
      <AdvancedSettings
        open={showAdvancedSettings}
        onOpenChange={setShowAdvancedSettings}
        gamma={gamma}
        onGammaChange={handleGammaChange}
        manualInputMode={manualInputMode ?? false}
        triangularWaveMode={triangularWaveMode ?? false}
        inputValue={baseInputValue}
        onManualInputModeChange={handleManualInputModeChange}
        onTriangularWaveModeChange={(enabled) => setTriangularWaveMode(() => enabled)}
        onInputValueChange={handleInputValueChange}
        onSetAllEaseType={handleSetAllEaseType}
        showCameraSettings={showCameraSettings}
        cameraStartPos={cameraStartPos ?? { x: 2.0, y: 1.0, z: -5.0 }}
        cameraEndPos={cameraEndPos ?? { x: 2.0, y: 1.0, z: 5.0 }}
        cameraAspectRatio={cameraAspectRatio ?? '16/9'}
        maxCameraPreviews={maxCameraPreviews ?? 6}
        coordinateSystem={coordinateSystem ?? 'left-handed'}
        onCameraStartPosChange={(pos) => setCameraStartPos(() => pos)}
        onCameraEndPosChange={(pos) => setCameraEndPos(() => pos)}
        onCameraAspectRatioChange={(aspectRatio) => setCameraAspectRatio(() => aspectRatio)}
        onMaxCameraPreviewsChange={(max) => setMaxCameraPreviews(() => max)}
        onCoordinateSystemChange={(system) => setCoordinateSystem(() => system)}
        cardScale={cardScale ?? 1.0}
        endPauseDuration={endPauseDuration ?? 2.0}
        onCardScaleChange={(scale) => setCardScale(() => scale)}
        onEndPauseDurationChange={handleEndPauseDurationChange}
      />

      <FunctionSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectFunction}
        usedFunctionIds={usedFunctionIds}
        scriptMapperMode={scriptMapperMode ?? false}
      />

      <PresetManager
        open={presetManagerOpen}
        onOpenChange={setPresetManagerOpen}
        onLoadPreset={handleLoadPreset}
        currentState={getAppState()}
      />
      
      <VersionBadge />
    </div>
  )
}

export default App