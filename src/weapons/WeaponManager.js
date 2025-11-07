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

    this.weapons.forEach((weapon) => {
      weapon.onReloadStart = (duration) => {
        this.player?.notifyWeaponReload?.(duration);
      };
      weapon.onReloadEnd = () => {
        this.player?.updateWeaponHUD?.(weapon);
      };
    });

    this.currentWeaponIndex = 0;
    this.projectiles = [];
    this.time = 0;
    this.damageMultiplier = 1;
    this.projectileSpeedMultiplier = 1;

    if (this.player?.setWeaponViewModel) {
      const weapon = this.getCurrentWeapon();
      this.player.setWeaponViewModel(weapon.viewModelId || weapon.name);
      this.player.updateWeaponHUD?.(weapon);
    }
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIndex = index;
      const weapon = this.getCurrentWeapon();
      weapon.onEquip();

      if (this.player?.setWeaponViewModel) {
        this.player.setWeaponViewModel(weapon.viewModelId || weapon.name);
        this.player.updateWeaponHUD?.(weapon);
      }
    }
  }

  cycleWeapon(step) {
    if (!this.weapons.length) return;
    const total = this.weapons.length;
    const nextIndex = (this.currentWeaponIndex + step + total) % total;
    this.switchWeapon(nextIndex);
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
        const applyScaling = (proj) => {
          if (!proj) return;
          proj.damage *= this.damageMultiplier;
          if (this.projectileSpeedMultiplier !== 1 && proj.velocity) {
            proj.velocity.multiplyScalar(this.projectileSpeedMultiplier);
          }
        };

        if (Array.isArray(projectile)) {
          projectile.forEach((proj) => {
            applyScaling(proj);
            this.projectiles.push(proj);
          });
        } else {
          applyScaling(projectile);
          this.projectiles.push(projectile);
        }
      }

      // Update player HUD when ammo changes
      this.player.updateWeaponHUD?.(weapon);
    }
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    if (weapon.ammoType === "limited" && !weapon.isReloading) {
      weapon.startReload();
      this.player.notifyWeaponReload?.(weapon.reloadTime);
    }
  }

  update(deltaTime) {
    this.time += deltaTime;

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
    this.player.updateWeaponHUD?.(this.getCurrentWeapon());
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

  setDamageMultiplier(multiplier) {
    this.damageMultiplier = Math.max(0.1, multiplier || 1);
  }

  getDamageMultiplier() {
    return this.damageMultiplier;
  }

  setProjectileSpeedMultiplier(multiplier) {
    this.projectileSpeedMultiplier = Math.max(0.1, multiplier || 1);
  }

  getProjectileSpeedMultiplier() {
    return this.projectileSpeedMultiplier;
  }
}
