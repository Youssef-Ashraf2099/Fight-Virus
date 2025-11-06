const MOTHERBOARD_TEXTURE_SCOPE =
  typeof window !== "undefined" ? window : globalThis;

if (!MOTHERBOARD_TEXTURE_SCOPE.__motherboardFloorTexture) {
  MOTHERBOARD_TEXTURE_SCOPE.getMotherboardFloorTexture = function () {
    if (MOTHERBOARD_TEXTURE_SCOPE.__motherboardFloorTexture) {
      return MOTHERBOARD_TEXTURE_SCOPE.__motherboardFloorTexture;
    }

    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#010402";
    ctx.fillRect(0, 0, size, size);

    const drawTrace = (points, width, glow, alpha) => {
      ctx.save();
      ctx.strokeStyle = `rgba(64, 255, 128, ${alpha || 0.8})`;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = `rgba(0, 255, 120, ${glow || 0.6})`;
      ctx.shadowBlur = width * 2.5;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const majorSpacing = size / 7;
    for (let i = 0; i <= size; i += majorSpacing) {
      drawTrace(
        [
          { x: 0, y: i },
          { x: size, y: i },
        ],
        size * 0.01,
        0.45,
        0.65
      );
      drawTrace(
        [
          { x: i, y: 0 },
          { x: i, y: size },
        ],
        size * 0.01,
        0.45,
        0.65
      );
    }

    const secondarySpacing = size / 14;
    for (let i = 0; i <= size; i += secondarySpacing) {
      drawTrace(
        [
          { x: 0, y: i },
          { x: size, y: i },
        ],
        size * 0.0045,
        0.3,
        0.45
      );
      drawTrace(
        [
          { x: i, y: 0 },
          { x: i, y: size },
        ],
        size * 0.0045,
        0.3,
        0.45
      );
    }

    const createCornerArc = (sx, sy, ex, ey, dir) => {
      const radius = size * (0.08 + Math.random() * 0.05);
      const cx = dir > 0 ? Math.max(sx, ex) : Math.min(sx, ex);
      const cy = dir > 0 ? Math.max(sy, ey) : Math.min(sy, ey);
      ctx.save();
      ctx.strokeStyle = "rgba(80, 255, 150, 0.75)";
      ctx.lineWidth = size * 0.008;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0, 255, 160, 0.6)";
      ctx.shadowBlur = size * 0.01;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, dir < 0);
      ctx.stroke();
      ctx.restore();
    };

    for (let i = 0; i < 12; i++) {
      const sx = (Math.random() * 0.8 + 0.1) * size;
      const sy = (Math.random() * 0.8 + 0.1) * size;
      const ex = sx + (Math.random() * 0.12 + 0.08) * size;
      const ey = sy + (Math.random() * 0.12 + 0.08) * size;
      createCornerArc(sx, sy, ex, ey, Math.random() > 0.5 ? 1 : -1);
    }

    ctx.fillStyle = "rgba(80, 255, 150, 0.9)";
    const nodeSpacing = size / 18;
    for (let x = nodeSpacing / 2; x < size; x += nodeSpacing) {
      for (let y = nodeSpacing / 2; y < size; y += nodeSpacing) {
        if ((x + y) % 2 > 0.5) continue;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.006, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const highlightDensity = 4000;
    for (let i = 0; i < highlightDensity; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = 0.1 + Math.random() * 0.15;
      ctx.fillStyle = `rgba(120, 255, 160, ${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.6, 1.6);
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    MOTHERBOARD_TEXTURE_SCOPE.__motherboardFloorTexture = texture;
    return texture;
  };
}

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
    this.buildBIOSChip();
    this.buildMemorySlots();
    this.buildSATAPorts();
    this.buildBatteryHolder();
    this.buildNorthBridge();
    this.buildSouthBridge();
    this.buildPowerPhases();
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

    const traceMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: getMotherboardFloorTexture(),
      emissive: 0x16ff82,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    if (traceMaterial.map) {
      traceMaterial.map.wrapS = THREE.RepeatWrapping;
      traceMaterial.map.wrapT = THREE.RepeatWrapping;
      traceMaterial.map.repeat.set(1.5, 1.5);
    }

    const tracePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(146, 146, 40, 40),
      traceMaterial
    );
    tracePlane.rotation.x = -Math.PI / 2;
    tracePlane.position.y = 0.08;
    tracePlane.receiveShadow = true;
    this.group.add(tracePlane);

    const pos = tracePlane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const ripple = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.35;
      pos.setZ(i, ripple + 0.04);
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

  buildBIOSChip() {
    // BIOS/UEFI firmware chip
    const biosBase = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2, 8),
      new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x4400ff,
        emissiveIntensity: 0.5,
        shininess: 100,
      })
    );
    biosBase.position.set(40, 1, -40);
    biosBase.castShadow = true;
    biosBase.receiveShadow = true;
    this.group.add(biosBase);

    // BIOS label/logo
    const biosLabel = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.3, 6),
      new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.9,
      })
    );
    biosLabel.position.set(40, 2.2, -40);
    this.group.add(biosLabel);

    // Socket pins
    for (let i = 0; i < 8; i++) {
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1, 8),
        new THREE.MeshPhongMaterial({
          color: 0xcccccc,
          shininess: 150,
        })
      );
      pin.position.set(40 + (i - 3.5) * 1.4, 0.5, -40);
      this.group.add(pin);
    }

    this.addAnimator((delta, time) => {
      biosLabel.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.4;
    });

    this.addCollider({
      minX: 34,
      maxX: 46,
      minZ: -44,
      maxZ: -36,
      height: 2.5,
    });
  }

  buildMemorySlots() {
    // DDR4/DDR5 Memory Slots
    const slotMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0xff9900,
      emissiveIntensity: 0.4,
      shininess: 80,
    });

    for (let slot = 0; slot < 4; slot++) {
      const slotBase = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 28),
        slotMaterial.clone()
      );
      slotBase.position.set(30, 1, -10 + slot * 8);
      slotBase.castShadow = true;
      slotBase.receiveShadow = true;
      this.group.add(slotBase);

      // Retention clips
      const clipMaterial = new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        shininess: 100,
      });
      const clip1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 2),
        clipMaterial
      );
      clip1.position.set(28, 2, -10 + slot * 8 - 13);
      this.group.add(clip1);

      const clip2 = clip1.clone();
      clip2.position.set(28, 2, -10 + slot * 8 + 13);
      this.group.add(clip2);

      // Contact pins
      const pinGeometry = new THREE.BoxGeometry(3.5, 0.2, 0.3);
      const pinMaterial = new THREE.MeshPhongMaterial({
        color: 0xffdd00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.6,
        shininess: 150,
      });

      for (let i = 0; i < 24; i++) {
        const pin = new THREE.Mesh(pinGeometry, pinMaterial.clone());
        pin.position.set(30, 0.8, -21 + slot * 8 + i * 1.8);
        this.group.add(pin);
      }

      this.addAnimator((delta, time) => {
        slotBase.material.emissiveIntensity =
          0.3 + Math.sin(time * 2 + slot) * 0.2;
      });

      this.addCollider({
        minX: 26,
        maxX: 34,
        minZ: -24 + slot * 8,
        maxZ: 4 + slot * 8,
        height: 2,
      });
    }
  }

  buildSATAPorts() {
    // SATA storage connectors
    const sataBaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      shininess: 90,
    });

    for (let i = 0; i < 6; i++) {
      const port = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 4),
        sataBaseMaterial.clone()
      );
      const row = Math.floor(i / 3);
      const col = i % 3;
      port.position.set(50 + col * 5, 1, 20 + row * 6);
      port.rotation.y = Math.PI / 4;
      port.castShadow = true;
      port.receiveShadow = true;
      this.group.add(port);

      // Port interior
      const interior = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 3.5),
        new THREE.MeshPhongMaterial({
          color: 0xff3333,
          emissive: 0xff0000,
          emissiveIntensity: 0.8,
        })
      );
      interior.position.copy(port.position);
      interior.position.y += 0.3;
      interior.rotation.y = port.rotation.y;
      this.group.add(interior);

      // Connection pins
      for (let p = 0; p < 7; p++) {
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 1.2, 0.3),
          new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            shininess: 150,
          })
        );
        pin.position.set(port.position.x - 1 + p * 0.35, 0.8, port.position.z);
        this.group.add(pin);
      }

      this.addAnimator((delta, time) => {
        port.material.emissiveIntensity = 0.4 + Math.sin(time * 4 + i) * 0.2;
      });

      this.addCollider({
        minX: port.position.x - 2,
        maxX: port.position.x + 2,
        minZ: port.position.z - 2,
        maxZ: port.position.z + 2,
        height: 2,
      });
    }
  }

  buildBatteryHolder() {
    // CMOS Battery holder (CR2032)
    const holderBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 1, 24),
      new THREE.MeshPhongMaterial({
        color: 0x222222,
        shininess: 80,
      })
    );
    holderBase.position.set(-10, 0.5, 40);
    holderBase.castShadow = true;
    holderBase.receiveShadow = true;
    this.group.add(holderBase);

    // Battery
    const battery = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 0.6, 24),
      new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x4444ff,
        emissiveIntensity: 0.3,
        shininess: 120,
      })
    );
    battery.position.set(-10, 1.2, 40);
    battery.castShadow = true;
    this.group.add(battery);

    // Battery label
    const label = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 24),
      new THREE.MeshPhongMaterial({
        color: 0x4444ff,
        emissive: 0x6666ff,
        emissiveIntensity: 0.6,
      })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(-10, 1.6, 40);
    this.group.add(label);

    this.addAnimator((delta, time) => {
      battery.material.emissiveIntensity = 0.2 + Math.sin(time * 1.5) * 0.15;
    });

    this.addCollider({
      minX: -14,
      maxX: -6,
      minZ: 36,
      maxZ: 44,
      height: 1.8,
    });
  }

  buildNorthBridge() {
    // Northbridge chipset with heatsink
    const heatsinkBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 8, 16),
      new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.4,
        shininess: 100,
      })
    );
    heatsinkBase.position.set(0, 4, -30);
    heatsinkBase.castShadow = true;
    heatsinkBase.receiveShadow = true;
    this.group.add(heatsinkBase);

    // Heatsink fins
    const finMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x00cc88,
      emissiveIntensity: 0.3,
      shininess: 110,
    });

    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.8, 0.6),
        finMaterial.clone()
      );
      fin.position.set(0, 5 + i * 1, -30);
      fin.castShadow = true;
      this.group.add(fin);
    }

    // Cooling fan
    const fanHub = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 1.5, 16),
      new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.5,
      })
    );
    fanHub.rotation.x = Math.PI / 2;
    fanHub.position.set(0, 13, -30);
    this.group.add(fanHub);

    // Fan blades
    const bladeGeometry = new THREE.BoxGeometry(0.6, 0.2, 5);
    const bladeMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffaa,
      emissive: 0x00ffaa,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });

    const fanGroup = new THREE.Group();
    fanGroup.position.copy(fanHub.position);
    this.group.add(fanGroup);

    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial.clone());
      blade.position.z = 2.5;
      blade.rotation.y = (i / 4) * Math.PI * 2;
      fanGroup.add(blade);
    }

    this.addAnimator((delta, time) => {
      fanGroup.rotation.z = time * 8;
      heatsinkBase.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.2;
    });

    this.addCollider({
      minX: -8,
      maxX: 8,
      minZ: -38,
      maxZ: -22,
      height: 14,
    });
  }

  buildSouthBridge() {
    // Southbridge chipset
    const chipBase = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 12),
      new THREE.MeshPhongMaterial({
        color: 0x0a2633,
        emissive: 0x00aaff,
        emissiveIntensity: 0.5,
        shininess: 95,
      })
    );
    chipBase.position.set(10, 2, 45);
    chipBase.castShadow = true;
    chipBase.receiveShadow = true;
    this.group.add(chipBase);

    // Heat spreader
    const spreader = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.5, 10),
      new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x0088ff,
        emissiveIntensity: 0.4,
        shininess: 120,
      })
    );
    spreader.position.set(10, 4.5, 45);
    spreader.castShadow = true;
    this.group.add(spreader);

    // LED indicators
    const ledPositions = [
      { x: -4, z: -4 },
      { x: 4, z: -4 },
      { x: -4, z: 4 },
      { x: 4, z: 4 },
    ];

    ledPositions.forEach((pos, i) => {
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 12),
        new THREE.MeshPhongMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2,
        })
      );
      led.position.set(10 + pos.x, 5, 45 + pos.z);
      this.group.add(led);

      this.addAnimator((delta, time) => {
        led.material.emissiveIntensity = 1.5 + Math.sin(time * 5 + i) * 0.5;
      });
    });

    this.addAnimator((delta, time) => {
      chipBase.material.emissiveIntensity = 0.4 + Math.sin(time * 2.5) * 0.2;
    });

    this.addCollider({
      minX: 4,
      maxX: 16,
      minZ: 39,
      maxZ: 51,
      height: 5,
    });
  }

  buildPowerPhases() {
    // VRM power delivery phases
    const phaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      shininess: 100,
    });

    // Power phases in a row
    for (let i = 0; i < 10; i++) {
      const mosfet = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        phaseMaterial.clone()
      );
      mosfet.position.set(-48 + i * 5, 1.5, -55);
      mosfet.castShadow = true;
      mosfet.receiveShadow = true;
      this.group.add(mosfet);

      // Choke/inductor
      const choke = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16),
        new THREE.MeshPhongMaterial({
          color: 0x2a2a2a,
          emissive: 0xff6600,
          emissiveIntensity: 0.4,
        })
      );
      choke.position.set(-48 + i * 5, 3.5, -55);
      choke.castShadow = true;
      this.group.add(choke);

      this.addAnimator((delta, time) => {
        const phase = (time * 4 + i * 0.3) % (Math.PI * 2);
        mosfet.material.emissiveIntensity = 0.3 + Math.sin(phase) * 0.25;
        choke.material.emissiveIntensity = 0.3 + Math.cos(phase) * 0.2;
      });

      this.addCollider({
        minX: -50 + i * 5,
        maxX: -46 + i * 5,
        minZ: -57,
        maxZ: -53,
        height: 4.5,
      });
    }

    // Power connectors
    for (let i = 0; i < 2; i++) {
      const connector = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 4),
        new THREE.MeshPhongMaterial({
          color: 0x1a1a1a,
          emissive: 0xffff00,
          emissiveIntensity: 0.6,
          shininess: 110,
        })
      );
      connector.position.set(-52 + i * 54, 2, -64);
      connector.castShadow = true;
      connector.receiveShadow = true;
      this.group.add(connector);

      // Connector pins
      for (let p = 0; p < 8; p++) {
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
          new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8,
            shininess: 150,
          })
        );
        pin.position.set(
          -55 + i * 54 + (p % 4) * 1.5,
          3,
          -64 + Math.floor(p / 4) * 2
        );
        this.group.add(pin);
      }

      this.addAnimator((delta, time) => {
        connector.material.emissiveIntensity =
          0.5 + Math.sin(time * 3 + i) * 0.2;
      });

      this.addCollider({
        minX: -55 + i * 54,
        maxX: -49 + i * 54,
        minZ: -66,
        maxZ: -62,
        height: 4,
      });
    }
  }
}
