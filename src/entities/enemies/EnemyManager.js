class EnemyManager {
  constructor(scene, particleSystem, environment) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.environment = environment || null;
    this.enemies = [];
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

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnRadius = radius + Math.random() * 10;

      const position = new THREE.Vector3(
        Math.cos(angle) * spawnRadius,
        0,
        Math.sin(angle) * spawnRadius
      );

      // Spawn with delay for dramatic effect
      setTimeout(() => {
        this.spawnRandomEnemy(position, difficulty, allowedTypes);
      }, i * 200);
    }

    // Boss enemy every 5 waves
    if (waveNumber % 5 === 0) {
      setTimeout(() => {
        const bossPosition = new THREE.Vector3(0, 0, -50);
        this.spawnEnemy("rootkit", bossPosition, difficulty * 2);
      }, count * 200 + 1000);
    }
  }

  update(deltaTime, playerPosition) {
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
  }
}
