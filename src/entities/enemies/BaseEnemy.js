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

    // Attack system
    this.attackType = "melee"; // melee, ranged, charger, aoe
    this.attackRange = 3;
    this.projectileSpeed = 15;
    this.projectiles = [];
    this.isBoss = false;

    // Attack zone system - prevents all enemies attacking at once
    this.aggroRange = 20; // Distance to start attacking
    this.deAggroRange = 30; // Distance to stop attacking
    this.isAggressive = false; // Whether enemy is actively attacking
    this.passiveWanderRadius = 15; // How far to wander when not aggressive

    this.group = new THREE.Group();
    this.time = 0;
    this.alive = true;
    this.spawnElevation = null; // Allows specific enemies to control spawn height
    this.environment = null;

    // Reusable vectors for projectile movement checks
    this._tempProjectilePrev = new THREE.Vector3();
    this._tempProjectileStep = new THREE.Vector3();
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

    // Update projectiles if enemy has ranged attacks
    this.updateProjectiles(deltaTime);

    // Update mesh position
    this.group.position.copy(this.position);

    // Animation update
    this.animate(deltaTime);
  }

  updateBehavior(deltaTime, playerPosition) {
    // Default behavior with attack zones
    if (!playerPosition) return;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // Check aggro range
    if (!this.isAggressive && distanceToPlayer <= this.aggroRange) {
      this.isAggressive = true;
      this.behaviorState = "chasing";
    } else if (this.isAggressive && distanceToPlayer > this.deAggroRange) {
      this.isAggressive = false;
      this.behaviorState = "idle";
    }

    // Bosses are always aggressive
    if (this.isBoss) {
      this.isAggressive = true;
    }

    if (this.isAggressive) {
      // Move toward player when aggressive
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Passive wandering behavior
      if (this.behaviorState === "idle" || Math.random() < 0.01) {
        this.behaviorState = "wandering";
        this.wanderTarget = new THREE.Vector3(
          this.position.x + (Math.random() - 0.5) * this.passiveWanderRadius,
          0,
          this.position.z + (Math.random() - 0.5) * this.passiveWanderRadius
        );
      }

      if (this.behaviorState === "wandering" && this.wanderTarget) {
        const direction = new THREE.Vector3()
          .subVectors(this.wanderTarget, this.position)
          .normalize();

        this.position.add(
          direction.multiplyScalar(this.speed * 0.3 * deltaTime)
        );

        // Stop wandering when close to target
        if (this.position.distanceTo(this.wanderTarget) < 2) {
          this.behaviorState = "idle";
        }
      }
    }
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
    return this.projectiles || [];
  }

  // Attack methods for different enemy types
  performMeleeAttack(playerPosition) {
    if (this.attackCooldown > 0) return false;

    const distance = this.position.distanceTo(playerPosition);
    if (distance <= this.attackRange) {
      this.attackCooldown = 1.5; // Melee attack cooldown
      return { type: "melee", damage: this.damage };
    }
    return false;
  }

  performRangedAttack(playerPosition) {
    if (this.attackCooldown > 0 || !this.projectiles) return false;

    const distance = this.position.distanceTo(playerPosition);
    if (distance <= this.attackRange && distance > 5) {
      this.shootProjectile(playerPosition);
      this.attackCooldown = 2; // Ranged attack cooldown
      return true;
    }
    return false;
  }

  performChargeAttack(playerPosition) {
    if (this.attackCooldown > 0) return false;

    const distance = this.position.distanceTo(playerPosition);
    if (distance > 10 && distance < 25) {
      // Charge toward player at high speed
      this.behaviorState = "charging";
      this.stateTimer = 2; // Charge duration
      this.attackCooldown = 4; // Long cooldown after charge
      return true;
    }
    return false;
  }

  performAOEAttack(playerPosition) {
    if (this.attackCooldown > 0) return false;

    const distance = this.position.distanceTo(playerPosition);
    if (distance <= this.attackRange * 1.5) {
      // Create AOE explosion effect
      if (this.particleSystem) {
        this.particleSystem.createExplosion(this.position, this.color, 30);
      }
      this.attackCooldown = 3; // AOE attack cooldown
      return {
        type: "aoe",
        damage: this.damage * 0.7,
        radius: this.attackRange * 1.5,
      };
    }
    return false;
  }

  shootProjectile(targetPosition) {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.position)
      .normalize();

    // Create projectile visual
    const projGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const projMaterial = this.createGlowMaterial(this.color, 1.2);
    const projMesh = new THREE.Mesh(projGeometry, projMaterial);

    projMesh.position.copy(this.position);
    projMesh.position.y += 1; // Spawn at enemy center
    this.scene.add(projMesh);

    const projectile = {
      mesh: projMesh,
      position: this.position.clone(),
      velocity: direction.multiplyScalar(this.projectileSpeed),
      damage: this.damage * 0.8, // Ranged attacks do slightly less damage
      lifetime: 4,
      collisionRadius: 0.3,
      color: this.color,
      getPosition: function () {
        return this.position.clone();
      },
      destroy: function () {
        this.lifetime = 0;
      },
    };

    this.projectiles.push(projectile);
  }

  updateProjectiles(deltaTime) {
    if (!this.projectiles) return;

    this.projectiles = this.projectiles.filter((proj) => {
      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      // Add trail effect
      if (proj.mesh && proj.mesh.material) {
        proj.mesh.material.opacity = Math.max(0.3, proj.lifetime / 4);
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  setEnvironment(environment) {
    this.environment = environment || null;
  }

  _advanceProjectile(projectile, deltaTime, options = {}) {
    if (!projectile || !projectile.position || !projectile.velocity) {
      return true;
    }

    const prevPosition = this._tempProjectilePrev.copy(projectile.position);
    this._tempProjectileStep
      .copy(projectile.velocity)
      .multiplyScalar(deltaTime);
    projectile.position.add(this._tempProjectileStep);

    if (options.syncMesh !== false && projectile.mesh) {
      projectile.mesh.position.copy(projectile.position);
    }

    const radius =
      options.collisionRadius ??
      projectile.collisionRadius ??
      options.defaultRadius ??
      0.3;
    const heightPadding =
      options.heightPadding !== undefined
        ? options.heightPadding
        : radius * 0.5;

    if (
      this._projectileHitsEnvironment(
        prevPosition,
        projectile.position,
        radius,
        heightPadding
      )
    ) {
      this._handleProjectileBlocked(projectile);
      return false;
    }

    return true;
  }

  _projectileHitsEnvironment(
    previousPosition,
    nextPosition,
    radius,
    heightPad
  ) {
    if (
      !this.environment ||
      typeof this.environment.isProjectilePathObstructed !== "function"
    ) {
      return false;
    }

    return this.environment.isProjectilePathObstructed(
      previousPosition,
      nextPosition,
      radius,
      heightPad
    );
  }

  _handleProjectileBlocked(projectile) {
    if (!projectile) {
      return;
    }

    const impactPos = projectile.mesh
      ? projectile.mesh.position.clone()
      : projectile.position.clone();

    let impactColor = this.color || 0xffffff;
    if (projectile.color) {
      impactColor = projectile.color;
    } else if (
      projectile.mesh &&
      projectile.mesh.material &&
      projectile.mesh.material.color &&
      typeof projectile.mesh.material.color.getHex === "function"
    ) {
      impactColor = projectile.mesh.material.color.getHex();
    }

    if (this.particleSystem) {
      this.particleSystem.createImpact(impactPos, impactColor, 8);
    }

    if (typeof projectile.destroy === "function") {
      projectile.destroy();
    } else {
      projectile.lifetime = 0;
    }

    this._disposeProjectile(projectile);
  }

  _disposeProjectile(projectile) {
    if (!projectile) {
      return;
    }

    if (projectile.mesh) {
      this.scene.remove(projectile.mesh);
      if (projectile.mesh.geometry) {
        projectile.mesh.geometry.dispose();
      }

      if (projectile.mesh.material) {
        if (Array.isArray(projectile.mesh.material)) {
          projectile.mesh.material.forEach((mat) => {
            if (mat && typeof mat.dispose === "function") {
              mat.dispose();
            }
          });
        } else if (typeof projectile.mesh.material.dispose === "function") {
          projectile.mesh.material.dispose();
        }
      }
    }
  }

  destroy() {
    if (this.projectiles && this.projectiles.length) {
      this.projectiles.forEach((proj) => this._disposeProjectile(proj));
      this.projectiles = [];
    }

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
