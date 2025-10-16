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
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIndex = index;
      this.getCurrentWeapon().onEquip();
    }
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  fire(mousePos, camera) {
    const weapon = this.getCurrentWeapon();
    const playerPos = this.player.getPosition();

    if (weapon.canFire()) {
      const projectile = weapon.fire(playerPos, mousePos, camera);
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
