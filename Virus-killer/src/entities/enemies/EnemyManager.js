class EnemyManager {
  constructor(scene, particleSystem, environment) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.environment = environment || null;
    this.enemies = [];
    this.spawnQueue = [];
    // Spawn throttling: prefer a small time budget (ms) per frame for creating
    // enemies instead of a fixed-per-frame count. This smooths creation cost
    // and avoids long frame hitches when many enemies are queued.
    this.maxSpawnsPerFrame = 3; // kept as a fallback
    this.spawnTimeBudgetMs = 6; // milliseconds per frame allowed for spawning
    this.safeSpawnDistance = 18;
    this.lastPlayerPosition = null;
    this._spawnOffset = new THREE.Vector3();
    // Debug/testing flags
    // When staticMode is true, enemies won't move or deal contact damage.
    this.staticMode = false;
    this.enemyClasses = {
      trojan: TrojanVirus,
      worm: WormVirus,
      spyware: SpywareVirus,
      ransomware: RansomwareVirus,
      adware: AdwareVirus,
      rootkit: RootkitVirus,
    };
  }

  spawnEnemy(type, position, difficulty = 1) {
    const EnemyClass = this.enemyClasses[type];
    if (!EnemyClass) {
      console.error(`Unknown enemy type: ${type}`);
      return null;
    }

    const spawnPosition = position ? position.clone() : new THREE.Vector3();

    if (this.lastPlayerPosition) {
      this._ensureSafeSpawnDistance(spawnPosition, this.lastPlayerPosition);
    }

    if (this.environment) {
      spawnPosition.y = this.environment.getFloorHeightAt(
        spawnPosition.x,
        spawnPosition.z
      );
    }

    const enemy = new EnemyClass(
      this.scene,
      spawnPosition,
      this.particleSystem,
      difficulty
    );

    if (enemy) {
      const radius =
        typeof enemy.collisionRadius === "number" ? enemy.collisionRadius : 1;
      const lift = Math.max(0.5, radius);
      enemy.position.y = spawnPosition.y + lift;
      if (enemy.group) {
        enemy.group.position.copy(enemy.position);
      }
    }

    this.enemies.push(enemy);

    // If static/testing mode is enabled, make this enemy inert so it won't
    // immediately move/attack the player during debugging sessions.
    if (this.staticMode && enemy) {
      // Store originals so we can restore later
      if (typeof enemy.updateBehavior === "function") {
        enemy._originalUpdateBehavior = enemy.updateBehavior.bind(enemy);
      }
      enemy._originalSpeed = enemy.speed;
      enemy._originalContactDamage = enemy.contactDamage;
      enemy._originalDamage = enemy.damage;

      // Make inert
      enemy.updateBehavior = function () {};
      enemy.speed = 0;
      enemy.contactDamage = 0;
      enemy.damage = 0;
      enemy.isStaticDebug = true;
    }
    return enemy;
  }

  // Toggle static/debug mode for all current and future enemies. When enabled,
  // enemies stop moving and won't deal contact damage. When disabled, original
  // behavior is restored where possible.
  setStaticMode(enabled) {
    this.staticMode = !!enabled;
    this.enemies.forEach((enemy) => {
      if (this.staticMode) {
        if (typeof enemy.updateBehavior === "function") {
          enemy._originalUpdateBehavior = enemy.updateBehavior.bind(enemy);
        }
        enemy._originalSpeed = enemy.speed;
        enemy._originalContactDamage = enemy.contactDamage;
        enemy._originalDamage = enemy.damage;

        enemy.updateBehavior = function () {};
        enemy.speed = 0;
        enemy.contactDamage = 0;
        enemy.damage = 0;
        enemy.isStaticDebug = true;
      } else {
        // Restore original values if present
        if (enemy._originalUpdateBehavior) {
          enemy.updateBehavior = enemy._originalUpdateBehavior;
          delete enemy._originalUpdateBehavior;
        }
        if (typeof enemy._originalSpeed === "number") {
          enemy.speed = enemy._originalSpeed;
          delete enemy._originalSpeed;
        }
        if (typeof enemy._originalContactDamage === "number") {
          enemy.contactDamage = enemy._originalContactDamage;
          delete enemy._originalContactDamage;
        }
        if (typeof enemy._originalDamage === "number") {
          enemy.damage = enemy._originalDamage;
          delete enemy._originalDamage;
        }
        delete enemy.isStaticDebug;
      }
    });
  }

  spawnRandomEnemy(position, difficulty = 1, allowedTypes = null) {
    const types = allowedTypes || Object.keys(this.enemyClasses);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.spawnEnemy(randomType, position, difficulty);
  }

  queueSpawn(type, position, difficulty, delaySeconds = 0) {
    this.spawnQueue.push({
      type,
      position: position ? position.clone() : new THREE.Vector3(),
      difficulty,
      delay: Math.max(0, delaySeconds),
    });
  }

  spawnWave(waveNumber, difficulty) {
    const count = Math.floor(5 + waveNumber * 2);
    const radius = 40;

    // Determine enemy types based on wave number
    let allowedTypes = ["trojan", "worm", "adware"];

    if (waveNumber >= 3) {
      allowedTypes.push("spyware");
    }
    if (waveNumber >= 5) {
      allowedTypes.push("ransomware");
    }
    if (waveNumber >= 7) {
      allowedTypes.push("rootkit");
    }

    const spawnDelayStep = 0.2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnRadius = radius + Math.random() * 10;

      const position = new THREE.Vector3(
        Math.cos(angle) * spawnRadius,
        0,
        Math.sin(angle) * spawnRadius
      );

      const randomType =
        allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

      this.queueSpawn(randomType, position, difficulty, i * spawnDelayStep);
    }

    // Boss enemy every 5 waves
    if (waveNumber % 5 === 0) {
      const bossPosition = new THREE.Vector3(0, 0, -50);
      this.queueSpawn(
        "rootkit",
        bossPosition,
        difficulty * 2,
        count * spawnDelayStep + 1
      );
    }
  }

  update(deltaTime, playerPosition) {
    this.lastPlayerPosition = playerPosition ? playerPosition.clone() : null;

    if (this.spawnQueue.length) {
      // Spread queued spawns across frames to avoid hitches
      this.spawnQueue.forEach((request) => {
        request.delay = Math.max(0, request.delay - deltaTime);
      });

      const start = performance.now();
      let spawnsThisFrame = 0;
      // Drain queue while under time budget and under fallback max count
      while (this.spawnQueue.length > 0) {
        const elapsed = performance.now() - start;
        if (elapsed >= this.spawnTimeBudgetMs) break;
        if (spawnsThisFrame >= this.maxSpawnsPerFrame) break;

        const request = this.spawnQueue[0];
        if (request.delay > 0) break;

        const spawnPosition = request.position.clone();
        if (playerPosition) {
          this._ensureSafeSpawnDistance(spawnPosition, playerPosition);
        }

        this.spawnEnemy(request.type, spawnPosition, request.difficulty);
        this.spawnQueue.shift();
        spawnsThisFrame++;
      }
    }

    this.enemies.forEach((enemy) => {
      enemy.update(deltaTime, playerPosition);
    });

    // Remove dead enemies
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.isDead()) {
        enemy.destroy();
        return false;
      }
      return true;
    });
  }

  getEnemies() {
    return this.enemies;
  }

  getActiveEnemyCount() {
    return this.enemies.length;
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
      enemy.destroy();
    }
  }

  clear() {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.spawnQueue = [];
  }

  _ensureSafeSpawnDistance(spawnPos, playerPos) {
    const safeDistance = this.safeSpawnDistance;
    if (!playerPos || safeDistance <= 0) {
      return;
    }

    const offset = this._spawnOffset;
    offset.copy(spawnPos).sub(playerPos);
    const safeDistanceSq = safeDistance * safeDistance;
    let currentDistanceSq = offset.lengthSq();

    if (currentDistanceSq >= safeDistanceSq) {
      return;
    }

    if (currentDistanceSq < 1e-4) {
      offset.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      currentDistanceSq = offset.lengthSq();
    }

    if (currentDistanceSq === 0) {
      offset.set(1, 0, 0);
    }

    offset.normalize().multiplyScalar(safeDistance);
    spawnPos.copy(playerPos).add(offset);
  }
}
