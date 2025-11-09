import * as THREE from "three";
import BaseBoss from "./BaseBoss.js";

export default class LadyBugSentinel extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    this.bossName = "LADYBUG SENTINEL";
    this.bossTitle = "Memory Vault Caretaker";

    this.maxHealth = 1400 * difficulty;
    this.health = this.maxHealth;
    this.speed = 6.5;
    this.damage = 35 * difficulty;
    this.contactDamage = 18 * difficulty;
    this.collisionRadius = 5.2;
    this.projectileSpeed = 26;
    this.spawnElevation = 1.4;
    this.scoreValue = 3200;
    this.color = 0xff3366;
    this.secondaryColor = 0x38ffd4;

    this.phases = [
      { name: "Data Sweep", healthThreshold: 1.0 },
      { name: "Vector Lock", healthThreshold: 0.72 },
      { name: "Firewall Bloom", healthThreshold: 0.45 },
      { name: "Final Purge", healthThreshold: 0.18 },
    ];
    this.currentPhaseIndex = 0;

    this.scatterCooldownBase = 2.4;
    this.scatterCooldown = 1.2;
    this.nanoCloudCooldownBase = 7;
    this.nanoCloudCooldown = 3.5;
    this.dashCooldownBase = 5.5;
    this.dashCooldown = 2.8;
    this.dashTimer = 0;
    this.dashing = false;

    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitHeight = 1.2;

    this._dashDirection = new THREE.Vector3();
    this._orbitOffset = new THREE.Vector3();
    this._tempVec = new THREE.Vector3();

    this.createSpawnPortal();
    this.createMesh();
  }

  createMesh() {
    const shellMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      shininess: 70,
    });

    const shellGeometry = new THREE.SphereGeometry(4.2, 32, 24);
    this.shell = new THREE.Mesh(shellGeometry, shellMaterial);
    this.shell.castShadow = true;
    this.shell.receiveShadow = true;
    this.group.add(this.shell);

    const shellBack = this.shell.clone();
    shellBack.scale.set(0.9, 0.95, 1.18);
    shellBack.position.y = -0.4;
    this.group.add(shellBack);

    const headGeometry = new THREE.SphereGeometry(2.2, 24, 18);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x111320,
      emissive: 0x223344,
      emissiveIntensity: 0.4,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 0.9, 4.5);
    this.group.add(this.head);

    const eyeGeometry = new THREE.SphereGeometry(0.6, 12, 10);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 1.4,
    });
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeLeft.position.set(-0.7, 1, 5.4);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.7;
    this.group.add(eyeLeft);
    this.group.add(eyeRight);

    const wingMaterial = new THREE.MeshPhongMaterial({
      color: this.secondaryColor,
      emissive: this.secondaryColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const wingGeometry = new THREE.PlaneGeometry(6.5, 8, 1, 1);
    this.wings = [];
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
      wing.position.set(side * 3.4, 1.2, -0.5);
      wing.rotation.set(0.18, side * 0.45, side * 0.3);
      this.wings.push(wing);
      this.group.add(wing);
    });

    const spotMaterial = new THREE.MeshPhongMaterial({
      color: 0x14060a,
      emissive: 0x20060c,
      emissiveIntensity: 0.3,
    });
    const spotGeometry = new THREE.CircleGeometry(0.9, 12);
    for (let i = 0; i < 10; i++) {
      const spot = new THREE.Mesh(spotGeometry, spotMaterial.clone());
      const theta = (i / 10) * Math.PI * 2;
      spot.position.set(Math.cos(theta) * 2.4, 0.2, Math.sin(theta) * 3.4);
      spot.rotation.x = Math.PI / 2;
      this.shell.add(spot);
    }

    this.coreLight = new THREE.PointLight(this.secondaryColor, 4.8, 38);
    this.coreLight.position.set(0, 1.4, -0.5);
    this.group.add(this.coreLight);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    if (!this.fullySpawned) {
      return;
    }

    this.shell.rotation.y += deltaTime * 0.6;
    this.shell.scale.y = 1 + Math.sin(this.time * 4) * 0.05;

    this.wings.forEach((wing, index) => {
      const wave = Math.sin(this.time * 12 + index) * 0.5 + 0.5;
      wing.rotation.z = (index === 0 ? -1 : 1) * (0.3 + wave * 0.7);
      wing.material.opacity = 0.35 + wave * 0.25;
    });

    if (this.coreLight) {
      this.coreLight.intensity = 4.6 + Math.sin(this.time * 6) * 1.2;
    }

    if (this.pulseLight && this.pulseLight.intensity > 0) {
      this.pulseLight.intensity = Math.max(
        0,
        this.pulseLight.intensity - deltaTime * 6
      );
    }
  }

  checkPhaseTransition() {
    super.checkPhaseTransition();

    const healthRatio = this.health / this.maxHealth;
    let targetIndex = 0;
    for (let i = 0; i < this.phases.length; i++) {
      if (healthRatio <= this.phases[i].healthThreshold) {
        targetIndex = i;
      }
    }

    if (targetIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = targetIndex;
      this.onPhaseChange(targetIndex);
    }
  }

  onPhaseChange(index) {
    if (this.particleSystem) {
      this.particleSystem.createExplosion(
        this.position,
        this.secondaryColor,
        60
      );
      this.particleSystem.createShockwave(this.position, 18, this.color);
    }

    this.speed *= 1.1;
    this.scatterCooldownBase = Math.max(1.4, this.scatterCooldownBase * 0.86);
    this.nanoCloudCooldownBase = Math.max(
      4.2,
      this.nanoCloudCooldownBase * 0.9
    );
    this.dashCooldownBase = Math.max(3.6, this.dashCooldownBase * 0.9);

    if (this.pulseLight) {
      this.pulseLight.intensity = 14;
    }
  }

  onEnrage() {
    super.onEnrage();
    this.scatterCooldownBase *= 0.75;
    this.nanoCloudCooldownBase *= 0.78;
    this.dashCooldownBase *= 0.7;
  }

  updateBehavior(deltaTime, playerPosition) {
    if (!playerPosition) {
      return;
    }

    const toPlayer = this._tempVec.copy(playerPosition).sub(this.position);
    const distance = toPlayer.length();
    const horizontalDir = toPlayer.clone().setY(0).normalize();

    if (horizontalDir.lengthSq() > 0) {
      this.group.lookAt(playerPosition.x, this.position.y, playerPosition.z);
    }

    this.scatterCooldown = Math.max(0, this.scatterCooldown - deltaTime);
    this.nanoCloudCooldown = Math.max(0, this.nanoCloudCooldown - deltaTime);
    this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);

    if (this.dashing) {
      const dashSpeed = this.speed * 3;
      this.position.add(
        this._dashDirection.clone().multiplyScalar(dashSpeed * deltaTime)
      );
      this.dashTimer -= deltaTime;
      if (this.dashTimer <= 0) {
        this.dashing = false;
        this.dashCooldown = this.dashCooldownBase;
      }
    } else {
      this.orbitAngle += deltaTime * (0.6 + this.currentPhaseIndex * 0.2);
      const orbitRadius = 9 + this.currentPhaseIndex * 1.8;
      this._orbitOffset.set(
        Math.cos(this.orbitAngle) * orbitRadius,
        0,
        Math.sin(this.orbitAngle) * orbitRadius
      );
      const desired = this._tempVec.copy(playerPosition).add(this._orbitOffset);
      desired.y = playerPosition.y + this.orbitHeight;
      const moveDir = desired.sub(this.position).normalize();
      this.position.add(moveDir.multiplyScalar(this.speed * deltaTime));
    }

    if (!this.dashing && this.dashCooldown <= 0 && distance > 8) {
      this.startDash(horizontalDir);
    }

    if (this.scatterCooldown <= 0) {
      this.needleVolley(playerPosition);
      this.scatterCooldown = this.scatterCooldownBase;
    }

    if (this.nanoCloudCooldown <= 0) {
      this.deployNanoCloud();
      this.nanoCloudCooldown = this.nanoCloudCooldownBase;
    }
  }

  updateProjectiles(deltaTime) {
    this.projectiles = this.projectiles.filter((proj) => {
      if (!proj) {
        return false;
      }

      if (proj.orbitCenter) {
        const prev = this._tempProjectilePrev.copy(proj.position);
        proj.orbitAngle += proj.orbitSpeed * deltaTime;
        proj.position.set(
          proj.orbitCenter.x + Math.cos(proj.orbitAngle) * proj.orbitRadius,
          proj.orbitCenter.y + proj.verticalOffset,
          proj.orbitCenter.z + Math.sin(proj.orbitAngle) * proj.orbitRadius
        );

        if (
          this._projectileHitsEnvironment(
            prev,
            proj.position,
            proj.collisionRadius,
            proj.heightPadding || 0.2
          )
        ) {
          this._handleProjectileBlocked(proj);
          return false;
        }

        if (proj.mesh) {
          proj.mesh.position.copy(proj.position);
          proj.mesh.rotation.y += deltaTime * 5;
        }
      } else {
        if (!this._advanceProjectile(proj, deltaTime)) {
          return false;
        }

        if (proj.mesh) {
          proj.mesh.rotation.x += deltaTime * 9;
          proj.mesh.rotation.y += deltaTime * 7;
        }
      }

      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) {
        this._disposeProjectile(proj);
        return false;
      }

      return true;
    });
  }

  needleVolley(playerPosition) {
    const baseCount = 7 + this.currentPhaseIndex * 2;
    const count = this.isEnraged ? baseCount + 3 : baseCount;
    const direction = this._tempVec.copy(playerPosition).sub(this.position);
    direction.normalize();

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.12;
      const shotDir = new THREE.Vector3(
        direction.x * Math.cos(spread) - direction.z * Math.sin(spread),
        direction.y,
        direction.x * Math.sin(spread) + direction.z * Math.cos(spread)
      );
      shotDir.y += (Math.random() - 0.5) * 0.12;
      shotDir.normalize();

      this._spawnProjectile({
        direction: shotDir,
        damage: this.damage * 0.85,
        color: this.secondaryColor,
        speed: this.projectileSpeed + Math.random() * 4,
        radius: 0.45,
        lifetime: 4,
      });
    }

    if (this.particleSystem) {
      this.particleSystem.createShockwave(
        this.position,
        8,
        this.secondaryColor
      );
    }
  }

  deployNanoCloud() {
    const rings = this.isEnraged ? 2 : 1;
    const baseRadius = 5.5 + this.currentPhaseIndex * 0.8;

    for (let r = 0; r < rings; r++) {
      const count = 12 + this.currentPhaseIndex * 2 + r * 2;
      const radius = baseRadius + r * 1.6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const spawnPos = new THREE.Vector3(
          this.position.x + Math.cos(angle) * radius,
          this.position.y + 0.4,
          this.position.z + Math.sin(angle) * radius
        );

        const mesh = this._spawnProjectile({
          position: spawnPos,
          velocity: new THREE.Vector3(0, 0, 0),
          damage: this.damage * 0.6,
          color: 0xff66aa,
          radius: 0.5,
          lifetime: 6 + r * 1.5,
          skipAdvance: true,
        });

        if (mesh) {
          mesh.orbitCenter = this.position.clone();
          mesh.orbitRadius = radius;
          mesh.orbitAngle = angle;
          mesh.orbitSpeed = 1.2 + r * 0.35;
          mesh.verticalOffset = 0.3 + Math.sin(angle * 2) * 0.2;
          mesh.heightPadding = 0.2;
        }
      }
    }

    if (this.particleSystem) {
      this.particleSystem.createExplosion(this.position, this.color, 40);
    }
  }

  startDash(direction) {
    if (!direction || direction.lengthSq() === 0) {
      return;
    }
    this.dashing = true;
    this.dashTimer = 0.7;
    this._dashDirection.copy(direction).normalize();
    if (this.particleSystem) {
      this.particleSystem.createShockwave(this.position, 10, this.color);
    }
  }

  _spawnProjectile({
    direction = null,
    position = null,
    velocity = null,
    speed = this.projectileSpeed,
    damage = this.damage,
    color = this.color,
    radius = 0.4,
    lifetime = 4,
    skipAdvance = false,
  }) {
    const geometry = new THREE.SphereGeometry(radius, 10, 10);
    const material = this.createGlowMaterial(color, 1.6);
    const mesh = new THREE.Mesh(geometry, material);

    const spawnPos = position ? position.clone() : this.position.clone();
    spawnPos.y = position ? position.y : this.position.y + 1.2;
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    const projDirection = direction
      ? direction.clone().normalize()
      : new THREE.Vector3(1, 0, 0);
    const projVelocity = velocity
      ? velocity.clone()
      : projDirection.multiplyScalar(speed);

    const projectile = {
      mesh,
      position: spawnPos,
      velocity: projVelocity,
      damage,
      lifetime,
      collisionRadius: radius,
      skipAdvance,
      color,
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
