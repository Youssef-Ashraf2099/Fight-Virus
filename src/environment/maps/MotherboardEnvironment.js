class MotherboardEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "MOTHERBOARD EXPANSE";
  }

  getPalette() {
    return {
      ambient: 0x001b24,
      directional: 0x66ffd6,
      accentA: 0x32ffc2,
      accentB: 0x6bc3ff,
      fog: 0x001019,
      fogDensity: 0.015,
      background: 0x001423,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildMainBoard();
    this.buildChipsetQuadrant();
    this.buildVoltageRail();
    this.buildPciLanes();
    this.buildIoRampart();
    this.buildSignalSpans();
    this.buildDataGrid();
  }

  buildMainBoard() {
    const boardMaterial = new THREE.MeshPhongMaterial({
      color: 0x032733,
      emissive: 0x044d64,
      emissiveIntensity: 0.28,
      shininess: 45,
    });
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(150, 2.5, 150),
      boardMaterial
    );
    board.position.y = -1.25;
    board.receiveShadow = true;
    this.group.add(board);

    const solderPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(146, 146, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x1ddfb8,
        transparent: true,
        opacity: 0.7,
      })
    );
    solderPlane.rotation.x = -Math.PI / 2;
    solderPlane.position.y = 0.05;
    this.group.add(solderPlane);

    const pos = solderPlane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const ripple = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.35;
      pos.setZ(i, ripple);
    }
    pos.needsUpdate = true;

    this.addCollider({
      minX: -70,
      maxX: 70,
      minZ: -70,
      maxZ: 70,
      height: 0,
    });
  }

  buildChipsetQuadrant() {
    const socketPlatformMaterial = new THREE.MeshPhongMaterial({
      color: 0x063c4a,
      emissive: 0x08d9ad,
      emissiveIntensity: 0.35,
    });
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(32, 2.4, 32),
      socketPlatformMaterial
    );
    platform.position.set(-36, 1.2, -28);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.group.add(platform);

    const socketFrame = new THREE.Mesh(
      new THREE.BoxGeometry(24, 3, 24),
      new THREE.MeshPhongMaterial({
        color: 0x0a6279,
        emissive: 0x1af9cc,
        emissiveIntensity: 0.45,
      })
    );
    socketFrame.position.set(-36, 3.5, -28);
    socketFrame.castShadow = true;
    socketFrame.receiveShadow = true;
    this.group.add(socketFrame);

    const dieCover = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 14),
      new THREE.MeshPhongMaterial({
        color: 0x10404f,
        emissive: 0x38ffd8,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.9,
      })
    );
    dieCover.position.set(-36, 5.5, -28);
    dieCover.castShadow = true;
    this.group.add(dieCover);

    const clamp = new THREE.Mesh(
      new THREE.TorusGeometry(16, 0.7, 16, 42),
      new THREE.MeshPhongMaterial({
        color: 0x134e65,
        emissive: 0x32ffcd,
        emissiveIntensity: 0.5,
      })
    );
    clamp.rotation.x = Math.PI / 2;
    clamp.position.set(-36, 4.6, -28);
    this.group.add(clamp);

    const chokesMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b2836,
      emissive: 0x2cf7d2,
      emissiveIntensity: 0.35,
    });
    for (let i = 0; i < 6; i++) {
      const choke = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.4, 4, 18),
        chokesMaterial.clone()
      );
      choke.position.set(-52 + i * 6, 2, -36);
      choke.castShadow = true;
      choke.receiveShadow = true;
      this.group.add(choke);

      this.addAnimator((delta, time) => {
        choke.material.emissiveIntensity = 0.25 + Math.sin(time * 3 + i) * 0.2;
      });

      this.addCollider({
        minX: -54 + i * 6,
        maxX: -50 + i * 6,
        minZ: -38,
        maxZ: -34,
        height: 2.5,
      });
    }

    this.addCollider({
      minX: -52,
      maxX: -20,
      minZ: -44,
      maxZ: -12,
      height: 5.5,
    });
  }

  buildVoltageRail() {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2, 96),
      new THREE.MeshPhongMaterial({
        color: 0x082632,
        emissive: 0x16b0ff,
        emissiveIntensity: 0.4,
      })
    );
    rail.position.set(-60, 1, 20);
    rail.castShadow = true;
    rail.receiveShadow = true;
    this.group.add(rail);

    const capMaterial = new THREE.MeshPhongMaterial({
      color: 0x013144,
      emissive: 0x22ffd5,
      emissiveIntensity: 0.5,
    });
    for (let i = 0; i < 8; i++) {
      const capacitor = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.8, 8, 20),
        capMaterial.clone()
      );
      capacitor.position.set(-60, 5, -30 + i * 12);
      capacitor.castShadow = true;
      capacitor.receiveShadow = true;
      this.group.add(capacitor);

      this.addAnimator((delta, time) => {
        capacitor.material.emissiveIntensity =
          0.35 + Math.sin(time * 2.4 + i) * 0.2;
      });

      this.addCollider({
        minX: -63,
        maxX: -57,
        minZ: -33 + i * 12,
        maxZ: -27 + i * 12,
        height: 4.5,
      });
    }

    this.addCollider({
      minX: -64,
      maxX: -56,
      minZ: -32,
      maxZ: 56,
      height: 2,
    });
  }

  buildPciLanes() {
    const laneMaterial = new THREE.MeshPhongMaterial({
      color: 0x022c3d,
      emissive: 0x17a1ff,
      emissiveIntensity: 0.45,
    });
    const supportMaterial = new THREE.MeshPhongMaterial({
      color: 0x062a38,
      emissive: 0x1596ff,
      emissiveIntensity: 0.3,
    });

    for (let i = 0; i < 4; i++) {
      const y = 0.9 + i * 0.2;
      const lane = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1.4, 44),
        laneMaterial.clone()
      );
      lane.position.set(16 + i * 16, y, 32);
      lane.castShadow = true;
      lane.receiveShadow = true;
      this.group.add(lane);

      const latch = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 6),
        supportMaterial.clone()
      );
      latch.position.set(16 + i * 16, y + 1.3, 53);
      latch.castShadow = true;
      latch.receiveShadow = true;
      this.group.add(latch);

      this.addAnimator((delta, time) => {
        lane.material.emissiveIntensity = 0.3 + Math.sin(time * 3 + i) * 0.2;
      });

      this.addCollider({
        minX: 13 + i * 16,
        maxX: 19 + i * 16,
        minZ: 10,
        maxZ: 54,
        height: y + 0.7,
      });

      this.addCollider({
        minX: 14 + i * 16,
        maxX: 18 + i * 16,
        minZ: 50,
        maxZ: 58,
        height: y + 2.2,
      });
    }
  }

  buildIoRampart() {
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x012d3f,
      emissive: 0x2af7c4,
      emissiveIntensity: 0.4,
    });
    const rampart = new THREE.Mesh(
      new THREE.BoxGeometry(6, 24, 150),
      wallMaterial
    );
    rampart.position.set(76, 12, 0);
    rampart.castShadow = true;
    rampart.receiveShadow = true;
    this.group.add(rampart);

    const walkway = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.4, 120),
      new THREE.MeshPhongMaterial({
        color: 0x082a3d,
        emissive: 0x1cd1ff,
        emissiveIntensity: 0.35,
      })
    );
    walkway.position.set(70, 1.2, 0);
    walkway.castShadow = true;
    walkway.receiveShadow = true;
    this.group.add(walkway);

    this.addCollider({
      minX: 62,
      maxX: 78,
      minZ: -60,
      maxZ: 60,
      height: 1.2,
    });

    const portMaterial = new THREE.MeshPhongMaterial({
      color: 0x065d83,
      emissive: 0x50ffe2,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
    });
    for (let i = 0; i < 10; i++) {
      const port = new THREE.Mesh(
        new THREE.BoxGeometry(3, 6, 10),
        portMaterial.clone()
      );
      port.position.set(78.5, -4 + i * 5, -55 + (i % 5) * 28);
      port.castShadow = true;
      this.group.add(port);

      this.addAnimator((delta, time) => {
        port.material.opacity = 0.45 + Math.sin(time * 3.5 + i) * 0.25;
      });
    }
  }

  buildSignalSpans() {
    const spanMaterial = new THREE.MeshPhongMaterial({
      color: 0x013144,
      emissive: 0x22ffd5,
      emissiveIntensity: 0.45,
    });

    [-48, 0, 48].forEach((xOffset, idx) => {
      const span = new THREE.Mesh(
        new THREE.BoxGeometry(10, 2, 36),
        spanMaterial.clone()
      );
      span.position.set(xOffset, 1.8, -52);
      span.castShadow = true;
      span.receiveShadow = true;
      this.group.add(span);

      const pylon = new THREE.Mesh(
        new THREE.BoxGeometry(6, 10, 6),
        spanMaterial.clone()
      );
      pylon.position.set(xOffset, 6, -52);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      this.group.add(pylon);

      const pulse = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 30, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x4affd8,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
      );
      pulse.rotation.x = Math.PI / 2;
      pulse.position.set(xOffset, 6, -52);
      this.group.add(pulse);

      this.addAnimator((delta, time) => {
        pulse.material.opacity = 0.2 + Math.sin(time * 3 + idx) * 0.18;
        pylon.position.y = 6 + Math.sin(time * 1.4 + idx) * 0.6;
      });

      this.addCollider({
        minX: xOffset - 5,
        maxX: xOffset + 5,
        minZ: -70,
        maxZ: -34,
        height: 1.8,
      });
    });
  }

  buildDataGrid() {
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x3cffd5,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const dataRail = new THREE.Group();
    this.group.add(dataRail);

    for (let i = -60; i <= 60; i += 12) {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 120),
        gridMaterial.clone()
      );
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(i, 0.2, 0);
      dataRail.add(strip);
    }

    const packets = [];
    for (let i = 0; i < 40; i++) {
      const packet = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 12),
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: 0x6bffe0,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.85,
        })
      );
      packet.userData = {
        lane: i % 10,
        offset: Math.random(),
        speed: 0.2 + Math.random() * 0.15,
      };
      packets.push(packet);
      this.group.add(packet);
    }

    this.addAnimator((delta, time) => {
      dataRail.children.forEach((strip, idx) => {
        strip.material.opacity = 0.35 + Math.sin(time * 2.8 + idx) * 0.15;
      });

      packets.forEach((packet) => {
        const zRange = 110;
        const z =
          -55 +
          ((packet.userData.offset + time * packet.userData.speed) % 1) *
            zRange;
        const x = -60 + packet.userData.lane * 12;
        packet.position.set(
          x,
          0.6 + Math.sin(time * 6 + packet.userData.lane) * 0.6,
          z
        );
      });
    });
  }
}
