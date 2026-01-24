import * as THREE from "three";
import GPUParticles from "./GPUParticles.js";

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

    // Defer particle creation to spread allocations across frames
    this._pendingAdds = [];
    
    // Tech Art: GPU Particle System
    this.gpuParticles = new GPUParticles(scene);
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
    // Forward to GPU system
    this.gpuParticles.spawnExplosion(position, color, count);
  }

  createImpact(position, color, count = 6) {
    // OPTIMIZATION: Defer creation to avoid burst allocations
    const px = position.x,
      py = position.y,
      pz = position.z;
    const mat = this.getMaterial(color);
    const toCreate = Math.max(
      0,
      Math.min(count, this.maxParticles - this.particles.length),
    );
    for (let i = 0; i < toCreate; i++) {
      this._pendingAdds.push({
        type: "box",
        px,
        py,
        pz,
        mat,
        lifetime: 0.5,
        gravity: -8,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 5,
        vz: (Math.random() - 0.5) * 5,
      });
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
    this.gpuParticles.update(deltaTime);
    
    // Process pending particle creations in chunks to avoid spikes
    const maxCreates = 40; // cap creations per frame
    let created = 0;
    while (created < maxCreates && this._pendingAdds.length) {
      const req = this._pendingAdds.shift();
      const geo =
        req.type === "sphere"
          ? this.geometryPool.sphere
          : this.geometryPool.box;
      const mesh = new THREE.Mesh(geo, req.mat);
      mesh.position.set(req.px, req.py, req.pz);
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(req.vx, req.vy, req.vz);
      this.particles.push({
        mesh,
        velocity,
        lifetime: req.lifetime,
        maxLifetime: req.lifetime,
        gravity: req.gravity,
      });
      created++;
    }

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
