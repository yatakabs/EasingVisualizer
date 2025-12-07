import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import type { LEDFunction } from '@/lib/ledFunctions'

interface CameraPreviewProps {
  ledFunction: LEDFunction
  output: number
  filteredOutput: number
  baseInput: number
  enabledFilters: string[]
  startPos: { x: number; y: number; z: number }
  endPos: { x: number; y: number; z: number }
  aspectRatio: string
  maxPreviews: number
}

export const CameraPreview = memo(function CameraPreview({
  ledFunction,
  output,
  filteredOutput,
  baseInput,
  enabledFilters,
  startPos,
  endPos,
  aspectRatio,
  maxPreviews
}: CameraPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const previewCubesRef = useRef<THREE.Mesh[]>([])
  const currentMaxPreviewsRef = useRef<number>(maxPreviews)

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 })
    ]
    const cube = new THREE.Mesh(geometry, materials)
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
      
      previewCubesRef.current.forEach(cube => {
        cube.geometry.dispose()
        if (Array.isArray(cube.material)) {
          cube.material.forEach(mat => mat.dispose())
        }
      })
      previewCubesRef.current = []
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      
      if (cubeRef.current) {
        cubeRef.current.geometry.dispose()
        if (Array.isArray(cubeRef.current.material)) {
          cubeRef.current.material.forEach(mat => mat.dispose())
        } else if (cubeRef.current.material instanceof THREE.Material) {
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

    const scene = sceneRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    const mainCube = cubeRef.current
    
    const cameraX = startPos.x + (endPos.x - startPos.x) * filteredOutput
    const cameraY = startPos.y + (endPos.y - startPos.y) * filteredOutput
    const cameraZ = startPos.z + (endPos.z - startPos.z) * filteredOutput
    
    camera.position.set(cameraX, cameraY, cameraZ)
    camera.lookAt(mainCube.position)
    
    if (currentMaxPreviewsRef.current !== maxPreviews) {
      previewCubesRef.current.forEach(cube => {
        scene.remove(cube)
        cube.geometry.dispose()
        if (Array.isArray(cube.material)) {
          cube.material.forEach(mat => mat.dispose())
        }
      })
      previewCubesRef.current = []
      currentMaxPreviewsRef.current = maxPreviews
    }
    
    const numSteps = Math.min(maxPreviews, 24)
    const stepSize = 1 / numSteps
    
    while (previewCubesRef.current.length > numSteps) {
      const cube = previewCubesRef.current.pop()
      if (cube) {
        scene.remove(cube)
        cube.geometry.dispose()
        if (Array.isArray(cube.material)) {
          cube.material.forEach(mat => mat.dispose())
        }
      }
    }
    
    while (previewCubesRef.current.length < numSteps) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x888888,
        transparent: true,
        opacity: 0.3,
        shininess: 60
      })
      const cube = new THREE.Mesh(geometry, material)
      scene.add(cube)
      previewCubesRef.current.push(cube)
    }
    
    previewCubesRef.current.forEach((cube, index) => {
      const t = stepSize * (index + 1)
      const posX = startPos.x + (endPos.x - startPos.x) * t
      const posY = startPos.y + (endPos.y - startPos.y) * t
      const posZ = startPos.z + (endPos.z - startPos.z) * t
      
      cube.position.set(posX, posY, posZ)
    })
    
    renderer.render(scene, camera)
  }, [baseInput, filteredOutput, startPos, endPos, maxPreviews])

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div 
        ref={mountRef} 
        className="w-full rounded border border-border overflow-hidden bg-card"
        style={{ 
          aspectRatio: aspectRatio 
        }}
      />
      
      <div className="w-full bg-secondary rounded px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Output</span>
          <div className="flex flex-col items-end">
            <span className="font-mono font-medium">{filteredOutput.toFixed(3)}</span>
            {enabledFilters.length > 0 && (
              <span className="font-mono text-[9px] text-muted-foreground">
                raw: {output.toFixed(3)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Camera Pos</span>
          <span className="font-mono font-medium text-[9px]">
            ({(startPos.x + (endPos.x - startPos.x) * filteredOutput).toFixed(2)}, {(startPos.y + (endPos.y - startPos.y) * filteredOutput).toFixed(2)}, {(startPos.z + (endPos.z - startPos.z) * filteredOutput).toFixed(2)})
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Preview Count</span>
          <span className="font-mono font-medium">{Math.min(maxPreviews, 24)}</span>
        </div>
      </div>
    </div>
  )
})
