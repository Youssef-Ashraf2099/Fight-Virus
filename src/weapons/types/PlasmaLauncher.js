class PlasmaLauncher extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "PLASMA LAUNCHER";
    this.damage = 60;
    this.fireRate = 1.0; // Slower but powerful
    this.projectileSpeed = 30;
    this.projectileLifetime = 3.5;
    this.projectileColor = 0x0066ff;
    this.splashRadius = 6;
    this.viewModelId = "plasmaLauncher";
    this.hudColor = "#0066ff";
    this.ammoType = "limited";
    this.currentAmmo = 12;
    this.maxAmmo = 12;
    this.reloadTime = 2.5;
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

    this.particleSystem.createMuzzleFlash(origin, this.projectileColor);

    return new PlasmaOrb(
      this.scene,
      this.particleSystem,
      origin,
      direction,
      this.projectileSpeed,
      this.projectileLifetime,
      this.projectileColor,
      this.damage,
      this.splashRadius
    );
  }
}

class PlasmaOrb {
  constructor(
    scene,
    particleSystem,
    position,
    direction,
    speed,
    lifetime,
    color,
    damage,
    splashRadius
  ) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.color = color;
    this.damage = damage;
    this.collisionRadius = 0.8;
    this.splashRadius = splashRadius;
    this.time = 0;

    this.createMesh();
  }

  createMesh() {
    this.group = new THREE.Group();

    // Core sphere
    const coreGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });

    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.group.add(this.core);

    // Outer energy field
    const fieldGeometry = new THREE.IcosahedronGeometry(1.2, 1);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
    });

    this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.group.add(this.field);

    // Point light
    this.light = new THREE.PointLight(this.color, 2, 8);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  update(deltaTime) {
    this.time += deltaTime;

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.group.position.copy(this.position);

    // Animate
    this.core.rotation.x += deltaTime * 3;
    this.core.rotation.y += deltaTime * 2;

    this.field.rotation.x -= deltaTime * 2;
    this.field.rotation.y -= deltaTime * 3;

    const pulse = 1 + Math.sin(this.time * 10) * 0.2;
    this.field.scale.setScalar(pulse);

    this.lifetime -= deltaTime;

    // Fade out
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      const opacity = lifetimeRatio / 0.3;
      this.core.material.opacity = opacity * 0.9;
      this.field.material.opacity = opacity * 0.4;
    }
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  destroy() {
    // Create explosion effect on destroy
    this.particleSystem.createExplosion(this.position, this.color, 40);

    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}
