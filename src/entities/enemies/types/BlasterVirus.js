import * as THREE from "three";
import BaseEnemy from "../BaseEnemy.js";

/**
 * BlasterVirus - Heavy ranged attacker
 * - Fires energy blasts in bursts
 * - Keeps distance from player
 * - Powerful AoE charged shots
 * - Moderate health, slow movement
 */
export default class BlasterVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Blaster stats - Ranged specialist
    this.maxHealth = 140 * difficulty;
    this.health = this.maxHealth;
    this.speed = 5;
    this.damage = 18 * difficulty;
    this.contactDamage = 6 * difficulty;
    this.collisionRadius = 1.3;
    this.scoreValue = 180;
    this.color = 0xff6600;

    // Attack configuration
    this.attackType = "ranged";
    this.attackRange = 25;
    this.projectileSpeed = 30;
    this.burstCount = 3;
    this.burstDelay = 0.2;
    this.burstTimer = 0;
    this.shotsInBurst = 0;

    // Charged attack
    this.chargeTime = 0;
    this.maxChargeTime = 2;
    this.isCharging = false;
    this.chargedShotCooldown = 0;

    // Kiting behavior (keep distance)
    this.preferredDistance = 15;

    this.createMesh();
  }

  createMesh() {
    // Main body - angular geometric shape
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x442200,
      emissive: this.color,
      emissiveIntensity: 0.4,
      shininess: 30,
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Weapon barrels (dual cannons)
    this.barrels = [];
    [-0.7, 0.7].forEach((xOffset) => {
      const barrelGroup = new THREE.Group();

      // Main barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
      const barrelMaterial = new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: this.color,
        emissiveIntensity: 0.3,
      });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = 0.75;
      barrelGroup.add(barrel);

      // Muzzle glow
      const muzzleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
      const muzzleMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.8,
      });
      const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.z = 1.5;
      barrelGroup.add(muzzle);

      barrelGroup.position.x = xOffset;
      barrelGroup.position.y = 0.2;

      this.barrels.push({
        group: barrelGroup,
        barrel: barrel,
        muzzle: muzzle,
      });
      this.group.add(barrelGroup);
    });

    // Energy core (charging indicator)
    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
    });
    this.energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.energyCore.position.y = 0;
    this.group.add(this.energyCore);

    // Charge ring (expands when charging)
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
    });
    this.chargeRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.chargeRing.rotation.x = Math.PI / 2;
    this.group.add(this.chargeRing);

    // Shoulder armor plates
    this.plates = [];
    [
      { x: -1, y: 0.5, z: 0.5 },
      { x: 1, y: 0.5, z: 0.5 },
      { x: -0.8, y: 0.5, z: -0.8 },
      { x: 0.8, y: 0.5, z: -0.8 },
    ].forEach((pos) => {
      const plateGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
      const plateMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.5,
      });
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(pos.x, pos.y, pos.z);
      this.plates.push(plate);
      this.group.add(plate);
    });

    // Floating energy orbs
    this.orbs = [];
    for (let i = 0; i < 4; i++) {
      const orbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const orbMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.9,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.userData = { angle: (i / 4) * Math.PI * 2 };
      this.orbs.push(orb);
      this.group.add(orb);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 1.8, 12);
    this.light.position.y = 1;
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // OPTIMIZATION: Initialize frame skip counter on first run
    if (this._orbFrameSkip === undefined) {
      this._orbFrameSkip = 0;
    }

    // Rotate body slightly
    this.mesh.rotation.y += deltaTime * 0.5;

    // Pulse energy core
    const corePulse = 0.8 + Math.sin(this.time * 4) * 0.3;
    this.energyCore.material.emissiveIntensity = corePulse;
    this.energyCore.scale.setScalar(corePulse);

    // OPTIMIZATION: Cache recoil calculation outside loop
    const recoilOffset = Math.max(0, 1 - this.burstTimer * 5);

    // Recoil animation
    this.barrels.forEach((barrel, index) => {
      barrel.barrel.position.z = 0.75 - recoilOffset * 0.3;

      // Muzzle flash
      barrel.muzzle.material.opacity = recoilOffset * 0.8;
      barrel.muzzle.scale.setScalar(1 + recoilOffset * 0.5);
    });

    // Charging animation
    if (this.isCharging) {
      const chargeRatio = this.chargeTime / this.maxChargeTime;
      this.chargeRing.material.opacity = chargeRatio;
      this.chargeRing.scale.setScalar(1 + chargeRatio * 2);
      this.chargeRing.rotation.z += deltaTime * 5;

      // Pulse faster when charging
      this.energyCore.material.emissiveIntensity =
        1.5 + Math.sin(this.time * 20) * 0.5;

      // Light intensity
      this.light.intensity = 2 + chargeRatio * 3;
    } else {
      this.chargeRing.material.opacity = 0;
      this.light.intensity = 1.8;
    }

    // OPTIMIZATION: Cache pulse time calculation
    const plateTime = this.time * 3;

    // Pulse plates
    this.plates.forEach((plate, index) => {
      const pulse = 0.3 + Math.sin(plateTime + index) * 0.2;
      plate.material.emissiveIntensity = pulse;
    });

    // OPTIMIZATION: Update orb orbits every other frame
    this._orbFrameSkip++;
    if (this._orbFrameSkip % 2 === 0) {
      // OPTIMIZATION: Cache orbit calculations outside loop
      const baseAngle = this.time * 2;
      const radiusTime = this.time * 3;
      const verticalTime = this.time * 4;

      // Orbit energy orbs
      this.orbs.forEach((orb, index) => {
        const angle = orb.userData.angle + baseAngle;
        const radius = 2 + Math.sin(radiusTime + index) * 0.3;
        orb.position.x = Math.cos(angle) * radius;
        orb.position.z = Math.sin(angle) * radius;
        orb.position.y = 0.5 + Math.sin(verticalTime + index) * 0.4;
      });
    }
  }

  update(deltaTime, playerPosition) {
    super.update(deltaTime, playerPosition);

    // Update burst timer
    if (this.burstTimer > 0) {
      this.burstTimer -= deltaTime;

      if (this.burstTimer <= 0 && this.shotsInBurst < this.burstCount) {
        // Fire next shot in burst
        if (playerPosition) {
          this.fireBlast(playerPosition);
          this.shotsInBurst++;

          if (this.shotsInBurst < this.burstCount) {
            this.burstTimer = this.burstDelay;
          }
        }
      }
    }

    // Update charge
    if (this.chargedShotCooldown > 0) {
      this.chargedShotCooldown -= deltaTime;
    }

    if (this.isCharging && playerPosition) {
      this.chargeTime += deltaTime;

      if (this.chargeTime >= this.maxChargeTime) {
        this.fireChargedBlast(playerPosition);
        this.isCharging = false;
        this.chargeTime = 0;
        this.chargedShotCooldown = 10;
      }
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Start charging if close and cooldown ready
    if (
      distanceToPlayer < 18 &&
      !this.isCharging &&
      this.chargedShotCooldown <= 0 &&
      Math.random() < 0.015
    ) {
      this.isCharging = true;
      this.chargeTime = 0;
    }

    // Fire burst attack
    if (
      distanceToPlayer <= this.attackRange &&
      distanceToPlayer > 8 &&
      this.attackCooldown <= 0 &&
      this.burstTimer <= 0
    ) {
      this.shotsInBurst = 0;
      this.fireBlast(playerPosition);
      this.shotsInBurst = 1;
      this.burstTimer = this.burstDelay;
      this.attackCooldown = 3;
    }

    // Kiting behavior - maintain optimal distance
    if (distanceToPlayer < this.preferredDistance - 3) {
      // Too close, back away
      const direction = new THREE.Vector3()
        .subVectors(this.position, playerPosition)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else if (distanceToPlayer > this.preferredDistance + 5) {
      // Too far, move closer
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime * 0.7));
    } else {
      // Optimal distance, strafe
      const toPlayer = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);

      // Randomly change strafe direction
      if (Math.random() < 0.02) {
        perpendicular.negate();
      }

      this.position.add(
        perpendicular.multiplyScalar(this.speed * deltaTime * 0.6)
      );
    }
  }

  fireBlast(targetPosition) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.position)
      .normalize();

    // Add slight spread
    direction.x += (Math.random() - 0.5) * 0.1;
    direction.z += (Math.random() - 0.5) * 0.1;
    direction.normalize();

    const projectile = {
      position: this.position.clone(),
      velocity: direction.multiplyScalar(this.projectileSpeed),
      damage: this.damage,
      lifetime: 2.5,
      color: this.color,
      size: 0.4,
    };

    this.projectiles.push(projectile);

    // Visual effect
    if (this.particleSystem) {
      this.particleSystem.createMuzzleFlash(this.position, this.color);
    }
  }

  fireChargedBlast(targetPosition) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.position)
      .normalize();

    // Large powerful projectile
    const projectile = {
      position: this.position.clone(),
      velocity: direction.multiplyScalar(this.projectileSpeed * 0.7),
      damage: this.damage * 3,
      lifetime: 4,
      color: 0xffff00,
      size: 1.2,
      isCharged: true,
      explosionRadius: 5,
    };

    this.projectiles.push(projectile);

    // Massive visual effect
    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, 0xffff00, 20);
    }
  }
}
