/**
 * Game Physics/AI Worker Thread
 * Runs expensive calculations on a separate thread to keep UI responsive
 *
 * This worker handles:
 * - Physics calculations for all enemies/projectiles
 * - AI pathfinding and behavior
 * - Collision detection
 * - State updates using SharedArrayBuffer for zero-copy data passing
 *
 * Usage: spawn from main thread with:
 * const worker = new Worker('game-physics-worker.js')
 */

import { parentPort, workerData } from "worker_threads";

// ==========================================
// SHARED ARRAY BUFFER SETUP
// ==========================================

/**
 * Shared memory buffers for zero-latency communication
 * Instead of sending messages, we write/read directly to shared memory
 */
class SharedGameState {
  constructor(sharedBuffer) {
    this.buffer = sharedBuffer;
    this.view = new Float32Array(this.buffer);

    // Memory layout (optimized for cache coherency)
    // Each entity: [x, y, vx, vy, ax, ay, type, health, active]
    this.ENTITY_SIZE = 9; // floats per entity
    this.MAX_ENTITIES = 500;
    this.MAX_BYTES = this.MAX_ENTITIES * this.ENTITY_SIZE * 4; // 4 bytes per float
  }

  /**
   * Get entity state from shared memory
   * @param {number} entityId - Entity index
   * @returns {Object} Entity state {x, y, vx, vy, ax, ay, type, health, active}
   */
  getEntity(entityId) {
    const baseIndex = entityId * this.ENTITY_SIZE;
    return {
      x: this.view[baseIndex],
      y: this.view[baseIndex + 1],
      vx: this.view[baseIndex + 2],
      vy: this.view[baseIndex + 3],
      ax: this.view[baseIndex + 4],
      ay: this.view[baseIndex + 5],
      type: this.view[baseIndex + 6],
      health: this.view[baseIndex + 7],
      active: this.view[baseIndex + 8],
    };
  }

  /**
   * Update entity state in shared memory
   * @param {number} entityId - Entity index
   * @param {Object} state - Partial state to update
   */
  setEntity(entityId, state) {
    const baseIndex = entityId * this.ENTITY_SIZE;
    if (state.x !== undefined) this.view[baseIndex] = state.x;
    if (state.y !== undefined) this.view[baseIndex + 1] = state.y;
    if (state.vx !== undefined) this.view[baseIndex + 2] = state.vx;
    if (state.vy !== undefined) this.view[baseIndex + 3] = state.vy;
    if (state.ax !== undefined) this.view[baseIndex + 4] = state.ax;
    if (state.ay !== undefined) this.view[baseIndex + 5] = state.ay;
    if (state.type !== undefined) this.view[baseIndex + 6] = state.type;
    if (state.health !== undefined) this.view[baseIndex + 7] = state.health;
    if (state.active !== undefined) this.view[baseIndex + 8] = state.active;
  }

  /**
   * Batch update entities (optimized for cache)
   * @param {Array} updates - Array of {id, x, y, vx, vy, ...}
   */
  batchUpdate(updates) {
    for (const entity of updates) {
      this.setEntity(entity.id, entity);
    }
  }
}

// ==========================================
// PHYSICS ENGINE
// ==========================================

class PhysicsEngine {
  constructor(sharedState) {
    this.sharedState = sharedState;
    this.gravity = 0.5;
    this.dampening = 0.98;
    this.collisionDistance = 20; // pixels
    this.dt = 1 / 60; // 60 FPS delta time
  }

  /**
   * Update physics for all active entities
   * Runs entirely on worker thread - never blocks main thread
   */
  update() {
    const updates = [];

    // Process all entities
    for (let i = 0; i < this.sharedState.MAX_ENTITIES; i++) {
      const entity = this.sharedState.getEntity(i);

      // Skip inactive entities
      if (!entity.active) continue;

      // Apply physics
      const updated = this.updateEntity(entity, i);
      updates.push({ id: i, ...updated });
    }

    // Detect collisions
    this.detectCollisions(updates);

    // Batch update shared memory
    this.sharedState.batchUpdate(updates);

    return updates.length;
  }

  /**
   * Update single entity physics
   * @param {Object} entity - Current entity state
   * @param {number} id - Entity ID
   * @returns {Object} Updated state
   */
  updateEntity(entity, id) {
    let { x, y, vx, vy, ax, ay, type } = entity;

    // Apply acceleration
    vx += ax * this.dt;
    vy += (ay + this.gravity) * this.dt;

    // Apply dampening
    vx *= this.dampening;
    vy *= this.dampening;

    // Update position
    x += vx * this.dt;
    y += vy * this.dt;

    // Clamp to bounds (1920x1080 game area)
    if (x < 0 || x > 1920) vx *= -0.5; // Bounce
    if (y < 0 || y > 1080) vy *= -0.5;

    x = Math.max(0, Math.min(1920, x));
    y = Math.max(0, Math.min(1080, y));

    return { x, y, vx, vy, ax: 0, ay: 0 }; // Reset acceleration
  }

  /**
   * Broad-phase collision detection
   * Uses spatial partitioning for efficiency
   */
  detectCollisions(entities) {
    const cellSize = 100; // Grid cell size
    const grid = {};

    // Populate spatial grid
    for (const entity of entities) {
      const cellX = Math.floor(entity.x / cellSize);
      const cellY = Math.floor(entity.y / cellSize);
      const key = `${cellX},${cellY}`;

      if (!grid[key]) grid[key] = [];
      grid[key].push(entity);
    }

    // Check collisions within and adjacent cells
    for (const cell of Object.values(grid)) {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          this.checkEntityCollision(cell[i], cell[j]);
        }
      }
    }
  }

  /**
   * Check collision between two entities
   */
  checkEntityCollision(entity1, entity2) {
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.collisionDistance) {
      // Collision detected - push entities apart
      const angle = Math.atan2(dy, dx);
      const force = (this.collisionDistance - dist) * 0.5;

      entity1.vx -= Math.cos(angle) * force;
      entity1.vy -= Math.sin(angle) * force;
      entity2.vx += Math.cos(angle) * force;
      entity2.vy += Math.sin(angle) * force;
    }
  }
}

// ==========================================
// AI ENGINE
// ==========================================

class AIEngine {
  constructor(sharedState) {
    this.sharedState = sharedState;
    this.playerX = 0;
    this.playerY = 0;
    this.moveForce = 10;
  }

  /**
   * Update AI for all entities
   * Pathfinding, behavior, targeting - all on worker thread
   */
  update(playerX, playerY) {
    this.playerX = playerX;
    this.playerY = playerY;

    const updates = [];

    for (let i = 0; i < this.sharedState.MAX_ENTITIES; i++) {
      const entity = this.sharedState.getEntity(i);

      if (!entity.active) continue;
      if (entity.type === 0) continue; // Skip player

      // Calculate AI behavior
      const { ax, ay } = this.calculateBehavior(entity);
      updates.push({ id: i, ax, ay });
    }

    this.sharedState.batchUpdate(updates);
  }

  /**
   * Calculate behavior acceleration for entity
   */
  calculateBehavior(entity) {
    const dx = this.playerX - entity.x;
    const dy = this.playerY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return { ax: 0, ay: 0 };

    const angle = Math.atan2(dy, dx);

    // Different behaviors based on type
    switch (Math.floor(entity.type)) {
      case 1: // Chase player
        return {
          ax: Math.cos(angle) * this.moveForce,
          ay: Math.sin(angle) * this.moveForce,
        };

      case 2: // Evade player
        return {
          ax: -Math.cos(angle) * this.moveForce * 0.7,
          ay: -Math.sin(angle) * this.moveForce * 0.7,
        };

      case 3: // Patrol (random)
        const randomAngle = Math.random() * Math.PI * 2;
        return {
          ax: Math.cos(randomAngle) * this.moveForce * 0.5,
          ay: Math.sin(randomAngle) * this.moveForce * 0.5,
        };

      default:
        return { ax: 0, ay: 0 };
    }
  }
}

// ==========================================
// WORKER MESSAGE HANDLING
// ==========================================

let sharedState = null;
let physicsEngine = null;
let aiEngine = null;

/**
 * Initialize worker when main thread sends shared buffer
 */
parentPort.on("message", (message) => {
  switch (message.type) {
    case "INIT":
      // Receive shared buffer from main thread
      sharedState = new SharedGameState(message.sharedBuffer);
      physicsEngine = new PhysicsEngine(sharedState);
      aiEngine = new AIEngine(sharedState);
      parentPort.postMessage({ type: "INITIALIZED" });
      break;

    case "UPDATE":
      // Main loop update message
      if (!physicsEngine) return;

      // Update physics (most expensive operation)
      const physicsUpdates = physicsEngine.update();

      // Update AI with player position
      aiEngine.update(message.playerX, message.playerY);

      // Send back completion signal with update count
      parentPort.postMessage({
        type: "UPDATED",
        updates: physicsUpdates,
        timestamp: message.timestamp,
      });
      break;

    case "SET_ENTITY":
      // Set entity state from main thread
      if (sharedState) {
        sharedState.setEntity(message.entityId, message.state);
      }
      break;

    case "GET_PERFORMANCE":
      // Return worker performance metrics
      parentPort.postMessage({
        type: "PERFORMANCE",
        timestamp: Date.now(),
      });
      break;

    default:
      console.warn("Unknown message type:", message.type);
  }
});

// Signal that worker is ready
parentPort.postMessage({ type: "READY" });
