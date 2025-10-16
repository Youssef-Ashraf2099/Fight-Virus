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

  update(deltaTime) {
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    this.lifetime -= deltaTime;

    // Fade out near end of life
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    if (lifetimeRatio < 0.3) {
      this.mesh.material.opacity = lifetimeRatio / 0.3;
    }
  }

  getPosition() {
    return this.position.clone();
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}
