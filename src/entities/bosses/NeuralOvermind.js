class NeuralOvermind extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "NEURAL OVERMIND";
    this.bossTitle = "Architect of the Deep Net";

    this.maxHealth = 2500 * difficulty;
    this.health = this.maxHealth;
    this.speed = 5.8;
    this.damage = 44 * difficulty;
    this.contactDamage = 24 * difficulty;
    this.projectileSpeed = 27;
    this.projectileLifetime = 6.2;
    this.collisionRadius = 3.9;
    this.spawnElevation = 5.2;
    this.scoreValue = 4600;

    this.color = 0x6af7ff;
    this.secondaryColor = 0xff6fdc;

    this.phases = [
      { name: "Signal Calibration", healthPercent: 1 },
      { name: "Recursive Loop", healthPercent: 0.72 },
      { name: "Feedback Storm", healthPercent: 0.48 },
      { name: "Singularity", healthPercent: 0.24 },
    ];
    this.phaseThresholds = [0.72, 0.48, 0.24];
    this.currentPhaseIndex = 0;

    this.orbitRadius = 16;
    this.orbitAngle = Math.random() * Math.PI * 2;

    this.orbTimer = 2.6;
    this.synapseTimer = 4.4;
    this.decoyTimer = 7.8;

    this._vectorCache = new THREE.Vector3();

    this._buildModel();
  }

  _buildModel() {
    const latticeMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.05,
      transparent: true,
      opacity: 0.88,
    });
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 24, 16),
      latticeMaterial
    );
    this.group.add(shell);

    const filamentMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.75,
    });

    this.synapseFilaments = [];
    for (let i = 0; i < 6; i++) {
      const filament = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.6, 7, 12, 1),
        filamentMaterial
      );
      filament.position.y = 2.4;
      filament.rotation.z = Math.PI / 3 + i * 0.3;
      filament.rotation.x = i * 0.9;
      this.group.add(filament);
      this.synapseFilaments.push(filament);
    }

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
    });
    this.haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.24, 16, 54),
      haloMaterial
    );
    this.group.add(this.haloRing);

    this.dataNodes = [];
    for (let i = 0; i < 10; i++) {
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: this.secondaryColor,
        emissiveIntensity: 0.9,
      });
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 12),
        nodeMaterial
      );
      node.userData = {
        radius: 4.2 + Math.random() * 1.2,
        speed: 0.6 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
      };
      this.group.add(node);
      this.dataNodes.push(node);
    }

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
    return 1 + this.currentPhaseIndex * 0.22;
  }

  _cooldown(base) {
    return Math.max(base * (0.88 - this.currentPhaseIndex * 0.08), 1.5);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this._updatePhase();

    const orbitSpeed = 0.42 + this._phaseMultiplier() * 0.18;
    this.orbitAngle += deltaTime * orbitSpeed;
    const radius = Math.max(8, this.orbitRadius - this.currentPhaseIndex * 1.2);
    this.position.x = playerPosition.x + Math.cos(this.orbitAngle) * radius;
    this.position.z = playerPosition.z + Math.sin(this.orbitAngle) * radius;
    this.position.y = this.spawnElevation + Math.sin(this.time * 2.6) * 1.8;

    this.group.rotation.y += deltaTime * 0.8;
    if (this.haloRing) {
      this.haloRing.rotation.x = Math.sin(this.time * 2) * 0.35;
      this.haloRing.material.opacity = 0.28 + Math.sin(this.time * 4.2) * 0.12;
    }
    this.synapseFilaments.forEach((filament, idx) => {
      filament.rotation.y = Math.sin(this.time * 3.1 + idx) * 0.8;
    });
    this.dataNodes.forEach((node, idx) => {
      const data = node.userData;
      const angle =
        data.offset + this.time * data.speed * (idx % 2 === 0 ? 1 : -1);
      node.position.set(
        Math.cos(angle) * data.radius,
        Math.sin(this.time * 2.4 + idx) * 1.5,
        Math.sin(angle) * data.radius
      );
    });

    this.orbTimer -= deltaTime;
    if (this.orbTimer <= 0) {
      this._spawnMindOrbs(playerPosition);
      this.orbTimer = this._cooldown(3);
    }

    this.synapseTimer -= deltaTime;
    if (this.synapseTimer <= 0) {
      this._emitSynapseBurst();
      this.synapseTimer = this._cooldown(4.9);
    }

    this.decoyTimer -= deltaTime;
    if (this.decoyTimer <= 0) {
      this._projectDecoySignals(playerPosition);
      this.decoyTimer = this._cooldown(7.4);
    }
  }

  _spawnMindOrbs(playerPosition) {
    const count = 4 + this.currentPhaseIndex;
    const baseDirection = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    if (baseDirection.lengthSq() === 0) {
      baseDirection.set(1, 0, 0);
    }
    const lateral = new THREE.Vector3(
      baseDirection.z,
      0,
      -baseDirection.x
    ).normalize();

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 2.5;
      const target = playerPosition
        .clone()
        .add(lateral.clone().multiplyScalar(offset))
        .add(new THREE.Vector3(0, Math.sin(i) * 1.5, 0));
      this.shootProjectile(target);
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position.clone(),
        this.secondaryColor,
        28
      );
    }
  }

  _emitSynapseBurst() {
    const count = 10 + this.currentPhaseIndex * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const target = this.position
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(angle),
            (Math.random() - 0.5) * 4,
            Math.sin(angle)
          ).multiplyScalar(22)
        );
      this.shootProjectile(target);
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position.clone(),
        17 + this.currentPhaseIndex * 3,
        this.color
      );
    }
  }

  _projectDecoySignals(playerPosition) {
    const illusions = 3 + this.currentPhaseIndex;
    for (let i = 0; i < illusions; i++) {
      const radius = 8 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      this._vectorCache.set(
        playerPosition.x + Math.cos(angle) * radius,
        playerPosition.y,
        playerPosition.z + Math.sin(angle) * radius
      );
      if (this.particleSystem) {
        this.particleSystem.createImpact(
          this._vectorCache.clone(),
          this.secondaryColor,
          18
        );
      }
      this.shootProjectile(this._vectorCache.clone());
    }
  }
}
