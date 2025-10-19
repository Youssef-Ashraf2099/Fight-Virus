class NetworkHubEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "NETWORK HUB NEXUS";
    this.dataPackets = [];
  }

  getPalette() {
    return {
      ambient: 0x080f15,
      directional: 0x33aaff,
      accentA: 0x00ccff,
      accentB: 0xff6633,
      fog: 0x020507,
      fogDensity: 0.015,
      background: 0x010304,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildCentralHub();
    this.buildDataPipelines();
    this.buildRouterNodes();
    this.buildFirewallBarriers();
    this.buildPacketStream();
  }

  buildCentralHub() {
    // Main hub core
    const coreGeometry = new THREE.IcosahedronGeometry(8, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a5a,
      emissive: 0x33aaff,
      emissiveIntensity: 0.8,
      shininess: 100,
      wireframe: false,
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.core.position.set(0, 10, 0);
    this.group.add(this.core);

    // Inner core
    const innerCoreGeometry = new THREE.IcosahedronGeometry(6, 0);
    const innerCoreMaterial = new THREE.MeshPhongMaterial({
      color: 0x66ccff,
      emissive: 0x66ccff,
      emissiveIntensity: 1.2,
      wireframe: true,
    });
    this.innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    this.innerCore.position.set(0, 10, 0);
    this.group.add(this.innerCore);

    // Hub platform
    const platformGeometry = new THREE.CylinderGeometry(12, 15, 3, 8);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a2a3a,
      emissive: 0x2a4a6a,
      emissiveIntensity: 0.4,
      shininess: 80,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 1.5, 0);
    this.group.add(platform);

    // Core collider
    this.addCollider({
      minX: -12,
      maxX: 12,
      minZ: -12,
      maxZ: 12,
      height: 3,
    });
  }

  buildDataPipelines() {
    const directions = [
      { x: 1, z: 0 }, // East
      { x: -1, z: 0 }, // West
      { x: 0, z: 1 }, // South
      { x: 0, z: -1 }, // North
      { x: 0.7, z: 0.7 }, // SE
      { x: -0.7, z: 0.7 }, // SW
      { x: 0.7, z: -0.7 }, // NE
      { x: -0.7, z: -0.7 }, // NW
    ];

    const pipeMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a4a6a,
      emissive: 0x3a6a9a,
      emissiveIntensity: 0.5,
      shininess: 90,
    });

    this.pipelines = [];

    directions.forEach((dir, index) => {
      const pipeGroup = new THREE.Group();

      // Main pipe
      const pipeGeometry = new THREE.CylinderGeometry(2, 2, 50, 12);
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial.clone());
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(dir.x * 25, 2, dir.z * 25);

      const angle = Math.atan2(dir.z, dir.x);
      pipe.rotation.y = -angle;

      pipeGroup.add(pipe);

      // Pipe segments (decorative)
      for (let i = 0; i < 5; i++) {
        const segmentGeometry = new THREE.TorusGeometry(2.3, 0.3, 8, 16);
        const segment = new THREE.Mesh(segmentGeometry, pipeMaterial.clone());
        segment.position.set(dir.x * (10 + i * 8), 2, dir.z * (10 + i * 8));
        segment.rotation.y = angle;
        segment.rotation.x = Math.PI / 2;
        pipeGroup.add(segment);
      }

      // Data flow lights inside pipe
      for (let i = 0; i < 8; i++) {
        const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMaterial = new THREE.MeshPhongMaterial({
          color: 0x00ccff,
          emissive: 0x00ccff,
          emissiveIntensity: 1.5,
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.userData = {
          startPos: 5,
          direction: dir,
          speed: 10 + Math.random() * 10,
          offset: i / 8,
        };
        pipeGroup.add(light);
        this.dataPackets.push(light);
      }

      this.pipelines.push(pipeGroup);
      this.group.add(pipeGroup);

      // Pipe colliders
      const length = 25;
      const colliderSize = 3;
      this.addCollider({
        minX: dir.x * length - colliderSize,
        maxX: dir.x * length + colliderSize,
        minZ: dir.z * length - colliderSize,
        maxZ: dir.z * length + colliderSize,
        height: 4,
      });
    });
  }

  buildRouterNodes() {
    const nodePositions = [
      [30, 0, 30],
      [-30, 0, 30],
      [30, 0, -30],
      [-30, 0, -30],
    ];

    nodePositions.forEach((pos) => {
      // Node structure
      const nodeGeometry = new THREE.BoxGeometry(8, 12, 8);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a3a5a,
        emissive: 0x4a6a9a,
        emissiveIntensity: 0.5,
        shininess: 80,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(pos[0], 6, pos[2]);
      this.group.add(node);

      // Node antenna
      const antennaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      const antenna = new THREE.Mesh(antennaGeometry, nodeMaterial);
      antenna.position.set(pos[0], 14, pos[2]);
      this.group.add(antenna);

      // Signal beacon
      const beaconGeometry = new THREE.SphereGeometry(1.5, 12, 12);
      const beaconMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6633,
        emissive: 0xff6633,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.8,
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(pos[0], 18, pos[2]);
      beacon.userData = { baseScale: 1 };
      this.group.add(beacon);

      // Pulsing ring
      const ringGeometry = new THREE.TorusGeometry(3, 0.3, 8, 24);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6633,
        emissive: 0xff6633,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(pos[0], 18, pos[2]);
      ring.rotation.x = Math.PI / 2;
      this.group.add(ring);

      // Point light
      const light = new THREE.PointLight(0xff6633, 1.5, 25);
      light.position.set(pos[0], 18, pos[2]);
      this.group.add(light);

      // Node collider
      this.addCollider({
        minX: pos[0] - 4,
        maxX: pos[0] + 4,
        minZ: pos[2] - 4,
        maxZ: pos[2] + 4,
        height: 12,
      });

      this.addAnimator((delta, time) => {
        // Pulse beacon
        const scale = 1 + Math.sin(time * 3) * 0.3;
        beacon.scale.setScalar(scale);
        beacon.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;

        // Expand ring
        ring.scale.setScalar(1 + ((time * 2) % 1) * 0.5);
        ring.material.opacity = 0.6 - ((time * 2) % 1) * 0.6;
      });
    });
  }

  buildFirewallBarriers() {
    // Firewall segments
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const radius = 45;

      const barrierGeometry = new THREE.BoxGeometry(2, 15, 15);
      const barrierMaterial = new THREE.MeshPhongMaterial({
        color: 0xff4422,
        emissive: 0xff6633,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(
        Math.cos(angle) * radius,
        7.5,
        Math.sin(angle) * radius
      );
      barrier.rotation.y = angle + Math.PI / 2;
      this.group.add(barrier);

      // Energy field effect
      const fieldGeometry = new THREE.PlaneGeometry(14, 14, 4, 4);
      const fieldMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6633,
        emissive: 0xff6633,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        wireframe: true,
      });
      const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.position.set(
        Math.cos(angle) * radius,
        7.5,
        Math.sin(angle) * radius
      );
      field.rotation.y = angle + Math.PI / 2;
      this.group.add(field);

      // Barrier collider
      const colliderX = Math.cos(angle) * radius;
      const colliderZ = Math.sin(angle) * radius;
      this.addCollider({
        minX: colliderX - 1,
        maxX: colliderX + 1,
        minZ: colliderZ - 7.5,
        maxZ: colliderZ + 7.5,
        height: 15,
      });
    }
  }

  buildPacketStream() {
    this.addAnimator((delta, time) => {
      // Rotate core
      this.core.rotation.x += delta * 0.3;
      this.core.rotation.y += delta * 0.5;
      this.innerCore.rotation.x -= delta * 0.8;
      this.innerCore.rotation.y -= delta * 1.2;

      // Pulse core
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      this.core.scale.setScalar(pulse);

      // Animate data packets in pipes
      this.dataPackets.forEach((packet) => {
        const distance =
          (time * packet.userData.speed + packet.userData.offset * 50) % 50;
        packet.position.set(
          packet.userData.direction.x * distance,
          2,
          packet.userData.direction.z * distance
        );
        packet.scale.setScalar(
          0.8 + Math.sin(time * 4 + packet.userData.offset * Math.PI) * 0.3
        );
      });
    });
  }
}
