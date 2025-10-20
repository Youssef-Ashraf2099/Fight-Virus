class BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.position = position.clone();
    this.difficulty = difficulty;

    // Base stats (to be overridden)
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.speed = 5;
    this.damage = 10;
    this.contactDamage = 5;
    this.collisionRadius = 1;
    this.scoreValue = 100;
    this.color = 0xff0000;

    // AI behavior
    this.behaviorState = "idle";
    this.stateTimer = 0;
    this.attackCooldown = 0;

    this.group = new THREE.Group();
    this.time = 0;
    this.alive = true;

    // Reusable temporary vectors to avoid allocations in update loop
    this._tmpDirection = new THREE.Vector3();
  }

  update(deltaTime, playerPosition) {
    if (!this.alive) return;

    this.time += deltaTime;
    this.stateTimer += deltaTime;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // AI behavior update
    this.updateBehavior(deltaTime, playerPosition);

    // Update mesh position
    this.group.position.copy(this.position);

    // Animation update
    this.animate(deltaTime);
  }

  updateBehavior(deltaTime, playerPosition) {
    // Default behavior: move toward player
    if (!playerPosition) return;

    const dir = this._tmpDirection;
    dir.copy(playerPosition).sub(this.position).normalize();
    this.position.add(dir.multiplyScalar(this.speed * deltaTime));
  }

  animate(deltaTime) {
    // Override in subclasses
  }

  takeDamage(amount) {
    this.health -= amount;

    // Visual feedback
    if (this.mesh) {
      const originalColor = this.mesh.material.color.getHex();
      this.mesh.material.color.setHex(0xffffff);

      setTimeout(() => {
        if (this.mesh && this.mesh.material) {
          this.mesh.material.color.setHex(originalColor);
        }
      }, 50);
    }

    if (this.health <= 0) {
      this.alive = false;
    }
  }

  getPosition() {
    return this.position.clone();
  }

  isDead() {
    return !this.alive;
  }

  getProjectiles() {
    return [];
  }

  destroy() {
    if (this.group) {
      this.scene.remove(this.group);

      // Clean up geometries and materials
      this.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  createGlowMaterial(color, intensity = 1) {
    return new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });
  }
}
