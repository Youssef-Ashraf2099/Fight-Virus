class PulseCannon extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "PULSE CANNON";
    this.damage = 20;
    this.fireRate = 0.15;
    this.projectileSpeed = 40;
    this.projectileLifetime = 2;
    this.projectileColor = 0x00ff00;
  }

  fire(origin, target, camera) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    // Calculate direction from mouse position
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

    const direction = new THREE.Vector3()
      .subVectors(intersectPoint, origin)
      .normalize();

    // Muzzle flash effect
    this.particleSystem.createMuzzleFlash(origin, this.projectileColor);

    return new Projectile(
      this.scene,
      origin,
      direction,
      this.projectileSpeed,
      this.projectileLifetime,
      this.projectileColor,
      this.damage,
      0.4
    );
  }
}
