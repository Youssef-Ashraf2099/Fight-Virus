class WeaponManager {
  constructor(scene, player, particleSystem, environment) {
    this.scene = scene;
    this.player = player;
    this.particleSystem = particleSystem;
    this.environment = environment || null;

    this.weaponDefinitions = {
      pulseCannon: {
        order: 0,
        create: () => new PulseCannon(scene, particleSystem),
      },
      laserRifle: {
        order: 1,
        create: () => new LaserRifle(scene, particleSystem),
      },
      shockwaveEmitter: {
        order: 2,
        create: () => new ShockwaveEmitter(scene, particleSystem),
      },
      plasmaLauncher: {
        order: 3,
        create: () => new PlasmaLauncher(scene, particleSystem),
      },
    };

    this.weapons = [];
    this.unlockedWeaponIds = new Set();
    this.currentWeaponIndex = 0;
    this.projectiles = [];
    this.time = 0;
    this.damageMultiplier = 1;
    this.projectileSpeedMultiplier = 1;

    this.unlockWeapon("pulseCannon", { autoEquip: true });
  }

  setEnvironment(environment) {
    this.environment = environment || null;
  }

  switchWeapon(index) {
    if (!this.weapons.length || index < 0 || index >= this.weapons.length) {
      return;
    }

    if (index === this.currentWeaponIndex) {
      const current = this.getCurrentWeapon();
      if (typeof current?.onEquip === "function") {
        current.onEquip();
      }
      if (this.player?.setWeaponViewModel && current) {
        this.player.setWeaponViewModel(current.viewModelId || current.name);
        this.player.updateWeaponHUD?.(current);
      }
      return;
    }

    this.currentWeaponIndex = index;
    const weapon = this.getCurrentWeapon();
    if (typeof weapon?.onEquip === "function") {
      weapon.onEquip();
    }

    if (this.player?.setWeaponViewModel && weapon) {
      this.player.setWeaponViewModel(weapon.viewModelId || weapon.name);
      this.player.updateWeaponHUD?.(weapon);
    }
  }

  cycleWeapon(step) {
    if (!this.weapons.length) return;
    const total = this.weapons.length;
    const nextIndex = (this.currentWeaponIndex + step + total) % total;
    this.switchWeapon(nextIndex);
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex] || null;
  }

  fire(mousePos, camera, muzzlePos, direction) {
    const weapon = this.getCurrentWeapon();
    if (!weapon) {
      return;
    }

    const firePosition = muzzlePos || this.player.getPosition();
    const fireDirection = direction || this.player.getDirection();

    if (!weapon.canFire()) {
      return;
    }

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

      const register = (proj) => {
        if (!proj) return;
        proj.particleSystem = this.particleSystem;
        this.projectiles.push(proj);
      };

      if (Array.isArray(projectile)) {
        projectile.forEach((proj) => {
          applyScaling(proj);
          register(proj);
        });
      } else {
        applyScaling(projectile);
        register(projectile);
      }
    }

    this.player.updateWeaponHUD?.(weapon);
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    if (!weapon) {
      return;
    }

    if (weapon.ammoType === "limited" && !weapon.isReloading) {
      weapon.startReload();
      this.player?.notifyWeaponReload?.(weapon.reloadTime);
    }
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.weapons.forEach((weapon) => weapon.update(deltaTime));

    this.projectiles = this.projectiles.filter((proj) => {
      if (!proj || (proj.isExpired && proj.isExpired())) {
        return false;
      }

      const updateResult =
        typeof proj.update === "function"
          ? proj.update(deltaTime, this.environment)
          : true;

      if (updateResult === false) {
        if (typeof proj.destroy === "function") {
          proj.destroy();
        }
        return false;
      }

      if (typeof proj.isExpired === "function" && proj.isExpired()) {
        if (typeof proj.destroy === "function") {
          proj.destroy();
        }
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
    if (!weapon) {
      return;
    }
    uiManager.updateWeapon(weapon.name, weapon.getAmmoDisplay());
  }

  clear() {
    this.projectiles.forEach((proj) => proj.destroy?.());
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

  hasWeapon(weaponId) {
    return this.unlockedWeaponIds.has(weaponId);
  }

  unlockWeapon(weaponId, options = {}) {
    if (this.hasWeapon(weaponId)) {
      return null;
    }

    const definition = this.weaponDefinitions[weaponId];
    if (!definition || typeof definition.create !== "function") {
      return null;
    }

    const weapon = definition.create();
    if (!weapon) {
      return null;
    }

    weapon.__weaponId = weaponId;
    this._bindWeaponEvents(weapon);

    const currentWeapon = this.getCurrentWeapon();
    const insertAt = this._findInsertionIndex(weaponId);

    this.weapons.splice(insertAt, 0, weapon);
    this.unlockedWeaponIds.add(weaponId);

    const autoEquip =
      options.autoEquip !== undefined ? options.autoEquip : true;

    if (autoEquip || !currentWeapon) {
      this.switchWeapon(insertAt);
    } else if (currentWeapon) {
      const retainedIndex = this.weapons.indexOf(currentWeapon);
      if (retainedIndex >= 0) {
        this.currentWeaponIndex = retainedIndex;
      }
      this.player?.updateWeaponHUD?.(currentWeapon);
    }

    return weapon;
  }

  resetLoadout() {
    this.clear();
    this.weapons = [];
    this.unlockedWeaponIds.clear();
    this.currentWeaponIndex = 0;
    this.unlockWeapon("pulseCannon", { autoEquip: true });
  }

  _bindWeaponEvents(weapon) {
    if (!weapon) {
      return;
    }

    weapon.onReloadStart = (duration) => {
      this.player?.notifyWeaponReload?.(duration);
      if (this.player?.playReloadAnimation) {
        this.player.playReloadAnimation(
          weapon.viewModelId || weapon.name,
          duration,
          weapon
        );
      }
    };

    weapon.onReloadEnd = () => {
      this.player?.finishReloadAnimation?.(weapon);
      this.player?.updateWeaponHUD?.(weapon);
    };
  }

  _findInsertionIndex(weaponId) {
    const order =
      this.weaponDefinitions[weaponId]?.order ?? Number.MAX_SAFE_INTEGER;
    if (!this.weapons.length) {
      return 0;
    }

    for (let i = 0; i < this.weapons.length; i += 1) {
      const existingId = this.weapons[i]?.__weaponId;
      const existingOrder =
        this.weaponDefinitions[existingId]?.order ?? Number.MAX_SAFE_INTEGER;
      if (order < existingOrder) {
        return i;
      }
    }

    return this.weapons.length;
  }
}
