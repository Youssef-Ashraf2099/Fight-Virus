import * as THREE from "three";
import BaseEnemy from "../BaseEnemy.js";

/**
 * ShieldVirus - Defensive enemy with energy shield
 * - Regenerating energy shield
 * - Shield blocks damage
 * - Shield bash attack when close
 * - Slow but tanky
 */
export default class ShieldVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Shield stats - Tanky, slow, defensive
    this.maxHealth = 200 * difficulty;
    this.health = this.maxHealth;
    this.speed = 4;
    this.damage = 20 * difficulty;
    this.contactDamage = 10 * difficulty;
    this.collisionRadius = 1.5;
    this.scoreValue = 250;
    this.color = 0x9900ff;

    // Shield mechanics
    this.maxShield = 150 * difficulty;
    this.shield = this.maxShield;
    this.shieldRegenRate = 20; // HP per second
    this.shieldRegenDelay = 3; // Seconds after damage before regen starts
    this.shieldRegenTimer = 0;
    this.shieldActive = true;

    // Attack configuration
    this.attackType = "melee";
    this.attackRange = 3;
    this.bashCooldown = 0;
    this.isBashing = false;

    this.createMesh();
  }

  createMesh() {
    // Central core
    const coreGeometry = new THREE.OctahedronGeometry(1, 0);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x6600cc,
      emissive: 0x6600cc,
      emissiveIntensity: 0.8,
      shininess: 60,
    });
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Inner rotating crystal
    const crystalGeometry = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.7,
    });
    this.crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    this.group.add(this.crystal);

    // Shield dome
    const shieldGeometry = new THREE.IcosahedronGeometry(2.2, 1);
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.group.add(this.shieldMesh);

    // Shield hexagon pattern overlay
    const hexPatternGeometry = new THREE.IcosahedronGeometry(2.25, 1);
    const hexPatternMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.hexPattern = new THREE.Mesh(hexPatternGeometry, hexPatternMaterial);
    this.group.add(this.hexPattern);

    // Floating shield projectors (4 around the body)
    this.projectors = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const projectorGroup = new THREE.Group();

      const projectorGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 6);
      const projectorMaterial = new THREE.MeshPhongMaterial({
        color: 0x8800ff,
        emissive: 0x8800ff,
        emissiveIntensity: 0.9,
      });
      const projector = new THREE.Mesh(projectorGeometry, projectorMaterial);
      projectorGroup.add(projector);

      // Energy beam to shield
      const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.5,
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.y = 0.75;
      projectorGroup.add(beam);

      projectorGroup.position.set(
        Math.cos(angle) * 1.8,
        0,
        Math.sin(angle) * 1.8
      );
      projectorGroup.rotation.y = angle;

      this.projectors.push({
        group: projectorGroup,
        projector: projector,
        beam: beam,
        angle: angle,
      });
      this.group.add(projectorGroup);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 2.5, 15);
    this.group.add(this.light);

    // Impact flash mesh (shows when shield is hit)
    const impactGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    const impactMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.impactFlash = new THREE.Mesh(impactGeometry, impactMaterial);
    this.group.add(this.impactFlash);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // OPTIMIZATION: Initialize frame skip counter on first run
    if (this._projectorFrameSkip === undefined) {
      this._projectorFrameSkip = 0;
    }

    // Rotate core
    this.mesh.rotation.x += deltaTime * 1;
    this.mesh.rotation.y += deltaTime * 1.5;

    // Counter-rotate crystal
    this.crystal.rotation.x -= deltaTime * 2;
    this.crystal.rotation.y -= deltaTime * 2.5;

    // Rotate shield
    this.shieldMesh.rotation.y += deltaTime * 0.5;
    this.hexPattern.rotation.y -= deltaTime * 0.7;

    // Shield opacity based on strength
    const shieldRatio = this.shield / this.maxShield;
    this.shieldMesh.material.opacity = 0.2 + shieldRatio * 0.3;
    this.shieldMesh.material.emissiveIntensity = 0.3 + shieldRatio * 0.5;

    // Hide shield when depleted
    this.shieldMesh.visible = this.shieldActive && this.shield > 0;
    this.hexPattern.visible = this.shieldActive && this.shield > 0;

    // OPTIMIZATION: Cache orbit calculations outside loop
    const baseOrbitAngle = this.time * 0.8;
    const verticalTime = this.time * 2;
    const pulseTime = this.time * 5;

    // OPTIMIZATION: Update projector orbits every other frame
    this._projectorFrameSkip++;
    if (this._projectorFrameSkip % 2 === 0) {
      // Orbit projectors
      this.projectors.forEach((proj, index) => {
        const orbitAngle = proj.angle + baseOrbitAngle;
        proj.group.position.x = Math.cos(orbitAngle) * 1.8;
        proj.group.position.z = Math.sin(orbitAngle) * 1.8;
        proj.group.position.y = Math.sin(verticalTime + index) * 0.3;
        proj.group.rotation.y = orbitAngle;

        // Pulse projector
        const pulse = 0.8 + Math.sin(pulseTime + index) * 0.2;
        proj.projector.material.emissiveIntensity = pulse;
      });
    }

    // Fade impact flash
    if (this.impactFlash.material.opacity > 0) {
      this.impactFlash.material.opacity *= 0.9;
    }

    // Pulse when bashing
    if (this.isBashing) {
      const bashPulse = 1.2 + Math.sin(this.time * 20) * 0.3;
      this.mesh.scale.setScalar(bashPulse);
    } else {
      this.mesh.scale.setScalar(1);
    }
  }

  update(deltaTime, playerPosition) {
    super.update(deltaTime, playerPosition);

    // Shield regeneration
    if (this.shieldRegenTimer > 0) {
      this.shieldRegenTimer -= deltaTime;
    } else if (this.shield < this.maxShield && this.shieldActive) {
      this.shield = Math.min(
        this.maxShield,
        this.shield + this.shieldRegenRate * deltaTime
      );

      // OPTIMIZATION: Reduce regen effect particle frequency
      if (Math.random() < 0.05 && this.particleSystem) {
        this.particleSystem.createImpact(this.position, this.color, 2);
      }
    }

    // Update bash cooldown
    if (this.bashCooldown > 0) {
      this.bashCooldown -= deltaTime;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Shield bash attack when close
    if (distanceToPlayer < 5 && this.bashCooldown <= 0 && this.shield > 30) {
      this.performShieldBash(playerPosition);
      return;
    }

    // Move toward player
    if (distanceToPlayer > 3) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    }
  }

  performShieldBash(targetPosition) {
    this.isBashing = true;
    this.bashCooldown = 4;

    // Create shockwave
    if (this.particleSystem) {
      this.particleSystem.createShockwave(this.position, this.color, 5);
    }

    // Drain shield for bash
    this.shield = Math.max(0, this.shield - 30);

    setTimeout(() => {
      this.isBashing = false;
    }, 300);
  }

  takeDamage(amount, knockbackDirection = null) {
    // Shield absorbs damage first
    if (this.shield > 0 && this.shieldActive) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;

      // Visual feedback
      this.impactFlash.material.opacity = 0.8;
      this.shieldRegenTimer = this.shieldRegenDelay;

      if (this.particleSystem) {
        this.particleSystem.createImpact(this.position, this.color, 8);
      }

      // Shield break effect
      if (this.shield <= 0) {
        this.shieldActive = false;
        if (this.particleSystem) {
          this.particleSystem.createExplosion(this.position, this.color, 15);
        }

        // Shield comes back after delay
        setTimeout(() => {
          this.shieldActive = true;
          this.shield = this.maxShield * 0.5;
        }, 8000);
      }

      // Only apply remaining damage to health
      if (amount <= 0) {
        return; // Shield absorbed all damage
      }
    }

    // Apply damage to health if shield didn't absorb it all
    super.takeDamage(amount, knockbackDirection);
  }

  getShieldInfo() {
    return {
      current: this.shield,
      max: this.maxShield,
      active: this.shieldActive,
      percentage: (this.shield / this.maxShield) * 100,
    };
  }
}
