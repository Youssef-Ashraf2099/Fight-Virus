import * as THREE from "three";
import BaseBoss from "./BaseBoss.js";

export default class CircuitOverlord extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Boss Identity
    this.bossName = "CIRCUIT OVERLORD";
    this.bossTitle = "The First Guardian";

    // Stats - FIRST BOSS - Challenging but fair
    this.maxHealth = 1500 * difficulty;
    this.health = this.maxHealth;
    this.speed = 5;
    this.damage = 40 * difficulty;
    this.contactDamage = 20 * difficulty;
    this.collisionRadius = 7;
    this.spawnElevation = 2; // Keep boss grounded instead of floating too high
    this.scoreValue = 3000;
    this.color = 0x00ffff; // Cyan/electric blue
    this.secondaryColor = 0xff0000; // Red core

    // Accuracy tuning
    this.aimJitter = {
      horizontal: 0.3,
      vertical: 0.18,
      laserHorizontal: 0.22,
      laserVertical: 0.12,
    };
    this.laserHomingStrength = 0.055;

    // Orientation helpers to keep boss upright
    this.baseTiltAngle = Math.PI / 2; // Stand the boss vertically
    this.baseTiltQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      this.baseTiltAngle
    );
    this.yawQuaternion = new THREE.Quaternion();
    this.yawAxis = new THREE.Vector3(0, 1, 0);

    this.attackType = "hybrid";
    this.attackRange = 32;
    this.projectileSpeed = 20;

    // Phase system - 4 distinct phases
    this.phases = [
      { name: "Circuit Initialization", healthThreshold: 1.0 },
      { name: "Data Corruption", healthThreshold: 0.7 },
      { name: "System Overload", healthThreshold: 0.4 },
      { name: "Critical Meltdown", healthThreshold: 0 },
    ];
    this.currentPhaseIndex = 0;

    // Special abilities
    this.electricArcs = [];
    this.dataStreams = [];
    this.shieldActive = false;
    this.shieldCooldown = 0;
    this.shieldDuration = 3;
    this.shieldMaxCooldown = 20;

    this.pulseWaveTimer = 0;
    this.pulseWaveCooldown = 12;

    this.summonTimer = 0;
    this.summonCooldown = 15;

    this.laserBarrageTimer = 0;
    this.laserBarrageCooldown = 8;

    // Tentacle system (like in image)
    this.tentacles = [];
    this.tentacleCount = 8;

    this.createSpawnPortal();
    this.createMesh();
  }

  createMesh() {
    // CENTRAL CPU CORE (like circuit board in image)
    const coreGeometry = new THREE.BoxGeometry(7, 1, 7);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a0000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.8,
      shininess: 100,
    });
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Central red eye/core
    const eyeGeometry = new THREE.SphereGeometry(2, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });
    this.eyeCore = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.eyeCore.position.y = 1;
    this.group.add(this.eyeCore);

    // Circuit board lines
    this.circuitLines = [];
    for (let i = 0; i < 12; i++) {
      const lineGeometry = new THREE.BoxGeometry(6, 0.1, 0.3);
      const lineMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 1.5,
      });

      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      const angle = (i / 12) * Math.PI * 2;
      line.position.set(Math.cos(angle) * 3, 0.5, Math.sin(angle) * 3);
      line.rotation.y = angle;

      this.circuitLines.push(line);
      this.group.add(line);
    }

    // Electric tentacles (data streams from image)
    const tentacleMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < this.tentacleCount; i++) {
      const tentacleGroup = new THREE.Group();
      const segments = 25;

      for (let j = 0; j < segments; j++) {
        const width = 0.8 - j * 0.03;
        const segmentGeometry = new THREE.CylinderGeometry(
          width,
          width - 0.03,
          1.8,
          6
        );

        const segment = new THREE.Mesh(segmentGeometry, tentacleMaterial);
        segment.position.y = -j * 1.8;
        segment.userData = { segmentIndex: j };

        if (j === 0) {
          tentacleGroup.add(segment);
        } else {
          const prev =
            tentacleGroup.children[tentacleGroup.children.length - 1];
          prev.add(segment);
        }
      }

      const angle = (i / this.tentacleCount) * Math.PI * 2;
      tentacleGroup.position.set(Math.cos(angle) * 4, 1, Math.sin(angle) * 4);
      tentacleGroup.userData = {
        baseAngle: angle,
        offset: i,
        active: true,
      };

      this.tentacles.push(tentacleGroup);
      this.group.add(tentacleGroup);
    }

    // Data nodes (circuit connection points)
    this.dataNodes = [];
    const nodeGeometry = new THREE.OctahedronGeometry(0.5, 0);
    for (let i = 0; i < 16; i++) {
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9,
      });

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const angle = (i / 16) * Math.PI * 2;
      const radius = 5 + (i % 2) * 2;
      node.position.set(
        Math.cos(angle) * radius,
        Math.sin(this.time * 2 + i) * 2,
        Math.sin(angle) * radius
      );
      node.userData = { angle, radius, offset: i };

      this.dataNodes.push(node);
      this.group.add(node);
    }

    // Shield visual
    const shieldGeometry = new THREE.IcosahedronGeometry(10, 1);
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.group.add(this.shieldMesh);

    // Warning lights (like in image)
    this.warningLights = [];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xff0000, 0, 20);
      const angle = (i / 4) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 6, 2, Math.sin(angle) * 6);
      this.warningLights.push(light);
      this.group.add(light);
    }

    // Main lighting
    this.mainLight = new THREE.PointLight(this.color, 6, 50);
    this.mainLight.position.y = 2;
    this.group.add(this.mainLight);

    this.pulseLight = new THREE.PointLight(0xffffff, 0, 60);
    this.group.add(this.pulseLight);

    this.group.position.copy(this.position);
    this.group.quaternion.copy(this.baseTiltQuaternion);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (!this.fullySpawned) return;

    // Core rotation
    this.mesh.rotation.y += deltaTime * 0.3;

    // Eye pulsation
    const eyeScale = 1 + Math.sin(this.time * 5) * 0.15;
    this.eyeCore.scale.setScalar(eyeScale);
    this.eyeCore.rotation.x += deltaTime * 2;
    this.eyeCore.rotation.y += deltaTime * 1.5;

    // Circuit line animation
    this.circuitLines.forEach((line, i) => {
      const pulse = Math.sin(this.time * 4 + i) * 0.5 + 0.5;
      line.material.emissiveIntensity = 1 + pulse;
    });

    // Electric tentacles animation (like image)
    this.tentacles.forEach((tentacleGroup, tentacleIndex) => {
      if (!tentacleGroup.userData.active) return;

      const baseAngle = tentacleGroup.userData.baseAngle + this.time * 0.6;
      const offset = tentacleGroup.userData.offset;
      const radius = 4 + Math.sin(this.time * 2 + offset) * 1.5;

      tentacleGroup.position.set(
        Math.cos(baseAngle) * radius,
        1 + Math.sin(this.time * 1.8 + offset) * 2,
        Math.sin(baseAngle) * radius
      );

      tentacleGroup.traverse((child) => {
        if (child.userData.segmentIndex !== undefined) {
          const segmentIndex = child.userData.segmentIndex;
          child.rotation.z =
            Math.sin(this.time * 6 + segmentIndex * 0.3 + offset) * 0.8;
        }
      });
    });

    // Data nodes orbiting
    this.dataNodes.forEach((node, i) => {
      const data = node.userData;
      const angle = data.angle + this.time * 0.8;
      node.position.set(
        Math.cos(angle) * data.radius,
        Math.sin(this.time * 3 + i) * 2.5,
        Math.sin(angle) * data.radius
      );
      node.rotation.x += deltaTime * 8;
      node.rotation.y += deltaTime * 6;

      const pulse = Math.sin(this.time * 10 + i) * 0.5 + 0.5;
      node.material.opacity = 0.6 + pulse * 0.4;
    });

    // Shield visual
    if (this.shieldActive) {
      this.shieldMesh.material.opacity = Math.min(
        this.shieldMesh.material.opacity + deltaTime * 2,
        0.6
      );
      this.shieldMesh.rotation.x += deltaTime * 2;
      this.shieldMesh.rotation.y += deltaTime * 1.5;

      const shieldScale = 1 + Math.sin(this.time * 8) * 0.1;
      this.shieldMesh.scale.setScalar(shieldScale);
    } else {
      this.shieldMesh.material.opacity = Math.max(
        this.shieldMesh.material.opacity - deltaTime * 3,
        0
      );
    }

    // Warning lights
    this.warningLights.forEach((light, i) => {
      const healthRatio = this.health / this.maxHealth;
      if (healthRatio < 0.5) {
        light.intensity =
          3 *
          (1 - healthRatio) *
          (Math.sin(this.time * 15 + (i * Math.PI) / 2) * 0.5 + 0.5);
      }
    });

    // Main lighting
    this.mainLight.intensity = 6 + Math.sin(this.time * 4) * 1.5;

    // Pulse light
    if (this.pulseLight.intensity > 0) {
      this.pulseLight.intensity -= deltaTime * 5;
    }

    // Phase-specific effects
    if (this.isEnraged) {
      this.eyeCore.material.emissiveIntensity =
        3 + Math.sin(this.time * 12) * 0.5;
      this.mainLight.intensity = 8 + Math.sin(this.time * 8) * 2;
    }
  }

  checkPhaseTransition() {
    const healthRatio = this.health / this.maxHealth;

    for (let i = this.phases.length - 1; i > this.currentPhaseIndex; i--) {
      if (healthRatio <= this.phases[i].healthThreshold) {
        this.currentPhaseIndex = i;
        this.onPhaseChange(i);
        break;
      }
    }

    if (healthRatio < 0.4 && !this.isEnraged) {
      this.isEnraged = true;
      this.onEnrage();
    }
  }

  onPhaseChange(phaseIndex) {
    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, this.color, 120);
      this.particleSystem.createShockwave(this.position, 30, this.color);
    }

    if (this.pulseLight) {
      this.pulseLight.intensity = 20;
    }

    // Get more aggressive each phase
    this.speed *= 1.25;
    this.attackCooldown = Math.max(0.6, this.attackCooldown * 0.75);

    // Deactivate tentacles progressively
    const tentaclesToDisable = Math.floor(
      (phaseIndex / this.phases.length) * this.tentacleCount
    );
    for (let i = 0; i < tentaclesToDisable; i++) {
      if (this.tentacles[i]) {
        this.tentacles[i].userData.active = false;
        this.tentacles[i].visible = false;
      }
    }

    console.log(
      `CIRCUIT OVERLORD entered phase: ${this.phases[phaseIndex].name}`
    );
  }

  onEnrage() {
    super.onEnrage();
    console.log("CIRCUIT OVERLORD IS CRITICAL!");

    // All abilities on reduced cooldown
    this.shieldMaxCooldown = 15;
    this.pulseWaveCooldown = 8;
    this.summonCooldown = 10;
    this.laserBarrageCooldown = 5;
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition || !this.fullySpawned) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Face the player on horizontal plane to avoid upward spawn orientation
    const yaw = Math.atan2(
      playerPosition.x - this.position.x,
      playerPosition.z - this.position.z
    );
    this.yawQuaternion.setFromAxisAngle(this.yawAxis, yaw);
    this.group.quaternion
      .copy(this.yawQuaternion)
      .multiply(this.baseTiltQuaternion);

    // Update ability cooldowns
    if (this.shieldCooldown > 0) this.shieldCooldown -= deltaTime;
    if (this.pulseWaveTimer > 0) this.pulseWaveTimer -= deltaTime;
    if (this.summonTimer > 0) this.summonTimer -= deltaTime;
    if (this.laserBarrageTimer > 0) this.laserBarrageTimer -= deltaTime;

    // Shield ability - activate when damaged
    if (
      !this.shieldActive &&
      this.shieldCooldown <= 0 &&
      this.health < this.maxHealth * 0.8
    ) {
      this.activateShield();
    }

    // Update shield duration
    if (this.shieldActive) {
      this.shieldDuration -= deltaTime;
      if (this.shieldDuration <= 0) {
        this.deactivateShield();
      }
    }

    // Pulse wave ability
    if (this.pulseWaveTimer <= 0 && distanceToPlayer < 20) {
      this.electricPulseWave();
      this.pulseWaveTimer = this.pulseWaveCooldown;
    }

    // Laser barrage
    if (this.laserBarrageTimer <= 0) {
      this.laserBarrage(playerPosition);
      this.laserBarrageTimer = this.laserBarrageCooldown;
    }

    // Movement - circle strafe and approach
    const optimalDistance = 15;
    if (distanceToPlayer > optimalDistance) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Circle strafe
      const angle = this.time * 0.5;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      this.position.add(direction.multiplyScalar(this.speed * 0.3 * deltaTime));
    }

    // Attack patterns based on phase
    if (this.attackCooldown <= 0) {
      if (this.currentPhaseIndex === 0) {
        this.dataStreamAttack(playerPosition);
        this.attackCooldown = 2.2;
      } else if (this.currentPhaseIndex === 1) {
        this.dataStreamAttack(playerPosition);
        this.electricArcAttack(playerPosition);
        this.attackCooldown = 1.8;
      } else if (this.currentPhaseIndex === 2) {
        this.dataStreamAttack(playerPosition);
        this.electricArcAttack(playerPosition);
        this.corruptionWave();
        this.attackCooldown = 1.3;
      } else if (this.currentPhaseIndex === 3 || this.isEnraged) {
        this.dataStreamAttack(playerPosition);
        this.electricArcAttack(playerPosition);
        this.corruptionWave();
        this.systemOverload();
        this.attackCooldown = 0.8;
      }
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isHoming && playerPosition) {
        const toPlayer = new THREE.Vector3()
          .subVectors(playerPosition, proj.position)
          .normalize();
        proj.velocity.lerp(
          toPlayer.multiplyScalar(proj.velocity.length()),
          proj.homingStrength !== undefined ? proj.homingStrength : 0.1
        );
        proj.velocity.normalize().multiplyScalar(proj.speed || 25);
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 12;
        proj.mesh.rotation.y += deltaTime * 8;
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  // ABILITIES

  activateShield() {
    this.shieldActive = true;
    this.shieldDuration = 3;
    this.shieldCooldown = this.shieldMaxCooldown;

    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, 0x00ffff, 60);
    }
  }

  deactivateShield() {
    this.shieldActive = false;
    if (this.particleSystem) {
      this.particleSystem.createShockwave(this.position, 15, 0x00ffff);
    }
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount *= 0.2; // 80% damage reduction with shield
      if (this.particleSystem) {
        this.particleSystem.createImpact(this.position, 0x00ffff, 10);
      }
    }

    super.takeDamage(amount);
  }

  dataStreamAttack(playerPosition) {
    const count = this.isEnraged ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const spreadAngle = (i - count / 2) * 0.2;
      const baseDirection = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const direction = new THREE.Vector3(
        baseDirection.x * Math.cos(spreadAngle) -
          baseDirection.z * Math.sin(spreadAngle),
        0,
        baseDirection.x * Math.sin(spreadAngle) +
          baseDirection.z * Math.cos(spreadAngle)
      );

      this.applyAimJitter(
        direction,
        this.aimJitter.horizontal,
        this.aimJitter.vertical
      );

      this.createProjectile(
        direction,
        this.damage,
        this.color,
        "box",
        22,
        false
      );
    }
  }

  electricArcAttack(playerPosition) {
    const count = this.isEnraged ? 8 : 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.time;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle * 2) * 0.3,
        Math.sin(angle)
      ).normalize();

      this.createProjectile(
        direction,
        this.damage * 1.1,
        0xffff00,
        "tetrahedron",
        26,
        false
      );
    }
  }

  corruptionWave() {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      this.createProjectile(
        direction,
        this.damage * 1.3,
        0xff00ff,
        "octahedron",
        18,
        false
      );
    }
  }

  systemOverload() {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * 0.5;
      const direction = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation),
        Math.sin(elevation),
        Math.sin(angle) * Math.cos(elevation)
      );

      this.createProjectile(
        direction,
        this.damage * 0.9,
        0xff0000,
        "sphere",
        20 + Math.random() * 8,
        false
      );
    }
  }

  electricPulseWave() {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      setTimeout(() => {
        this.createProjectile(
          direction,
          this.damage * 1.2,
          0x00ffff,
          "octahedron",
          16,
          false
        );
      }, i * 40);
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(this.position, 25, this.color);
    }
  }

  laserBarrage(playerPosition) {
    const count = this.isEnraged ? 6 : 4;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();

        this.applyAimJitter(
          direction,
          this.aimJitter.laserHorizontal,
          this.aimJitter.laserVertical
        );

        this.createProjectile(
          direction,
          this.damage * 1.5,
          0xff0000,
          "cylinder",
          30,
          true,
          this.laserHomingStrength
        );
      }, i * 200);
    }
  }

  createProjectile(
    direction,
    damage,
    color,
    shape = "sphere",
    speed = null,
    isHoming = false,
    homingStrength = 0.1
  ) {
    let projGeometry;
    switch (shape) {
      case "octahedron":
        projGeometry = new THREE.OctahedronGeometry(0.6, 0);
        break;
      case "tetrahedron":
        projGeometry = new THREE.TetrahedronGeometry(0.7, 0);
        break;
      case "box":
        projGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        break;
      case "cylinder":
        projGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        break;
      default:
        projGeometry = new THREE.SphereGeometry(0.6, 10, 10);
    }

    const projMaterial = this.createGlowMaterial(color, 2.2);
    const projMesh = new THREE.Mesh(projGeometry, projMaterial);

    projMesh.position.copy(this.position);
    projMesh.position.y += 1;
    this.scene.add(projMesh);

    const projectile = {
      mesh: projMesh,
      position: this.position.clone(),
      velocity: direction
        .normalize()
        .multiplyScalar(speed || this.projectileSpeed),
      damage: damage,
      lifetime: 7,
      collisionRadius: 0.6,
      speed: speed || this.projectileSpeed,
      isHoming: isHoming,
      homingStrength: homingStrength,
      color: color,
      getPosition: function () {
        return this.position.clone();
      },
      destroy: function () {
        this.lifetime = 0;
      },
    };

    this.projectiles.push(projectile);
  }

  applyAimJitter(direction, horizontal, vertical) {
    if (!direction) return direction;
    direction.x += (Math.random() - 0.5) * horizontal;
    direction.y += (Math.random() - 0.5) * vertical;
    direction.z += (Math.random() - 0.5) * horizontal;
    direction.normalize();
    return direction;
  }
}
