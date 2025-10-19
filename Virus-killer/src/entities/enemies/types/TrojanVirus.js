class TrojanVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Trojan stats - Heavy, slow, high damage
    this.maxHealth = 150 * difficulty;
    this.health = this.maxHealth;
    this.speed = 4;
    this.damage = 20 * difficulty;
    this.contactDamage = 15 * difficulty;
    this.collisionRadius = 2;
    this.scoreValue = 150;
    this.color = 0xff0000;

    this.createMesh();
  }

  createMesh() {
    // Create menacing geometric virus shape

    // Core body - Dodecahedron
    const coreGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const coreMaterial = this.createGlowMaterial(this.color, 0.8);
    this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // Spikes protruding from faces
    this.spikes = [];
    const spikeGeometry = new THREE.ConeGeometry(0.3, 2, 8);
    const spikeMaterial = this.createGlowMaterial(0xff3333, 1);

    for (let i = 0; i < 12; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const phi = Math.acos(-1 + (2 * i) / 12);
      const theta = Math.sqrt(12 * Math.PI) * phi;

      spike.position.set(
        Math.cos(theta) * Math.sin(phi) * 2,
        Math.cos(phi) * 2,
        Math.sin(theta) * Math.sin(phi) * 2
      );

      spike.lookAt(0, 0, 0);
      spike.rotateX(Math.PI);

      this.spikes.push(spike);
      this.group.add(spike);
    }

    // Inner rotating core
    const innerCoreGeometry = new THREE.IcosahedronGeometry(0.8, 0);
    const innerCoreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1,
      wireframe: true,
    });
    this.innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    this.group.add(this.innerCore);

    // Energy field
    const fieldGeometry = new THREE.IcosahedronGeometry(3, 1);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    this.energyField = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.group.add(this.energyField);

    // Point light
    this.light = new THREE.PointLight(this.color, 1.5, 10);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Rotate main body
    this.mesh.rotation.x += deltaTime * 0.5;
    this.mesh.rotation.y += deltaTime * 0.8;

    // Counter-rotate inner core
    this.innerCore.rotation.x -= deltaTime * 2;
    this.innerCore.rotation.y -= deltaTime * 1.5;

    // Pulse spikes
    this.spikes.forEach((spike, index) => {
      const pulse = 1 + Math.sin(this.time * 3 + index) * 0.3;
      spike.scale.y = pulse;
    });

    // Rotate energy field
    this.energyField.rotation.x += deltaTime * 0.3;
    this.energyField.rotation.z += deltaTime * 0.5;

    // Pulse scale based on health
    const healthRatio = this.health / this.maxHealth;
    const scale = 1 + Math.sin(this.time * 2) * 0.1 * healthRatio;
    this.mesh.scale.setScalar(scale);
  }

  updateBehavior(deltaTime, playerPosition) {
    // Safety check
    if (!playerPosition) {
      return;
    }

    // Aggressive charge behavior
    const distanceToPlayer = this.position.distanceTo(playerPosition);

    if (distanceToPlayer > 5) {
      // Charge toward player
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      this.position.add(direction.multiplyScalar(this.speed * deltaTime));
    } else {
      // Circle around player when close
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();

      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      this.position.add(
        perpendicular.multiplyScalar(this.speed * deltaTime * 0.5)
      );
    }
  }
}
