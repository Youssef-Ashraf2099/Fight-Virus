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

      // Overlay canvas for 2D health bars
      console.log("Initializing health bar canvas...");
      this.healthBarCanvas = document.getElementById("healthBarCanvas");
      if (this.healthBarCanvas) {
        this.healthBarCanvas.width = window.innerWidth;
        this.healthBarCanvas.height = window.innerHeight;
        this.healthBarContext = this.healthBarCanvas.getContext("2d");
        console.log("✓ Health bar canvas ready");
      } else {
        console.warn("⚠️ Health bar canvas not found");
      }

      this.loadingOverlay = document.getElementById("loadingOverlay");
      this.loadingTitle = document.getElementById("loadingTitle");
      this.loadingMessage = document.getElementById("loadingMessage");

      this.clock = new THREE.Clock();
      this.isRunning = false;
      this.gameStarted = false;
      this.spectatorMode = null;

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

    // Create spectator mode
    this.spectatorMode = new SpectatorMode(
      this.scene,
      this.camera,
      this.inputManager,
      this.environment
    );

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");

    const startButton = document.getElementById("startButton");
    const spectatorButton = document.getElementById("spectatorButton");
    console.log("Start button element:", startButton);
    console.log("Spectator button element:", spectatorButton);

    if (!startButton) {
      console.error("Start button not found!");
      return;
    }

    startButton.addEventListener("click", () => {
      console.log("🎮 START BUTTON CLICKED!");
      this.startGame();
    });

    if (spectatorButton) {
      spectatorButton.addEventListener("click", () => {
        console.log("👁️ SPECTATOR BUTTON CLICKED!");
        this.startSpectatorMode();
      });
    }

    console.log("✓ Button listeners attached");

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.healthBarCanvas) {
        this.healthBarCanvas.width = window.innerWidth;
        this.healthBarCanvas.height = window.innerHeight;
      }
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

    // Restart game
    this.inputManager.on("restart", () => {
      if (!this.isRunning && !this.gameStarted) {
        this.restartGame();
      }
    });
  }

  startGame() {
    console.log("🚀 startGame() called");

    this.showLoadingOverlay(
      "DEPLOYING GUARDIAN",
      "Calibrating weapon systems and uplinking environment..."
    );

    setTimeout(() => {
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
        this.environment.setInteractiveMode(true);

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
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
  }

  startSpectatorMode() {
    console.log("👁️ startSpectatorMode() called");

    this.showLoadingOverlay(
      "SPECTATOR MODE",
      "Preparing sandbox environments for exploration..."
    );

    setTimeout(() => {
      try {
        console.log("Hiding start screen...");
        document.getElementById("startScreen").style.display = "none";

        // Hide all game UI
        document.getElementById("hud").style.display = "none";
        document.getElementById("score").style.display = "none";
        document.getElementById("weaponInfo").style.display = "none";
        document.getElementById("minimap").style.display = "none";
        document.getElementById("crosshair").style.display = "none";

        console.log("Setting spectator state...");
        this.gameStarted = false;
        this.isRunning = false;

        console.log("Starting spectator mode...");
        this.spectatorMode.start();

        console.log("✅ Spectator mode started successfully!");
      } catch (error) {
        console.error("❌ Error starting spectator mode:", error);
        alert(
          "Error starting spectator mode: " +
            error.message +
            "\n\nCheck console for details."
        );
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
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
    // Update spectator mode if active
    if (this.spectatorMode && this.spectatorMode.isActive()) {
      this.spectatorMode.update(deltaTime);
      return; // Skip game updates in spectator mode
    }

    if (!this.isRunning) return;

    const moveInput = this.inputManager.getMoveInput();
    this.player.update(deltaTime, moveInput);

    const playerPosition = this.player.getPosition();

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
    this.enemyManager.update(deltaTime, playerPosition);
    this.environment.update(deltaTime, playerPosition);
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

    // Update minimap
    this.uiManager.updateMinimap(
      playerPosition,
      this.enemyManager.getEnemies(),
      this.environment.getCurrentPhaseName()
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
      const enemyPos = enemy.getPosition();
      const currentPlayerPos = this.player.getPosition();
      const minDistance = enemy.collisionRadius + this.player.collisionRadius;
      const distance = enemyPos.distanceTo(currentPlayerPos);

      if (distance < minDistance) {
        // Direction away from enemy (ignore vertical to prevent lift)
        let direction = new THREE.Vector3().subVectors(
          currentPlayerPos,
          enemyPos
        );

        if (direction.lengthSq() < 0.0001) {
          direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        }

        direction.y = 0; // keep on horizontal plane
        direction.normalize();

        const overlap = minDistance - distance;
        const pushbackStrength = Math.max(overlap * 1.8, 0.45);
        const pushbackVector = direction
          .clone()
          .multiplyScalar(pushbackStrength);

        // Physically separate the player immediately
        this.player.position.add(pushbackVector);
        this.camera.position.add(pushbackVector);

        // Ensure player stays grounded
        if (this.player.environment) {
          const groundHeight = this.player.environment.getFloorHeightAt(
            this.player.position.x,
            this.player.position.z
          );
          this.player.position.y = groundHeight + this.player.height;
          this.camera.position.y = this.player.position.y;
        }

        // Push enemy back slightly so it doesn't keep overlapping
        if (enemy.position) {
          enemy.position.add(direction.clone().multiplyScalar(-overlap * 0.4));
          if (enemy.group) {
            enemy.group.position.copy(enemy.position);
          }
        }

        // Add strong knockback to velocity for continued separation
        this.player.applyKnockback(direction.clone(), 9 + overlap * 8);

        // Apply contact damage (invulnerability frames handled by player)
        this.player.takeDamage(enemy.contactDamage);
        this.particleSystem.createImpact(
          this.player.getPosition(),
          0xff0000,
          15
        );
      }

      if (enemy.getProjectiles) {
        enemy.getProjectiles().forEach((enemyProjectile) => {
          if (
            this.collisionManager.checkCollision(enemyProjectile, this.player)
          ) {
            this.player.takeDamage(enemyProjectile.damage);
            this.particleSystem.createImpact(
              this.player.getPosition(),
              0xff0000,
              10
            );
            enemyProjectile.destroy();
          }
        });
      }

      if (enemy.attackType === "aoe" && enemy.behaviorState === "attacking") {
        const aoeResult = enemy.performAOEAttack(currentPlayerPos);
        if (aoeResult && aoeResult.type === "aoe") {
          const aoeDistance = enemyPos.distanceTo(currentPlayerPos);
          if (aoeDistance <= aoeResult.radius) {
            this.player.takeDamage(aoeResult.damage);
            this.particleSystem.createExplosion(enemyPos, enemy.color, 30);
          }
        }
      }
    });

    // Prevent enemies from stacking by separating overlapping pairs
    for (let i = 0; i < enemies.length; i++) {
      const enemyA = enemies[i];
      const posA = enemyA.getPosition();
      for (let j = i + 1; j < enemies.length; j++) {
        const enemyB = enemies[j];
        const posB = enemyB.getPosition();
        const minEnemyDistance =
          enemyA.collisionRadius + enemyB.collisionRadius;
        const enemyDistance = posA.distanceTo(posB);

        if (enemyDistance < minEnemyDistance && enemyDistance > 0.05) {
          const overlap = minEnemyDistance - enemyDistance;
          const separationDir = new THREE.Vector3()
            .subVectors(posA, posB)
            .normalize();
          const separationAmount = overlap * 0.35;

          enemyA.position.add(
            separationDir.clone().multiplyScalar(separationAmount)
          );
          enemyB.position.add(
            separationDir.clone().multiplyScalar(-separationAmount)
          );

          if (enemyA.group) enemyA.group.position.copy(enemyA.position);
          if (enemyB.group) enemyB.group.position.copy(enemyB.position);

          posA.copy(enemyA.position);
          posB.copy(enemyB.position);
        }
      }
    }
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
      `GAME OVER<br>FINAL SCORE: ${this.score}<br><small>Press R to Restart</small>`,
      0
    );

    this.enemyManager.clear();
    this.weaponManager.clear();
  }

  restartGame() {
    console.log("🔄 Restarting game...");

    this.showLoadingOverlay(
      "REINITIALIZING",
      "Resetting wave manager and respawning systems..."
    );

    try {
      // Clear existing game state
      this.enemyManager.clear();
      this.weaponManager.clear();
      this.uiManager.hideMessage();

      // Reset score and difficulty
      this.score = 0;
      this.difficulty = 1;

      // Reset player
      this.player.reset();

      // Reset weapon manager
      this.weaponManager.switchWeapon(0); // Switch back to first weapon

      // Reset environment to first phase
      this.environment.setPhase(0);

      // Reset wave manager
      this.waveManager.reset();

      // Start game
      this.gameStarted = true;
      this.isRunning = true;

      // Start first wave
      this.waveManager.startWave();
      this.environment.setPhaseByWave(this.waveManager.getCurrentWave());

      // Update UI
      this.uiManager.updateScore(this.score);
      const phaseName = this.environment.getCurrentPhaseName();
      this.uiManager.showMessage(
        `${
          phaseName ? phaseName.toUpperCase() + "<br>" : ""
        }WAVE 1 - GET READY!`,
        2200
      );

      console.log("✅ Game restarted successfully!");
    } catch (error) {
      console.error("❌ Error restarting game:", error);
      alert("Error restarting game: " + error.message);
    } finally {
      setTimeout(() => this.hideLoadingOverlay(), 80);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);

    // Overlay health bars after 3D render
    if (this.healthBarCanvas && this.healthBarContext) {
      const ctx = this.healthBarContext;
      const canvas = this.healthBarCanvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const enemies = this.enemyManager ? this.enemyManager.getEnemies() : [];
      if (enemies && enemies.length) {
        enemies.forEach((enemy) => {
          this.uiManager.renderEnemyHealthBar(enemy, this.camera, ctx, canvas);
        });

        const activeBoss = enemies.find((enemy) => enemy.isBoss && enemy.alive);
        if (activeBoss) {
          this.uiManager.renderBossHealthBar(activeBoss, ctx, canvas);
        }
      }
    }
  }

  showLoadingOverlay(title, message) {
    if (!this.loadingOverlay) return;
    if (this.loadingTitle && title) {
      this.loadingTitle.textContent = title;
    }
    if (this.loadingMessage && message) {
      this.loadingMessage.textContent = message;
    }
    this.loadingOverlay.style.display = "flex";
  }

  hideLoadingOverlay() {
    if (!this.loadingOverlay) return;
    this.loadingOverlay.style.display = "none";
  }
}

console.log("✓ GameMain class defined");
