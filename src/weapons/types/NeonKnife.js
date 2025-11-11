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

    // Knife blade (elongated diamond shape)
    const bladeGeometry = new THREE.ConeGeometry(0.15, 1.2, 4);
    const bladeMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });

    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.rotation.x = Math.PI / 2; // Point forward
    blade.position.z = 0.3;
    group.add(blade);

    // Knife handle
    const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const handleMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      metalness: 0.3,
      roughness: 0.6,
    });

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.35;
    group.add(handle);

    // Handle accent rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(0.09, 0.015, 8, 16);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.y = Math.PI / 2;
      ring.position.z = -0.45 + i * 0.15;
      group.add(ring);
    }

    // Energy trail glow
    const glowGeometry = new THREE.PlaneGeometry(0.8, 0.3);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = 0.2;
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
