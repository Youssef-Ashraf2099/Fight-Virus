class WaveManager {
  constructor(enemyManager, uiManager) {
    this.enemyManager = enemyManager;
    this.uiManager = uiManager;

    this.currentWave = 0;
    this.waveActive = false;
    this.waveDelay = 3; // Seconds between waves
    this.difficulty = 1;
  }

  startWave() {
    this.currentWave++;
    this.waveActive = true;
    this.difficulty = 1 + (this.currentWave - 1) * 0.15;

    this.uiManager.updateWave(this.currentWave);

    // Spawn enemies for this wave
    this.enemyManager.spawnWave(this.currentWave, this.difficulty);
  }

  update(deltaTime) {
    if (!this.waveActive) return false;

    // Check if wave is complete
    const enemyCount = this.enemyManager.getActiveEnemyCount();

    if (enemyCount === 0) {
      this.waveActive = false;
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

  reset() {
    this.currentWave = 0;
    this.waveActive = false;
    this.difficulty = 1;
  }
}
