class RansomwareVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Ransomware stats - Locks area, high damage, armor, AOE attacks
    this.maxHealth = 220 * difficulty;
    this.health = this.maxHealth;
    this.speed = 3;
    this.damage = 28 * difficulty;
    this.contactDamage = 10 * difficulty; // Reduced from 22 for balance
    this.collisionRadius = 1.5;
    this.scoreValue = 200;
    this.color = 0xff6600;

    // Attack configuration - AOE specialist
    this.attackType = "aoe";
    this.attackRange = 8;
    this.aoeRadius = 12;

    this.shieldActive = true;
    this.shieldHealth = 120 * difficulty;
    this.lockdownRadius = 10;

    this.createMesh();
  }

  createMesh() {
    // Create fortress-like virus structure

    // Core vault
    const coreGeometry = new THREE.BoxGeometry(2, 2, 2);
    const coreMaterial = this.createGlowMaterial(this.color, 0.8);
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Lock symbol on each face
    const lockGeometry = new THREE.TorusGeometry(0.5, 0.15, 8, 16);
    const lockMaterial = this.createGlowMaterial(0xffff00, 1);

    this.locks = [];
    const positions = [
      [0, 0, 1.1],
      [0, 0, -1.1], // front, back
      [1.1, 0, 0],
      [-1.1, 0, 0], // right, left
      [0, 1.1, 0],
      [0, -1.1, 0], // top, bottom
    ];

    positions.forEach((pos, index) => {
      const lock = new THREE.Mesh(lockGeometry, lockMaterial);
      lock.position.set(...pos);

      // Orient locks to face outward
      if (index < 2) lock.rotation.y = Math.PI / 2;
      if (index >= 2 && index < 4) lock.rotation.z = Math.PI / 2;

      this.locks.push(lock);
      this.mesh.add(lock);
    });

    // Armor plates
    this.armorPlates = [];
    const plateGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.2);
    const plateMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: this.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
      metalness: 0.8,
    });

    for (let i = 0; i < 6; i++) {
      const plate = new THREE.Mesh(plateGeometry, plateMaterial.clone());
      const angle = (i / 6) * Math.PI * 2;
      const radius = 3;

      plate.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      plate.lookAt(0, 0, 0);
      plate.userData = { angle: angle, radius: radius };

      this.armorPlates.push(plate);
      this.group.add(plate);
    }

    // Shield barrier
    const shieldGeometry = new THREE.IcosahedronGeometry(4, 1);
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.group.add(this.shield);

    // Warning symbols floating around
    this.warningSymbols = [];
    const warningGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const warningMaterial = this.createGlowMaterial(0xff0000, 1);

    for (let i = 0; i < 8; i++) {
      const warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.userData = { angle: (i / 8) * Math.PI * 2 };
      this.warningSymbols.push(warning);
      this.group.add(warning);
    }

    // Chain links
    this.chains = [];
    const chainGeometry = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
    const chainMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      emissive: this.color,
      emissiveIntensity: 0.2,
    });

    for (let i = 0; i < 4; i++) {
      const chain = new THREE.Mesh(chainGeometry, chainMaterial);
      chain.userData = { offset: i };
      this.chains.push(chain);
      this.group.add(chain);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 2, 15);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Rotate core slowly
    this.mesh.rotation.x += deltaTime * 0.3;
    this.mesh.rotation.y += deltaTime * 0.5;

    // Spin locks
    this.locks.forEach((lock) => {
      lock.rotation.z += deltaTime * 2;
    });

    // Armor plates orbit
    this.armorPlates.forEach((plate, index) => {
      const angle = plate.userData.angle + this.time * 0.5;
      const radius =
        plate.userData.radius + Math.sin(this.time * 2 + index) * 0.5;

      plate.position.set(
        Math.cos(angle) * radius,
        Math.sin(this.time + index) * 1,
        Math.sin(angle) * radius
      );

      plate.lookAt(0, 0, 0);

      // Flash when shield active
      if (this.shieldActive) {
        plate.material.opacity = 0.7 + Math.sin(this.time * 5 + index) * 0.2;
      } else {
        plate.material.opacity = 0.3;
      }
    });

    // Shield pulse
    if (this.shieldActive) {
      const scale = 1 + Math.sin(this.time * 3) * 0.1;
      this.shield.scale.setScalar(scale);
      this.shield.rotation.y += deltaTime;
      this.shield.material.opacity = 0.3 + Math.sin(this.time * 4) * 0.1;
    } else {
      this.shield.visible = false;
    }

    // Warning symbols orbit
    this.warningSymbols.forEach((symbol, index) => {
      const angle = symbol.userData.angle + this.time * 2;
      const radius = 5;

      symbol.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 2) * 2,
        Math.sin(angle) * radius
      );

      symbol.rotation.y += deltaTime * 3;
      symbol.rotation.x += deltaTime * 2;
    });

    // Chains dangle
    this.chains.forEach((chain, index) => {
      const offset = chain.userData.offset;
      const angle = (offset / 4) * Math.PI * 2 + this.time * 0.5;
      const radius = 2.5;

      chain.position.set(
        Math.cos(angle) * radius,
        -2 + Math.sin(this.time * 2 + offset) * 0.5,
        Math.sin(angle) * radius
      );

      chain.rotation.x = Math.sin(this.time * 2 + offset) * 0.3;
    });
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    // Slow, tanky movement
    const distanceToPlayer = this.position.distanceTo(playerPosition);

    if (distanceToPlayer > 8) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Perform AOE attack when in range
      if (this.attackCooldown <= 0) {
        this.performAOEAttack(playerPosition);
      }
    }
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      // Shield absorbs damage
      this.shieldHealth -= amount;

      if (this.shieldHealth <= 0) {
        this.shieldActive = false;
        this.shield.visible = false;

        // Visual effect
        this.particleSystem.createExplosion(this.position, 0xff0000, 30);
      } else {
        // Shield flash
        this.shield.material.emissiveIntensity = 1;
        setTimeout(() => {
          if (this.shield && this.shield.material) {
            this.shield.material.emissiveIntensity = 0.5;
          }
        }, 100);
      }
    } else {
      // Take damage normally
      super.takeDamage(amount);
    }
  }
}
