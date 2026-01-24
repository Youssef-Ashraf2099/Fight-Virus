import * as THREE from "three";

import BaseWeapon from "../BaseWeapon.js";

class ThrowableKnife {
  constructor(scene, position, direction, speed, damage, color, owner) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.damage = damage;
    this.color = color;
    this.owner = owner;
    this.lifetime = 2.5; // Max flight time before returning
    this.maxLifetime = this.lifetime;
    this.collisionRadius = 0.4;
    this.destroyed = false;
    this.hasHit = false;
    this.hitEnemies = new Set(); // Track hit enemies to prevent double-hitting
    this.particleSystem = null;

    // Rotation for spinning effect
    this.rotation = new THREE.Euler(0, 0, 0);
    this.rotationSpeed = 15; // Radians per second

    this.createMesh();
  }

  createMesh() {
    const group = new THREE.Group();

    // 1. Core Handle (Tech Grip)
    const handleGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8);
    const handleMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.7,
        metalness: 0.5 
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.4;
    group.add(handle);

    // 2. Crossguard (Energy Emitter Halo) - Fixed to simple torus for now
    const guardGeo = new THREE.TorusGeometry(0.12, 0.04, 8, 16);
    const guardMat = new THREE.MeshPhongMaterial({
        color: 0x444444,
        emissive: this.color,
        emissiveIntensity: 0.5
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.z = -0.15;
    group.add(guard);

    // 3. Main Blade (Split Design)
    const bladeGeo = new THREE.BoxGeometry(0.1, 0.4, 0.04);
    const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.9,
        roughness: 0.2
    });
    
    // Top Half
    const bladeTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.2, 4), bladeMat);
    bladeTop.rotation.x = Math.PI / 2;
    bladeTop.position.z = 0.5;
    bladeTop.position.y = 0.06;
    group.add(bladeTop);
    
    // Bottom Half
    const bladeBot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.2, 4), bladeMat);
    bladeBot.rotation.x = Math.PI / 2;
    bladeBot.position.z = 0.5;
    bladeBot.position.y = -0.06;
    group.add(bladeBot);

    // 4. Energy Core (Glowing Center Stream)
    const coreGeo = new THREE.BoxGeometry(0.02, 0.02, 1.0);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: this.color,
        transparent: true,
        opacity: 0.9
    });
    const energyCore = new THREE.Mesh(coreGeo, coreMat);
    energyCore.position.z = 0.4;
    group.add(energyCore);
    
    // 5. Rotating Bits (Floating Tech)
    this.floaters = [];
    const bitGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    for(let i=0; i<4; i++) {
        const bit = new THREE.Mesh(bitGeo, coreMat);
        bit.position.set(0, 0.2, -0.4 + i*0.1);
        bit.userData = { offset: i, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize() };
        group.add(bit);
        this.floaters.push(bit);
    }

    // Energy trail visuals handled by particle system mostly, but we add a local glow plane
    // Energy trail glow
    const glowGeometry = new THREE.PlaneGeometry(1.5, 0.6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = 0.1;
    glow.rotation.x = Math.PI / 2; // Flat with blade
    group.add(glow);
    this.glowMesh = glow;

    this.mesh = group;
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Add point light for neon glow effect
    this.light = new THREE.PointLight(this.color, 2, 6);
    this.mesh.add(this.light);
  }

  update(deltaTime, environment) {
    if (this.destroyed) {
      return false;
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Update rotation for spinning effect
    this.rotation.z += this.rotationSpeed * deltaTime;
    this.rotation.y += this.rotationSpeed * 0.5 * deltaTime;

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);

      // Pulsing glow effect
      if (this.glowMesh) {
        const pulse = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
        this.glowMesh.material.opacity = pulse;
      }
      
      // Animate Float Bits
      if (this.floaters) {
          const t = Date.now() * 0.005;
          this.floaters.forEach(bit => {
              const r = 0.15;
              bit.position.x = Math.cos(t + bit.userData.offset) * r;
              bit.position.y = Math.sin(t + bit.userData.offset) * r;
              bit.rotation.x += 0.1;
              bit.rotation.y += 0.1;
          });
      }
    }

    // Check environment collision
    if (
      environment &&
      typeof environment.isProjectilePathObstructed === "function" &&
      environment.isProjectilePathObstructed(
        this.position,
        this.position
          .clone()
          .add(this.velocity.clone().multiplyScalar(deltaTime)),
        this.collisionRadius,
        0.3
      )
    ) {
      this._handleImpact(this.position);
      return false;
    }

    this.lifetime -= deltaTime;

    // Fade out near end of lifetime
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (this.mesh && lifetimeRatio < 0.3) {
      this.mesh.traverse((child) => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = Math.max(lifetimeRatio / 0.3, 0);
        }
      });

      if (this.light) {
        this.light.intensity = Math.max(lifetimeRatio / 0.3, 0) * 2;
      }
    }

    return !this.isExpired();
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.destroyed || this.lifetime <= 0;
  }

  markEnemyHit(enemyId) {
    this.hitEnemies.add(enemyId);
  }

  hasHitEnemy(enemyId) {
    return this.hitEnemies.has(enemyId);
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    if (this.light && this.mesh) {
      this.mesh.remove(this.light);
    }

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.mesh = null;
    }

    this.light = null;
  }

  _handleImpact(position) {
    if (this.particleSystem && position) {
      this.particleSystem.createImpact(position.clone(), this.color, 15);
    }
    this.destroy();
  }
}

class NeonKnife extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "NEON KNIFE";
    this.damage = 35; // Moderate damage
    this.fireRate = 0.5; // Half second between throws
    this.projectileSpeed = 25; // Fast throw
    this.projectileLifetime = 2.5;
    this.projectileColor = 0xff00ff; // Magenta/pink neon
    this.viewModelId = "neonKnife";
    this.hudColor = "#ff00ff";
    this.ammoType = "limited";
    this.currentAmmo = 3; // 3 knives
    this.maxAmmo = 3;
    this.reloadTime = 1.8;

    this.fireSound = this.createSound("../Assets/sounds/cannon.mp3", 0.5);
    this.reloadSound = this.createSound("../Assets/sounds/reload 3.mp3", 0.6);

    // Throwable-specific properties
    this.activeKnives = [];
  }

  fire(origin, target, camera, cameraDirection) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    let direction;

    // FPS mode: use camera direction
    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();

      // Slight upward arc for throwing
      direction.y += 0.05;
      direction.normalize();
    } else {
      // Legacy top-down mode
      const mouse = new THREE.Vector2(
        (target.x / window.innerWidth) * 2 - 1,
        -(target.y / window.innerHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const planeZ = origin.z;
      const planeNormal = new THREE.Vector3(0, 1, 0);
      const planePoint = new THREE.Vector3(0, 0, planeZ);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        planeNormal,
        planePoint
      );

      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      direction = new THREE.Vector3()
        .subVectors(intersectPoint, origin)
        .normalize();
    }

    // Create throwing effect particles
    this.particleSystem.createMuzzleFlash(origin, this.projectileColor, 8);

    // Create the throwable knife
    const knife = new ThrowableKnife(
      this.scene,
      origin,
      direction,
      this.projectileSpeed,
      this.damage,
      this.projectileColor,
      this
    );

    knife.particleSystem = this.particleSystem;
    this.activeKnives.push(knife);

    return knife;
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Update all active knives
    for (let i = this.activeKnives.length - 1; i >= 0; i--) {
      const knife = this.activeKnives[i];
      const stillAlive = knife.update(deltaTime, this.environment);

      if (!stillAlive) {
        this.activeKnives.splice(i, 1);
      }
    }
  }

  getProjectiles() {
    return this.activeKnives;
  }

  setEnvironment(environment) {
    this.environment = environment;
  }
}

export default NeonKnife;
