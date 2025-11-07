class PulseCannon extends BaseWeapon {
  constructor(scene, particleSystem) {
    super(scene, particleSystem);

    this.name = "PULSE CANNON";
    this.damage = 25;
    this.fireRate = 0.12;
    this.projectileSpeed = 45;
    this.projectileLifetime = 2.5;
    this.projectileColor = 0x00ff00;
    this.viewModelId = "pulseCannon";
    this.hudColor = "#00ff00";
    this.ammoType = "limited";
    this.currentAmmo = 40;
    this.maxAmmo = 40;
    this.reloadTime = 2.0;

    this.fireSound = this.createSound("../Assets/sounds/cannon.mp3", 0.5);
    this.reloadSound = this.createSound("../Assets/sounds/reload 3.mp3", 0.6);
  }

  fire(origin, target, camera, cameraDirection) {
    if (!this.canFire()) return null;

    super.fire(origin, target, camera);

    let direction;

    // FPS mode: use camera direction directly
    if (cameraDirection) {
      direction = cameraDirection.clone().normalize();
    } else {
      // Legacy top-down mode: Calculate direction from mouse position
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
