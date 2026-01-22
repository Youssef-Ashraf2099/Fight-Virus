/**
 * Collision Detection Worker Thread
 * Offloads expensive collision calculations to separate thread
 *
 * This worker handles:
 * - Broad-phase collision detection (spatial partitioning)
 * - Narrow-phase collision checks (precise intersection)
 * - Projectile-enemy collision detection
 * - Enemy-player collision detection
 * - Melee attack hit detection
 *
 * Benefits:
 * - Prevents collision detection from blocking rendering
 * - Enables more complex collision algorithms
 * - Scales better with large enemy/projectile counts
 * - Reduces main thread GC pressure
 */

const isNode =
  typeof process !== "undefined" && process.versions && process.versions.node;

// ==========================================
// SPATIAL PARTITIONING
// ==========================================

class SpatialGrid {
  constructor(cellSize = 10) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Clear grid for new frame
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Insert entity into spatial grid
   */
  insert(entity) {
    const cells = this._getCells(entity);
    cells.forEach((key) => {
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key).push(entity);
    });
  }

  /**
   * Get potential collision candidates for entity
   */
  query(entity) {
    const cells = this._getCells(entity);
    const candidates = new Set();

    cells.forEach((key) => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.forEach((e) => {
          if (e.id !== entity.id) {
            candidates.add(e);
          }
        });
      }
    });

    return Array.from(candidates);
  }

  /**
   * Get grid cell keys that entity overlaps
   */
  _getCells(entity) {
    const { x, z, radius } = entity;
    const r = radius || 1;

    const minX = Math.floor((x - r) / this.cellSize);
    const maxX = Math.floor((x + r) / this.cellSize);
    const minZ = Math.floor((z - r) / this.cellSize);
    const maxZ = Math.floor((z + r) / this.cellSize);

    const cells = [];
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        cells.push(`${cx},${cz}`);
      }
    }
    return cells;
  }
}

// ==========================================
// COLLISION DETECTOR
// ==========================================

class CollisionDetector {
  constructor() {
    this.spatialGrid = new SpatialGrid(15);
    this.collisionResults = [];
  }

  /**
   * Main collision detection pass
   * @param {Object} frame - {enemies, projectiles, player}
   * @returns {Array} Collision events
   */
  detectCollisions(frame) {
    this.collisionResults = [];
    this.spatialGrid.clear();

    const { enemies, projectiles, player } = frame;

    // Insert all entities into spatial grid
    enemies.forEach((e) => this.spatialGrid.insert(e));

    // Check projectile collisions (most common)
    projectiles.forEach((projectile) => {
      this._checkProjectileCollisions(projectile, enemies);
    });

    // Check player-enemy collisions
    if (player) {
      this._checkPlayerCollisions(player, enemies);
    }

    // Check enemy-enemy collisions (for pushing)
    this._checkEnemyCollisions(enemies);

    return this.collisionResults;
  }

  /**
   * Check projectile against enemies
   */
  _checkProjectileCollisions(projectile, enemies) {
    const candidates = this.spatialGrid.query(projectile);

    candidates.forEach((enemy) => {
      if (this._sphereIntersect(projectile, enemy)) {
        this.collisionResults.push({
          type: "PROJECTILE_HIT",
          projectileId: projectile.id,
          enemyId: enemy.id,
          position: projectile.position,
          damage: projectile.damage || 10,
        });
      }
    });
  }

  /**
   * Check player collision with enemies
   */
  _checkPlayerCollisions(player, enemies) {
    enemies.forEach((enemy) => {
      if (this._sphereIntersect(player, enemy)) {
        this.collisionResults.push({
          type: "PLAYER_HIT",
          enemyId: enemy.id,
          damage: enemy.damage || 5,
          position: enemy.position,
        });
      }
    });
  }

  /**
   * Check enemy-enemy collisions for separation
   */
  _checkEnemyCollisions(enemies) {
    const checked = new Set();

    enemies.forEach((enemy1) => {
      const candidates = this.spatialGrid.query(enemy1);

      candidates.forEach((enemy2) => {
        const pairKey =
          enemy1.id < enemy2.id
            ? `${enemy1.id}-${enemy2.id}`
            : `${enemy2.id}-${enemy1.id}`;

        if (checked.has(pairKey)) return;
        checked.add(pairKey);

        const overlap = this._getOverlap(enemy1, enemy2);
        if (overlap > 0) {
          this.collisionResults.push({
            type: "ENEMY_OVERLAP",
            enemy1Id: enemy1.id,
            enemy2Id: enemy2.id,
            overlap,
            direction: this._getSeparationVector(enemy1, enemy2),
          });
        }
      });
    });
  }

  /**
   * Sphere-sphere intersection test
   */
  _sphereIntersect(entity1, entity2) {
    const dx = entity1.x - entity2.x;
    const dy = (entity1.y || 0) - (entity2.y || 0);
    const dz = entity1.z - entity2.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    const r1 = entity1.radius || 1;
    const r2 = entity2.radius || 1;
    const radiusSum = r1 + r2;

    return distSq < radiusSum * radiusSum;
  }

  /**
   * Calculate overlap distance between two entities
   */
  _getOverlap(entity1, entity2) {
    const dx = entity2.x - entity1.x;
    const dz = entity2.z - entity1.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const r1 = entity1.radius || 1;
    const r2 = entity2.radius || 1;
    const radiusSum = r1 + r2;

    return Math.max(0, radiusSum - dist);
  }

  /**
   * Get separation vector for overlapping entities
   */
  _getSeparationVector(entity1, entity2) {
    const dx = entity2.x - entity1.x;
    const dz = entity2.z - entity1.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.01) {
      // Entities on same position - random separation
      const angle = Math.random() * Math.PI * 2;
      return { x: Math.cos(angle), z: Math.sin(angle) };
    }

    return { x: dx / dist, z: dz / dist };
  }

  /**
   * Ray-sphere intersection for line-of-sight checks
   */
  raySphereIntersect(rayOrigin, rayDir, sphere) {
    const dx = sphere.x - rayOrigin.x;
    const dy = (sphere.y || 0) - (rayOrigin.y || 0);
    const dz = sphere.z - rayOrigin.z;

    const a = rayDir.x * rayDir.x + rayDir.y * rayDir.y + rayDir.z * rayDir.z;
    const b = -2 * (rayDir.x * dx + rayDir.y * dy + rayDir.z * dz);
    const c = dx * dx + dy * dy + dz * dz - sphere.radius * sphere.radius;

    const discriminant = b * b - 4 * a * c;
    return discriminant >= 0;
  }
}

// ==========================================
// WORKER STATE
// ==========================================

let detector = null;
let performanceMetrics = {
  totalChecks: 0,
  totalCollisions: 0,
  averageCheckTime: 0,
  totalTime: 0,
};

// ==========================================
// MESSAGE HANDLER
// ==========================================

function handleMessage(message) {
  switch (message.type) {
    case "INIT":
      detector = new CollisionDetector();
      postMessage({ type: "INITIALIZED" });
      break;

    case "CHECK_COLLISIONS":
      if (detector) {
        const startTime = performance.now();

        const collisions = detector.detectCollisions(message.frame);

        const checkTime = performance.now() - startTime;
        performanceMetrics.totalChecks++;
        performanceMetrics.totalCollisions += collisions.length;
        performanceMetrics.totalTime += checkTime;
        performanceMetrics.averageCheckTime =
          performanceMetrics.totalTime / performanceMetrics.totalChecks;

        postMessage({
          type: "COLLISIONS",
          collisions,
          checkTime,
          frameId: message.frameId,
        });
      }
      break;

    case "CHECK_RAY":
      if (detector) {
        const hit = detector.raySphereIntersect(
          message.origin,
          message.direction,
          message.target,
        );
        postMessage({
          type: "RAY_RESULT",
          hit,
          rayId: message.rayId,
        });
      }
      break;

    case "GET_METRICS":
      postMessage({
        type: "METRICS",
        metrics: performanceMetrics,
      });
      break;

    case "RESET_METRICS":
      performanceMetrics = {
        totalChecks: 0,
        totalCollisions: 0,
        averageCheckTime: 0,
        totalTime: 0,
      };
      postMessage({ type: "METRICS_RESET" });
      break;

    default:
      console.warn("Collision worker: Unknown message type:", message.type);
  }
}

// Setup message listener based on environment
if (isNode) {
  const { parentPort } = require("worker_threads");
  parentPort.on("message", handleMessage);
  parentPort.postMessage({ type: "READY" });
} else {
  self.addEventListener("message", (event) => {
    handleMessage(event.data);
  });
  self.postMessage({ type: "READY" });
}
