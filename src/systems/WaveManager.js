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
    this.mapCenterPosition = new THREE.Vector3(0, 0, 0); // Center of map for boss spawns
  }

  startWave() {
    this.currentWave++;
    this.waveActive = true;
    this.bossActive = false;
    this.bossFightTriggered = false;
    this.difficulty = 1 + (this.currentWave - 1) * 0.15;

    this.uiManager.updateWave(this.currentWave);

    // Spawn enemies for this wave
    this.enemyManager.spawnWave(this.currentWave, this.difficulty);
  }

  startBossFight() {
    this.bossActive = true;
    this.bossFightTriggered = true;

    // Determine boss type based on wave
    let bossType = "corruption-core"; // Default to new boss system
    let bossTitle = "";

    if (this.currentWave % 10 === 0) {
      // Every 10 waves: CORRUPTION CORE - The ultimate boss
      bossType = "corruption-core";
      bossTitle = "⚠️ CORRUPTION CORE AWAKENING! ⚠️";
      this.uiManager.showMessage(bossTitle, 4000);
    } else if (this.currentWave % 5 === 0) {
      // Every 5 waves: Future boss slot
      bossType = "corruption-core"; // For now use same boss
      bossTitle = "🔥 BOSS INCOMING! 🔥";
      this.uiManager.showMessage(bossTitle, 3000);
    } else if (this.currentWave % 3 === 0) {
      // Every 3 waves: Future boss slot
      bossType = "corruption-core"; // For now use same boss
      bossTitle = "⚡ MINI BOSS APPEARS! ⚡";
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

  reset() {
    this.currentWave = 0;
    this.waveActive = false;
    this.bossActive = false;
    this.bossFightTriggered = false;
    this.difficulty = 1;
  }
}
