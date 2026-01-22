/**
 * Physics Worker - Handles physics calculations off the main thread
 *
 * Manages:
 * - Velocity and acceleration calculations
 * - Collision detection and response
 * - Rigid body physics
 * - Gravity and environmental forces
 * - Movement prediction
 *
 * Removes heavy physics computations from main thread
 */

// Simple physics body
class PhysicsBody {
  constructor(id, type, mass = 1) {
    this.id = id;
    this.type = type;
    this.mass = mass;

    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };

    this.collisionRadius = 1;
    this.affectedByGravity = true;
    this.isDynamic = type === "projectile" || type === "enemy";
  }

  /**
   * Apply force to body
   */
  applyForce(force) {
    const accel = 1 / this.mass;
    this.acceleration.x += force.x * accel;
    this.acceleration.y += force.y * accel;
    this.acceleration.z += force.z * accel;
  }

  /**
   * Update velocity and position based on forces
   */
  update(deltaTime, gravity = -9.8) {
    // Apply gravity
    if (this.affectedByGravity) {
      this.acceleration.y += gravity / this.mass;
    }

    // Update velocity
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;

    // Apply drag
    const dragCoefficient = 0.99;
    this.velocity.x *= dragCoefficient;
    this.velocity.z *= dragCoefficient;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;
  }

  /**
   * Reset physics state
   */
  reset() {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
  }
}

// Physics world
class PhysicsWorld {
  constructor() {
    this.bodies = new Map();
    this.gravity = -9.8;
    this.timeStep = 1 / 60; // 60 FPS
  }

  addBody(body) {
    this.bodies.set(body.id, body);
  }

  removeBody(id) {
    this.bodies.delete(id);
  }

  /**
   * Simulate one frame of physics
   */
  step(deltaTime) {
    const safeTimeStep = Math.min(deltaTime, this.timeStep);

    // Update all bodies
    for (const body of this.bodies.values()) {
      if (!body.isDynamic) continue;
      body.update(safeTimeStep, this.gravity);
    }

    // Detect collisions
    const collisions = this.detectCollisions();
    this.resolveCollisions(collisions);

    return collisions;
  }

  /**
   * Detect all collisions (O(n²) but with early exit optimization)
   */
  detectCollisions() {
    const collisions = [];
    const bodyArray = Array.from(this.bodies.values());

    for (let i = 0; i < bodyArray.length; i++) {
      for (let j = i + 1; j < bodyArray.length; j++) {
        const a = bodyArray[i];
        const b = bodyArray[j];

        if (!a.isDynamic && !b.isDynamic) continue; // Both static

        const collision = this.checkCollision(a, b);
        if (collision) {
          collisions.push(collision);
        }
      }
    }

    return collisions;
  }

  /**
   * Check collision between two bodies
   */
  checkCollision(a, b) {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dz = b.position.z - a.position.z;

    const distSquared = dx * dx + dy * dy + dz * dz;
    const minDist = a.collisionRadius + b.collisionRadius;
    const minDistSquared = minDist * minDist;

    if (distSquared > minDistSquared) {
      return null; // No collision
    }

    const dist = Math.sqrt(distSquared);
    const normalX = dx / dist;
    const normalY = dy / dist;
    const normalZ = dz / dist;

    const penetration = minDist - dist;

    return {
      bodyA: a.id,
      bodyB: b.id,
      normal: { x: normalX, y: normalY, z: normalZ },
      penetration: penetration,
      contactPoint: {
        x: a.position.x + normalX * a.collisionRadius,
        y: a.position.y + normalY * a.collisionRadius,
        z: a.position.z + normalZ * a.collisionRadius,
      },
    };
  }

  /**
   * Resolve collisions
   */
  resolveCollisions(collisions) {
    for (const collision of collisions) {
      const bodyA = this.bodies.get(collision.bodyA);
      const bodyB = this.bodies.get(collision.bodyB);

      if (!bodyA || !bodyB) continue;

      // Simple resolution: separate bodies
      const fixA = collision.penetration * 0.5;
      const fixB = collision.penetration * 0.5;

      if (bodyA.isDynamic) {
        bodyA.position.x -= collision.normal.x * fixA;
        bodyA.position.y -= collision.normal.y * fixA;
        bodyA.position.z -= collision.normal.z * fixA;
      }

      if (bodyB.isDynamic) {
        bodyB.position.x += collision.normal.x * fixB;
        bodyB.position.y += collision.normal.y * fixB;
        bodyB.position.z += collision.normal.z * fixB;
      }

      // Apply impulse to prevent overlap
      this.applyCollisionImpulse(bodyA, bodyB, collision);
    }
  }

  /**
   * Apply impulse response to collision
   */
  applyCollisionImpulse(bodyA, bodyB, collision) {
    // Calculate relative velocity
    const dvx = bodyB.velocity.x - bodyA.velocity.x;
    const dvy = bodyB.velocity.y - bodyA.velocity.y;
    const dvz = bodyB.velocity.z - bodyA.velocity.z;

    // Relative velocity along collision normal
    const dotProduct =
      dvx * collision.normal.x +
      dvy * collision.normal.y +
      dvz * collision.normal.z;

    // Don't resolve if moving apart
    if (dotProduct > 0) return;

    // Impulse scalar (with restitution = 0.1 for soft collisions)
    const restitution = 0.1;
    const impulse =
      (-(1 + restitution) * dotProduct) / (1 / bodyA.mass + 1 / bodyB.mass);

    // Apply impulse
    if (bodyA.isDynamic) {
      bodyA.velocity.x -= (impulse / bodyA.mass) * collision.normal.x;
      bodyA.velocity.y -= (impulse / bodyA.mass) * collision.normal.y;
      bodyA.velocity.z -= (impulse / bodyA.mass) * collision.normal.z;
    }

    if (bodyB.isDynamic) {
      bodyB.velocity.x += (impulse / bodyB.mass) * collision.normal.x;
      bodyB.velocity.y += (impulse / bodyB.mass) * collision.normal.y;
      bodyB.velocity.z += (impulse / bodyB.mass) * collision.normal.z;
    }
  }

  /**
   * Get all body states for main thread
   */
  getBodyStates() {
    const states = [];
    for (const body of this.bodies.values()) {
      states.push({
        id: body.id,
        position: { ...body.position },
        velocity: { ...body.velocity },
      });
    }
    return states;
  }

  /**
   * Clear all bodies
   */
  clear() {
    this.bodies.clear();
  }
}

// Global physics world
const physicsWorld = new PhysicsWorld();

// Handle messages from main thread
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "CREATE_BODY":
      const body = new PhysicsBody(data.id, data.type, data.mass);
      body.position = data.position;
      body.velocity = data.velocity;
      body.collisionRadius = data.collisionRadius;
      body.affectedByGravity = data.affectedByGravity !== false;
      physicsWorld.addBody(body);
      break;

    case "UPDATE_BODY":
      const updateBody = physicsWorld.bodies.get(data.id);
      if (updateBody) {
        updateBody.position = data.position;
        updateBody.velocity = data.velocity;
      }
      break;

    case "APPLY_FORCE":
      const forceBody = physicsWorld.bodies.get(data.id);
      if (forceBody) {
        forceBody.applyForce(data.force);
      }
      break;

    case "STEP":
      const collisions = physicsWorld.step(data.deltaTime);
      const bodyStates = physicsWorld.getBodyStates();
      self.postMessage({
        type: "PHYSICS_UPDATE",
        bodyStates,
        collisions,
      });
      break;

    case "REMOVE_BODY":
      physicsWorld.removeBody(data.id);
      break;

    case "CLEAR":
      physicsWorld.clear();
      break;
  }
};

// Send ready signal
self.postMessage({ type: "READY" });
