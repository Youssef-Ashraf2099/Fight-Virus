/**
 * Unity Export Script - Static Data Version
 *
 * This script exports game data configuration from source code analysis
 * without requiring browser environment to run.
 *
 * Run with: node scripts/export-game-data.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const OUTPUT_DIR = path.join(__dirname, "..", "unity-export", "data");

/**
 * Enemy type data - extracted from source files
 */
const enemyTypes = [
  {
    className: "RansomwareVirus",
    displayName: "Ransomware",
    baseStats: {
      maxHealth: 220,
      speed: 2,
      damage: 28,
      contactDamage: 10,
      collisionRadius: 1.5,
      scoreValue: 200,
    },
    behavior: {
      movementType: "chase",
      attackType: "aoe",
      attackRange: 8,
      detectionRange: 50,
    },
    visuals: {
      color: 0xff6600,
      emissive: 0xff3300,
    },
  },
  {
    className: "TrojanVirus",
    displayName: "Trojan",
    baseStats: {
      maxHealth: 130,
      speed: 2.5,
      damage: 20,
      contactDamage: 8,
      collisionRadius: 1.2,
      scoreValue: 120,
    },
    behavior: {
      movementType: "chase",
      attackType: "melee",
      attackRange: 3,
      detectionRange: 50,
    },
    visuals: {
      color: 0x9900cc,
      emissive: 0x6600cc,
    },
  },
  {
    className: "WormVirus",
    displayName: "Worm",
    baseStats: {
      maxHealth: 100,
      speed: 3.5,
      damage: 15,
      contactDamage: 5,
      collisionRadius: 1.0,
      scoreValue: 100,
    },
    behavior: {
      movementType: "chase",
      attackType: "melee",
      attackRange: 2,
      detectionRange: 60,
    },
    visuals: {
      color: 0x00cc66,
      emissive: 0x00ff88,
    },
  },
  {
    className: "ShieldVirus",
    displayName: "Shield Virus",
    baseStats: {
      maxHealth: 180,
      speed: 1.8,
      damage: 18,
      contactDamage: 8,
      collisionRadius: 1.4,
      scoreValue: 150,
    },
    behavior: {
      movementType: "chase",
      attackType: "melee",
      attackRange: 3,
      detectionRange: 50,
      hasShield: true,
    },
    visuals: {
      color: 0x3399ff,
      emissive: 0x0066ff,
    },
  },
  {
    className: "AdwareVirus",
    displayName: "Adware",
    baseStats: {
      maxHealth: 80,
      speed: 2.8,
      damage: 12,
      contactDamage: 4,
      collisionRadius: 0.9,
      scoreValue: 80,
    },
    behavior: {
      movementType: "swarm",
      attackType: "melee",
      attackRange: 2,
      detectionRange: 45,
    },
    visuals: {
      color: 0xffcc00,
      emissive: 0xff9900,
    },
  },
  {
    className: "RootkitVirus",
    displayName: "Rootkit",
    baseStats: {
      maxHealth: 250,
      speed: 1.5,
      damage: 30,
      contactDamage: 12,
      collisionRadius: 1.8,
      scoreValue: 250,
    },
    behavior: {
      movementType: "tank",
      attackType: "melee",
      attackRange: 4,
      detectionRange: 40,
    },
    visuals: {
      color: 0x990000,
      emissive: 0xcc0000,
    },
  },
  {
    className: "SpywareVirus",
    displayName: "Spyware",
    baseStats: {
      maxHealth: 90,
      speed: 4.0,
      damage: 14,
      contactDamage: 5,
      collisionRadius: 0.8,
      scoreValue: 110,
    },
    behavior: {
      movementType: "stealth",
      attackType: "ranged",
      attackRange: 15,
      detectionRange: 70,
    },
    visuals: {
      color: 0x6600ff,
      emissive: 0x9933ff,
    },
  },
  {
    className: "DroneVirus",
    displayName: "Drone",
    baseStats: {
      maxHealth: 70,
      speed: 3.0,
      damage: 10,
      contactDamage: 3,
      collisionRadius: 0.7,
      scoreValue: 90,
    },
    behavior: {
      movementType: "flying",
      attackType: "ranged",
      attackRange: 20,
      detectionRange: 60,
    },
    visuals: {
      color: 0x00cccc,
      emissive: 0x00ffff,
    },
  },
  {
    className: "BlasterVirus",
    displayName: "Blaster",
    baseStats: {
      maxHealth: 150,
      speed: 2.2,
      damage: 25,
      contactDamage: 10,
      collisionRadius: 1.3,
      scoreValue: 180,
    },
    behavior: {
      movementType: "chase",
      attackType: "ranged",
      attackRange: 25,
      detectionRange: 65,
    },
    visuals: {
      color: 0xff3333,
      emissive: 0xff6666,
    },
  },
];

/**
 * Boss type data - extracted from boss classes
 */
const bossTypes = [
  {
    className: "CircuitOverlord",
    displayName: "Circuit Overlord",
    title: "The First Guardian",
    baseStats: {
      maxHealth: 1500,
      speed: 5,
      damage: 40,
      contactDamage: 20,
      collisionRadius: 7,
      scoreValue: 3000,
    },
    visuals: {
      color: 0x00ffff,
      secondaryColor: 0xff0000,
    },
    behavior: {
      attackType: "hybrid",
      attackRange: 32,
      projectileSpeed: 20,
      spawnElevation: 2,
    },
  },
  {
    className: "CorruptionCore",
    displayName: "Corruption Core",
    title: "The System Destroyer",
    baseStats: {
      maxHealth: 2000,
      speed: 4,
      damage: 60,
      contactDamage: 35,
      collisionRadius: 8,
      scoreValue: 5000,
    },
    visuals: {
      color: 0x000000,
      secondaryColor: 0xff0000,
    },
    behavior: {
      attackType: "hybrid",
      attackRange: 35,
      projectileSpeed: 22,
    },
  },
  {
    className: "DataWyrm",
    displayName: "Data Wyrm",
    title: "Corrupted Guardian of the Mainframe",
    baseStats: {
      maxHealth: 6000,
      speed: 7,
      damage: 45,
      contactDamage: 45,
      collisionRadius: 4,
      scoreValue: 15000,
    },
    visuals: {
      color: 0xff0033,
      secondaryColor: 0x00ffff,
      accentColor: 0x1a1a1a,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 28,
      spawnElevation: 8,
    },
  },
  {
    className: "FirewallArchon",
    displayName: "Firewall Archon",
    title: "Guardian of the Shield Grid",
    baseStats: {
      maxHealth: 2900,
      speed: 5.5,
      damage: 52,
      contactDamage: 26,
      collisionRadius: 4.2,
      scoreValue: 4800,
    },
    visuals: {
      color: 0xff5a1d,
      secondaryColor: 0xffc766,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 26,
      spawnElevation: 1.8,
    },
  },
  {
    className: "LadyBugSentinel",
    displayName: "Ladybug Sentinel",
    title: "Memory Vault Caretaker",
    baseStats: {
      maxHealth: 1400,
      speed: 6.5,
      damage: 35,
      contactDamage: 18,
      collisionRadius: 5.2,
      scoreValue: 3200,
    },
    visuals: {
      color: 0xff3366,
      secondaryColor: 0x38ffd4,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 26,
      spawnElevation: 1.4,
    },
  },
  {
    className: "NeuralOvermind",
    displayName: "Neural Overmind",
    title: "Architect of the Deep Net",
    baseStats: {
      maxHealth: 2500,
      speed: 5.8,
      damage: 44,
      contactDamage: 24,
      collisionRadius: 3.9,
      scoreValue: 4600,
    },
    visuals: {
      color: 0x6af7ff,
      secondaryColor: 0xff6fdc,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 27,
      spawnElevation: 5.2,
    },
  },
  {
    className: "Noise",
    displayName: "Noise",
    title: "Corrupted Data Anomaly",
    baseStats: {
      maxHealth: 2600,
      speed: 6.5,
      damage: 48,
      contactDamage: 28,
      collisionRadius: 4.5,
      scoreValue: 4200,
    },
    visuals: {
      color: 0xff64c8,
      secondaryColor: 0x6f8dff,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 28,
      spawnElevation: 2.6,
    },
  },
  {
    className: "PacketHydra",
    displayName: "Packet Hydra",
    title: "Master of the Network Void",
    baseStats: {
      maxHealth: 2700,
      speed: 6.8,
      damage: 46,
      contactDamage: 24,
      collisionRadius: 4.1,
      scoreValue: 4400,
    },
    visuals: {
      color: 0x4dffe2,
      secondaryColor: 0x2f7dff,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 29,
      spawnElevation: 2.1,
    },
  },
  {
    className: "PixelReaper",
    displayName: "Pixel Reaper",
    title: "Corrupted Rendering Engine",
    baseStats: {
      maxHealth: 9000,
      speed: 8,
      damage: 50,
      contactDamage: 50,
      collisionRadius: 4.5,
      scoreValue: 18000,
    },
    visuals: {
      color: 0xff0088,
      secondaryColor: 0xff00ff,
      accentColor: 0xffee00,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 30,
      spawnElevation: 6,
    },
  },
  {
    className: "TrojanHorseColossus",
    displayName: "Trojan Warhorse",
    title: "Payload Siege Engine",
    baseStats: {
      maxHealth: 2300,
      speed: 4.2,
      damage: 48,
      contactDamage: 28,
      collisionRadius: 6.4,
      scoreValue: 4200,
    },
    visuals: {
      color: 0xffbb55,
      secondaryColor: 0xff7733,
    },
    behavior: {
      attackType: "hybrid",
      projectileSpeed: 22,
      spawnElevation: 1.8,
    },
  },
];

/**
 * Weapon type data - extracted from source files
 */
const weaponTypes = [
  {
    className: "Revolver",
    displayName: "Revolver",
    stats: {
      damage: 25,
      fireRate: 2.5,
      magazineSize: 6,
      reloadTime: 1.5,
      projectileSpeed: 80,
      projectileLifetime: 2,
      spread: 0.02,
    },
    visuals: {
      projectileColor: 0xffff00,
      muzzleFlashColor: 0xffaa00,
      trailLength: 0.5,
    },
  },
  {
    className: "PulseCannon",
    displayName: "Pulse Cannon",
    stats: {
      damage: 15,
      fireRate: 8,
      magazineSize: 40,
      reloadTime: 2.0,
      projectileSpeed: 100,
      projectileLifetime: 1.5,
      spread: 0.03,
    },
    visuals: {
      projectileColor: 0x00ffff,
      muzzleFlashColor: 0x00ccff,
      trailLength: 0.8,
    },
  },
  {
    className: "LaserRifle",
    displayName: "Laser Rifle",
    stats: {
      damage: 20,
      fireRate: 10,
      magazineSize: 30,
      reloadTime: 1.8,
      projectileSpeed: 120,
      projectileLifetime: 1.2,
      spread: 0.01,
    },
    visuals: {
      projectileColor: 0xff0000,
      muzzleFlashColor: 0xff3333,
      trailLength: 1.0,
    },
  },
  {
    className: "PlasmaLauncher",
    displayName: "Plasma Launcher",
    stats: {
      damage: 50,
      fireRate: 1.5,
      magazineSize: 4,
      reloadTime: 3.0,
      projectileSpeed: 40,
      projectileLifetime: 3.0,
      spread: 0.05,
      explosionRadius: 5,
    },
    visuals: {
      projectileColor: 0x00ff00,
      muzzleFlashColor: 0x00ff00,
      trailLength: 1.5,
    },
  },
  {
    className: "ShockwaveEmitter",
    displayName: "Shockwave Emitter",
    stats: {
      damage: 30,
      fireRate: 3,
      magazineSize: 8,
      reloadTime: 2.5,
      projectileSpeed: 60,
      projectileLifetime: 2.5,
      spread: 0.1,
      aoeRadius: 4,
    },
    visuals: {
      projectileColor: 0xcc00ff,
      muzzleFlashColor: 0xff00ff,
      trailLength: 0.3,
    },
  },
  {
    className: "SciFiSword",
    displayName: "Energy Sword",
    stats: {
      damage: 45,
      fireRate: 3,
      magazineSize: -1, // Melee weapon
      reloadTime: 0,
      attackRange: 3,
      attackAngle: 90,
    },
    visuals: {
      bladeColor: 0x00ffff,
      glowColor: 0x0088ff,
    },
  },
  {
    className: "NeonKnife",
    displayName: "Neon Knife",
    stats: {
      damage: 35,
      fireRate: 5,
      magazineSize: -1, // Melee weapon
      reloadTime: 0,
      attackRange: 2,
      attackAngle: 60,
    },
    visuals: {
      bladeColor: 0xff00ff,
      glowColor: 0xff0088,
    },
  },
];

/**
 * Environment data - extracted from source files
 */
const environments = [
  {
    name: "cpu",
    displayName: "CPU Core",
    description: "The central processing unit - where all computation happens",
    baseFloorHeight: 0,
    boundaries: {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    },
    palette: {
      ambient: 0x1a1a3e,
      directional: 0x6666ff,
      accentA: 0x00ffff,
      accentB: 0xff00ff,
      fog: 0x0a0a1e,
      fogDensity: 0.015,
      background: 0x0a0a1e,
    },
    features: [
      "Processing cores",
      "Data pathways",
      "Circuit patterns",
      "Energy flows",
    ],
  },
  {
    name: "kernel",
    displayName: "Kernel Space",
    description: "The core system kernel - critical low-level operations",
    baseFloorHeight: 0,
    boundaries: {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    },
    palette: {
      ambient: 0x1e1a1a,
      directional: 0xff6666,
      accentA: 0xff0000,
      accentB: 0xffaa00,
      fog: 0x1e0a0a,
      fogDensity: 0.018,
      background: 0x1e0a0a,
    },
    features: [
      "System calls",
      "Memory management",
      "Process scheduling",
      "Hardware drivers",
    ],
  },
  {
    name: "memory",
    displayName: "Memory Banks",
    description: "RAM modules - volatile data storage",
    baseFloorHeight: 0,
    boundaries: {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    },
    palette: {
      ambient: 0x1a3e1a,
      directional: 0x66ff66,
      accentA: 0x00ff00,
      accentB: 0x00ffaa,
      fog: 0x0a1e0a,
      fogDensity: 0.012,
      background: 0x0a1e0a,
    },
    features: [
      "Memory cells",
      "Data buses",
      "Cache hierarchy",
      "Address spaces",
    ],
  },
  {
    name: "gpu",
    displayName: "GPU Complex",
    description: "Graphics processing unit - parallel computation powerhouse",
    baseFloorHeight: 0,
    boundaries: {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    },
    palette: {
      ambient: 0x3e1a3e,
      directional: 0xff66ff,
      accentA: 0xff00ff,
      accentB: 0xcc00ff,
      fog: 0x1e0a1e,
      fogDensity: 0.02,
      background: 0x1e0a1e,
    },
    features: [
      "Shader cores",
      "Texture units",
      "Render pipelines",
      "Parallel processing",
    ],
  },
  {
    name: "motherboard",
    displayName: "Motherboard",
    description: "The main circuit board connecting all components",
    baseFloorHeight: 0,
    boundaries: {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    },
    palette: {
      ambient: 0x1a2e3e,
      directional: 0x66aaff,
      accentA: 0x00aaff,
      accentB: 0x00ffff,
      fog: 0x0a1a1e,
      fogDensity: 0.014,
      background: 0x0a1a1e,
    },
    features: [
      "PCB traces",
      "Connection buses",
      "Component sockets",
      "Power distribution",
    ],
  },
];

/**
 * Game metadata
 */
const metadata = {
  gameName: "Fight Virus",
  version: "1.0",
  engine: "Three.js WebGL",
  targetEngine: "Unity",
  exportDate: new Date().toISOString(),
  description:
    "A cybersecurity-themed shooter where you fight viruses inside a computer system",
};

/**
 * Save export data to files
 */
async function exportGameData() {
  console.log("🚀 Starting Unity Export...\n");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  try {
    // Save enemy types
    const enemyFile = path.join(OUTPUT_DIR, "enemy_types.json");
    fs.writeFileSync(enemyFile, JSON.stringify(enemyTypes, null, 2));
    console.log(`✅ Saved ${enemyTypes.length} enemy types → enemy_types.json`);

    // Save boss types
    const bossFile = path.join(OUTPUT_DIR, "boss_types.json");
    fs.writeFileSync(bossFile, JSON.stringify(bossTypes, null, 2));
    console.log(`✅ Saved ${bossTypes.length} boss types → boss_types.json`);

    // Save weapon types
    const weaponFile = path.join(OUTPUT_DIR, "weapon_types.json");
    fs.writeFileSync(weaponFile, JSON.stringify(weaponTypes, null, 2));
    console.log(
      `✅ Saved ${weaponTypes.length} weapon types → weapon_types.json`,
    );

    // Save environments
    const envFile = path.join(OUTPUT_DIR, "environments.json");
    fs.writeFileSync(envFile, JSON.stringify(environments, null, 2));
    console.log(
      `✅ Saved ${environments.length} environments → environments.json`,
    );

    // Save combined export
    const combinedData = {
      metadata,
      enemyTypes,
      bossTypes,
      weaponTypes,
      environments,
    };
    const combinedFile = path.join(OUTPUT_DIR, "game_export.json");
    fs.writeFileSync(combinedFile, JSON.stringify(combinedData, null, 2));
    console.log(`✅ Saved combined export → game_export.json`);

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 EXPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Enemy Types:   ${enemyTypes.length}`);
    console.log(`Boss Types:    ${bossTypes.length}`);
    console.log(`Weapon Types:  ${weaponTypes.length}`);
    console.log(`Environments:  ${environments.length}`);
    console.log("=".repeat(60));
    console.log("\n✅ Export completed successfully!");
    console.log(`📁 Output folder: ${OUTPUT_DIR}`);
    console.log("\n📖 Next steps:");
    console.log("1. Copy the 'unity-export/data' folder to your Unity project");
    console.log("2. Place JSON files in Assets/ImportedData/");
    console.log("3. Follow instructions in unity-export/UNITY_IMPORT_GUIDE.md");
    console.log("4. Use the provided C# scripts to import the data");
    console.log(
      "\n💡 Note: This export contains game logic data (stats, configs).",
    );
    console.log(
      "   You'll need to create 3D models in Unity for visual assets.",
    );
  } catch (error) {
    console.error("\n❌ Export failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run export
exportGameData();
