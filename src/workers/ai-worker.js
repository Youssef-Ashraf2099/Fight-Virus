/**
 * AI Decision Worker - Handles enemy AI calculations off the main thread
 *
 * This worker manages:
 * - Pathfinding (A* or simpler algorithms)
 * - Target selection logic
 * - Behavior decision making
 * - Threat assessment
 * - Group coordination
 *
 * All expensive AI computations run here, main thread just applies results
 */

// Simple spatial partitioning for quick neighbor queries
class SpatialGrid {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  add(entity, position) {
    const key = `${Math.floor(position.x / this.cellSize)},${Math.floor(position.z / this.cellSize)}`;
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid
      .get(key)
      .push({ id: entity.id, pos: position, type: entity.type });
  }

  getNearby(position, radius) {
    const results = [];
    const cellX = Math.floor(position.x / this.cellSize);
    const cellZ = Math.floor(position.z / this.cellSize);
    const range = Math.ceil(radius / this.cellSize);

    for (let x = cellX - range; x <= cellX + range; x++) {
      for (let z = cellZ - range; z <= cellZ + range; z++) {
        const key = `${x},${z}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }

    return results.filter((entity) => {
      const dx = entity.pos.x - position.x;
      const dz = entity.pos.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist <= radius;
    });
  }
}

// Simple pathfinding
class PathFinder {
  constructor() {
    this.waypoints = [];
  }

  /**
   * Calculate direction to target with simple steering
   */
  getDirection(from, to, obstaclePositions = []) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.1) {
      return { x: 0, z: 0 }; // At target
    }

    let dirX = dx / distance;
    let dirZ = dz / distance;

    // Simple avoidance: steer away from nearby obstacles
    const avoidanceRadius = 5;
    for (const obstacle of obstaclePositions) {
      const obDx = obstacle.x - from.x;
      const obDz = obstacle.z - from.z;
      const obDist = Math.sqrt(obDx * obDx + obDz * obDz);

      if (obDist < avoidanceRadius) {
        // Steer away
        const avoidX = -obDx / (obDist + 0.1);
        const avoidZ = -obDz / (obDist + 0.1);

        dirX += avoidX * 0.3;
        dirZ += avoidZ * 0.3;
      }
    }

    // Normalize
    const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0.1) {
      dirX /= len;
      dirZ /= len;
    }

    return { x: dirX, z: dirZ };
  }

  /**
   * Simple waypoint following
   */
  getWaypointPath(from, to) {
    // In a real game, this would use A* pathfinding
    // For now, simple straight line
    return [from, to];
  }
}

// AI State Machine
const AIStates = {
  IDLE: "idle",
  CHASE: "chase",
  ATTACK: "attack",
  FLEE: "flee",
  PATROL: "patrol",
};

// Main worker logic
const spatialGrid = new SpatialGrid(50);
const pathFinder = new PathFinder();

// Store active enemies and their state
const enemyAIState = new Map();

// Listen for messages from main thread
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "UPDATE_ENEMIES":
      handleEnemyUpdate(data);
      break;

    case "GET_DECISIONS":
      const decisions = calculateAIDecisions(data);
      self.postMessage({ type: "AI_DECISIONS", decisions });
      break;

    case "PATHFIND":
      const path = pathFinder.getWaypointPath(data.from, data.to);
      self.postMessage({ type: "PATHFIND_RESULT", path });
      break;

    case "CLEAR":
      enemyAIState.clear();
      spatialGrid.clear();
      break;
  }
};

/**
 * Handle enemy position updates and build spatial grid
 */
function handleEnemyUpdate(enemies) {
  spatialGrid.clear();

  for (const enemy of enemies) {
    spatialGrid.add(enemy, enemy.position);

    // Initialize AI state if new
    if (!enemyAIState.has(enemy.id)) {
      enemyAIState.set(enemy.id, {
        state: AIStates.PATROL,
        targetId: null,
        threatLevel: 0,
        lastDecisionTime: Date.now(),
      });
    }
  }
}

/**
 * Calculate AI decisions for all enemies
 * This is the expensive operation moved off main thread
 */
function calculateAIDecisions(data) {
  const { enemies, playerPosition, projectiles, nearbyEnemies } = data;
  const decisions = new Map();

  for (const enemy of enemies) {
    const decision = calculateEnemyDecision(enemy, playerPosition, projectiles);
    decisions.set(enemy.id, decision);
  }

  return Object.fromEntries(decisions);
}

/**
 * Calculate single enemy's AI decision
 */
function calculateEnemyDecision(enemy, playerPosition, projectiles) {
  const state = enemyAIState.get(enemy.id) || { state: AIStates.PATROL };

  const distToPlayer = Math.hypot(
    playerPosition.x - enemy.position.x,
    playerPosition.z - enemy.position.z,
  );

  // Threat assessment
  const inCombatRange = distToPlayer < 30;
  const canSeePlayer = canSeeTarget(enemy.position, playerPosition);

  // Incoming threat detection
  let incomingThreat = false;
  for (const proj of projectiles || []) {
    const projDist = Math.hypot(
      proj.x - enemy.position.x,
      proj.z - enemy.position.z,
    );
    if (projDist < 15) {
      incomingThreat = true;
      break;
    }
  }

  // State transitions
  let newState = state.state;
  let moveDirection = null;
  let shouldAttack = false;
  let shouldEvade = false;

  if (incomingThreat) {
    newState = AIStates.FLEE;
    shouldEvade = true;
  } else if (canSeePlayer && inCombatRange) {
    newState = AIStates.ATTACK;
    shouldAttack = true;
  } else if (canSeePlayer) {
    newState = AIStates.CHASE;
  } else {
    newState = AIStates.PATROL;
  }

  // Calculate movement
  if (newState === AIStates.FLEE) {
    moveDirection = {
      x: enemy.position.x - playerPosition.x,
      z: enemy.position.z - playerPosition.z,
    };
  } else if (newState === AIStates.CHASE || newState === AIStates.ATTACK) {
    moveDirection = {
      x: playerPosition.x - enemy.position.x,
      z: playerPosition.z - enemy.position.z,
    };
  }

  // Normalize direction
  if (moveDirection) {
    const len = Math.hypot(moveDirection.x, moveDirection.z);
    if (len > 0.1) {
      moveDirection.x /= len;
      moveDirection.z /= len;
    }
  }

  return {
    state: newState,
    moveDirection: moveDirection || { x: 0, z: 0 },
    shouldAttack,
    shouldEvade,
    targetPosition: canSeePlayer ? playerPosition : null,
  };
}

/**
 * Simple line-of-sight check
 */
function canSeeTarget(from, to) {
  // Simple distance check (no actual raycasting in worker)
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dz);

  // Can see within 40 units
  return dist < 40;
}

// Send ready signal
self.postMessage({ type: "READY" });
