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
  }

  canFire() {
    return this.cooldown <= 0 && this.currentAmmo > 0;
  }

  fire(origin, target, camera) {
    if (!this.canFire()) return null;

    this.cooldown = this.fireRate;

    if (this.ammoType === "limited") {
      this.currentAmmo--;
    }

    // Override in subclasses
    return null;
  }

  update(deltaTime) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }
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
}
