class PixelReaper extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Boss identity
    this.bossName = "PIXEL REAPER";
    this.bossTitle = "Corrupted Rendering Engine";

    // Enhanced stats for GPU boss
    this.maxHealth = 9000 * difficulty;
    this.health = this.maxHealth;
    this.damage = 50 * difficulty;
    this.speed = 8;
    this.collisionRadius = 4.5;
    this.scoreValue = 18000;

    // GPU-themed colors - vibrant pink/purple with yellow accents
    this.color = 0xff0088;
    this.secondaryColor = 0xff00ff;
    this.accentColor = 0xffee00;

    // Boss phases
    this.phases = [
      { healthPercent: 1.0, name: "Rendering", speedMultiplier: 1.0 },
      { healthPercent: 0.75, name: "Overclocked", speedMultiplier: 1.25 },
      { healthPercent: 0.5, name: "Thermal Throttle", speedMultiplier: 1.5 },
      { healthPercent: 0.25, name: "Critical Meltdown", speedMultiplier: 1.8 },
    ];

    // GPU-specific properties
    this.renderTime = 0;
    this.pixelClusters = [];
    this.frameBuffers = [];
    this.shaderBeams = [];
    this.isRendering = true;
    this.hoverHeight = 6;
    this.orbitRadius = 30;
    this.orbitAngle = 0;

    // Attack patterns
    this.attackCooldown = 0;
    this.projectileSpeed = 30;
    this.projectiles = [];

    // Special abilities
    this.canRenderBlast = true;
    this.canPixelStorm = true;
    this.canShaderBeam = true;
    this.canFrameBufferOverflow = true;

    // Spawn elevation for hovering boss
    this.spawnElevation = this.hoverHeight;

    this.createPixelReaperModel();

    if (this.group) {
      this.group.position.copy(this.position);
      this.group.visible = false; // BaseBoss spawn animation reveals the boss
      this.group.name = "PixelReaper";
      if (this.scene) {
        this.scene.add(this.group);
      }
    }
  }

  createPixelReaperModel() {
    // Core GPU die - hexagonal design
    const coreGeometry = new THREE.CylinderGeometry(3, 3, 2, 6);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      shininess: 120,
      metalness: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.group.add(core);
    this.core = core;

    // Pulsing energy sphere at center
    const energyGeometry = new THREE.SphereGeometry(1.8, 16, 16);
    const energyMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.85,
    });
    const energySphere = new THREE.Mesh(energyGeometry, energyMaterial);
    energySphere.position.y = 1.5;
    this.group.add(energySphere);
    this.energySphere = energySphere;

    // Energy core light
    const coreLight = new THREE.PointLight(this.secondaryColor, 6, 30);
    coreLight.position.copy(energySphere.position);
    this.group.add(coreLight);
    this.coreLight = coreLight;

    // Render pipelines - 4 major arms
    const pipelineCount = 4;
    for (let i = 0; i < pipelineCount; i++) {
      const angle = (i / pipelineCount) * Math.PI * 2;

      // Main pipeline arm
      const armGeometry = new THREE.BoxGeometry(2, 1.5, 10);
      const armMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.6,
        shininess: 100,
      });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
      arm.rotation.y = angle;
      this.group.add(arm);

      // Pipeline segments with energy flow
      for (let j = 0; j < 3; j++) {
        const segmentGeometry = new THREE.BoxGeometry(1.5, 1, 2);
        const segmentMaterial = new THREE.MeshPhongMaterial({
          color: this.accentColor,
          emissive: this.accentColor,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9,
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.set(0, 0, -3 - j * 2.5);
        arm.add(segment);
      }
    }

    // Pixel shader arrays - floating around the boss
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8;

      const shaderGeometry = new THREE.BoxGeometry(1, 1, 1);
      const shaderMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: this.secondaryColor,
        emissiveIntensity: 1.5,
      });
      const shader = new THREE.Mesh(shaderGeometry, shaderMaterial);
      shader.userData = {
        angle: angle,
        radius: radius,
        orbitSpeed: 1 + i * 0.1,
        verticalOffset: Math.random() * 2,
      };
      this.group.add(shader);
      this.pixelClusters.push(shader);
    }

    // Frame buffer rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(4 + i * 2, 0.3, 16, 32);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.accentColor,
        emissive: this.accentColor,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { baseY: i * 2, spinSpeed: 1 + i * 0.5 };
      this.group.add(ring);
      this.frameBuffers.push(ring);
    }

    // GPU fans on sides
    const fanGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 8);
    const fanMaterial = new THREE.MeshPhongMaterial({
      color: 0x330044,
      emissive: this.color,
      emissiveIntensity: 0.5,
    });

    for (let side of [-1, 1]) {
      const fan = new THREE.Mesh(fanGeometry, fanMaterial.clone());
      fan.rotation.z = Math.PI / 2;
      fan.position.x = side * 6;
      this.group.add(fan);

      // Fan blades
      const bladeGeometry = new THREE.BoxGeometry(0.5, 0.2, 4);
      const bladeMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      });

      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial.clone());
        blade.position.z = 2;
        blade.rotation.z = (b / 6) * Math.PI * 2;
        fan.add(blade);
      }

      fan.userData = { side: side };
    }

    // Tensor cores - glowing compute units
    const tensorGeometry = new THREE.OctahedronGeometry(0.8, 0);
    const tensorMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffaa,
      emissive: 0x00ffcc,
      emissiveIntensity: 2,
    });

    for (let i = 0; i < 8; i++) {
      const tensor = new THREE.Mesh(tensorGeometry, tensorMaterial.clone());
      const angle = (i / 8) * Math.PI * 2;
      tensor.position.set(
        Math.cos(angle) * 4,
        -1 + (i % 2),
        Math.sin(angle) * 4
      );
      this.group.add(tensor);
    }

    // Heat sink spikes
    for (let i = 0; i < 16; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.4, 2, 6);
      const spikeMaterial = new THREE.MeshPhongMaterial({
        color: this.accentColor,
        emissive: this.accentColor,
        emissiveIntensity: 0.7,
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 16) * Math.PI * 2;
      const radius = 5.5;
      spike.position.set(
        Math.cos(angle) * radius,
        -2,
        Math.sin(angle) * radius
      );
      spike.rotation.y = angle;
      spike.rotation.x = Math.PI;
      this.group.add(spike);
    }

    // Ray tracing cores
    const rtCoreGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const rtCoreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      emissive: 0xffdd00,
      emissiveIntensity: 1.8,
    });

    for (let i = 0; i < 6; i++) {
      const rtCore = new THREE.Mesh(rtCoreGeometry, rtCoreMaterial.clone());
      const angle = (i / 6) * Math.PI * 2;
      rtCore.position.set(
        Math.cos(angle) * 6.5,
        Math.sin(i) * 2,
        Math.sin(angle) * 6.5
      );
      this.group.add(rtCore);
    }

    this.group.scale.set(1.6, 1.6, 1.6);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!this.fullySpawned) {
      this.updateSpawnAnimation(deltaTime);
      return;
    }

    this.time += deltaTime;
    this.renderTime += deltaTime;

    // Update phase
    const healthPercent = this.health / this.maxHealth;
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (healthPercent <= this.phases[i].healthPercent) {
        if (this.currentPhaseIndex !== i) {
          this.currentPhaseIndex = i;
          this.onPhaseChange(i);
        }
        break;
      }
    }

    // Hover and orbit movement
    if (playerPosition) {
      const distanceToPlayer = this.position.distanceTo(playerPosition);

      // Orbit around player
      this.orbitAngle +=
        deltaTime * 0.4 * this.phases[this.currentPhaseIndex].speedMultiplier;
      const targetX =
        playerPosition.x + Math.cos(this.orbitAngle) * this.orbitRadius;
      const targetZ =
        playerPosition.z + Math.sin(this.orbitAngle) * this.orbitRadius;

      const direction = new THREE.Vector3(
        targetX - this.position.x,
        0,
        targetZ - this.position.z
      ).normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      this.position.y = this.hoverHeight + Math.sin(this.time * 1.5) * 2;

      // Face player
      const angleToPlayer = Math.atan2(
        playerPosition.z - this.position.z,
        playerPosition.x - this.position.x
      );
      this.group.rotation.y = angleToPlayer + Math.PI / 2;

      // Attack patterns based on phase
      if (this.attackCooldown <= 0) {
        this.performAttacks(playerPosition);
      }
    }

    // Animate core
    if (this.core) {
      this.core.rotation.y = this.time * 2;
    }

    // Animate energy sphere
    if (this.energySphere) {
      this.energySphere.material.emissiveIntensity =
        1.5 + Math.sin(this.time * 6) * 0.5;
      this.energySphere.rotation.x = this.time * 3;
      this.energySphere.rotation.z = this.time * 2;
      this.energySphere.scale.setScalar(1 + Math.sin(this.time * 4) * 0.15);
    }

    // Animate pixel clusters - orbit around boss
    this.pixelClusters.forEach((cluster, i) => {
      const data = cluster.userData;
      const angle = data.angle + this.time * data.orbitSpeed;
      cluster.position.set(
        Math.cos(angle) * data.radius,
        Math.sin(angle * 2) * 2 + data.verticalOffset,
        Math.sin(angle) * data.radius
      );
      cluster.rotation.x = this.time * 2 + i;
      cluster.rotation.y = this.time * 3 + i;
      cluster.material.emissiveIntensity =
        1 + Math.sin(this.time * 5 + i) * 0.5;
    });

    // Animate frame buffer rings
    this.frameBuffers.forEach((ring, i) => {
      ring.rotation.z = this.time * ring.userData.spinSpeed;
      ring.position.y = Math.sin(this.time * 2 + i) * 1.5 + ring.userData.baseY;
      ring.material.opacity = 0.4 + Math.sin(this.time * 3 + i) * 0.2;
    });

    // Animate core light
    if (this.coreLight) {
      this.coreLight.intensity = 5 + Math.sin(this.time * 8) * 2;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isHoming && playerPosition) {
        const toPlayer = new THREE.Vector3()
          .subVectors(playerPosition, proj.position)
          .normalize();
        proj.velocity.lerp(
          toPlayer.multiplyScalar(proj.velocity.length()),
          0.1
        );
        proj.velocity
          .normalize()
          .multiplyScalar(proj.speed || this.projectileSpeed);
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 20;
        proj.mesh.rotation.y += deltaTime * 15;
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
  }

  performAttacks(playerPosition) {
    const phase = this.currentPhaseIndex;

    if (phase === 0) {
      // Phase 1: Render blast
      this.renderBlast(playerPosition);
      this.attackCooldown = 2.0;
    } else if (phase === 1) {
      // Phase 2: Render blast + Pixel storm
      this.renderBlast(playerPosition);
      this.pixelStorm(playerPosition);
      this.attackCooldown = 1.8;
    } else if (phase === 2) {
      // Phase 3: All attacks + Shader beam
      this.renderBlast(playerPosition);
      this.pixelStorm(playerPosition);
      this.shaderBeam(playerPosition);
      this.attackCooldown = 1.5;
    } else if (phase === 3) {
      // Phase 4: Critical - all attacks + frame buffer overflow
      this.renderBlast(playerPosition);
      this.pixelStorm(playerPosition);
      this.shaderBeam(playerPosition);
      this.frameBufferOverflow(playerPosition);
      this.attackCooldown = 1.0;
    }
  }

  renderBlast(playerPosition) {
    // GPU render burst
    const burstCount = this.isEnraged ? 12 : 8;
    for (let i = 0; i < burstCount; i++) {
      const spreadAngle = (i - burstCount / 2) * 0.2;
      const baseDirection = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const direction = new THREE.Vector3(
        baseDirection.x * Math.cos(spreadAngle) -
          baseDirection.z * Math.sin(spreadAngle),
        -0.2,
        baseDirection.x * Math.sin(spreadAngle) +
          baseDirection.z * Math.cos(spreadAngle)
      );

      this.createProjectile(
        direction,
        this.damage * 1.3,
        this.color,
        "pixel",
        this.projectileSpeed + 8,
        false
      );
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, this.color, 50);
    }
  }

  pixelStorm(playerPosition) {
    // Radial pixel burst
    const pixelCount = 16;
    for (let i = 0; i < pixelCount; i++) {
      const angle = (i / pixelCount) * Math.PI * 2;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(this.time * 5 + i) * 0.3,
        Math.sin(angle)
      ).normalize();

      this.createProjectile(
        direction,
        this.damage * 0.8,
        this.secondaryColor,
        "cube",
        this.projectileSpeed + 5,
        false
      );
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position,
        12,
        this.secondaryColor
      );
    }
  }

  shaderBeam(playerPosition) {
    // Focused beam attack
    const beamCount = this.isEnraged ? 5 : 3;
    for (let i = 0; i < beamCount; i++) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      // Add slight random offset
      direction.x += (Math.random() - 0.5) * 0.2;
      direction.z += (Math.random() - 0.5) * 0.2;
      direction.normalize();

      this.createProjectile(
        direction,
        this.damage * 1.5,
        this.accentColor,
        "beam",
        this.projectileSpeed + 15,
        true
      );
    }
  }

  frameBufferOverflow(playerPosition) {
    // Massive area attack - data corruption
    const overflowCount = 20;
    for (let i = 0; i < overflowCount; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        5,
        (Math.random() - 0.5) * 20
      );
      const targetPos = playerPosition.clone().add(offset);

      const direction = new THREE.Vector3()
        .subVectors(targetPos, this.position)
        .normalize();

      this.createProjectile(
        direction,
        this.damage * 1.8,
        0xff0000,
        "overflow",
        this.projectileSpeed + 10,
        false
      );
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(playerPosition, 0xff0000, 100);
    }
  }

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
      case "pixel":
        projGeometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case "cube":
        projGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        break;
      case "beam":
        projGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
        break;
      case "overflow":
        projGeometry = new THREE.IcosahedronGeometry(1.2, 0);
        break;
      default:
        projGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    }

    const projMaterial = this.createGlowMaterial(color, 2.5);
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
      lifetime: 8,
      collisionRadius: 0.8,
      speed: speed || this.projectileSpeed,
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

  onPhaseChange(newPhase) {
    console.log(
      `🎮 PIXEL REAPER entering phase ${newPhase + 1}: ${
        this.phases[newPhase].name
      }`
    );

    // Visual feedback for phase change
    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, this.accentColor, 120);
    }

    // Increase aggressiveness
    if (newPhase >= 2) {
      this.isEnraged = true;
      this.speed *= 1.3;
      this.orbitRadius = 25; // Get closer
    }

    // Overheat effect
    if (newPhase >= 3) {
      if (this.energySphere) {
        this.energySphere.material.emissiveIntensity = 3;
        this.energySphere.material.color.setHex(0xff0000);
        this.energySphere.material.emissive.setHex(0xff0000);
      }
    }

    // Flash effect
    if (this.core) {
      this.core.material.emissiveIntensity = 2;
      setTimeout(() => {
        if (this.core) {
          this.core.material.emissiveIntensity = 0.8;
        }
      }, 500);
    }
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount *= 0.3;
      if (this.particleSystem) {
        this.particleSystem.createImpact(this.position, this.accentColor, 20);
      }
    }

    super.takeDamage(amount);

    // Flash when hit
    if (this.energySphere) {
      this.energySphere.material.color.setHex(0xff0000);
      setTimeout(() => {
        if (this.energySphere) {
          this.energySphere.material.color.setHex(this.secondaryColor);
        }
      }, 100);
    }
  }
}
