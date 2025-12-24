/**
 * Humanoid Model for Three.js Preview
 * 
 * Creates a simple humanoid figure using basic geometries.
 * Positioned so that feet are at y=0 (ground level) and head is at the specified height.
 * 
 * Performance Optimization: Uses shared geometry instances to reduce GPU memory usage.
 * Each geometry is created once and reused across all humanoid instances.
 */

import * as THREE from 'three'

/** Color scheme for the humanoid model */
const HUMANOID_COLORS = {
  head: 0xffcc99,    // Skin tone
  body: 0x3366cc,    // Blue shirt
  arms: 0x3366cc,    // Blue sleeves
  hands: 0xffcc99,   // Skin tone
  legs: 0x333333,    // Dark pants
  feet: 0x222222     // Dark shoes
}

/**
 * Shared geometry cache to reduce GPU memory consumption.
 * These geometries are reused across all humanoid instances.
 */
class GeometryCache {
  private static headGeometry: THREE.SphereGeometry | null = null
  private static bodyGeometry: THREE.BoxGeometry | null = null
  private static armGeometry: THREE.CylinderGeometry | null = null
  private static handGeometry: THREE.SphereGeometry | null = null
  private static legGeometry: THREE.CylinderGeometry | null = null
  private static footGeometry: THREE.BoxGeometry | null = null
  
  static getHeadGeometry(radius: number): THREE.SphereGeometry {
    if (!this.headGeometry) {
      this.headGeometry = new THREE.SphereGeometry(radius, 16, 12)
    }
    return this.headGeometry
  }
  
  static getBodyGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
    if (!this.bodyGeometry) {
      this.bodyGeometry = new THREE.BoxGeometry(width, height, depth)
    }
    return this.bodyGeometry
  }
  
  static getArmGeometry(radius: number, length: number): THREE.CylinderGeometry {
    if (!this.armGeometry) {
      this.armGeometry = new THREE.CylinderGeometry(radius, radius, length, 8)
    }
    return this.armGeometry
  }
  
  static getHandGeometry(radius: number): THREE.SphereGeometry {
    if (!this.handGeometry) {
      this.handGeometry = new THREE.SphereGeometry(radius, 8, 6)
    }
    return this.handGeometry
  }
  
  static getLegGeometry(radius: number, length: number): THREE.CylinderGeometry {
    if (!this.legGeometry) {
      this.legGeometry = new THREE.CylinderGeometry(radius, radius, length, 8)
    }
    return this.legGeometry
  }
  
  static getFootGeometry(width: number, height: number, length: number): THREE.BoxGeometry {
    if (!this.footGeometry) {
      this.footGeometry = new THREE.BoxGeometry(width, height, length)
    }
    return this.footGeometry
  }
  
  /**
   * Dispose all cached geometries. Only call when shutting down the application.
   */
  static disposeAll(): void {
    this.headGeometry?.dispose()
    this.bodyGeometry?.dispose()
    this.armGeometry?.dispose()
    this.handGeometry?.dispose()
    this.legGeometry?.dispose()
    this.footGeometry?.dispose()
    
    this.headGeometry = null
    this.bodyGeometry = null
    this.armGeometry = null
    this.handGeometry = null
    this.legGeometry = null
    this.footGeometry = null
  }
}

/**
 * Create a simple humanoid figure with feet at ground level (y=0)
 * 
 * @param headHeight Target Y position for the head center (default: 1.5)
 * @returns THREE.Group containing the humanoid model with userData for disposal
 */
export function createHumanoidModel(headHeight: number = 1.5): THREE.Group {
  const humanoid = new THREE.Group()
  
  // Base proportions (will be scaled to match headHeight)
  const baseHeadRadius = 0.12
  const baseBodyWidth = 0.35
  const baseBodyHeight = 0.5
  const baseBodyDepth = 0.2
  const baseArmLength = 0.45
  const baseArmRadius = 0.05
  const baseLegLength = 0.5
  const baseLegRadius = 0.07
  const baseFootLength = 0.15
  const baseFootHeight = 0.08
  const baseNeckGap = 0.05
  
  // Calculate base height (from feet bottom to head center)
  // feet bottom (0) → feet top (footHeight) → leg top (footHeight + legLength) 
  // → body top (footHeight + legLength + bodyHeight) → head center (+ neckGap + headRadius)
  const baseHeadY = baseFootHeight + baseLegLength + baseBodyHeight + baseNeckGap + baseHeadRadius
  
  // Scale factor to match requested head height while keeping feet at y=0
  const scale = headHeight / baseHeadY
  
  // Scaled proportions
  const headRadius = baseHeadRadius * scale
  const bodyWidth = baseBodyWidth * scale
  const bodyHeight = baseBodyHeight * scale
  const bodyDepth = baseBodyDepth * scale
  const armLength = baseArmLength * scale
  const armRadius = baseArmRadius * scale
  const legLength = baseLegLength * scale
  const legRadius = baseLegRadius * scale
  const footLength = baseFootLength * scale
  const footHeight = baseFootHeight * scale
  const neckGap = baseNeckGap * scale
  
  // Calculate Y positions (feet at ground level y=0)
  const feetBottomY = 0
  const feetY = feetBottomY + footHeight / 2
  const legBottomY = feetBottomY + footHeight
  const legCenterY = legBottomY + legLength / 2
  const legTopY = legBottomY + legLength
  const bodyBottomY = legTopY
  const bodyCenterY = bodyBottomY + bodyHeight / 2
  const bodyTopY = bodyBottomY + bodyHeight
  const headY = bodyTopY + neckGap + headRadius  // This should equal headHeight
  
  // Store materials for disposal (geometries are shared and should NOT be disposed per-instance)
  const materials: THREE.Material[] = []
  
  // Head (sphere) - using shared geometry
  const headGeometry = GeometryCache.getHeadGeometry(headRadius)
  const headMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.head, 
    shininess: 30 
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.set(0, headY, 0)
  // mark head mesh so other systems (camera preview) can find it
  head.name = 'head'
  humanoid.add(head)
  materials.push(headMaterial)
  
  // Body (box) - using shared geometry
  const bodyGeometry = GeometryCache.getBodyGeometry(bodyWidth, bodyHeight, bodyDepth)
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.body, 
    shininess: 30 
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.set(0, bodyCenterY, 0)
  humanoid.add(body)
  materials.push(bodyMaterial)
  
  // Arms (cylinders) - using shared geometry
  const armGeometry = GeometryCache.getArmGeometry(armRadius, armLength)
  const armMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.arms, 
    shininess: 30 
  })
  
  // Left arm
  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-bodyWidth / 2 - armRadius, bodyTopY - armLength / 2, 0)
  humanoid.add(leftArm)
  
  // Right arm
  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(bodyWidth / 2 + armRadius, bodyTopY - armLength / 2, 0)
  humanoid.add(rightArm)
  
  materials.push(armMaterial)
  
  // Hands (small spheres) - using shared geometry
  const handGeometry = GeometryCache.getHandGeometry(armRadius * 1.2)
  const handMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.hands, 
    shininess: 30 
  })
  
  const leftHand = new THREE.Mesh(handGeometry, handMaterial)
  leftHand.position.set(-bodyWidth / 2 - armRadius, bodyTopY - armLength, 0)
  humanoid.add(leftHand)
  
  const rightHand = new THREE.Mesh(handGeometry, handMaterial)
  rightHand.position.set(bodyWidth / 2 + armRadius, bodyTopY - armLength, 0)
  humanoid.add(rightHand)
  
  materials.push(handMaterial)
  
  // Legs (cylinders) - using shared geometry
  const legGeometry = GeometryCache.getLegGeometry(legRadius, legLength)
  const legMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.legs, 
    shininess: 20 
  })
  
  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-bodyWidth / 4, legCenterY, 0)
  humanoid.add(leftLeg)
  
  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(bodyWidth / 4, legCenterY, 0)
  humanoid.add(rightLeg)
  
  materials.push(legMaterial)
  
  // Feet (boxes) - using shared geometry
  const footGeometry = GeometryCache.getFootGeometry(legRadius * 2, footHeight, footLength)
  const footMaterial = new THREE.MeshPhongMaterial({ 
    color: HUMANOID_COLORS.feet, 
    shininess: 20 
  })
  
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial)
  leftFoot.position.set(-bodyWidth / 4, feetY, footLength / 4)
  humanoid.add(leftFoot)
  
  const rightFoot = new THREE.Mesh(footGeometry, footMaterial)
  rightFoot.position.set(bodyWidth / 4, feetY, footLength / 4)
  humanoid.add(rightFoot)
  
  materials.push(footMaterial)
  
  // Store references for cleanup and expose head height for external use
  humanoid.userData = {
    materials,
    // Expose calculated head center Y so camera preview can fallback if mesh isn't found
    headHeight: headY
  }
  
  return humanoid
}

/**
 * Dispose of all materials in a humanoid model
 * Note: Geometries are shared and NOT disposed per-instance
 * @param humanoid The humanoid group to dispose
 */
export function disposeHumanoidModel(humanoid: THREE.Group): void {
  const userData = humanoid.userData
  if (userData) {
    // Only dispose materials (not geometries - they are shared)
    userData.materials?.forEach((m: THREE.Material) => m.dispose())
  }
}

/**
 * Dispose all shared geometry cache. Only call when shutting down the application.
 */
export function disposeGeometryCache(): void {
  GeometryCache.disposeAll()
}
