import * as THREE from "three";
import BaseEnemy from "../enemies/BaseEnemy.js";

export default class BaseBoss extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.isBoss = true;
    this.aggroRange = 100;
    this.isAggressive = true;

    // Boss spawn animation properties
    this.spawnAnimationDuration = 3; // Seconds for epic entrance
    this.spawnTime = 0;
    this.fullySpawned = false;
    this.spawnPhase = 0; // 0: portal, 1: emerging, 2: roar, 3: complete

    // Boss special properties
    this.bossName = "UNKNOWN BOSS";
    this.bossTitle = "The Corruption";
    this.phases = [];
    this.currentPhaseIndex = 0;
    this.enrageThreshold = 0.3;
    this.isEnraged = false;

    // Visual effects
    this.spawnPortal = null;
    this.spawnRings = [];
    this.warningBeacon = null;

    // Arena effects
    this.arenaRadius = 50;
    this.arenaEffect = null;

    this.spawnImmunityDuration = 1.4;
    this.spawnImmunityTimer = 0;
  }

  /**
   * Creates the dramatic spawn portal effect at map center
   * Override this for custom portal styles
   */
  createSpawnPortal() {
    // Portal base
    const portalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
    const portalMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor || 0xff0000,
      emissive: this.secondaryColor || 0xff0000,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.spawnPortal = new THREE.Mesh(portalGeometry, portalMaterial);
    this.spawnPortal.rotation.x = Math.PI / 2;
    this.spawnPortal.position.copy(this.position);
    this.scene.add(this.spawnPortal);

    // Energy rings
    for (let i = 0; i < 5; i++) {
      const ringGeometry = new THREE.TorusGeometry(8 + i * 3, 0.8, 12, 64);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.color || 0xff0000,
        emissive: this.color || 0xff0000,
        emissiveIntensity: 1.5 - i * 0.2,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(this.position);
      ring.userData = { baseY: this.position.y, offset: i };
      this.spawnRings.push(ring);
      this.scene.add(ring);
    }

    // Warning beacon
    const beaconGeometry = new THREE.CylinderGeometry(0.5, 25, 50, 32, 1, true);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.warningBeacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    this.warningBeacon.position.copy(this.position);
    this.warningBeacon.position.y += 25;
    this.scene.add(this.warningBeacon);

    // Spawn light
    this.spawnLight = new THREE.PointLight(
      this.secondaryColor || 0xff0000,
      10,
      100
    );
    this.spawnLight.position.copy(this.position);
    this.scene.add(this.spawnLight);
  }

  /**
   * Animates the boss spawn sequence
   */
  updateSpawnAnimation(deltaTime) {
    if (this.fullySpawned) return;

    this.spawnTime += deltaTime;
    const progress = Math.min(this.spawnTime / this.spawnAnimationDuration, 1);

    // Phase 0: Portal opening (0-33%)
    if (progress < 0.33) {
      const phaseProgress = progress / 0.33;
      this.spawnPhase = 0;

      if (this.spawnPortal) {
        this.spawnPortal.rotation.z += deltaTime * 3;
        this.spawnPortal.scale.setScalar(phaseProgress);
      }

      this.spawnRings.forEach((ring, i) => {
        ring.rotation.z -= deltaTime * (2 + i * 0.5);
        ring.position.y =
          ring.userData.baseY + Math.sin(this.spawnTime * 3 + i) * 3;
        ring.scale.setScalar(phaseProgress);
      });

      if (this.warningBeacon) {
        this.warningBeacon.material.opacity =
          0.3 * Math.sin(this.spawnTime * 8);
      }

      if (this.spawnLight) {
        this.spawnLight.intensity =
          10 * phaseProgress * (1 + Math.sin(this.spawnTime * 10) * 0.3);
      }

      // Boss is hidden during portal phase
      this.group.visible = false;
    }
    // Phase 1: Boss emerging (33-66%)
    else if (progress < 0.66) {
      const phaseProgress = (progress - 0.33) / 0.33;
      this.spawnPhase = 1;

      // Boss becomes visible and scales up
      this.group.visible = true;
      const scale = phaseProgress * phaseProgress; // Ease out
      this.group.scale.setScalar(scale);

      // Portal starts shrinking
      if (this.spawnPortal) {
        this.spawnPortal.rotation.z += deltaTime * 5;
        this.spawnPortal.scale.setScalar(1 - phaseProgress * 0.5);
        this.spawnPortal.material.opacity = 0.8 * (1 - phaseProgress);
      }

      this.spawnRings.forEach((ring, i) => {
        ring.rotation.z -= deltaTime * (3 + i);
        ring.position.y = ring.userData.baseY + (1 - phaseProgress) * 10;
        ring.material.opacity = 0.7 * (1 - phaseProgress);
      });

      if (this.spawnLight) {
        this.spawnLight.intensity =
          15 * (1 + Math.sin(this.spawnTime * 12) * 0.5);
      }

      // Particle burst at emergence
      if (phaseProgress > 0.5 && phaseProgress < 0.55 && this.particleSystem) {
        this.particleSystem.createExplosion(
          this.position,
          this.secondaryColor || 0xff0000,
          100
        );
      }
    }
    // Phase 2: Roar/announcement (66-100%)
    else {
      const phaseProgress = (progress - 0.66) / 0.34;
      this.spawnPhase = 2;

      // Boss fully formed
      this.group.scale.setScalar(1);

      // Dramatic lighting pulse
      if (this.spawnLight) {
        this.spawnLight.intensity =
          20 * (1 - phaseProgress) * (1 + Math.sin(this.spawnTime * 15) * 0.8);
      }

      // Camera shake effect (pulse the boss slightly)
      if (phaseProgress < 0.5) {
        const shake = Math.sin(this.spawnTime * 20) * 0.15;
        this.group.position.y = this.position.y + shake;
      } else {
        this.group.position.y = this.position.y;
      }

      // Cleanup portal effects
      if (phaseProgress > 0.3) {
        this.cleanupSpawnEffects();
      }
    }

    // Mark spawn complete
    if (progress >= 1) {
      this.fullySpawned = true;
      this.spawnImmunityTimer = this.spawnImmunityDuration;
      this.cleanupSpawnEffects();

      // Final burst
      if (this.particleSystem) {
        this.particleSystem.createExplosion(this.position, 0xffffff, 150);
        this.particleSystem.createShockwave(
          this.position,
          20,
          this.secondaryColor || 0xff0000
        );
      }
    }
  }

  /**
   * Removes spawn effect objects
   */
  cleanupSpawnEffects() {
    if (this.spawnPortal) {
      this.scene.remove(this.spawnPortal);
      this.spawnPortal.geometry.dispose();
      this.spawnPortal.material.dispose();
      this.spawnPortal = null;
    }

    this.spawnRings.forEach((ring) => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    this.spawnRings = [];

    if (this.warningBeacon) {
      this.scene.remove(this.warningBeacon);
      this.warningBeacon.geometry.dispose();
      this.warningBeacon.material.dispose();
      this.warningBeacon = null;
    }

    if (this.spawnLight) {
      this.scene.remove(this.spawnLight);
      this.spawnLight = null;
    }
  }

  /**
   * Update override to handle spawn animation
   */
  update(deltaTime, playerPosition) {
    if (!this.alive) return;

    this.time += deltaTime;

    // Handle spawn animation
    if (!this.fullySpawned) {
      this.updateSpawnAnimation(deltaTime);
      return; // Don't update AI during spawn
    }

    if (this._updateStunState(deltaTime)) {
      return;
    }

    // Normal boss update
    this.stateTimer += deltaTime;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (this.spawnImmunityTimer > 0) {
      this.spawnImmunityTimer = Math.max(
        0,
        this.spawnImmunityTimer - deltaTime
      );
    }

    // Phase transitions
    this.checkPhaseTransition();

    // AI behavior
    this.updateBehavior(deltaTime, playerPosition);

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Update mesh position
    this.group.position.copy(this.position);

    // Animation
    this.animate(deltaTime);
  }

  /**
   * Check if boss should transition to next phase
   */
  checkPhaseTransition() {
    const healthRatio = this.health / this.maxHealth;

    // Check enrage
    if (healthRatio < this.enrageThreshold && !this.isEnraged) {
      this.isEnraged = true;
      this.onEnrage();
    }

    // Override for custom phase systems
  }

  /**
   * Called when boss enters enrage phase
   */
  onEnrage() {
    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, 0xffffff, 120);
      this.particleSystem.createShockwave(this.position, 18, 0xff0000);
    }

    // Increase threat
    this.speed *= 1.4;
    this.damage *= 1.2;
  }

  /**
   * Enhanced takeDamage with visual feedback
   */
  takeDamage(amount) {
    if (!this.fullySpawned || this.spawnImmunityTimer > 0) {
      if (this.particleSystem) {
        this.particleSystem.createImpact(this.position, 0xffffff, 10);
      }
      return;
    }

    super.takeDamage(amount);

    // Extra visual feedback for boss
    if (this.pulseLight && this.alive) {
      this.pulseLight.intensity = 12;
    }

    if (this.particleSystem && Math.random() < 0.3) {
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor || 0xff0000,
        20
      );
    }
  }

  /**
   * Override destroy to cleanup boss-specific effects
   */
  destroy() {
    this.cleanupSpawnEffects();

    if (this.arenaEffect) {
      this.scene.remove(this.arenaEffect);
      this.arenaEffect.geometry.dispose();
      this.arenaEffect.material.dispose();
    }

    super.destroy();
  }

  /**
   * Get boss info for UI display
   */
  getBossInfo() {
    return {
      name: this.bossName,
      title: this.bossTitle,
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.currentPhaseIndex + 1,
      totalPhases: this.phases.length || 3,
    };
  }
}
