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
      this.awaitingUpgradeSelection = false;
      this.awaitingPuzzleResolution = false;
      this.pendingNextWaveTimeout = null;
      this.puzzleManager = null;

      this.backgroundMusicTracks = [
        "../Assets/sounds/game/edm-gaming-music-335408.mp3",
        "../Assets/sounds/game/energy-gaming-electro-trap-301124.mp3",
        "../Assets/sounds/game/fast-chiptune-for-gaming-videos-253097 (1).mp3",
        "../Assets/sounds/game/gaming-game-minecraft-background-music-278382.mp3",
        "../Assets/sounds/game/level-up-energetic-gaming-rock-music-251284.mp3",
        "../Assets/sounds/game/neon-gaming-128925.mp3",
        "../Assets/sounds/game/neon-overdrive-cyberpunk-gaming-edm-415723.mp3",
        "../Assets/sounds/game/retro-retro-synthwave-gaming-music-270173.mp3",
        "../Assets/sounds/game/ultimate-gaming-soundtrack-for-legends_astronaut-272122.mp3",
      ];
      this.backgroundMusicElements = [];
      this.backgroundMusicIndex = 0;
      this.activeBackgroundAudio = null;
      this.shouldLoopBackgroundMusic = false;
      this.backgroundMusicVolume = 0.3;

      this.setupBackgroundMusic();

      console.log("Calling init()...");
      this.init();
      console.log("GameMain constructor completed successfully");
    } catch (error) {
      console.error("Error in GameMain constructor:", error);
      throw error;
    }
  }

  async init() {
    // Setup camera for FPS (will be controlled by player)
    this.camera.position.set(0, 1.8, 0);

    // Initialize systems
    this.inputManager = new InputManager();
    this.uiManager = new UIManager();
    if (typeof PuzzleManager === "function") {
      try {
        this.puzzleManager = new PuzzleManager(this.uiManager);
      } catch (error) {
        console.warn("PuzzleManager initialization failed:", error);
        this.puzzleManager = null;
      }
    } else {
      console.warn("PuzzleManager class not found. Timed puzzles disabled.");
    }
    this.particleSystem = new ParticleSystem(this.scene);
    this.collisionManager = new CollisionManager();

    // Create environment
    this.environment = new Environment(this.scene);

    // Initialize weapon blueprints before creating player
    if (window.DetailedWeaponModels) {
      try {
        await DetailedWeaponModels.init();
      } catch (err) {
        console.warn(
          "Failed to load weapon blueprints, fallback weapons will be used:",
          err
        );
      }
    }

    // Create player (FPS mode - player controls camera)
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
    if (typeof this.enemyManager.setMaxActiveEnemies === "function") {
      this.enemyManager.setMaxActiveEnemies(15);
    }

    // Create wave manager
    this.waveManager = new WaveManager(this.enemyManager, this.uiManager);
    if (typeof this.waveManager.setEnvironment === "function") {
      this.waveManager.setEnvironment(this.environment);
    }

    // Create upgrade manager for post-boss rewards
    this.upgradeManager = new UpgradeManager(this.player, this.weaponManager);

    // Create learn mode manager
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
    const learnButton = document.getElementById("learnButton");
    console.log("Start button element:", startButton);
    console.log("Learn button element:", learnButton);

    if (!startButton) {
      console.error("Start button not found!");
      return;
    }

    startButton.addEventListener("click", () => {
      console.log("🎮 START BUTTON CLICKED!");
      this.startGame();
    });

    if (learnButton) {
      learnButton.addEventListener("click", () => {
        console.log("🧠 LEARN MODE BUTTON CLICKED!");
        this.startLearnMode();
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

    this.inputManager.on("reload", () => {
      if (this.gameStarted && this.isRunning) {
        this.weaponManager.reload();
      }
    });

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

  setupBackgroundMusic() {
    if (
      !this.backgroundMusicTracks?.length ||
      typeof window === "undefined" ||
      typeof Audio === "undefined"
    ) {
      return;
    }

    this.backgroundMusicElements = this.backgroundMusicTracks
      .map((relativePath) => {
        try {
          const resolvedSrc = new URL(relativePath, window.location.href).href;
          const audio = new Audio(resolvedSrc);
          audio.volume = this.backgroundMusicVolume;
          audio.preload = "auto";
          audio.addEventListener("ended", () => {
            if (!this.shouldLoopBackgroundMusic) {
              return;
            }
            this.playNextBackgroundTrack();
          });
          if (typeof audio.load === "function") {
            audio.load();
          }
          return audio;
        } catch (error) {
          console.warn("Failed to load background track:", relativePath, error);
          return null;
        }
      })
      .filter(Boolean);

    if (!this.backgroundMusicElements.length) {
      console.warn("No background music tracks were loaded successfully.");
    }
  }

  playCurrentBackgroundTrack() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    const index =
      this.backgroundMusicIndex % this.backgroundMusicElements.length;
    const audio = this.backgroundMusicElements[index];
    if (!audio) {
      return;
    }

    if (this.activeBackgroundAudio && this.activeBackgroundAudio !== audio) {
      this.activeBackgroundAudio.pause();
      this.activeBackgroundAudio.currentTime = 0;
    }

    this.activeBackgroundAudio = audio;

    try {
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch((error) => {
          console.warn("Background music play failed:", error);
        });
      }
    } catch (error) {
      console.warn("Background music play failed:", error);
    }
  }

  playNextBackgroundTrack() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    if (this.backgroundMusicElements.length > 1) {
      this.backgroundMusicIndex =
        (this.backgroundMusicIndex + 1) % this.backgroundMusicElements.length;
    }

    this.playCurrentBackgroundTrack();
  }

  enableBackgroundMusic(enable) {
    this.shouldLoopBackgroundMusic = Boolean(enable);

    if (!enable) {
      this.stopBackgroundMusic();
      return;
    }

    if (!this.backgroundMusicElements?.length) {
      return;
    }

    if (!this.activeBackgroundAudio || this.activeBackgroundAudio.paused) {
      if (this.backgroundMusicElements.length > 1) {
        this.backgroundMusicIndex = Math.floor(
          Math.random() * this.backgroundMusicElements.length
        );
      } else {
        this.backgroundMusicIndex = 0;
      }
      this.playCurrentBackgroundTrack();
    }
  }

  stopBackgroundMusic() {
    if (!this.backgroundMusicElements?.length) {
      return;
    }

    this.backgroundMusicElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    this.activeBackgroundAudio = null;
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
        this.awaitingUpgradeSelection = false;
        this.clearPendingWaveTimeout();

        if (this.upgradeManager) {
          this.upgradeManager.reset();
        }

        this.uiManager.hideUpgradeSelection?.();

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

        this.enableBackgroundMusic(true);

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

  startLearnMode() {
    console.log("🧠 startLearnMode() called");

    this.showLoadingOverlay(
      "LEARN MODE",
      "Deploying Pixel and preparing sectors for guided exploration..."
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

        console.log("Setting learn mode state...");
        this.gameStarted = false;
        this.isRunning = false;
        this.awaitingUpgradeSelection = false;
        this.clearPendingWaveTimeout();
        this.uiManager.hideUpgradeSelection?.();

        this.enableBackgroundMusic(false);

        console.log("Starting learn mode...");
        this.spectatorMode.start();

        console.log("✅ Learn mode started successfully!");
      } catch (error) {
        console.error("❌ Error starting learn mode:", error);
        alert(
          "Error starting learn mode: " +
            error.message +
            "\n\nCheck console for details."
        );
      } finally {
        this.hideLoadingOverlay();
      }
    }, 120);
  }

  startSpectatorMode() {
    console.warn(
      "startSpectatorMode() is deprecated. Forwarding to startLearnMode()."
    );
    this.startLearnMode();
  }

  handleSpecialAbility() {
    const enemies = this.enemyManager.getEnemies();
    const playerPos = this.player.getPosition();
    const blastRadius = this.player?.empRadius || 15;
    const empDamage = this.player?.empDamage || 50;

    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < blastRadius) {
        enemy.takeDamage(empDamage);
        this.particleSystem.createExplosion(enemyPos, 0x00ffff, 20);
      }
    });

    this.particleSystem.createShockwave(playerPos, blastRadius, 0x00ffff);
    this.uiManager.showMessage("EMP BLAST!", 1000);
  }

  update(deltaTime) {
    // Update learn mode if active
    if (this.spectatorMode && this.spectatorMode.isActive()) {
      this.spectatorMode.update(deltaTime);
      return; // Skip game updates while Learn Mode is active
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
        this.player.takeDamage(enemy.contactDamage, enemyPos);
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
            const projectilePos = enemyProjectile.getPosition();
            this.player.takeDamage(enemyProjectile.damage, projectilePos);
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
            this.player.takeDamage(aoeResult.damage, enemyPos);
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
    const scoreMultiplier = this.upgradeManager
      ? this.upgradeManager.getScoreMultiplier()
      : 1;
    const scoreGain = Math.round(enemy.scoreValue * scoreMultiplier);

    this.score += scoreGain;
    this.uiManager.updateScore(this.score);
    this.particleSystem.createExplosion(enemy.getPosition(), enemy.color, 30);
    this.enemyManager.removeEnemy(enemy);
  }

  onWaveComplete() {
    this.difficulty += 0.2;
    const waveNumber = this.waveManager.getCurrentWave();

    this.uiManager.showMessage(`WAVE ${waveNumber} COMPLETE!`, 2000);

    const scoreMultiplier = this.upgradeManager
      ? this.upgradeManager.getScoreMultiplier()
      : 1;
    const waveReward = Math.round(1000 * waveNumber * scoreMultiplier);
    this.score += waveReward;
    this.uiManager.updateScore(this.score);

    this.player.health = Math.min(
      this.player.maxHealth,
      this.player.health + 20
    );
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);

    this.clearPendingWaveTimeout();

    const bossWave =
      typeof this.waveManager.wasLastWaveBoss === "function"
        ? this.waveManager.wasLastWaveBoss()
        : false;

    if (bossWave) {
      this.awaitingUpgradeSelection = true;
      this.isRunning = false;
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }

      setTimeout(() => {
        if (!this.gameStarted) return;
        this.presentUpgradeSelection(waveNumber);
      }, 900);
    } else {
      this.launchPuzzleChallenge(waveNumber);
    }
  }

  presentUpgradeSelection(waveNumber) {
    if (!this.upgradeManager || !this.uiManager) {
      this.awaitingUpgradeSelection = false;
      this.scheduleNextWave(1200);
      return;
    }

    const options = this.upgradeManager.getUpgradeOptions(waveNumber);
    this.uiManager.showUpgradeSelection(options, this.score, {
      onSelect: (option) => this.handleUpgradeSelection(option),
      onSkip: () => this.handleUpgradeSkip(),
    });
  }

  handleUpgradeSelection(option) {
    if (!option) {
      this.handleUpgradeSkip();
      return;
    }

    if (this.score < option.cost) {
      this.uiManager.showMessage("INSUFFICIENT SCORE", 1400);
      setTimeout(() => {
        if (!this.gameStarted || this.awaitingUpgradeSelection) {
          this.presentUpgradeSelection(this.waveManager.getCurrentWave());
        }
      }, 900);
      return;
    }

    this.score -= option.cost;
    this.uiManager.updateScore(this.score);

    const result = this.upgradeManager.applyUpgrade(option.id);
    const messageText = result.success
      ? result.message
      : result.message || "Upgrade failed.";

    this.uiManager.showMessage(messageText, 2000);
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);

    this.resumeAfterUpgrade();
  }

  handleUpgradeSkip() {
    this.uiManager.showMessage("Upgrade skipped. Score preserved.", 1500);
    this.resumeAfterUpgrade();
  }

  resumeAfterUpgrade() {
    if (!this.gameStarted) return;

    this.awaitingUpgradeSelection = false;
    this.uiManager.hideUpgradeSelection?.();
    this.isRunning = true;
    this.scheduleNextWave(1600);
  }

  launchPuzzleChallenge(waveNumber) {
    if (!this.gameStarted) {
      return;
    }

    if (!this.puzzleManager) {
      this.scheduleNextWave(2000);
      return;
    }

    this.clearPendingWaveTimeout();
    this.awaitingPuzzleResolution = true;
    this.isRunning = false;

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    try {
      this.puzzleManager.startRandomPuzzle({
        waveNumber,
        onSuccess: (result) => this.handlePuzzleResult("success", result),
        onFailure: (result) => this.handlePuzzleResult("failure", result),
        onSkip: (result) => this.handlePuzzleResult("skip", result),
      });
    } catch (error) {
      console.error("Failed to start puzzle challenge:", error);
      this.awaitingPuzzleResolution = false;
      this.isRunning = true;
      this.scheduleNextWave(2000);
      return;
    }

    if (!this.puzzleManager.active) {
      console.warn(
        "PuzzleManager did not activate a puzzle. Resuming normal wave flow."
      );
      this.awaitingPuzzleResolution = false;
      this.isRunning = true;
      this.scheduleNextWave(2000);
    }
  }

  handlePuzzleResult(outcome, result) {
    const puzzleResult = result || {};
    const delta = Number.isFinite(puzzleResult.scoreDelta)
      ? puzzleResult.scoreDelta
      : 0;

    if (delta !== 0) {
      this.score += delta;
    }

    this.uiManager.updateScore(this.score);

    let message = puzzleResult.message;
    if (!message) {
      if (outcome === "success") {
        message = "Subsystem stabilized.";
      } else if (outcome === "skip") {
        message = "Challenge skipped.";
      } else {
        message = "Challenge failed.";
      }
    }

    const deltaText = this.formatScoreDelta(delta);
    if (deltaText) {
      message = `${message}<br><small>${deltaText}</small>`;
    }

    const duration = outcome === "success" ? 2000 : 2200;
    this.uiManager.showMessage(message, duration);

    this.resumeAfterPuzzle();
  }

  formatScoreDelta(amount) {
    if (!amount) {
      return "";
    }

    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()} SCORE`;
  }

  resumeAfterPuzzle(delayMs = 1800) {
    this.awaitingPuzzleResolution = false;
    if (!this.gameStarted) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextWave(delayMs);
  }

  scheduleNextWave(delayMs = 3000) {
    this.clearPendingWaveTimeout();

    this.pendingNextWaveTimeout = setTimeout(() => {
      if (
        !this.gameStarted ||
        this.awaitingUpgradeSelection ||
        this.awaitingPuzzleResolution
      ) {
        return;
      }
      this.beginNextWave();
    }, Math.max(0, delayMs));
  }

  beginNextWave() {
    this.clearPendingWaveTimeout();

    this.waveManager.startWave();

    const phaseChanged = this.environment.setPhaseByWave(
      this.waveManager.getCurrentWave()
    );
    const phaseName = this.environment.getCurrentPhaseName();
    const waveLabel = `WAVE ${this.waveManager.getCurrentWave()} - INCOMING!`;

    const showWaveMessage = () => {
      if (!this.gameStarted) return;
      this.uiManager.showMessage(
        `${phaseName ? phaseName.toUpperCase() + "<br>" : ""}${waveLabel}`,
        2200
      );
    };

    if (phaseChanged) {
      this.uiManager.showMessage(
        `${phaseName ? phaseName.toUpperCase() : "NEW SECTOR"} ONLINE`,
        2200
      );

      setTimeout(() => {
        showWaveMessage();
      }, 2200);
    } else {
      showWaveMessage();
    }

    this.isRunning = true;
  }

  clearPendingWaveTimeout() {
    if (this.pendingNextWaveTimeout) {
      clearTimeout(this.pendingNextWaveTimeout);
      this.pendingNextWaveTimeout = null;
    }
  }

  gameOver() {
    this.isRunning = false;
    this.gameStarted = false;

    this.enableBackgroundMusic(false);

    this.awaitingUpgradeSelection = false;
    this.awaitingPuzzleResolution = false;
    this.clearPendingWaveTimeout();
    this.uiManager.hideUpgradeSelection?.();
    if (
      this.puzzleManager &&
      typeof this.puzzleManager.abortActivePuzzle === "function"
    ) {
      this.puzzleManager.abortActivePuzzle();
    }

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
      this.uiManager.hideUpgradeSelection?.();
      if (
        this.puzzleManager &&
        typeof this.puzzleManager.abortActivePuzzle === "function"
      ) {
        this.puzzleManager.abortActivePuzzle();
      }

      this.awaitingUpgradeSelection = false;
      this.awaitingPuzzleResolution = false;
      this.clearPendingWaveTimeout();

      if (this.upgradeManager) {
        this.upgradeManager.reset();
      }

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

      this.enableBackgroundMusic(true);

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
