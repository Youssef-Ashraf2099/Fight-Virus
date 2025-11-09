class DataWyrm extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Boss identity
    this.bossName = "DATA WYRM";
    this.bossTitle = "Corrupted Guardian of the Mainframe";

    // Enhanced stats for dragon boss
    this.maxHealth = 6000 * difficulty;
    this.health = this.maxHealth;
    this.damage = 45 * difficulty;
    this.speed = 7;
    this.collisionRadius = 4;
    this.scoreValue = 15000;

    // Dragon colors - red with black and cyan accents
    this.color = 0xff0033;
    this.secondaryColor = 0x00ffff;
    this.accentColor = 0x1a1a1a;

    // Boss phases
    this.phases = [
      { healthPercent: 1.0, name: "Awakening", speedMultiplier: 1.0 },
      { healthPercent: 0.75, name: "Rising Fury", speedMultiplier: 1.2 },
      { healthPercent: 0.5, name: "Dragon's Wrath", speedMultiplier: 1.4 },
      { healthPercent: 0.25, name: "Final Rampage", speedMultiplier: 1.7 },
    ];

    // Dragon-specific properties
    this.wingBeatTime = 0;
    this.tailSegments = [];
    this.lightningCharges = [];
    this.isFlying = true;
    this.flyHeight = 8;
    this.circleRadius = 25;
    this.circleAngle = 0;

    // Attack patterns
    this.attackCooldown = 0;
    this.projectileSpeed = 28;
    this.projectiles = [];

    // Special abilities
    this.canBreatheFire = true;
    this.canSummonLightning = true;
    this.canDiveBomb = true;

    // Spawn elevation for flying boss
    this.spawnElevation = this.flyHeight;

    this.createDragonModel();
  }

  createDragonModel() {
    // Dragon body - sleek and menacing
    const bodyGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 12);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.accentColor,
      emissive: this.color,
      emissiveIntensity: 0.6,
      shininess: 100,
      metalness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    this.group.add(body);

    // Dragon head - fierce and sharp
    const headGeometry = new THREE.ConeGeometry(2.2, 4, 8);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      shininess: 120,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.z = -Math.PI / 2;
    head.position.set(6, 0, 0);
    this.group.add(head);
    this.head = head;

    // Glowing eye
    const eyeGeometry = new THREE.SphereGeometry(0.5, 12, 12);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2,
    });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(7, 0.8, 0.5);
    this.group.add(eye);

    // Eye light
    const eyeLight = new THREE.PointLight(0xff0000, 3, 15);
    eyeLight.position.copy(eye.position);
    this.group.add(eyeLight);
    this.eyeLight = eyeLight;

    // Dragon horns
    for (let i = 0; i < 4; i++) {
      const hornGeometry = new THREE.ConeGeometry(0.3, 2, 6);
      const hornMaterial = new THREE.MeshPhongMaterial({
        color: this.accentColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 0.6,
        shininess: 100,
      });
      const horn = new THREE.Mesh(hornGeometry, hornMaterial);
      const angle = (i / 4) * Math.PI * 2;
      horn.position.set(
        6.5 + Math.cos(angle) * 0.8,
        Math.sin(angle) * 0.8,
        Math.cos(angle + Math.PI / 4) * 0.8
      );
      horn.rotation.z = angle;
      this.group.add(horn);
    }

    // Dragon wings - large and menacing
    const wingGeometry = new THREE.BoxGeometry(0.5, 12, 8);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      shininess: 90,
      side: THREE.DoubleSide,
    });

    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, 6);
    leftWing.rotation.y = Math.PI / 6;
    this.group.add(leftWing);
    this.leftWing = leftWing;

    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
    rightWing.position.set(0, 0, -6);
    rightWing.rotation.y = -Math.PI / 6;
    this.group.add(rightWing);
    this.rightWing = rightWing;

    // Wing energy fields
    for (let wing of [leftWing, rightWing]) {
      for (let i = 0; i < 3; i++) {
        const veinGeometry = new THREE.BoxGeometry(0.2, 10, 0.2);
        const veinMaterial = new THREE.MeshPhongMaterial({
          color: this.secondaryColor,
          emissive: this.secondaryColor,
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.7,
        });
        const vein = new THREE.Mesh(veinGeometry, veinMaterial);
        vein.position.set(0, (i - 1) * 3, 0);
        wing.add(vein);
      }
    }

    // Dragon tail - segmented and powerful
    const tailSegmentCount = 8;
    for (let i = 0; i < tailSegmentCount; i++) {
      const scale = 1 - i * 0.08;
      const segmentGeometry = new THREE.SphereGeometry(1.5 * scale, 10, 10);
      const segmentMaterial = new THREE.MeshPhongMaterial({
        color: this.accentColor,
        emissive: this.color,
        emissiveIntensity: 0.4 + i * 0.05,
        shininess: 100,
      });
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.position.set(-4 - i * 1.5, 0, 0);
      this.group.add(segment);
      this.tailSegments.push(segment);

      // Tail spikes
      if (i % 2 === 0) {
        const spikeGeometry = new THREE.ConeGeometry(0.4, 1.5, 6);
        const spikeMaterial = new THREE.MeshPhongMaterial({
          color: this.secondaryColor,
          emissive: this.secondaryColor,
          emissiveIntensity: 0.8,
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.y = 1.5 * scale;
        segment.add(spike);
      }
    }

    // Core energy sphere - the heart
    const coreGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, -1, 0);
    this.group.add(core);
    this.core = core;

    // Core light
    const coreLight = new THREE.PointLight(this.secondaryColor, 5, 25);
    coreLight.position.copy(core.position);
    this.group.add(coreLight);
    this.coreLight = coreLight;

    // Lightning charge nodes around the dragon
    for (let i = 0; i < 6; i++) {
      const chargeGeometry = new THREE.SphereGeometry(0.4, 12, 12);
      const chargeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: this.secondaryColor,
        emissiveIntensity: 2,
      });
      const charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
      const angle = (i / 6) * Math.PI * 2;
      charge.userData = { angle, radius: 5, orbitSpeed: 1 + i * 0.2 };
      this.group.add(charge);
      this.lightningCharges.push(charge);
    }

    this.group.scale.set(1.5, 1.5, 1.5);
    this.group.position.copy(this.position);
    this.group.visible = false;
    this.scene.add(this.group);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!this.fullySpawned) {
      this.updateSpawnAnimation(deltaTime);
      return;
    }

    this.time += deltaTime;
    this.wingBeatTime += deltaTime;

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

    // Flying movement - circle around player
    if (playerPosition) {
      const distanceToPlayer = this.position.distanceTo(playerPosition);

      // Circle strafe around player
      this.circleAngle +=
        deltaTime * 0.5 * this.phases[this.currentPhaseIndex].speedMultiplier;
      const targetX =
        playerPosition.x + Math.cos(this.circleAngle) * this.circleRadius;
      const targetZ =
        playerPosition.z + Math.sin(this.circleAngle) * this.circleRadius;

      const direction = new THREE.Vector3(
        targetX - this.position.x,
        0,
        targetZ - this.position.z
      ).normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
      this.position.y = this.flyHeight + Math.sin(this.time * 2) * 1.5;

      // Face movement direction
      const lookAngle = Math.atan2(direction.z, direction.x);
      this.group.rotation.y = lookAngle;

      // Attack patterns based on phase
      if (this.attackCooldown <= 0) {
        this.performAttacks(playerPosition);
      }
    }

    // Animate wings
    const wingBeat = Math.sin(this.wingBeatTime * 6) * 0.3;
    if (this.leftWing) {
      this.leftWing.rotation.y = Math.PI / 6 + wingBeat;
    }
    if (this.rightWing) {
      this.rightWing.rotation.y = -Math.PI / 6 - wingBeat;
    }

    // Animate tail - wave motion
    this.tailSegments.forEach((segment, i) => {
      const wave = Math.sin(this.time * 3 + i * 0.5) * 0.3;
      segment.position.y = wave;
      segment.rotation.z = wave * 0.5;
    });

    // Animate core
    if (this.core) {
      this.core.material.emissiveIntensity =
        1.2 + Math.sin(this.time * 4) * 0.3;
      this.core.rotation.y = this.time * 2;
    }

    // Animate lightning charges - orbit around dragon
    this.lightningCharges.forEach((charge, i) => {
      const data = charge.userData;
      const angle = data.angle + this.time * data.orbitSpeed;
      charge.position.set(
        Math.cos(angle) * data.radius,
        Math.sin(angle * 2) * 2,
        Math.sin(angle) * data.radius
      );
      charge.material.emissiveIntensity =
        1.5 + Math.sin(this.time * 5 + i) * 0.5;
    });

    // Animate eye light
    if (this.eyeLight) {
      this.eyeLight.intensity = 3 + Math.sin(this.time * 10) * 0.5;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      if (proj.isHoming && playerPosition) {
        const toPlayer = new THREE.Vector3()
          .subVectors(playerPosition, proj.position)
          .normalize();
        proj.velocity.lerp(
          toPlayer.multiplyScalar(proj.velocity.length()),
          0.08
        );
        proj.velocity
          .normalize()
          .multiplyScalar(proj.speed || this.projectileSpeed);
      }

      if (!this._advanceProjectile(proj, deltaTime)) {
        return false;
      }

      if (proj.mesh) {
        proj.mesh.rotation.x += deltaTime * 15;
        proj.mesh.rotation.y += deltaTime * 10;
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
      // Phase 1: Fire breath
      this.breathFire(playerPosition);
      this.attackCooldown = 2.5;
    } else if (phase === 1) {
      // Phase 2: Fire breath + Lightning strikes
      this.breathFire(playerPosition);
      this.summonLightning(playerPosition);
      this.attackCooldown = 2.0;
    } else if (phase === 2) {
      // Phase 3: All attacks + Tail sweep
      this.breathFire(playerPosition);
      this.summonLightning(playerPosition);
      this.tailSweep();
      this.attackCooldown = 1.5;
    } else if (phase === 3) {
      // Phase 4: Enraged - all attacks + dive bomb
      this.breathFire(playerPosition);
      this.summonLightning(playerPosition);
      this.tailSweep();
      this.diveBomb(playerPosition);
      this.attackCooldown = 1.0;
    }
  }

  breathFire(playerPosition) {
    const spread = this.isEnraged ? 10 : 5;
    for (let i = 0; i < spread; i++) {
      const spreadAngle = (i - spread / 2) * 0.15;
      const baseDirection = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const direction = new THREE.Vector3(
        baseDirection.x * Math.cos(spreadAngle) -
          baseDirection.z * Math.sin(spreadAngle),
        -0.3, // Angle downward
        baseDirection.x * Math.sin(spreadAngle) +
          baseDirection.z * Math.cos(spreadAngle)
      );

      this.createProjectile(
        direction,
        this.damage * 1.2,
        this.color,
        "fireball",
        this.projectileSpeed + 5,
        false
      );
    }

    // Fire breath particle effect
    if (this.particleSystem) {
      const mouthPos = this.position.clone();
      mouthPos.x += Math.cos(this.group.rotation.y) * 6;
      mouthPos.z += Math.sin(this.group.rotation.y) * 6;
      this.particleSystem.createExplosion(mouthPos, this.color, 40);
    }
  }

  summonLightning(playerPosition) {
    const strikes = this.isEnraged ? 5 : 3;
    for (let i = 0; i < strikes; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        0,
        (Math.random() - 0.5) * 15
      );
      const strikePos = playerPosition.clone().add(offset);

      // Create lightning bolt visual
      const boltGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 6);
      const boltMaterial = new THREE.MeshPhongMaterial({
        color: this.secondaryColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9,
      });
      const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      bolt.position.copy(strikePos);
      bolt.position.y = 10;
      this.scene.add(bolt);

      // Fade and remove
      setTimeout(() => {
        if (bolt.parent) {
          this.scene.remove(bolt);
          bolt.geometry.dispose();
          bolt.material.dispose();
        }
      }, 300);

      // Create ground impact projectile
      const direction = new THREE.Vector3(0, -1, 0);
      this.createProjectile(
        direction,
        this.damage * 1.5,
        this.secondaryColor,
        "lightning",
        40,
        false
      );

      if (this.particleSystem) {
        this.particleSystem.createExplosion(strikePos, this.secondaryColor, 30);
      }
    }
  }

  tailSweep() {
    // Radial burst from tail
    const projectileCount = 12;
    for (let i = 0; i < projectileCount; i++) {
      const angle = (i / projectileCount) * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

      this.createProjectile(
        direction,
        this.damage,
        this.accentColor,
        "spike",
        this.projectileSpeed + 10,
        false
      );
    }

    if (this.particleSystem) {
      const tailPos = this.position.clone();
      tailPos.x -= Math.cos(this.group.rotation.y) * 8;
      tailPos.z -= Math.sin(this.group.rotation.y) * 8;
      this.particleSystem.createShockwave(tailPos, 15, this.color);
    }
  }

  diveBomb(playerPosition) {
    // High-speed projectiles diving down
    for (let i = 0; i < 8; i++) {
      const offset = (Math.random() - 0.5) * 10;
      const targetPos = playerPosition.clone();
      targetPos.x += offset;
      targetPos.z += offset;

      const direction = new THREE.Vector3()
        .subVectors(targetPos, this.position)
        .normalize();

      this.createProjectile(
        direction,
        this.damage * 2,
        0xff6600,
        "meteor",
        this.projectileSpeed + 15,
        true
      );
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
      case "fireball":
        projGeometry = new THREE.SphereGeometry(0.8, 12, 12);
        break;
      case "lightning":
        projGeometry = new THREE.OctahedronGeometry(0.7, 0);
        break;
      case "spike":
        projGeometry = new THREE.ConeGeometry(0.5, 2, 6);
        break;
      case "meteor":
        projGeometry = new THREE.IcosahedronGeometry(1, 0);
        break;
      default:
        projGeometry = new THREE.SphereGeometry(0.7, 12, 12);
    }

    const projMaterial = this.createGlowMaterial(color, 2);
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
      collisionRadius: 0.7,
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
      `🐉 DATA WYRM entering phase ${newPhase + 1}: ${
        this.phases[newPhase].name
      }`
    );

    // Visual feedback for phase change
    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        100
      );
    }

    // Increase aggressiveness
    if (newPhase >= 2) {
      this.isEnraged = true;
      this.speed *= 1.2;
      this.circleRadius = 20; // Get closer
    }

    // Flash effect
    if (this.core) {
      this.core.material.emissiveIntensity = 3;
      setTimeout(() => {
        if (this.core) {
          this.core.material.emissiveIntensity = 1.5;
        }
      }, 500);
    }
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount *= 0.3; // 70% damage reduction with shield
      if (this.particleSystem) {
        this.particleSystem.createImpact(
          this.position,
          this.secondaryColor,
          15
        );
      }
    }

    super.takeDamage(amount);

    // Flash red when hit
    if (this.core) {
      this.core.material.color.setHex(0xff0000);
      setTimeout(() => {
        if (this.core) {
          this.core.material.color.setHex(this.secondaryColor);
        }
      }, 100);
    }
  }
}
