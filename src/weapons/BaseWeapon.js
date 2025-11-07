class BaseWeapon {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;

    this.name = "Base Weapon";
    this.damage = 10;
    this.fireRate = 0.2; // Time between shots
    this.cooldown = 0;
    this.projectileSpeed = 30;
    this.projectileLifetime = 3;
    this.projectileColor = 0x00ff00;
    this.viewModelId = "pulseCannon";
    this.ammoType = "infinite"; // or 'limited'
    this.currentAmmo = Infinity;
    this.maxAmmo = Infinity;
    this.hudColor = "rgba(3, 239, 227, 1)"; // HUD display color
  this.fireSound = null;
  this.reloadSound = null;

    // Weapon model
    this.weaponModel = null;
    this.isReloading = false;
    this.reloadTime = 1.5;
    this.currentAnimation = null;
    this.onReloadStart = null;
    this.onReloadEnd = null;
  }

  canFire() {
    return this.cooldown <= 0 && this.currentAmmo > 0 && !this.isReloading;
  }

  fire(origin, target, camera) {
    if (!this.canFire()) return null;

    this.cooldown = this.fireRate;

    if (this.ammoType === "limited") {
      this.currentAmmo = Math.max(this.currentAmmo - 1, 0);

      // Auto reload when empty
      if (this.currentAmmo <= 0) {
        this.startReload();
      }
    }

    this.playSound(this.fireSound);

    // Override in subclasses
    return null;
  }

  update(deltaTime) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }

    // Update current animation
    if (this.currentAnimation) {
      const stillRunning = this.currentAnimation.update(deltaTime);
      if (!stillRunning) {
        this.currentAnimation = null;
      }
    }
  }

  startReload() {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) return false;

    this.isReloading = true;
    if (typeof this.onReloadStart === "function") {
      this.onReloadStart(this.reloadTime);
    }
    this.playSound(this.reloadSound);
    setTimeout(() => {
      this.reload();
      this.isReloading = false;
      if (typeof this.onReloadEnd === "function") {
        this.onReloadEnd();
      }
    }, this.reloadTime * 1000);
    return true;
  }

  onEquip() {
    // Called when weapon is equipped
  }

  getAmmoDisplay() {
    if (this.ammoType === "infinite") {
      return "∞";
    }
    return `${this.currentAmmo}/${this.maxAmmo}`;
  }

  reload() {
    this.currentAmmo = this.maxAmmo;
  }

  setWeaponModel(model) {
    this.weaponModel = model;
  }

  getWeaponModel() {
    return this.weaponModel;
  }

  createSound(relativePath, volume = 1) {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return null;
    }

    try {
      const resolvedSrc = new URL(relativePath, window.location.href).href;
      const audio = new Audio(resolvedSrc);
      audio.volume = volume;
      audio.preload = "auto";
      return audio;
    } catch (error) {
      console.warn("Audio load failed:", relativePath, error);
      return null;
    }
  }

  playSound(sound) {
    if (!sound) return;

    try {
      sound.currentTime = 0;
      const result = sound.play();
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          console.warn("Audio play failed:", error);
        });
      }
    } catch (error) {
      console.warn("Audio play failed:", error);
    }
  }
}
