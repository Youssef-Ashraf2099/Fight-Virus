import * as THREE from "three";

export default class Projectile {
  // OPTIMIZATION: Static pools for shared geometry and materials
  static geometryPool = new Map(); // keyed by size
  static materialPool = new Map(); // keyed by color

  static getGeometry(size) {
    if (!this.geometryPool.has(size)) {
      this.geometryPool.set(size, new THREE.SphereGeometry(size, 12, 12));
    }
    return this.geometryPool.get(size);
  }

  static getMaterial(color) {
    const colorKey = color.toString();
    if (!this.materialPool.has(colorKey)) {
      this.materialPool.set(
        colorKey,
        new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.9,
        }),
      );
    }
    return this.materialPool.get(colorKey);
  }

  constructor(
    scene,
    position,
    direction,
    speed,
    lifetime,
    color,
    damage,
    size = 0.5,
  ) {
    // Validate inputs to prevent null reference errors
    if (!scene || !position || !direction) {
      throw new Error(
        "Projectile: Invalid scene, position, or direction provided",
      );
    }
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      throw new Error(
        "Projectile: Invalid position coordinates (NaN detected)",
      );
    }
    if (isNaN(direction.x) || isNaN(direction.y) || isNaN(direction.z)) {
      throw new Error(
        "Projectile: Invalid direction coordinates (NaN detected)",
      );
    }

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
    // OPTIMIZATION: Use shared geometry and material from static pools
    const geometry = Projectile.getGeometry(size);
    const material = Projectile.getMaterial(this.color);

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
        this.heightPadding,
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
    // OPTIMIZATION: Return direct reference (caller should not mutate)
    // Previously cloned every call, causing allocations in collision checks
    return this.position;
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
      // OPTIMIZATION: Don't dispose pooled resources - they're shared
      // this.mesh.geometry.dispose(); // Shared from static pool
      // this.mesh.material.dispose(); // Shared from static pool
      this.mesh = null;
    }

    this.light = null;
  }

  _handleImpact(position) {
    if (this.particleSystem && position) {
      // OPTIMIZATION: Pass position directly (particle system copies internally)
      this.particleSystem.createImpact(position, this.color, 12);
    }

    this.destroy();
  }
}
