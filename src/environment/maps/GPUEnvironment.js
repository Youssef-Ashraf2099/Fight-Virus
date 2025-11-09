import * as THREE from "three";
import BaseEnvironmentMap from "./BaseEnvironmentMap.js";

export default class GPUEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "GPU FORGE";
  }

  getPalette() {
    return {
      ambient: 0x140015,
      directional: 0xff5ba8,
      accentA: 0xff4488,
      accentB: 0xffe45f,
      fog: 0x10000a,
      fogDensity: 0.02,
      background: 0x1a0010,
    };
  }

  create() {
    this.buildCardBase();
    this.buildTripleFans();
    this.buildVRAMBanks();
    this.buildPowerRails();
    this.buildCoolingPipes();
    this.buildPixelEmitter();
    this.buildRenderCores();
    this.buildTensorCoreArray();
    this.buildRayTracingUnits();
    this.buildMemoryControllers();
    this.buildPCIeConnector();
    this.buildBackplate();
    this.buildShaderProcessors();
    this.buildPixelStormBoundaries();
  }

  buildCardBase() {
    const cardGeometry = new THREE.BoxGeometry(110, 3, 40);
    const cardMaterial = new THREE.MeshPhongMaterial({
      color: 0x250018,
      emissive: 0x5a002e,
      emissiveIntensity: 0.3,
      shininess: 70,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(0, -2, 0);
    card.receiveShadow = true;
    card.castShadow = true;
    this.group.add(card);

    const connectorGeometry = new THREE.BoxGeometry(112, 1.5, 12);
    const connectorMaterial = new THREE.MeshPhongMaterial({
      color: 0xffa133,
      emissive: 0xff6600,
      emissiveIntensity: 0.5,
    });
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connector.position.set(0, -3.2, -20);
    this.group.add(connector);

    const pcbTraceMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5bbd,
      transparent: true,
      opacity: 0.85,
    });
    const pcbTrace = new THREE.PlaneGeometry(108, 38, 20, 10);
    const traces = new THREE.Mesh(pcbTrace, pcbTraceMaterial);
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = -1.5;
    this.group.add(traces);

    const positions = traces.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.07) * Math.cos(z * 0.09) * 0.6);
    }
    positions.needsUpdate = true;
  }

  buildTripleFans() {
    const hubGeometry = new THREE.CylinderGeometry(4, 4, 1.8, 32);
    const hubMaterial = new THREE.MeshPhongMaterial({
      color: 0x35001d,
      emissive: 0xff3f95,
      emissiveIntensity: 0.6,
      shininess: 80,
    });

    const bladeGeometry = new THREE.BoxGeometry(1.4, 0.2, 12);
    const bladeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff79f4,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });

    [-34, 0, 34].forEach((xOffset, index) => {
      const fan = new THREE.Group();
      fan.position.set(xOffset, 0, 0);
      this.group.add(fan);

      const hub = new THREE.Mesh(hubGeometry, hubMaterial.clone());
      hub.rotation.x = Math.PI / 2;
      hub.castShadow = true;
      fan.add(hub);

      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial.clone());
        blade.position.z = 6;
        blade.rotation.y = (b / 5) * Math.PI * 2;
        fan.add(blade);
      }

      this.addAnimator((delta) => {
        fan.rotation.z += delta * (index === 1 ? 6 : 5);
      });
    });
  }

  buildVRAMBanks() {
    const bankGeometry = new THREE.BoxGeometry(10, 3, 6);
    const bankMaterial = new THREE.MeshPhongMaterial({
      color: 0x2b0030,
      emissive: 0xff53a0,
      emissiveIntensity: 0.45,
      shininess: 60,
    });

    for (let row = -1; row <= 1; row += 2) {
      for (let i = 0; i < 5; i++) {
        const bank = new THREE.Mesh(bankGeometry, bankMaterial.clone());
        bank.position.set(-40 + i * 20, 1, row * 12);
        bank.castShadow = true;
        bank.receiveShadow = true;
        this.group.add(bank);

        this.addAnimator((delta, time) => {
          bank.position.y = 1 + Math.sin(time * 3 + i * 0.5) * 0.6;
        });
      }
    }
  }

  buildPowerRails() {
    const railGeometry = new THREE.BoxGeometry(4, 6, 38);
    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0xff9e43,
      emissive: 0xff5400,
      emissiveIntensity: 0.5,
      shininess: 90,
    });

    const leftRail = new THREE.Mesh(railGeometry, railMaterial.clone());
    leftRail.position.set(-54, 2, 0);
    this.group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeometry, railMaterial.clone());
    rightRail.position.set(54, 2, 0);
    this.group.add(rightRail);

    this.addAnimator((delta, time) => {
      const glow = 0.4 + Math.sin(time * 4) * 0.3;
      leftRail.material.emissiveIntensity = glow;
      rightRail.material.emissiveIntensity = glow;
    });
  }

  buildCoolingPipes() {
    const pipeMaterial = new THREE.MeshPhongMaterial({
      color: 0xff70c5,
      emissive: 0xff99de,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });

    const createPipe = (zOffset) => {
      const points = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const angle = t * Math.PI * 2;
        const radius = 24 + Math.sin(angle * 3) * 2;
        const x = Math.cos(angle) * radius;
        const y = 6 + Math.sin(angle * 6) * 1.5;
        const z = zOffset + Math.sin(angle * 2) * 4;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 144, 1.2, 18, true);
      const pipe = new THREE.Mesh(geometry, pipeMaterial.clone());
      pipe.castShadow = true;
      this.group.add(pipe);

      this.addAnimator((delta, time) => {
        pipe.material.opacity = 0.55 + Math.sin(time * 4 + zOffset) * 0.2;
      });
    };

    createPipe(-12);
    createPipe(12);
  }

  buildPixelEmitter() {
    const emitterGeometry = new THREE.BoxGeometry(16, 4, 16);
    const emitterMaterial = new THREE.MeshPhongMaterial({
      color: 0x3e002a,
      emissive: 0xff76b3,
      emissiveIntensity: 0.7,
      shininess: 120,
      transparent: true,
      opacity: 0.9,
    });
    const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
    emitter.position.set(0, 12, 0);
    emitter.castShadow = true;
    this.group.add(emitter);

    const pixelGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const pixelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffa7dd,
      emissive: 0xffffff,
      emissiveIntensity: 1,
    });

    const pixels = [];
    for (let i = 0; i < 120; i++) {
      const pixel = new THREE.Mesh(pixelGeometry, pixelMaterial.clone());
      pixel.position.set(
        (Math.random() - 0.5) * 20,
        12 + Math.random() * 6,
        (Math.random() - 0.5) * 20
      );
      pixel.userData = {
        baseY: pixel.position.y,
        offset: Math.random() * Math.PI * 2,
      };
      pixels.push(pixel);
      this.group.add(pixel);
    }

    this.addAnimator((delta, time) => {
      pixels.forEach((pixel, index) => {
        pixel.position.y =
          pixel.userData.baseY + Math.sin(time * 3 + pixel.userData.offset) * 4;
        pixel.material.emissiveIntensity =
          0.6 + Math.sin(time * 5 + index) * 0.4;
      });
      emitter.scale.y = 1 + Math.sin(time * 4) * 0.2;
    });
  }

  buildRenderCores() {
    // Multiple GPU cores arranged in grid
    const coreGeometry = new THREE.BoxGeometry(8, 4, 8);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x4d0033,
      emissive: 0xff44aa,
      emissiveIntensity: 0.7,
      shininess: 100,
    });

    const gridSize = 3;
    const spacing = 18;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const core = new THREE.Mesh(coreGeometry, coreMaterial.clone());
        core.position.set(
          (x - gridSize / 2 + 0.5) * spacing,
          4,
          (z - gridSize / 2 + 0.5) * spacing - 10
        );
        core.castShadow = true;
        core.receiveShadow = true;
        this.group.add(core);

        // Heat sink fins on top
        for (let i = 0; i < 5; i++) {
          const fin = new THREE.Mesh(
            new THREE.BoxGeometry(7, 0.5, 0.8),
            new THREE.MeshPhongMaterial({
              color: 0xff88cc,
              emissive: 0xff4499,
              emissiveIntensity: 0.4,
            })
          );
          fin.position.set(0, 2 + i * 0.8, -3 + i * 1.2);
          core.add(fin);
        }

        // Pulsing animation
        const delay = (x * gridSize + z) * 0.3;
        this.addAnimator((delta, time) => {
          const pulse = Math.sin(time * 2 + delay) * 0.5 + 0.5;
          core.material.emissiveIntensity = 0.4 + pulse * 0.4;
          core.scale.y = 1 + pulse * 0.1;
        });

        // Add collider
        this.addCollider({
          minX: core.position.x - 4,
          maxX: core.position.x + 4,
          minZ: core.position.z - 4,
          maxZ: core.position.z + 4,
          height: 8,
        });
      }
    }
  }

  buildTensorCoreArray() {
    // AI/ML tensor processing units
    const tensorMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffaa,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.8,
      shininess: 120,
      transparent: true,
      opacity: 0.9,
    });

    const arrayGroup = new THREE.Group();
    arrayGroup.position.set(40, 6, -20);
    this.group.add(arrayGroup);

    // Main tensor unit
    const mainUnit = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 12),
      tensorMaterial.clone()
    );
    arrayGroup.add(mainUnit);

    // Neural network visualization
    const nodeGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const nodeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
    });

    const nodes = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 6; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
        const angle = (i / 6) * Math.PI * 2;
        const radius = 7 + layer * 2;
        node.position.set(
          Math.cos(angle) * radius,
          (layer - 1) * 4,
          Math.sin(angle) * radius
        );
        arrayGroup.add(node);
        nodes.push(node);
      }
    }

    // Data flow lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < nodes.length - 6; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        nodes[i].position,
        nodes[i + 6].position,
      ]);
      const line = new THREE.Line(geometry, lineMaterial.clone());
      arrayGroup.add(line);
    }

    this.addAnimator((delta, time) => {
      arrayGroup.rotation.y = time * 0.5;
      nodes.forEach((node, i) => {
        node.material.emissiveIntensity = 1.5 + Math.sin(time * 4 + i) * 0.5;
      });
    });

    // Collider
    this.addCollider({
      minX: 28,
      maxX: 52,
      minZ: -32,
      maxZ: -8,
      height: 14,
    });
  }

  buildRayTracingUnits() {
    // RT cores for realistic lighting
    const rtMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      emissive: 0xffdd00,
      emissiveIntensity: 0.6,
      shininess: 110,
    });

    for (let i = 0; i < 4; i++) {
      const rtCore = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 6, 8),
        rtMaterial.clone()
      );
      rtCore.position.set(-40 + i * 26, 5, 18);
      rtCore.castShadow = true;
      rtCore.receiveShadow = true;
      this.group.add(rtCore);

      // Light rays emanating
      const rayCount = 12;
      for (let r = 0; r < rayCount; r++) {
        const angle = (r / rayCount) * Math.PI * 2;
        const rayGeometry = new THREE.BoxGeometry(0.3, 0.3, 8);
        const rayMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffaa,
          transparent: true,
          opacity: 0.7,
        });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.position.set(Math.cos(angle) * 4, 3, Math.sin(angle) * 4);
        ray.rotation.y = angle;
        rtCore.add(ray);
      }

      this.addAnimator((delta, time) => {
        rtCore.rotation.y = time * 2 + i;
        rtCore.position.y = 5 + Math.sin(time * 3 + i) * 0.8;
      });

      // Collider
      this.addCollider({
        minX: rtCore.position.x - 4,
        maxX: rtCore.position.x + 4,
        minZ: rtCore.position.z - 4,
        maxZ: rtCore.position.z + 4,
        height: 11,
      });
    }
  }

  buildMemoryControllers() {
    // Memory interface controllers
    const controllerMaterial = new THREE.MeshPhongMaterial({
      color: 0x3300ff,
      emissive: 0x6633ff,
      emissiveIntensity: 0.5,
      shininess: 90,
    });

    const positions = [
      { x: -45, z: -15 },
      { x: 45, z: -15 },
      { x: -45, z: 15 },
      { x: 45, z: 15 },
    ];

    positions.forEach((pos, idx) => {
      const controller = new THREE.Mesh(
        new THREE.BoxGeometry(6, 5, 6),
        controllerMaterial.clone()
      );
      controller.position.set(pos.x, 2.5, pos.z);
      controller.castShadow = true;
      controller.receiveShadow = true;
      this.group.add(controller);

      // Data stream visualization
      const streamGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 16);
      const streamMaterial = new THREE.MeshPhongMaterial({
        color: 0x8866ff,
        emissive: 0xaa88ff,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.8,
      });
      const stream = new THREE.Mesh(streamGeometry, streamMaterial);
      stream.position.y = 10;
      controller.add(stream);

      this.addAnimator((delta, time) => {
        controller.material.emissiveIntensity =
          0.3 + Math.sin(time * 5 + idx) * 0.3;
        stream.position.y = 10 + Math.sin(time * 3 + idx) * 3;
        stream.material.opacity = 0.6 + Math.sin(time * 4 + idx) * 0.2;
      });

      // Collider
      this.addCollider({
        minX: pos.x - 3,
        maxX: pos.x + 3,
        minZ: pos.z - 3,
        maxZ: pos.z + 3,
        height: 7.5,
      });
    });
  }

  buildPCIeConnector() {
    // PCIe interface at the back
    const connectorGroup = new THREE.Group();
    connectorGroup.position.set(0, -1, -22);
    this.group.add(connectorGroup);

    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x665500,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3,
      shininess: 70,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 4), baseMaterial);
    connectorGroup.add(base);

    // Gold contacts
    const contactMaterial = new THREE.MeshPhongMaterial({
      color: 0xffdd00,
      emissive: 0xffee00,
      emissiveIntensity: 0.6,
      shininess: 150,
    });

    for (let i = 0; i < 20; i++) {
      const contact = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 0.5),
        contactMaterial.clone()
      );
      contact.position.set(-45 + i * 4.5, 0, -1.5);
      connectorGroup.add(contact);

      this.addAnimator((delta, time) => {
        contact.material.emissiveIntensity =
          0.4 + Math.sin(time * 10 + i) * 0.3;
      });
    }

    // Collider
    this.addCollider({
      minX: -50,
      maxX: 50,
      minZ: -25,
      maxZ: -19,
      height: 1,
    });
  }

  buildBackplate() {
    // Protective backplate with company logo area
    const backplateMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x330033,
      emissiveIntensity: 0.2,
      shininess: 100,
      metalness: 0.8,
    });

    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(108, 0.8, 38),
      backplateMaterial
    );
    backplate.position.y = -2.5;
    backplate.receiveShadow = true;
    this.group.add(backplate);

    // Logo area - glowing brand
    const logoMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
    });

    const logo = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.3, 8),
      logoMaterial
    );
    logo.position.set(0, -2.1, 0);
    this.group.add(logo);

    this.addAnimator((delta, time) => {
      logo.material.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.4;
    });
  }

  buildShaderProcessors() {
    // Shader processing units with streaming multiprocessors
    const smMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0066,
      emissive: 0xff3388,
      emissiveIntensity: 0.6,
      shininess: 95,
    });

    // Create shader processor arrays
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const sm = new THREE.Mesh(
          new THREE.BoxGeometry(5, 2.5, 5),
          smMaterial.clone()
        );
        sm.position.set(-37.5 + col * 15, 1.5, -6 + row * 12);
        sm.castShadow = true;
        sm.receiveShadow = true;
        this.group.add(sm);

        // Thread blocks visualization
        for (let i = 0; i < 4; i++) {
          const thread = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.3, 1),
            new THREE.MeshPhongMaterial({
              color: 0xffaa55,
              emissive: 0xff6622,
              emissiveIntensity: 0.8,
            })
          );
          thread.position.set(
            (i % 2) * 1.5 - 0.75,
            1.5,
            Math.floor(i / 2) * 1.5 - 0.75
          );
          sm.add(thread);
        }

        const delay = (row * 6 + col) * 0.2;
        this.addAnimator((delta, time) => {
          sm.material.emissiveIntensity =
            0.4 + Math.sin(time * 6 + delay) * 0.3;
        });

        // Collider
        this.addCollider({
          minX: sm.position.x - 2.5,
          maxX: sm.position.x + 2.5,
          minZ: sm.position.z - 2.5,
          maxZ: sm.position.z + 2.5,
          height: 4,
        });
      }
    }
  }

  buildPixelStormBoundaries() {
    // Create animated pixel particle storms as boundaries
    const boundaryDistance = 55;
    const collisionDistance = 57; // Slightly beyond visual boundary
    const particleCount = 100;

    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    // Create particle systems for each wall
    const createParticleWall = (axis, position) => {
      const particles = [];

      for (let i = 0; i < particleCount; i++) {
        let x, y, z;
        if (axis === "x") {
          x = position;
          y = Math.random() * 25;
          z = (Math.random() - 0.5) * 110;
        } else {
          x = (Math.random() - 0.5) * 110;
          y = Math.random() * 25;
          z = position;
        }

        positions.push(x, y, z);

        // Pink/magenta/yellow colors for GPU theme
        const colorChoice = Math.random();
        if (colorChoice < 0.4) {
          colors.push(1, 0.3, 0.6); // Pink
        } else if (colorChoice < 0.7) {
          colors.push(1, 0.5, 1); // Magenta
        } else {
          colors.push(1, 0.9, 0.4); // Yellow
        }

        sizes.push(0.8 + Math.random() * 1.2);

        particles.push({
          velocity: (Math.random() - 0.5) * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }

      return particles;
    };

    // North wall particles
    const northParticles = createParticleWall("z", boundaryDistance);

    // South wall particles
    const southParticles = createParticleWall("z", -boundaryDistance);

    // East wall particles
    const eastParticles = createParticleWall("x", boundaryDistance);

    // West wall particles
    const westParticles = createParticleWall("x", -boundaryDistance);

    particleGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );
    particleGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: this.createPixelTexture(),
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(particleSystem);

    // Glowing barrier planes
    const barrierMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4488,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const wallHeight = 25;
    const wallWidth = 110;

    // North barrier
    const northBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, wallHeight),
      barrierMaterial.clone()
    );
    northBarrier.position.set(0, wallHeight / 2, boundaryDistance - 1);
    this.group.add(northBarrier);

    // South barrier
    const southBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, wallHeight),
      barrierMaterial.clone()
    );
    southBarrier.position.set(0, wallHeight / 2, -boundaryDistance + 1);
    this.group.add(southBarrier);

    // East barrier
    const eastBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, wallHeight),
      barrierMaterial.clone()
    );
    eastBarrier.rotation.y = Math.PI / 2;
    eastBarrier.position.set(boundaryDistance - 1, wallHeight / 2, 0);
    this.group.add(eastBarrier);

    // West barrier
    const westBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWidth, wallHeight),
      barrierMaterial.clone()
    );
    westBarrier.rotation.y = Math.PI / 2;
    westBarrier.position.set(-boundaryDistance + 1, wallHeight / 2, 0);
    this.group.add(westBarrier);

    // Add colliders
    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: collisionDistance - 1,
      maxZ: collisionDistance + 1,
      height: wallHeight,
    });

    this.addCollider({
      minX: -collisionDistance,
      maxX: collisionDistance,
      minZ: -collisionDistance - 1,
      maxZ: -collisionDistance + 1,
      height: wallHeight,
    });

    this.addCollider({
      minX: collisionDistance - 1,
      maxX: collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: wallHeight,
    });

    this.addCollider({
      minX: -collisionDistance - 1,
      maxX: -collisionDistance + 1,
      minZ: -collisionDistance,
      maxZ: collisionDistance,
      height: wallHeight,
    });

    // Animate particles and barriers
    this.addAnimator((delta, time) => {
      const posArray = particleGeometry.attributes.position.array;
      const allParticles = [
        ...northParticles,
        ...southParticles,
        ...eastParticles,
        ...westParticles,
      ];

      for (let i = 0; i < allParticles.length; i++) {
        const particle = allParticles[i];
        const idx = i * 3;

        // Vertical bobbing
        posArray[idx + 1] += Math.sin(time * 3 + particle.phase) * 0.02;

        // Keep particles within wall bounds
        if (posArray[idx + 1] < 0) posArray[idx + 1] = 25;
        if (posArray[idx + 1] > 25) posArray[idx + 1] = 0;
      }

      particleGeometry.attributes.position.needsUpdate = true;

      // Pulse barriers
      const pulse = 0.05 + Math.sin(time * 4) * 0.04;
      northBarrier.material.opacity = pulse;
      southBarrier.material.opacity = pulse;
      eastBarrier.material.opacity = pulse;
      westBarrier.material.opacity = pulse;
    });
  }

  createPixelTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 100, 200, 0.8)");
    gradient.addColorStop(1, "rgba(255, 100, 200, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
