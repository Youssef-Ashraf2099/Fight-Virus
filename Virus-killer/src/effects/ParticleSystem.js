class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  createExplosion(position, color, count = 30) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
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
  }

  createImpact(position, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
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
  }

  createMuzzleFlash(position, color) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
    });

    const flash = new THREE.Mesh(geometry, material);
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
    const geometry = new THREE.RingGeometry(0.5, 1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(position);
    shockwave.rotation.x = -Math.PI / 2;
    this.scene.add(shockwave);

    this.particles.push({
      mesh: shockwave,
      velocity: new THREE.Vector3(0, 0, 0),
      lifetime: 1,
      maxLifetime: 1,
      gravity: 0,
      isShockwave: true,
      targetRadius: radius,
    });
  }

  update(deltaTime) {
    this.particles = this.particles.filter((particle) => {
      particle.lifetime -= deltaTime;

      if (particle.lifetime <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
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
        particle.mesh.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime)
        );

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
