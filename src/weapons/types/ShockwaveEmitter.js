class ShockwaveEmitter extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "SHOCKWAVE EMITTER";
    this.damage = 12;
    this.fireRate = 0.2;
    this.projectileSpeed = 40;
    this.projectileLifetime = 2.5;
    this.projectileColor = 0xffcc00;
    this.viewModelId = "shockwaveEmitter";
    this.hudColor = "#ffcc00";
    this.ammoType = "infinite";
  }

  fire(origin, target, camera, cameraDirection) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    let direction;

    // FPS mode: use camera direction directly
    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();
    } else {
      // Legacy top-down mode
      const mouse = new THREE.Vector2(
        (target.x / window.innerWidth) * 2 - 1,
        -(target.y / window.innerHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const planeZ = origin.z;
      const planeNormal = new THREE.Vector3(0, 1, 0);
      const planePoint = new THREE.Vector3(0, 0, planeZ);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        planeNormal,
        planePoint
      );

      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      direction = new THREE.Vector3()
        .subVectors(intersectPoint, origin)
        .normalize();
    }

    // Fire 3 projectiles in a spread
    const projectiles = [];
    const spreadAngles = [-0.15, 0, 0.15];

    spreadAngles.forEach((angleOffset) => {
      const spreadDirection = direction.clone();

      // Get perpendicular vector for spread (works in 3D)
      const up = new THREE.Vector3(0, 1, 0);
      const perpendicular = new THREE.Vector3().crossVectors(direction, up);

      spreadDirection.add(perpendicular.multiplyScalar(angleOffset));
      spreadDirection.normalize();

      projectiles.push(
        new ShockwavePulse(
          this.scene,
          origin.clone(),
          spreadDirection,
          this.projectileSpeed,
          this.projectileLifetime,
          this.projectileColor,
          this.damage
        )
      );
    });

    this.particleSystem.createMuzzleFlash(origin, this.projectileColor);

    return projectiles;
  }
}

class ShockwavePulse {
  constructor(scene, position, direction, speed, lifetime, color, damage) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.color = color;
    this.damage = damage;
    this.collisionRadius = 0.5;
    this.time = 0;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();

    // Central ring
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.15, 8, 16);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8,
    });

    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ring.rotation.y = Math.PI / 2;
    this.group.add(this.ring);

    // Energy spikes
    this.spikes = [];
    const spikeGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
    const spikeMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.2,
    });

    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 4) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
      spike.rotation.z = -angle - Math.PI / 2;
      this.spikes.push(spike);
      this.group.add(spike);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 1.5, 5);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  update(deltaTime) {
    this.time += deltaTime;

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.group.position.copy(this.position);

    // Animate
    this.ring.rotation.x += deltaTime * 5;

    const pulse = 1 + Math.sin(this.time * 10) * 0.3;
    this.ring.scale.setScalar(pulse);

    this.spikes.forEach((spike, index) => {
      spike.rotation.y = this.time * 5 + (index * Math.PI) / 2;
      const extension = 1 + Math.sin(this.time * 8 + index) * 0.3;
      spike.scale.y = extension;
    });

    this.lifetime -= deltaTime;

    // Fade out
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      const opacity = lifetimeRatio / 0.3;
      this.ring.material.opacity = opacity * 0.8;
    }
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  destroy() {
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}
