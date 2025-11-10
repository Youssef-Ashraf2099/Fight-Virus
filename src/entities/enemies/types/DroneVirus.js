import * as THREE from "three";
import BaseEnemy from "../BaseEnemy.js";

/**
 * DroneVirus - Flying enemy that hovers above the ground
 * - Flies at elevated height
 * - Aerial dive bomb attacks
 * - Fast strafing movements
 * - Energy beam attacks from above
 */
export default class DroneVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Drone stats - Fast, flying, moderate health
    this.maxHealth = 120 * difficulty;
    this.health = this.maxHealth;
    this.speed = 8;
    this.damage = 15 * difficulty;
    this.contactDamage = 8 * difficulty;
    this.collisionRadius = 1.2;
    this.scoreValue = 200;
    this.color = 0x00ccff;

    // Flying mechanics
    this.isFlying = true;
    this.flyHeight = 8; // Hovers at this height
    this.verticalSpeed = 6;
    this.verticalOffset = 0;
    this.hoverTime = 0;

    // Attack configuration
    this.attackType = "ranged";
    this.attackRange = 20;
    this.projectileSpeed = 25;
    this.diveBombCooldown = 0;
    this.diveBombDuration = 0;
    this.isDiving = false;

    // Strafe movement
    this.strafeDirection = new THREE.Vector3();
    this.strafeTimer = 0;

    this.createMesh();
  }

  createMesh() {
    // Main drone body - flattened sphere
    const bodyGeometry = new THREE.SphereGeometry(1.2, 16, 12);
    bodyGeometry.scale(1, 0.6, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.6,
      shininess: 80,
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Propeller rings
    this.propellers = [];
    const propellerPositions = [
      { x: 1.5, z: 1.5 },
      { x: -1.5, z: 1.5 },
      { x: 1.5, z: -1.5 },
      { x: -1.5, z: -1.5 },
    ];

    propellerPositions.forEach((pos) => {
      const propellerGroup = new THREE.Group();

      // Spinning ring
      const ringGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      propellerGroup.add(ring);

      // Propeller arm
      const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5);
      const armMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: this.color,
        emissiveIntensity: 0.3,
      });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.y = -0.75;
      propellerGroup.add(arm);

      propellerGroup.position.set(pos.x, 0, pos.z);
      this.propellers.push({ group: propellerGroup, ring: ring });
      this.group.add(propellerGroup);
    });

    // Central sensor/camera
    const sensorGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sensorMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1,
    });
    this.sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    this.sensor.position.y = -0.3;
    this.group.add(this.sensor);

    // Energy wings (side panels)
    this.wings = [];
    [-1, 1].forEach((side) => {
      const wingGeometry = new THREE.BoxGeometry(0.8, 0.1, 2);
      const wingMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.6,
      });
      const wing = new THREE.Mesh(wingGeometry, wingMaterial);
      wing.position.x = side * 1.8;
      this.wings.push(wing);
      this.group.add(wing);
    });

    // Point light
    this.light = new THREE.PointLight(this.color, 2, 12);
    this.light.position.y = 1;
    this.group.add(this.light);

    // Thrust particles below
    this.thrustParticles = [];
    for (let i = 0; i < 20; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        speed: 2 + Math.random() * 3,
        offset: Math.random() * Math.PI * 2,
      };
      this.thrustParticles.push(particle);
      this.group.add(particle);
    }

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Hover bobbing motion
    this.hoverTime += deltaTime * 2;
    this.verticalOffset = Math.sin(this.hoverTime) * 0.3;

    // Rotate propellers super fast
    const propRotation = deltaTime * 50;
    this.propellers.forEach((prop, index) => {
      prop.ring.rotation.z += propRotation * (index % 2 === 0 ? 1 : -1);
    });

    // Tilt based on movement
    if (this.velocity) {
      this.mesh.rotation.z = -this.velocity.x * 0.2;
      this.mesh.rotation.x = this.velocity.z * 0.2;
    }

    // Pulse sensor (cached calculation)
    const sensorPulse = 0.8 + Math.sin(this.time * 10) * 0.2;
    this.sensor.material.emissiveIntensity = sensorPulse;

    // Flap wings slightly
    const wingTime = this.time * 8;
    this.wings.forEach((wing, index) => {
      wing.rotation.z = Math.sin(wingTime + index * Math.PI) * 0.15;
    });

    // OPTIMIZATION: Update thrust particles less frequently (every other frame)
    if (!this._particleFrameSkip) this._particleFrameSkip = 0;
    this._particleFrameSkip++;

    if (this._particleFrameSkip % 2 === 0) {
      const timeCache = this.time * 2;
      this.thrustParticles.forEach((particle) => {
        const data = particle.userData;
        particle.position.y =
          -1.5 - ((this.time * data.speed + data.offset) % 2);
        particle.position.x = Math.sin(timeCache + data.offset) * 0.5;
        particle.position.z = Math.cos(timeCache + data.offset) * 0.5;
        particle.material.opacity = 0.6 * (1 - (particle.position.y + 3.5) / 2);
      });
    }

    // OPTIMIZATION: Health-based effects only when damaged and randomly
    const healthRatio = this.health / this.maxHealth;
    if (healthRatio < 0.3 && Math.random() < 0.05 && this.particleSystem) {
      this.particleSystem.createImpact(this.position, 0xff6600, 3);
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Maintain flying height
    const targetY = this.flyHeight + this.verticalOffset;
    this.position.y +=
      (targetY - this.position.y) * deltaTime * this.verticalSpeed;

    // Update cooldowns
    if (this.diveBombCooldown > 0) {
      this.diveBombCooldown -= deltaTime;
    }

    // Dive bomb attack
    if (this.diveBombDuration > 0) {
      this.isDiving = true;
      this.diveBombDuration -= deltaTime;

      const diveTarget = playerPosition.clone();
      const direction = new THREE.Vector3()
        .subVectors(diveTarget, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * 2 * deltaTime));

      // OPTIMIZATION: Create dive trail less frequently
      if (Math.random() < 0.15 && this.particleSystem) {
        this.particleSystem.createImpact(this.position, this.color, 2);
      }

      if (this.diveBombDuration <= 0) {
        this.isDiving = false;
        this.diveBombCooldown = 8;
      }
      return;
    }

    this.isDiving = false;

    // Ranged attack
    if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
      this.performRangedAttack(playerPosition);
      this.attackCooldown = 2;
    }

    // Dive bomb occasionally
    if (
      distanceToPlayer > 8 &&
      distanceToPlayer < 20 &&
      this.diveBombCooldown <= 0 &&
      Math.random() < 0.02
    ) {
      this.diveBombDuration = 1.5;
      this.diveBombCooldown = 10;
    }

    // Strafe movement
    this.strafeTimer -= deltaTime;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = 2 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      this.strafeDirection.set(Math.cos(angle), 0, Math.sin(angle));
    }

    if (distanceToPlayer > 5) {
      // Approach player while strafing
      const toPlayer = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const movement = toPlayer
        .multiplyScalar(0.6)
        .add(this.strafeDirection.clone().multiplyScalar(0.4));

      this.velocity = movement
        .normalize()
        .multiplyScalar(this.speed * deltaTime);
      this.position.add(this.velocity);
    } else {
      // Circle around player
      const toPlayer = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
      this.velocity = perpendicular.multiplyScalar(this.speed * deltaTime);
      this.position.add(this.velocity);
    }
  }

  performRangedAttack(targetPosition) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.position)
      .normalize();

    const projectile = {
      position: this.position.clone(),
      velocity: direction.multiplyScalar(this.projectileSpeed),
      damage: this.damage,
      lifetime: 3,
      color: this.color,
      size: 0.3,
    };

    this.projectiles.push(projectile);

    // Visual effect
    if (this.particleSystem) {
      this.particleSystem.createMuzzleFlash(this.position, this.color);
    }
  }

  // Override to account for flying height
  takeDamage(amount, knockbackDirection = null) {
    super.takeDamage(amount, knockbackDirection);

    // Wobble when hit
    if (this.mesh) {
      this.mesh.rotation.x += (Math.random() - 0.5) * 0.5;
      this.mesh.rotation.z += (Math.random() - 0.5) * 0.5;
    }
  }
}
