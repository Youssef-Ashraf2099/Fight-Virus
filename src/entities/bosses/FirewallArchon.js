import * as THREE from "three";
import BaseBoss from "./BaseBoss.js";

export default class FirewallArchon extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "FIREWALL ARCHON";
    this.bossTitle = "Guardian of the Shield Grid";

    this.maxHealth = 2900 * difficulty;
    this.health = this.maxHealth;
    this.speed = 5.5;
    this.damage = 52 * difficulty;
    this.contactDamage = 26 * difficulty;
    this.projectileSpeed = 26;
    this.projectileLifetime = 5.5;
    this.collisionRadius = 4.2;
    this.spawnElevation = 1.8;
    this.scoreValue = 4800;

    this.color = 0xff5a1d;
    this.secondaryColor = 0xffc766;

    this.phases = [
      { name: "Ignition", healthPercent: 1 },
      { name: "Flashpoint", healthPercent: 0.72 },
      { name: "Blaze Wall", healthPercent: 0.46 },
      { name: "Solar Flare", healthPercent: 0.24 },
    ];
    this.phaseThresholds = [0.72, 0.46, 0.24];
    this.currentPhaseIndex = 0;

    this.orbitRadius = 18;
    this.orbitAngle = Math.random() * Math.PI * 2;

    this.arcTimer = 2.4;
    this.ringTimer = 5.3;
    this.bombTimer = 7.6;

    this._tempDir = new THREE.Vector3();

    this._buildModel();
  }

  _buildModel() {
    const base = new THREE.CylinderGeometry(3.2, 3.2, 2.2, 24, 1, true);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const baseMesh = new THREE.Mesh(base, baseMaterial);
    baseMesh.rotation.x = Math.PI / 2;
    this.group.add(baseMesh);

    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.1,
      shininess: 120,
    });
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 24, 16),
      coreMaterial
    );
    coreMesh.position.y = 1.3;
    this.group.add(coreMesh);

    this.firePlates = [];
    for (let i = 0; i < 6; i++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3.6, 6.5),
        new THREE.MeshPhongMaterial({
          color: this.color,
          emissive: this.secondaryColor,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.75,
        })
      );
      const angle = (i / 6) * Math.PI * 2;
      plate.position.set(Math.cos(angle) * 4.5, 1.6, Math.sin(angle) * 4.5);
      plate.lookAt(new THREE.Vector3(0, 1.6, 0));
      this.group.add(plate);
      this.firePlates.push(plate);
    }

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff1a6,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    this.halo = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.35, 16, 64),
      haloMaterial
    );
    this.halo.rotation.x = Math.PI / 2;
    this.group.add(this.halo);

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
    return Math.max(base * (0.9 - this.currentPhaseIndex * 0.1), 1.5);
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) return;

    this._updatePhase();

    const orbitSpeed = 0.38 + this._phaseMultiplier() * 0.18;
    this.orbitAngle += deltaTime * orbitSpeed;
    const radius = Math.max(9, this.orbitRadius - this.currentPhaseIndex * 1.5);
    this.position.x = playerPosition.x + Math.cos(this.orbitAngle) * radius;
    this.position.z = playerPosition.z + Math.sin(this.orbitAngle) * radius;
    this.position.y = this.spawnElevation + Math.sin(this.time * 2.3) * 0.9;

    const angleToPlayer = Math.atan2(
      playerPosition.z - this.position.z,
      playerPosition.x - this.position.x
    );
    this.group.rotation.y = angleToPlayer;

    if (this.halo) {
      this.halo.rotation.z += deltaTime * 1.1;
      this.halo.material.opacity = 0.3 + Math.sin(this.time * 3.2) * 0.12;
    }
    this.firePlates.forEach((plate, idx) => {
      plate.material.opacity = 0.55 + Math.sin(this.time * 4 + idx) * 0.2;
    });

    this.arcTimer -= deltaTime;
    if (this.arcTimer <= 0) {
      this._launchFirewallArc(playerPosition);
      this.arcTimer = this._cooldown(3.4);
    }

    this.ringTimer -= deltaTime;
    if (this.ringTimer <= 0) {
      this._deployFirewallRing();
      this.ringTimer = this._cooldown(5.8);
    }

    this.bombTimer -= deltaTime;
    if (this.bombTimer <= 0) {
      this._dropFirewallBomb(playerPosition);
      this.bombTimer = this._cooldown(7.2);
    }
  }

  _launchFirewallArc(playerPosition) {
    const toPlayer = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .setY(0)
      .normalize();
    if (toPlayer.lengthSq() === 0) {
      toPlayer.set(1, 0, 0);
    }
    const baseAngle = Math.atan2(toPlayer.z, toPlayer.x);
    const bolts = 5 + this.currentPhaseIndex;
    const spread = 0.32 + this.currentPhaseIndex * 0.06;

    for (let i = 0; i < bolts; i++) {
      const offset = (i - (bolts - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const target = this.position
        .clone()
        .add(
          new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
            25
          )
        );
      target.y = playerPosition.y + 0.6;
      this.shootProjectile(target);
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position.clone(),
        this.color,
        36
      );
    }
  }

  _deployFirewallRing() {
    const count = 8 + this.currentPhaseIndex * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const target = this.position
        .clone()
        .add(
          new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
            20
          )
        );
      this.shootProjectile(target);
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position.clone(),
        16 + this.currentPhaseIndex * 2,
        this.secondaryColor
      );
    }
  }

  _dropFirewallBomb(playerPosition) {
    const scatter = 4 + this.currentPhaseIndex * 1.5;
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * scatter,
      0,
      (Math.random() - 0.5) * scatter
    );
    const target = playerPosition.clone().add(offset);
    this.shootProjectile(target);

    if (this.particleSystem) {
      this.particleSystem.createExplosion(target, this.secondaryColor, 44);
      this.particleSystem.createImpact(target, this.color, 20);
    }
  }
}
