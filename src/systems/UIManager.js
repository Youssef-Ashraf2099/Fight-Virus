class UIManager {
  constructor() {
    this.healthBar = document.getElementById("healthBar");
    this.energyBar = document.getElementById("energyBar");
    this.scoreValue = document.getElementById("scoreValue");
    this.waveNumber = document.getElementById("waveNumber");
    this.enemyCount = document.getElementById("enemyCount");
    this.weaponName = document.getElementById("weaponName");
    this.ammoCount = document.getElementById("ammoCount");
    this.message = document.getElementById("message");

    this.upgradeOverlay = document.getElementById("upgradeOverlay");
    this.upgradeCardsContainer = document.getElementById("upgradeCards");
    this.upgradeSkipButton = document.getElementById("upgradeSkipButton");
    this.upgradeScoreValue = document.getElementById("upgradeScoreValue");
    this.upgradeSubtitle = document.getElementById("upgradeSubtitle");

    this.puzzleOverlay = document.getElementById("puzzleOverlay");
    this.puzzleTitle = document.getElementById("puzzleTitle");
    this.puzzleSubtitle = document.getElementById("puzzleSubtitle");
    this.puzzleTimer = document.getElementById("puzzleTimer");
    this.puzzleContent = document.getElementById("puzzleContent");
    this.puzzleFeedback = document.getElementById("puzzleFeedback");
    this.puzzleInstructions = document.getElementById("puzzleInstructions");
    this.puzzleSubmitButton = document.getElementById("puzzleSubmitButton");
    this.puzzleSkipButton = document.getElementById("puzzleSkipButton");
    this.puzzleSubmitHandler = null;
    this.puzzleSkipHandler = null;

    this.messageTimeout = null;

    // Minimap setup
    this.minimapCanvas = document.getElementById("minimap");
    this.minimapCtx = this.minimapCanvas
      ? this.minimapCanvas.getContext("2d")
      : null;
    this.minimapSize = 200;
    this.mapBoundary = 60; // Match game boundary
    this.minimapScale = this.minimapSize / (this.mapBoundary * 2);

    if (this.minimapCanvas) {
      this.minimapCanvas.width = this.minimapSize;
      this.minimapCanvas.height = this.minimapSize;
    }
  }

  updateHealth(current, max) {
    const percentage = (current / max) * 100;
    this.healthBar.style.width = `${percentage}%`;

    // Change color based on health
    if (percentage < 25) {
      this.healthBar.style.background = "linear-gradient(90deg, #f00, #800)";
    } else if (percentage < 50) {
      this.healthBar.style.background = "linear-gradient(90deg, #ff0, #880)";
    } else {
      this.healthBar.style.background = "linear-gradient(90deg, #0f0, #0a0)";
    }
  }

  updateEnergy(current, max) {
    const percentage = (current / max) * 100;
    this.energyBar.style.width = `${percentage}%`;
  }

  updateScore(score) {
    this.scoreValue.textContent = score;
    this.updateUpgradeScoreDisplay(score);
  }

  updateWave(wave) {
    this.waveNumber.textContent = wave;
  }

  updateEnemyCount(count) {
    this.enemyCount.textContent = count;
  }

  updateWeapon(name, ammo) {
    this.weaponName.textContent = name;
    this.ammoCount.textContent = ammo;
  }

  showMessage(text, duration = 0) {
    this.message.innerHTML = text;
    this.message.style.display = "block";

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    if (duration > 0) {
      this.messageTimeout = setTimeout(() => {
        this.message.style.display = "none";
      }, duration);
    }
  }

  hideMessage() {
    this.message.style.display = "none";
  }

  showUpgradeSelection(options, score, callbacks = {}) {
    if (!this.upgradeOverlay || !this.upgradeCardsContainer) {
      callbacks.onSkip?.();
      return;
    }

    this.upgradeCardsContainer.innerHTML = "";
    this.updateUpgradeScoreDisplay(score);

    if (this.upgradeSubtitle) {
      this.upgradeSubtitle.textContent =
        "Select one upgrade. Score will be spent to install new protocols.";
    }

    this.upgradeOverlay.classList.add("visible");
    document.body?.classList.add("upgrade-select-open");

    options.forEach((option) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "upgrade-card";

      const affordable = score >= option.cost;
      if (!affordable) {
        card.classList.add("locked");
        card.disabled = true;
      }

      const levelText = option.maxStacks
        ? `Rank ${option.currentLevel + 1}/${option.maxStacks}`
        : `Rank ${option.currentLevel + 1}`;
      const detailMarkup = option.detail
        ? `<div class="upgrade-card-detail">${option.detail}</div>`
        : "";

      card.innerHTML = `
        <div class="upgrade-card-icon">${option.icon || ""}</div>
        <div class="upgrade-card-content">
          <div class="upgrade-card-title">${option.name}</div>
          <div class="upgrade-card-description">${option.description}</div>
          ${detailMarkup}
        </div>
        <div class="upgrade-card-footer">
          <span class="upgrade-card-cost">${option.cost.toLocaleString()} SCORE</span>
          <span class="upgrade-card-level">${levelText}</span>
        </div>
        ${
          affordable
            ? ""
            : '<span class="upgrade-card-lock">NEED MORE SCORE</span>'
        }
      `;

      if (affordable) {
        card.addEventListener("click", () => {
          this.hideUpgradeSelection();
          callbacks.onSelect?.(option);
        });
      }

      this.upgradeCardsContainer.appendChild(card);
    });

    if (this.upgradeSkipButton) {
      this.upgradeSkipButton.onclick = () => {
        this.hideUpgradeSelection();
        callbacks.onSkip?.();
      };
    }
  }

  hideUpgradeSelection() {
    if (!this.upgradeOverlay) return;

    this.upgradeOverlay.classList.remove("visible");
    document.body?.classList.remove("upgrade-select-open");

    if (this.upgradeSkipButton) {
      this.upgradeSkipButton.onclick = null;
    }
  }

  updateUpgradeScoreDisplay(score) {
    if (this.upgradeScoreValue) {
      const numericScore = Number(score);
      this.upgradeScoreValue.textContent = Number.isFinite(numericScore)
        ? numericScore.toLocaleString()
        : "0";
    }
  }

  showPuzzleOverlay() {
    if (!this.puzzleOverlay) return;
    this.puzzleOverlay.classList.add("visible");
    document.body?.classList.add("puzzle-open");
  }

  hidePuzzleOverlay() {
    if (!this.puzzleOverlay) return;
    this.puzzleOverlay.classList.remove("visible");
    document.body?.classList.remove("puzzle-open");
    if (this.puzzleFeedback) {
      this.puzzleFeedback.textContent = "";
    }
    if (this.puzzleInstructions) {
      this.puzzleInstructions.textContent = "";
      this.puzzleInstructions.style.display = "none";
    }
    if (this.puzzleSubmitButton) {
      this.puzzleSubmitButton.onclick = null;
    }
    if (this.puzzleSkipButton) {
      this.puzzleSkipButton.onclick = null;
    }
  }

  setPuzzleTitle(text) {
    if (this.puzzleTitle) {
      this.puzzleTitle.textContent = text || "";
    }
  }

  setPuzzleSubtitle(text) {
    if (this.puzzleSubtitle) {
      this.puzzleSubtitle.textContent = text || "";
    }
  }

  setPuzzleTimer(seconds) {
    if (this.puzzleTimer) {
      const clamped = Math.max(0, Math.ceil(seconds ?? 0));
      this.puzzleTimer.textContent = clamped.toString();
    }
  }

  clearPuzzleContent() {
    if (this.puzzleContent) {
      this.puzzleContent.innerHTML = "";
      this.puzzleContent.classList.remove(
        "puzzle-logic",
        "puzzle-register",
        "puzzle-password",
        "puzzle-maze"
      );
      this.puzzleContent.style.removeProperty("--router-cols");
      this.puzzleContent.style.removeProperty("--maze-cols");
    }
  }

  getPuzzleContentElement() {
    return this.puzzleContent;
  }

  setPuzzleInstructions(text) {
    if (!this.puzzleInstructions) return;
    const value = text || "";
    this.puzzleInstructions.textContent = value;
    this.puzzleInstructions.style.display = value ? "block" : "none";
  }

  setPuzzleFeedback(text) {
    if (this.puzzleFeedback) {
      this.puzzleFeedback.textContent = text || "";
    }
  }

  setPuzzleSubmitVisibility(visible, label) {
    if (!this.puzzleSubmitButton) return;
    this.puzzleSubmitButton.style.display = visible ? "inline-flex" : "none";
    if (label) {
      this.puzzleSubmitButton.textContent = label;
    }
  }

  setPuzzleSkipLabel(label) {
    if (this.puzzleSkipButton && label) {
      this.puzzleSkipButton.textContent = label;
    }
  }

  setPuzzleSubmitHandler(handler) {
    if (!this.puzzleSubmitButton) return;
    this.puzzleSubmitHandler = handler || null;
    this.puzzleSubmitButton.onclick = handler || null;
  }

  setPuzzleSkipHandler(handler) {
    if (!this.puzzleSkipButton) return;
    this.puzzleSkipHandler = handler || null;
    this.puzzleSkipButton.onclick = handler || null;
  }

  updateMinimap(playerPosition, enemies, phaseName) {
    if (!this.minimapCtx || !playerPosition) return;

    const ctx = this.minimapCtx;
    const centerX = this.minimapSize / 2;
    const centerY = this.minimapSize / 2;

    // Clear canvas
    ctx.fillStyle = "rgba(0, 10, 5, 0.85)";
    ctx.fillRect(0, 0, this.minimapSize, this.minimapSize);

    // Draw grid
    ctx.strokeStyle = "rgba(0, 255, 136, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let i = 0; i <= this.minimapSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.minimapSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.minimapSize, i);
      ctx.stroke();
    }

    // Draw boundary
    const boundarySize = this.mapBoundary * this.minimapScale;
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - boundarySize,
      centerY - boundarySize,
      boundarySize * 2,
      boundarySize * 2
    );

    // Draw scan lines
    const scanLineOffset = (Date.now() / 50) % 10;
    ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
    ctx.lineWidth = 1;
    for (let i = -10; i < this.minimapSize + 10; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i + scanLineOffset);
      ctx.lineTo(this.minimapSize, i + scanLineOffset);
      ctx.stroke();
    }

    // Draw enemies
    if (enemies && enemies.length) {
      enemies.forEach((enemy) => {
        const enemyPos = enemy.getPosition();
        const relX = (enemyPos.x - playerPosition.x) * this.minimapScale;
        const relZ = (enemyPos.z - playerPosition.z) * this.minimapScale;
        // Map enemy position using same orientation as player arrow (negative Z is up)
        const mapX = centerX + relX;
        const mapY = centerY + relZ;

        // Skip if enemy is off minimap
        if (
          mapX < 0 ||
          mapX > this.minimapSize ||
          mapY < 0 ||
          mapY > this.minimapSize
        ) {
          return;
        }

        // Pulsing enemy dot
        const pulseScale = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        const enemyRadius = 4 * pulseScale;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          mapX,
          mapY,
          0,
          mapX,
          mapY,
          enemyRadius * 2
        );
        gradient.addColorStop(0, "rgba(255, 0, 0, 0.8)");
        gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.4)");
        gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mapX, mapY, enemyRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(mapX, mapY, enemyRadius, 0, Math.PI * 2);
        ctx.fill();

        // Targeting ring
        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mapX, mapY, enemyRadius * 2.5, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // Draw player (always at center with direction indicator)
    const playerSize = 6;

    // Player direction indicator
    const yaw = playerPosition.yaw || 0;
    const dirLength = 12;
    // Fix direction to match player's view: negative yaw is clockwise rotation
    // On minimap: X right, Y down. Player looks toward negative Z (up on minimap)
    const dirX = Math.sin(-yaw) * dirLength;
    const dirY = -Math.cos(-yaw) * dirLength; // Flip Y to match minimap coordinates

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + dirX, centerY + dirY);
    ctx.stroke();

    // Player outer glow
    const playerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      playerSize * 2
    );
    playerGradient.addColorStop(0, "rgba(0, 255, 136, 0.9)");
    playerGradient.addColorStop(0.5, "rgba(0, 255, 136, 0.4)");
    playerGradient.addColorStop(1, "rgba(0, 255, 136, 0)");

    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, playerSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Player core
    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(centerX, centerY, playerSize, 0, Math.PI * 2);
    ctx.fill();

    // Player ring
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, playerSize + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Phase label
    if (phaseName) {
      ctx.fillStyle = "rgba(0, 20, 10, 0.8)";
      ctx.fillRect(0, 0, this.minimapSize, 20);

      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 11px 'Courier New'";
      ctx.textAlign = "center";
      ctx.fillText(phaseName, centerX, 14);
    }

    // Enemy count indicator
    if (enemies && enemies.length) {
      const countText = `THREATS: ${enemies.length}`;
      const textWidth = ctx.measureText(countText).width;

      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.fillRect(
        this.minimapSize - textWidth - 10,
        this.minimapSize - 20,
        textWidth + 8,
        16
      );

      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 10px 'Courier New'";
      ctx.textAlign = "right";
      ctx.fillText(countText, this.minimapSize - 6, this.minimapSize - 8);
    }

    // Scanner sweep effect
    const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(sweepAngle);

    const sweepGradient = ctx.createLinearGradient(
      0,
      0,
      0,
      -this.minimapSize / 2
    );
    sweepGradient.addColorStop(0, "rgba(0, 255, 136, 0.3)");
    sweepGradient.addColorStop(0.5, "rgba(0, 255, 136, 0.1)");
    sweepGradient.addColorStop(1, "rgba(0, 255, 136, 0)");

    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.minimapSize, 0, Math.PI / 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Render health bar above enemy in 3D space
  renderEnemyHealthBar(enemy, camera, ctx, canvas) {
    if (!enemy || !enemy.alive || !enemy.group || !ctx) return;

    const position = enemy.getPosition();
    const healthRatio = enemy.health / enemy.maxHealth;

    // Project 3D position to 2D screen
    const vector = position.clone();
    vector.y += enemy.collisionRadius * 2 + 2; // Above enemy
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * canvas.width;
    const y = (-(vector.y * 0.5) + 0.5) * canvas.height;

    // Only render if on screen
    if (vector.z > 1 || x < 0 || x > canvas.width || y < 0 || y > canvas.height)
      return;

    // Health bar dimensions
    const barWidth = enemy.isBoss ? 200 : 60;
    const barHeight = enemy.isBoss ? 12 : 6;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x - barWidth / 2, y - barHeight / 2, barWidth, barHeight);

    // Health fill
    const healthColor =
      healthRatio > 0.6 ? "#0f0" : healthRatio > 0.3 ? "#ff0" : "#f00";
    ctx.fillStyle = healthColor;
    ctx.fillRect(
      x - barWidth / 2,
      y - barHeight / 2,
      barWidth * healthRatio,
      barHeight
    );

    // Border
    ctx.strokeStyle = enemy.isBoss ? "#f00" : "#0f0";
    ctx.lineWidth = enemy.isBoss ? 2 : 1;
    ctx.strokeRect(x - barWidth / 2, y - barHeight / 2, barWidth, barHeight);

    // Boss name
    if (enemy.isBoss && enemy.bossName) {
      ctx.fillStyle = "#f00";
      ctx.font = 'bold 14px "Courier New"';
      ctx.textAlign = "center";
      ctx.fillText(enemy.bossName, x, y - barHeight);
    }
  }

  // Render massive boss health bar at top of screen
  renderBossHealthBar(boss, ctx, canvas) {
    if (!boss || !boss.alive || !boss.isBoss || !ctx) return;

    const healthRatio = boss.health / boss.maxHealth;

    const barWidth = canvas.width * 0.6;
    const barHeight = 40;
    const x = (canvas.width - barWidth) / 2;
    const y = 80;

    // Background glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#f00";

    // Background
    ctx.fillStyle = "rgba(20, 0, 0, 0.9)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health fill with gradient
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    if (healthRatio > 0.6) {
      gradient.addColorStop(0, "#ff0000");
      gradient.addColorStop(1, "#ff6600");
    } else if (healthRatio > 0.3) {
      gradient.addColorStop(0, "#ff6600");
      gradient.addColorStop(1, "#ffaa00");
    } else {
      gradient.addColorStop(0, "#ff0000");
      gradient.addColorStop(1, "#ffffff");
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * healthRatio, barHeight);

    // Animated segments
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) {
      const segX = x + (barWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(segX, y);
      ctx.lineTo(segX, y + barHeight);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Boss name and title
    ctx.shadowColor = "#f00";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff0000";
    ctx.font = 'bold 24px "Courier New"';
    ctx.textAlign = "center";
    ctx.fillText(boss.bossName || "BOSS", canvas.width / 2, y - 15);

    // Health text
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#000";
    ctx.fillStyle = "#fff";
    ctx.font = 'bold 16px "Courier New"';
    const healthText = `${Math.ceil(boss.health)} / ${boss.maxHealth}`;
    ctx.fillText(healthText, canvas.width / 2, y + barHeight / 2 + 6);

    // Phase indicator
    if (boss.phases && boss.currentPhaseIndex !== undefined) {
      ctx.fillStyle = "#ffaa00";
      ctx.font = '14px "Courier New"';
      const phaseText = `PHASE ${boss.currentPhaseIndex + 1}/${
        boss.phases.length
      }`;
      ctx.fillText(phaseText, canvas.width / 2, y + barHeight + 20);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  }
}
