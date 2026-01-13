/**
 * ScriptMapper 3D Camera Preview
 * 
 * Three.js-based visualization of N-point camera paths.
 * Shows path curve, waypoint markers, and animated camera following the path.
 */

import { useEffect, useRef, memo, useMemo } from 'react'
import * as THREE from 'three'
import type { CameraPath } from '@/lib/scriptMapperTypes'
import { interpolateCameraPath, generatePathPreviewPoints } from '@/lib/cameraPathInterpolation'
import { createHumanoidModel, disposeHumanoidModel } from '@/lib/humanoidModel'
import { rendererPool } from '@/lib/rendererPool'

interface ScriptMapperPreviewProps {
  /** Camera path to visualize */
  cameraPath: CameraPath
  /** Current animation time (0-1) */
  globalTime: number
  /** Aspect ratio for the preview container */
  aspectRatio: string
  /** Coordinate system: left-handed (Beat Saber/Unity) or right-handed (Three.js/Blender) */
  coordinateSystem: 'left-handed' | 'right-handed'
}

// Colors for segment visualization
const SEGMENT_COLORS = [
  0x00ffff, // Cyan
  0xff00ff, // Magenta
  0xffff00, // Yellow
  0x00ff00, // Green
  0xff8800, // Orange
  0x8800ff, // Purple
  0xff0088, // Pink
  0x00ff88, // Teal
]

/**
 * Create a 3D camera model with FOV cone
 * @param fov - Field of view in degrees (default: 60)
 * @param color - Color for the camera body and FOV cone
 * @returns THREE.Group containing camera body, lens, and FOV cone
 */
function createCameraModel(fov: number = 60, color: number = 0x00ffff): THREE.Group {
  const cameraGroup = new THREE.Group()
  
  // Camera body (main box)
  const bodyGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.2)
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.7
  })
  const cameraBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
  cameraGroup.add(cameraBody)
  
  // Lens cylinder (front of camera)
  const lensGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16)
  const lensMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.9
  })
  const lens = new THREE.Mesh(lensGeometry, lensMaterial)
  lens.rotation.x = Math.PI / 2  // Point forward
  lens.position.z = 0.175  // Position at front of body
  cameraGroup.add(lens)
  
  // Lens glass (colored accent)
  const glassGeometry = new THREE.CircleGeometry(0.07, 16)
  const glassMaterial = new THREE.MeshBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: 0.8
  })
  const glass = new THREE.Mesh(glassGeometry, glassMaterial)
  glass.position.z = 0.251  // Just in front of lens
  cameraGroup.add(glass)
  
  // FOV cone (semi-transparent visualization)
  const fovAngle = (fov * Math.PI) / 180
  const coneHeight = 2.5  // Cone length
  const coneRadius = coneHeight * Math.tan(fovAngle / 2)
  
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true)
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const fovCone = new THREE.Mesh(coneGeometry, coneMaterial)
  
  // Rotate cone to point forward (+Z direction) and position it
  // ConeGeometry points in +Y by default, so rotate -90° around X to point in +Z
  fovCone.rotation.x = -Math.PI / 2
  fovCone.position.z = coneHeight / 2 + 0.25  // Start from lens front
  
  cameraGroup.add(fovCone)
  
  // FOV cone wireframe edges for better visibility
  const edgesMaterial = new THREE.LineBasicMaterial({ 
    color: color, 
    transparent: true, 
    opacity: 0.5 
  })
  const edgesGeometry = new THREE.EdgesGeometry(coneGeometry)
  const coneEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
  coneEdges.rotation.x = -Math.PI / 2
  coneEdges.position.z = coneHeight / 2 + 0.25
  cameraGroup.add(coneEdges)
  
  // Store references for later updates
  cameraGroup.userData = {
    bodyMaterial,
    glassMaterial,
    coneMaterial,
    edgesMaterial,
    bodyGeometry,
    lensGeometry,
    glassGeometry,
    coneGeometry,
    edgesGeometry
  }
  
  return cameraGroup
}

/**
 * Dispose any Three.js Object3D and its resources
 * Handles Mesh, Line, Points, and other subtypes
 */
function disposeObject3D(obj: THREE.Object3D): void {
  if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
    obj.geometry?.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  }
}

/**
 * Update camera model color based on current segment
 */
function updateCameraModelColor(cameraModel: THREE.Group, color: number): void {
  const userData = cameraModel.userData
  if (userData.glassMaterial) {
    userData.glassMaterial.color.setHex(color)
  }
  if (userData.coneMaterial) {
    userData.coneMaterial.color.setHex(color)
  }
  if (userData.edgesMaterial) {
    userData.edgesMaterial.color.setHex(color)
  }
}

export const ScriptMapperPreview = memo(function ScriptMapperPreview({
  cameraPath,
  globalTime,
  aspectRatio,
  coordinateSystem
}: ScriptMapperPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const viewCameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const pathLineRef = useRef<THREE.Line | null>(null)
  const waypointMarkersRef = useRef<THREE.Group | null>(null)
  const cameraModelRef = useRef<THREE.Group | null>(null)
  const humanoidRef = useRef<THREE.Group | null>(null)
  const previewCameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  
  // Generate path preview points
  const pathPoints = useMemo(() => {
    return generatePathPreviewPoints(cameraPath, 100)
  }, [cameraPath])
  
  // Current interpolation result
  const currentPosition = useMemo(() => {
    return interpolateCameraPath(cameraPath, globalTime)
  }, [cameraPath, globalTime])
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return
    
    const container = mountRef.current
    
    // Acquire renderer from pool
    const poolResult = rendererPool.acquire()
    if (!poolResult) {
      console.warn('[ScriptMapperPreview] WebGL renderer pool exhausted')
      return
    }
    
    const { renderer, canvas } = poolResult
    rendererRef.current = renderer
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    // View camera (observer camera)
    // Beat Saber typical clip planes: near=0.01, far=1000
    const viewCamera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    viewCamera.position.set(10, 8, 10)
    viewCamera.lookAt(0, 0, 0)
    viewCameraRef.current = viewCamera
    
    // Preview camera (shows path camera frustum - for debugging)
    // Beat Saber typical clip planes: near=0.01, far=1000
    const previewCamera = new THREE.PerspectiveCamera(50, 16/9, 0.01, 1000)
    previewCameraRef.current = previewCamera
    
    // Configure renderer and append canvas to container
    renderer.setSize(width, height)
    container.appendChild(canvas)
    
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
    
    // Grid at floor level (y=0)
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    gridHelper.position.y = 0
    scene.add(gridHelper)
    
    // Axes helper
    const axesHelper = new THREE.AxesHelper(3)
    if (coordinateSystem === 'left-handed') {
      axesHelper.scale.x = -1
    }
    scene.add(axesHelper)
    
    // Waypoint markers group
    const waypointGroup = new THREE.Group()
    scene.add(waypointGroup)
    waypointMarkersRef.current = waypointGroup
    
    // Camera model with FOV cone (replaces simple sphere marker)
    const cameraModel = createCameraModel(60, SEGMENT_COLORS[0])
    scene.add(cameraModel)
    cameraModelRef.current = cameraModel
    
    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0 && viewCameraRef.current && rendererRef.current) {
          viewCameraRef.current.aspect = width / height
          viewCameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
      }
    })
    resizeObserver.observe(container)
    
    // Cleanup
    return () => {
      resizeObserver.disconnect()
      
      // Release renderer back to pool (do NOT dispose it)
      if (rendererRef.current) {
        rendererPool.release(rendererRef.current)
        
        // Remove canvas from DOM
        if (container.contains(canvas)) {
          container.removeChild(canvas)
        }
      }
      
      // Dispose humanoid model
      if (humanoidRef.current) {
        disposeHumanoidModel(humanoidRef.current)
      }
      
      // Dispose camera model resources
      if (cameraModelRef.current) {
        const userData = cameraModelRef.current.userData
        if (userData) {
          userData.bodyMaterial?.dispose()
          userData.glassMaterial?.dispose()
          userData.coneMaterial?.dispose()
          userData.edgesMaterial?.dispose()
          userData.bodyGeometry?.dispose()
          userData.lensGeometry?.dispose()
          userData.glassGeometry?.dispose()
          userData.coneGeometry?.dispose()
          userData.edgesGeometry?.dispose()
        }
      }
      
      // Dispose path line
      if (pathLineRef.current) {
        pathLineRef.current.geometry.dispose()
        if (Array.isArray(pathLineRef.current.material)) {
          pathLineRef.current.material.forEach(m => m.dispose())
        } else {
          pathLineRef.current.material.dispose()
        }
      }
      
      // Dispose all waypoint markers
      if (waypointMarkersRef.current) {
        while (waypointMarkersRef.current.children.length > 0) {
          const child = waypointMarkersRef.current.children[0]
          disposeObject3D(child)
          waypointMarkersRef.current.remove(child)
        }
      }
    }
  }, [coordinateSystem])
  
  // Update path visualization
  useEffect(() => {
    if (!sceneRef.current || !waypointMarkersRef.current) return
    
    const scene = sceneRef.current
    const waypointGroup = waypointMarkersRef.current
    
    // Remove old path line
    if (pathLineRef.current) {
      scene.remove(pathLineRef.current)
      pathLineRef.current.geometry.dispose()
      if (Array.isArray(pathLineRef.current.material)) {
        pathLineRef.current.material.forEach(m => m.dispose())
      } else {
        pathLineRef.current.material.dispose()
      }
    }
    
    // Clear old waypoint markers
    while (waypointGroup.children.length > 0) {
      const child = waypointGroup.children[0]
      disposeObject3D(child)
      waypointGroup.remove(child)
    }
    
    // Create new path line
    const pathGeometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    
    for (const point of pathPoints) {
      const x = coordinateSystem === 'left-handed' ? -point.x : point.x
      vertices.push(x, point.y, point.z)
    }
    
    pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    
    const pathMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff,
      linewidth: 2
    })
    
    const pathLine = new THREE.Line(pathGeometry, pathMaterial)
    scene.add(pathLine)
    pathLineRef.current = pathLine
    
    // Create waypoint markers
    cameraPath.waypoints.forEach((waypoint, index) => {
      const wpGeometry = new THREE.SphereGeometry(0.15, 12, 12)
      const wpMaterial = new THREE.MeshBasicMaterial({
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
      })
      const wpMesh = new THREE.Mesh(wpGeometry, wpMaterial)
      
      const x = coordinateSystem === 'left-handed' ? -waypoint.position.x : waypoint.position.x
      wpMesh.position.set(x, waypoint.position.y, waypoint.position.z)
      waypointGroup.add(wpMesh)
    })
    
  }, [pathPoints, cameraPath.waypoints, coordinateSystem])
  
  // Update animation frame
  useEffect(() => {
    if (!sceneRef.current || !viewCameraRef.current || !rendererRef.current || !cameraModelRef.current) {
      return
    }
    
    const scene = sceneRef.current
    const viewCamera = viewCameraRef.current
    const renderer = rendererRef.current
    const cameraModel = cameraModelRef.current
    
    // Update camera model position
    const pos = currentPosition.position
    const x = coordinateSystem === 'left-handed' ? -pos.x : pos.x
    cameraModel.position.set(x, pos.y, pos.z)
    
    // Apply rotation from interpolation result (convert degrees to radians)
    // The interpolation result already handles easing and proper interpolation
    const degToRad = Math.PI / 180
    const rotation = currentPosition.rotation ?? { rx: 0, ry: 0, rz: 0 }
    // Apply in order: Y (yaw), X (pitch), Z (roll)
    cameraModel.rotation.set(
      rotation.rx * degToRad,
      rotation.ry * degToRad,
      rotation.rz * degToRad,
      'YXZ'
    )
    
    // Flip for left-handed coordinate system
    if (coordinateSystem === 'left-handed') {
      cameraModel.rotation.y = -cameraModel.rotation.y
    }
    
    // Update color based on current segment
    const segmentColor = SEGMENT_COLORS[currentPosition.currentSegmentIndex % SEGMENT_COLORS.length]
    updateCameraModelColor(cameraModel, segmentColor)
    
    // Render
    renderer.render(scene, viewCamera)
    
  }, [currentPosition, coordinateSystem, cameraPath.waypoints])
  
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div 
        ref={mountRef}
        className="relative w-full h-full rounded border border-border overflow-hidden bg-card"
      >
        {/* Compact overlay info panel */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between text-[9px] font-mono text-white/90">
          <span>t={globalTime.toFixed(3)}</span>
          <span>{(currentPosition.segmentLocalTime * 100).toFixed(0)}%</span>
          <span>pos=({currentPosition.position.x.toFixed(2)}, {currentPosition.position.y.toFixed(2)}, {currentPosition.position.z.toFixed(2)})</span>
          {cameraPath.waypoints.length > 0 && (
            <span className="text-white/60">{cameraPath.waypoints.length} pts</span>
          )}
        </div>
      </div>
    </div>
  )
})
