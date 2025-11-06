# 🎮 BOSS SYSTEM DOCUMENTATION

## Overview

The boss system provides epic, dramatic boss encounters that spawn in the center of the map with cinematic animations and unique abilities.

## Architecture

### Folder Structure

```
src/entities/bosses/
├── BaseBoss.js          # Base class for all bosses
└── CorruptionCore.js    # First boss - The Corruption Core
```

### Boss Features

All bosses inherit from `BaseBoss` which extends `BaseEnemy`, providing:

1. **Epic Spawn Animation** (3-second sequence)

   - Phase 0 (0-33%): Portal opening with rings and beacon
   - Phase 1 (33-66%): Boss emerging and scaling up
   - Phase 2 (66-100%): Roar/announcement with dramatic effects
   - Particle explosions and shockwaves

2. **Always Spawn at Map Center**

   - Bosses spawn at position (0, 0, 0) by default
   - WaveManager provides map center position
   - Creates focal point for epic battles

3. **Multi-Phase Combat**

   - Health-based phase transitions
   - Different attack patterns per phase
   - Visual changes and power increases

4. **Enrage Mechanic**

   - Triggers at 30% health (configurable)
   - Increased speed and damage
   - More aggressive attack patterns

5. **Boss-Specific Abilities**
   - Unique attack patterns
   - Special powers (AOE, summons, etc.)
   - Environmental effects

## Current Bosses

### 1. Corruption Core

**Identity:** "The System Destroyer"

**Stats:**

- Health: 2000 (scaled by difficulty)
- Damage: 60 base damage
- Contact Damage: 35
- Speed: 4 (increases each phase)
- Collision Radius: 8 units (MASSIVE)
- Score Value: 5000 points

**Visual Design:**

- 8-unit core (2x larger than standard enemies)
- 8 orbital rings spinning in complex patterns
- 16 writhing tendrils with 20 segments each
- 40 menacing spikes that grow with damage
- 80 dark matter particles swirling around
- Corruption aura pulsing outward
- Dramatic red/black color scheme

**Phase System:**

1. **Awakening** (100-66% HP)

   - Spiral projectiles
   - 2.5s cooldown

2. **Corruption Spread** (66-33% HP)

   - Spiral + Radial burst
   - 2.0s cooldown
   - 20% speed increase

3. **System Meltdown** (33% HP)

   - Spiral + Radial + Homing missiles
   - 1.5s cooldown
   - 40% total speed increase
   - Enrage activated

4. **Total Annihilation** (Enraged <33% HP)
   - All attacks + Chaos projectiles
   - 1.0s cooldown
   - 70% total speed increase
   - Maximum aggression

**Special Abilities:**

- **Shockwave:** Close-range AOE (15 units), 10s cooldown
- **Corruption Pulse:** Large expanding wave, 15s cooldown
- **Homing Missiles:** 6 tracking projectiles
- **Chaos Barrage:** 20 random-direction projectiles

## Adding New Bosses

### Step 1: Create Boss Class

Create a new file in `src/entities/bosses/YourBoss.js`:

```javascript
class YourBoss extends BaseBoss {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Boss Identity
    this.bossName = "YOUR BOSS NAME";
    this.bossTitle = "The Title";

    // Stats
    this.maxHealth = 1500 * difficulty;
    this.health = this.maxHealth;
    this.damage = 50 * difficulty;
    // ... etc

    this.createSpawnPortal(); // Inherited epic spawn
    this.createMesh(); // Your custom visuals
  }

  createMesh() {
    // Create your boss's unique appearance
  }

  animate(deltaTime) {
    // Boss animation logic
  }

  updateBehavior(deltaTime, playerPosition) {
    // Boss AI and attacks
  }
}
```

### Step 2: Register in EnemyManager

Edit `src/entities/enemies/EnemyManager.js`:

```javascript
this.bossClasses = {
  "corruption-core": CorruptionCore,
  "your-boss": YourBoss, // Add here
};
```

### Step 3: Add to Bundle

Edit `src/game/game-bundle.js`:

```javascript
"./entities/bosses/YourBoss.js", // Add to scripts array
```

### Step 4: Update Wave Manager

Edit `src/systems/WaveManager.js` to spawn your boss:

```javascript
if (this.currentWave % 5 === 0) {
  bossType = "your-boss";
  bossTitle = "🔥 YOUR BOSS TITLE! 🔥";
}
```

## Boss Spawn System

### How It Works

1. **WaveManager** decides when to spawn boss (every 3rd wave)
2. **startBossFight()** called with boss type
3. **EnemyManager.spawnBoss()** creates boss at map center
4. **BaseBoss** handles epic 3-second spawn animation
5. Boss becomes active and starts attacking

### Spawn Animation Timeline

```
0.0s - 1.0s: Portal opens, rings spin, warning beacon
1.0s - 2.0s: Boss emerges and scales up, portal shrinks
2.0s - 3.0s: Boss roars, dramatic lighting, particle burst
3.0s+      : Boss fully active, starts combat
```

### Map Center Position

- Default: (0, 0, 0)
- Can be updated via `WaveManager.setMapCenter(position)`
- Automatically adjusts for floor height
- Creates consistent focal point for boss battles

## Boss Design Guidelines

### Visual Design

- **Size:** 2-3x larger than regular enemies
- **Complexity:** More visual elements (rings, tendrils, particles)
- **Lighting:** Dramatic point lights and emissive materials
- **Color Scheme:** Unique colors that stand out
- **Animation:** Smooth, menacing movements

### Combat Design

- **Health:** 1500-3000 base (scales with difficulty)
- **Phases:** 2-4 distinct combat phases
- **Attacks:** 3-5 unique attack patterns
- **Special Abilities:** 1-2 signature moves
- **Enrage:** Always at 30% for dramatic finale

### Balance Considerations

- **Duration:** Boss fights should last 1-3 minutes
- **Difficulty Curve:** Each phase should feel harder
- **Fair Mechanics:** Telegraph attacks, give dodge windows
- **Rewards:** 3x score, extra healing on defeat
- **Variety:** Each boss should feel unique

## Integration with Existing Systems

### Collision System

- Bosses use larger `collisionRadius` (6-10 units)
- Contact damage properly scaled
- Projectiles managed by CollisionManager

### UI System

- Boss health bar displayed
- Boss name and title shown
- Phase indicators
- Warning messages

### Particle System

- Spawn effects (explosions, shockwaves)
- Attack effects (projectile trails)
- Damage feedback (hit particles)
- Phase transition effects

### Wave System

- Boss triggers every 3rd wave
- Special bosses at waves 5, 10, etc.
- Wave completes when boss defeated
- Bonus rewards for boss kills

## Future Boss Ideas

### 2. Data Kraken (Network Boss)

- Tentacle-based attacks
- Spawns minion viruses
- Water/network themed visuals

### 3. Firewall Titan (Security Boss)

- Shield mechanics
- Barrier creation
- Fire/barrier themed

### 4. Quantum Paradox (AI Boss)

- Teleportation
- Clone creation
- Purple/glitch themed

### 5. Zero-Day Exploit (Ultimate Boss)

- All abilities combined
- Dynamic phase system
- Reality-warping effects

## Testing Checklist

When adding a new boss:

- [ ] Boss spawns at map center
- [ ] 3-second spawn animation plays correctly
- [ ] Portal effects cleaned up after spawn
- [ ] Boss phases transition at correct health thresholds
- [ ] All attack patterns work correctly
- [ ] Projectiles are tracked by collision system
- [ ] Boss takes damage and shows feedback
- [ ] Boss death triggers wave completion
- [ ] Proper rewards given on defeat
- [ ] Performance remains smooth (60 FPS)

## Console Commands (for testing)

```javascript
// Spawn boss directly
game.enemyManager.spawnBoss("corruption-core", new THREE.Vector3(0, 0, 0), 1);

// Trigger boss fight
game.waveManager.startBossFight();

// Set boss health (for testing phases)
game.enemyManager.enemies[0].health = 500;

// Force enrage
game.enemyManager.enemies[0].isEnraged = true;
```

---

## Summary

The boss system provides a modular, extensible framework for creating epic boss encounters. Each boss spawns dramatically at the map center with a 3-second cinematic sequence, features multiple combat phases, and provides unique challenges. The system is designed for easy expansion - just create a new boss class, register it, and define its unique abilities!
