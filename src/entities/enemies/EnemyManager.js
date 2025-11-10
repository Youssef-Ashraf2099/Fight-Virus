import * as THREE from "three";
import TrojanVirus from "./types/TrojanVirus.js";
import WormVirus from "./types/WormVirus.js";
import SpywareVirus from "./types/SpywareVirus.js";
import RansomwareVirus from "./types/RansomwareVirus.js";
import AdwareVirus from "./types/AdwareVirus.js";
import RootkitVirus from "./types/RootkitVirus.js";
import CircuitOverlord from "../bosses/CircuitOverlord.js";
import CorruptionCore from "../bosses/CorruptionCore.js";
import PixelReaper from "../bosses/PixelReaper.js";
import DataWyrm from "../bosses/DataWyrm.js";
import LadyBugSentinel from "../bosses/LadyBugSentinel.js";
import TrojanHorseColossus from "../bosses/TrojanHorseColossus.js";
import Noise from "../bosses/Noise.js";
import FirewallArchon from "../bosses/FirewallArchon.js";
import NeuralOvermind from "../bosses/NeuralOvermind.js";
import PacketHydra from "../bosses/PacketHydra.js";

export default class EnemyManager {
  constructor(scene, particleSystem, environment) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.environment = environment || null;
    this.enemies = [];
    this.spawnQueue = [];
    this.maxSpawnsPerFrame = 5;
    this.maxActiveEnemies = 15;
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

    // Boss classes (in order of difficulty)
    this.bossClasses = {
      "circuit-overlord": CircuitOverlord, // First boss - Wave 3
      "corruption-core": CorruptionCore, // Second boss - Wave 5+
      "pixel-reaper": PixelReaper, // GPU boss - Wave 4+ (GPU environment)
      "data-wyrm": DataWyrm, // Dragon boss - Wave 8+ (Motherboard)
      "lady-bug-sentinel": LadyBugSentinel,
      "trojan-horse-colossus": TrojanHorseColossus,
      noise: Noise,
      "firewall-archon": FirewallArchon,
      "neural-overmind": NeuralOvermind,
      "packet-hydra": PacketHydra,
    };
  }

  setEnvironment(environment) {
    this.environment = environment || null;
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
      if (this.environment && typeof enemy.setEnvironment === "function") {
        enemy.setEnvironment(this.environment);
      }

      const radius =
        typeof enemy.collisionRadius === "number" ? enemy.collisionRadius : 1;
      const lift =
        typeof enemy.spawnElevation === "number"
          ? enemy.spawnElevation
          : Math.max(0.5, radius);
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

  /**
   * Spawn a boss enemy at the specified position (usually map center)
   * Bosses have special spawn animations and behaviors
   */
  spawnBoss(bossType, position, difficulty = 1) {
    const BossClass = this.bossClasses[bossType];
    if (!BossClass) {
      console.error(`Unknown boss type: ${bossType}`);
      return null;
    }

    const spawnPosition = position
      ? position.clone()
      : new THREE.Vector3(0, 0, 0);

    // Bosses spawn at map center, adjust for floor height
    if (this.environment) {
      spawnPosition.y = this.environment.getFloorHeightAt(
        spawnPosition.x,
        spawnPosition.z
      );
    }

    const boss = new BossClass(
      this.scene,
      spawnPosition,
      this.particleSystem,
      difficulty
    );

    if (boss) {
      if (this.environment && typeof boss.setEnvironment === "function") {
        boss.setEnvironment(this.environment);
      }

      const radius =
        typeof boss.collisionRadius === "number" ? boss.collisionRadius : 2;
      const lift =
        typeof boss.spawnElevation === "number"
          ? boss.spawnElevation
          : Math.max(0.5, radius);
      boss.position.y = spawnPosition.y + lift;
      if (boss.group) {
        boss.group.position.copy(boss.position);
      }

      console.log(`Boss spawned: ${boss.bossName} at position`, spawnPosition);
    }

    this.enemies.push(boss);
    return boss;
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

    // Note: Boss spawning is now handled by WaveManager
  }

  update(deltaTime, playerPosition) {
    this.lastPlayerPosition = playerPosition ? playerPosition.clone() : null;

    // OPTIMIZATION: Process spawn queue
    if (this.spawnQueue.length) {
      // Spread queued spawns across frames to avoid hitches
      this.spawnQueue.forEach((request) => {
        request.delay = Math.max(0, request.delay - deltaTime);
      });

      let spawnsThisFrame = 0;
      let availableSlots = Math.max(
        0,
        this.maxActiveEnemies - this.enemies.length
      );
      for (let i = 0; i < this.spawnQueue.length; ) {
        if (spawnsThisFrame >= this.maxSpawnsPerFrame) {
          break;
        }

        if (availableSlots <= 0) {
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
        availableSlots = Math.max(
          0,
          this.maxActiveEnemies - this.enemies.length
        );
      }
    }

    // OPTIMIZATION: Update enemies with distance-based LOD
    const updateBudget = 30; // Max enemies to fully update per frame
    const enemyCount = this.enemies.length;

    if (playerPosition && enemyCount > 0) {
      // Sort enemies by distance to player (closest first)
      const enemiesWithDist = this.enemies.map((enemy) => ({
        enemy,
        distSq: enemy.position.distanceToSquared(playerPosition),
      }));

      // Update all enemies but with reduced updates for distant ones
      for (let i = 0; i < enemyCount; i++) {
        const { enemy, distSq } = enemiesWithDist[i];
        const distance = Math.sqrt(distSq);

        // Full update for close enemies or priority enemies (bosses, attacking)
        if (i < updateBudget || enemy.isBoss || distance < 15) {
          enemy.update(deltaTime, playerPosition);
        } else {
          // Reduced update for distant enemies (every other frame equivalent)
          enemy.update(deltaTime * 0.5, playerPosition);
        }
      }
    } else {
      // No player position, simple update
      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime, playerPosition);
      });
    }

    // OPTIMIZATION: Batch remove dead enemies
    const aliveBefore = this.enemies.length;
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.isDead()) {
        enemy.destroy();
        return false;
      }
      return true;
    });

    // Optional: Track kill count for debugging
    // const killed = aliveBefore - this.enemies.length;
  }

  getEnemies() {
    return this.enemies;
  }

  getActiveEnemyCount() {
    return this.enemies.length;
  }

  hasPendingSpawns() {
    return this.spawnQueue.length > 0;
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

  setMaxActiveEnemies(limit) {
    if (typeof limit === "number" && limit > 0) {
      this.maxActiveEnemies = Math.floor(limit);
    }
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
