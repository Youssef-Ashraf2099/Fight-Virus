class CPUEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "CPU CORE CHAMBER";
    this.binarySprites = [];
    this.binaryTextures = [];
    this.dieTexture = null;
  }

  getPalette() {
    return {
      ambient: 0x06110a,
      directional: 0x1cff9b,
      accentA: 0x00ffcc,
      accentB: 0xfff36b,
      fog: 0x010504,
      fogDensity: 0.018,
      background: 0x020408,
    };
  }

  getDieTexture() {
    if (!this.dieTexture) {
      this.dieTexture = this.createDiePatternTexture();
    }
    return this.dieTexture;
  }

  createDiePatternTexture() {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Base fill
    ctx.fillStyle = "#0a1f18";
    ctx.fillRect(0, 0, size, size);

    const cols = 16;
    const rows = 10;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellW;
        const y = row * cellH;
        const hueBase = 25 + (col / cols) * 240;
        const hueShift = (row / rows) * 40;
        const gradient = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
        gradient.addColorStop(
          0,
          `hsl(${(hueBase + hueShift) % 360}, 85%, 60%)`
        );
        gradient.addColorStop(
          0.5,
          `hsl(${(hueBase + hueShift + 20) % 360}, 80%, 55%)`
        );
        gradient.addColorStop(
          1,
          `hsl(${(hueBase + hueShift + 40) % 360}, 90%, 65%)`
        );
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, cellW, cellH);

        // Sub-structures inside each cell
        ctx.fillStyle = "rgba(12, 40, 32, 0.35)";
        const subdivisions = 3;
        const subW = cellW / subdivisions;
        const subH = cellH / subdivisions;
        for (let sy = 0; sy < subdivisions; sy++) {
          for (let sx = 0; sx < subdivisions; sx++) {
            if ((sx + sy) % 2 === 0) {
              ctx.fillRect(
                x + sx * subW + subW * 0.15,
                y + sy * subH + subH * 0.15,
                subW * 0.7,
                subH * 0.7
              );
            }
          }
        }

        // Highlight lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      }
    }

    // Horizontal bus lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    for (let r = 1; r < rows; r++) {
      const y = r * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Vertical bus lines
    ctx.lineWidth = 2;
    for (let c = 1; c < cols; c++) {
      const x = c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }

    // Add subtle noise
    const noiseDensity = 12000;
    for (let i = 0; i < noiseDensity; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = 0.4 + Math.random() * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.05})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildFoundation();
    this.buildCorePlatform();
    this.buildPowerRails();
    this.buildCoolingStacks();
    this.buildFluxSpines();
    this.buildPulseConduits();
    this.buildTelemetryHalo();
    this.buildBinaryStream();
    this.buildBinaryBoundaryWalls();
  }

  buildFoundation() {
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x081911,
      emissive: 0x103927,
      emissiveIntensity: 0.35,
      shininess: 60,
    });
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(120, 2, 120),
      floorMaterial
    );
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.group.add(floor);

    const traceMaterial = new THREE.MeshPhongMaterial({
      color: 0x1fffc8,
      emissive: 0x16cfa1,
      emissiveIntensity: 0.35,
      shininess: 40,
    });
    const traces = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120, 30, 30),
      traceMaterial
    );
    traces.rotation.x = -Math.PI / 2;
    traces.position.y = 0.12;
    this.group.add(traces);

    const pos = traces.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const ripple = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.3;
      pos.setZ(i, ripple);
    }
    pos.needsUpdate = true;

    const dieOverlayMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: this.getDieTexture(),
      emissive: 0x0a2d1f,
      emissiveIntensity: 0.22,
      shininess: 95,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    if (dieOverlayMaterial.map) {
      dieOverlayMaterial.map.wrapS = THREE.RepeatWrapping;
      dieOverlayMaterial.map.wrapT = THREE.RepeatWrapping;
      dieOverlayMaterial.map.repeat.set(1.8, 1.8);
    }
    const dieOverlayGeometry = new THREE.PlaneGeometry(120, 120, 30, 30);
    const overlayPos = dieOverlayGeometry.attributes.position;
    for (let i = 0; i < overlayPos.count; i++) {
      const x = overlayPos.getX(i);
      const z = overlayPos.getY(i);
      const ripple = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.3;
      overlayPos.setZ(i, ripple + 0.06);
    }
    overlayPos.needsUpdate = true;

    const dieOverlay = new THREE.Mesh(dieOverlayGeometry, dieOverlayMaterial);
    dieOverlay.rotation.x = -Math.PI / 2;
    dieOverlay.position.y = 0.16;
    dieOverlay.receiveShadow = true;
    this.group.add(dieOverlay);

    const perimeterMaterial = new THREE.MeshPhongMaterial({
      color: 0x092017,
      emissive: 0x14ff9a,
      emissiveIntensity: 0.25,
    });
    const perimeter = new THREE.Mesh(
      new THREE.BoxGeometry(128, 1.2, 128),
      perimeterMaterial
    );
    perimeter.position.y = -1.4;
    perimeter.receiveShadow = true;
    this.group.add(perimeter);

    this.addCollider({
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
      height: 0,
    });
  }

  buildCorePlatform() {
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x0b2216,
      emissive: 0x1cff9b,
      emissiveIntensity: 0.4,
      shininess: 80,
    });
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(28, 2, 28),
      platformMaterial
    );
    platform.position.y = 1;
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.group.add(platform);

    const dieMaterial = new THREE.MeshPhongMaterial({
      color: 0x083f2a,
      emissive: 0x37ffb8,
      emissiveIntensity: 0.65,
      shininess: 120,
    });
    const die = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 16), dieMaterial);
    die.position.y = 2.3;
    die.castShadow = true;
    this.group.add(die);

    this.addAnimator((delta, time) => {
      die.material.emissiveIntensity = 0.65 + Math.sin(time * 4.2) * 0.25;
      die.scale.y = 1 + Math.sin(time * 3.5) * 0.12;
    });

    const clampMaterial = new THREE.MeshPhongMaterial({
      color: 0x123727,
      emissive: 0x24ffad,
      emissiveIntensity: 0.5,
    });
    const clamp = new THREE.Mesh(
      new THREE.TorusGeometry(17, 0.6, 18, 48),
      clampMaterial
    );
    clamp.rotation.x = Math.PI / 2;
    clamp.position.y = 2;
    this.group.add(clamp);

    const pinMaterial = new THREE.MeshPhongMaterial({
      color: 0xeaffd6,
      emissive: 0x8cff76,
      emissiveIntensity: 0.2,
      shininess: 60,
    });
    const pinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 10);
    for (let x = -7; x <= 7; x++) {
      for (let z = -7; z <= 7; z++) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);
        pin.position.set(x * 1.6, 0.1, z * 1.6);
        pin.castShadow = true;
        this.group.add(pin);
      }
    }

    const bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a2f1f,
      emissive: 0x19ff9d,
      emissiveIntensity: 0.4,
    });
    const bridges = [
      { x: 0, z: 20 },
      { x: 0, z: -20 },
      { x: 20, z: 0, rot: Math.PI / 2 },
      { x: -20, z: 0, rot: Math.PI / 2 },
    ];
    bridges.forEach((config) => {
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(12, 1.2, 12),
        bridgeMaterial.clone()
      );
      bridge.position.set(config.x, 0.6, config.z);
      if (config.rot) bridge.rotation.y = config.rot;
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      this.group.add(bridge);
    });

    this.addCollider({
      minX: -14,
      maxX: 14,
      minZ: -14,
      maxZ: 14,
      height: 2,
    });

    this.addCollider({
      minX: -8,
      maxX: 8,
      minZ: -8,
      maxZ: 8,
      height: 3.1,
    });

    this.addCollider({
      minX: -6,
      maxX: 6,
      minZ: 14,
      maxZ: 26,
      height: 1.2,
    });
    this.addCollider({
      minX: -6,
      maxX: 6,
      minZ: -26,
      maxZ: -14,
      height: 1.2,
    });
    this.addCollider({
      minX: 14,
      maxX: 26,
      minZ: -6,
      maxZ: 6,
      height: 1.2,
    });
    this.addCollider({
      minX: -26,
      maxX: -14,
      minZ: -6,
      maxZ: 6,
      height: 1.2,
    });
  }

  buildPowerRails() {
    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0x103423,
      emissive: 0x23ffb5,
      emissiveIntensity: 0.45,
    });
    const contactMaterial = new THREE.MeshPhongMaterial({
      color: 0xffc25f,
      emissive: 0xff8420,
      emissiveIntensity: 0.55,
    });

    [-1, 1].forEach((side, index) => {
      const group = new THREE.Group();
      group.position.x = side * 40;
      this.group.add(group);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.6, 70),
        railMaterial.clone()
      );
      rail.position.y = 0.8;
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);

      for (let i = -3; i <= 3; i++) {
        const contact = new THREE.Mesh(
          new THREE.BoxGeometry(6, 0.6, 4),
          contactMaterial.clone()
        );
        contact.position.set(0, 1.4, i * 10);
        contact.castShadow = true;
        group.add(contact);
      }

      this.addAnimator((delta, time) => {
        const glow = 0.35 + Math.sin(time * 2.8 + index) * 0.2;
        rail.material.emissiveIntensity = glow;
      });

      this.addCollider({
        minX: side * 40 - 4,
        maxX: side * 40 + 4,
        minZ: -34,
        maxZ: 36,
        height: 1.6,
      });
    });
  }

  buildCoolingStacks() {
    const stackMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a3123,
      emissive: 0x1cffb1,
      emissiveIntensity: 0.35,
    });
    const finMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f4631,
      emissive: 0x33ffd3,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85,
    });

    const positions = [
      [-28, 0, -36],
      [28, 0, -36],
      [-28, 0, 36],
      [28, 0, 36],
    ];

    positions.forEach((pos, idx) => {
      const stack = new THREE.Group();
      stack.position.set(pos[0], 0, pos[2]);
      this.group.add(stack);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(4.4, 4.4, 3, 18),
        stackMaterial.clone()
      );
      base.position.y = 1.5;
      base.castShadow = true;
      base.receiveShadow = true;
      stack.add(base);

      for (let i = 0; i < 6; i++) {
        const fin = new THREE.Mesh(
          new THREE.BoxGeometry(8, 12, 0.6),
          finMaterial.clone()
        );
        fin.position.y = 8 + i * 1.6;
        fin.rotation.y = (i / 6) * Math.PI;
        fin.castShadow = true;
        stack.add(fin);
      }

      this.addAnimator((delta, time) => {
        stack.rotation.y = Math.sin(time * 0.6 + idx) * 0.2;
      });

      this.addCollider({
        minX: pos[0] - 3,
        maxX: pos[0] + 3,
        minZ: pos[2] - 3,
        maxZ: pos[2] + 3,
        height: 14,
      });
    });
  }

  buildFluxSpines() {
    const spineMaterial = new THREE.MeshPhongMaterial({
      color: 0x1affe2,
      emissive: 0x42ffc9,
      emissiveIntensity: 0.5,
      shininess: 60,
      side: THREE.DoubleSide,
    });

    const spineGeometry = new THREE.PlaneGeometry(4, 64);
    const leftSpine = new THREE.Mesh(spineGeometry, spineMaterial.clone());
    leftSpine.position.set(-50, 5, 0);
    leftSpine.rotation.z = Math.PI / 2;
    this.group.add(leftSpine);

    const rightSpine = leftSpine.clone();
    rightSpine.position.x = 50;
    this.group.add(rightSpine);

    this.addAnimator((delta, time) => {
      const pulseA = 0.45 + Math.sin(time * 5.5) * 0.25;
      const pulseB = 0.45 + Math.cos(time * 5.5) * 0.25;
      leftSpine.material.emissiveIntensity = pulseA;
      rightSpine.material.emissiveIntensity = pulseB;
    });

    const emitterMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f4230,
      emissive: 0x36ffc9,
      emissiveIntensity: 0.55,
    });
    for (let i = 0; i < 5; i++) {
      const emitterLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.3, 5, 12),
        emitterMaterial.clone()
      );
      emitterLeft.position.set(-54, 2.4, -24 + i * 12);
      emitterLeft.castShadow = true;
      emitterLeft.receiveShadow = true;
      this.group.add(emitterLeft);

      const emitterRight = emitterLeft.clone();
      emitterRight.position.x = 54;
      this.group.add(emitterRight);

      this.addCollider({
        minX: -56,
        maxX: -52,
        minZ: -26 + i * 12,
        maxZ: -22 + i * 12,
        height: 5,
      });
      this.addCollider({
        minX: 52,
        maxX: 56,
        minZ: -26 + i * 12,
        maxZ: -22 + i * 12,
        height: 5,
      });
    }
  }

  buildPulseConduits() {
    const conduitMaterial = new THREE.MeshPhongMaterial({
      color: 0xffb347,
      emissive: 0xff6f1f,
      emissiveIntensity: 0.45,
      shininess: 110,
    });

    const positions = [
      { x: -22, z: -22 },
      { x: 22, z: -22 },
      { x: -22, z: 22 },
      { x: 22, z: 22 },
    ];

    positions.forEach((pos, idx) => {
      const conduit = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 20, 18, 1, true),
        conduitMaterial.clone()
      );
      conduit.position.set(pos.x, 0.9, pos.z);
      conduit.rotation.x = Math.PI / 2;
      conduit.castShadow = true;
      conduit.receiveShadow = true;
      this.group.add(conduit);

      this.addAnimator((delta, time) => {
        conduit.material.emissiveIntensity =
          0.35 + Math.sin(time * 3 + idx) * 0.2;
      });

      this.addCollider({
        minX: pos.x - 3,
        maxX: pos.x + 3,
        minZ: pos.z - 12,
        maxZ: pos.z + 12,
        height: 2.8,
      });
    });
  }

  buildTelemetryHalo() {
    const haloGeometry = new THREE.CylinderGeometry(20, 20, 40, 32, 1, true);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x58ffd9,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.y = 12;
    this.group.add(halo);

    const packetGeometry = new THREE.SphereGeometry(0.9, 12, 12);
    const packetMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x9dffe5,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    const packets = [];
    for (let i = 0; i < 18; i++) {
      const packet = new THREE.Mesh(packetGeometry, packetMaterial.clone());
      packet.userData = { offset: (i / 18) * Math.PI * 2 };
      packets.push(packet);
      this.group.add(packet);
    }

    this.addAnimator((delta, time) => {
      halo.material.opacity = 0.14 + Math.sin(time * 3.5) * 0.04;
      packets.forEach((packet) => {
        const travel = (time * 6 + packet.userData.offset) % (Math.PI * 2);
        packet.position.set(
          Math.sin(travel) * 20,
          4 + ((travel / (Math.PI * 2)) % 1) * 20,
          Math.cos(travel) * 20
        );
      });
    });
  }

  buildBinaryStream() {
    const digits = ["0", "1"];
    const colors = ["#12ffc3", "#66ffea"];

    const createTexture = (digit, color) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = color;
      ctx.font = "bold 96px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(digit, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    this.binaryTextures.forEach((existingTexture) => existingTexture.dispose());
    this.binaryTextures = digits.map((digit, index) =>
      createTexture(digit, colors[index])
    );

    const materialFor = (texture) =>
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

    this.binarySprites.forEach((sprite) => {
      if (sprite.material && sprite.material.map) {
        sprite.material.map.dispose();
      }
      if (sprite.material) {
        sprite.material.dispose();
      }
      if (sprite.parent) {
        sprite.parent.remove(sprite);
      }
    });
    this.binarySprites = [];

    for (let i = 0; i < 60; i++) {
      const texture = this.binaryTextures[i % this.binaryTextures.length];
      const sprite = new THREE.Sprite(materialFor(texture));
      const radius = 46 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      sprite.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 10,
        Math.sin(angle) * radius
      );
      const scale = 1 + Math.random() * 0.8;
      sprite.scale.set(scale, scale, scale);
      sprite.userData = {
        baseY: sprite.position.y,
        angularSpeed: 0.35 + Math.random() * 0.35,
        radialSpeed: 0.2 + Math.random() * 0.25,
        orbitRadius: radius,
        orbitAngle: angle,
        bobSpeed: 1.2 + Math.random() * 0.8,
      };
      this.binarySprites.push(sprite);
      this.group.add(sprite);
    }

    this.addAnimator((delta, time) => {
      this.binarySprites.forEach((sprite) => {
        sprite.userData.orbitAngle += sprite.userData.angularSpeed * delta;
        sprite.userData.orbitRadius +=
          Math.sin(time * sprite.userData.radialSpeed) * 0.03;
        sprite.position.x =
          Math.cos(sprite.userData.orbitAngle) * sprite.userData.orbitRadius;
        sprite.position.z =
          Math.sin(sprite.userData.orbitAngle) * sprite.userData.orbitRadius;
        sprite.position.y =
          sprite.userData.baseY +
          Math.sin(time * sprite.userData.bobSpeed) * 1.5;
      });
    });
  }

  buildBinaryBoundaryWalls() {
    // Create glowing binary digit sprites as boundary walls
    const wallDistance = 58; // Match the floor boundary
    const wallHeight = 15;
    const digitSpacing = 6;

    const createBinaryTexture = (digit) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Clear background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Glow effect
      ctx.shadowColor = digit === "0" ? "#00ffcc" : "#ff6b6b";
      ctx.shadowBlur = 30;

      // Draw digit
      ctx.fillStyle = digit === "0" ? "#00ffcc" : "#ff6b6b";
      ctx.font = "bold 220px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(digit, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const zeroTexture = createBinaryTexture("0");
    const oneTexture = createBinaryTexture("1");

    const createWallSprite = (texture, x, y, z) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, y, z);
      sprite.scale.set(4, 4, 1);
      return sprite;
    };

    // North wall (positive Z)
    for (let i = -wallDistance; i <= wallDistance; i += digitSpacing) {
      const texture = Math.random() > 0.5 ? zeroTexture : oneTexture;
      const sprite = createWallSprite(texture, i, wallHeight / 2, wallDistance);
      this.group.add(sprite);

      // Add second row for more density
      const sprite2 = createWallSprite(
        texture,
        i,
        wallHeight / 2 + 5,
        wallDistance
      );
      sprite2.scale.set(3, 3, 1);
      this.group.add(sprite2);
    }

    // South wall (negative Z)
    for (let i = -wallDistance; i <= wallDistance; i += digitSpacing) {
      const texture = Math.random() > 0.5 ? zeroTexture : oneTexture;
      const sprite = createWallSprite(
        texture,
        i,
        wallHeight / 2,
        -wallDistance
      );
      this.group.add(sprite);

      const sprite2 = createWallSprite(
        texture,
        i,
        wallHeight / 2 + 5,
        -wallDistance
      );
      sprite2.scale.set(3, 3, 1);
      this.group.add(sprite2);
    }

    // East wall (positive X)
    for (let i = -wallDistance; i <= wallDistance; i += digitSpacing) {
      const texture = Math.random() > 0.5 ? zeroTexture : oneTexture;
      const sprite = createWallSprite(texture, wallDistance, wallHeight / 2, i);
      this.group.add(sprite);

      const sprite2 = createWallSprite(
        texture,
        wallDistance,
        wallHeight / 2 + 5,
        i
      );
      sprite2.scale.set(3, 3, 1);
      this.group.add(sprite2);
    }

    // West wall (negative X)
    for (let i = -wallDistance; i <= wallDistance; i += digitSpacing) {
      const texture = Math.random() > 0.5 ? zeroTexture : oneTexture;
      const sprite = createWallSprite(
        texture,
        -wallDistance,
        wallHeight / 2,
        i
      );
      this.group.add(sprite);

      const sprite2 = createWallSprite(
        texture,
        -wallDistance,
        wallHeight / 2 + 5,
        i
      );
      sprite2.scale.set(3, 3, 1);
      this.group.add(sprite2);
    }

    // Add invisible collision barriers at boundaries
    const barrierMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    // North barrier
    const northBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallDistance * 2, wallHeight * 2),
      barrierMaterial
    );
    northBarrier.position.set(0, wallHeight, wallDistance);
    this.group.add(northBarrier);

    // South barrier
    const southBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallDistance * 2, wallHeight * 2),
      barrierMaterial
    );
    southBarrier.position.set(0, wallHeight, -wallDistance);
    this.group.add(southBarrier);

    // East barrier
    const eastBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallDistance * 2, wallHeight * 2),
      barrierMaterial
    );
    eastBarrier.rotation.y = Math.PI / 2;
    eastBarrier.position.set(wallDistance, wallHeight, 0);
    this.group.add(eastBarrier);

    // West barrier
    const westBarrier = new THREE.Mesh(
      new THREE.PlaneGeometry(wallDistance * 2, wallHeight * 2),
      barrierMaterial
    );
    westBarrier.rotation.y = Math.PI / 2;
    westBarrier.position.set(-wallDistance, wallHeight, 0);
    this.group.add(westBarrier);

    // Add physical colliders for player/enemy boundaries
    // North wall
    this.addCollider({
      minX: -wallDistance,
      maxX: wallDistance,
      minZ: wallDistance - 2,
      maxZ: wallDistance + 2,
      height: wallHeight * 2,
    });

    // South wall
    this.addCollider({
      minX: -wallDistance,
      maxX: wallDistance,
      minZ: -wallDistance - 2,
      maxZ: -wallDistance + 2,
      height: wallHeight * 2,
    });

    // East wall
    this.addCollider({
      minX: wallDistance - 2,
      maxX: wallDistance + 2,
      minZ: -wallDistance,
      maxZ: wallDistance,
      height: wallHeight * 2,
    });

    // West wall
    this.addCollider({
      minX: -wallDistance - 2,
      maxX: -wallDistance + 2,
      minZ: -wallDistance,
      maxZ: wallDistance,
      height: wallHeight * 2,
    });

    // Animate the wall sprites
    this.addAnimator((delta, time) => {
      this.group.children.forEach((child) => {
        if (child instanceof THREE.Sprite && child.material.map) {
          // Pulse opacity
          child.material.opacity =
            0.7 +
            Math.sin(time * 2 + child.position.x + child.position.z) * 0.2;
        }
      });
    });
  }

  onExit() {
    if (this.binarySprites) {
      this.binarySprites.forEach((sprite) => {
        if (sprite.material && sprite.material.map) {
          sprite.material.map.dispose();
        }
        if (sprite.material) {
          sprite.material.dispose();
        }
      });
      this.binarySprites = [];
    }

    if (this.binaryTextures) {
      this.binaryTextures.forEach((texture) => texture.dispose());
      this.binaryTextures = [];
    }

    if (this.dieTexture) {
      this.dieTexture.dispose();
      this.dieTexture = null;
    }
  }
}
