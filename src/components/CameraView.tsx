import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import type { LEDFunction } from '@/lib/ledFunctions'
import type { EaseType } from '@/lib/easeTypes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface CameraViewProps {
  ledFunction: LEDFunction
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
  ledFunction,
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

  useEffect(() => {
    if (!mountRef.current) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 2, 5)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const geometry = new THREE.BoxGeometry(1, 1, 1)
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

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const newWidth = mountRef.current.clientWidth
      const newHeight = mountRef.current.clientHeight
      
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      
      if (cubeRef.current) {
        cubeRef.current.geometry.dispose()
        if (cubeRef.current.material instanceof THREE.Material) {
          cubeRef.current.material.dispose()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
    
    requestAnimationFrame(() => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      
      const newWidth = mountRef.current.clientWidth
      const newHeight = mountRef.current.clientHeight
      
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    })
  }, [aspectRatio])

  useEffect(() => {
    if (!cameraRef.current || !cubeRef.current || !rendererRef.current || !sceneRef.current) return

    const cameraX = -(startPos.x + (endPos.x - startPos.x) * filteredOutput)
    const cameraY = startPos.y + (endPos.y - startPos.y) * filteredOutput
    const cameraZ = startPos.z + (endPos.z - startPos.z) * filteredOutput
    
    cameraRef.current.position.set(cameraX, cameraY, cameraZ)
    cameraRef.current.lookAt(cubeRef.current.position)
    
    cubeRef.current.rotation.y = baseInput * Math.PI * 2
    cubeRef.current.rotation.x = Math.sin(baseInput * Math.PI * 4) * 0.2
    
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
              {title || ledFunction.name}
            </CardTitle>
            <div className="text-xs font-mono text-muted-foreground truncate">
              {ledFunction.formula}
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
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cube Rotation</span>
            <span className="font-mono font-medium">{(baseInput * 360).toFixed(1)}°</span>
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
