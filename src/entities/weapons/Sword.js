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
    // Placeholder geometry until GLB is loaded
    // Blade
    const bladeGeo = new THREE.BoxGeometry(0.1, 1.2, 0.05);
    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3);
    
    // Material with Env Map (Tech Art Requirement)
    const envMap = new THREE.CubeTextureLoader()
      .setPath('../Assets/textures/env/') // Creating placeholder path
      .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'], (tex) => {
         // Fallback or success logic
      }, undefined, (err) => {
          // console.warn("Env map failed to load, using default");
      });
      
    // Normal Map would be loaded here
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xcdcdcd,
      roughness: 0.1,
      metalness: 0.9,
      envMap: envMap,
      envMapIntensity: 1.0,
      flatShading: false
    });

    this.mesh = new THREE.Group();
    
    const blade = new THREE.Mesh(bladeGeo, material);
    blade.position.y = 0.6;
    blade.castShadow = true; // Weapon layer might not need shadows?
    
    const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
    handle.position.y = -0.15;
    
    this.mesh.add(blade);
    this.mesh.add(handle);
    
    // Tip and Base markers for trail
    this.tipMarker = new THREE.Object3D();
    this.tipMarker.position.set(0, 1.2, 0);
    blade.add(this.tipMarker);
    
    this.baseMarker = new THREE.Object3D();
    this.baseMarker.position.set(0, 0, 0);
    blade.add(this.baseMarker);

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
