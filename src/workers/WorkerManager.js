/**
 * Worker Manager - Coordinates all game worker threads
 *
 * Manages:
 * - Enemy spawn worker (spawn calculations)
 * - Collision detection worker (collision checks)
 * - Physics worker (enemy/projectile physics)
 * - AI worker (pathfinding and decision making)
 *
 * Provides unified interface for worker communication
 * Handles worker lifecycle, fallbacks, and error recovery
 */

export default class WorkerManager {
  constructor() {
    this.workers = {
      spawn: null,
      collision: null,
      physics: null,
      ai: null,
    };

    this.enabled = {
      spawn: true,
      collision: true,
      physics: true, // NOW ENABLED
      ai: true, // NEW: AI worker
    };

    this.ready = {
      spawn: false,
      collision: false,
      physics: false,
      ai: false,
    };

    this.messageQueue = {
      spawn: [],
      collision: [],
      physics: [],
      ai: [],
    };

    this.callbacks = new Map();
    this.nextCallbackId = 0;

    this.metrics = {
      spawn: { messages: 0, errors: 0, avgResponseTime: 0 },
      collision: { messages: 0, errors: 0, avgResponseTime: 0 },
      physics: { messages: 0, errors: 0, avgResponseTime: 0 },
      ai: { messages: 0, errors: 0, avgResponseTime: 0 },
    };
  }

  /**
   * Initialize all workers
   */
  async init() {
    const promises = [];

    // Initialize spawn worker
    if (this.enabled.spawn) {
      promises.push(this._initSpawnWorker());
    }

    // Initialize collision worker
    if (this.enabled.collision) {
      promises.push(this._initCollisionWorker());
    }

    // Initialize physics worker
    if (this.enabled.physics) {
      promises.push(this._initPhysicsWorker());
    }

    // Initialize AI worker
    if (this.enabled.ai) {
      promises.push(this._initAIWorker());
    }

    try {
      await Promise.all(promises);
      console.log("✅ Worker Manager: All workers initialized");
      return true;
    } catch (error) {
      console.error("❌ Worker Manager: Initialization failed", error);
      return false;
    }
  }

  /**
   * Initialize enemy spawn worker
   */
  async _initSpawnWorker() {
    return new Promise((resolve, reject) => {
      try {
        this.workers.spawn = new Worker(
          new URL("./enemy-spawn-worker.js", import.meta.url),
          { type: "module" },
        );

        this.workers.spawn.onmessage = (event) => {
          this._handleSpawnMessage(event.data);
        };

        this.workers.spawn.onerror = (error) => {
          console.error("Spawn worker error:", error);
          this.metrics.spawn.errors++;
        };

        // Wait for ready signal
        const readyListener = (event) => {
          if (
            event.data.type === "READY" ||
            event.data.type === "INITIALIZED"
          ) {
            this.ready.spawn = true;
            this.workers.spawn.removeEventListener("message", readyListener);
            this.workers.spawn.postMessage({ type: "INIT" });
            resolve();
          }
        };

        this.workers.spawn.addEventListener("message", readyListener);

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.ready.spawn) {
            reject(new Error("Spawn worker init timeout"));
          }
        }, 5000);
      } catch (error) {
        console.warn("Failed to create spawn worker, using fallback:", error);
        this.enabled.spawn = false;
        resolve(); // Don't fail initialization
      }
    });
  }

  /**
   * Initialize collision detection worker
   */
  async _initCollisionWorker() {
    return new Promise((resolve, reject) => {
      try {
        this.workers.collision = new Worker(
          new URL("./collision-worker.js", import.meta.url),
          { type: "module" },
        );

        this.workers.collision.onmessage = (event) => {
          this._handleCollisionMessage(event.data);
        };

        this.workers.collision.onerror = (error) => {
          console.error("Collision worker error:", error);
          this.metrics.collision.errors++;
        };

        // Wait for ready signal
        const readyListener = (event) => {
          if (
            event.data.type === "READY" ||
            event.data.type === "INITIALIZED"
          ) {
            this.ready.collision = true;
            this.workers.collision.removeEventListener(
              "message",
              readyListener,
            );
            this.workers.collision.postMessage({ type: "INIT" });
            resolve();
          }
        };

        this.workers.collision.addEventListener("message", readyListener);

        setTimeout(() => {
          if (!this.ready.collision) {
            reject(new Error("Collision worker init timeout"));
          }
        }, 5000);
      } catch (error) {
        console.warn(
          "Failed to create collision worker, using fallback:",
          error,
        );
        this.enabled.collision = false;
        resolve();
      }
    });
  }

  // ==========================================
  // SPAWN WORKER METHODS
  // ==========================================

  /**
   * Queue enemy spawn
   */
  queueSpawn(type, position, difficulty, delay = 0) {
    if (!this.enabled.spawn || !this.ready.spawn) {
      return false;
    }

    this.workers.spawn.postMessage({
      type: "ADD_SPAWN",
      data: { type, position, difficulty, delay },
    });

    this.metrics.spawn.messages++;
    return true;
  }

  /**
   * Queue multiple spawns
   */
  queueSpawnBatch(spawns) {
    if (!this.enabled.spawn || !this.ready.spawn) {
      return false;
    }

    this.workers.spawn.postMessage({
      type: "ADD_BATCH",
      data: spawns,
    });

    this.metrics.spawn.messages++;
    return true;
  }

  /**
   * Generate and queue wave spawns
   */
  generateWave(waveNumber, difficulty) {
    if (!this.enabled.spawn || !this.ready.spawn) {
      return false;
    }

    this.workers.spawn.postMessage({
      type: "GENERATE_WAVE",
      waveNumber,
      difficulty,
    });

    this.metrics.spawn.messages++;
    return true;
  }

  /**
   * Update spawn worker (call each frame)
   */
  updateSpawns(deltaTime, playerPosition, callback) {
    if (!this.enabled.spawn || !this.ready.spawn) {
      callback([]);
      return;
    }

    const callbackId = this._registerCallback(callback);

    this.workers.spawn.postMessage({
      type: "UPDATE",
      deltaTime,
      playerPosition,
      callbackId,
    });

    this.metrics.spawn.messages++;
  }

  /**
   * Clear spawn queue
   */
  clearSpawnQueue() {
    if (this.enabled.spawn && this.ready.spawn) {
      this.workers.spawn.postMessage({ type: "CLEAR" });
    }
  }

  // ==========================================
  // COLLISION WORKER METHODS
  // ==========================================

  /**
   * Check collisions for frame
   */
  checkCollisions(frame, callback) {
    if (!this.enabled.collision || !this.ready.collision) {
      callback([]);
      return;
    }

    const callbackId = this._registerCallback(callback);
    const startTime = performance.now();

    this.workers.collision.postMessage({
      type: "CHECK_COLLISIONS",
      frame,
      frameId: Date.now(),
      callbackId,
      startTime,
    });

    this.metrics.collision.messages++;
  }

  // ==========================================
  // MESSAGE HANDLERS
  // ==========================================

  _handleSpawnMessage(data) {
    switch (data.type) {
      case "SPAWNS_READY":
        const callback = this.callbacks.get(data.callbackId);
        if (callback) {
          callback(data.spawns);
          this.callbacks.delete(data.callbackId);
        }
        break;

      case "WAVE_GENERATED":
        console.log(
          `Wave ${data.waveNumber} generated: ${data.spawnCount} enemies queued`,
        );
        break;

      case "SPAWN_RATE_OPTIMIZED":
        console.log(
          `Spawn rate optimized: ${data.maxSpawnsPerTick}/tick for ${data.targetFPS} FPS`,
        );
        break;
    }
  }

  _handleCollisionMessage(data) {
    switch (data.type) {
      case "COLLISIONS":
        const callback = this.callbacks.get(data.callbackId);
        if (callback) {
          callback(data.collisions);
          this.callbacks.delete(data.callbackId);

          // Update metrics
          if (data.startTime) {
            const responseTime = performance.now() - data.startTime;
            this._updateMetricAverage("collision", responseTime);
          }
        }
        break;
    }
  }

  /**
   * Initialize physics worker
   */
  async _initPhysicsWorker() {
    return new Promise((resolve, reject) => {
      try {
        this.workers.physics = new Worker(
          new URL("./physics-worker.js", import.meta.url),
          { type: "module" },
        );

        this.workers.physics.onmessage = (event) => {
          this._handlePhysicsMessage(event.data);
        };

        this.workers.physics.onerror = (error) => {
          console.error("Physics worker error:", error);
          this.metrics.physics.errors++;
        };

        const readyListener = (event) => {
          if (event.data.type === "READY") {
            this.ready.physics = true;
            this.workers.physics.removeEventListener("message", readyListener);
            resolve();
          }
        };

        this.workers.physics.addEventListener("message", readyListener);

        setTimeout(() => {
          if (!this.ready.physics) {
            reject(new Error("Physics worker init timeout"));
          }
        }, 5000);
      } catch (error) {
        console.warn("Failed to create physics worker, using fallback:", error);
        this.enabled.physics = false;
        resolve();
      }
    });
  }

  /**
   * Initialize AI worker
   */
  async _initAIWorker() {
    return new Promise((resolve, reject) => {
      try {
        this.workers.ai = new Worker(
          new URL("./ai-worker.js", import.meta.url),
          { type: "module" },
        );

        this.workers.ai.onmessage = (event) => {
          this._handleAIMessage(event.data);
        };

        this.workers.ai.onerror = (error) => {
          console.error("AI worker error:", error);
          this.metrics.ai.errors++;
        };

        const readyListener = (event) => {
          if (event.data.type === "READY") {
            this.ready.ai = true;
            this.workers.ai.removeEventListener("message", readyListener);
            resolve();
          }
        };

        this.workers.ai.addEventListener("message", readyListener);

        setTimeout(() => {
          if (!this.ready.ai) {
            reject(new Error("AI worker init timeout"));
          }
        }, 5000);
      } catch (error) {
        console.warn("Failed to create AI worker, using fallback:", error);
        this.enabled.ai = false;
        resolve();
      }
    });
  }

  // ==========================================
  // PHYSICS WORKER METHODS
  // ==========================================

  /**
   * Update physics simulation
   */
  updatePhysics(deltaTime, callback) {
    if (!this.enabled.physics || !this.ready.physics) {
      callback([]);
      return;
    }

    const callbackId = this._registerCallback(callback);

    this.workers.physics.postMessage({
      type: "STEP",
      deltaTime,
      callbackId,
    });

    this.metrics.physics.messages++;
  }

  /**
   * Create physics body in worker
   */
  createPhysicsBody(id, type, mass, position, velocity, collisionRadius) {
    if (!this.enabled.physics || !this.ready.physics) return false;

    this.workers.physics.postMessage({
      type: "CREATE_BODY",
      data: {
        id,
        type,
        mass,
        position,
        velocity,
        collisionRadius,
      },
    });

    return true;
  }

  // ==========================================
  // AI WORKER METHODS
  // ==========================================

  /**
   * Get AI decisions for enemies
   */
  getAIDecisions(enemies, playerPosition, projectiles, callback) {
    if (!this.enabled.ai || !this.ready.ai) {
      callback({});
      return;
    }

    const callbackId = this._registerCallback(callback);

    this.workers.ai.postMessage({
      type: "GET_DECISIONS",
      data: {
        enemies,
        playerPosition,
        projectiles,
        callbackId,
      },
    });

    this.metrics.ai.messages++;
  }

  /**
   * Update enemy positions in AI worker
   */
  updateEnemyPositions(enemies) {
    if (!this.enabled.ai || !this.ready.ai) return;

    this.workers.ai.postMessage({
      type: "UPDATE_ENEMIES",
      data: enemies,
    });
  }

  _handlePhysicsMessage(data) {
    switch (data.type) {
      case "PHYSICS_UPDATE":
        const physicsCallback = this.callbacks.get(data.callbackId);
        if (physicsCallback) {
          physicsCallback(data.bodyStates, data.collisions);
          this.callbacks.delete(data.callbackId);
        }
        break;
    }
  }

  _handleAIMessage(data) {
    switch (data.type) {
      case "AI_DECISIONS":
        const aiCallback = this.callbacks.get(data.callbackId);
        if (aiCallback) {
          aiCallback(data.decisions);
          this.callbacks.delete(data.callbackId);
        }
        break;
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  _registerCallback(callback) {
    const id = this.nextCallbackId++;
    this.callbacks.set(id, callback);
    return id;
  }

  _updateMetricAverage(workerType, newValue) {
    const metric = this.metrics[workerType];
    const count = metric.messages;
    metric.avgResponseTime =
      (metric.avgResponseTime * (count - 1) + newValue) / count;
  }

  /**
   * Get worker status and metrics
   */
  getStatus() {
    return {
      enabled: this.enabled,
      ready: this.ready,
      metrics: this.metrics,
      activeCallbacks: this.callbacks.size,
    };
  }

  /**
   * Cleanup workers
   */
  destroy() {
    Object.values(this.workers).forEach((worker) => {
      if (worker) {
        worker.terminate();
      }
    });

    this.workers = { spawn: null, collision: null, physics: null, ai: null };
    this.ready = { spawn: false, collision: false, physics: false, ai: false };
    this.callbacks.clear();
  }
}
