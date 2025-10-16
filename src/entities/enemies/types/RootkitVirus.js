class RootkitVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Rootkit stats - BOSS, very high health, spawns minions
    this.maxHealth = 500 * difficulty;
    this.health = this.maxHealth;
    this.speed = 2;
    this.damage = 30 * difficulty;
    this.contactDamage = 25 * difficulty;
    this.collisionRadius = 4;
    this.scoreValue = 500;
    this.color = 0x000000;
    this.secondaryColor = 0xff0000;

    this.phaseShiftTimer = 0;
    this.currentPhase = 1;
    this.tendrils = [];
    this.projectiles = [];

    this.createMesh();
  }

  createMesh() {
    // Create massive boss-like structure

    // Core - dark sphere with red energy
    const coreGeometry = new THREE.IcosahedronGeometry(3, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.8,
      shininess: 100,
    });
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Inner energy sphere
    const energyGeometry = new THREE.IcosahedronGeometry(2, 1);
    const energyMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
    });
    this.energyCore = new THREE.Mesh(energyGeometry, energyMaterial);
    this.group.add(this.energyCore);

    // Orbital rings
    this.orbitalRings = [];
    for (let i = 0; i < 4; i++) {
      const ringGeometry = new THREE.TorusGeometry(4 + i, 0.2, 12, 48);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: this.secondaryColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7,
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

    // Tentacle-like tendrils
    this.tendrilMeshes = [];
    const tendrilMaterial = new THREE.MeshPhongMaterial({
      color: 0x330000,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.6,
    });

    for (let i = 0; i < 8; i++) {
      const tendrilGroup = new THREE.Group();
      const segments = 10;

      for (let j = 0; j < segments; j++) {
        const segmentGeometry = new THREE.CylinderGeometry(
          0.5 - j * 0.04,
          0.5 - (j + 1) * 0.04,
          1,
          8
        );

        const segment = new THREE.Mesh(segmentGeometry, tendrilMaterial);
        segment.position.y = -j;
        segment.userData = { segmentIndex: j };

        if (j === 0) {
          tendrilGroup.add(segment);
        } else {
          const prev = tendrilGroup.children[tendrilGroup.children.length - 1];
          prev.add(segment);
        }
      }

      const angle = (i / 8) * Math.PI * 2;
      tendrilGroup.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
      tendrilGroup.userData = { baseAngle: angle, offset: i };

      this.tendrilMeshes.push(tendrilGroup);
      this.group.add(tendrilGroup);
    }

    // Spiky armor
    this.spikes = [];
    const spikeGeometry = new THREE.ConeGeometry(0.5, 3, 6);
    const spikeMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < 20; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const phi = Math.acos(-1 + (2 * i) / 20);
      const theta = Math.sqrt(20 * Math.PI) * phi;

      spike.position.set(
        Math.cos(theta) * Math.sin(phi) * 4,
        Math.cos(phi) * 4,
        Math.sin(theta) * Math.sin(phi) * 4
      );

      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI);
      spike.userData = { offset: i };

      this.spikes.push(spike);
      this.group.add(spike);
    }

    // Dark matter particles
    this.darkMatterParticles = [];
    const particleGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: 0x440000,
      emissive: this.secondaryColor,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 30; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 6 + Math.random() * 4,
        speed: 0.5 + Math.random() * 0.5,
        height: (Math.random() - 0.5) * 8,
      };
      this.darkMatterParticles.push(particle);
      this.group.add(particle);
    }

    // Point lights for dramatic effect
    this.mainLight = new THREE.PointLight(this.secondaryColor, 3, 25);
    this.group.add(this.mainLight);

    this.pulseLight = new THREE.PointLight(0xffffff, 0, 30);
    this.group.add(this.pulseLight);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Rotate main core
    this.mesh.rotation.x += deltaTime * 0.3;
    this.mesh.rotation.y += deltaTime * 0.5;

    // Counter-rotate energy core
    this.energyCore.rotation.x -= deltaTime * 1;
    this.energyCore.rotation.y -= deltaTime * 0.8;

    // Pulse energy core
    const energyScale = 1 + Math.sin(this.time * 2) * 0.2;
    this.energyCore.scale.setScalar(energyScale);

    // Animate orbital rings
    this.orbitalRings.forEach((ring, index) => {
      ring.rotateOnAxis(ring.userData.axis, deltaTime * ring.userData.speed);

      // Pulse based on phase
      const opacity = 0.7 + Math.sin(this.time * 3 + index) * 0.2;
      ring.material.opacity = opacity;
    });

    // Animate tendrils
    this.tendrilMeshes.forEach((tendrilGroup, tendrilIndex) => {
      const baseAngle = tendrilGroup.userData.baseAngle + this.time * 0.5;
      const offset = tendrilGroup.userData.offset;
      const radius = 3 + Math.sin(this.time * 2 + offset) * 0.5;

      tendrilGroup.position.set(
        Math.cos(baseAngle) * radius,
        Math.sin(this.time + offset) * 2,
        Math.sin(baseAngle) * radius
      );

      // Animate each segment
      tendrilGroup.traverse((child) => {
        if (child.userData.segmentIndex !== undefined) {
          const segmentIndex = child.userData.segmentIndex;
          child.rotation.z =
            Math.sin(this.time * 3 + segmentIndex * 0.3 + offset) * 0.5;
        }
      });
    });

    // Extend/retract spikes based on health
    const healthRatio = this.health / this.maxHealth;
    this.spikes.forEach((spike, index) => {
      const extension = 1 + (1 - healthRatio) * 0.5;
      spike.scale.y =
        extension + Math.sin(this.time * 4 + spike.userData.offset) * 0.2;
      spike.rotation.y += deltaTime * 2;
    });

    // Dark matter particles orbit
    this.darkMatterParticles.forEach((particle, index) => {
      const data = particle.userData;
      const angle = data.angle + this.time * data.speed;

      particle.position.set(
        Math.cos(angle) * data.radius,
        data.height + Math.sin(this.time * 2 + index) * 2,
        Math.sin(angle) * data.radius
      );

      particle.rotation.x += deltaTime * 5;
      particle.rotation.y += deltaTime * 3;
    });

    // Dramatic lighting
    this.mainLight.intensity = 3 + Math.sin(this.time * 2) * 0.5;

    // Phase transition effect
    if (healthRatio < 0.5 && this.currentPhase === 1) {
      this.currentPhase = 2;
      this.pulseLight.intensity = 5;
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        50
      );
    }

    if (this.pulseLight.intensity > 0) {
      this.pulseLight.intensity -= deltaTime * 2;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Phase 1: Slow approach with projectile attacks
    if (this.currentPhase === 1) {
      if (distanceToPlayer > 10) {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      }

      // Shoot projectiles
      if (this.attackCooldown <= 0) {
        this.shootSpiral(playerPosition);
        this.attackCooldown = 3;
      }
    }
    // Phase 2: Aggressive, faster, more attacks
    else {
      const enhancedSpeed = this.speed * 1.5;

      if (distanceToPlayer > 8) {
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, this.position)
          .normalize();
        this.position.add(direction.multiplyScalar(enhancedSpeed * deltaTime));
      }

      // More frequent attacks
      if (this.attackCooldown <= 0) {
        this.shootSpiral(playerPosition);
        this.shootRadial();
        this.attackCooldown = 2;
      }
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.position.add(proj.velocity.clone().multiplyScalar(deltaTime));
      proj.mesh.position.copy(proj.position);
      proj.mesh.rotation.x += deltaTime * 5;
      proj.mesh.rotation.y += deltaTime * 3;

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        proj.mesh.material.dispose();
        return false;
      }

      return true;
    });
  }

  shootSpiral(playerPosition) {
    const numProjectiles = 5;

    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i / numProjectiles) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      const projGeometry = new THREE.OctahedronGeometry(0.4, 0);
      const projMaterial = this.createGlowMaterial(this.secondaryColor, 1);
      const projMesh = new THREE.Mesh(projGeometry, projMaterial);

      projMesh.position.copy(this.position);
      this.scene.add(projMesh);

      const projectile = {
        mesh: projMesh,
        position: this.position.clone(),
        velocity: direction.multiplyScalar(15),
        damage: this.damage,
        lifetime: 5,
        collisionRadius: 0.4,
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
    const numProjectiles = 8;

    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i / numProjectiles) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      const projGeometry = new THREE.TetrahedronGeometry(0.5, 0);
      const projMaterial = this.createGlowMaterial(0xff0000, 1);
      const projMesh = new THREE.Mesh(projGeometry, projMaterial);

      projMesh.position.copy(this.position);
      this.scene.add(projMesh);

      const projectile = {
        mesh: projMesh,
        position: this.position.clone(),
        velocity: direction.multiplyScalar(20),
        damage: this.damage * 1.5,
        lifetime: 4,
        collisionRadius: 0.5,
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
}
