class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.maxEnergy = 100;
    this.energy = this.maxEnergy;

    this.speed = 15;
    this.collisionRadius = 1.5;

    // Position
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Special ability cooldown
    this.specialCooldown = 0;
    this.specialCooldownMax = 5;
    this.specialEnergyCost = 50;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();

    // Create advanced player geometry
    const playerGeom = PlayerGeometry.createAdvancedPlayer();

    // Main body - crystalline structure
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });

    this.bodyMesh = new THREE.Mesh(playerGeom.body, bodyMaterial);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Core sphere
    const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x00ff00,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8,
    });

    this.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.group.add(this.coreMesh);

    // Energy rings
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.5, 0.1, 16, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 0.3;
      this.rings.push(ring);
      this.group.add(ring);
    }

    // Shield particles
    this.shieldParticles = [];
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const particleMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 20; i++) {
      const particle = new THREE.Mesh(
        particleGeometry,
        particleMaterial.clone()
      );
      const angle = (i / 20) * Math.PI * 2;
      const radius = 3;
      particle.position.set(
        Math.cos(angle) * radius,
        Math.sin(i * 0.5) * 2,
        Math.sin(angle) * radius
      );
      particle.userData = { angle: angle, offset: i };
      this.shieldParticles.push(particle);
      this.group.add(particle);
    }

    // Point light for glow effect
    this.light = new THREE.PointLight(0x00ff00, 2, 20);
    this.light.position.set(0, 2, 0);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);

    this.time = 0;
  }

  update(deltaTime, moveInput) {
    this.time += deltaTime;

    // Movement
    const moveSpeed = this.speed * deltaTime;
    this.velocity.set(0, 0, 0);

    if (moveInput.forward) this.velocity.z -= moveSpeed;
    if (moveInput.backward) this.velocity.z += moveSpeed;
    if (moveInput.left) this.velocity.x -= moveSpeed;
    if (moveInput.right) this.velocity.x += moveSpeed;

    // Normalize diagonal movement
    if (this.velocity.length() > 0) {
      this.velocity.normalize().multiplyScalar(moveSpeed);
    }

    this.position.add(this.velocity);

    // Constrain to play area
    const boundary = 40;
    this.position.x = Math.max(-boundary, Math.min(boundary, this.position.x));
    this.position.z = Math.max(-boundary, Math.min(boundary, this.position.z));

    this.group.position.copy(this.position);

    // Animate player
    this.bodyMesh.rotation.y += deltaTime * 2;
    this.coreMesh.scale.setScalar(1 + Math.sin(this.time * 3) * 0.1);

    // Animate rings
    this.rings.forEach((ring, index) => {
      ring.rotation.z += deltaTime * (1 + index * 0.5);
      ring.position.y = Math.sin(this.time * 2 + index) * 0.5;
    });

    // Animate shield particles
    this.shieldParticles.forEach((particle) => {
      const offset = particle.userData.offset;
      const angle = particle.userData.angle + this.time;
      const radius = 3 + Math.sin(this.time * 2 + offset) * 0.5;

      particle.position.set(
        Math.cos(angle) * radius,
        Math.sin(this.time * 3 + offset) * 2,
        Math.sin(angle) * radius
      );

      particle.rotation.y += deltaTime * 5;
    });

    // Energy regeneration
    this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 10);

    // Special cooldown
    if (this.specialCooldown > 0) {
      this.specialCooldown -= deltaTime;
    }

    // Update light intensity based on health
    this.light.intensity = 2 * (this.health / this.maxHealth);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Visual feedback
    this.bodyMesh.material.emissiveIntensity = 1;
    setTimeout(() => {
      if (this.bodyMesh) {
        this.bodyMesh.material.emissiveIntensity = 0.5;
      }
    }, 100);
  }

  useSpecialAbility() {
    if (this.specialCooldown > 0 || this.energy < this.specialEnergyCost) {
      return false;
    }

    this.energy -= this.specialEnergyCost;
    this.specialCooldown = this.specialCooldownMax;

    return true;
  }

  applyKnockback(direction, force) {
    const knockback = direction.clone().multiplyScalar(force);
    this.position.add(knockback);
  }

  getPosition() {
    return this.position.clone();
  }

  reset() {
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.specialCooldown = 0;
    this.group.position.copy(this.position);
  }
}
