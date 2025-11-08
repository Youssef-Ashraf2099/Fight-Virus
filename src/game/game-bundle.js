// Game Bundle - Non-module version for Electron compatibility
console.log("=== GAME BUNDLE LOADING ===");
console.log("THREE available:", typeof THREE !== "undefined");

// Wait for everything to load
window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, starting game initialization...");

  if (typeof THREE === "undefined") {
    alert("Three.js failed to load!");
    return;
  }

  console.log("Loading game modules...");

  // Load all the game scripts in order
  const scripts = [
    // Systems
    "./systems/CollisionManager.js",
    "./systems/InputManager.js",
    "./systems/UIManager.js",
    "./systems/WaveManager.js",

    // Effects
    "./effects/ParticleSystem.js",

    // Environment
    "./environment/maps/BaseEnvironmentMap.js",
    "./environment/maps/CPUEnvironment.js",
    "./environment/maps/KernelEnvironment.js",
    "./environment/maps/MemoryEnvironment.js",
    "./environment/maps/GPUEnvironment.js",
    "./environment/maps/MotherboardEnvironment.js",
    "./environment/maps/HardDriveEnvironment.js",
    "./environment/maps/FirewallEnvironment.js",
    "./environment/maps/RetroTerminalEnvironment.js",
    "./environment/maps/NetworkHubEnvironment.js",
    "./environment/maps/AINeuralNetworkEnvironment.js",
    "./environment/maps/SystemOverviewEnvironment.js",
    "./environment/Environment.js",

    // Entities
    "./entities/player/PlayerGeometry.js",
    "./entities/player/Player.js",
    "./entities/enemies/BaseEnemy.js",
    "./entities/enemies/types/TrojanVirus.js",
    "./entities/enemies/types/WormVirus.js",
    "./entities/enemies/types/SpywareVirus.js",
    "./entities/enemies/types/RansomwareVirus.js",
    "./entities/enemies/types/AdwareVirus.js",
    "./entities/enemies/types/RootkitVirus.js",
    "./entities/bosses/BaseBoss.js",
    "./entities/bosses/CircuitOverlord.js",
    "./entities/bosses/CorruptionCore.js",
    "./entities/bosses/PixelReaper.js",
    "./entities/bosses/DataWyrm.js",
    "./entities/bosses/LadyBugSentinel.js",
    "./entities/bosses/TrojanHorseColossus.js",
    "./entities/bosses/Noise.js",
    "./entities/bosses/FirewallArchon.js",
    "./entities/bosses/NeuralOvermind.js",
    "./entities/bosses/PacketHydra.js",
    "./entities/enemies/EnemyManager.js",

    // Weapons
    "./weapons/Projectile.js",
    "./weapons/BaseWeapon.js",
    "./weapons/DetailedWeaponModels.js",
    "./weapons/types/PulseCannon.js",
    "./weapons/types/LaserRifle.js",
    "./weapons/types/PlasmaLauncher.js",
    "./weapons/types/ShockwaveEmitter.js",
    "./weapons/WeaponManager.js",

    // Game & Spectator
    "./game/SpectatorCamera.js",
    "./game/PixelCompanion.js",
    "./game/SpectatorMode.js",
    "./game/PuzzleManager.js",
    "./game/UpgradeManager.js",
    "./game/GameMain.js",
  ];

  // Load scripts sequentially
  for (const src of scripts) {
    await loadScript(src);
  }

  console.log("All scripts loaded, initializing game...");

  // Initialize the game
  if (typeof GameMain !== "undefined") {
    try {
      window.game = new GameMain();
      console.log("✓ Game initialized successfully!");
    } catch (error) {
      console.error("✗ Failed to initialize game:", error);
      alert("Failed to initialize game: " + error.message);
    }
  } else {
    alert("GameMain class not found!");
  }
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      console.log("✓ Loaded:", src);
      resolve();
    };
    script.onerror = (error) => {
      console.error("✗ Failed to load:", src, error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}
