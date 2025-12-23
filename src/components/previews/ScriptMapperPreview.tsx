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
  const cubeRef = useRef<THREE.Mesh | null>(null)
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
    const width = container.clientWidth
    const height = container.clientHeight
    
    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene
    
    // View camera (observer camera)
    const viewCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    viewCamera.position.set(10, 8, 10)
    viewCamera.lookAt(0, 0, 0)
    viewCameraRef.current = viewCamera
    
    // Preview camera (shows path camera frustum - for debugging)
    const previewCamera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 100)
    previewCameraRef.current = previewCamera
    
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
    
    // Target cube at origin
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    const cubeMaterials = [
      new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 }),
      new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 })
    ]
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials)
    cube.position.set(0, 0, 0)
    scene.add(cube)
    cubeRef.current = cube
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)
    
    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    gridHelper.position.y = -1
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
      
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
        renderer.dispose()
      }
      
      // Dispose geometries and materials
      cubeGeometry.dispose()
      cubeMaterials.forEach(mat => mat.dispose())
      
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
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
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
    
    // Parse rotation from waypoint bookmarkCommand if available
    // Format: q_x_y_z_rx_ry_rz_fov
    let rx = 0, ry = 0, rz = 0
    const currentSegment = currentPosition.currentSegment
    const fromWaypointIdx = cameraPath.waypoints.findIndex(wp => wp.id === currentSegment.fromWaypointId)
    const toWaypointIdx = cameraPath.waypoints.findIndex(wp => wp.id === currentSegment.toWaypointId)
    
    if (fromWaypointIdx >= 0 && toWaypointIdx >= 0) {
      const fromWp = cameraPath.waypoints[fromWaypointIdx]
      const toWp = cameraPath.waypoints[toWaypointIdx]
      
      // Try to extract rotation from bookmark commands
      const extractRotation = (cmd?: string): { rx: number; ry: number; rz: number } | null => {
        if (!cmd) return null
        const qMatch = cmd.match(/q_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)(?:_(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?))?/)
        if (qMatch) {
          return {
            rx: parseFloat(qMatch[4]) || 0,
            ry: parseFloat(qMatch[5]) || 0,
            rz: parseFloat(qMatch[6]) || 0
          }
        }
        return null
      }
      
      const fromRot = extractRotation(fromWp.bookmarkCommand)
      const toRot = extractRotation(toWp.bookmarkCommand)
      
      // Interpolate rotation between waypoints
      const t = currentPosition.segmentLocalTime
      if (fromRot && toRot) {
        rx = fromRot.rx + (toRot.rx - fromRot.rx) * t
        ry = fromRot.ry + (toRot.ry - fromRot.ry) * t
        rz = fromRot.rz + (toRot.rz - fromRot.rz) * t
      } else if (fromRot) {
        rx = fromRot.rx
        ry = fromRot.ry
        rz = fromRot.rz
      } else if (toRot) {
        rx = toRot.rx
        ry = toRot.ry
        rz = toRot.rz
      }
    }
    
    // Apply rotation (convert degrees to radians)
    // Apply in order: Y (yaw), X (pitch), Z (roll)
    const degToRad = Math.PI / 180
    cameraModel.rotation.set(rx * degToRad, ry * degToRad, rz * degToRad, 'YXZ')
    
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
    <div className="flex flex-col items-center gap-2 w-full">
      <div 
        ref={mountRef}
        className="w-full rounded border border-border overflow-hidden bg-card"
        style={{ aspectRatio }}
      />
      
      <div className="w-full bg-secondary rounded px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Time</span>
          <span className="font-mono font-medium">{globalTime.toFixed(3)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono font-medium">
            {(currentPosition.segmentLocalTime * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className="text-muted-foreground">Position</span>
          <span className="font-mono font-medium text-[9px]">
            ({currentPosition.position.x.toFixed(2)}, {currentPosition.position.y.toFixed(2)}, {currentPosition.position.z.toFixed(2)})
          </span>
        </div>
        {cameraPath.waypoints.length > 0 && (
          <div className="flex items-center justify-between text-[10px] px-0.5">
            <span className="text-muted-foreground">Waypoints</span>
            <span className="font-mono font-medium">{cameraPath.waypoints.length}</span>
          </div>
        )}
      </div>
    </div>
  )
})
