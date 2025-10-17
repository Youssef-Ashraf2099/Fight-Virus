class KernelEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "KERNEL NEXUS";
    this.binarySprites = [];
    this.binaryTextures = [];
    this.assemblyPanels = [];
    this.energyArcs = [];
    this.arcAnimators = [];
  }

  getPalette() {
    return {
      ambient: 0x040a0d,
      directional: 0x37e0ff,
      accentA: 0x00fff2,
      accentB: 0xff7b4a,
      fog: 0x02060a,
      fogDensity: 0.015,
      background: 0x03060a,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildFoundation();
    this.buildCoreChamber();
    this.buildMemoryColumns();
    this.buildDataLinks();
    this.buildAssemblyTablets();
    this.buildBinaryParticles();
  }

  buildFoundation() {
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x061017,
      emissive: 0x0d2735,
      emissiveIntensity: 0.35,
      shininess: 70,
    });

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(120, 120, 2, 64),
      floorMaterial
    );
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.group.add(floor);

    const circuitMaterial = new THREE.MeshPhongMaterial({
      color: 0x142c3a,
      emissive: 0x19aaff,
      emissiveIntensity: 0.45,
      shininess: 40,
      transparent: true,
      opacity: 0.85,
    });

    const circuit = new THREE.Mesh(
      new THREE.CircleGeometry(115, 72, 0, Math.PI * 2),
      circuitMaterial
    );
    circuit.rotation.x = -Math.PI / 2;
    circuit.position.y = 0.05;
    this.group.add(circuit);

    const circuitPos = circuit.geometry.attributes.position;
    for (let i = 0; i < circuitPos.count; i++) {
      const x = circuitPos.getX(i);
      const y = circuitPos.getY(i);
      const ripple = Math.sin((x * x + y * y) * 0.0008) * 0.6;
      circuitPos.setZ(i, ripple);
    }
    circuitPos.needsUpdate = true;

    const walkwayMaterial = new THREE.MeshPhongMaterial({
      color: 0x071721,
      emissive: 0x24ffc7,
      emissiveIntensity: 0.28,
    });

    const radialSegments = 6;
    for (let i = 0; i < radialSegments; i++) {
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(18, 1.2, 70),
        walkwayMaterial.clone()
      );
      segment.position.set(
        Math.cos((i / radialSegments) * Math.PI * 2) * 55,
        0,
        Math.sin((i / radialSegments) * Math.PI * 2) * 55
      );
      segment.lookAt(0, 0, 0);
      segment.position.y = 0.4;
      segment.castShadow = true;
      segment.receiveShadow = true;
      this.group.add(segment);

      this.addCollider({
        minX: segment.position.x - 5,
        maxX: segment.position.x + 5,
        minZ: segment.position.z - 28,
        maxZ: segment.position.z + 28,
        height: 1.2,
      });
    }

    this.addCollider({
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
      height: 0,
    });
  }

  buildCoreChamber() {
    const kernelMaterial = new THREE.MeshPhongMaterial({
      color: 0x06242f,
      emissive: 0x3af7ff,
      emissiveIntensity: 0.6,
      shininess: 180,
      transparent: true,
      opacity: 0.92,
    });
    const kernelCore = new THREE.Mesh(
      new THREE.SphereGeometry(12, 48, 48),
      kernelMaterial
    );
    kernelCore.position.y = 10;
    kernelCore.castShadow = true;
    this.group.add(kernelCore);

    const coreLight = new THREE.PointLight(0x3ffff2, 1.4, 160, 3.2);
    coreLight.position.set(0, 14, 0);
    this.group.add(coreLight);

    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x0c1422,
      emissive: 0x48d6ff,
      emissiveIntensity: 0.35,
      shininess: 90,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 3; i++) {
      const shield = new THREE.Mesh(
        new THREE.TorusGeometry(22 + i * 4, 1.4, 24, 96),
        shieldMaterial.clone()
      );
      shield.rotation.x = Math.PI / 2;
      shield.position.y = 6 + i * 4;
      this.group.add(shield);

      this.addAnimator((delta, time) => {
        shield.rotation.y = time * (0.3 + i * 0.1);
        shield.material.emissiveIntensity = 0.3 + Math.sin(time * 4 + i) * 0.12;
      });
    }

    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x041017,
      emissive: 0x18a4ff,
      emissiveIntensity: 0.4,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 26, 6, 48),
      baseMaterial
    );
    base.position.y = 3;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);

    this.addAnimator((delta, time) => {
      kernelCore.rotation.y += delta * 0.6;
      kernelCore.material.emissiveIntensity = 0.55 + Math.sin(time * 5) * 0.2;
    });

    this.addCollider({
      minX: -16,
      maxX: 16,
      minZ: -16,
      maxZ: 16,
      height: 6,
    });
  }

  buildMemoryColumns() {
    const columnCount = 10;
    const radius = 50;
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      group.lookAt(0, 12, 0);
      this.group.add(group);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 4.2, 4, 18),
        new THREE.MeshPhongMaterial({
          color: 0x05101b,
          emissive: 0x1aa7ff,
          emissiveIntensity: 0.4,
        })
      );
      base.position.y = 2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      for (let level = 0; level < 5; level++) {
        const cell = new THREE.Mesh(
          new THREE.BoxGeometry(5, 4, 5),
          new THREE.MeshPhongMaterial({
            color: 0x0e2733,
            emissive: 0x3cffce,
            emissiveIntensity: 0.32 + level * 0.08,
            transparent: true,
            opacity: 0.9,
          })
        );
        cell.position.y = 5 + level * 4.8;
        cell.castShadow = true;
        group.add(cell);

        this.addAnimator((delta, time) => {
          cell.material.emissiveIntensity =
            0.32 + level * 0.08 + Math.sin(time * 2 + i + level) * 0.12;
        });
      }

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 2, 16),
        new THREE.MeshPhongMaterial({
          color: 0x0a1f2a,
          emissive: 0x3afff7,
          emissiveIntensity: 0.5,
          shininess: 75,
        })
      );
      cap.position.y = 30;
      cap.castShadow = true;
      group.add(cap);

      this.addAnimator((delta, time) => {
        group.rotation.y = Math.sin(time * 0.5 + angle) * 0.12;
      });

      const boundsRadius = 5;
      this.addCollider({
        minX: group.position.x - boundsRadius,
        maxX: group.position.x + boundsRadius,
        minZ: group.position.z - boundsRadius,
        maxZ: group.position.z + boundsRadius,
        height: 30,
      });
    }
  }

  buildDataLinks() {
    const arcMaterial = new THREE.MeshPhongMaterial({
      color: 0xff9857,
      emissive: 0xff5328,
      emissiveIntensity: 0.45,
      shininess: 160,
      transparent: true,
      opacity: 0.85,
    });

    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const controlA = new THREE.Vector3(
        Math.cos(angle) * 26,
        12,
        Math.sin(angle) * 26
      );
      const controlB = new THREE.Vector3(
        Math.cos(angle + Math.PI / 8) * 40,
        22,
        Math.sin(angle + Math.PI / 8) * 40
      );
      const end = new THREE.Vector3(
        Math.cos(angle + Math.PI / 6) * 52,
        18,
        Math.sin(angle + Math.PI / 6) * 52
      );

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 12, 0),
        controlA,
        controlB,
        end,
      ]);

      const geometry = new THREE.TubeGeometry(curve, 80, 0.6, 16, false);
      const mesh = new THREE.Mesh(geometry, arcMaterial.clone());
      mesh.castShadow = true;
      this.group.add(mesh);
      this.energyArcs.push(mesh);

      this.addAnimator((delta, time) => {
        mesh.material.emissiveIntensity = 0.35 + Math.sin(time * 5 + i) * 0.2;
        mesh.rotation.y = Math.sin(time * 0.3 + angle) * 0.05;
      });
    }

    const busMaterial = new THREE.MeshPhongMaterial({
      color: 0x061625,
      emissive: 0x23e2ff,
      emissiveIntensity: 0.5,
      shininess: 120,
    });

    const busRing = new THREE.Mesh(
      new THREE.TorusGeometry(66, 1.6, 24, 128),
      busMaterial
    );
    busRing.position.y = 4;
    busRing.rotation.x = Math.PI / 2;
    busRing.castShadow = true;
    this.group.add(busRing);

    this.addAnimator((delta, time) => {
      busRing.rotation.z = time * 0.2;
      busRing.material.emissiveIntensity = 0.45 + Math.sin(time * 3.4) * 0.1;
    });
  }

  buildAssemblyTablets() {
    const lines = [
      "MOV EAX, KERNEL32",
      "INT 0x80 ; SYSCALL",
      "CMP AX, BX",
      "JNE IRQ_HANDLER",
      "ALIGN 16",
      "REP MOVSB",
    ];

    lines.forEach((line, index) => {
      const texture = this.createAssemblyTexture(line);
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 8),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        })
      );
      panel.position.set(
        Math.cos((index / lines.length) * Math.PI * 2) * 44,
        10 + (index % 2) * 4,
        Math.sin((index / lines.length) * Math.PI * 2) * 44
      );
      panel.lookAt(0, 12, 0);
      this.group.add(panel);
      this.assemblyPanels.push(panel);

      this.addAnimator((delta, time) => {
        panel.material.opacity = 0.75 + Math.sin(time * 2 + index) * 0.2;
      });
    });
  }

  createAssemblyTexture(line) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "rgba(0, 60, 75, 0.8)");
    gradient.addColorStop(1, "rgba(0, 25, 45, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.font = "bold 56px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(74, 255, 255, 0.8)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(90, 255, 255, 1)";
    ctx.fillText(line, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }

  buildBinaryParticles() {
    const glyphs = ["0", "1"];
    const colors = ["#4dfff7", "#98fffb"];

    this.binaryTextures.forEach((texture) => texture.dispose());
    this.binaryTextures = glyphs.map((glyph, idx) =>
      this.createBinaryTexture(glyph, colors[idx])
    );

    const count = 80;
    for (let i = 0; i < count; i++) {
      const texture = this.binaryTextures[i % this.binaryTextures.length];
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        })
      );
      const radius = 24 + Math.random() * 26;
      const angle = Math.random() * Math.PI * 2;
      sprite.position.set(
        Math.cos(angle) * radius,
        6 + Math.random() * 18,
        Math.sin(angle) * radius
      );
      const scale = 1 + Math.random() * 1.8;
      sprite.scale.set(scale, scale, scale);
      sprite.userData = {
        baseRadius: radius,
        baseY: sprite.position.y,
        angle,
        angularSpeed: 0.5 + Math.random() * 0.4,
        bobSpeed: 1 + Math.random() * 1.2,
        bobHeight: 1.6 + Math.random() * 1.6,
      };
      this.binarySprites.push(sprite);
      this.group.add(sprite);
    }

    this.addAnimator((delta, time) => {
      this.binarySprites.forEach((sprite, index) => {
        sprite.userData.angle += sprite.userData.angularSpeed * delta;
        const radius =
          sprite.userData.baseRadius + Math.sin(time * 0.6 + index) * 1.8;
        sprite.position.x = Math.cos(sprite.userData.angle) * radius;
        sprite.position.z = Math.sin(sprite.userData.angle) * radius;
        sprite.position.y =
          sprite.userData.baseY +
          Math.sin(time * sprite.userData.bobSpeed + index) *
            sprite.userData.bobHeight;
        sprite.material.opacity = 0.65 + Math.sin(time * 4 + index) * 0.25;
      });
    });
  }

  createBinaryTexture(glyph, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 100px 'Courier New', monospace";
    ctx.fillText(glyph, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }

  update(deltaTime, timeElapsed, playerPosition, interactiveMode) {
    super.update(deltaTime, timeElapsed, playerPosition);
  }

  onExit() {
    this.binarySprites.forEach((sprite) => {
      if (sprite.material && sprite.material.map) {
        sprite.material.map.dispose();
      }
      if (sprite.material) {
        sprite.material.dispose();
      }
    });
    this.binarySprites = [];

    this.binaryTextures.forEach((texture) => texture.dispose());
    this.binaryTextures = [];

    this.assemblyPanels.forEach((panel) => {
      if (panel.material && panel.material.map) {
        panel.material.map.dispose();
      }
      if (panel.material) {
        panel.material.dispose();
      }
    });
    this.assemblyPanels = [];

    this.energyArcs.forEach((arc) => {
      if (arc.geometry) {
        arc.geometry.dispose();
      }
      if (arc.material) {
        arc.material.dispose();
      }
    });
    this.energyArcs = [];
  }
}
