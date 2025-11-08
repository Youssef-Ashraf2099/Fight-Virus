class TrojanHorseColossus extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "TROJAN WARHORSE";
    this.bossTitle = "Payload Siege Engine";

    this.maxHealth = 2300 * difficulty;
    this.health = this.maxHealth;
    this.speed = 4.2;
    this.damage = 48 * difficulty;
    this.contactDamage = 28 * difficulty;
    this.collisionRadius = 6.4;
    this.projectileSpeed = 22;
    this.spawnElevation = 1.8;
    this.scoreValue = 4200;
    this.color = 0xffbb55;
    this.secondaryColor = 0xff7733;

    this.phases = [
      { name: "Siege Deployment", healthThreshold: 1.0 },
      { name: "Payload Cascade", healthThreshold: 0.7 },
      { name: "Firewall Breach", healthThreshold: 0.42 },
      { name: "Cataclysm", healthThreshold: 0.18 },
    ];
    this.currentPhaseIndex = 0;

    this.chargeCooldownBase = 6.2;
    this.chargeCooldown = 3.1;
    this.chargeTimer = 0;
    this.charging = false;
    this._chargeDirection = new THREE.Vector3();

    this.barrageCooldownBase = 4.4;
    this.barrageCooldown = 2;
    this.quakeCooldownBase = 7.2;
    this.quakeCooldown = 3.5;

    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldCooldown = 0;

    this._tempVec = new THREE.Vector3();

    this.createSpawnPortal();
    this.createMesh();
  }

  createMesh() {
    const chassisMaterial = new THREE.MeshPhongMaterial({
      color: 0x2f1a05,
      emissive: 0x804016,
      emissiveIntensity: 0.3,
      shininess: 45,
    });

    const bodyGeometry = new THREE.BoxGeometry(10, 5.4, 16);
    this.body = new THREE.Mesh(bodyGeometry, chassisMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    const neckGeometry = new THREE.BoxGeometry(3.5, 4.5, 6);
    const neck = new THREE.Mesh(neckGeometry, chassisMaterial.clone());
    neck.position.set(0, 2.2, 9);
    this.group.add(neck);

    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b2310,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.6,
    });
    const headGeometry = new THREE.BoxGeometry(4, 3, 5);
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 3.3, 12.1);
    this.group.add(this.head);

    const hornGeometry = new THREE.CylinderGeometry(0.4, 0, 3, 8);
    const hornMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.8,
    });
    const hornLeft = new THREE.Mesh(hornGeometry, hornMaterial);
    hornLeft.position.set(-0.7, 4.6, 12.8);
    hornLeft.rotation.x = -Math.PI / 2.4;
    const hornRight = hornLeft.clone();
    hornRight.position.x = 0.7;
    this.group.add(hornLeft);
    this.group.add(hornRight);

    const armorMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a2b12,
      emissive: 0xffaa55,
      emissiveIntensity: 0.5,
      shininess: 80,
    });
    const armorGeometry = new THREE.BoxGeometry(11.5, 1.8, 18);
    const armorPlate = new THREE.Mesh(armorGeometry, armorMaterial);
    armorPlate.position.y = 3.4;
    armorPlate.rotation.x = 0.08;
    this.group.add(armorPlate);

    const legMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a0e04,
      emissive: 0x5f3514,
      emissiveIntensity: 0.4,
    });
    const legGeometry = new THREE.BoxGeometry(2.2, 5.2, 2.2);
    const legOffsets = [
      [-3.8, -2.6],
      [3.8, -2.6],
      [-3.8, 2.6],
      [3.8, 2.6],
    ];
    legOffsets.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial.clone());
      leg.position.set(x, -2.6, z);
      this.group.add(leg);
    });

    const glowStripGeometry = new THREE.BoxGeometry(10.2, 0.3, 0.7);
    const glowStripMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.85,
    });
    const glowStrip = new THREE.Mesh(glowStripGeometry, glowStripMaterial);
    glowStrip.position.set(0, 2.8, 6);
    this.group.add(glowStrip);

    const shieldGeometry = new THREE.SphereGeometry(10.5, 24, 18, 0, Math.PI);
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.shieldMesh.rotation.y = Math.PI;
    this.shieldMesh.position.y = 1.2;
    this.group.add(this.shieldMesh);

    this.coreLight = new THREE.PointLight(this.secondaryColor, 3.8, 50);
    this.coreLight.position.set(0, 2.5, 0);
    this.group.add(this.coreLight);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (!this.fullySpawned) {
      return;
    }

    this.body.rotation.z = Math.sin(this.time * 2.2) * 0.02;
    this.head.rotation.y = Math.sin(this.time * 1.5) * 0.08;

    if (this.coreLight) {
      this.coreLight.intensity = 3.6 + Math.sin(this.time * 4.5) * 0.9;
    }

    if (this.shieldMesh) {
      const targetOpacity = this.shieldActive ? 0.45 : 0;
      this.shieldMesh.material.opacity = THREE.MathUtils.lerp(
        this.shieldMesh.material.opacity,
        targetOpacity,
        deltaTime * 6
      );
    }
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount *= 0.25;
      if (this.particleSystem) {
        this.particleSystem.createImpact(
          this.position,
          this.secondaryColor,
          12
        );
      }
    }
    super.takeDamage(amount);
  }

  onEnrage() {
    super.onEnrage();
    this.chargeCooldownBase *= 0.78;
    this.barrageCooldownBase *= 0.7;
    this.quakeCooldownBase *= 0.75;
  }

  checkPhaseTransition() {
    super.checkPhaseTransition();

    const healthRatio = this.health / this.maxHealth;
    let nextIndex = 0;
    for (let i = 0; i < this.phases.length; i++) {
      if (healthRatio <= this.phases[i].healthThreshold) {
        nextIndex = i;
      }
    }

    if (nextIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = nextIndex;
      this.onPhaseChange(nextIndex);
    }
  }

  onPhaseChange(index) {
    this.speed *= 1.08;
    this.chargeCooldownBase = Math.max(3.6, this.chargeCooldownBase * 0.85);
    this.barrageCooldownBase = Math.max(2.4, this.barrageCooldownBase * 0.82);
    this.quakeCooldownBase = Math.max(4.2, this.quakeCooldownBase * 0.86);

    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, this.color, 80);
      this.particleSystem.createShockwave(
        this.position,
        22,
        this.secondaryColor
      );
    }

    if (this.pulseLight) {
      this.pulseLight.intensity = 18;
    }
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) {
      return;
    }

    this.chargeCooldown = Math.max(0, this.chargeCooldown - deltaTime);
    this.barrageCooldown = Math.max(0, this.barrageCooldown - deltaTime);
    this.quakeCooldown = Math.max(0, this.quakeCooldown - deltaTime);
    this.shieldCooldown = Math.max(0, this.shieldCooldown - deltaTime);

    if (this.shieldActive) {
      this.shieldTimer -= deltaTime;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    } else if (
      this.shieldCooldown <= 0 &&
      this.health < this.maxHealth * 0.75
    ) {
      this.activateShield();
    }

    const toPlayer = this._tempVec.copy(playerPosition).sub(this.position);
    const distance = toPlayer.length();
    const direction = toPlayer.clone().normalize();

    if (direction.lengthSq() > 0) {
      this.group.lookAt(
        playerPosition.x,
        this.position.y + 1.5,
        playerPosition.z
      );
    }

    if (this.charging) {
      const chargeSpeed = this.speed * 3.4;
      this.position.add(
        this._chargeDirection.clone().multiplyScalar(chargeSpeed * deltaTime)
      );
      this.chargeTimer -= deltaTime;
      if (this.chargeTimer <= 0) {
        this.charging = false;
        this.chargeCooldown = this.chargeCooldownBase;
        if (this.particleSystem) {
          this.particleSystem.createShockwave(
            this.position,
            14,
            this.secondaryColor
          );
        }
      }
    } else {
      if (distance > 9) {
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      } else if (distance < 6.5) {
        this.position.add(
          direction.multiplyScalar(-this.speed * 0.6 * deltaTime)
        );
      }
    }

    if (!this.charging && this.chargeCooldown <= 0 && distance > 10) {
      this.startCharge(direction);
    }

    if (this.barrageCooldown <= 0) {
      this.launchPayload(playerPosition);
      this.barrageCooldown = this.barrageCooldownBase;
    }

    if (this.quakeCooldown <= 0 && distance < 14) {
      this.groundQuake();
      this.quakeCooldown = this.quakeCooldownBase;
    }
  }

  startCharge(direction) {
    if (!direction || direction.lengthSq() === 0) {
      return;
    }
    this.charging = true;
    this.chargeTimer = 1.2;
    this._chargeDirection.copy(direction.normalize());
    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        50
      );
    }
  }

  activateShield() {
    this.shieldActive = true;
    this.shieldTimer = 3.2;
    this.shieldCooldown = 12;
    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position,
        20,
        this.secondaryColor
      );
    }
  }

  launchPayload(playerPosition) {
    const bursts = 3 + this.currentPhaseIndex;
    for (let i = 0; i < bursts; i++) {
      const delay = i * 140;
      setTimeout(() => {
        const direction = this._tempVec
          .copy(playerPosition)
          .sub(this.position)
          .normalize();
        direction.y += 0.35;
        direction.normalize();
        this._spawnProjectile({
          direction,
          damage: this.damage * 1.2,
          color: 0xffaa55,
          radius: 0.7,
          speed: this.projectileSpeed * 0.9,
          lifetime: 5.5,
          gravity: -18,
          onExpire: (proj) => {
            if (this.particleSystem) {
              this.particleSystem.createExplosion(
                proj.position,
                this.secondaryColor,
                45
              );
            }
          },
        });
      }, delay);
    }
  }

  groundQuake() {
    const rings = this.isEnraged ? 2 : 1;
    for (let r = 0; r < rings; r++) {
      const count = 14 + this.currentPhaseIndex * 2 + r * 4;
      const speed = 16 + r * 4;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        this._spawnProjectile({
          direction: dir,
          damage: this.damage * 0.9,
          color: 0xff6622,
          radius: 0.55,
          speed,
          lifetime: 2.8 + r * 0.6,
        });
      }
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(this.position, 26, this.color);
    }
  }

  updateProjectiles(deltaTime) {
    this.projectiles = this.projectiles.filter((proj) => {
      if (!proj) {
        return false;
      }

      if (proj.gravity) {
        proj.velocity.y += proj.gravity * deltaTime;
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        if (typeof proj.onExpire === "function") {
          proj.onExpire(proj);
        }
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 4;
        proj.mesh.rotation.z += deltaTime * 5;
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        if (typeof proj.onExpire === "function") {
          proj.onExpire(proj);
        }
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  _spawnProjectile({
    direction,
    speed = this.projectileSpeed,
    damage = this.damage,
    color = this.color,
    radius = 0.6,
    lifetime = 4,
    gravity = 0,
    onExpire = null,
  }) {
    if (!direction) {
      return null;
    }

    const geometry = new THREE.DodecahedronGeometry(radius, 0);
    const material = this.createGlowMaterial(color, 1.4);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    mesh.position.y += 2.4;
    this.scene.add(mesh);

    const projectile = {
      mesh,
      position: mesh.position.clone(),
      velocity: direction.clone().normalize().multiplyScalar(speed),
      damage,
      lifetime,
      collisionRadius: radius,
      gravity,
      color,
      onExpire,
      getPosition() {
        return this.position.clone();
      },
      destroy() {
        this.lifetime = 0;
      },
    };

    this.projectiles.push(projectile);
    return projectile;
  }
}
