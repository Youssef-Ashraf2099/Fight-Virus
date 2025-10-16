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
    this.buildPrimaryBoard();
    this.buildTraceHighways();
    this.buildSocketDistrict();
    this.buildExpansionSlots();
    this.buildIOWall();
    this.buildSignalBridges();
  }

  buildPrimaryBoard() {
    const boardGeometry = new THREE.BoxGeometry(140, 2, 140);
    const boardMaterial = new THREE.MeshPhongMaterial({
      color: 0x032733,
      emissive: 0x044d64,
      emissiveIntensity: 0.25,
      shininess: 40,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = -5;
    board.receiveShadow = true;
    this.group.add(board);

    const solderMaskMaterial = new THREE.MeshBasicMaterial({
      color: 0x1ddfb8,
      transparent: true,
      opacity: 0.7,
    });
    const solderMaskGeometry = new THREE.PlaneGeometry(138, 138, 30, 30);
    const solderMask = new THREE.Mesh(solderMaskGeometry, solderMaskMaterial);
    solderMask.rotation.x = -Math.PI / 2;
    solderMask.position.y = -4;
    this.group.add(solderMask);

    const pos = solderMask.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5);
    }
    pos.needsUpdate = true;
  }

  buildTraceHighways() {
    const ribbonMaterial = new THREE.MeshBasicMaterial({
      color: 0x3cffd5,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });

    const buildRibbon = (points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 120, 1.4, 12, false);
      const mesh = new THREE.Mesh(geometry, ribbonMaterial.clone());
      this.group.add(mesh);

      this.addAnimator((delta, time) => {
        mesh.material.opacity = 0.25 + Math.sin(time * 2 + points[0].x) * 0.25;
      });
    };

    buildRibbon([
      new THREE.Vector3(-60, 0, -40),
      new THREE.Vector3(-20, 6, -10),
      new THREE.Vector3(25, 6, 20),
      new THREE.Vector3(60, 0, 40),
    ]);

    buildRibbon([
      new THREE.Vector3(60, 0, -30),
      new THREE.Vector3(20, 8, -5),
      new THREE.Vector3(-30, 6, 25),
      new THREE.Vector3(-60, 0, 45),
    ]);
  }

  buildSocketDistrict() {
    const baseGeometry = new THREE.BoxGeometry(24, 3, 24);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x063c4a,
      emissive: 0x08d9ad,
      emissiveIntensity: 0.3,
    });
    const socketBase = new THREE.Mesh(baseGeometry, baseMaterial);
    socketBase.position.set(-35, 0, -35);
    socketBase.castShadow = true;
    socketBase.receiveShadow = true;
    this.group.add(socketBase);

    const slotGeometry = new THREE.BoxGeometry(4, 8, 10);
    const slotMaterial = new THREE.MeshPhongMaterial({
      color: 0x0e5f70,
      emissive: 0x35ffda,
      emissiveIntensity: 0.4,
    });

    const slotGroup = new THREE.Group();
    slotGroup.position.copy(socketBase.position);
    slotGroup.position.y = 7;
    this.group.add(slotGroup);

    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        const slot = new THREE.Mesh(slotGeometry, slotMaterial.clone());
        slot.position.set(x * 5, 0, z * 5);
        slot.castShadow = true;
        slot.receiveShadow = true;
        slotGroup.add(slot);
      }
    }

    this.addAnimator((delta, time) => {
      slotGroup.rotation.y = Math.sin(time * 0.6) * 0.3;
      slotGroup.scale.y = 1 + Math.sin(time * 2) * 0.1;
    });

    const capacitorGeometry = new THREE.CylinderGeometry(1.3, 1.3, 6, 12);
    const capacitorMaterial = new THREE.MeshPhongMaterial({
      color: 0x043b46,
      emissive: 0x37ffcc,
      emissiveIntensity: 0.6,
    });

    for (let i = 0; i < 12; i++) {
      const cap = new THREE.Mesh(capacitorGeometry, capacitorMaterial.clone());
      const angle = (i / 12) * Math.PI * 2;
      cap.position.set(
        socketBase.position.x + Math.cos(angle) * 20,
        1,
        socketBase.position.z + Math.sin(angle) * 20
      );
      cap.castShadow = true;
      this.group.add(cap);

      this.addAnimator((delta, time) => {
        cap.material.emissiveIntensity = 0.2 + Math.sin(time * 3 + angle) * 0.4;
      });
    }
  }

  buildExpansionSlots() {
    const slotGeometry = new THREE.BoxGeometry(4, 4, 40);
    const slotMaterial = new THREE.MeshPhongMaterial({
      color: 0x022c3d,
      emissive: 0x17a1ff,
      emissiveIntensity: 0.4,
    });

    for (let i = 0; i < 4; i++) {
      const slot = new THREE.Mesh(slotGeometry, slotMaterial.clone());
      slot.position.set(10 + i * 16, 2, 40);
      slot.rotation.z = Math.sin(i * 0.3) * 0.1;
      slot.castShadow = true;
      slot.receiveShadow = true;
      this.group.add(slot);

      this.addAnimator((delta, time) => {
        slot.position.y = 2 + Math.sin(time * 1.5 + i) * 2;
      });
    }
  }

  buildIOWall() {
    const wallGeometry = new THREE.BoxGeometry(6, 30, 140);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x012d3f,
      emissive: 0x2af7c4,
      emissiveIntensity: 0.35,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(70, 12, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);

    const portGeometry = new THREE.BoxGeometry(3, 6, 12);
    const portMaterial = new THREE.MeshPhongMaterial({
      color: 0x065d83,
      emissive: 0x50ffe2,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 12; i++) {
      const port = new THREE.Mesh(portGeometry, portMaterial.clone());
      port.position.set(72.5, -8 + i * 4, -60 + (i % 4) * 40);
      port.castShadow = true;
      this.group.add(port);

      this.addAnimator((delta, time) => {
        port.material.opacity = 0.5 + Math.sin(time * 4 + i) * 0.4;
      });
    }
  }

  buildSignalBridges() {
    const bridgeGeometry = new THREE.BoxGeometry(10, 20, 4);
    const bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x013144,
      emissive: 0x22ffd5,
      emissiveIntensity: 0.4,
      shininess: 70,
    });

    for (let i = -50; i <= 50; i += 25) {
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial.clone());
      bridge.position.set(i, 10, -60);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      this.group.add(bridge);

      const pulseGeometry = new THREE.PlaneGeometry(8, 18);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: 0x4affd8,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.set(0, 0, 2.6);
      pulse.rotation.y = Math.PI / 2;
      bridge.add(pulse);

      this.addAnimator((delta, time) => {
        pulse.material.opacity = 0.3 + Math.sin(time * 3 + i) * 0.3;
        bridge.rotation.y = Math.sin(time + i * 0.05) * 0.2;
      });
    }
  }
}
