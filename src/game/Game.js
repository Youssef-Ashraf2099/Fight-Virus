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
    const blastRadius = this.player.empRadius || 18;
    const empDamage = this.player.empDamage || 60;

    let hitCount = 0;
    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < blastRadius) {
        // Damage scales with distance
        const distanceRatio = 1 - distance / blastRadius;
        const scaledDamage = empDamage * (0.5 + distanceRatio * 0.5);

        enemy.takeDamage(scaledDamage);
        this.particleSystem.createImpact(enemyPos, 0x00ffff, 15);
        hitCount++;
      }
    });

    // Visual effect
    this.particleSystem.createShockwave(playerPos, blastRadius, 0x00ffff);

    if (hitCount > 0) {
      this.uiManager.showMessage(`EMP BLAST! ${hitCount} ENEMIES HIT!`, 1500);
    } else {
      this.uiManager.showMessage("EMP BLAST!", 1000);
    }
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
    this.enemyManager.update(deltaTime, playerPos);

    // Update environment
    this.environment.update(deltaTime, playerPos);

    // Update particle effects
    this.particleSystem.update(deltaTime);

    // Continuous enemy separation (prevents getting stuck)
    this.preventPlayerSticking(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Update wave manager
    if (this.waveManager.update(deltaTime)) {
      // Wave completed
      this.onWaveComplete();
    }

    // Update UI
    this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
    this.uiManager.updateEnergy(this.player.energy, this.player.maxEnergy);
    this.uiManager.updateEnemyCount(this.enemyManager.getActiveEnemyCount());
    this.weaponManager.updateUI(this.uiManager);

    // Check game over
    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  preventPlayerSticking(deltaTime) {
    // Continuous separation to prevent player getting stuck in enemies
    const enemies = this.enemyManager.getEnemies();
    const playerPos = this.player.getPosition();
    const separationForce = new THREE.Vector3();
    let enemiesNearby = 0;

    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);
      const safeDistance =
        enemy.collisionRadius + this.player.collisionRadius + 0.5;

      // Apply separation force if too close
      if (distance < safeDistance && distance > 0.01) {
        const direction = new THREE.Vector3()
          .subVectors(playerPos, enemyPos)
          .normalize();

        // Stronger force when closer
        const strength = (safeDistance - distance) / safeDistance;
        const force = direction.multiplyScalar(strength * 15 * deltaTime);

        separationForce.add(force);
        enemiesNearby++;
      }
    });

    // Apply accumulated separation force
    if (enemiesNearby > 0) {
      this.player.position.add(separationForce);
      if (this.player.group) {
        this.player.group.position.copy(this.player.position);
      }
    }
  }

  checkCollisions() {
    const projectiles = this.weaponManager.getProjectiles();
    const enemies = this.enemyManager.getEnemies();
    const playerPos = this.player.getPosition();

    // Projectile vs Enemy collisions
    projectiles.forEach((projectile) => {
      enemies.forEach((enemy) => {
        if (this.collisionManager.checkCollision(projectile, enemy)) {
          const damage = projectile.damage;
          enemy.takeDamage(damage);

          this.particleSystem.createImpact(
            projectile.getPosition(),
            projectile.color,
            10
          );

          projectile.destroy();

          if (enemy.health <= 0) {
            this.onEnemyKilled(enemy);
          }
        }
      });
    });

    // Enemy vs Player collisions with STRONG pushback
    enemies.forEach((enemy) => {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);
      const minDistance = enemy.collisionRadius + this.player.collisionRadius;

      if (distance < minDistance) {
        // Calculate pushback direction (away from enemy)
        let direction = new THREE.Vector3().subVectors(playerPos, enemyPos);

        // Handle case where player is exactly on enemy position
        if (direction.length() < 0.01) {
          // Push in random direction to break the stuck state
          direction.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        }

        direction.normalize();

        // Calculate overlap amount
        const overlap = minDistance - distance;

        // STRONG pushback - multiply by 2.0 for immediate separation
        const pushbackStrength = Math.max(overlap * 2.0, 0.5);
        const pushbackVector = direction
          .clone()
          .multiplyScalar(pushbackStrength);

        // Instantly move player to safe distance
        this.player.position.add(pushbackVector);

        // Update player group position
        if (this.player.group) {
          this.player.group.position.copy(this.player.position);
        }

        // Strong knockback velocity for continuous separation
        this.player.applyKnockback(direction.clone(), 12);

        // Apply contact damage
        const damage = enemy.contactDamage;
        this.player.takeDamage(damage);

        this.particleSystem.createImpact(playerPos.clone(), 0xff0000, 15);
      }

      // Enemy projectiles vs Player
      const enemyProjectiles = enemy.getProjectiles
        ? enemy.getProjectiles()
        : [];
      enemyProjectiles.forEach((proj) => {
        const projPos = proj.getPosition();
        const distance = playerPos.distanceTo(projPos);

        if (distance < proj.collisionRadius + this.player.collisionRadius) {
          this.player.takeDamage(proj.damage);
          this.particleSystem.createImpact(projPos, 0xff0000, 10);
          proj.destroy();
        }
      });

      // Handle enemy AOE attacks
      if (enemy.attackType === "aoe" && enemy.behaviorState === "attacking") {
        const aoeResult = enemy.performAOEAttack(playerPos);
        if (aoeResult && aoeResult.type === "aoe") {
          const distance = playerPos.distanceTo(enemyPos);
          if (distance <= aoeResult.radius) {
            this.player.takeDamage(aoeResult.damage);
            this.particleSystem.createExplosion(enemyPos, enemy.color, 30);
          }
        }
      }
    });

    // Enemy vs Enemy collision pushback (prevent stacking)
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        const enemy1 = enemies[i];
        const enemy2 = enemies[j];

        const pos1 = enemy1.getPosition();
        const pos2 = enemy2.getPosition();
        const distance = pos1.distanceTo(pos2);

        const minDistance = enemy1.collisionRadius + enemy2.collisionRadius;

        if (distance < minDistance && distance > 0.1) {
          // Calculate separation force
          const overlap = minDistance - distance;
          const direction = new THREE.Vector3()
            .subVectors(pos1, pos2)
            .normalize();

          // Push enemies apart (distribute force equally)
          const separationForce = overlap * 0.3;

          enemy1.position.add(
            direction.clone().multiplyScalar(separationForce * 0.5)
          );
          enemy2.position.add(
            direction.clone().multiplyScalar(-separationForce * 0.5)
          );

          // Update enemy group positions
          if (enemy1.group) enemy1.group.position.copy(enemy1.position);
          if (enemy2.group) enemy2.group.position.copy(enemy2.position);
        }
      }
    }
  }

  onEnemyKilled(enemy) {
    const points = enemy.scoreValue || 100;
    const bonusMultiplier = enemy.isBoss ? 3 : 1; // Bonus points for bosses
    const totalPoints = points * bonusMultiplier;

    this.score += totalPoints;
    this.uiManager.updateScore(this.score);

    // Create death explosion
    const explosionSize = enemy.isBoss ? 50 : 30;
    this.particleSystem.createExplosion(
      enemy.getPosition(),
      enemy.color,
      explosionSize
    );

    // Show boss kill message
    if (enemy.isBoss) {
      this.uiManager.showMessage(`💀 BOSS DEFEATED! +${totalPoints} 💀`, 2500);
    }

    this.enemyManager.removeEnemy(enemy);
  }

  onWaveComplete() {
    this.difficulty += 0.2;
    const waveNumber = this.waveManager.getCurrentWave();

    // Determine if this was a boss wave
    const wasBossWave = waveNumber % 3 === 0;

    if (wasBossWave) {
      this.uiManager.showMessage(
        `🎉 WAVE ${waveNumber} - BOSS DEFEATED! 🎉`,
        3000
      );
    } else {
      this.uiManager.showMessage(`WAVE ${waveNumber} COMPLETE!`, 2000);
    }

    // Bonus score
    const waveBonus = 1000 * waveNumber * (wasBossWave ? 1.5 : 1);
    this.score += waveBonus;
    this.uiManager.updateScore(this.score);

    // Heal player based on wave performance
    const healAmount = wasBossWave ? 30 : 20;
    this.player.health = Math.min(
      this.player.maxHealth,
      this.player.health + healAmount
    );

    // Restore some energy
    this.player.energy = Math.min(
      this.player.maxEnergy,
      this.player.energy + 30
    );

    // Start next wave after delay
    const nextWaveDelay = wasBossWave ? 5000 : 3000; // Longer rest after boss
    setTimeout(() => {
      if (this.gameStarted) {
        this.waveManager.startWave();
        const nextWave = this.waveManager.getCurrentWave();
        const isBossWave = nextWave % 3 === 0;

        if (isBossWave) {
          this.uiManager.showMessage(
            `⚔️ WAVE ${nextWave} - PREPARE FOR BOSS! ⚔️`,
            2500
          );
        } else {
          this.uiManager.showMessage(`WAVE ${nextWave} - INCOMING!`, 2000);
        }
      }
    }, nextWaveDelay);
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
