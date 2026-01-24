import UnityExporter from "./utils/UnityExporter.js";

// Import enemy types
import RansomwareVirus from "../src/entities/enemies/types/RansomwareVirus.js";
import TrojanVirus from "../src/entities/enemies/types/TrojanVirus.js";
import WormVirus from "../src/entities/enemies/types/WormVirus.js";
import ShieldVirus from "../src/entities/enemies/types/ShieldVirus.js";
import AdwareVirus from "../src/entities/enemies/types/AdwareVirus.js";
import RootkitVirus from "../src/entities/enemies/types/RootkitVirus.js";
import SpywareVirus from "../src/entities/enemies/types/SpywareVirus.js";
import DroneVirus from "../src/entities/enemies/types/DroneVirus.js";
import BlasterVirus from "../src/entities/enemies/types/BlasterVirus.js";

// Import weapon types
import Revolver from "../src/weapons/types/Revolver.js";
import PulseCannon from "../src/weapons/types/PulseCannon.js";
import LaserRifle from "../src/weapons/types/LaserRifle.js";
import PlasmaLauncher from "../src/weapons/types/PlasmaLauncher.js";
import ShockwaveEmitter from "../src/weapons/types/ShockwaveEmitter.js";
import SciFiSword from "../src/weapons/types/SciFiSword.js";
import NeonKnife from "../src/weapons/types/NeonKnife.js";

// Import environments
import CPUEnvironment from "../src/environment/maps/CPUEnvironment.js";
import KernelEnvironment from "../src/environment/maps/KernelEnvironment.js";
import MemoryEnvironment from "../src/environment/maps/MemoryEnvironment.js";
import GPUEnvironment from "../src/environment/maps/GPUEnvironment.js";
import MotherboardEnvironment from "../src/environment/maps/MotherboardEnvironment.js";

/**
 * Unity Export Script
 *
 * This script exports all game data to Unity-compatible JSON format.
 * Run with: node export-to-unity.js
 *
 * Output: ./unity-export/data/ folder with JSON files
 */

async function exportGameToUnity() {
  console.log("🚀 Starting Unity Export Process...\n");

  const exporter = new UnityExporter("./unity-export/data");

  // Set metadata
  exporter.setMetadata("gameName", "Fight Virus");
  exporter.setMetadata("version", "1.0");
  exporter.setMetadata("engine", "Three.js");
  exporter.setMetadata("targetEngine", "Unity");

  try {
    // ===== EXPORT ENEMY TYPES =====
    console.log("📦 Exporting enemy types...");
    const enemyTypes = [
      RansomwareVirus,
      TrojanVirus,
      WormVirus,
      ShieldVirus,
      AdwareVirus,
      RootkitVirus,
      SpywareVirus,
      DroneVirus,
      BlasterVirus,
    ];

    enemyTypes.forEach((EnemyClass) => {
      try {
        exporter.exportEnemyType(EnemyClass);
        console.log(`  ✅ Exported: ${EnemyClass.name}`);
      } catch (err) {
        console.warn(`  ⚠️ Failed to export ${EnemyClass.name}:`, err.message);
      }
    });

    // ===== EXPORT WEAPON TYPES =====
    console.log("\n🔫 Exporting weapon types...");
    const weaponTypes = [
      Revolver,
      PulseCannon,
      LaserRifle,
      PlasmaLauncher,
      ShockwaveEmitter,
      SciFiSword,
      NeonKnife,
    ];

    weaponTypes.forEach((WeaponClass) => {
      try {
        exporter.exportWeaponType(WeaponClass);
        console.log(`  ✅ Exported: ${WeaponClass.name}`);
      } catch (err) {
        console.warn(`  ⚠️ Failed to export ${WeaponClass.name}:`, err.message);
      }
    });

    // ===== EXPORT ENVIRONMENTS =====
    console.log("\n🗺️  Exporting environments...");

    // Create temporary scene for environment export
    const THREE = await import("three");
    const tempScene = new THREE.Scene();

    const environmentConfigs = [
      { Class: CPUEnvironment, name: "cpu" },
      { Class: KernelEnvironment, name: "kernel" },
      { Class: MemoryEnvironment, name: "memory" },
      { Class: GPUEnvironment, name: "gpu" },
      { Class: MotherboardEnvironment, name: "motherboard" },
    ];

    for (const config of environmentConfigs) {
      try {
        console.log(`  🏗️  Building ${config.name}...`);

        // Create temporary environment instance
        const envInstance = new config.Class({
          scene: tempScene,
          mapGroup: new THREE.Group(),
        });

        // Build the environment
        const mapGroup = new THREE.Group();
        envInstance.build(mapGroup);

        // Export the environment
        exporter.exportEnvironment(envInstance, config.name);

        console.log(
          `  ✅ Exported: ${config.name} (${mapGroup.children.length} objects)`,
        );

        // Clean up
        mapGroup.clear();
      } catch (err) {
        console.warn(`  ⚠️ Failed to export ${config.name}:`, err.message);
      }
    }

    // ===== SAVE ALL DATA =====
    console.log("\n💾 Saving export files...");
    const result = await exporter.saveToFiles();

    // ===== SUMMARY =====
    console.log("\n" + "=".repeat(50));
    console.log("📊 EXPORT SUMMARY");
    console.log("=".repeat(50));
    console.log(`Meshes:       ${result.meshCount}`);
    console.log(`Materials:    ${result.materialCount}`);
    console.log(`GameObjects:  ${result.gameObjectCount}`);
    console.log(`Enemy Types:  ${result.enemyTypeCount}`);
    console.log(`Weapon Types: ${result.weaponTypeCount}`);
    console.log(`Environments: ${result.environmentCount}`);
    console.log("=".repeat(50));
    console.log("\n✅ Export completed successfully!");
    console.log(`📁 Output folder: ${exporter.outputDir}`);
    console.log("\n📖 Next steps:");
    console.log("1. Copy the 'unity-export/data' folder to your Unity project");
    console.log("2. Follow the instructions in UNITY_IMPORT_GUIDE.md");
    console.log("3. Use the provided C# scripts to import the data");
  } catch (error) {
    console.error("\n❌ Export failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the export
if (import.meta.url === `file://${process.argv[1]}`) {
  exportGameToUnity().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export default exportGameToUnity;
