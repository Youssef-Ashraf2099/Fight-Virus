import * as THREE from "three";
import { profiler } from "../utils/PerformanceProfiler.js";
import CPUEnvironment from "./maps/CPUEnvironment.js";
import KernelEnvironment from "./maps/KernelEnvironment.js";
import MemoryEnvironment from "./maps/MemoryEnvironment.js";
import GPUEnvironment from "./maps/GPUEnvironment.js";
import MotherboardEnvironment from "./maps/MotherboardEnvironment.js";
import HardDriveEnvironment from "./maps/HardDriveEnvironment.js";
import FirewallEnvironment from "./maps/FirewallEnvironment.js";
import RetroTerminalEnvironment from "./maps/RetroTerminalEnvironment.js";
import NetworkHubEnvironment from "./maps/NetworkHubEnvironment.js";
import AINeuralNetworkEnvironment from "./maps/AINeuralNetworkEnvironment.js";

export default class Environment {
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
    this.mapCache = new Map();
    this._preloadQueue = [];
    this._preloadTimer = null;
    this._idlePreloadHandle = null;
    this._pendingBuildTimeout = null;

    this.workerManager = null;
    this.sectorConfig = {
      sectorSize: 40,
      activationRadius: 1, // how many sectors around player stay visible
    };

    // OPTIMIZATION: Track preload completion to prevent gameplay during builds
    this.preloadComplete = false;
    this.preloadCallbacks = [];
    this.criticalMapsLoaded = 0;
    this.criticalMapCount = 10; // ALL maps - cache everything before gameplay
    this.gameplayStarted = false; // Track if we're in gameplay or preload phase

    this.sectorState = {
      mapKey: null,
      sectorMap: null,
      sectorSize: this.sectorConfig.sectorSize,
      childCount: 0,
      childVisibility: [],
      enabled: false,
      lastCenterKey: null,
    };

    this.phaseConfigs = [
      { key: "cpu", factory: () => new CPUEnvironment(this) },
      { key: "kernel", factory: () => new KernelEnvironment(this) },
      { key: "memory", factory: () => new MemoryEnvironment(this) },
      { key: "gpu", factory: () => new GPUEnvironment(this) },
      { key: "motherboard", factory: () => new MotherboardEnvironment(this) },
      { key: "harddrive", factory: () => new HardDriveEnvironment(this) },
      { key: "firewall", factory: () => new FirewallEnvironment(this) },
      { key: "terminal", factory: () => new RetroTerminalEnvironment(this) },
      { key: "network", factory: () => new NetworkHubEnvironment(this) },
      { key: "ai-core", factory: () => new AINeuralNetworkEnvironment(this) },
    ];

    this.setPhase(0);

    // CRITICAL FIX: Count initial map (CPU) as loaded
    this.criticalMapsLoaded = 1; // CPU is phase 0, already loaded
    console.log("   📊 Initial map (CPU) counted: 1/10 maps loaded");

    this._preparePreloadQueue();
  }

  setWorkerManager(workerManager) {
    this.workerManager = workerManager;
  }

  createLightingRig() {
    const ambient = new THREE.AmbientLight(0x061414, 0.5);
    this.ambientLight = ambient;
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x1cff9b, 0.9);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    // Tighter, cheaper shadow frustum for combat bubble
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 180;
    // Lower shadow map size for perf; still acceptable quality on desktop
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
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
        radius * Math.cos(phi),
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

  setPhase(index, forceReload = false) {
    const clamped = Math.max(0, Math.min(this.phaseConfigs.length - 1, index));

    if (this.transitionState) {
      this._forceCompleteTransition();
    }

    console.log(
      `🔄 Environment.setPhase called with index: ${index}, clamped: ${clamped}`,
    );
    console.log(`   Current phase index: ${this.phaseIndex}`);

    if (!forceReload && clamped === this.phaseIndex && this.currentMap) {
      const phase = this.gameplayStarted ? "GAMEPLAY" : "STARTUP";
      console.log(
        `   ✅ Phase unchanged (${phase}); skipping rebuild - using existing map`,
      );
      return false;
    }

    const config = this.phaseConfigs[clamped];
    console.log(`   Config key: ${config.key}`);

    const prevMap = this.currentMap;

    let cachedEntry = this.mapCache.get(config.key);
    const prevMapWasCached = cachedEntry && cachedEntry.map === prevMap;

    if (forceReload && cachedEntry) {
      console.log("   Force reloading map; disposing cached instance");
      this._disposeMap(cachedEntry.map);
      this.mapCache.delete(config.key);
      cachedEntry = null;
    }

    let newMap = cachedEntry ? cachedEntry.map : null;

    if (!newMap) {
      try {
        newMap = config.factory();
        console.log(
          `   ✅ Factory created map: ${newMap.constructor.name}, displayName: ${newMap.displayName}`,
        );
      } catch (error) {
        console.error(`   ❌ Error creating environment:`, error);
        return false;
      }

      console.log(`   ⚠️ CACHE MISS - Building map during gameplay...`);
      if (this.gameplayStarted) {
        console.error(
          "   🚨🚨🚨 CRITICAL: MAP BUILD DURING GAMEPLAY! THIS SHOULD NEVER HAPPEN! 🚨🚨🚨",
        );
        console.error("   🔍 CACHE MISS STACK TRACE:", new Error().stack);
      }
      console.log(
        `   🔍 Cache state: ${this.mapCache.size} maps cached, looking for key: ${config.key}`,
      );

      // Use different profiler operations for preload vs gameplay
      const profilerOp = this.gameplayStarted
        ? "env-build-GAMEPLAY"
        : "env-preload";
      if (profiler?.startOperation) profiler.startOperation(profilerOp);
      newMap.build(this.mapGroup);
      if (profiler?.endOperation) profiler.endOperation(profilerOp);
      console.log(`   ✅ Map built successfully`);
      this.mapCache.set(config.key, { map: newMap });
    } else {
      const phase = this.gameplayStarted ? "GAMEPLAY" : "PRELOAD";
      console.log(`   ✅ CACHE HIT (${phase}) - Reusing cached map instance`);
      if (typeof newMap.onEnter === "function") {
        newMap.onEnter();
      }
    }

    if (prevMap && prevMap !== newMap) {
      console.log(`   Deactivating previous map: ${prevMap.displayName}`);
      if (!prevMapWasCached && typeof prevMap.onExit === "function") {
        prevMap.onExit();
      }
      if (prevMap.group) {
        prevMap.group.visible = false;
      }
    }

    if (newMap.group) {
      newMap.group.visible = true;
      newMap.group.position.set(0, 0, 0);
      newMap.group.scale.setScalar(1);
      newMap.group.rotation.set(0, 0, 0);
    }

    const palette = newMap.getPalette();

    this.currentMap = newMap;
    this.currentEnvironment = newMap;
    this.phaseIndex = clamped;
    this.currentPhaseName = newMap.displayName;
    this.applyPalette(palette);

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
    this._preparePreloadQueue();

    this._prepareSectorVisibility(config.key);

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

  _disposeMap(map) {
    if (!map) {
      return;
    }

    try {
      if (typeof map.dispose === "function") {
        map.dispose();
      } else if (map.group && this.mapGroup) {
        this.mapGroup.remove(map.group);
      }
    } catch (error) {
      console.warn("Error disposing map", error);
    }
  }

  _preparePreloadQueue() {
    this._clearPreloadTimers();
    this._preloadQueue = [];

    // CRITICAL FIX: Cache ALL maps, not just first 3
    const criticalKeys = [
      "cpu",
      "kernel",
      "memory",
      "gpu",
      "motherboard",
      "harddrive",
      "firewall",
      "terminal",
      "network",
      "ai-core",
    ];
    let criticalAlreadyCached = 0;

    for (let i = 0; i < this.phaseConfigs.length; i++) {
      if (i === this.phaseIndex) {
        continue;
      }
      const config = this.phaseConfigs[i];
      if (!config) continue;

      // Check if critical map is already cached
      if (criticalKeys.includes(config.key) && this.mapCache.has(config.key)) {
        criticalAlreadyCached++;
      }

      if (this.mapCache.has(config.key)) {
        continue;
      }
      this._preloadQueue.push({ index: i, config });
    }

    // CRITICAL FIX: If critical maps already cached, mark as complete
    if (
      this.criticalMapsLoaded + criticalAlreadyCached >=
      this.criticalMapCount
    ) {
      this.preloadComplete = true;
      console.log(
        "   🎉 All critical maps already loaded - game can start immediately!",
      );
      this.preloadCallbacks.forEach((cb) => cb());
      this.preloadCallbacks = [];
    }

    if (this._preloadQueue.length) {
      // OPTIMIZATION: Start preloading immediately (was 300ms delay)
      this._scheduleNextPreload(10);
    }
  }

  _scheduleNextPreload(delay = 50) {
    if (!this._preloadQueue.length) {
      this._clearPreloadTimers();
      return;
    }

    this._clearPreloadTimers();
    this._preloadTimer = setTimeout(
      () => {
        this._preloadTimer = null;
        this._preloadNextMap();
      },
      Math.max(0, delay),
    );
  }

  _preloadNextMap() {
    if (!this._preloadQueue.length) {
      return;
    }

    const { config } = this._preloadQueue.shift();
    if (!config) {
      this._scheduleNextPreload();
      return;
    }

    if (this.mapCache.has(config.key)) {
      this._scheduleNextPreload();
      return;
    }

    const buildMap = () => {
      try {
        const map = config.factory();
        console.log(`   ⚙️ Preloading ${config.key}...`);
        if (profiler?.startOperation) profiler.startOperation("env-preload");
        map.build(this.mapGroup);
        if (profiler?.endOperation) profiler.endOperation("env-preload");
        if (map.group) {
          map.group.visible = false;
        }
        if (typeof map.onExit === "function") {
          map.onExit();
        }
        this.mapCache.set(config.key, { map });
        console.log(`   ✅ Preloaded environment: ${config.key}`);

        // OPTIMIZATION: Track critical map preloads (first 3 waves)
        const criticalKeys = [
          "cpu",
          "kernel",
          "memory",
          "gpu",
          "motherboard",
          "harddrive",
          "firewall",
          "terminal",
          "network",
          "ai-core",
        ];
        if (criticalKeys.includes(config.key)) {
          this.criticalMapsLoaded++;
          console.log(
            `   📊 Maps loaded: ${this.criticalMapsLoaded}/${this.criticalMapCount}`,
          );

          if (this.criticalMapsLoaded >= this.criticalMapCount) {
            this.preloadComplete = true;
            this.gameplayStarted = true; // Mark gameplay phase
            console.log("   🎉 ALL MAPS PRELOADED - Game can start!");
            this.preloadCallbacks.forEach((cb) => cb());
            this.preloadCallbacks = [];
          }
        }
      } catch (error) {
        console.warn(
          `   ⚠️ Failed to preload environment ${config.key}:`,
          error,
        );
      } finally {
        this._idlePreloadHandle = null;
        // OPTIMIZATION: Faster preloading (was 160ms between maps)
        this._scheduleNextPreload(50);
      }
    };

    // OPTIMIZATION: Skip requestIdleCallback - preload aggressively instead
    // This runs during main menu before gameplay starts
    this._pendingBuildTimeout = setTimeout(() => {
      this._pendingBuildTimeout = null;
      buildMap();
    }, 0);
  }

  _clearPreloadTimers() {
    if (this._preloadTimer) {
      clearTimeout(this._preloadTimer);
      this._preloadTimer = null;
    }
    if (
      this._idlePreloadHandle &&
      typeof window !== "undefined" &&
      typeof window.cancelIdleCallback === "function"
    ) {
      window.cancelIdleCallback(this._idlePreloadHandle);
      this._idlePreloadHandle = null;
    }
    if (this._pendingBuildTimeout) {
      clearTimeout(this._pendingBuildTimeout);
      this._pendingBuildTimeout = null;
    }
  }

  // OPTIMIZATION: Wait for critical maps to preload before gameplay
  // OPTIMIZATION: Wait for critical maps to preload before gameplay
  // Now supports a 'force' mode to block until done
  waitForCriticalMaps(callback) {
    if (this.preloadComplete) {
      callback();
      return;
    }
    
    console.log("⏳ Waiting for critical maps to preload... Forcing synchronous build.");
    
    // Force build remaining maps immediately to prevent gameplay stutter
    while(this._preloadQueue.length > 0) {
        const { config } = this._preloadQueue.shift();
        if (!this.mapCache.has(config.key)) {
             try {
                const map = config.factory();
                // console.log(`   ⚙️ Force-Preloading ${config.key}...`);
                if (profiler?.startOperation) profiler.startOperation("env-preload-force");
                map.build(this.mapGroup);
                if (profiler?.endOperation) profiler.endOperation("env-preload-force");
                
                if (map.group) map.group.visible = false;
                if (typeof map.onExit === "function") map.onExit();
                
                this.mapCache.set(config.key, { map });
                this.criticalMapsLoaded++;
             } catch(e) {
                 console.error(`Failed to force build ${config.key}`, e);
             }
        }
    }
    
    this.preloadComplete = true;
    this.gameplayStarted = true;
    console.log("   🎉 Forced Preload Complete.");
    callback();
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
            Math.sin(this.time * 2 + star.userData.offset) * 0.2,
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

    if (this.currentMap && this.sectorState.enabled) {
      this._applySectorCulling(playerPos);
    }

    if (this.previousMap && this.previousMap !== this.currentMap) {
      this.previousMap.update(
        effectiveDelta,
        this.time,
        playerPos,
        this.interactiveMode,
      );
    }

    if (this.currentMap) {
      this.currentMap.update(
        effectiveDelta,
        this.time,
        playerPos,
        this.interactiveMode,
      );
    }
  }

  _prepareSectorVisibility(mapKey) {
    this.sectorState = {
      mapKey,
      sectorMap: null,
      sectorSize: this.sectorConfig.sectorSize,
      childCount: this.currentMap?.group?.children?.length || 0,
      childVisibility: [],
      enabled: false,
      lastCenterKey: null,
    };

    if (!this.currentMap || !this.currentMap.group || !this.workerManager) {
      if (!this._sectorFallbackLogged) {
        console.warn(
          "⚠️ Sector visibility prep skipped: no worker manager or map group",
        );
        this._sectorFallbackLogged = true;
      }
      return;
    }

    const boxes = this._collectChildBoxes(this.currentMap.group.children);
    if (!boxes.length) return;

    this.workerManager
      .queueEnvironmentSectorization(boxes, this.sectorConfig.sectorSize)
      .then((result) => {
        if (!result || !result.sectors) return;
        this.sectorState.sectorMap = result.sectors;
        this.sectorState.sectorSize = result.sectorSize;
        this.sectorState.enabled = true;
        this.sectorState.childVisibility = new Array(
          this.sectorState.childCount,
        ).fill(true);
      })
      .catch((err) => {
        console.warn("Sector binning failed, disabling culling", err);
      });
  }

  _collectChildBoxes(children) {
    const boxes = [];
    const tempBox = new THREE.Box3();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      try {
        child.updateWorldMatrix?.(true, true);
        tempBox.setFromObject(child);
        if (!isFinite(tempBox.min.x) || tempBox.isEmpty()) continue;
        boxes.push({
          id: i,
          min: [tempBox.min.x, tempBox.min.y, tempBox.min.z],
          max: [tempBox.max.x, tempBox.max.y, tempBox.max.z],
        });
      } catch (err) {
        // Skip invalid child
      }
    }
    return boxes;
  }

  _applySectorCulling(playerPos) {
    const state = this.sectorState;
    const sectors = state.sectorMap;
    if (!sectors) return;

    const size = state.sectorSize || this.sectorConfig.sectorSize;
    const cx = Math.floor(playerPos.x / size);
    const cz = Math.floor(playerPos.z / size);
    const centerKey = `${cx},${cz}`;

    // OPTIMIZATION: Skip if player hasn't moved to a different sector
    if (state.lastCenterKey === centerKey) return;
    state.lastCenterKey = centerKey;

    const radius = this.sectorConfig.activationRadius;
    const visibleIndices = new Set();
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const key = `${x},${z}`;
        const ids = sectors[key];
        if (ids) {
          ids.forEach((id) => visibleIndices.add(id));
        }
      }
    }

    const children = this.currentMap?.group?.children || [];
    let updateCount = 0;
    for (let i = 0; i < children.length; i++) {
      const shouldShow = visibleIndices.size === 0 || visibleIndices.has(i);
      if (state.childVisibility[i] === shouldShow) continue;
      state.childVisibility[i] = shouldShow;
      children[i].visible = shouldShow;
      updateCount++;
    }
    // Only log if significant changes (debugging)
    if (
      updateCount > 50 &&
      typeof window !== "undefined" &&
      window.location?.hostname === "localhost"
    ) {
      console.log(`Sector culling updated ${updateCount} objects`);
    }
  }

  getCurrentPhaseName() {
    return this.currentPhaseName;
  }

  getCurrentMapBoundaries() {
    if (
      this.physicsMap &&
      typeof this.physicsMap.getMapBoundaries === "function"
    ) {
      return this.physicsMap.getMapBoundaries();
    }
    // Default boundaries if map doesn't specify
    return {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    };
  }

  resolvePlayerCollision(
    position,
    radius,
    playerHeight,
    previousPosition,
    previousGroundHeight,
    maxStepHeight,
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

  isProjectilePathObstructed(start, end, radius = 0.25, heightPadding = 0) {
    if (!start || !end) {
      return false;
    }

    const colliders = this.physicsColliders || [];
    if (!colliders.length) {
      return false;
    }

    const startY = start.y ?? 0;
    const endY = end.y ?? 0;
    const startX = start.x ?? 0;
    const startZ = start.z ?? 0;
    const endX = end.x ?? 0;
    const endZ = end.z ?? 0;

    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i];
      if (!collider || typeof collider.height !== "number") {
        continue;
      }

      if (collider.height <= 0) {
        continue;
      }

      const maxRelevantHeight = collider.height + heightPadding;
      if (Math.min(startY, endY) > maxRelevantHeight) {
        continue;
      }

      const minX = (collider.minX ?? 0) - radius;
      const maxX = (collider.maxX ?? 0) + radius;
      const minZ = (collider.minZ ?? 0) - radius;
      const maxZ = (collider.maxZ ?? 0) + radius;

      if (
        this._segmentIntersectsRect2D(
          startX,
          startZ,
          endX,
          endZ,
          minX,
          maxX,
          minZ,
          maxZ,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  _segmentIntersectsRect2D(x1, z1, x2, z2, minX, maxX, minZ, maxZ) {
    const startInside = x1 >= minX && x1 <= maxX && z1 >= minZ && z1 <= maxZ;
    const endInside = x2 >= minX && x2 <= maxX && z2 >= minZ && z2 <= maxZ;

    if (startInside || endInside) {
      return true;
    }

    const dx = x2 - x1;
    const dz = z2 - z1;

    const epsilon = 1e-8;
    if (Math.abs(dx) < epsilon && Math.abs(dz) < epsilon) {
      return false;
    }

    let tMin = 0;
    let tMax = 1;

    const tests = [
      { p: -dx, q: x1 - minX },
      { p: dx, q: maxX - x1 },
      { p: -dz, q: z1 - minZ },
      { p: dz, q: maxZ - z1 },
    ];

    for (let i = 0; i < tests.length; i++) {
      const { p, q } = tests[i];
      if (Math.abs(p) < epsilon) {
        if (q < 0) {
          return false;
        }
        continue;
      }

      const t = q / p;
      if (p < 0) {
        if (t > tMax) {
          return false;
        }
        if (t > tMin) {
          tMin = t;
        }
      } else {
        if (t < tMin) {
          return false;
        }
        if (t < tMax) {
          tMax = t;
        }
      }
    }

    return tMin <= tMax && tMax >= 0 && tMin <= 1;
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
