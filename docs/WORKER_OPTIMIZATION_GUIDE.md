# Worker Optimization Quick Reference

## 🚀 Quick Start

### Enable Workers in Your Game

```javascript
import WorkerManager from "./workers/WorkerManager.js";

// In your game initialization
this.workerManager = new WorkerManager();
await this.workerManager.init();
```

### Use Spawn Worker (Replace Manual Spawning)

**Before** (Main Thread):

```javascript
// Spawning blocks rendering
for (let i = 0; i < 50; i++) {
  this.spawnEnemy("trojan", position, difficulty);
}
```

**After** (Worker Thread):

```javascript
// Generate wave on worker, no frame drop
this.workerManager.generateWave(waveNumber, difficulty);

// Each frame, get ready spawns
this.workerManager.updateSpawns(deltaTime, playerPos, (spawns) => {
  spawns.forEach((spawn) =>
    this.spawnEnemy(spawn.type, spawn.position, spawn.difficulty),
  );
});
```

### Use Collision Worker

**Before** (Main Thread O(n²)):

```javascript
// Brute force collision check - SLOW
enemies.forEach((enemy) => {
  projectiles.forEach((proj) => {
    if (checkCollision(enemy, proj)) {
      // handle collision
    }
  });
});
```

**After** (Worker Thread with Spatial Partitioning):

```javascript
// Fast spatial partitioning on worker thread
const frame = {
  enemies: this.getEnemyData(),
  projectiles: this.getProjectileData(),
  player: this.getPlayerData(),
};

this.workerManager.checkCollisions(frame, (collisions) => {
  collisions.forEach((col) => this.handleCollision(col));
});
```

## 📊 Performance Targets

| Metric                   | Target              | How to Check                                                  |
| ------------------------ | ------------------- | ------------------------------------------------------------- |
| Spawn worker response    | < 5ms               | `workerManager.getStatus().metrics.spawn.avgResponseTime`     |
| Collision checks         | < 3ms               | `workerManager.getStatus().metrics.collision.avgResponseTime` |
| Worker message frequency | < 60/sec per worker | Monitor `metrics.*.messages`                                  |
| Active callbacks         | < 10                | `workerManager.getStatus().activeCallbacks`                   |

## ⚡ Optimization Tips

### 1. Batch Operations

**Bad**:

```javascript
enemies.forEach((e) => workerManager.queueSpawn(e.type, e.pos, e.diff));
// 50 worker messages = overhead
```

**Good**:

```javascript
workerManager.queueSpawnBatch(enemies);
// 1 worker message = efficient
```

### 2. Reduce Message Frequency

**Bad**:

```javascript
// Every frame = 60 messages/sec
setInterval(() => checkCollisions(), 16);
```

**Good**:

```javascript
// Every 3 frames = 20 messages/sec (still responsive)
if (frameCount % 3 === 0) checkCollisions();
```

### 3. Send Minimal Data

**Bad**:

```javascript
// Sending entire enemy objects (heavy)
workerManager.checkCollisions({
  enemies: this.enemies, // Full Three.js objects!
});
```

**Good**:

```javascript
// Send only collision-relevant data
workerManager.checkCollisions({
  enemies: this.enemies.map((e) => ({
    id: e.id,
    x: e.position.x,
    y: e.position.y,
    z: e.position.z,
    radius: e.collisionRadius,
  })),
});
```

### 4. Use Transferable Objects

For large data (>100KB):

```javascript
const buffer = new ArrayBuffer(largeDataSize);
// ... fill buffer
worker.postMessage({ buffer }, [buffer]); // Transfer ownership
```

## 🐛 Common Issues

### Issue: Workers not starting

**Symptom**: Console error "Failed to create worker"  
**Fix**: Check browser compatibility (Chrome 80+, Firefox 114+)  
**Fix**: Ensure serving via HTTP (not file://)

### Issue: Performance worse with workers

**Symptom**: FPS drops when workers enabled  
**Fix**: Reduce message frequency (batch more)  
**Fix**: Send less data per message  
**Fix**: Check worker code complexity

### Issue: Delayed spawns

**Symptom**: Enemies spawn late  
**Fix**: Call `updateSpawns()` every frame  
**Fix**: Check worker queue size: `workerManager.getStatus()`  
**Fix**: Increase `maxSpawnsPerTick` if needed

## 📈 Monitoring

### Check Worker Health

```javascript
// Add to your game's debug overlay
setInterval(() => {
  const status = workerManager.getStatus();
  console.log("Worker Status:", {
    spawnReady: status.ready.spawn,
    collisionReady: status.ready.collision,
    spawnAvgTime: status.metrics.spawn.avgResponseTime.toFixed(2) + "ms",
    collisionAvgTime:
      status.metrics.collision.avgResponseTime.toFixed(2) + "ms",
    pendingCallbacks: status.activeCallbacks,
  });
}, 5000);
```

### Detect Performance Issues

```javascript
// Alert if worker response time too high
if (status.metrics.spawn.avgResponseTime > 10) {
  console.warn("Spawn worker slow! Consider reducing spawn rate");
}

if (status.metrics.collision.avgResponseTime > 5) {
  console.warn("Collision worker slow! Reduce entity count");
}
```

## 🎮 Game-Specific Usage

### Enemy Manager Integration

```javascript
// In EnemyManager.js
constructor(scene, particleSystem, environment) {
  // ... existing code
  this.workerManager = null; // Set by game
}

async init(workerManager) {
  this.workerManager = workerManager;
  // Now can use workers
}

spawnWave(waveNumber, difficulty) {
  if (this.workerManager && this.workerManager.ready.spawn) {
    // Use worker
    this.workerManager.generateWave(waveNumber, difficulty);
  } else {
    // Fallback to main thread
    this._spawnWaveSync(waveNumber, difficulty);
  }
}

update(deltaTime, playerPosition) {
  if (this.workerManager && this.workerManager.ready.spawn) {
    // Process spawn queue via worker
    this.workerManager.updateSpawns(deltaTime, playerPosition, (spawns) => {
      spawns.forEach(s => this._createEnemy(s));
    });
  } else {
    // Fallback: process queue on main thread
    this._processSpawnQueueSync(deltaTime, playerPosition);
  }

  // ... rest of update
}
```

### Game Main Integration

```javascript
// In GameMain.js
async init() {
  // ... existing init

  // Initialize workers
  this.workerManager = new WorkerManager();
  await this.workerManager.init();

  // Pass to systems
  this.enemyManager.init(this.workerManager);

  console.log('Workers ready:', this.workerManager.getStatus().ready);
}

update(deltaTime) {
  // ... existing update

  // Update enemies (will use workers internally)
  this.enemyManager.update(deltaTime, this.player.position);
}

destroy() {
  // Cleanup workers
  if (this.workerManager) {
    this.workerManager.destroy();
  }
}
```

## 🔧 Vite Configuration

Ensure `vite.config.js` supports workers:

```javascript
export default {
  worker: {
    format: "es",
    plugins: [],
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure workers are chunked separately
        manualChunks: {
          workers: [
            "./src/workers/enemy-spawn-worker",
            "./src/workers/collision-worker",
          ],
        },
      },
    },
  },
};
```

## 📚 Next Steps

1. ✅ Integrate spawn worker into EnemyManager
2. ✅ Integrate collision worker into CollisionManager
3. ⬜ Add SharedArrayBuffer support for zero-copy
4. ⬜ Integrate physics worker
5. ⬜ Add pathfinding worker for complex AI

## Related Docs

- [WORKER_ARCHITECTURE.md](./WORKER_ARCHITECTURE.md) - Full architecture details
- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - General optimization guide
- [GAME_STATUS.md](./GAME_STATUS.md) - Current game state
