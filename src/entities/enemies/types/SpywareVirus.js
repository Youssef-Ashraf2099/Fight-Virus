class SpywareVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Spyware stats - Stealthy, teleports, ranged attacks
    this.maxHealth = 90 * difficulty;
    this.health = this.maxHealth;
    this.speed = 8;
    this.damage = 18 * difficulty; // Higher ranged damage
    this.contactDamage = 7 * difficulty; // Reduced from 10 for balance
    this.collisionRadius = 1.2;
    this.scoreValue = 120;
    this.color = 0x9900ff;

    // Attack configuration
    this.attackType = "ranged";
    this.attackRange = 22; // Long range
    this.projectileSpeed = 18;

    this.teleportCooldown = 0;
    this.teleportCooldownMax = 5;
    this.projectiles = [];

    this.createMesh();
  }

  createMesh() {
    // Create stealthy, angular virus

    // Main body - crystalline structure
    const angularVertices = new Float32Array([
      0,
      1.5,
      0, // top
      1,
      0,
      1, // front-right
      -1,
      0,
      1, // front-left
      1,
      0,
      -1, // back-right
      -1,
      0,
      -1, // back-left
      0,
      -1.5,
      0, // bottom
    ]);
    const angularIndices = [
      0, 1, 2, 0, 2, 4, 0, 4, 3, 0, 3, 1, 5, 2, 1, 5, 4, 2, 5, 3, 4, 5, 1, 3,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(angularIndices);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(angularVertices, 3)
    );
    geometry.computeVertexNormals();
    const material = this.createGlowMaterial(this.color, 0.7);

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Scanning rings
    this.scanRings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1 + i * 0.3, 0.05, 8, 32);
      const ringMaterial = this.createGlowMaterial(this.color, 0.8);

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { offset: i };

      this.scanRings.push(ring);
      this.group.add(ring);
    }

    // Data streams (particles orbiting)
    this.dataStreams = [];
    const streamGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const streamMaterial = this.createGlowMaterial(0x00ffff, 1);

    for (let i = 0; i < 8; i++) {
      const stream = new THREE.Mesh(streamGeometry, streamMaterial);
      stream.userData = { angle: (i / 8) * Math.PI * 2, radius: 2 };
      this.dataStreams.push(stream);
      this.group.add(stream);
    }

    // Cloaking field (becomes invisible periodically)
    const cloakGeometry = new THREE.IcosahedronGeometry(2, 1);
    const cloakMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
    });
    this.cloakField = new THREE.Mesh(cloakGeometry, cloakMaterial);
    this.group.add(this.cloakField);

    // Point light
    this.light = new THREE.PointLight(this.color, 1.2, 12);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Rotate main body
    this.mesh.rotation.y += deltaTime * 1.5;
    this.mesh.rotation.z = Math.sin(this.time * 2) * 0.2;

    // Scan rings expand and contract
    this.scanRings.forEach((ring, index) => {
      const offset = ring.userData.offset;
      const scale = 1 + Math.sin(this.time * 3 - offset * 0.5) * 0.3;
      ring.scale.setScalar(scale);
      ring.rotation.z += deltaTime * (1 + offset * 0.5);

      const opacity = 0.5 + Math.sin(this.time * 3 - offset * 0.5) * 0.3;
      ring.material.opacity = opacity;
    });

    // Data streams orbit
    this.dataStreams.forEach((stream, index) => {
      const angle = stream.userData.angle + this.time * 2;
      const radius = stream.userData.radius;

      stream.position.set(
        Math.cos(angle) * radius,
        Math.sin(this.time * 3 + index) * 1.5,
        Math.sin(angle) * radius
      );

      stream.rotation.y = angle;
    });

    // Cloak field pulse
    this.cloakField.rotation.y += deltaTime * 0.5;
    const cloakOpacity = 0.1 + Math.sin(this.time * 1.5) * 0.15;
    this.cloakField.material.opacity = cloakOpacity;

    // Stealth effect - periodically become semi-transparent
    const stealthPhase = Math.sin(this.time * 0.5);
    if (stealthPhase > 0.7) {
      this.mesh.material.opacity = 0.3;
      this.light.intensity = 0.3;
    } else {
      this.mesh.material.opacity = 0.9;
      this.light.intensity = 1.2;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Teleport cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= deltaTime;
    }

    // Teleport if player gets too close
    if (distanceToPlayer < 8 && this.teleportCooldown <= 0) {
      this.teleport(playerPosition);
      this.teleportCooldown = this.teleportCooldownMax;
    }

    // Keep distance and shoot
    if (distanceToPlayer > 15) {
      // Move closer
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else if (distanceToPlayer < 12) {
      // Move away
      const direction = new THREE.Vector3()
        .subVectors(this.position, playerPosition)
        .normalize();
      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Strafe
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      this.position.add(perpendicular.multiplyScalar(this.speed * deltaTime));
    }

    // Shoot at player
    if (this.attackCooldown <= 0 && distanceToPlayer < 20) {
      this.shootAtPlayer(playerPosition);
      this.attackCooldown = 2;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.position.add(proj.velocity.clone().multiplyScalar(deltaTime));
      proj.mesh.position.copy(proj.position);

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

  teleport(playerPosition) {
    // Teleport to a random position around the player
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10;

    const newPosition = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * distance,
      0,
      playerPosition.z + Math.sin(angle) * distance
    );

    // Particle effect at old position
    this.particleSystem.createExplosion(this.position, this.color, 20);

    this.position.copy(newPosition);

    // Particle effect at new position
    this.particleSystem.createExplosion(this.position, this.color, 20);
  }

  shootAtPlayer(playerPosition) {
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();

    // Create projectile
    const projGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const projMaterial = this.createGlowMaterial(0xff00ff, 1);
    const projMesh = new THREE.Mesh(projGeometry, projMaterial);

    projMesh.position.copy(this.position);
    this.scene.add(projMesh);

    const projectile = {
      mesh: projMesh,
      position: this.position.clone(),
      velocity: direction.multiplyScalar(20),
      damage: this.damage,
      lifetime: 3,
      collisionRadius: 0.3,
      getPosition: function () {
        return this.position.clone();
      },
      destroy: function () {
        this.lifetime = 0;
      },
    };

    this.projectiles.push(projectile);
  }

  getProjectiles() {
    return this.projectiles;
  }
}
