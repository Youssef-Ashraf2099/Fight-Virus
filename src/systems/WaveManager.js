class WaveManager {
  constructor(enemyManager, uiManager) {
    this.enemyManager = enemyManager;
    this.uiManager = uiManager;

    this.currentWave = 0;
    this.waveActive = false;
    this.bossActive = false;
    this.waveDelay = 3; // Seconds between waves
    this.difficulty = 1;
    this.bossFightTriggered = false;
    this.lastWaveHadBoss = false;
    this.mapCenterPosition = new THREE.Vector3(0, 0, 0); // Center of map for boss spawns
  }

  startWave() {
    this.currentWave++;
    this.waveActive = true;
    this.bossActive = false;
    this.bossFightTriggered = false;
    this.lastWaveHadBoss = false;
    this.difficulty = 1 + (this.currentWave - 1) * 0.15;

    this.uiManager.updateWave(this.currentWave);

    // Spawn enemies for this wave
    this.enemyManager.spawnWave(this.currentWave, this.difficulty);
  }

  startBossFight() {
    this.bossActive = true;
    this.bossFightTriggered = true;

    // Determine boss type based on wave - Progressive difficulty
    let bossType = "circuit-overlord";
    let bossTitle = "";

    if (this.currentWave % 10 === 0) {
      // Every 10 waves: CORRUPTION CORE - The ultimate challenge
      bossType = "corruption-core";
      bossTitle = "⚠️💀 CORRUPTION CORE - SYSTEM DESTROYER 💀⚠️";
      this.uiManager.showMessage(bossTitle, 4000);
    } else if (this.currentWave >= 8 && this.currentWave % 3 === 2) {
      // Waves 8, 11, 14, etc: DATA WYRM - Dragon boss (Motherboard waves)
      bossType = "data-wyrm";
      bossTitle = "🐉🔥 DATA WYRM - CORRUPTED MAINFRAME GUARDIAN 🔥🐉";
      this.uiManager.showMessage(bossTitle, 3500);
    } else if (this.currentWave >= 4 && this.currentWave % 3 === 1) {
      // Waves 4, 7, 10, etc: PIXEL REAPER - GPU boss
      bossType = "pixel-reaper";
      bossTitle = "🎮💥 PIXEL REAPER - CORRUPTED RENDERING ENGINE 💥🎮";
      this.uiManager.showMessage(bossTitle, 3200);
    } else if (this.currentWave % 5 === 0) {
      // Every 5 waves: CORRUPTION CORE - Major boss
      bossType = "corruption-core";
      bossTitle = "🔥 CORRUPTION CORE DETECTED! 🔥";
      this.uiManager.showMessage(bossTitle, 3000);
    } else if (this.currentWave % 3 === 0) {
      // Every 3 waves: CIRCUIT OVERLORD - First boss
      bossType = "circuit-overlord";
      bossTitle = "⚡ CIRCUIT OVERLORD - FIRST GUARDIAN ⚡";
      this.uiManager.showMessage(bossTitle, 2500);
    }

    // ALWAYS spawn boss at map center with dramatic entrance
    const bossPosition = this.mapCenterPosition.clone();
    const bossDifficulty =
      this.difficulty * (this.currentWave % 10 === 0 ? 2 : 1.5);

    // Use the new boss spawning system
    const boss = this.enemyManager.spawnBoss(
      bossType,
      bossPosition,
      bossDifficulty
    );

    if (boss) {
      console.log(
        `Boss spawned: ${boss.bossName || bossType} at center position`
      );
    }
  }

  /**
   * Update map center position when environment changes
   */
  setMapCenter(position) {
    if (position) {
      this.mapCenterPosition.copy(position);
    }
  }

  update(deltaTime) {
    if (!this.waveActive) return false;

    // Check if wave is complete
    const enemyCount = this.enemyManager.getActiveEnemyCount();

    if (enemyCount === 0) {
      const hasPendingSpawns =
        typeof this.enemyManager.hasPendingSpawns === "function" &&
        this.enemyManager.hasPendingSpawns();

      if (hasPendingSpawns) {
        return false;
      }

      if (!this.bossFightTriggered) {
        // Regular enemies cleared, trigger boss fight before ending wave
        if (this.currentWave % 3 === 0) {
          // Start boss fight
          this.startBossFight();
          return false; // Wave not complete yet
        }
      }

      // Boss defeated or no boss this wave - wave complete
      this.waveActive = false;
      this.bossActive = false;
      this.lastWaveHadBoss = this.bossFightTriggered;
      return true; // Wave completed
    }

    return false;
  }

  getCurrentWave() {
    return this.currentWave;
  }

  getDifficulty() {
    return this.difficulty;
  }

  isBossWave() {
    return this.bossActive;
  }

  wasLastWaveBoss() {
    return this.lastWaveHadBoss;
  }

  reset() {
    this.currentWave = 0;
    this.waveActive = false;
    this.bossActive = false;
    this.bossFightTriggered = false;
    this.lastWaveHadBoss = false;
    this.difficulty = 1;
  }
}
