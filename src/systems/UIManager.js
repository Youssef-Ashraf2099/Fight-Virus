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
}
