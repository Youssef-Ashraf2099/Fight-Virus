class RootkitVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Rootkit stats - ULTIMATE BOSS - MASSIVE AND INTIMIDATING
    this.maxHealth = 1000 * difficulty;
    this.health = this.maxHealth;
    this.speed = 2;
    this.damage = 45 * difficulty;
    this.contactDamage = 25 * difficulty;
    this.collisionRadius = 6;
    this.scoreValue = 1000;
    this.color = 0x000000;
    this.secondaryColor = 0xff0000;

    this.isBoss = true;
    this.attackType = "hybrid";
    this.attackRange = 30;
    this.projectileSpeed = 20;

    this.aggroRange = 100;
    this.isAggressive = true;

    this.phaseShiftTimer = 0;
    this.currentPhase = 1;
    this.tendrils = [];
    this.projectiles = [];

    this.enrageThreshold = 0.3;
    this.isEnraged = false;
    this.shockwaveTimer = 0;
    this.shockwaveCooldown = 8;

    this.spawnTime = 0;
    this.fullySpawned = false;

    this.createMesh();
  }

  createMesh() {
    const coreGeometry = new THREE.IcosahedronGeometry(5, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.2,
      shininess: 100,
    });
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    const energyGeometry = new THREE.IcosahedronGeometry(3.5, 1);
    const energyMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
    });
    this.energyCore = new THREE.Mesh(energyGeometry, energyMaterial);
    this.group.add(this.energyCore);

    this.orbitalRings = [];
    for (let i = 0; i < 6; i++) {
      const ringGeometry = new THREE.TorusGeometry(6 + i * 1.5, 0.3, 12, 48);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.secondaryColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.8,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData = {
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        speed: 0.5 + Math.random() * 0.5,
      };

      this.orbitalRings.push(ring);
      this.group.add(ring);
    }

    this.tendrilMeshes = [];
    const tendrilMaterial = new THREE.MeshPhongMaterial({
      color: 0x330000,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.8,
    });

    for (let i = 0; i < 12; i++) {
      const tendrilGroup = new THREE.Group();
      const segments = 15;

      for (let j = 0; j < segments; j++) {
        const segmentGeometry = new THREE.CylinderGeometry(
          0.7 - j * 0.045,
          0.7 - (j + 1) * 0.045,
          1.5,
          8
        );

        const segment = new THREE.Mesh(segmentGeometry, tendrilMaterial);
        segment.position.y = -j * 1.5;
        segment.userData = { segmentIndex: j };

        if (j === 0) {
          tendrilGroup.add(segment);
        } else {
          const prev = tendrilGroup.children[tendrilGroup.children.length - 1];
          prev.add(segment);
        }
      }

      const angle = (i / 12) * Math.PI * 2;
      tendrilGroup.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
      tendrilGroup.userData = { baseAngle: angle, offset: i };

      this.tendrilMeshes.push(tendrilGroup);
      this.group.add(tendrilGroup);
    }

    this.spikes = [];
    const spikeGeometry = new THREE.ConeGeometry(0.8, 5, 6);
    const spikeMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.7,
    });

    for (let i = 0; i < 30; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const phi = Math.acos(-1 + (2 * i) / 30);
      const theta = Math.sqrt(30 * Math.PI) * phi;

      spike.position.set(
        Math.cos(theta) * Math.sin(phi) * 6.5,
        Math.cos(phi) * 6.5,
        Math.sin(theta) * Math.sin(phi) * 6.5
      );

      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI);
      spike.userData = { offset: i };

      this.spikes.push(spike);
      this.group.add(spike);
    }

    this.darkMatterParticles = [];
    const particleGeometry = new THREE.OctahedronGeometry(0.4, 0);
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: 0x440000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < 50; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 10 + Math.random() * 6,
        speed: 0.5 + Math.random() * 0.5,
        height: (Math.random() - 0.5) * 12,
      };
      this.darkMatterParticles.push(particle);
      this.group.add(particle);
    }

    this.mainLight = new THREE.PointLight(this.secondaryColor, 5, 40);
    this.group.add(this.mainLight);

    this.pulseLight = new THREE.PointLight(0xffffff, 0, 50);
    this.group.add(this.pulseLight);

    const auraGeometry = new THREE.SphereGeometry(12, 32, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    this.spawnAura = new THREE.Mesh(auraGeometry, auraMaterial);
    this.group.add(this.spawnAura);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (!this.fullySpawned) {
      this.spawnTime += deltaTime;
      const spawnProgress = Math.min(this.spawnTime / 2, 1);

      const scale = spawnProgress * spawnProgress;
      this.group.scale.setScalar(scale);

      if (this.spawnAura) {
        this.spawnAura.material.opacity = 0.6 * (1 - spawnProgress);
        this.spawnAura.scale.setScalar(1 + (1 - spawnProgress) * 2);
      }

      if (spawnProgress >= 1) {
        this.fullySpawned = true;
        if (this.spawnAura) {
          this.group.remove(this.spawnAura);
        }
      }

      return;
    }

    this.mesh.rotation.x += deltaTime * 0.4;
    this.mesh.rotation.y += deltaTime * 0.6;

    this.energyCore.rotation.x -= deltaTime * 1.5;
    this.energyCore.rotation.y -= deltaTime * 1.2;

    const energyScale = 1 + Math.sin(this.time * 3) * 0.3;
    this.energyCore.scale.setScalar(energyScale);

    this.orbitalRings.forEach((ring, index) => {
      ring.rotateOnAxis(
        ring.userData.axis,
        deltaTime * ring.userData.speed * 1.5
      );
      const opacity = 0.8 + Math.sin(this.time * 4 + index) * 0.15;
      ring.material.opacity = opacity;
    });

    this.tendrilMeshes.forEach((tendrilGroup, tendrilIndex) => {
      const baseAngle = tendrilGroup.userData.baseAngle + this.time * 0.7;
      const offset = tendrilGroup.userData.offset;
      const radius = 5 + Math.sin(this.time * 2.5 + offset) * 0.8;

      tendrilGroup.position.set(
        Math.cos(baseAngle) * radius,
        Math.sin(this.time * 1.5 + offset) * 3,
        Math.sin(baseAngle) * radius
      );

      tendrilGroup.traverse((child) => {
        if (child.userData.segmentIndex !== undefined) {
          const segmentIndex = child.userData.segmentIndex;
          child.rotation.z =
            Math.sin(this.time * 4 + segmentIndex * 0.4 + offset) * 0.7;
        }
      });
    });

    const healthRatio = this.health / this.maxHealth;
    this.spikes.forEach((spike, index) => {
      const extension = 1 + (1 - healthRatio) * 0.8;
      spike.scale.y =
        extension + Math.sin(this.time * 5 + spike.userData.offset) * 0.3;
      spike.rotation.y += deltaTime * 3;
    });

    this.darkMatterParticles.forEach((particle, index) => {
      const data = particle.userData;
      const angle = data.angle + this.time * data.speed;

      particle.position.set(
        Math.cos(angle) * data.radius,
        data.height + Math.sin(this.time * 3 + index) * 3,
        Math.sin(angle) * data.radius
      );

      particle.rotation.x += deltaTime * 6;
      particle.rotation.y += deltaTime * 4;
    });

    this.mainLight.intensity = 5 + Math.sin(this.time * 3) * 1;

    if (healthRatio < 0.5 && this.currentPhase === 1) {
      this.currentPhase = 2;
      this.pulseLight.intensity = 10;
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        80
      );
      this.speed *= 1.3;
    }

    if (healthRatio < this.enrageThreshold && !this.isEnraged) {
      this.isEnraged = true;
      this.pulseLight.intensity = 15;
      this.particleSystem.createExplosion(this.position, 0xffffff, 100);
      this.speed *= 1.3;
      this.attackCooldown = 0;
    }

    if (this.pulseLight.intensity > 0) {
      this.pulseLight.intensity -= deltaTime * 3;
    }

    if (this.isEnraged) {
      this.mesh.material.emissiveIntensity =
        1.5 + Math.sin(this.time * 8) * 0.3;
      this.mainLight.intensity = 6 + Math.sin(this.time * 6) * 2;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition || !this.fullySpawned) {
      return;
    }

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    if (this.shockwaveTimer > 0) {
      this.shockwaveTimer -= deltaTime;
    }

    if (
      distanceToPlayer < 12 &&
      this.shockwaveTimer <= 0 &&
      this.particleSystem
    ) {
      this.particleSystem.createShockwave(
        this.position,
        15,
        this.secondaryColor
      );
      this.shockwaveTimer = this.shockwaveCooldown;
    }

    if (this.currentPhase === 1) {
      if (distanceToPlayer > 10) {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      }

      if (this.attackCooldown <= 0) {
        this.shootSpiral(playerPosition);
        this.attackCooldown = 2.5;
      }
    } else if (this.currentPhase === 2 && !this.isEnraged) {
      if (distanceToPlayer > 8) {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      }

      if (this.attackCooldown <= 0) {
        this.shootSpiral(playerPosition);
        this.shootRadial();
        this.attackCooldown = 1.8;
      }
    } else if (this.isEnraged) {
      if (distanceToPlayer > 6) {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      }

      if (this.attackCooldown <= 0) {
        this.shootSpiral(playerPosition);
        this.shootRadial();
        this.shootHoming(playerPosition);
        this.attackCooldown = 1.2;
      }
    }

    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isHoming && playerPosition) {
        const toPlayer = new THREE.Vector3()
          .subVectors(playerPosition, proj.position)
          .normalize();

        proj.velocity.lerp(
          toPlayer.multiplyScalar(proj.velocity.length()),
          0.05
        );
        proj.velocity.normalize().multiplyScalar(22);
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 8;
        proj.mesh.rotation.y += deltaTime * 5;
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  shootSpiral(playerPosition) {
    const numProjectiles = this.isEnraged ? 8 : 5;

    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i / numProjectiles) * Math.PI * 2 + this.time;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      const projGeometry = new THREE.OctahedronGeometry(0.5, 0);
      const projMaterial = this.createGlowMaterial(this.secondaryColor, 1.5);
      const projMesh = new THREE.Mesh(projGeometry, projMaterial);

      projMesh.position.copy(this.position);
      this.scene.add(projMesh);

      const projectile = {
        mesh: projMesh,
        position: this.position.clone(),
        velocity: direction.multiplyScalar(this.projectileSpeed),
        damage: this.damage,
        lifetime: 5,
        collisionRadius: 0.5,
        isHoming: false,
        color: this.secondaryColor,
        getPosition: function () {
          return this.position.clone();
        },
        destroy: function () {
          this.lifetime = 0;
        },
      };

      this.projectiles.push(projectile);
    }
  }

  shootRadial() {
    const numProjectiles = this.isEnraged ? 12 : 8;

    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i / numProjectiles) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      const projGeometry = new THREE.TetrahedronGeometry(0.6, 0);
      const projMaterial = this.createGlowMaterial(0xff0000, 1.5);
      const projMesh = new THREE.Mesh(projGeometry, projMaterial);

      projMesh.position.copy(this.position);
      this.scene.add(projMesh);

      const projectile = {
        mesh: projMesh,
        position: this.position.clone(),
        velocity: direction.multiplyScalar(this.projectileSpeed + 5),
        damage: this.damage * 1.3,
        lifetime: 4,
        collisionRadius: 0.6,
        isHoming: false,
        color: 0xff0000,
        getPosition: function () {
          return this.position.clone();
        },
        destroy: function () {
          this.lifetime = 0;
        },
      };

      this.projectiles.push(projectile);
    }
  }

  shootHoming(playerPosition) {
    const numProjectiles = 4;

    for (let i = 0; i < numProjectiles; i++) {
      const spreadAngle = (i - 1.5) * 0.3;
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

      const projGeometry = new THREE.SphereGeometry(0.5, 12, 12);
      const projMaterial = this.createGlowMaterial(0xff00ff, 1.8);
      const projMesh = new THREE.Mesh(projGeometry, projMaterial);

      projMesh.position.copy(this.position);
      this.scene.add(projMesh);

      const projectile = {
        mesh: projMesh,
        position: this.position.clone(),
        velocity: direction.multiplyScalar(22),
        damage: this.damage * 1.5,
        lifetime: 6,
        collisionRadius: 0.5,
        isHoming: true,
        color: 0xff00ff,
        getPosition: function () {
          return this.position.clone();
        },
        destroy: function () {
          this.lifetime = 0;
        },
      };

      this.projectiles.push(projectile);
    }
  }

  getProjectiles() {
    return this.projectiles;
  }

  takeDamage(amount) {
    super.takeDamage(amount);

    if (this.pulseLight && this.alive) {
      this.pulseLight.intensity = 8;
    }
  }
}
