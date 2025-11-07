class LaserRifle extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "LASER RIFLE";
    this.damage = 18;
    this.fireRate = 0.1; // Fast fire rate
    this.projectileSpeed = 70;
    this.projectileLifetime = 2;
    this.projectileColor = 0xff0000;
    this.viewModelId = "laserRifle";
    this.hudColor = "#ff0000";
    this.ammoType = "limited";
    this.currentAmmo = 30;
    this.maxAmmo = 30;
    this.reloadTime = 1.8;

    this.fireSound = this.createSound("../Assets/sounds/rifle.mp3", 0.2);
    this.reloadSound = this.createSound("../Assets/sounds/reload 2.mp3", 0.6);
  }

  fire(origin, target, camera, cameraDirection) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    let direction;

    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();
    } else {
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

    return new LaserBeam(
      this.scene,
      origin,
      direction,
      this.projectileSpeed,
      this.projectileLifetime,
      this.projectileColor,
      this.damage
    );
  }
}

class LaserBeam {
  constructor(scene, position, direction, speed, lifetime, color, damage) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.color = color;
    this.damage = damage;
    this.collisionRadius = 0.3;

    this.createMesh();
  }

  createMesh() {
    // Create laser beam using cylinder
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Glow effect
    this.light = new THREE.PointLight(this.color, 1.5, 4);
    this.mesh.add(this.light);
  }

  update(deltaTime) {
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    // Align with velocity
    const direction = this.velocity.clone().normalize();
    this.mesh.lookAt(this.position.clone().add(direction));
    this.mesh.rotateX(Math.PI / 2);

    this.lifetime -= deltaTime;

    // Fade out
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      this.mesh.material.opacity = (lifetimeRatio / 0.3) * 0.9;
    }
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}
