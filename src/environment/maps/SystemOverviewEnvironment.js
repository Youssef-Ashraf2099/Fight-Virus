const MOTHERBOARD_TEXTURE_SCOPE_OV =
  typeof window !== "undefined" ? window : globalThis;

if (!MOTHERBOARD_TEXTURE_SCOPE_OV.getMotherboardFloorTexture) {
  MOTHERBOARD_TEXTURE_SCOPE_OV.getMotherboardFloorTexture = function () {
    if (MOTHERBOARD_TEXTURE_SCOPE_OV.__motherboardFloorTexture) {
      return MOTHERBOARD_TEXTURE_SCOPE_OV.__motherboardFloorTexture;
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

    MOTHERBOARD_TEXTURE_SCOPE_OV.__motherboardFloorTexture = texture;
    return texture;
  };
}

class SystemOverviewEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "SYSTEM OVERVIEW - ALL SECTORS";
  }

  getPalette() {
    return {
      ambient: 0x1a1520, // Brighter ambient (was 0x0f0a15)
      directional: 0xddddff, // Much brighter directional (was 0xaaaaff)
      accentA: 0xaaccff, // Brighter blue accent (was 0x88aaff)
      accentB: 0xffcc99, // Brighter orange accent (was 0xffaa88)
      fog: 0x0a0610, // Slightly brighter fog (was 0x050308)
      fogDensity: 0.01, // Reduced fog density for better visibility (was 0.012)
      background: 0x050209, // Brighter background (was 0x020106)
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.addEnvironmentLighting();
    this.buildMotherboardBase();
    this.buildCPUMiniature();
    this.buildRAMMiniature();
    this.buildGPUMiniature();
    this.buildStorageMiniature();
    this.buildPowerCircuits();
    this.buildDataBuses();
  }

  addEnvironmentLighting() {
    // Add multiple point lights for better visibility
    const lightPositions = [
      { pos: [0, 40, 0], color: 0xffffff, intensity: 1.5 }, // Center overhead
      { pos: [-30, 25, -30], color: 0xaaccff, intensity: 1.2 }, // Corner blue
      { pos: [30, 25, -30], color: 0xffcc99, intensity: 1.2 }, // Corner orange
      { pos: [-30, 25, 30], color: 0xccaaff, intensity: 1.2 }, // Corner purple
      { pos: [30, 25, 30], color: 0xaaffcc, intensity: 1.2 }, // Corner cyan
    ];

    lightPositions.forEach(({ pos, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 100);
      light.position.set(pos[0], pos[1], pos[2]);
      this.group.add(light);
    });
  }

  buildMotherboardBase() {
    // Large motherboard PCB
    const pcbGeometry = new THREE.BoxGeometry(100, 1, 100);
    const pcbMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f2a1f,
      emissive: 0x1a3f2f,
      emissiveIntensity: 0.3,
      shininess: 60,
    });
    const pcb = new THREE.Mesh(pcbGeometry, pcbMaterial);
    pcb.position.y = 0.5;
    this.group.add(pcb);

    const traceMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: getMotherboardFloorTexture(),
      emissive: 0x16ff82,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    if (traceMaterial.map) {
      traceMaterial.map.wrapS = THREE.RepeatWrapping;
      traceMaterial.map.wrapT = THREE.RepeatWrapping;
      traceMaterial.map.repeat.set(1.4, 1.4);
    }

    const tracePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(98, 98, 32, 32),
      traceMaterial
    );
    tracePlane.rotation.x = -Math.PI / 2;
    tracePlane.position.y = 1.1;
    tracePlane.receiveShadow = true;
    this.group.add(tracePlane);

    const pos = tracePlane.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const ripple = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.18;
      pos.setZ(i, ripple + 0.04);
    }
    pos.needsUpdate = true;

    // Base collider
    this.addCollider({
      minX: -50,
      maxX: 50,
      minZ: -50,
      maxZ: 50,
      height: 1,
    });
  }

  buildCPUMiniature() {
    // Miniature CPU representation
    const cpuGroup = new THREE.Group();
    cpuGroup.position.set(-25, 1, -25);

    const socketGeometry = new THREE.BoxGeometry(15, 2, 15);
    const socketMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a2a1f,
      emissive: 0x2aff8f,
      emissiveIntensity: 0.4,
      shininess: 80,
    });
    const socket = new THREE.Mesh(socketGeometry, socketMaterial);
    socket.position.y = 1;
    cpuGroup.add(socket);

    // CPU die
    const dieGeometry = new THREE.BoxGeometry(12, 3, 12);
    const dieMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a3f2a,
      emissive: 0x1fff8f,
      emissiveIntensity: 0.7,
      shininess: 100,
    });
    const die = new THREE.Mesh(dieGeometry, dieMaterial);
    die.position.y = 3.5;
    cpuGroup.add(die);

    // Pins
    for (let x = -5; x <= 5; x += 2) {
      for (let z = -5; z <= 5; z += 2) {
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 1, 6),
          socketMaterial.clone()
        );
        pin.position.set(x, 0, z);
        cpuGroup.add(pin);
      }
    }

    this.group.add(cpuGroup);

    // Label
    this.addLabel("CPU", -25, 6, -25, 0x2aff8f);

    this.addCollider({
      minX: -32.5,
      maxX: -17.5,
      minZ: -32.5,
      maxZ: -17.5,
      height: 5,
    });
  }

  buildRAMMiniature() {
    // RAM sticks
    for (let i = 0; i < 4; i++) {
      const ramGroup = new THREE.Group();
      const xPos = -15 + i * 10;
      ramGroup.position.set(xPos, 1, 20);

      const stickGeometry = new THREE.BoxGeometry(6, 8, 2);
      const stickMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a3a,
        emissive: 0x4444ff,
        emissiveIntensity: 0.5,
        shininess: 90,
      });
      const stick = new THREE.Mesh(stickGeometry, stickMaterial);
      stick.position.y = 4;
      ramGroup.add(stick);

      // Chips on RAM
      for (let j = 0; j < 8; j++) {
        const chip = new THREE.Mesh(
          new THREE.BoxGeometry(4, 1, 0.5),
          stickMaterial.clone()
        );
        chip.position.set(0, 1 + j * 0.8, 1.3);
        ramGroup.add(chip);
      }

      this.group.add(ramGroup);

      this.addCollider({
        minX: xPos - 3,
        maxX: xPos + 3,
        minZ: 19,
        maxZ: 21,
        height: 8,
      });
    }

    this.addLabel("MEMORY", 0, 10, 20, 0x4444ff);
  }

  buildGPUMiniature() {
    // GPU card
    const gpuGroup = new THREE.Group();
    gpuGroup.position.set(25, 1, 0);

    const cardGeometry = new THREE.BoxGeometry(18, 10, 8);
    const cardMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a1a1a,
      emissive: 0xff4444,
      emissiveIntensity: 0.5,
      shininess: 80,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.y = 5;
    gpuGroup.add(card);

    // Fans
    for (let i = 0; i < 2; i++) {
      const fanGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 24);
      const fanMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0xff6666,
        emissiveIntensity: 0.4,
      });
      this.fan = new THREE.Mesh(fanGeometry, fanMaterial);
      this.fan.position.set(-5 + i * 10, 5, 4.5);
      this.fan.rotation.x = Math.PI / 2;
      gpuGroup.add(this.fan);

      // Fan blades (simple representation)
      for (let j = 0; j < 6; j++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.2, 0.5),
          fanMaterial.clone()
        );
        blade.position.set(-5 + i * 10, 5, 4.8);
        blade.rotation.z = (j / 6) * Math.PI * 2;
        gpuGroup.add(blade);
      }
    }

    // Heat sink
    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(16, 6, 0.3),
        cardMaterial.clone()
      );
      fin.position.set(0, 5, -4 + i * 0.8);
      gpuGroup.add(fin);
    }

    this.group.add(gpuGroup);

    this.addLabel("GPU", 25, 12, 0, 0xff4444);

    this.addCollider({
      minX: 16,
      maxX: 34,
      minZ: -4,
      maxZ: 4,
      height: 10,
    });
  }

  buildStorageMiniature() {
    // Storage drive
    const driveGroup = new THREE.Group();
    driveGroup.position.set(-25, 1, 25);

    const driveGeometry = new THREE.BoxGeometry(12, 4, 18);
    const driveMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a1a,
      emissive: 0xaaaa44,
      emissiveIntensity: 0.4,
      shininess: 70,
    });
    const drive = new THREE.Mesh(driveGeometry, driveMaterial);
    drive.position.y = 2;
    driveGroup.add(drive);

    // Activity light
    const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const lightMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1.2,
    });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(5, 3, 8);
    driveGroup.add(light);

    this.group.add(driveGroup);

    this.addLabel("STORAGE", -25, 6, 25, 0xaaaa44);

    this.addCollider({
      minX: -31,
      maxX: -19,
      minZ: 16,
      maxZ: 34,
      height: 4,
    });
  }

  buildPowerCircuits() {
    // Power delivery circuits
    const positions = [
      [0, 0, -40],
      [40, 0, 0],
      [0, 0, 40],
      [-40, 0, 0],
    ];

    positions.forEach((pos) => {
      const circuitGeometry = new THREE.BoxGeometry(8, 6, 8);
      const circuitMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a2a1a,
        emissive: 0xffaa44,
        emissiveIntensity: 0.5,
        shininess: 80,
      });
      const circuit = new THREE.Mesh(circuitGeometry, circuitMaterial);
      circuit.position.set(pos[0], 4, pos[2]);
      this.group.add(circuit);

      // Capacitors
      for (let i = 0; i < 4; i++) {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 4, 12),
          circuitMaterial.clone()
        );
        cap.position.set(pos[0] + (i - 1.5) * 2, 2, pos[2]);
        this.group.add(cap);
      }

      this.addCollider({
        minX: pos[0] - 4,
        maxX: pos[0] + 4,
        minZ: pos[2] - 4,
        maxZ: pos[2] + 4,
        height: 6,
      });
    });
  }

  buildDataBuses() {
    // Glowing data buses connecting components
    const busPositions = [
      { start: [-25, 2, -25], end: [-25, 2, 25], color: 0x2aff8f }, // CPU to Storage
      { start: [-25, 2, -25], end: [-15, 2, 20], color: 0x4444ff }, // CPU to RAM
      { start: [-25, 2, -25], end: [25, 2, 0], color: 0xff4444 }, // CPU to GPU
      { start: [25, 2, 0], end: [0, 2, 20], color: 0xff8844 }, // GPU to RAM
    ];

    busPositions.forEach((bus) => {
      const points = [
        new THREE.Vector3(...bus.start),
        new THREE.Vector3(...bus.end),
      ];
      const curve = new THREE.LineCurve3(points[0], points[1]);
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.5, 8, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: bus.color,
        emissive: bus.color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7,
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      this.group.add(tube);
    });

    this.addAnimator((delta, time) => {
      // Pulse all emissive materials
      this.group.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
          const baseIntensity = 0.5;
          child.material.emissiveIntensity =
            baseIntensity + Math.sin(time * 2 + child.position.x) * 0.3;
        }
      });
    });
  }

  addLabel(text, x, y, z, color) {
    // Simple label placeholder (would need canvas texture in real implementation)
    const labelGeometry = new THREE.PlaneGeometry(8, 2);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, y, z);
    label.lookAt(x, y + 10, z);
    this.group.add(label);
  }
}
