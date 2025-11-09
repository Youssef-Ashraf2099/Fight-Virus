// Game initialization module
console.log("=== GAME INIT MODULE LOADING ===");

import * as THREE from "three";
import Player from "../entities/player/Player.js";
import EnemyManager from "../entities/enemies/EnemyManager.js";
import WeaponManager from "../weapons/WeaponManager.js";
import Environment from "../environment/Environment.js";
import ParticleSystem from "../effects/ParticleSystem.js";
import CollisionManager from "../systems/CollisionManager.js";
import InputManager from "../systems/InputManager.js";
import UIManager from "../systems/UIManager.js";
import WaveManager from "../systems/WaveManager.js";

console.log("All modules imported successfully!");
console.log("THREE:", THREE);

// Make THREE globally available
window.THREE = THREE;

class Game {
  constructor() {
    console.log("Game constructor called");

    try {
      console.log("Creating scene...");
      this.scene = new THREE.Scene();

      console.log("Creating camera...");
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      console.log("Getting canvas element...");
      const canvas = document.getElementById("gameCanvas");
      if (!canvas) {
        throw new Error("Canvas element not found!");
      }
      console.log("Canvas found:", canvas);

      console.log("Creating renderer...");
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });

      console.log("Setting up renderer...");
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.clock = new THREE.Clock();
      this.isRunning = false;
      this.gameStarted = false;

      this.score = 0;
      this.difficulty = 1;

      console.log("Calling init()...");
      this.init();
      console.log("Game constructor completed successfully");
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
    this.player = new Player(this.scene, this.camera, this.environment);

    // Create weapon system
    this.weaponManager = new WeaponManager(
      this.scene,
      this.player,
      this.particleSystem,
      this.environment
    );

    // Create enemy manager
    this.enemyManager = new EnemyManager(
      this.scene,
      this.particleSystem,
      this.environment
    );

    // Create wave manager
    this.waveManager = new WaveManager(this.enemyManager, this.uiManager);
    if (typeof this.waveManager.setEnvironment === "function") {
      this.waveManager.setEnvironment(this.environment);
    }

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");

    const startButton = document.getElementById("startButton");
    console.log("Start button element:", startButton);

    if (!startButton) {
      console.error("Start button not found!");
      return;
    }

    startButton.addEventListener("click", () => {
      console.log("START BUTTON CLICKED!");
      this.startGame();
    });

    console.log("Start button listener attached");

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
    console.log("startGame() called");

    try {
      console.log("Hiding start screen...");
      document.getElementById("startScreen").style.display = "none";
      document.getElementById("hud").style.display = "block";
      document.getElementById("score").style.display = "block";
      document.getElementById("weaponInfo").style.display = "block";
      document.getElementById("minimap").style.display = "block";

      console.log("Setting game state...");
      this.gameStarted = true;
      this.isRunning = true;
      this.score = 0;

      console.log("Resetting player...");
      this.player.reset();

      console.log("Starting wave...");
      this.waveManager.startWave();

      console.log("Updating UI...");
      this.uiManager.updateScore(this.score);
      this.uiManager.showMessage("WAVE 1 - GET READY!", 2000);

      console.log("Game started successfully!");
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
    this.uiManager.updateJetpack(this.player.getJetpackTelemetry());
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

    // Check projectile-enemy collisions
    projectiles.forEach((projectile) => {
      enemies.forEach((enemy) => {
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
        }
      });

      // Check enemy projectiles
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

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
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
