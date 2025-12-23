/**
 * ScriptMapper First Person View
 * 
 * Three.js-based visualization showing what the animated camera sees.
 * The view camera IS the animated camera, following the path directly.
 */

import { useEffect, useRef, memo, useMemo } from 'react'
import * as THREE from 'three'
import type { CameraPath } from '@/lib/scriptMapperTypes'
import { interpolateCameraPath } from '@/lib/cameraPathInterpolation'
import { createHumanoidModel, disposeHumanoidModel } from '@/lib/humanoidModel'

interface ScriptMapperFirstPersonViewProps {
  /** Camera path to follow */
  cameraPath: CameraPath
  /** Current animation time (0-1) */
  globalTime: number
  /** Aspect ratio for the preview container */
  aspectRatio: string
  /** Coordinate system: left-handed (Beat Saber/Unity) or right-handed (Three.js/Blender) */
  coordinateSystem: 'left-handed' | 'right-handed'
}

export const ScriptMapperFirstPersonView = memo(function ScriptMapperFirstPersonView({
  cameraPath,
  globalTime,
  aspectRatio,
  coordinateSystem
}: ScriptMapperFirstPersonViewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const humanoidRef = useRef<THREE.Group | null>(null)
  
  // Current interpolation result
  const currentPosition = useMemo(() => {
    return interpolateCameraPath(cameraPath, globalTime)
  }, [cameraPath, globalTime])
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return
    
    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    
    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    // First-person camera (this IS the animated camera)
    // Beat Saber typical clip planes: near=0.01, far=1000
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    // Humanoid model positioned for ScriptMapper: head at y=1.5 (default #height)
    const humanoid = createHumanoidModel(1.5)
    scene.add(humanoid)
    humanoidRef.current = humanoid
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)
    
    // Grid at floor level (y=0, feet at y=-0.2 for head at 1.5)
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    gridHelper.position.y = 0
    scene.add(gridHelper)
    
    // Axes helper
    const axesHelper = new THREE.AxesHelper(3)
    if (coordinateSystem === 'left-handed') {
      axesHelper.scale.x = -1
    }
    scene.add(axesHelper)
    
    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
      }
    })
    resizeObserver.observe(container)
    
    // Cleanup
    return () => {
      resizeObserver.disconnect()
      
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
        renderer.dispose()
      }
      
      // Dispose humanoid model
      if (humanoidRef.current) {
        disposeHumanoidModel(humanoidRef.current)
      }
    }
  }, [coordinateSystem])
  
  // Update camera position and rotation based on interpolation
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) {
      return
    }
    
    const scene = sceneRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    
    // Update camera position
    const pos = currentPosition.position
    const x = coordinateSystem === 'left-handed' ? -pos.x : pos.x
    camera.position.set(x, pos.y, pos.z)
    
    // Apply rotation from interpolation result (convert degrees to radians)
    const degToRad = Math.PI / 180
    const rotation = currentPosition.rotation ?? { rx: 0, ry: 0, rz: 0 }
    
    // Beat Saber/Unity uses left-handed coordinate system where:
    // - +Z is forward (player facing direction)
    // Three.js camera looks down -Z by default, so we need to add 180° to Y rotation
    // to make rotation (0,0,0) face +Z direction (toward origin/humanoid)
    const yRotation = rotation.ry + 180
    
    // Apply in order: Y (yaw), X (pitch), Z (roll)
    camera.rotation.set(
      rotation.rx * degToRad,
      yRotation * degToRad,
      rotation.rz * degToRad,
      'YXZ'
    )
    
    // Flip for left-handed coordinate system
    if (coordinateSystem === 'left-handed') {
      camera.rotation.y = -camera.rotation.y
    }
    
    // Render
    renderer.render(scene, camera)
    
  }, [currentPosition, coordinateSystem])
  
  // Get display values for the info panel
  const displayRotation = currentPosition.rotation ?? { rx: 0, ry: 0, rz: 0 }
  
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div 
        ref={mountRef}
        className="relative w-full h-full rounded border border-border overflow-hidden bg-card"
      >
        {/* Compact overlay info panel */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between text-[9px] font-mono text-white/90">
          <span className="text-cyan-400">1st Person</span>
          <span>t={globalTime.toFixed(3)}</span>
          <span>pos=({currentPosition.position.x.toFixed(2)}, {currentPosition.position.y.toFixed(2)}, {currentPosition.position.z.toFixed(2)})</span>
          <span>rot=({displayRotation.rx.toFixed(0)}°, {displayRotation.ry.toFixed(0)}°, {displayRotation.rz.toFixed(0)}°)</span>
        </div>
      </div>
    </div>
  )
})
