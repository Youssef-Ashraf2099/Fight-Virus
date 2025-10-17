class EnemyManager {
  constructor(scene, particleSystem, environment) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.environment = environment || null;
    this.enemies = [];
    this.spawnQueue = [];
    this.maxSpawnsPerFrame = 5;
    this.safeSpawnDistance = 18;
    this.lastPlayerPosition = null;
    this._spawnOffset = new THREE.Vector3();
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
    return enemy;
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

      let spawnsThisFrame = 0;
      for (let i = 0; i < this.spawnQueue.length; ) {
        if (spawnsThisFrame >= this.maxSpawnsPerFrame) {
          break;
        }

        const request = this.spawnQueue[i];
        if (request.delay > 0) {
          i++;
          continue;
        }

        const spawnPosition = request.position.clone();
        if (playerPosition) {
          this._ensureSafeSpawnDistance(spawnPosition, playerPosition);
        }

        this.spawnEnemy(request.type, spawnPosition, request.difficulty);
        this.spawnQueue.splice(i, 1);
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
