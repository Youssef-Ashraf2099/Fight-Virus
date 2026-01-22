/**
 * Worker Thread Manager
 * Manages the communication between main thread and physics/AI worker thread
 * Handles SharedArrayBuffer allocation and synchronization
 */

import { Worker } from "worker_threads";
import path from "path";

/**
 * WorkerThreadManager
 * Offloads physics and AI calculations to background thread
 * Uses SharedArrayBuffer for zero-copy data passing
 */
export class WorkerThreadManager {
  constructor(options = {}) {
    this.options = {
      maxEntities: 500,
      workerScript: options.workerScript || "./game-physics-worker.js",
      ...options,
    };

    this.worker = null;
    this.sharedBuffer = null;
    this.sharedState = null;
    this.initialized = false;
    this.updateCount = 0;
    this.lastUpdateTime = Date.now();
    this.updateFrequency = 60; // Updates per second
    this.frameTime = 0;
  }

  /**
   * Initialize worker thread and shared memory
   * @returns {Promise<void>}
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Allocate SharedArrayBuffer for zero-latency communication
        // Layout: Each entity gets ENTITY_SIZE floats
        // [x, y, vx, vy, ax, ay, type, health, active]
        const ENTITY_SIZE = 9;
        const bufferSize =
          this.options.maxEntities *
          ENTITY_SIZE *
          Float32Array.BYTES_PER_ELEMENT;

        this.sharedBuffer = new SharedArrayBuffer(bufferSize);
        this.sharedState = new Float32Array(this.sharedBuffer);

        // Initialize shared state to zero
        this.sharedState.fill(0);

        // Spawn worker thread
        const workerPath = path.resolve(
          process.cwd(),
          this.options.workerScript,
        );
        this.worker = new Worker(workerPath, {
          workerData: {
            sharedBuffer: this.sharedBuffer,
          },
        });

        // Handle worker errors
        this.worker.on("error", (error) => {
          console.error("[WORKER ERROR]", error);
          reject(error);
        });

        // Handle worker exit
        this.worker.on("exit", (code) => {
          if (code !== 0) {
            console.error(`[WORKER] Worker thread exited with code ${code}`);
          }
        });

        // Wait for worker to be ready
        const messageHandler = (message) => {
          if (message.type === "READY") {
            // Send initialization message
            this.worker.postMessage({
              type: "INIT",
              sharedBuffer: this.sharedBuffer,
            });
          } else if (message.type === "INITIALIZED") {
            this.worker.off("message", messageHandler);
            this.setupMessageHandlers();
            this.initialized = true;
            console.log("[WORKER] Physics/AI worker initialized successfully");
            resolve();
          }
        };

        this.worker.on("message", messageHandler);
      } catch (error) {
        console.error("[WORKER] Initialization failed:", error);
        reject(error);
      }
    });
  }

  /**
   * Setup message handlers for worker updates
   */
  setupMessageHandlers() {
    this.worker.on("message", (message) => {
      switch (message.type) {
        case "UPDATED":
          this.updateCount++;
          this.frameTime = Date.now() - message.timestamp;
          break;

        case "PERFORMANCE":
          // Worker sent performance metrics
          if (this.onPerformanceUpdate) {
            this.onPerformanceUpdate(message);
          }
          break;

        default:
          console.warn("[WORKER] Unknown message:", message.type);
      }
    });
  }

  /**
   * Send update request to worker thread
   * @param {number} playerX - Player X position
   * @param {number} playerY - Player Y position
   * @param {number} timestamp - Frame timestamp
   */
  updatePhysicsAndAI(playerX, playerY, timestamp = Date.now()) {
    if (!this.initialized) return;

    this.worker.postMessage({
      type: "UPDATE",
      playerX,
      playerY,
      timestamp,
    });
  }

  /**
   * Set entity state from main thread
   * @param {number} entityId - Entity index
   * @param {Object} state - Entity state {x, y, vx, vy, ...}
   */
  setEntity(entityId, state) {
    if (!this.initialized) return;

    this.worker.postMessage({
      type: "SET_ENTITY",
      entityId,
      state,
    });
  }

  /**
   * Get entity state from shared memory
   * @param {number} entityId - Entity index
   * @returns {Object} Entity state
   */
  getEntity(entityId) {
    if (!this.sharedState) return null;

    const ENTITY_SIZE = 9;
    const baseIndex = entityId * ENTITY_SIZE;

    return {
      x: this.sharedState[baseIndex],
      y: this.sharedState[baseIndex + 1],
      vx: this.sharedState[baseIndex + 2],
      vy: this.sharedState[baseIndex + 3],
      ax: this.sharedState[baseIndex + 4],
      ay: this.sharedState[baseIndex + 5],
      type: this.sharedState[baseIndex + 6],
      health: this.sharedState[baseIndex + 7],
      active: this.sharedState[baseIndex + 8],
    };
  }

  /**
   * Get all active entities from shared memory
   * @returns {Array<Object>} Array of active entities
   */
  getAllEntities() {
    if (!this.sharedState) return [];

    const entities = [];
    const ENTITY_SIZE = 9;

    for (let i = 0; i < this.options.maxEntities; i++) {
      const baseIndex = i * ENTITY_SIZE;
      const active = this.sharedState[baseIndex + 8];

      if (active) {
        entities.push({
          id: i,
          x: this.sharedState[baseIndex],
          y: this.sharedState[baseIndex + 1],
          vx: this.sharedState[baseIndex + 2],
          vy: this.sharedState[baseIndex + 3],
          ax: this.sharedState[baseIndex + 4],
          ay: this.sharedState[baseIndex + 5],
          type: this.sharedState[baseIndex + 6],
          health: this.sharedState[baseIndex + 7],
        });
      }
    }

    return entities;
  }

  /**
   * Batch set entities from shared memory
   * @param {Array} entities - Array of {id, x, y, vx, vy, ...}
   */
  batchSetEntities(entities) {
    if (!this.sharedState) return;

    const ENTITY_SIZE = 9;

    for (const entity of entities) {
      const baseIndex = entity.id * ENTITY_SIZE;
      if (entity.x !== undefined) this.sharedState[baseIndex] = entity.x;
      if (entity.y !== undefined) this.sharedState[baseIndex + 1] = entity.y;
      if (entity.vx !== undefined) this.sharedState[baseIndex + 2] = entity.vx;
      if (entity.vy !== undefined) this.sharedState[baseIndex + 3] = entity.vy;
      if (entity.ax !== undefined) this.sharedState[baseIndex + 4] = entity.ax;
      if (entity.ay !== undefined) this.sharedState[baseIndex + 5] = entity.ay;
      if (entity.type !== undefined)
        this.sharedState[baseIndex + 6] = entity.type;
      if (entity.health !== undefined)
        this.sharedState[baseIndex + 7] = entity.health;
      if (entity.active !== undefined)
        this.sharedState[baseIndex + 8] = entity.active;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      updateCount: this.updateCount,
      frameTime: this.frameTime,
      lastUpdateTime: this.lastUpdateTime,
      updateFrequency: this.updateFrequency,
    };
  }

  /**
   * Request performance data from worker
   */
  requestPerformanceData() {
    if (!this.initialized) return;
    this.worker.postMessage({ type: "GET_PERFORMANCE" });
  }

  /**
   * Terminate worker thread
   * Call this when game is shutting down
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      console.log("[WORKER] Physics/AI worker terminated");
    }
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      running: this.worker !== null,
      maxEntities: this.options.maxEntities,
      sharedMemorySizeMB: this.sharedBuffer
        ? this.sharedBuffer.byteLength / 1024 / 1024
        : 0,
      updateCount: this.updateCount,
      frameTime: this.frameTime,
    };
  }
}

export default WorkerThreadManager;
