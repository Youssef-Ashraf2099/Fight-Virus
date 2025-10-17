class RetroTerminalEnvironment extends BaseEnvironmentMap {
  constructor(environment) {
    super(environment);
    this.displayName = "RETRO TERMINAL INTERFACE";
    this.cursorBlink = true;
    this.inputLines = [""];
    this.maxLines = 5;
    this.maxLineLength = 18;
    this.lastKeyDisplay = "NONE";
    this.screenDirty = true;
    this.keyMap = new Map();
    this.keyLabelCache = new Map();
    this.activeManualKeys = new Set();
    this.screenCanvas = null;
    this.screenCtx = null;
    this.screenTexture = null;
    this.screenOverlay = null;
    this.boundHandleKeyDown = null;
    this.boundHandleKeyUp = null;
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
    this.buildMouse();
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

    const deckMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a332c,
      emissive: 0x1d1611,
      emissiveIntensity: 0.32,
      shininess: 55,
    });

    const keyDeck = new THREE.Mesh(
      new THREE.BoxGeometry(62, 1.2, 24),
      deckMaterial
    );
    keyDeck.position.set(0, 3, 2);
    keyDeck.castShadow = true;
    this.group.add(keyDeck);

    const deckRiser = new THREE.Mesh(
      new THREE.BoxGeometry(64, 1.5, 4),
      deckMaterial.clone()
    );
    deckRiser.position.set(0, 2.4, -9.5);
    deckRiser.castShadow = true;
    this.group.add(deckRiser);

    [-24, -12, 0, 12, 24].forEach((x) => {
      const support = new THREE.Mesh(
        new THREE.BoxGeometry(6, 2.2, 3.5),
        new THREE.MeshPhongMaterial({
          color: 0x27201a,
          emissive: 0x140f0b,
          emissiveIntensity: 0.28,
          shininess: 25,
        })
      );
      support.position.set(x, 2.1, 2); // seats the keys visually into the deck
      support.castShadow = true;
      this.group.add(support);
    });

    // Keys
    this.keys = [];
    this.keyMap.clear();
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
          manualPress: false,
          randomActive: false,
        };

        this.keys.push(key);
        this.keyMap.set(keyLabel, key);
        this.group.add(key);

        this.attachKeyLabel(key, keyLabel);

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
      manualPress: false,
      randomActive: false,
    };
    this.keys.push(spaceBar);
    this.keyMap.set("SPACE", spaceBar);
    this.group.add(spaceBar);

    this.attachKeyLabel(spaceBar, "SPACE", 12, 2.4, 1.15);

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

  getKeyLabelTexture(label) {
    const key = (label || "").trim();
    if (this.keyLabelCache.has(key)) {
      return this.keyLabelCache.get(key);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.45,
      10,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    gradient.addColorStop(0, "rgba(18, 255, 160, 0.85)");
    gradient.addColorStop(0.45, "rgba(18, 255, 160, 0.55)");
    gradient.addColorStop(1, "rgba(18, 255, 160, 0.15)");

    ctx.fillStyle = gradient;
    ctx.font =
      key.length > 3
        ? "bold 86px 'Courier New', monospace"
        : "bold 120px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(18, 255, 160, 0.7)";
    ctx.shadowBlur = 28;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0, 30, 15, 0.8)";

    const text = key || " ";
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + 8);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    this.keyLabelCache.set(key, texture);
    return texture;
  }

  attachKeyLabel(keyMesh, label, width = 3, height = 3, yOffset = 1.25) {
    if (!keyMesh || !label) {
      return;
    }

    const texture = this.getKeyLabelTexture(label);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 1,
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const glyph = new THREE.Mesh(geometry, material);
    glyph.position.set(0, yOffset, 0);
    glyph.rotation.x = -Math.PI / 2;
    keyMesh.add(glyph);
  }

  buildMouse() {
    // Mouse pad - rectangular with subtle elevation
    const padMaterial = new THREE.MeshPhongMaterial({
      color: 0x141922,
      emissive: 0x04080d,
      emissiveIntensity: 0.38,
      shininess: 35,
    });
    const mousePad = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.4, 22),
      padMaterial
    );
    mousePad.position.set(27.5, 2.8, 8.4);
    mousePad.receiveShadow = true;
    this.group.add(mousePad);

    // Subtle glow on pad surface
    const padGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(16.5, 20.5),
      new THREE.MeshBasicMaterial({
        color: 0x0a2518,
        transparent: true,
        opacity: 0.3,
      })
    );
    padGlow.rotation.x = -Math.PI / 2;
    padGlow.position.set(27.5, 2.82, 8.4);
    this.group.add(padGlow);

    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(27.5, 3.1, 8);
    mouseGroup.rotation.y = -Math.PI / 11;
    this.group.add(mouseGroup);

    // Main body material - sleek and modern
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a3340,
      emissive: 0x0f141a,
      emissiveIntensity: 0.4,
      shininess: 180,
      specular: 0x4a6b8f,
    });

    // Left button - distinct, smooth surface
    const leftButtonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.8, 5.2),
      new THREE.MeshPhongMaterial({
        color: 0x3a4a5c,
        emissive: 0x1a2a3c,
        emissiveIntensity: 0.6,
        shininess: 240,
        specular: 0x6a8baf,
      })
    );
    leftButtonMesh.position.set(-1.35, 2.8, -0.8);
    leftButtonMesh.rotation.x = -Math.PI / 18;
    leftButtonMesh.castShadow = true;
    mouseGroup.add(leftButtonMesh);

    // Right button - distinct, smooth surface
    const rightButtonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.8, 5.2),
      new THREE.MeshPhongMaterial({
        color: 0x3a4a5c,
        emissive: 0x1a2a3c,
        emissiveIntensity: 0.6,
        shininess: 240,
        specular: 0x6a8baf,
      })
    );
    rightButtonMesh.position.set(1.35, 2.8, -0.8);
    rightButtonMesh.rotation.x = -Math.PI / 18;
    rightButtonMesh.castShadow = true;
    mouseGroup.add(rightButtonMesh);

    // Button separator - visible gap
    const separatorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.9, 5.4),
      new THREE.MeshPhongMaterial({
        color: 0x0d1017,
        emissive: 0x050810,
        emissiveIntensity: 0.8,
        shininess: 120,
      })
    );
    separatorMesh.position.set(0, 2.85, -0.8);
    separatorMesh.rotation.x = -Math.PI / 18;
    mouseGroup.add(separatorMesh);

    // Curved back/palm rest area
    const palmGeometry = new THREE.SphereGeometry(
      2.8,
      28,
      28,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.6
    );
    palmGeometry.scale(1.4, 1.0, 1.6);
    const palmShell = new THREE.Mesh(
      palmGeometry,
      new THREE.MeshPhongMaterial({
        color: 0x313f4d,
        emissive: 0x141d27,
        emissiveIntensity: 0.5,
        shininess: 200,
        specular: 0x5a7a9f,
      })
    );
    palmShell.position.set(0, 2.2, -2.8);
    palmShell.rotation.x = Math.PI / 14;
    palmShell.castShadow = true;
    mouseGroup.add(palmShell);

    // Rear thumb rest area
    const thumbRestGeometry = new THREE.BoxGeometry(3.8, 1.6, 2.4);
    const thumbRest = new THREE.Mesh(thumbRestGeometry, bodyMaterial);
    thumbRest.position.set(-2.2, 1.4, -3.5);
    thumbRest.rotation.x = -Math.PI / 16;
    thumbRest.rotation.z = Math.PI / 12;
    thumbRest.castShadow = true;
    mouseGroup.add(thumbRest);

    // Scroll wheel - centered with grip
    const scrollMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a6a88,
      emissive: 0x2a4a68,
      emissiveIntensity: 0.7,
      shininess: 220,
    });
    const scrollWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 2.0, 18),
      scrollMaterial
    );
    scrollWheel.rotation.z = Math.PI / 2;
    scrollWheel.position.set(0, 2.7, -0.5);
    scrollWheel.castShadow = true;
    mouseGroup.add(scrollWheel);

    // Scroll wheel grip ridges
    for (let i = 0; i < 6; i++) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 2.1, 0.15),
        new THREE.MeshPhongMaterial({
          color: 0x1a2a3a,
          emissive: 0x0a1a2a,
          emissiveIntensity: 0.5,
        })
      );
      const angle = (i / 6) * Math.PI * 2;
      ridge.position.set(
        Math.cos(angle) * 0.52,
        2.7,
        -0.5 + Math.sin(angle) * 0.52
      );
      mouseGroup.add(ridge);
    }

    // Side grip accents - left
    const leftGripAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.4, 4.8),
      new THREE.MeshPhongMaterial({
        color: 0x1f2835,
        emissive: 0x0a0f17,
        emissiveIntensity: 0.45,
        shininess: 60,
      })
    );
    leftGripAccent.position.set(-2.25, 1.6, -1.2);
    leftGripAccent.rotation.y = Math.PI / 20;
    leftGripAccent.castShadow = true;
    mouseGroup.add(leftGripAccent);

    // Side grip accents - right
    const rightGripAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.4, 4.8),
      new THREE.MeshPhongMaterial({
        color: 0x1f2835,
        emissive: 0x0a0f17,
        emissiveIntensity: 0.45,
        shininess: 60,
      })
    );
    rightGripAccent.position.set(2.25, 1.6, -1.2);
    rightGripAccent.rotation.y = -Math.PI / 20;
    rightGripAccent.castShadow = true;
    mouseGroup.add(rightGripAccent);

    // Optical sensor at front bottom
    const sensor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16),
      new THREE.MeshPhongMaterial({
        color: 0x0a1820,
        emissive: 0x051015,
        emissiveIntensity: 0.8,
        shininess: 160,
      })
    );
    sensor.rotation.x = Math.PI / 2;
    sensor.position.set(0, 0.5, 1.6);
    mouseGroup.add(sensor);

    // Subtle accent line along the spine
    const accentLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.4, 4.8),
      new THREE.MeshPhongMaterial({
        color: 0x2a5a7a,
        emissive: 0x1a3a5a,
        emissiveIntensity: 0.7,
        shininess: 200,
      })
    );
    accentLine.position.set(0, 1.8, -1.2);
    mouseGroup.add(accentLine);

    const sensorGlow = new THREE.PointLight(0x42ffbe, 0.25, 10);
    sensorGlow.position.set(0, 0.7, 1.8);
    mouseGroup.add(sensorGlow);

    // Cable routing
    const cablePoints = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      cablePoints.push(
        new THREE.Vector3(
          0.15 - t * 8.2,
          1.45 + Math.sin(t * Math.PI * 0.8) * 0.22,
          -2.6 - t * 10.8
        )
      );
    }
    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
    const cableGeometry = new THREE.TubeGeometry(
      cableCurve,
      28,
      0.26,
      14,
      false
    );
    const cableMaterial = new THREE.MeshPhongMaterial({
      color: 0x181d25,
      emissive: 0x060a0f,
      emissiveIntensity: 0.22,
      shininess: 22,
    });
    const cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.castShadow = true;
    mouseGroup.add(cable);

    // Top accent light
    const accentLight = new THREE.PointLight(0x82ffdb, 0.35, 16, 2.1);
    accentLight.position.set(0.2, 3.2, -1.6);
    mouseGroup.add(accentLight);
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

    this.createTerminalDisplay();

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

  createTerminalDisplay() {
    const width = 1024;
    const height = 768;

    this.screenCanvas = document.createElement("canvas");
    this.screenCanvas.width = width;
    this.screenCanvas.height = height;
    this.screenCtx = this.screenCanvas.getContext("2d");

    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.anisotropy = 4;
    this.screenTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.screenTexture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      transparent: true,
      opacity: 0.95,
      color: 0xffffff,
    });
    material.depthWrite = false;

    this.screenOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(58.4, 38.4),
      material
    );
    this.screenOverlay.position.set(0, 32, -26.6);
    this.group.add(this.screenOverlay);

    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  markScreenDirty() {
    this.screenDirty = true;
  }

  updateTerminalDisplay(force = false) {
    if (!this.screenCtx || (!force && !this.screenDirty)) {
      return;
    }

    this.screenDirty = false;
    const ctx = this.screenCtx;
    const width = this.screenCanvas.width;
    const height = this.screenCanvas.height;

    ctx.save();
    ctx.fillStyle = "#001208";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(0, 50, 30, 0.75)");
    gradient.addColorStop(1, "rgba(0, 22, 12, 0.92)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#0a2f1c";
    for (let y = 0; y < height; y += 22) {
      ctx.fillRect(0, y, width, 7);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(51, 255, 136, 0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    ctx.fillStyle = "rgba(51, 255, 136, 0.1)";
    ctx.fillRect(40, 40, width - 80, 80);

    ctx.fillStyle = "#7dffc7";
    ctx.shadowColor = "rgba(61, 255, 200, 0.65)";
    ctx.shadowBlur = 18;
    ctx.textBaseline = "top";
    ctx.font = "bold 64px 'Courier New', monospace";
    const marginX = 70;
    let cursorY = 70;
    ctx.fillText("RETRO TERMINAL ONLINE", marginX, cursorY);

    ctx.font = "48px 'Courier New', monospace";
    cursorY += 110;
    ctx.fillText(`LAST KEY PRESSED: ${this.lastKeyDisplay}`, marginX, cursorY);

    cursorY += 90;
    ctx.fillText("INPUT BUFFER:", marginX, cursorY);

    const activeIndex = Math.max(0, this.inputLines.length - 1);
    const lines = this.inputLines.slice();
    while (lines.length < this.maxLines) {
      lines.push("");
    }

    const prefix = "> ";
    const lineHeight = 62;
    const bufferStartY = cursorY + 70;

    lines.forEach((line, index) => {
      const y = bufferStartY + index * lineHeight;
      const text = prefix + line;
      ctx.fillText(text, marginX, y);

      if (index === activeIndex && this.cursorBlink) {
        const widthMeasure = ctx.measureText(text).width;
        ctx.fillRect(marginX + widthMeasure + 12, y + 10, 26, 45);
      }
    });

    ctx.restore();

    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }
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
        this.markScreenDirty();
        this.updateTerminalDisplay(true);
      }

      // Simulate random key press effect
      if (this.keys && this.keys.length && Math.random() < 0.02) {
        const randomKey =
          this.keys[Math.floor(Math.random() * this.keys.length)];
        if (
          !randomKey.userData.manualPress &&
          !randomKey.userData.randomActive
        ) {
          randomKey.userData.randomActive = true;
          this.activateKeyMesh(randomKey, 0.8);

          setTimeout(() => {
            randomKey.userData.randomActive = false;
            if (!randomKey.userData.manualPress) {
              this.deactivateKeyMesh(randomKey);
            }
          }, 150);
        }
      }
    });
  }

  onEnter() {
    if (!this.boundHandleKeyDown) {
      this.boundHandleKeyDown = this.handleKeyDown.bind(this);
      window.addEventListener("keydown", this.boundHandleKeyDown, false);
    }
    if (!this.boundHandleKeyUp) {
      this.boundHandleKeyUp = this.handleKeyUp.bind(this);
      window.addEventListener("keyup", this.boundHandleKeyUp, false);
    }

    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  onExit() {
    if (this.boundHandleKeyDown) {
      window.removeEventListener("keydown", this.boundHandleKeyDown, false);
      this.boundHandleKeyDown = null;
    }
    if (this.boundHandleKeyUp) {
      window.removeEventListener("keyup", this.boundHandleKeyUp, false);
      this.boundHandleKeyUp = null;
    }

    this.activeManualKeys.forEach((keyMesh) => {
      keyMesh.userData.manualPress = false;
      if (!keyMesh.userData.randomActive) {
        this.deactivateKeyMesh(keyMesh);
      }
    });
    this.activeManualKeys.clear();
  }

  handleKeyDown(event) {
    if (!event) {
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      this.removeCharacter();
      this.lastKeyDisplay = "BACKSPACE";
      this.markScreenDirty();
      this.updateTerminalDisplay(true);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.addNewLine();
      this.lastKeyDisplay = "ENTER";
      this.markScreenDirty();
      this.updateTerminalDisplay(true);
      return;
    }

    const info = this.getKeyInfo(event);
    if (!info) {
      return;
    }

    if (info.consume) {
      event.preventDefault();
    }

    if (typeof info.char === "string") {
      this.appendCharacter(info.char);
    }

    if (info.display) {
      this.lastKeyDisplay = info.display;
    }

    if (info.label) {
      this.pressManualKey(info.label);
    }

    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  handleKeyUp(event) {
    if (!event) {
      return;
    }

    if (event.key === "Backspace" || event.key === "Enter") {
      return;
    }

    const info = this.getKeyInfo(event);
    if (info && info.label) {
      this.releaseManualKey(info.label);
    }
  }

  getKeyInfo(event) {
    if (!event || typeof event.key !== "string") {
      return null;
    }

    const key = event.key;
    if (key === " " || key === "Spacebar" || key === "Space") {
      return { char: " ", label: "SPACE", display: "SPACE", consume: true };
    }

    if (key.length === 1) {
      const shiftedNumbers = {
        "!": "1",
        "@": "2",
        "#": "3",
        $: "4",
        "%": "5",
        "^": "6",
        "&": "7",
        "*": "8",
        "(": "9",
        ")": "0",
      };

      if (shiftedNumbers[key]) {
        return {
          char: key,
          label: shiftedNumbers[key],
          display: key,
          consume: false,
        };
      }

      if (/^[0-9]$/.test(key)) {
        return { char: key, label: key, display: key, consume: false };
      }

      const upper = key.toUpperCase();
      if (/^[A-Z]$/.test(upper)) {
        return { char: upper, label: upper, display: upper, consume: false };
      }

      if (key === "-" || key === "_" || key === "." || key === ",") {
        return { char: key, label: null, display: key, consume: false };
      }
    }

    return null;
  }

  appendCharacter(char) {
    if (typeof char !== "string" || !char.length) {
      return;
    }

    const normalized = char === " " ? " " : char.toUpperCase();
    if (!this.inputLines || !Array.isArray(this.inputLines)) {
      this.inputLines = [""];
    }

    let targetIndex = this.inputLines.length - 1;
    if (targetIndex < 0) {
      this.inputLines = [""];
      targetIndex = 0;
    }

    let currentLine = this.inputLines[targetIndex] || "";
    if (currentLine.length >= this.maxLineLength) {
      this.inputLines.push("");
      if (this.inputLines.length > this.maxLines) {
        this.inputLines.shift();
      }
      targetIndex = this.inputLines.length - 1;
      currentLine = this.inputLines[targetIndex] || "";
    }

    this.inputLines[targetIndex] = currentLine + normalized;
    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  addNewLine() {
    if (!this.inputLines || !this.inputLines.length) {
      this.inputLines = [""];
    }

    this.inputLines.push("");
    if (this.inputLines.length > this.maxLines) {
      this.inputLines.shift();
    }

    if (!this.inputLines.length) {
      this.inputLines = [""];
    }

    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  removeCharacter() {
    if (!this.inputLines || !this.inputLines.length) {
      this.inputLines = [""];
      return;
    }

    let targetIndex = this.inputLines.length - 1;
    let currentLine = this.inputLines[targetIndex] || "";

    if (currentLine.length > 0) {
      this.inputLines[targetIndex] = currentLine.slice(0, -1);
    } else if (this.inputLines.length > 1) {
      this.inputLines.pop();
      targetIndex = this.inputLines.length - 1;
      currentLine = this.inputLines[targetIndex] || "";
      this.inputLines[targetIndex] = currentLine;
    }

    if (!this.inputLines.length) {
      this.inputLines = [""];
    }

    this.markScreenDirty();
    this.updateTerminalDisplay(true);
  }

  pressManualKey(label) {
    const keyMesh = this.getKeyMesh(label);
    if (!keyMesh) {
      return;
    }

    if (!keyMesh.userData.manualPress) {
      keyMesh.userData.manualPress = true;
      this.activateKeyMesh(keyMesh, 1.0);
      this.activeManualKeys.add(keyMesh);
    }
  }

  releaseManualKey(label) {
    const keyMesh = this.getKeyMesh(label);
    if (!keyMesh) {
      return;
    }

    if (keyMesh.userData.manualPress) {
      keyMesh.userData.manualPress = false;
      this.activeManualKeys.delete(keyMesh);
      if (!keyMesh.userData.randomActive) {
        this.deactivateKeyMesh(keyMesh);
      }
    }
  }

  getKeyMesh(label) {
    if (!label) {
      return null;
    }
    return this.keyMap.get(label) || null;
  }

  activateKeyMesh(keyMesh, intensity = 0.8) {
    if (!keyMesh) {
      return;
    }
    keyMesh.userData.pressed = true;
    keyMesh.position.y = keyMesh.userData.baseY - 0.5;
    keyMesh.material.emissive.setHex(0x33ff88);
    keyMesh.material.emissiveIntensity = intensity;
  }

  deactivateKeyMesh(keyMesh) {
    if (!keyMesh) {
      return;
    }
    keyMesh.userData.pressed = false;
    keyMesh.position.y = keyMesh.userData.baseY;
    keyMesh.material.emissive.setHex(0x2a2520);
    keyMesh.material.emissiveIntensity = 0.3;
  }

  update(deltaTime, timeElapsed, playerPosition, _interactiveMode) {
    super.update(deltaTime, timeElapsed, playerPosition);
    this.updateTerminalDisplay();
  }
}
