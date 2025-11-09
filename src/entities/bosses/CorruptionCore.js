import * as THREE from "three";
import BaseBoss from "./BaseBoss.js";

export default class CorruptionCore extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Boss Identity
    this.bossName = "CORRUPTION CORE";
    this.bossTitle = "The System Destroyer";

    // Stats - MASSIVE AND POWERFUL
    this.maxHealth = 2000 * difficulty;
    this.health = this.maxHealth;
    this.speed = 4;
    this.damage = 60 * difficulty;
    this.contactDamage = 35 * difficulty;
    this.collisionRadius = 8;
    this.scoreValue = 5000;
    this.color = 0x000000;
    this.secondaryColor = 0xff0000;

    this.attackType = "hybrid";
    this.attackRange = 35;
    this.projectileSpeed = 22;

    // Phase system
    this.phases = [
      { name: "Awakening", healthThreshold: 1.0 },
      { name: "Corruption Spread", healthThreshold: 0.66 },
      { name: "System Meltdown", healthThreshold: 0.33 },
      { name: "Total Annihilation", healthThreshold: 0 },
    ];
    this.currentPhaseIndex = 0;

    // Special abilities
    this.corruptionAura = null;
    this.shockwaveTimer = 0;
    this.shockwaveCooldown = 10;
    this.corruptionPulseTimer = 0;
    this.corruptionPulseCooldown = 15;
    this.orbitalMinions = [];

    // Visual arrays
    this.orbitalRings = [];
    this.tendrils = [];
    this.spikes = [];
    this.darkMatterParticles = [];
    this.corruptionZones = [];

    this.createSpawnPortal();
    this.createMesh();
  }

  createMesh() {
    // MASSIVE CORE (8 units - much larger than standard enemies)
    const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.5,
      shininess: 100,
      metalness: 0.8,
    });
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Pulsating energy core
    const energyGeometry = new THREE.IcosahedronGeometry(5, 1);
    const energyMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8,
    });
    this.energyCore = new THREE.Mesh(energyGeometry, energyMaterial);
    this.group.add(this.energyCore);

    // 8 massive orbital rings
    for (let i = 0; i < 8; i++) {
      const ringGeometry = new THREE.TorusGeometry(10 + i * 2, 0.5, 16, 64);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.secondaryColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.85,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData = {
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        speed: 0.6 + Math.random() * 0.6,
      };

      this.orbitalRings.push(ring);
      this.group.add(ring);
    }

    // 16 writhing tendrils
    const tendrilMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a0000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1,
    });

    for (let i = 0; i < 16; i++) {
      const tendrilGroup = new THREE.Group();
      const segments = 20;

      for (let j = 0; j < segments; j++) {
        const segmentGeometry = new THREE.CylinderGeometry(
          1 - j * 0.048,
          1 - (j + 1) * 0.048,
          2,
          8
        );

        const segment = new THREE.Mesh(segmentGeometry, tendrilMaterial);
        segment.position.y = -j * 2;
        segment.userData = { segmentIndex: j };

        if (j === 0) {
          tendrilGroup.add(segment);
        } else {
          const prev = tendrilGroup.children[tendrilGroup.children.length - 1];
          prev.add(segment);
        }
      }

      const angle = (i / 16) * Math.PI * 2;
      tendrilGroup.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
      tendrilGroup.userData = { baseAngle: angle, offset: i };

      this.tendrils.push(tendrilGroup);
      this.group.add(tendrilGroup);
    }

    // 40 menacing spikes
    const spikeGeometry = new THREE.ConeGeometry(1.2, 8, 8);
    const spikeMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1,
    });

    for (let i = 0; i < 40; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const phi = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;

      spike.position.set(
        Math.cos(theta) * Math.sin(phi) * 10,
        Math.cos(phi) * 10,
        Math.sin(theta) * Math.sin(phi) * 10
      );

      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI);
      spike.userData = { offset: i };

      this.spikes.push(spike);
      this.group.add(spike);
    }

    // 80 dark matter particles
    const particleGeometry = new THREE.OctahedronGeometry(0.6, 0);
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: 0x330000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < 80; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 15 + Math.random() * 10,
        speed: 0.4 + Math.random() * 0.6,
        height: (Math.random() - 0.5) * 20,
      };
      this.darkMatterParticles.push(particle);
      this.group.add(particle);
    }

    // Massive lighting
    this.mainLight = new THREE.PointLight(this.secondaryColor, 8, 60);
    this.group.add(this.mainLight);

    this.pulseLight = new THREE.PointLight(0xffffff, 0, 70);
    this.group.add(this.pulseLight);

    // Corruption aura
    const auraGeometry = new THREE.SphereGeometry(18, 32, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    this.corruptionAura = new THREE.Mesh(auraGeometry, auraMaterial);
    this.group.add(this.corruptionAura);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (!this.fullySpawned) return;

    // Core rotation
    this.mesh.rotation.x += deltaTime * 0.5;
    this.mesh.rotation.y += deltaTime * 0.7;

    // Energy core pulsation
    this.energyCore.rotation.x -= deltaTime * 2;
    this.energyCore.rotation.y -= deltaTime * 1.5;
    const energyScale = 1 + Math.sin(this.time * 4) * 0.4;
    this.energyCore.scale.setScalar(energyScale);

    // Orbital rings
    this.orbitalRings.forEach((ring, index) => {
      ring.rotateOnAxis(
        ring.userData.axis,
        deltaTime * ring.userData.speed * 2
      );
      const opacity = 0.85 + Math.sin(this.time * 5 + index) * 0.15;
      ring.material.opacity = opacity;
    });

    // Writhing tendrils
    this.tendrils.forEach((tendrilGroup, tendrilIndex) => {
      const baseAngle = tendrilGroup.userData.baseAngle + this.time * 0.9;
      const offset = tendrilGroup.userData.offset;
      const radius = 8 + Math.sin(this.time * 3 + offset) * 1.5;

      tendrilGroup.position.set(
        Math.cos(baseAngle) * radius,
        Math.sin(this.time * 2 + offset) * 4,
        Math.sin(baseAngle) * radius
      );

      tendrilGroup.traverse((child) => {
        if (child.userData.segmentIndex !== undefined) {
          const segmentIndex = child.userData.segmentIndex;
          child.rotation.z =
            Math.sin(this.time * 5 + segmentIndex * 0.5 + offset) * 0.9;
        }
      });
    });

    // Aggressive spikes
    const healthRatio = this.health / this.maxHealth;
    this.spikes.forEach((spike, index) => {
      const extension = 1 + (1 - healthRatio) * 1.2;
      spike.scale.y =
        extension + Math.sin(this.time * 6 + spike.userData.offset) * 0.4;
      spike.rotation.y += deltaTime * 4;
    });

    // Dark matter swarm
    this.darkMatterParticles.forEach((particle, index) => {
      const data = particle.userData;
      const angle = data.angle + this.time * data.speed;

      particle.position.set(
        Math.cos(angle) * data.radius,
        data.height + Math.sin(this.time * 4 + index) * 4,
        Math.sin(angle) * data.radius
      );

      particle.rotation.x += deltaTime * 8;
      particle.rotation.y += deltaTime * 6;
    });

    // Dynamic lighting
    this.mainLight.intensity = 8 + Math.sin(this.time * 4) * 2;

    // Corruption aura pulse
    if (this.corruptionAura) {
      const auraScale = 1 + Math.sin(this.time * 2) * 0.2;
      this.corruptionAura.scale.setScalar(auraScale);
      this.corruptionAura.material.opacity =
        0.15 + Math.sin(this.time * 3) * 0.05;
    }

    // Phase-specific effects
    if (this.isEnraged) {
      this.mesh.material.emissiveIntensity = 2 + Math.sin(this.time * 10) * 0.5;
      this.mainLight.intensity = 10 + Math.sin(this.time * 8) * 3;
    }

    // Pulse light fade
    if (this.pulseLight.intensity > 0) {
      this.pulseLight.intensity -= deltaTime * 4;
    }
  }

  checkPhaseTransition() {
    const healthRatio = this.health / this.maxHealth;

    // Check for phase change
    for (let i = this.phases.length - 1; i > this.currentPhaseIndex; i--) {
      if (healthRatio <= this.phases[i].healthThreshold) {
        this.currentPhaseIndex = i;
        this.onPhaseChange(i);
        break;
      }
    }

    // Enrage at 33%
    if (healthRatio < 0.33 && !this.isEnraged) {
      this.isEnraged = true;
      this.onEnrage();
    }
  }

  onPhaseChange(phaseIndex) {
    // Visual explosion
    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        100
      );
      this.particleSystem.createShockwave(
        this.position,
        25,
        this.secondaryColor
      );
    }

    // Pulse light
    if (this.pulseLight) {
      this.pulseLight.intensity = 15;
    }

    // Increase power each phase
    this.speed *= 1.2;
    this.attackCooldown = Math.max(0.8, this.attackCooldown * 0.8);

    console.log(
      `CORRUPTION CORE entered phase: ${this.phases[phaseIndex].name}`
    );
  }

  onEnrage() {
    super.onEnrage();

    console.log("CORRUPTION CORE IS ENRAGED!");

    // Extra aggressive behavior
    this.shockwaveCooldown = 6;
    this.corruptionPulseCooldown = 10;
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition || !this.fullySpawned) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Special ability timers
    if (this.shockwaveTimer > 0) {
      this.shockwaveTimer -= deltaTime;
    }

    if (this.corruptionPulseTimer > 0) {
      this.corruptionPulseTimer -= deltaTime;
    }

    // Close-range shockwave
    if (
      distanceToPlayer < 15 &&
      this.shockwaveTimer <= 0 &&
      this.particleSystem
    ) {
      this.particleSystem.createShockwave(
        this.position,
        20,
        this.secondaryColor
      );
      this.shockwaveTimer = this.shockwaveCooldown;
    }

    // Corruption pulse (large AOE)
    if (this.corruptionPulseTimer <= 0 && this.particleSystem) {
      this.corruptionPulse();
      this.corruptionPulseTimer = this.corruptionPulseCooldown;
    }

    // Movement - aggressive pursuit
    const optimalDistance = 12;
    if (distanceToPlayer > optimalDistance) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else if (distanceToPlayer < 8) {
      // Back away slightly if too close
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      this.position.add(
        direction.multiplyScalar(-this.speed * 0.3 * deltaTime)
      );
    }

    // Attack patterns based on phase
    if (this.attackCooldown <= 0) {
      if (this.currentPhaseIndex === 0) {
        this.shootSpiral();
        this.attackCooldown = 2.5;
      } else if (this.currentPhaseIndex === 1) {
        this.shootSpiral();
        this.shootRadial();
        this.attackCooldown = 2;
      } else if (this.currentPhaseIndex === 2) {
        this.shootSpiral();
        this.shootRadial();
        this.shootHoming(playerPosition);
        this.attackCooldown = 1.5;
      } else if (this.currentPhaseIndex === 3 || this.isEnraged) {
        this.shootSpiral();
        this.shootRadial();
        this.shootHoming(playerPosition);
        this.shootChaos();
        this.attackCooldown = 1;
      }
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      // Homing behavior
      if (proj.isHoming && playerPosition) {
        const toPlayer = new THREE.Vector3()
          .subVectors(playerPosition, proj.position)
          .normalize();

        proj.velocity.lerp(
          toPlayer.multiplyScalar(proj.velocity.length()),
          0.08
        );
        proj.velocity.normalize().multiplyScalar(24);
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 10;
        proj.mesh.rotation.y += deltaTime * 7;
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  // Attack ability: Spiral projectiles
  shootSpiral() {
    const count = this.isEnraged ? 12 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.time;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      this.createProjectile(direction, this.damage, 0xff0000, "octahedron");
    }
  }

  // Attack ability: Radial burst
  shootRadial() {
    const count = this.isEnraged ? 16 : 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      this.createProjectile(
        direction,
        this.damage * 1.2,
        0xff4400,
        "tetrahedron",
        this.projectileSpeed + 8
      );
    }
  }

  // Attack ability: Homing missiles
  shootHoming(playerPosition) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const spreadAngle = (i - 2.5) * 0.4;
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

      this.createProjectile(
        direction,
        this.damage * 1.5,
        0xff00ff,
        "sphere",
        26,
        true
      );
    }
  }

  // Attack ability: Chaos projectiles (random spread)
  shootChaos() {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * 0.3;
      const direction = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation),
        Math.sin(elevation),
        Math.sin(angle) * Math.cos(elevation)
      );

      this.createProjectile(
        direction,
        this.damage * 0.8,
        0xffaa00,
        "box",
        this.projectileSpeed + Math.random() * 10
      );
    }
  }

  // Special ability: Corruption pulse wave
  corruptionPulse() {
    // Create expanding corruption wave
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      setTimeout(() => {
        this.createProjectile(
          direction,
          this.damage * 1.3,
          0x880000,
          "octahedron",
          15
        );
      }, i * 50);
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, 0x880000, 80);
    }
  }

  // Helper to create different projectile types
  createProjectile(
    direction,
    damage,
    color,
    shape = "sphere",
    speed = null,
    isHoming = false
  ) {
    let projGeometry;
    switch (shape) {
      case "octahedron":
        projGeometry = new THREE.OctahedronGeometry(0.7, 0);
        break;
      case "tetrahedron":
        projGeometry = new THREE.TetrahedronGeometry(0.8, 0);
        break;
      case "box":
        projGeometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      default:
        projGeometry = new THREE.SphereGeometry(0.7, 12, 12);
    }

    const projMaterial = this.createGlowMaterial(color, 2);
    const projMesh = new THREE.Mesh(projGeometry, projMaterial);

    projMesh.position.copy(this.position);
    this.scene.add(projMesh);

    const projectile = {
      mesh: projMesh,
      position: this.position.clone(),
      velocity: direction
        .normalize()
        .multiplyScalar(speed || this.projectileSpeed),
      damage: damage,
      lifetime: 6,
      collisionRadius: 0.7,
      isHoming: isHoming,
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

  takeDamage(amount) {
    super.takeDamage(amount);

    // Show damage with particles
    if (this.particleSystem && Math.random() < 0.4) {
      this.particleSystem.createExplosion(this.position, 0xffffff, 15);
    }
  }
}
