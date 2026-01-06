import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import type { EasingFunction } from '@/lib/easingFunctions'
import { createHumanoidModel, disposeHumanoidModel } from '@/lib/humanoidModel'
import { rendererPool } from '@/lib/rendererPool'

interface CameraPreviewProps {
  easingFunction: EasingFunction
  output: number
  filteredOutput: number
  baseInput: number
  enabledFilters: string[]
  startPos: { x: number; y: number; z: number }
  endPos: { x: number; y: number; z: number }
  aspectRatio: string
  coordinateSystem: 'left-handed' | 'right-handed'
}

export const CameraPreview = memo(function CameraPreview({
  easingFunction,
  output,
  filteredOutput,
  baseInput,
  enabledFilters,
  startPos,
  endPos,
  aspectRatio,
  coordinateSystem
}: CameraPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const humanoidRef = useRef<THREE.Group | null>(null)
  const frameIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Acquire renderer from pool
    const poolResult = rendererPool.acquire()
    if (!poolResult) {
      console.warn('[CameraPreview] WebGL renderer pool exhausted')
      return
    }
    
    const { renderer, canvas } = poolResult
    rendererRef.current = renderer

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Beat Saber typical clip planes: near=0.01, far=1000
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000)
    camera.position.set(0, 1.5, 5)  // Eye level with humanoid head
    cameraRef.current = camera

    // Configure renderer and append canvas to container
    renderer.setSize(width, height)
    mountRef.current.appendChild(canvas)

    // Humanoid model - feet at y=0, head at y=1.5 (Beat Saber standard player height)
    const humanoid = createHumanoidModel(1.5)
    scene.add(humanoid)
    humanoidRef.current = humanoid

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Grid at ground level (y=0, where humanoid feet are)
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    gridHelper.position.y = 0
    scene.add(gridHelper)

    // 座標系に応じてAxesHelperのスケールを設定
    // 左手座標系: X軸を反転 (Beat Saber, Unity)
    // 右手座標系: そのまま (Three.js, Blender)
    const axesHelper = new THREE.AxesHelper(2)
    if (coordinateSystem === 'left-handed') {
      axesHelper.scale.x = -1
    }
    scene.add(axesHelper)

    // ResizeObserverでコンテナサイズ変更を監視（カードサイズ変更時も追従）
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
      
      // Dispose humanoid model
      if (humanoidRef.current) {
        disposeHumanoidModel(humanoidRef.current)
      }
    }
  }, [coordinateSystem])

  // Note: aspectRatio変更時のリサイズはResizeObserverで自動的に処理される
  // （親がaspect-ratioを変更 → コンテナサイズ変更 → ResizeObserverがトリガー）

  useEffect(() => {
    if (!cameraRef.current || !humanoidRef.current || !rendererRef.current || !sceneRef.current) return

    const scene = sceneRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    const humanoid = humanoidRef.current
    
    // 論理座標系でのカメラ位置を計算
    const logicalCameraX = startPos.x + (endPos.x - startPos.x) * filteredOutput
    const logicalCameraY = startPos.y + (endPos.y - startPos.y) * filteredOutput
    const logicalCameraZ = startPos.z + (endPos.z - startPos.z) * filteredOutput
    
    // 座標系に応じてThree.js（右手座標系）に変換
    // 左手座標系（Beat Saber, Unity）: X軸を反転してThree.jsに渡す
    // 右手座標系（Three.js, Blender）: そのまま
    const cameraX = coordinateSystem === 'left-handed' ? -logicalCameraX : logicalCameraX
    const cameraY = logicalCameraY
    const cameraZ = logicalCameraZ
    
    camera.position.set(cameraX, cameraY, cameraZ)
    // Resolve head world position from humanoid model if available
    const headMesh = humanoid.getObjectByName('head') as THREE.Object3D | undefined
    const headWorldPos = new THREE.Vector3()
    if (headMesh) {
      headMesh.getWorldPosition(headWorldPos)
    } else {
      // Fallback to humanoid.userData.headHeight or default 1.5
      headWorldPos.set(
        humanoid.position.x ?? 0,
        // @ts-expect-error userData may be untyped
        humanoid.userData?.headHeight ?? 1.5,
        humanoid.position.z ?? 0
      )
    }
    camera.lookAt(headWorldPos)
    
    renderer.render(scene, camera)
  }, [baseInput, filteredOutput, startPos, endPos, coordinateSystem])

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
      </div>
    </div>
  )
})
