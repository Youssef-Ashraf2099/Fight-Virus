class WormVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Worm stats - Fast, low health, rapid melee attacks
    this.maxHealth = 70 * difficulty;
    this.health = this.maxHealth;
    this.speed = 14; // Very fast
    this.damage = 12 * difficulty; // Moderate damage but fast attacks
    this.contactDamage = 6 * difficulty; // Reduced from 10 for balance
    this.collisionRadius = 1;
    this.scoreValue = 80;
    this.color = 0x00ff00;

    // Attack configuration
    this.attackType = "melee";
    this.attackRange = 3;
    this.attackSpeed = 0.8; // Fast attack rate

    this.segmentCount = 8;
    this.segments = [];

    this.createMesh();
  }

  createMesh() {
    // Create segmented worm body

    // Head - larger segment
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = this.createGlowMaterial(this.color, 1);
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.castShadow = true;

    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.2, 0.6);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.2, 0.6);
    this.head.add(rightEye);

    this.group.add(this.head);

    // Body segments
    for (let i = 0; i < this.segmentCount; i++) {
      const size = 0.6 - i * 0.05;
      const segmentGeometry = new THREE.SphereGeometry(size, 12, 12);
      const segmentMaterial = this.createGlowMaterial(
        this.color,
        0.8 - i * 0.08
      );

      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.userData = {
        targetPos: new THREE.Vector3(),
        offset: i,
      };

      this.segments.push(segment);
      this.group.add(segment);
    }

    // Trail particles
    this.trailParticles = [];
    const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);

    for (let i = 0; i < 5; i++) {
      const particleMaterial = this.createGlowMaterial(this.color, 0.6);
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.userData = { offset: i };
      this.trailParticles.push(particle);
      this.group.add(particle);
    }

    // Point light
    this.light = new THREE.PointLight(this.color, 1, 8);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Store previous positions for segment following
    this.previousPositions = [];
    for (let i = 0; i < this.segmentCount + 5; i++) {
      this.previousPositions.push(this.position.clone());
    }
  }

  animate(deltaTime) {
    // Head bobbing
    this.head.position.y = Math.sin(this.time * 5) * 0.2;
    this.head.rotation.y = Math.sin(this.time * 3) * 0.3;

    // Segments follow head with delay
    this.segments.forEach((segment, index) => {
      const targetIndex = Math.floor(index * 1.5) + 1;
      if (targetIndex < this.previousPositions.length) {
        const targetPos = this.previousPositions[targetIndex];
        segment.position.copy(targetPos).sub(this.position);

        // Wave motion
        segment.position.y += Math.sin(this.time * 5 - index * 0.5) * 0.3;

        // Rotation
        segment.rotation.y = this.time * 2 + index * 0.3;
      }
    });

    // Trail particles
    this.trailParticles.forEach((particle, index) => {
      const targetIndex = this.segmentCount + index + 2;
      if (targetIndex < this.previousPositions.length) {
        const targetPos = this.previousPositions[targetIndex];
        particle.position.copy(targetPos).sub(this.position);
        particle.scale.setScalar(1 - index * 0.15);
      }
    });
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    // Safety check
    if (!playerPosition) {
      return;
    }

    // Snake-like movement
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();

    // Add sinusoidal movement for snake-like motion
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    const wave = Math.sin(this.time * 5) * 2;

    const movement = direction.multiplyScalar(this.speed * deltaTime);
    movement.add(perpendicular.multiplyScalar(wave * deltaTime));

    this.position.add(movement);

    // Update position history
    this.previousPositions.unshift(this.position.clone());
    if (this.previousPositions.length > this.segmentCount + 10) {
      this.previousPositions.pop();
    }
  }
}
