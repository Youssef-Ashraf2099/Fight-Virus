import PulseCannon from "./types/PulseCannon.js";
import LaserRifle from "./types/LaserRifle.js";
import ShockwaveEmitter from "./types/ShockwaveEmitter.js";
import PlasmaLauncher from "./types/PlasmaLauncher.js";
import Revolver from "./types/Revolver.js";
import SciFiSword from "./types/SciFiSword.js";
import NeonKnife from "./types/NeonKnife.js";

class WeaponManager {
  constructor(scene, player, particleSystem, environment) {
    this.scene = scene;
    this.player = player;
    this.particleSystem = particleSystem;
    this.environment = environment || null;
    this.enemyManager = null; // Will be set later for melee weapons

    this.weaponDefinitions = {
      pulseCannon: {
        order: 0,
        create: () => new PulseCannon(scene, particleSystem),
      },
      revolver: {
        order: 1,
        create: () => new Revolver(scene, particleSystem),
      },
      laserRifle: {
        order: 2,
        create: () => new LaserRifle(scene, particleSystem),
      },
      sciFiSword: {
        order: 3,
        create: () => new SciFiSword(scene, particleSystem),
      },
      neonKnife: {
        order: 4,
        create: () => new NeonKnife(scene, particleSystem),
      },
      shockwaveEmitter: {
        order: 5,
        create: () => new ShockwaveEmitter(scene, particleSystem),
      },
      plasmaLauncher: {
        order: 6,
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
    this._lastSlowLog = 0;
    this._profilingThresholdMs = 6; // log when weapon+projectile work exceeds this frame budget

    this.unlockWeapon("pulseCannon", { autoEquip: true });
  }

  setEnvironment(environment) {
    this.environment = environment || null;
  }

  setEnemyManager(enemyManager) {
    this.enemyManager = enemyManager || null;
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

    // Validate fire positions to prevent null reference errors
    const isFiniteVec = (v) =>
      v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

    if (!isFiniteVec(firePosition)) {
      return;
    }
    if (!isFiniteVec(fireDirection)) {
      return;
    }

    if (!weapon.canFire()) {
      return;
    }

    let projectile = null;
    try {
      projectile = weapon.fire(
        firePosition,
        mousePos,
        camera,
        fireDirection,
        this.enemyManager,
      );
    } catch (err) {
      // Prevent fire-time errors (often null targets) from freezing the frame
      if (process.env.NODE_ENV !== "production") {
        console.warn("Weapon fire failed:", err);
      }
      return;
    }

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
    const frameStart = performance.now();
    this.time += deltaTime;
    let weaponUpdateMs = 0;
    let projectileUpdateMs = 0;

    const weaponsStart = performance.now();
    for (let i = 0; i < this.weapons.length; i += 1) {
      const weapon = this.weapons[i];
      if (!weapon || typeof weapon.update !== "function") continue;
      try {
        weapon.update(deltaTime);
      } catch (err) {
        // Avoid a single bad weapon update stalling the frame
        if (process.env.NODE_ENV !== "production") {
          console.warn("Weapon update failed:", err);
        }
      }
    }
    weaponUpdateMs = performance.now() - weaponsStart;

    // OPTIMIZATION: Batch projectile updates with early removal
    const projCount = this.projectiles.length;
    let writeIndex = 0;
    const projStart = performance.now();

    for (let i = 0; i < projCount; i++) {
      const proj = this.projectiles[i];

      if (!proj || (proj.isExpired && proj.isExpired())) {
        continue; // Skip destroyed projectiles
      }

      try {
        const updateResult =
          typeof proj.update === "function"
            ? proj.update(deltaTime, this.environment)
            : true;

        if (updateResult === false) {
          if (typeof proj.destroy === "function") {
            proj.destroy();
          }
          continue;
        }

        if (typeof proj.isExpired === "function" && proj.isExpired()) {
          if (typeof proj.destroy === "function") {
            proj.destroy();
          }
          continue;
        }

        this.projectiles[writeIndex++] = proj;
      } catch (error) {
        // Defensive: prevent a single bad projectile from stalling the frame
        if (typeof proj?.destroy === "function") {
          proj.destroy();
        }
        // Optionally log in dev mode
        if (process.env.NODE_ENV !== "production") {
          console.warn("Projectile update failed:", error);
        }
      }
    }

    this.projectiles.length = writeIndex;
    projectileUpdateMs = performance.now() - projStart;

    this.player.updateWeaponHUD?.(this.getCurrentWeapon());

    // Log occasional slow frames to help trace lingering lag sources (dev only)
    const totalMs = performance.now() - frameStart;
    const now = performance.now();
    if (
      process.env.NODE_ENV !== "production" &&
      totalMs > this._profilingThresholdMs &&
      now - this._lastSlowLog > 1500
    ) {
      this._lastSlowLog = now;
      console.warn(
        `Weapon frame slow: ${totalMs.toFixed(2)}ms (weapons ${weaponUpdateMs.toFixed(2)}ms, projectiles ${projectileUpdateMs.toFixed(2)}ms, count ${writeIndex}/${projCount})`,
      );
    }
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
          weapon,
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

  /**
   * Get list of unlocked weapon IDs for saving
   * @returns {Array<string>}
   */
  getUnlockedWeapons() {
    return Array.from(this.unlockedWeaponIds);
  }

  /**
   * Restore unlocked weapons from save data
   * @param {Array<string>} weaponIds - List of weapon IDs to unlock
   * @param {number} currentIndex - Index of currently equipped weapon
   */
  restoreWeapons(weaponIds, currentIndex = 0) {
    if (!Array.isArray(weaponIds) || weaponIds.length === 0) {
      console.warn("No weapons to restore, using default loadout");
      return;
    }

    // Clear current loadout
    this.clear();
    this.weapons = [];
    this.unlockedWeaponIds.clear();

    // Restore each weapon
    weaponIds.forEach((weaponId, index) => {
      const autoEquip = index === currentIndex;
      this.unlockWeapon(weaponId, { autoEquip });
    });

    // Set correct weapon index
    if (currentIndex >= 0 && currentIndex < this.weapons.length) {
      this.switchWeapon(currentIndex);
    }
  }
}

export default WeaponManager;
