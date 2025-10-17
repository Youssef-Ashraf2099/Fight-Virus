class RetroTerminalEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "RETRO TERMINAL INTERFACE";
    this.currentKey = "";
    this.displayText = "VIRUS HUNTER ACTIVE_";
    this.cursorBlink = true;
  }

  getPalette() {
    return {
      ambient: 0x0a1508,
      directional: 0x33ff88,
      accentA: 0x00ff66,
      accentB: 0xffaa33,
      fog: 0x020804,
      fogDensity: 0.014,
      background: 0x010502,
    };
  }

  create() {
    this.setBaseFloorHeight(0);

    this.buildKeyboard();
    this.buildScreen();
    this.buildTerminalFrame();
    this.buildCables();
  }

  buildKeyboard() {
    // Keyboard base
    const baseGeometry = new THREE.BoxGeometry(70, 3, 30);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2520,
      emissive: 0x1a1510,
      emissiveIntensity: 0.2,
      shininess: 40,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 1.5, 0);
    this.group.add(base);

    // Keys
    this.keys = [];
    const keyLayout = [
      // Row 1 (numbers)
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      // Row 2 (QWERTY)
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      // Row 3 (ASDF)
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      // Row 4 (ZXCV)
      ["Z", "X", "C", "V", "B", "N", "M"],
    ];

    const keyMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4540,
      emissive: 0x2a2520,
      emissiveIntensity: 0.3,
      shininess: 60,
    });

    const activeKeyMaterial = new THREE.MeshPhongMaterial({
      color: 0x33ff88,
      emissive: 0x33ff88,
      emissiveIntensity: 0.8,
      shininess: 100,
    });

    keyLayout.forEach((row, rowIndex) => {
      const rowOffset = (row.length - 10) * 3;
      row.forEach((keyLabel, colIndex) => {
        const keyGeometry = new THREE.BoxGeometry(5, 2, 5);
        const key = new THREE.Mesh(keyGeometry, keyMaterial.clone());

        const xPos = -27 + colIndex * 6 - rowOffset / 2;
        const zPos = -10 + rowIndex * 6;
        key.position.set(xPos, 4, zPos);

        key.userData = {
          label: keyLabel,
          baseY: 4,
          pressed: false,
        };

        this.keys.push(key);
        this.group.add(key);

        // Key label (using a small text sprite simulation)
        const labelGeometry = new THREE.PlaneGeometry(3, 3);
        const labelMaterial = new THREE.MeshBasicMaterial({
          color: 0x88ff88,
          transparent: true,
          opacity: 0.9,
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 1.2, 0);
        label.rotation.x = -Math.PI / 2;
        key.add(label);

        // Collider for each key
        this.addCollider({
          minX: xPos - 2.5,
          maxX: xPos + 2.5,
          minZ: zPos - 2.5,
          maxZ: zPos + 2.5,
          height: 5,
        });
      });
    });

    // Space bar
    const spaceGeometry = new THREE.BoxGeometry(30, 2, 5);
    const spaceBar = new THREE.Mesh(spaceGeometry, keyMaterial.clone());
    spaceBar.position.set(0, 4, 14);
    spaceBar.userData = {
      label: "SPACE",
      baseY: 4,
      pressed: false,
    };
    this.keys.push(spaceBar);
    this.group.add(spaceBar);

    this.addCollider({
      minX: -15,
      maxX: 15,
      minZ: 11.5,
      maxZ: 16.5,
      height: 5,
    });

    // Keyboard base collider
    this.addCollider({
      minX: -35,
      maxX: 35,
      minZ: -15,
      maxZ: 18,
      height: 0,
    });
  }

  buildScreen() {
    // Monitor casing
    const casingGeometry = new THREE.BoxGeometry(65, 45, 6);
    const casingMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3530,
      emissive: 0x1a1510,
      emissiveIntensity: 0.2,
      shininess: 50,
    });
    const casing = new THREE.Mesh(casingGeometry, casingMaterial);
    casing.position.set(0, 32, -30);
    this.group.add(casing);

    // CRT screen
    const screenGeometry = new THREE.BoxGeometry(60, 40, 1);
    const screenMaterial = new THREE.MeshPhongMaterial({
      color: 0x001a0a,
      emissive: 0x003311,
      emissiveIntensity: 0.6,
      shininess: 120,
    });
    this.screen = new THREE.Mesh(screenGeometry, screenMaterial);
    this.screen.position.set(0, 32, -27);
    this.group.add(this.screen);

    // Scanlines effect
    for (let i = 0; i < 20; i++) {
      const lineGeometry = new THREE.PlaneGeometry(58, 0.3);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x003311,
        transparent: true,
        opacity: 0.2,
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, 32 - 19 + i * 2, -26.8);
      this.group.add(line);
    }

    // Screen glow
    const glowGeometry = new THREE.PlaneGeometry(62, 42);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff88,
      transparent: true,
      opacity: 0.15,
    });
    this.screenGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.screenGlow.position.set(0, 32, -26.5);
    this.group.add(this.screenGlow);

    // Monitor stand
    const standGeometry = new THREE.CylinderGeometry(3, 5, 8, 16);
    const stand = new THREE.Mesh(standGeometry, casingMaterial);
    stand.position.set(0, 8, -30);
    this.group.add(stand);

    // Monitor base
    const baseGeometry = new THREE.CylinderGeometry(8, 10, 2, 24);
    const monitorBase = new THREE.Mesh(baseGeometry, casingMaterial);
    monitorBase.position.set(0, 1, -30);
    this.group.add(monitorBase);

    // Screen collider
    this.addCollider({
      minX: -5,
      maxX: 5,
      minZ: -35,
      maxZ: -25,
      height: 12,
    });
  }

  buildTerminalFrame() {
    // Platform edges
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a3528,
      emissive: 0x1a2518,
      emissiveIntensity: 0.3,
    });

    // Left edge
    const leftEdge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 80),
      edgeMaterial
    );
    leftEdge.position.set(-50, 1.5, -10);
    this.group.add(leftEdge);

    // Right edge
    const rightEdge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 80),
      edgeMaterial
    );
    rightEdge.position.set(50, 1.5, -10);
    this.group.add(rightEdge);

    // Back edge
    const backEdge = new THREE.Mesh(
      new THREE.BoxGeometry(100, 3, 4),
      edgeMaterial
    );
    backEdge.position.set(0, 1.5, -50);
    this.group.add(backEdge);

    // Front edge
    const frontEdge = new THREE.Mesh(
      new THREE.BoxGeometry(100, 3, 4),
      edgeMaterial
    );
    frontEdge.position.set(0, 1.5, 30);
    this.group.add(frontEdge);

    // Edge colliders
    this.addCollider({ minX: -52, maxX: -48, minZ: -50, maxZ: 30, height: 3 });
    this.addCollider({ minX: 48, maxX: 52, minZ: -50, maxZ: 30, height: 3 });
    this.addCollider({ minX: -50, maxX: 50, minZ: -52, maxZ: -48, height: 3 });
    this.addCollider({ minX: -50, maxX: 50, minZ: 28, maxZ: 32, height: 3 });
  }

  buildCables() {
    // Power cable
    const cablePoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      cablePoints.push(
        new THREE.Vector3(
          -45 + t * 10,
          1 + Math.sin(t * Math.PI * 3) * 2,
          -25 + t * 15
        )
      );
    }

    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
    const cableGeometry = new THREE.TubeGeometry(cableCurve, 20, 0.5, 8, false);
    const cableMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 60,
    });
    const cable = new THREE.Mesh(cableGeometry, cableMaterial);
    this.group.add(cable);

    // Cable lights
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0x33ff88, 0.6, 15);
      light.position.set(-40 + i * 10, 3, -35 + i * 10);
      this.group.add(light);
    }

    this.addAnimator((delta, time) => {
      // Screen glow pulse
      this.screenGlow.material.opacity = 0.12 + Math.sin(time * 2) * 0.05;
      this.screen.material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.15;

      // Cursor blink (every 0.5 seconds)
      if (Math.floor(time * 2) !== Math.floor((time - delta) * 2)) {
        this.cursorBlink = !this.cursorBlink;
      }

      // Simulate random key press effect
      if (Math.random() < 0.02) {
        const randomKey =
          this.keys[Math.floor(Math.random() * this.keys.length)];
        if (!randomKey.userData.pressed) {
          randomKey.userData.pressed = true;
          randomKey.position.y = randomKey.userData.baseY - 0.5;
          randomKey.material.emissive.setHex(0x33ff88);
          randomKey.material.emissiveIntensity = 0.8;

          setTimeout(() => {
            randomKey.userData.pressed = false;
            randomKey.position.y = randomKey.userData.baseY;
            randomKey.material.emissive.setHex(0x2a2520);
            randomKey.material.emissiveIntensity = 0.3;
          }, 150);
        }
      }
    });
  }
}
