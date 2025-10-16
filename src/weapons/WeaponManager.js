class WeaponManager {
  constructor(scene, player, particleSystem) {
    this.scene = scene;
    this.player = player;
    this.particleSystem = particleSystem;

    this.weapons = [
      new PulseCannon(scene, particleSystem),
      new LaserRifle(scene, particleSystem),
      new PlasmaLauncher(scene, particleSystem),
      new ShockwaveEmitter(scene, particleSystem),
    ];

    this.currentWeaponIndex = 0;
    this.projectiles = [];

    if (this.player.setWeaponViewModel) {
      this.player.setWeaponViewModel(
        this.getCurrentWeapon().viewModelId || this.getCurrentWeapon().name
      );
    }
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIndex = index;
      const weapon = this.getCurrentWeapon();
      weapon.onEquip();

      if (this.player.setWeaponViewModel) {
        this.player.setWeaponViewModel(weapon.viewModelId || weapon.name);
      }
    }
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  fire(mousePos, camera, muzzlePos, direction) {
    const weapon = this.getCurrentWeapon();

    // Use muzzle position if provided, otherwise fall back to player position
    const firePosition = muzzlePos || this.player.getPosition();
    const fireDirection = direction || this.player.getDirection();

    if (weapon.canFire()) {
      // In FPS mode, mousePos will be null - fire from camera direction
      const projectile = weapon.fire(
        firePosition,
        mousePos,
        camera,
        fireDirection
      );
      if (projectile) {
        if (Array.isArray(projectile)) {
          this.projectiles.push(...projectile);
        } else {
          this.projectiles.push(projectile);
        }
      }
    }
  }

  update(deltaTime) {
    // Update all weapons
    this.weapons.forEach((weapon) => weapon.update(deltaTime));

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => {
      proj.update(deltaTime);

      if (proj.isExpired()) {
        proj.destroy();
        return false;
      }

      return true;
    });
  }

  getProjectiles() {
    return this.projectiles;
  }

  updateUI(uiManager) {
    const weapon = this.getCurrentWeapon();
    uiManager.updateWeapon(weapon.name, weapon.getAmmoDisplay());
  }

  clear() {
    this.projectiles.forEach((proj) => proj.destroy());
    this.projectiles = [];
  }
}
