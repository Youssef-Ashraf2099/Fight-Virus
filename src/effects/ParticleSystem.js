import * as THREE from "three";

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // OPTIMIZATION: Pre-allocate temp vectors to avoid allocations in update loop
    this._tempVelocity = new THREE.Vector3();

    // OPTIMIZATION: Object pooling for geometries and materials
    this.geometryPool = {
      sphere: new THREE.SphereGeometry(0.2, 8, 8),
      box: new THREE.BoxGeometry(0.15, 0.15, 0.15),
      ring: new THREE.RingGeometry(0.5, 1, 32),
    };

    this.materialPool = new Map(); // Store materials by color
    this.maxParticles = 500; // Limit total particles to prevent memory issues
  }

  // OPTIMIZATION: Get or create material from pool
  getMaterial(color, transparent = true) {
    const key = `${color}_${transparent}`;
    if (!this.materialPool.has(key)) {
      this.materialPool.set(
        key,
        new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1,
          transparent: transparent,
          opacity: 1,
        }),
      );
    }
    return this.materialPool.get(key);
  }

  createExplosion(position, color, count = 20) {
    if (typeof window !== "undefined" && window.profiler?.startOperation) {
      window.profiler.startOperation("particle-explosion");
    }

    // OPTIMIZATION: Limit particle count if approaching max
    if (this.particles.length > this.maxParticles - 50) {
      count = Math.min(count, 10); // Reduce particles when near limit
    }

    const material = this.getMaterial(color);

    for (let i = 0; i < count; i++) {
      // OPTIMIZATION: Reuse geometry from pool
      const particle = new THREE.Mesh(this.geometryPool.sphere, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      );

      this.scene.add(particle);

      this.particles.push({
        mesh: particle,
        velocity: velocity,
        lifetime: 1,
        maxLifetime: 1,
        gravity: -5,
      });
    }

    if (typeof window !== "undefined" && window.profiler?.endOperation) {
      window.profiler.endOperation("particle-explosion");
    }
  }

  createImpact(position, color, count = 6) {
    if (typeof window !== "undefined" && window.profiler?.startOperation) {
      window.profiler.startOperation("particle-impact");
    }

    // OPTIMIZATION: Limit particle count if approaching max
    if (this.particles.length > this.maxParticles - 30) {
      count = Math.min(count, 3);
    }

    const material = this.getMaterial(color);

    for (let i = 0; i < count; i++) {
      // OPTIMIZATION: Reuse geometry from pool
      const particle = new THREE.Mesh(this.geometryPool.box, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5,
      );

      this.scene.add(particle);

      this.particles.push({
        mesh: particle,
        velocity: velocity,
        lifetime: 0.5,
        maxLifetime: 0.5,
        gravity: -8,
      });
    }

    if (typeof window !== "undefined" && window.profiler?.endOperation) {
      window.profiler.endOperation("particle-impact");
    }
  }

  createMuzzleFlash(position, color) {
    const material = this.getMaterial(color, true);

    // OPTIMIZATION: Reuse geometry from pool (create specific muzzle flash geometry)
    if (!this.geometryPool.muzzleFlash) {
      this.geometryPool.muzzleFlash = new THREE.SphereGeometry(0.5, 16, 16);
    }

    const flash = new THREE.Mesh(this.geometryPool.muzzleFlash, material);
    flash.position.copy(position);
    this.scene.add(flash);

    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 0.1,
      maxLifetime: 0.1,
      gravity: 0,
      isMuzzleFlash: true,
    });
  }

  createShockwave(position, radius, color) {
    if (typeof window !== "undefined" && window.profiler?.startOperation) {
      window.profiler.startOperation("particle-shockwave");
    }

    // OPTIMIZATION: Reuse geometry and material
    const material = this.getMaterial(color, true);
    const wave = new THREE.Mesh(this.geometryPool.ring, material);
    wave.position.copy(position);
    wave.rotation.x = -Math.PI / 2;
    this.scene.add(wave);

    this.particles.push({
      mesh: wave,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 1,
      maxLifetime: 1,
      gravity: 0,
      isShockwave: true,
      targetRadius: radius,
    });

    if (typeof window !== "undefined" && window.profiler?.endOperation) {
      window.profiler.endOperation("particle-shockwave");
    }
  }

  update(deltaTime) {
    // OPTIMIZATION: Limit update iterations and clean old particles
    const maxUpdates = Math.min(this.particles.length, 300);

    this.particles = this.particles.filter((particle, index) => {
      // OPTIMIZATION: Skip updating distant old particles
      if (index >= maxUpdates && particle.lifetime < 0.1) {
        this.scene.remove(particle.mesh);
        // Don't dispose shared geometries/materials from pool
        return false;
      }

      particle.lifetime -= deltaTime;

      if (particle.lifetime <= 0) {
        this.scene.remove(particle.mesh);
        // OPTIMIZATION: Don't dispose pooled resources
        // particle.mesh.geometry.dispose(); // Shared from pool
        // particle.mesh.material.dispose(); // Shared from pool
        return false;
      }

      // Update particle behavior
      if (particle.isMuzzleFlash) {
        // Expand and fade quickly
        const scale = 1 + (1 - particle.lifetime / particle.maxLifetime) * 2;
        particle.mesh.scale.setScalar(scale);
        particle.mesh.material.opacity =
          particle.lifetime / particle.maxLifetime;
      } else if (particle.isShockwave) {
        // Expand shockwave
        const progress = 1 - particle.lifetime / particle.maxLifetime;
        const scale = progress * particle.targetRadius;
        particle.mesh.scale.setScalar(scale);
        particle.mesh.material.opacity =
          particle.lifetime / particle.maxLifetime;
      } else {
        // Normal particle physics
        particle.velocity.y += particle.gravity * deltaTime;

        // OPTIMIZATION: Reuse temp vector instead of clone()
        this._tempVelocity.copy(particle.velocity).multiplyScalar(deltaTime);
        particle.mesh.position.add(this._tempVelocity);

        // Fade out
        const lifetimeRatio = particle.lifetime / particle.maxLifetime;
        particle.mesh.material.opacity = lifetimeRatio;

        // Rotate
        particle.mesh.rotation.x += deltaTime * 5;
        particle.mesh.rotation.y += deltaTime * 3;
      }

      return true;
    });
  }
}
