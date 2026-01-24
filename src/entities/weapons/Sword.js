import * as THREE from "three";
import BaseWeapon from "../../weapons/BaseWeapon.js";
import BladeTrail from "../../effects/BladeTrail.js";
import WeaponHelper, { WEAPON_STATES } from "../../animations/WeaponHelper.js";
import { vector3Pool } from "../../utils/ObjectPool.js";

export default class Sword extends BaseWeapon {
  constructor(scene, particleSystem, weaponCamera) {
    super(scene, particleSystem);

    this.name = "CYBER KATANA";
    this.weaponCamera = weaponCamera; // Separate camera for weapon layer
    
    // Stats
    this.damage = 80;
    this.fireRate = 0.6;
    this.range = 4.0;
    
    // Visuals
    this.bladeColor = 0x00ffff;
    this.trail = new BladeTrail(scene, this.bladeColor, 0.4, 0.2); // Trail adds to main scene? Or weapon scene? 
                                                                   // Usually main scene so it clips correctly into world
    
    // Animation Helper
    this.animator = null; // Initialized when model is loaded
    
    this.isSwinging = false;
    this.swingDuration = 0.3;
    this.swingProgress = 0;
    
    // Load Model (placeholder box for now if no asset)
    this._initModel();
  }

  _initModel() {
    // High-Fidelity Cyber Katana Model
    this.mesh = new THREE.Group();
    
    // 1. Blade Spine (The solid metal back)
    const spineGeo = new THREE.BoxGeometry(0.04, 1.4, 0.04);
    const spineMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.9
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.y = 0.7; // Center relative to handle
    spine.position.z = -0.01; // Slightly back
    this.mesh.add(spine);
    
    // 2. Energy Edge (The glowing laser part)
    // Using a tapered plane for the sharp edge look
    // Or actually a thin box for volumetric feel
    const edgeGeo = new THREE.BoxGeometry(0.01, 1.4, 0.06);
    const edgeMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9,
    });
    this.energyEdge = new THREE.Mesh(edgeGeo, edgeMat);
    this.energyEdge.position.y = 0.7;
    this.energyEdge.position.z = 0.03; // Forward edge
    this.mesh.add(this.energyEdge);
    
    // Add inner white core for "laser" look
    const edgeCoreGeo = new THREE.BoxGeometry(0.005, 1.38, 0.04);
    const edgeCore = new THREE.Mesh(edgeCoreGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    edgeCore.position.y = 0.7;
    edgeCore.position.z = 0.03;
    this.mesh.add(edgeCore);
    
    // 3. Tsuba (Hand Guard) - Tech Ring
    const guardGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 8);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.0;
    this.mesh.add(guard);
    
    // 4. Hilt (Handle)
    const hiltGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.35, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -0.18;
    this.mesh.add(hilt);
    
    // Tech bits on handle
    const pommelGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.05, 6);
    const pommel = new THREE.Mesh(pommelGeo, guardMat);
    pommel.position.y = -0.37;
    this.mesh.add(pommel);
    
    // Tip and Base markers for trail (Adjusted positions)
    this.tipMarker = new THREE.Object3D();
    this.tipMarker.position.set(0, 1.4, 0.03); // Tip of energy edge
    this.mesh.add(this.tipMarker);
    
    this.baseMarker = new THREE.Object3D();
    this.baseMarker.position.set(0, 0.1, 0.03); // Base of energy edge
    this.mesh.add(this.baseMarker);

    // Initial pose (In view model space)
    this.mesh.position.set(0.3, -0.4, -0.5);
    this.mesh.rotation.set(0.2, -0.2, 0);

    // Init Animator
    this.animator = new WeaponHelper(this.mesh);
    this.animator.basePosition.copy(this.mesh.position);
    this.animator.baseRotation.copy(this.mesh.rotation);
  }

  // Override update to handle trail and animation
  update(deltaTime) {
    super.update(deltaTime);
    
    if (this.animator) {
      this.animator.update(deltaTime);
    }

    if (this.isSwinging) {
        this.swingProgress += deltaTime;
        if (this.swingProgress > this.swingDuration) {
            this.isSwinging = false;
            this.animator.setState(WEAPON_STATES.IDLE);
        }
    }

    // Animate Energy Pulse
    if (this.energyEdge) {
        // Flickering energy effect
        const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2 + (Math.random() * 0.1);
        this.energyEdge.material.opacity = pulse;
    }

    // Update Trail
    if (this.tipMarker && this.baseMarker) {
        // Need world positions for the trail which is in the main scene
        // If weapon is in weapon scene, we need to project/unproject or just use world matrices if camera matches
        // Assuming weaponCamera aligns with main camera but excludes non-weapon objects.
        
        const tipWorld = vector3Pool.acquire();
        const baseWorld = vector3Pool.acquire();
        
        this.tipMarker.getWorldPosition(tipWorld);
        this.baseMarker.getWorldPosition(baseWorld);
        
        // Correct for weapon camera space if needed? 
        // If the trail is in the main scene, and the weapon is 'fake' local, coordinates match.
        
        this.trail.update(deltaTime, tipWorld, baseWorld, this.isSwinging);
        
        vector3Pool.release(tipWorld);
        vector3Pool.release(baseWorld);
    }
  }

  fire(origin, target, camera, cameraDirection, enemyManager) {
    if (!this.canFire()) return null;
    
    super.fire(origin, target, camera);
    
    this.isSwinging = true;
    this.swingProgress = 0;
    this.animator.setState(WEAPON_STATES.FIRE);
    
    // Melee Hit Logic
    this.performSlash(origin, cameraDirection, enemyManager);

    return null; // No projectile
  }

  performSlash(origin, direction, enemyManager) {
    if (!enemyManager || !enemyManager.getEnemies) return;
    
    const enemies = enemyManager.getEnemies();
    const hitRadius = this.range;
    const arc = Math.PI / 2.5;
    
    // Use pooled vector for calculations
    const toEnemy = vector3Pool.acquire();
    
    enemies.forEach(enemy => {
        const ePos = enemy.getPosition();
        toEnemy.subVectors(ePos, origin);
        const dist = toEnemy.length();
        
        if (dist < hitRadius) {
            const angle = direction.angleTo(toEnemy);
            if (angle < arc / 2) {
                // HIT
                if (enemy.takeDamage) {
                    enemy.takeDamage(this.damage, direction.clone().multiplyScalar(5));
                }
                
                // VFX
                this.particleSystem.createImpact(ePos, this.bladeColor, 5);
            }
        }
    });
    
    vector3Pool.release(toEnemy);
  }
  
  getWeaponMesh() {
      return this.mesh;
  }
}
