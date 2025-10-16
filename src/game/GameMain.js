// Main Game Class - Non-module version
class GameMain {
  constructor() {
    console.log("GameMain constructor called");

    try {
      console.log("Creating scene...");
      this.scene = new THREE.Scene();

      console.log("Creating camera...");
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01, // Reduced near plane for weapon viewmodel
        1000
      );
      this.scene.add(this.camera); // ensure weapon viewmodel renders

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
      console.log("GameMain constructor completed successfully");
    } catch (error) {
      console.error("Error in GameMain constructor:", error);
      throw error;
    }
  }

  init() {
    // Setup camera for FPS (will be controlled by player)
    this.camera.position.set(0, 1.8, 0);

    // Initialize systems
    this.inputManager = new InputManager();
    this.uiManager = new UIManager();
    this.particleSystem = new ParticleSystem(this.scene);
    this.collisionManager = new CollisionManager();

    // Create environment
    this.environment = new Environment(this.scene);

    // Create player (FPS mode - player controls camera)
    this.player = new Player(this.scene, this.camera, this.environment);

    // Create weapon system
    this.weaponManager = new WeaponManager(
      this.scene,
      this.player,
      this.particleSystem
    );

    // Create enemy manager
    this.enemyManager = new EnemyManager(
      this.scene,
      this.particleSystem,
      this.environment
    );

    // Create wave manager
    this.waveManager = new WaveManager(this.enemyManager, this.uiManager);

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
      console.log("🎮 START BUTTON CLICKED!");
      this.startGame();
    });

    console.log("✓ Start button listener attached");

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
    this.inputManager.on("weaponNext", () => this.weaponManager.cycleWeapon(1));
    this.inputManager.on("weaponPrev", () =>
      this.weaponManager.cycleWeapon(-1)
    );

    // Special ability
    this.inputManager.on("special", () => {
      if (this.gameStarted && this.player.useSpecialAbility()) {
        this.handleSpecialAbility();
      }
    });
  }

  startGame() {
    console.log("🚀 startGame() called");

    try {
      console.log("Hiding start screen...");
      document.getElementById("startScreen").style.display = "none";
      document.getElementById("hud").style.display = "block";
      document.getElementById("score").style.display = "block";
      document.getElementById("weaponInfo").style.display = "block";
      document.getElementById("minimap").style.display = "block";
      document.getElementById("crosshair").style.display = "block";

      console.log("Setting game state...");
      this.gameStarted = true;
      this.isRunning = true;
      this.score = 0;

      console.log("Resetting player...");
      this.player.reset();

      console.log("Starting wave...");
      this.waveManager.startWave();
      this.environment.setPhaseByWave(this.waveManager.getCurrentWave());

      console.log("Updating UI...");
      this.uiManager.updateScore(this.score);
      const phaseName = this.environment.getCurrentPhaseName();
      this.uiManager.showMessage(
        `${
          phaseName ? phaseName.toUpperCase() + "<br>" : ""
        }WAVE 1 - GET READY!`,
        2200
      );

      console.log("✅ Game started successfully!");
    } catch (error) {
      console.error("❌ Error starting game:", error);
      alert(
        "Error starting game: " +
          error.message +
          "\n\nCheck console for details."
      );
    }
  }

  handleSpecialAbility() {
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

    this.particleSystem.createShockwave(playerPos, blastRadius, 0x00ffff);
    this.uiManager.showMessage("EMP BLAST!", 1000);
  }

  update(deltaTime) {
    if (!this.isRunning) return;

    const moveInput = this.inputManager.getMoveInput();
    this.player.update(deltaTime, moveInput);

    // In FPS mode, player controls camera position and rotation
    // No need to manually update camera - player does it

    // Shooting with left mouse button (button 0)
    if (this.inputManager.isMouseButtonDown(0) && this.gameStarted) {
      // Fire from weapon muzzle position
      const muzzlePos = this.player.getMuzzlePosition();
      const direction = this.player.getMuzzleDirection();
      this.weaponManager.fire(null, this.camera, muzzlePos, direction);
      this.player.onShoot(); // Trigger weapon recoil animation
    }

    this.weaponManager.update(deltaTime);
    this.enemyManager.update(deltaTime);
    this.environment.update(deltaTime, this.player.getPosition());
    this.particleSystem.update(deltaTime);

    this.checkCollisions();

    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
    this.uiManager.updateEnergy(this.player.energy, this.player.maxEnergy);
    this.uiManager.updateEnemyCount(this.enemyManager.getEnemies().length);
    this.uiManager.updateWave(this.waveManager.getCurrentWave());

    const currentWeapon = this.weaponManager.getCurrentWeapon();
    this.uiManager.updateWeapon(
      currentWeapon.name,
      currentWeapon.getAmmoDisplay()
    );

    if (this.waveManager.update(deltaTime)) {
      this.onWaveComplete();
    }

    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  checkCollisions() {
    const enemies = this.enemyManager.getEnemies();
    const projectiles = this.weaponManager.getProjectiles();
    const playerPos = this.player.getPosition();

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

    enemies.forEach((enemy) => {
      if (this.collisionManager.checkCollision(enemy, this.player)) {
        this.player.takeDamage(enemy.contactDamage);
        this.player.applyKnockback(enemy.getPosition());
        this.particleSystem.createImpact(playerPos, 0xff0000, 15);
      }

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

    this.score += 1000 * waveNumber;
    this.uiManager.updateScore(this.score);

    this.player.health = Math.min(
      this.player.maxHealth,
      this.player.health + 20
    );

    setTimeout(() => {
      if (this.gameStarted) {
        this.waveManager.startWave();
        const phaseChanged = this.environment.setPhaseByWave(
          this.waveManager.getCurrentWave()
        );
        const phaseName = this.environment.getCurrentPhaseName();
        const waveLabel = `WAVE ${this.waveManager.getCurrentWave()} - INCOMING!`;

        if (phaseChanged) {
          this.uiManager.showMessage(
            `${phaseName ? phaseName.toUpperCase() : "NEW SECTOR"} ONLINE`,
            2200
          );
          setTimeout(() => {
            if (!this.gameStarted) return;
            this.uiManager.showMessage(
              `${
                phaseName ? phaseName.toUpperCase() + "<br>" : ""
              }${waveLabel}`,
              2200
            );
          }, 2200);
        } else {
          this.uiManager.showMessage(
            `${phaseName ? phaseName.toUpperCase() + "<br>" : ""}${waveLabel}`,
            2200
          );
        }
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

console.log("✓ GameMain class defined");
