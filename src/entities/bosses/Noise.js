class Noise extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "NOISE";
    this.bossTitle = "Corrupted Data Anomaly";

    this.maxHealth = 2600 * difficulty;
    this.health = this.maxHealth;
    this.speed = 6.5;
    this.damage = 48 * difficulty;
    this.contactDamage = 28 * difficulty;
    this.projectileSpeed = 28;
    this.projectileLifetime = 5;
    this.collisionRadius = 4.5;
    this.spawnElevation = 2.6;
    this.scoreValue = 4200;

    this.color = 0xff64c8;
    this.secondaryColor = 0x6f8dff;

    this.phases = [
      { name: "Static Surge", healthPercent: 1 },
      { name: "Data Fragment", healthPercent: 0.7 },
      { name: "Entropy Cascade", healthPercent: 0.45 },
      { name: "Disk Collapse", healthPercent: 0.22 },
    ];
    this.phaseThresholds = [0.7, 0.45, 0.22];
    this.currentPhaseIndex = 0;

    this.orbitRadius = 13;
    this.orbitAngle = Math.random() * Math.PI * 2;

    this.glitchTimer = 1.5;
    this.focusTimer = 3.8;
    this.teleportTimer = 8.5;

    this._tempVec = new THREE.Vector3();
    this._teleportTarget = new THREE.Vector3();

    this._buildModel();
  }

  _buildModel() {
    const coreGeometry = new THREE.IcosahedronGeometry(2.2, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.2,
      shininess: 100,
      transparent: true,
      opacity: 0.92,
    });
    this.coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.group.add(this.coreMesh);

    const shellGeometry = new THREE.DodecahedronGeometry(3.3, 0);
    const shellMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    this.group.add(this.shellMesh);

    this.noiseShards = [];
    for (let i = 0; i < 16; i++) {
      const shardGeometry = new THREE.BoxGeometry(
        0.6,
        3.5 + Math.random(),
        0.6
      );
      const shardMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: this.color,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.75,
      });
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);
      const angle = (i / 16) * Math.PI * 2;
      const radius = 4.5 + Math.random() * 1.2;
      shard.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius
      );
      shard.lookAt(new THREE.Vector3(0, 0, 0));
      this.group.add(shard);
      this.noiseShards.push(shard);
    }

    const auraGeometry = new THREE.TorusGeometry(5.5, 0.25, 12, 64);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.auraRing = new THREE.Mesh(auraGeometry, auraMaterial);
    this.auraRing.rotation.x = Math.PI / 2;
    this.group.add(this.auraRing);

    this.group.position.copy(this.position);
    this.group.visible = false;
    this.scene.add(this.group);
  }

  _updatePhase() {
    const ratio = this.health / this.maxHealth;
    let phase = 0;
    for (let i = 0; i < this.phaseThresholds.length; i++) {
      if (ratio <= this.phaseThresholds[i]) {
        phase = i + 1;
      }
    }
    this.currentPhaseIndex = Math.min(phase, this.phases.length - 1);
  }

  _phaseMultiplier() {
    return 1 + this.currentPhaseIndex * 0.25;
  }

  _cooldown(base) {
    return Math.max(base * (0.86 - this.currentPhaseIndex * 0.08), 1.6);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this._updatePhase();

    const orbitSpeed = 0.55 + this._phaseMultiplier() * 0.25;
    this.orbitAngle += deltaTime * orbitSpeed;
    const radius = Math.max(
      7.5,
      this.orbitRadius - this.currentPhaseIndex * 1.6
    );
    this.position.x = playerPosition.x + Math.cos(this.orbitAngle) * radius;
    this.position.z = playerPosition.z + Math.sin(this.orbitAngle) * radius;
    this.position.y = this.spawnElevation + Math.sin(this.time * 3.4) * 1.4;

    const lookAngle = Math.atan2(
      playerPosition.z - this.position.z,
      playerPosition.x - this.position.x
    );
    this.group.rotation.y = lookAngle + Math.sin(this.time * 5) * 0.18;
    this.group.rotation.x = Math.sin(this.time * 7) * 0.22;
    this.group.rotation.z = Math.cos(this.time * 5.8) * 0.18;
    this.group.scale.setScalar(1 + Math.sin(this.time * 8.5) * 0.05);

    this.noiseShards.forEach((shard, index) => {
      shard.rotation.y += deltaTime * (index % 2 === 0 ? 2.1 : -1.7);
      shard.position.y = Math.sin(this.time * 6 + index) * 1.6;
    });
    if (this.auraRing) {
      this.auraRing.rotation.z += deltaTime * 1.4;
      this.auraRing.material.opacity = 0.25 + Math.sin(this.time * 4) * 0.1;
    }

    this.glitchTimer -= deltaTime;
    if (this.glitchTimer <= 0) {
      this._emitCorruptionBurst();
      this.glitchTimer = this._cooldown(4.6);
    }

    this.focusTimer -= deltaTime;
    if (this.focusTimer <= 0) {
      this._launchDataSpikes(playerPosition);
      this.focusTimer = this._cooldown(3.6);
    }

    this.teleportTimer -= deltaTime;
    if (this.teleportTimer <= 0) {
      this._teleportAround(playerPosition);
      this.teleportTimer = this._cooldown(8.2);
    }
  }

  _emitCorruptionBurst() {
    const count = 9 + this.currentPhaseIndex * 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const targetOffset = new THREE.Vector3(
        Math.cos(angle) * 22,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * 22
      );
      const target = this.position.clone().add(targetOffset);
      this.shootProjectile(target);
    }
    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position.clone(),
        14 + this.currentPhaseIndex * 3,
        this.secondaryColor
      );
    }
  }

  _launchDataSpikes(playerPosition) {
    const baseDirection = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .setY(0)
      .normalize();
    if (baseDirection.lengthSq() === 0) {
      baseDirection.set(1, 0, 0);
    }
    const baseAngle = Math.atan2(baseDirection.z, baseDirection.x);
    const spread = 0.18 + this.currentPhaseIndex * 0.04;
    const rays = 3 + this.currentPhaseIndex;

    for (let i = 0; i < rays; i++) {
      const offset = (i - (rays - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const target = this.position
        .clone()
        .add(
          new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
            26
          )
        );
      target.y = playerPosition.y + Math.sin(offset * 3) * 1.5;
      this.shootProjectile(target);
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position.clone(),
        this.color,
        32 + this.currentPhaseIndex * 6
      );
    }
  }

  _teleportAround(playerPosition) {
    if (this.particleSystem) {
      this.particleSystem.createImpact(
        this.position.clone(),
        this.secondaryColor,
        24
      );
    }

    const radius = 11 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    this._teleportTarget.set(
      playerPosition.x + Math.cos(angle) * radius,
      this.spawnElevation + Math.random() * 2.5,
      playerPosition.z + Math.sin(angle) * radius
    );
    this.position.copy(this._teleportTarget);

    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position.clone(),
        this.color,
        40
      );
    }
  }
}
