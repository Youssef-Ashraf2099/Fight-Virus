# 🛡️ COLLISION SYSTEM IMPROVEMENTS

## Overview

Enhanced the collision system to prevent players from getting stuck inside enemies and draining health until death. The system now includes:

1. **Player-Enemy Collision Pushback**
2. **Enemy-Enemy Separation**
3. **Improved Knockback System**

---

## 🎯 Problem Solved

**Before:**

- Player could get stuck inside enemies
- Continuous contact damage without escape
- Multiple enemies could stack on same position
- Player death from being trapped

**After:**

- Player is automatically pushed away from enemies
- Smooth separation when colliding
- Enemies maintain proper spacing
- No more getting stuck and dying helplessly

---

## 🔧 Technical Implementation

### 1. Player-Enemy Collision Pushback

**Location:** `src/game/Game.js` - `checkCollisions()` method

**How it works:**

```javascript
// Calculate overlap amount
const minDistance = enemy.collisionRadius + this.player.collisionRadius;
const overlap = minDistance - distance;

// Push player away based on overlap
const pushbackStrength = overlap * 0.5;
const pushbackVector = direction.multiplyScalar(pushbackStrength);

// Update player position to unstick
this.player.position.add(pushbackVector);
```

**Key Features:**

- Calculates exact overlap distance
- Pushes player proportional to overlap (0.5x multiplier)
- Instant position correction (no getting stuck)
- Additional knockback for dramatic effect (8 units)
- Works with invulnerability frames

**Parameters:**

- `pushbackStrength`: 0.5x overlap (adjustable)
- `knockback`: 8 units of velocity
- `minDistance`: Sum of collision radii

---

### 2. Enemy-Enemy Separation

**Location:** `src/game/Game.js` - `checkCollisions()` method

**How it works:**

```javascript
// Check all enemy pairs
for (let i = 0; i < enemies.length; i++) {
  for (let j = i + 1; j < enemies.length; j++) {
    // Calculate separation force
    const overlap = minDistance - distance;
    const separationForce = overlap * 0.3;

    // Push enemies apart equally
    enemy1.position.add(direction * separationForce * 0.5);
    enemy2.position.add(direction * -separationForce * 0.5);
  }
}
```

**Key Features:**

- Prevents enemies from stacking
- Equal force distribution (50/50 split)
- Maintains enemy spacing
- Improves visual clarity
- Better pathfinding around obstacles

**Parameters:**

- `separationForce`: 0.3x overlap (gentler than player pushback)
- Force split: 50% each enemy
- Minimum distance check: 0.1 units

---

### 3. Improved Knockback System

**Location:** `src/entities/player/Player.js` - `applyKnockback()` method

**Enhanced to support two modes:**

**Mode 1: Direction + Strength**

```javascript
// New signature
applyKnockback(direction, strength);

// Usage in collision
const direction = new THREE.Vector3()
  .subVectors(playerPos, enemyPos)
  .normalize();
this.player.applyKnockback(direction, 8);
```

**Mode 2: Enemy Position (Legacy)**

```javascript
// Old signature still works
applyKnockback(enemyPosition);

// Automatically calculates direction
```

**Smart Detection:**

- Checks if direction is normalized (length ≈ 1)
- If normalized: uses as direction
- If not normalized: treats as enemy position
- Backward compatible with old code

---

## 📊 Collision Radii Reference

### Player

```javascript
collisionRadius: 0.8 units
```

### Enemies

```javascript
Adware:      1.5 units (small, swarm)
Worm:        1.0 units (thin, fast)
Spyware:     1.5 units (medium)
Trojan:      2.0 units (large, heavy)
Ransomware:  2.5 units (large, tank)
Rootkit:     6.0 units (boss, huge)
```

### Bosses

```javascript
Corruption Core: 8.0 units (MASSIVE)
```

---

## 🎮 Collision Response Examples

### Example 1: Player Touches Small Enemy (Adware)

```
Player radius:  0.8
Adware radius:  1.5
Min distance:   2.3
Actual distance: 2.0
Overlap:        0.3 units

Pushback strength: 0.3 × 0.5 = 0.15 units
Knockback velocity: 8 units
Contact damage: 4 HP (with invulnerability)
```

### Example 2: Player Touches Boss

```
Player radius:     0.8
Boss radius:       8.0
Min distance:      8.8
Actual distance:   7.0
Overlap:           1.8 units

Pushback strength: 1.8 × 0.5 = 0.9 units (STRONG)
Knockback velocity: 8 units
Contact damage: 35 HP (OUCH!)
```

### Example 3: Enemy Stacking

```
Enemy1 radius: 2.0
Enemy2 radius: 2.0
Min distance:  4.0
Actual distance: 3.0
Overlap:       1.0 units

Separation force: 1.0 × 0.3 = 0.3 units
Enemy1 pushback: +0.15 units
Enemy2 pushback: -0.15 units
```

---

## ⚙️ Adjustable Parameters

### Player Pushback Strength

**Location:** `Game.js` line 282

```javascript
const pushbackStrength = overlap * 0.5; // Change this multiplier
```

- **Lower (0.3):** Gentler pushback, may still get stuck slightly
- **Current (0.5):** Balanced, smooth separation
- **Higher (0.8):** Aggressive pushback, very hard to get close

### Player Knockback Force

**Location:** `Game.js` line 290

```javascript
this.player.applyKnockback(direction, 8); // Change force value
```

- **Lower (5):** Minimal disruption
- **Current (8):** Noticeable but not excessive
- **Higher (12):** Strong defensive pushback

### Enemy Separation Force

**Location:** `Game.js` line 345

```javascript
const separationForce = overlap * 0.3; // Change multiplier
```

- **Lower (0.2):** Enemies can get closer
- **Current (0.3):** Natural spacing
- **Higher (0.5):** Wide spacing, less clustering

---

## 🧪 Testing Checklist

- [x] Player cannot get stuck inside small enemies
- [x] Player cannot get stuck inside large enemies
- [x] Player cannot get stuck inside boss
- [x] Enemies maintain proper spacing
- [x] Swarm enemies don't stack perfectly
- [x] Knockback feels responsive
- [x] No jittering when touching enemies
- [x] Contact damage still applies correctly
- [x] Invulnerability frames work with pushback
- [x] Performance remains smooth with many enemies

---

## 🐛 Edge Cases Handled

### 1. Zero Distance

```javascript
if (distance > 0.1) { // Avoid division by zero
```

Prevents math errors when player/enemy positions overlap exactly.

### 2. Normalized Direction Check

```javascript
if (directionOrPosition.length() > 0.9 && directionOrPosition.length() < 1.1)
```

Smart detection of normalized vs position vectors.

### 3. Group Position Sync

```javascript
if (this.player.group) {
  this.player.group.position.copy(this.player.position);
}
```

Keeps visual mesh synchronized with physics position.

### 4. Multiple Simultaneous Collisions

The system processes all collisions in one frame, applying cumulative pushback from multiple enemies.

---

## 📈 Performance Impact

**Before:**

- Collision checks: O(n) for player
- No enemy-enemy checks

**After:**

- Player collision: O(n) - Same
- Enemy-enemy: O(n²) - New

**Optimization:**

- Only checks enemies vs enemies (not vs all entities)
- Early exit on distance > minDistance
- Minimal vector math operations

**Performance Cost:**

- 10 enemies: 45 enemy-enemy checks
- 20 enemies: 190 enemy-enemy checks
- 30 enemies: 435 enemy-enemy checks

**Still efficient** due to:

- Simple distance calculations
- No complex physics simulation
- Frame-by-frame correction (not per-step)

---

## 💡 Future Improvements

### Spatial Partitioning

Implement grid-based spatial hashing to reduce enemy-enemy checks:

```javascript
// Only check enemies in nearby grid cells
// O(n²) → O(n × average_neighbors)
```

### Separate Collision Layers

```javascript
smallEnemyRadius: 1.0,
largeEnemyRadius: 2.0,
bossRadius: 8.0,
// Different pushback strengths per layer
```

### Pushback Dampening

```javascript
// Reduce pushback over time to prevent bouncing
const damping = 0.95;
pushbackStrength *= damping;
```

### Direction Prediction

```javascript
// Push away from where enemy is moving, not just current position
const predictedPosition = enemyPos + enemyVelocity * deltaTime;
```

---

## 🎯 Summary

The collision system now provides:

✅ **No More Getting Stuck** - Automatic pushback prevents trapping  
✅ **Better Enemy Spacing** - Enemies naturally separate  
✅ **Smoother Combat** - Knockback feels responsive  
✅ **Clearer Visuals** - No enemy overlap/stacking  
✅ **Fair Gameplay** - Player can always escape

The system is **tuned for balance** between:

- Strong enough pushback to unstick player
- Gentle enough to not feel floaty
- Fast enough for responsive combat
- Smooth enough to avoid jittering

---

**Version:** 1.0  
**Last Updated:** November 6, 2025  
**Status:** ✅ Implemented and Tested
