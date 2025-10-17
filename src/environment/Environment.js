class Environment {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;

    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);

    this.backgroundGroup = new THREE.Group();
    this.scene.add(this.backgroundGroup);

    this.createLightingRig();
    this.createBackgroundElements();
    this.initFog();

    this._tempPlayerPos = new THREE.Vector3();
    this.phaseIndex = -1;
    this.currentMap = null;
    this.previousMap = null;
    this.transitionState = null;
    this.physicsMap = null;
    this.physicsColliders = [];
    this.baseFloorHeight = 0;
    this.nextPhysicsColliders = [];
    this.nextBaseFloorHeight = 0;
    this.currentEnvironment = null; // Track current environment for spectator mode
    this.interactiveMode = true;

    this.phaseConfigs = [
      { key: "cpu", factory: () => new CPUEnvironment(this) },
      { key: "kernel", factory: () => new KernelEnvironment(this) },
      { key: "memory", factory: () => new MemoryEnvironment(this) },
      { key: "gpu", factory: () => new GPUEnvironment(this) },
      { key: "motherboard", factory: () => new MotherboardEnvironment(this) },
      { key: "harddrive", factory: () => new HardDriveEnvironment(this) },
      { key: "terminal", factory: () => new RetroTerminalEnvironment(this) },
      { key: "network", factory: () => new NetworkHubEnvironment(this) },
      { key: "ai-core", factory: () => new AINeuralNetworkEnvironment(this) },
      { key: "overview", factory: () => new SystemOverviewEnvironment(this) },
    ];

    this.setPhase(0);
  }

  createLightingRig() {
    const ambient = new THREE.AmbientLight(0x061414, 0.5);
    this.ambientLight = ambient;
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x1cff9b, 0.9);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    this.dirLight = dirLight;
    this.scene.add(dirLight);

    const accentA = new THREE.PointLight(0x12ffc3, 1.2, 180, 2);
    accentA.position.set(-60, 30, -60);
    const accentB = new THREE.PointLight(0xffd966, 1.1, 180, 2);
    accentB.position.set(60, 40, 60);
    this.accentLights = [accentA, accentB];
    this.accentLights.forEach((light) => this.scene.add(light));
  }

  createBackgroundElements() {
    const skyGeometry = new THREE.SphereGeometry(260, 40, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x020508,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.95,
    });
    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.backgroundGroup.add(this.skyDome);

    this.starSprites = [];
    const starGeometry = new THREE.SphereGeometry(0.6, 6, 6);
    for (let i = 0; i < 240; i++) {
      const starMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x36ffc9 : 0x7affff,
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
      });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 210 + Math.random() * 40;
      star.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      star.userData = {
        baseOpacity: star.material.opacity,
        offset: Math.random() * Math.PI * 2,
      };
      this.starSprites.push(star);
      this.backgroundGroup.add(star);
    }

    this.horizonRings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(160 + i * 12, 1.8, 12, 120);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x2ef8c9,
        transparent: true,
        opacity: 0.12,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -8 - i * 6;
      this.horizonRings.push(ring);
      this.backgroundGroup.add(ring);
    }
  }

  initFog() {
    this.fog = new THREE.FogExp2(0x020507, 0.018);
    this.scene.fog = this.fog;
  }

  setInteractiveMode(enabled) {
    this.interactiveMode = !!enabled;
  }

  getInteractiveMode() {
    return this.interactiveMode;
  }

  setPhase(index) {
    const clamped = Math.max(0, Math.min(this.phaseConfigs.length - 1, index));

    if (this.transitionState) {
      this._forceCompleteTransition();
    }

    console.log(
      `🔄 Environment.setPhase called with index: ${index}, clamped: ${clamped}`
    );
    console.log(`   Current phase index: ${this.phaseIndex}`);

    // Allow re-setting the same phase (for spectator mode)
    // if (clamped === this.phaseIndex) {
    //   return false;
    // }

    const config = this.phaseConfigs[clamped];
    console.log(`   Config key: ${config.key}`);

    let newMap;
    try {
      newMap = config.factory();
      console.log(
        `   ✅ Factory created map: ${newMap.constructor.name}, displayName: ${newMap.displayName}`
      );
    } catch (error) {
      console.error(`   ❌ Error creating environment:`, error);
      return false;
    }

    const palette = newMap.getPalette();

    const prevMap = this.currentMap;
    if (prevMap) {
      console.log(`   Cleaning up previous map: ${prevMap.displayName}`);
      this.previousMap = prevMap;
    }

    console.log(`   Building new map...`);
    newMap.build(this.mapGroup);
    console.log(`   ✅ Map built successfully`);

    const isInitialMap = !prevMap || clamped !== this.phaseIndex;
    this.currentMap = newMap;
    this.currentEnvironment = newMap; // Track for spectator mode
    this.phaseIndex = clamped;
    this.currentPhaseName = newMap.displayName;
    this.applyPalette(palette);

    if (isInitialMap) {
      if (newMap.group) {
        newMap.group.position.set(0, 0, 0);
        newMap.group.scale.setScalar(1);
        newMap.group.rotation.set(0, 0, 0);
      }
      if (prevMap) {
        prevMap.dispose();
      }
      this.physicsMap = newMap;
      this.physicsColliders = newMap.getColliders();
      this.baseFloorHeight =
        typeof newMap.getBaseFloorHeight === "function"
          ? newMap.getBaseFloorHeight()
          : 0;
      this.transitionState = null;
      this.previousMap = null;
      this.nextPhysicsColliders = [];
      this.nextBaseFloorHeight = 0;
      return true;
    }

    if (newMap.group) {
      newMap.group.position.set(0, -90, 0);
      newMap.group.scale.setScalar(0.6);
      newMap.group.rotation.set(0, 0, 0);
    }

    this.physicsMap = this.previousMap;
    this.physicsColliders = this.previousMap
      ? this.previousMap.getColliders()
      : [];
    this.baseFloorHeight =
      this.previousMap &&
      typeof this.previousMap.getBaseFloorHeight === "function"
        ? this.previousMap.getBaseFloorHeight()
        : 0;

    this.nextPhysicsColliders = newMap.getColliders();
    this.nextBaseFloorHeight =
      typeof newMap.getBaseFloorHeight === "function"
        ? newMap.getBaseFloorHeight()
        : 0;

    this.transitionState = {
      elapsed: 0,
      duration: 2.8,
      incoming: newMap,
      outgoing: this.previousMap,
    };

    if (this.interactiveMode) {
      this._forceCompleteTransition();
    }

    return true;
  }

  setPhaseByWave(waveNumber) {
    if (!waveNumber) return false;
    const index = Math.floor((waveNumber - 1) / 3);
    return this.setPhase(index);
  }

  applyPalette(palette) {
    if (!palette) return;

    if (this.ambientLight) {
      this.ambientLight.color.setHex(palette.ambient || 0x061414);
    }

    if (this.dirLight) {
      this.dirLight.color.setHex(palette.directional || 0xffffff);
    }

    if (this.accentLights && this.accentLights.length) {
      if (palette.accentA) this.accentLights[0].color.setHex(palette.accentA);
      if (palette.accentB) this.accentLights[1].color.setHex(palette.accentB);
    }

    if (this.skyDome && this.skyDome.material && palette.background) {
      this.skyDome.material.color.setHex(palette.background);
    }

    if (this.horizonRings) {
      this.horizonRings.forEach((ring, idx) => {
        const tone =
          idx % 2 === 0
            ? palette.accentA || 0x2ef8c9
            : palette.accentB || 0x7affff;
        ring.material.color.setHex(tone);
      });
    }

    if (this.starSprites && palette.accentA && palette.accentB) {
      this.starSprites.forEach((star, index) => {
        const color = index % 2 === 0 ? palette.accentA : palette.accentB;
        star.material.color.setHex(color);
      });
    }

    if (this.fog) {
      if (palette.fog) this.fog.color.setHex(palette.fog);
      if (typeof palette.fogDensity === "number")
        this.fog.density = palette.fogDensity;
    }
  }

  updateTransition(deltaTime) {
    if (!this.transitionState) return;

    const state = this.transitionState;
    state.elapsed += deltaTime;
    const t = Math.min(state.elapsed / state.duration, 1);
    const easeInOut = t * t * (3 - 2 * t);

    if (state.incoming && state.incoming.group) {
      const group = state.incoming.group;
      group.position.y = -90 + 90 * easeInOut;
      group.scale.setScalar(0.6 + 0.4 * easeInOut);
      group.rotation.y = (1 - easeInOut) * Math.PI * 0.25;
    }

    if (state.outgoing && state.outgoing.group) {
      const group = state.outgoing.group;
      group.position.y = easeInOut * 80;
      group.scale.setScalar(1 - 0.4 * easeInOut);
      group.rotation.y = easeInOut * Math.PI * 0.25;
    }

    if (t >= 1) {
      this._forceCompleteTransition();
    }
  }

  _forceCompleteTransition() {
    const state = this.transitionState;
    if (!state) {
      return;
    }

    if (state.incoming) {
      this.physicsMap = state.incoming;
      this.physicsColliders = this.nextPhysicsColliders || [];
      this.baseFloorHeight = this.nextBaseFloorHeight || 0;
      if (state.incoming.group) {
        state.incoming.group.position.set(0, 0, 0);
        state.incoming.group.scale.setScalar(1);
        state.incoming.group.rotation.set(0, 0, 0);
      }
    }

    if (state.outgoing) {
      state.outgoing.dispose();
    }

    this.nextPhysicsColliders = [];
    this.nextBaseFloorHeight = 0;
    this.previousMap = null;
    this.transitionState = null;
  }

  updateBackground(deltaTime) {
    if (this.skyDome) {
      this.skyDome.rotation.y += deltaTime * 0.01;
    }

    if (this.starSprites) {
      this.starSprites.forEach((star) => {
        star.material.opacity = Math.max(
          0.15,
          star.userData.baseOpacity +
            Math.sin(this.time * 2 + star.userData.offset) * 0.2
        );
      });
    }

    if (this.horizonRings) {
      this.horizonRings.forEach((ring, index) => {
        ring.rotation.z += deltaTime * (0.1 + index * 0.03);
        ring.material.opacity = 0.08 + Math.sin(this.time * 1.5 + index) * 0.04;
      });
    }
  }

  update(deltaTime, playerPosition) {
    const speedMultiplier = this.interactiveMode ? 1 : 0.35;
    const effectiveDelta = deltaTime * speedMultiplier;
    this.time += effectiveDelta;
    const playerPos = playerPosition || this._tempPlayerPos.set(0, 0, 0);

    this.updateBackground(effectiveDelta);
    this.updateTransition(effectiveDelta);

    if (this.previousMap && this.previousMap !== this.currentMap) {
      this.previousMap.update(
        effectiveDelta,
        this.time,
        playerPos,
        this.interactiveMode
      );
    }

    if (this.currentMap) {
      this.currentMap.update(
        effectiveDelta,
        this.time,
        playerPos,
        this.interactiveMode
      );
    }
  }

  getCurrentPhaseName() {
    return this.currentPhaseName;
  }

  resolvePlayerCollision(
    position,
    radius,
    playerHeight,
    previousPosition,
    previousGroundHeight,
    maxStepHeight
  ) {
    if (!position) {
      return this.getFloorHeightAt(0, 0);
    }

    const colliders = this.physicsColliders || [];
    const stepAllowance = typeof maxStepHeight === "number" ? maxStepHeight : 0;
    const prevPos = previousPosition || { x: position.x, z: position.z };
    const prevGround =
      typeof previousGroundHeight === "number"
        ? previousGroundHeight
        : this.baseFloorHeight || 0;
    const separation = 0.001;
    const tolerance = 0.05;

    if (!colliders.length) {
      return this.getFloorHeightAt(position.x, position.z);
    }

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      const expandedMinX = collider.minX - radius;
      const expandedMaxX = collider.maxX + radius;
      const expandedMinZ = collider.minZ - radius;
      const expandedMaxZ = collider.maxZ + radius;

      if (
        position.x < expandedMinX ||
        position.x > expandedMaxX ||
        position.z < expandedMinZ ||
        position.z > expandedMaxZ
      ) {
        continue;
      }

      const footY = position.y - playerHeight;
      const verticalDifference = collider.height - prevGround;

      if (footY >= collider.height - tolerance) {
        continue;
      }

      if (verticalDifference <= stepAllowance + tolerance) {
        continue;
      }

      const distLeft = position.x - expandedMinX;
      const distRight = expandedMaxX - position.x;
      const distBack = position.z - expandedMinZ;
      const distFront = expandedMaxZ - position.z;

      if (distLeft <= 0 || distRight <= 0 || distBack <= 0 || distFront <= 0) {
        continue;
      }

      const overlapX = Math.min(distLeft, distRight);
      const overlapZ = Math.min(distBack, distFront);
      const moveX = position.x - prevPos.x;
      const moveZ = position.z - prevPos.z;

      let pushAlongX;
      if (Math.abs(overlapX - overlapZ) < 0.0001) {
        pushAlongX = Math.abs(moveX) >= Math.abs(moveZ);
      } else {
        pushAlongX = overlapX < overlapZ;
      }

      if (pushAlongX) {
        if (distLeft < distRight) {
          position.x = expandedMinX - separation;
        } else {
          position.x = expandedMaxX + separation;
        }
      } else {
        if (distBack < distFront) {
          position.z = expandedMinZ - separation;
        } else {
          position.z = expandedMaxZ + separation;
        }
      }
    }

    return this.getFloorHeightAt(position.x, position.z);
  }

  getFloorHeightAt(x, z) {
    let height = this.baseFloorHeight || 0;
    if (this.physicsColliders && this.physicsColliders.length) {
      for (let i = 0; i < this.physicsColliders.length; i++) {
        const collider = this.physicsColliders[i];
        if (
          x >= collider.minX &&
          x <= collider.maxX &&
          z >= collider.minZ &&
          z <= collider.maxZ
        ) {
          if (collider.height > height) {
            height = collider.height;
          }
        }
      }
    }
    return height;
  }
}
