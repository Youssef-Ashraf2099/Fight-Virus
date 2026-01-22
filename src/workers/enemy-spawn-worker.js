/**
 * Enemy Spawn/Respawn Worker Thread
 * Handles enemy spawning calculations off the main thread
 *
 * This worker manages:
 * - Spawn queue processing
 * - Spawn timing and delays
 * - Safe spawn position calculations
 * - Enemy type selection based on wave/difficulty
 * - Batch spawn requests for waves
 *
 * Benefits:
 * - Offloads heavy spawn calculations from main thread
 * - Prevents frame drops during large enemy waves
 * - Enables predictive spawn scheduling
 * - Reduces GC pressure on main thread
 */

// Worker runs in browser context, not Node
const isNode =
  typeof process !== "undefined" && process.versions && process.versions.node;

// ==========================================
// SPAWN QUEUE MANAGER
// ==========================================

class SpawnQueueManager {
  constructor() {
    this.queue = [];
    this.maxSpawnsPerTick = 5;
    this.safeSpawnDistance = 18;
    this.spawnRadius = 40;
    this.nextSpawnId = 0;
  }

  /**
   * Add spawn request to queue
   * @param {Object} request - {type, position, difficulty, delay}
   */
  addSpawn(request) {
    this.queue.push({
      id: this.nextSpawnId++,
      type: request.type,
      position: request.position || { x: 0, y: 0, z: 0 },
      difficulty: request.difficulty || 1,
      delay: request.delay || 0,
      timestamp: Date.now(),
    });
  }

  /**
   * Add multiple spawns (wave spawning)
   * @param {Array} requests - Array of spawn requests
   */
  addBatch(requests) {
    requests.forEach((request) => this.addSpawn(request));
  }

  /**
   * Generate wave spawn requests
   * @param {number} waveNumber - Current wave number
   * @param {number} difficulty - Wave difficulty
   * @returns {Array} Spawn requests
   */
  generateWaveSpawns(waveNumber, difficulty) {
    const count = Math.floor(5 + waveNumber * 2);
    const spawnDelayStep = 0.2;
    const spawns = [];

    // Enemy type progression
    const allowedTypes = this._getEnemyTypesForWave(waveNumber);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnRadius = this.spawnRadius + Math.random() * 10;

      const position = {
        x: Math.cos(angle) * spawnRadius,
        y: 0,
        z: Math.sin(angle) * spawnRadius,
      };

      const randomType =
        allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

      spawns.push({
        type: randomType,
        position,
        difficulty,
        delay: i * spawnDelayStep,
      });
    }

    return spawns;
  }

  /**
   * Get enemy types unlocked for wave
   */
  _getEnemyTypesForWave(waveNumber) {
    const types = ["trojan", "worm", "adware"];

    if (waveNumber >= 2) types.push("drone");
    if (waveNumber >= 3) types.push("spyware", "blaster");
    if (waveNumber >= 4) types.push("shield");
    if (waveNumber >= 5) types.push("ransomware");
    if (waveNumber >= 7) types.push("rootkit");

    return types;
  }

  /**
   * Process spawn queue and return ready spawns
   * @param {number} deltaTime - Time since last update
   * @param {Object} playerPosition - {x, y, z}
   * @returns {Array} Ready spawn requests
   */
  processQueue(deltaTime, playerPosition) {
    if (this.queue.length === 0) return [];

    // Update delays
    this.queue.forEach((request) => {
      request.delay = Math.max(0, request.delay - deltaTime);
    });

    // Get ready spawns (up to max per tick)
    const readySpawns = [];
    let processed = 0;

    for (
      let i = 0;
      i < this.queue.length && processed < this.maxSpawnsPerTick;
    ) {
      const request = this.queue[i];

      if (request.delay > 0) {
        i++;
        continue;
      }

      // Adjust spawn position for player safety
      const adjustedPosition = this._ensureSafeSpawnDistance(
        request.position,
        playerPosition,
      );

      readySpawns.push({
        id: request.id,
        type: request.type,
        position: adjustedPosition,
        difficulty: request.difficulty,
      });

      this.queue.splice(i, 1);
      processed++;
    }

    return readySpawns;
  }

  /**
   * Ensure spawn position is safe distance from player
   */
  _ensureSafeSpawnDistance(spawnPos, playerPos) {
    if (!playerPos) return spawnPos;

    const dx = spawnPos.x - playerPos.x;
    const dz = spawnPos.z - playerPos.z;
    const distSq = dx * dx + dz * dz;
    const safeDistSq = this.safeSpawnDistance * this.safeSpawnDistance;

    if (distSq >= safeDistSq) {
      return spawnPos;
    }

    // Too close - push spawn position away
    let dist = Math.sqrt(distSq);
    if (dist < 0.01) {
      // Spawn exactly on player - randomize direction
      const angle = Math.random() * Math.PI * 2;
      return {
        x: playerPos.x + Math.cos(angle) * this.safeSpawnDistance,
        y: spawnPos.y,
        z: playerPos.z + Math.sin(angle) * this.safeSpawnDistance,
      };
    }

    // Push away to safe distance
    const ratio = this.safeSpawnDistance / dist;
    return {
      x: playerPos.x + dx * ratio,
      y: spawnPos.y,
      z: playerPos.z + dz * ratio,
    };
  }

  /**
   * Clear all pending spawns
   */
  clear() {
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      nextSpawnId: this.nextSpawnId,
      readyCount: this.queue.filter((r) => r.delay <= 0).length,
    };
  }
}

// ==========================================
// SPAWN PREDICTOR
// ==========================================

class SpawnPredictor {
  constructor() {
    this.spawnHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Record spawn event for prediction
   */
  recordSpawn(spawnData) {
    this.spawnHistory.push({
      type: spawnData.type,
      waveNumber: spawnData.waveNumber,
      difficulty: spawnData.difficulty,
      timestamp: Date.now(),
    });

    if (this.spawnHistory.length > this.maxHistorySize) {
      this.spawnHistory.shift();
    }
  }

  /**
   * Predict optimal spawn positions based on player movement
   * @param {Object} playerPosition - Current player position
   * @param {Object} playerVelocity - Player velocity vector
   * @returns {Array} Predicted safe spawn positions
   */
  predictSpawnPositions(playerPosition, playerVelocity, count = 5) {
    const positions = [];
    const predictTime = 2.0; // Predict 2 seconds ahead

    // Predict player position
    const predictedPlayer = {
      x: playerPosition.x + playerVelocity.x * predictTime,
      y: playerPosition.y,
      z: playerPosition.z + playerVelocity.z * predictTime,
    };

    // Generate spawn positions around predicted player location
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 30 + Math.random() * 20;

      positions.push({
        x: predictedPlayer.x + Math.cos(angle) * radius,
        y: 0,
        z: predictedPlayer.z + Math.sin(angle) * radius,
      });
    }

    return positions;
  }

  /**
   * Calculate spawn rate based on performance
   * @param {number} currentFPS - Current frame rate
   * @returns {number} Recommended max spawns per second
   */
  calculateOptimalSpawnRate(currentFPS) {
    if (currentFPS >= 60) return 10; // High performance
    if (currentFPS >= 45) return 7; // Medium performance
    if (currentFPS >= 30) return 5; // Low performance
    return 3; // Very low performance
  }
}

// ==========================================
// WORKER STATE
// ==========================================

let spawnManager = null;
let spawnPredictor = null;
let performanceMetrics = {
  spawnsProcessed: 0,
  totalQueueTime: 0,
  averageProcessTime: 0,
};

// ==========================================
// MESSAGE HANDLER
// ==========================================

function handleMessage(message) {
  switch (message.type) {
    case "INIT":
      spawnManager = new SpawnQueueManager();
      spawnPredictor = new SpawnPredictor();
      postMessage({ type: "INITIALIZED" });
      break;

    case "ADD_SPAWN":
      if (spawnManager) {
        spawnManager.addSpawn(message.data);
        postMessage({
          type: "SPAWN_QUEUED",
          queueSize: spawnManager.queue.length,
        });
      }
      break;

    case "ADD_BATCH":
      if (spawnManager) {
        spawnManager.addBatch(message.data);
        postMessage({
          type: "BATCH_QUEUED",
          queueSize: spawnManager.queue.length,
          batchSize: message.data.length,
        });
      }
      break;

    case "GENERATE_WAVE":
      if (spawnManager) {
        const spawns = spawnManager.generateWaveSpawns(
          message.waveNumber,
          message.difficulty,
        );
        spawnManager.addBatch(spawns);
        postMessage({
          type: "WAVE_GENERATED",
          waveNumber: message.waveNumber,
          spawnCount: spawns.length,
          queueSize: spawnManager.queue.length,
        });
      }
      break;

    case "UPDATE":
      if (spawnManager) {
        const startTime = performance.now();

        const readySpawns = spawnManager.processQueue(
          message.deltaTime,
          message.playerPosition,
        );

        const processTime = performance.now() - startTime;
        performanceMetrics.spawnsProcessed += readySpawns.length;
        performanceMetrics.totalQueueTime += processTime;
        performanceMetrics.averageProcessTime =
          performanceMetrics.totalQueueTime /
          Math.max(1, performanceMetrics.spawnsProcessed);

        if (readySpawns.length > 0) {
          postMessage({
            type: "SPAWNS_READY",
            spawns: readySpawns,
            queueSize: spawnManager.queue.length,
            processTime,
          });
        }
      }
      break;

    case "PREDICT_SPAWNS":
      if (spawnPredictor) {
        const positions = spawnPredictor.predictSpawnPositions(
          message.playerPosition,
          message.playerVelocity,
          message.count || 5,
        );
        postMessage({
          type: "SPAWN_PREDICTIONS",
          positions,
        });
      }
      break;

    case "OPTIMIZE_SPAWN_RATE":
      if (spawnPredictor) {
        const optimalRate = spawnPredictor.calculateOptimalSpawnRate(
          message.fps,
        );
        if (spawnManager) {
          spawnManager.maxSpawnsPerTick = Math.ceil(optimalRate / 60);
        }
        postMessage({
          type: "SPAWN_RATE_OPTIMIZED",
          maxSpawnsPerTick: spawnManager.maxSpawnsPerTick,
          targetFPS: message.fps,
        });
      }
      break;

    case "GET_STATUS":
      if (spawnManager) {
        const status = spawnManager.getStatus();
        postMessage({
          type: "STATUS",
          ...status,
          metrics: performanceMetrics,
        });
      }
      break;

    case "CLEAR":
      if (spawnManager) {
        spawnManager.clear();
        performanceMetrics = {
          spawnsProcessed: 0,
          totalQueueTime: 0,
          averageProcessTime: 0,
        };
        postMessage({ type: "CLEARED" });
      }
      break;

    default:
      console.warn("Enemy spawn worker: Unknown message type:", message.type);
  }
}

// Setup message listener based on environment
if (isNode) {
  // Node.js worker_threads
  const { parentPort } = require("worker_threads");
  parentPort.on("message", handleMessage);
  parentPort.postMessage({ type: "READY" });
} else {
  // Browser Web Worker
  self.addEventListener("message", (event) => {
    handleMessage(event.data);
  });
  self.postMessage({ type: "READY" });
}
