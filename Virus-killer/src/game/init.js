// Game initialization module
// Lightweight debug flag - set to true only when debugging to avoid log overhead
const DEBUG = false;
const SHOW_FPS = true; // set to true to display FPS overlay
const dbg = (...args) => {
  if (DEBUG) console.log(...args);
};

dbg("=== GAME INIT MODULE LOADING ===");

import * as THREE from "../lib/three.module.js";
import { Player } from "../entities/player/Player.js";
import { EnemyManager } from "../entities/enemies/EnemyManager.js";
import { WeaponManager } from "../weapons/WeaponManager.js";
import { Environment } from "../environment/Environment.js";
import { ParticleSystem } from "../effects/ParticleSystem.js";
import { CollisionManager } from "../systems/CollisionManager.js";
import { InputManager } from "../systems/InputManager.js";
import { UIManager } from "../systems/UIManager.js";
import { WaveManager } from "../systems/WaveManager.js";

dbg("All modules imported successfully!");
dbg("THREE:", THREE);

// Make THREE globally available
window.THREE = THREE;

// Diagnostic flag to print WebGL/renderer info to console
const DIAGNOSTIC = true;

class Game {
  constructor() {
    dbg("Game constructor called");

    try {
      dbg("Creating scene...");
      this.scene = new THREE.Scene();

      dbg("Creating camera...");
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      dbg("Getting canvas element...");
      const canvas = document.getElementById("gameCanvas");
      if (!canvas) {
        throw new Error("Canvas element not found!");
      }
      dbg("Canvas found:", canvas);

      dbg("Creating renderer...");
      // Reduce expensive features by default for better perf during testing
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false, // disable antialias to reduce GPU cost
      });

      dbg("Setting up renderer...");
      // Cap pixel ratio to avoid huge render targets on HiDPI displays
      const cappedPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      this.renderer.setPixelRatio(cappedPixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      // Disable shadows initially (can be enabled behind a quality setting)
      if (this.renderer.shadowMap) this.renderer.shadowMap.enabled = false;

      // Diagnostic: print GL renderer/vendor/version and three.js info
      if (DIAGNOSTIC) {
        try {
          const gl = this.renderer.getContext();
          const dbgLines = [];
          dbgLines.push("--- WEBGL DIAGNOSTIC ---");
          if (gl) {
            const vendor = gl.getParameter(gl.VENDOR);
            const rendererStr = gl.getParameter(gl.RENDERER);
            const version = gl.getParameter(gl.VERSION);
            dbgLines.push(`GL VENDOR: ${vendor}`);
            dbgLines.push(`GL RENDERER: ${rendererStr}`);
            dbgLines.push(`GL VERSION: ${version}`);
          } else {
            dbgLines.push("No WebGL context available");
          }
          if (this.renderer && this.renderer.info) {
            dbgLines.push("THREE.INFO:", JSON.stringify(this.renderer.info));
          }
          dbgLines.push("------------------------");
          dbgLines.forEach((l) => console.log(l));
        } catch (e) {
          console.warn("WebGL diagnostic failed:", e);
        }
      }

      this.clock = new THREE.Clock();
      this.isRunning = false;
      this.gameStarted = false;

      // Bind animation method once to avoid per-frame closure allocation
      this._boundAnimate = this.animate.bind(this);

      // FPS overlay (lightweight)
      if (SHOW_FPS) {
        try {
          this._fpsEl = document.createElement("div");
          this._fpsEl.style.cssText =
            "position:fixed;left:8px;top:8px;padding:6px 10px;background:rgba(0,0,0,0.6);color:#0f0;font-family:monospace;z-index:99999;border:1px solid rgba(0,255,136,0.2);";
          this._fpsEl.textContent = "FPS: --";
          document.body.appendChild(this._fpsEl);

          this._fpsFrames = 0;
          this._fpsLast = performance.now();
          this._fpsLastUpdate = this._fpsLast;
          this._fpsTick = () => {
            this._fpsFrames++;
            const now = performance.now();
            if (now - this._fpsLastUpdate >= 1000) {
              const fps = Math.round(
                (this._fpsFrames * 1000) / (now - this._fpsLastUpdate)
              );
              this._fpsEl.textContent = `FPS: ${fps}`;
              this._fpsFrames = 0;
              this._fpsLastUpdate = now;
            }
          };
        } catch (e) {
          // ignore DOM errors
          this._fpsTick = null;
        }
      } else {
        this._fpsTick = null;
      }

      this.score = 0;
      this.difficulty = 1;

      dbg("Calling init()...");
      this.init();
      dbg("Game constructor completed successfully");
    } catch (error) {
      console.error("Error in Game constructor:", error);
      throw error;
    }
  }

  init() {
    // Setup camera
    this.camera.position.set(0, 25, 30);
    this.camera.lookAt(0, 0, 0);

    // Initialize systems
    this.inputManager = new InputManager();
    this.uiManager = new UIManager();
    this.particleSystem = new ParticleSystem(this.scene);
    this.collisionManager = new CollisionManager();

    // Create environment
    this.environment = new Environment(this.scene);

    // Create player
    this.player = new Player(this.scene, this.camera);

    // Create weapon system
    this.weaponManager = new WeaponManager(
      this.scene,
      this.player,
      this.particleSystem
    );

    // Create enemy manager
    this.enemyManager = new EnemyManager(this.scene, this.particleSystem);

    // Create wave manager
    this.waveManager = new WaveManager(this.enemyManager, this.uiManager);

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  setupEventListeners() {
    dbg("Setting up event listeners...");

    const startButton = document.getElementById("startButton");
    dbg("Start button element:", startButton);

    if (!startButton) {
      console.error("Start button not found!");
      return;
    }

    startButton.addEventListener("click", () => {
      dbg("START BUTTON CLICKED!");
      this.startGame();
    });

    dbg("Start button listener attached");

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Weapon switching
    this.inputManager.on("weapon1", () => this.weaponManager.switchWeapon(0));
    this.inputManager.on("weapon2", () => this.weaponManager.switchWeapon(1));
    this.inputManager.on("weapon3", () => this.weaponManager.switchWeapon(2));
    this.inputManager.on("weapon4", () => this.weaponManager.switchWeapon(3));

    // Special ability
    this.inputManager.on("special", () => {
      if (this.gameStarted && this.player.useSpecialAbility()) {
        this.handleSpecialAbility();
      }
    });
  }

  startGame() {
    dbg("startGame() called");

    try {
      dbg("Hiding start screen...");
      document.getElementById("startScreen").style.display = "none";
      document.getElementById("hud").style.display = "block";
      document.getElementById("score").style.display = "block";
      document.getElementById("weaponInfo").style.display = "block";
      document.getElementById("minimap").style.display = "block";

      dbg("Setting game state...");
      this.gameStarted = true;
      this.isRunning = true;
      this.score = 0;

      dbg("Resetting player...");
      this.player.reset();

      dbg("Starting wave...");
      this.waveManager.startWave();

      dbg("Updating UI...");
      this.uiManager.updateScore(this.score);
      this.uiManager.showMessage("WAVE 1 - GET READY!", 2000);

      dbg("Game started successfully!");
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game: " + error.message);
    }
  }

  handleSpecialAbility() {
    // EMP blast that damages all nearby enemies
    const enemies = this.enemyManager.getEnemies();
    const playerPos = this.player.getPosition();
    const blastRadius = 15;

    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < blastRadius) {
        enemy.takeDamage(50);
        this.particleSystem.createExplosion(enemyPos, 0x00ffff, 20);
      }
    });

    // Visual effect
    this.particleSystem.createShockwave(playerPos, blastRadius, 0x00ffff);
    this.uiManager.showMessage("EMP BLAST!", 1000);
  }

  update(deltaTime) {
    if (!this.isRunning) return;

    // Update player
    const moveInput = this.inputManager.getMoveInput();
    this.player.update(deltaTime, moveInput);

    // Update camera to follow player
    const playerPos = this.player.getPosition();
    this.camera.position.x = playerPos.x;
    this.camera.position.z = playerPos.z + 30;
    this.camera.lookAt(playerPos.x, 0, playerPos.z);

    // Handle shooting
    if (this.inputManager.isMouseDown() && this.gameStarted) {
      const mousePos = this.inputManager.getMousePosition();
      this.weaponManager.fire(mousePos, this.camera);
    }

    // Update weapons and projectiles
    this.weaponManager.update(deltaTime);

    // Update enemies
    this.enemyManager.update(deltaTime);

    // Update environment
    this.environment.update(deltaTime);

    // Update particles
    this.particleSystem.update(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Update UI
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
    this.uiManager.updateEnergy(this.player.energy, this.player.maxEnergy);
    this.uiManager.updateEnemyCount(this.enemyManager.getEnemies().length);
    this.uiManager.updateWave(this.waveManager.getCurrentWave());

    const currentWeapon = this.weaponManager.getCurrentWeapon();
    this.uiManager.updateWeapon(
      currentWeapon.name,
      currentWeapon.getAmmoDisplay()
    );

    // Check wave completion
    if (this.waveManager.update(deltaTime)) {
      this.onWaveComplete();
    }

    // Check game over
    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  checkCollisions() {
    const enemies = this.enemyManager.getEnemies();
    const projectiles = this.weaponManager.getProjectiles();
    const playerPos = this.player.getPosition();

    // Build spatial index for enemies for faster nearby queries
    try {
      this.collisionManager.buildIndex(enemies);
    } catch (e) {
      // if indexing fails, fall back to brute-force
      dbg("Collision index build failed, falling back to brute-force", e);
    }

    // Check projectile-enemy collisions using spatial queries
    projectiles.forEach((projectile) => {
      const projPos = projectile.getPosition();
      // query nearby enemies within a reasonable radius (projectile collision radius + max enemy radius)
      const nearby = this.collisionManager.queryNearby(
        projPos,
        projectile.collisionRadius + 50
      );

      for (const enemy of nearby) {
        if (this.collisionManager.checkCollision(projectile, enemy)) {
          enemy.takeDamage(projectile.damage);
          this.particleSystem.createImpact(
            projectile.mesh.position,
            projectile.color,
            10
          );
          projectile.destroy();

          if (enemy.health <= 0) {
            this.onEnemyKilled(enemy);
          }

          // projectile destroyed — stop checking further
          break;
        }
      }

      // Check enemy projectiles (brute force for now)
      enemies.forEach((enemy) => {
        if (enemy.getProjectiles) {
          enemy.getProjectiles().forEach((enemyProjectile) => {
            if (
              this.collisionManager.checkCollision(projectile, enemyProjectile)
            ) {
              this.particleSystem.createExplosion(
                projectile.mesh.position,
                0xffff00,
                15
              );
              projectile.destroy();
              enemyProjectile.destroy();
            }
          });
        }
      });
    });

    // Check enemy-player collisions
    enemies.forEach((enemy) => {
      if (this.collisionManager.checkCollision(enemy, this.player)) {
        this.player.takeDamage(enemy.contactDamage);
        this.player.applyKnockback(enemy.getPosition());
        this.particleSystem.createImpact(playerPos, 0xff0000, 15);
      }

      // Check enemy projectiles hitting player
      if (enemy.getProjectiles) {
        enemy.getProjectiles().forEach((enemyProjectile) => {
          if (
            this.collisionManager.checkCollision(enemyProjectile, this.player)
          ) {
            this.player.takeDamage(enemyProjectile.damage);
            this.particleSystem.createImpact(playerPos, 0xff0000, 10);
            enemyProjectile.destroy();
          }
        });
      }
    });
  }

  onEnemyKilled(enemy) {
    this.score += enemy.scoreValue;
    this.uiManager.updateScore(this.score);
    this.particleSystem.createExplosion(enemy.getPosition(), enemy.color, 30);
    this.enemyManager.removeEnemy(enemy);
  }

  onWaveComplete() {
    this.difficulty += 0.2;
    const waveNumber = this.waveManager.getCurrentWave();

    this.uiManager.showMessage(`WAVE ${waveNumber} COMPLETE!`, 2000);

    // Bonus score
    this.score += 1000 * waveNumber;
    this.uiManager.updateScore(this.score);

    // Heal player slightly
    this.player.health = Math.min(
      this.player.maxHealth,
      this.player.health + 20
    );

    // Start next wave after delay
    setTimeout(() => {
      if (this.gameStarted) {
        this.waveManager.startWave();
        this.uiManager.showMessage(
          `WAVE ${this.waveManager.getCurrentWave()} - INCOMING!`,
          2000
        );
      }
    }, 3000);
  }

  gameOver() {
    this.isRunning = false;
    this.gameStarted = false;

    this.uiManager.showMessage(
      `GAME OVER<br>FINAL SCORE: ${this.score}<br><small>Refresh to play again</small>`,
      0
    );

    // Stop all systems
    this.enemyManager.clear();
    this.weaponManager.clear();
  }

  // Stable animation loop: avoid creating a new closure every frame
  animate() {
    // schedule next frame
    this._rafId = requestAnimationFrame(this._boundAnimate);

    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);

    // update FPS monitor if enabled
    if (this._fpsTick) this._fpsTick();
  }
}

// Initialize game when DOM is ready
console.log("Waiting for DOM...");
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Creating Game...");
  try {
    const game = new Game();
    window.game = game; // Make accessible for debugging
    console.log("✓ Game created successfully!");
  } catch (error) {
    console.error("✗ Failed to create game:", error);
    alert("Failed to initialize game: " + error.message);
  }
});
