import * as THREE from "three";
import BaseBoss from "./BaseBoss.js";

export default class PacketHydra extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "PACKET HYDRA";
    this.bossTitle = "Master of the Network Void";

    this.maxHealth = 2700 * difficulty;
    this.health = this.maxHealth;
    this.speed = 6.8;
    this.damage = 46 * difficulty;
    this.contactDamage = 24 * difficulty;
    this.projectileSpeed = 29;
    this.projectileLifetime = 5.6;
    this.collisionRadius = 4.1;
    this.spawnElevation = 2.1;
    this.scoreValue = 4400;

    this.color = 0x4dffe2;
    this.secondaryColor = 0x2f7dff;

    this.phases = [
      { name: "Ping Flood", healthPercent: 1 },
      { name: "Packet Storm", healthPercent: 0.7 },
      { name: "Route Collapse", healthPercent: 0.46 },
      { name: "Signal Overrun", healthPercent: 0.24 },
    ];
    this.phaseThresholds = [0.7, 0.46, 0.24];
    this.currentPhaseIndex = 0;

    this.orbitRadius = 17;
    this.orbitAngle = Math.random() * Math.PI * 2;

    this.stormTimer = 3.1;
    this.volleyTimer = 4.9;
    this.beaconTimer = 7.9;

    this._tempTarget = new THREE.Vector3();
    this._anchorSwing = Math.random() * Math.PI * 2;

    this._buildModel();
  }

  _buildModel() {
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9,
    });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 6.5, 20, 1, true),
      bodyMaterial
    );
    body.rotation.z = Math.PI / 2;
    this.group.add(body);

    const headMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.85,
    });
    const front = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 18, 14),
      headMaterial
    );
    front.position.x = 3.4;
    this.group.add(front);
    const back = front.clone();
    back.position.x = -3.4;
    this.group.add(back);

    this.dataHeads = [];
    for (let i = 0; i < 5; i++) {
      const headMaterial = new THREE.MeshPhongMaterial({
        color: this.secondaryColor,
        emissive: this.secondaryColor,
        emissiveIntensity: 1.05,
      });
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 16, 12),
        headMaterial
      );
      const angle = (i / 5) * Math.PI * 2;
      head.position.set(
        Math.cos(angle) * 3.4,
        Math.sin(angle) * 0.9,
        Math.sin(angle) * 3.4
      );
      this.group.add(head);
      this.dataHeads.push(head);
    }

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    this.outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.4, 0.28, 16, 64),
      ringMaterial
    );
    this.outerRing.rotation.x = Math.PI / 2;
    this.group.add(this.outerRing);

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
    return 1 + this.currentPhaseIndex * 0.23;
  }

  _cooldown(base) {
    return Math.max(base * (0.9 - this.currentPhaseIndex * 0.08), 1.7);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this._updatePhase();

    const orbitSpeed = 0.46 + this._phaseMultiplier() * 0.16;
    this.orbitAngle += deltaTime * orbitSpeed;
    this._anchorSwing += deltaTime * 0.7;

    const radius = Math.max(9, this.orbitRadius - this.currentPhaseIndex * 1.4);
    this.position.x = playerPosition.x + Math.cos(this.orbitAngle) * radius;
    this.position.z = playerPosition.z + Math.sin(this.orbitAngle) * radius;
    this.position.y = this.spawnElevation + Math.sin(this._anchorSwing) * 1.4;

    this.group.rotation.y = Math.atan2(
      playerPosition.z - this.position.z,
      playerPosition.x - this.position.x
    );
    this.group.rotation.z = Math.sin(this.time * 3.1) * 0.15;

    if (this.outerRing) {
      this.outerRing.rotation.z += deltaTime * 1.3;
      this.outerRing.material.opacity = 0.25 + Math.sin(this.time * 3.8) * 0.1;
    }
    this.dataHeads.forEach((head, idx) => {
      head.position.y = Math.sin(this.time * 4 + idx) * 0.9;
      head.rotation.y += deltaTime * (idx % 2 === 0 ? 2 : -2.2);
    });

    this.stormTimer -= deltaTime;
    if (this.stormTimer <= 0) {
      this._packetStorm();
      this.stormTimer = this._cooldown(3.6);
    }

    this.volleyTimer -= deltaTime;
    if (this.volleyTimer <= 0) {
      this._chainVolley(playerPosition);
      this.volleyTimer = this._cooldown(4.8);
    }

    this.beaconTimer -= deltaTime;
    if (this.beaconTimer <= 0) {
      this._deployBeaconSurge(playerPosition);
      this.beaconTimer = this._cooldown(7.6);
    }
  }

  _packetStorm() {
    const count = 10 + this.currentPhaseIndex * 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const target = this.position
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(angle),
            (Math.random() - 0.5) * 3,
            Math.sin(angle)
          ).multiplyScalar(24)
        );
      this.shootProjectile(target);
    }
    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position.clone(),
        18 + this.currentPhaseIndex * 3,
        this.secondaryColor
      );
    }
  }

  _chainVolley(playerPosition) {
    const bolts = 4 + this.currentPhaseIndex;
    const toPlayer = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .setY(0)
      .normalize();
    if (toPlayer.lengthSq() === 0) {
      toPlayer.set(1, 0, 0);
    }
    const lateral = new THREE.Vector3(toPlayer.z, 0, -toPlayer.x).normalize();

    for (let i = 0; i < bolts; i++) {
      const offset = (i - (bolts - 1) / 2) * 2.4;
      const lead = (0.8 + i * 0.12) * (1 + this.currentPhaseIndex * 0.1);
      this._tempTarget.copy(playerPosition);
      this._tempTarget.add(lateral.clone().multiplyScalar(offset));
      this._tempTarget.add(toPlayer.clone().multiplyScalar(lead * 4));
      this._tempTarget.y += Math.sin(i) * 1.2;
      this.shootProjectile(this._tempTarget.clone());
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position.clone(),
        this.color,
        32
      );
    }
  }

  _deployBeaconSurge(playerPosition) {
    const pings = 3 + this.currentPhaseIndex;
    for (let i = 0; i < pings; i++) {
      const radius = 9 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      this._tempTarget.set(
        playerPosition.x + Math.cos(angle) * radius,
        playerPosition.y,
        playerPosition.z + Math.sin(angle) * radius
      );
      if (this.particleSystem) {
        this.particleSystem.createImpact(
          this._tempTarget.clone(),
          this.secondaryColor,
          16
        );
      }
      this.shootProjectile(this._tempTarget.clone());
    }
  }
}
