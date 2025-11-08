class Projectile {
  constructor(
    scene,
    position,
    direction,
    speed,
    lifetime,
    color,
    damage,
    size = 0.5
  ) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.color = color;
    this.damage = damage;
    this.collisionRadius = size;
    this.heightPadding = size * 0.6;
    this.particleSystem = null;
    this.destroyed = false;
    this._stepVector = new THREE.Vector3();
    this._previousPosition = new THREE.Vector3();

    this.createMesh(size);
  }

  createMesh(size) {
    const geometry = new THREE.SphereGeometry(size, 12, 12);
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Add point light for glow
    this.light = new THREE.PointLight(this.color, 1, 5);
    this.mesh.add(this.light);
  }

  update(deltaTime, environment) {
    if (this.destroyed) {
      return false;
    }

    this._previousPosition.copy(this.position);
    this._stepVector.copy(this.velocity).multiplyScalar(deltaTime);
    this.position.add(this._stepVector);

    if (
      environment &&
      typeof environment.isProjectilePathObstructed === "function" &&
      environment.isProjectilePathObstructed(
        this._previousPosition,
        this.position,
        this.collisionRadius,
        this.heightPadding
      )
    ) {
      this._handleImpact(this.position);
      return false;
    }

    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }

    this.lifetime -= deltaTime;

    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (this.mesh && lifetimeRatio < 0.3) {
      this.mesh.material.opacity = Math.max(lifetimeRatio / 0.3, 0);
    }

    return !this.isExpired();
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.destroyed || this.lifetime <= 0;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    if (this.light && this.mesh) {
      this.mesh.remove(this.light);
    }

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }

    this.light = null;
  }

  _handleImpact(position) {
    if (this.particleSystem && position) {
      this.particleSystem.createImpact(position.clone(), this.color, 12);
    }

    this.destroy();
  }
}
