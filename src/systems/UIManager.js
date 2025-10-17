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
}
