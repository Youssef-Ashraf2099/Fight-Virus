import * as THREE from "three";

export default class WaveManager {
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

    this.environment = enemyManager?.environment || null;
    this.previousBossType = null;
    this.bossConfigs = {
      "circuit-overlord": {
        message: "⚡ CIRCUIT OVERLORD - SYSTEM GUARDIAN ⚡",
        difficultyMultiplier: 1.35,
      },
      "lady-bug-sentinel": {
        message: "🐞 LADYBUG SENTINEL - MEMORY PATROLLER 🐞",
        difficultyMultiplier: 1.45,
      },
      "pixel-reaper": {
        message: "🎮💥 PIXEL REAPER - RENDER ENGINE SABOTEUR 💥🎮",
        difficultyMultiplier: 1.5,
      },
      "trojan-horse-colossus": {
        message: "🐎 TROJAN WARHORSE - NETWORK SIEGE ENGINE 🐎",
        difficultyMultiplier: 1.75,
      },
      "data-wyrm": {
        message: "🐉🔥 DATA WYRM - MAINFRAME GUARDIAN 🔥🐉",
        difficultyMultiplier: 1.7,
      },
      "corruption-core": {
        message: "🔥⚠️ CORRUPTION CORE - SYSTEM ANNIHILATOR ⚠️🔥",
        difficultyMultiplier: 1.9,
      },
      noise: {
        message: "🔊 NOISE - DISK CORRUPTION DETECTED 🔊",
        difficultyMultiplier: 1.55,
      },
      "firewall-archon": {
        message: "🔥 FIREWALL ARCHON - SHIELD GRID COMMANDER 🔥",
        difficultyMultiplier: 1.68,
      },
      "neural-overmind": {
        message: "🧠 NEURAL OVERMIND - SIMULATION ARCHITECT 🧠",
        difficultyMultiplier: 1.62,
      },
      "packet-hydra": {
        message: "🌐 PACKET HYDRA - NETWORK DOMINION 🌐",
        difficultyMultiplier: 1.6,
      },
    };
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
    if (typeof window !== "undefined" && window.profiler?.startOperation) {
      window.profiler.startOperation("wave-spawn");
    }
    this.enemyManager.spawnWave(this.currentWave, this.difficulty);
    if (typeof window !== "undefined" && window.profiler?.endOperation) {
      window.profiler.endOperation("wave-spawn");
    }
  }

  startBossFight() {
    this.bossActive = true;
    this.bossFightTriggered = true;

    const bossConfig = this._selectBossConfig();
    const bossType = bossConfig.type;
    if (bossConfig.message) {
      this.uiManager.showMessage(
        bossConfig.message,
        bossConfig.messageDuration || 3200,
      );
    }

    const bossPosition = this.mapCenterPosition.clone();
    const bossDifficulty = this.difficulty * bossConfig.difficultyMultiplier;

    const boss = this.enemyManager.spawnBoss(
      bossType,
      bossPosition,
      bossDifficulty,
    );

    // Only log boss spawns in dev mode
    if (
      boss &&
      (typeof window === "undefined" ||
        window.location?.hostname === "localhost")
    ) {
      console.log(
        `👹 BOSS WAVE: ${boss.bossName || bossType} spawned at center (Wave ${this.currentWave})`,
      );
      this.previousBossType = bossType;
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

  setEnvironment(environment) {
    this.environment = environment || null;
  }

  _selectBossConfig() {
    const wave = Math.max(1, this.currentWave);
    const pool = new Set();

    pool.add("circuit-overlord");

    if (wave >= 3) {
      pool.add("lady-bug-sentinel");
    }
    if (wave >= 4) {
      pool.add("pixel-reaper");
    }
    if (wave >= 5) {
      pool.add("noise");
    }
    if (wave >= 6) {
      pool.add("firewall-archon");
      pool.add("packet-hydra");
    }
    if (wave >= 7) {
      pool.add("neural-overmind");
    }
    if (wave >= 7) {
      pool.add("data-wyrm");
    }
    if (wave >= 8) {
      pool.add("trojan-horse-colossus");
    }
    if (wave % 5 === 0) {
      pool.add("corruption-core");
    }
    if (wave % 10 === 0) {
      pool.add("trojan-horse-colossus");
      pool.add("corruption-core");
    }

    const envName = (this.environment?.getCurrentPhaseName?.() || "")
      .toString()
      .toLowerCase();

    if (envName.includes("gpu")) {
      pool.add("pixel-reaper");
    }
    if (envName.includes("memory") || envName.includes("ram")) {
      pool.add("lady-bug-sentinel");
    }
    if (envName.includes("network") || envName.includes("firewall")) {
      pool.add("trojan-horse-colossus");
    }
    if (envName.includes("motherboard") || envName.includes("kernel")) {
      pool.add("data-wyrm");
    }
    if (
      envName.includes("hard") ||
      envName.includes("drive") ||
      envName.includes("disk")
    ) {
      pool.add("noise");
    }
    if (envName.includes("firewall")) {
      pool.add("firewall-archon");
    }
    if (envName.includes("neural") || envName.includes("ai")) {
      pool.add("neural-overmind");
    }
    if (envName.includes("network") || envName.includes("hub")) {
      pool.add("packet-hydra");
    }

    const candidates = Array.from(pool);
    const filtered = candidates.filter(
      (type) => type !== this.previousBossType,
    );
    const selectionPool = filtered.length ? filtered : candidates;
    const selectedType =
      selectionPool[Math.floor(Math.random() * selectionPool.length)] ||
      "circuit-overlord";

    const config = this.bossConfigs[selectedType] || {
      difficultyMultiplier: 1.4,
      message: "⚔️ BOSS INBOUND ⚔️",
      messageDuration: 3000,
    };

    return {
      type: selectedType,
      difficultyMultiplier: config.difficultyMultiplier || 1.4,
      message: config.message || null,
      messageDuration: config.messageDuration || 3200,
    };
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
        return false; // Still spawning enemies
      }

      // All regular enemies cleared - check if boss fight should trigger
      if (!this.bossFightTriggered) {
        // Boss waves: every 3rd wave, but only starting from wave 3
        const shouldSpawnBoss =
          this.currentWave >= 3 && this.currentWave % 3 === 0;

        if (shouldSpawnBoss) {
          // Start boss fight
          this.startBossFight();
          return false; // Wave not complete yet, boss battle ongoing
        }
      }

      // Boss defeated (if there was one) or no boss for this wave - wave complete
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
