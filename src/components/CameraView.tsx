import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { EasingFunction } from '@/lib/easingFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { rendererPool } from '@/lib/rendererPool'

// Shared geometry cache for cube preview (reused across all CameraView instances)
let sharedCubeGeometry: THREE.BoxGeometry | null = null
function getSharedCubeGeometry(): THREE.BoxGeometry {
  if (!sharedCubeGeometry) {
    sharedCubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  }
  return sharedCubeGeometry
}

interface CameraViewProps {
  EasingFunction: EasingFunction
  output: number
  filteredOutput: number
  input: number
  baseInput: number
  isTriangularMode: boolean
  easeType: EaseType
  enabledFilters: string[]
  filterParams: Record<string, number>
  startPos: { x: number; y: number; z: number }
  endPos: { x: number; y: number; z: number }
  aspectRatio: string
  title?: string
  onRemove?: () => void
  onEaseTypeChange: (easeType: EaseType) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

export const CameraView = memo(function CameraView({
  EasingFunction,
  output,
  filteredOutput,
  input,
  baseInput,
  isTriangularMode,
  easeType,
  enabledFilters,
  filterParams,
  startPos,
  endPos,
  aspectRatio,
  title,
  onRemove,
  onEaseTypeChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: CameraViewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const frameIdRef = useRef<number | null>(null)

  // Phase 2.2: Combined setup useEffect with ResizeObserver
  useEffect(() => {
    if (!mountRef.current) return

    // Acquire renderer from pool
    const poolResult = rendererPool.acquire()
    if (!poolResult) {
      console.warn('[CameraView] WebGL renderer pool exhausted')
      return
    }
    
    const { renderer, canvas } = poolResult
    rendererRef.current = renderer

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 2, 5)
    cameraRef.current = camera

    // Configure renderer and append canvas to container
    renderer.setSize(width, height)
    mountRef.current.appendChild(canvas)

    // Use shared geometry for cube (reduces GPU memory)
    const geometry = getSharedCubeGeometry()
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x4488ff,
      shininess: 100
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(0, 0, 0)
    scene.add(cube)
    cubeRef.current = cube

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    gridHelper.position.y = -1
    scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(2)
    axesHelper.scale.x = -1
    scene.add(axesHelper)

    // ResizeObserver for container-specific resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!cameraRef.current || !rendererRef.current) return
        
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
      }
    })
    
    resizeObserver.observe(mountRef.current)

    return () => {
      resizeObserver.disconnect()
      
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
      
      // Release renderer back to pool (do NOT dispose it)
      if (rendererRef.current) {
        rendererPool.release(rendererRef.current)
        
        // Remove canvas from DOM
        if (mountRef.current && mountRef.current.contains(canvas)) {
          mountRef.current.removeChild(canvas)
        }
      }
      
      if (cubeRef.current) {
        // Do NOT dispose geometry (it's shared)
        // Only dispose material
        if (cubeRef.current.material instanceof THREE.Material) {
          cubeRef.current.material.dispose()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!cameraRef.current || !cubeRef.current || !rendererRef.current || !sceneRef.current) return

    const cameraX = -(startPos.x + (endPos.x - startPos.x) * filteredOutput)
    const cameraY = startPos.y + (endPos.y - startPos.y) * filteredOutput
    const cameraZ = startPos.z + (endPos.z - startPos.z) * filteredOutput
    
    cameraRef.current.position.set(cameraX, cameraY, cameraZ)
    cameraRef.current.lookAt(cubeRef.current.position)
    
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [baseInput, filteredOutput, startPos, endPos])

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardHeader className="pb-2 px-3 py-2 cursor-move">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate mb-1">
              {title || EasingFunction.name}
            </CardTitle>
            <div className="text-xs font-mono text-muted-foreground truncate">
              {EasingFunction.formula}
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-2">
        <div 
          ref={mountRef} 
          className="w-full rounded border border-border overflow-hidden bg-card"
          style={{ 
            aspectRatio: aspectRatio 
          }}
        />
        
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Input</span>
            <span className="font-mono font-medium">{input.toFixed(3)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Output</span>
            <div className="flex flex-col items-end">
              <span className="font-mono font-medium">{filteredOutput.toFixed(3)}</span>
              {enabledFilters.length > 0 && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  raw: {output.toFixed(3)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Camera Position</span>
            <span className="font-mono font-medium">
              ({(-(startPos.x + (endPos.x - startPos.x) * filteredOutput)).toFixed(2)}, {(startPos.y + (endPos.y - startPos.y) * filteredOutput).toFixed(2)}, {(startPos.z + (endPos.z - startPos.z) * filteredOutput).toFixed(2)})
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-muted-foreground">Ease Type</div>
          <ToggleGroup 
            type="single" 
            value={easeType} 
            onValueChange={(value) => value && onEaseTypeChange(value as EaseType)}
            className="justify-start"
            size="sm"
          >
            <ToggleGroupItem value="easein" className="text-xs px-2 h-7">
              In
            </ToggleGroupItem>
            <ToggleGroupItem value="easeout" className="text-xs px-2 h-7">
              Out
            </ToggleGroupItem>
            <ToggleGroupItem value="easeboth" className="text-xs px-2 h-7">
              Both
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  )
})
