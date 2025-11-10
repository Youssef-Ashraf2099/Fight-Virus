class UpgradeManager {
  constructor(player, weaponManager) {
    this.player = player;
    this.weaponManager = weaponManager;

    this.history = {};
    this.state = this._createDefaultState();

    this.baseStats = {
      speed: player.speed,
      sprintMultiplier: player.sprintMultiplier,
      jumpPower: player.jumpPower,
      maxStepHeight: player.maxStepHeight,
      empDamage: player.empDamage,
      empRadius: player.empRadius,
      specialCooldownMax: player.specialCooldownMax,
      specialEnergyCost: player.specialEnergyCost,
      maxHealth: player.maxHealth,
      damageReduction: player.damageReduction || 0,
      empStunDuration: player.empStunDuration,
      jetpackBaseFuel: player.jetpackBaseMaxFuel || 3,
    };

    this.weaponManager?.setDamageMultiplier(this.state.weaponDamageMultiplier);
    this.weaponManager?.setProjectileSpeedMultiplier(
      this.state.projectileSpeedMultiplier
    );

    this.upgrades = this._createUpgradeDefinitions();
  }

  _createDefaultState() {
    return {
      weaponDamageMultiplier: 1,
      projectileSpeedMultiplier: 1,
      moveSpeedMultiplier: 1,
      jumpMultiplier: 1,
      empDamageMultiplier: 1,
      empStunDurationBonus: 0,
      empRadiusMultiplier: 1,
      specialCooldownMultiplier: 1,
      maxHealthMultiplier: 1,
      damageReductionBonus: 0,
      scoreMultiplier: 1,
      jetpackUnlocked: false,
      jetpackFuelBonus: 0,
    };
  }

  _createUpgradeDefinitions() {
    return [
      {
        id: "weapon-overclock",
        name: "Overclocked Arsenal",
        icon: "⚡",
        baseCost: 2400,
        waveScaling: 320,
        levelScaling: 800,
        maxStacks: 4,
        description: "Weapon damage +20%. Projectiles accelerate by 8%.",
        detail: (ctx) => {
          const damageBonus = Math.round(
            (ctx.state.weaponDamageMultiplier - 1) * 100
          );
          return damageBonus > 0
            ? `Current bonus: +${damageBonus}% damage`
            : "Current bonus: none";
        },
        apply: (ctx) => {
          ctx.state.weaponDamageMultiplier *= 1.2;
          ctx.state.projectileSpeedMultiplier *= 1.08;
          ctx.weaponManager?.setDamageMultiplier(
            ctx.state.weaponDamageMultiplier
          );
          ctx.weaponManager?.setProjectileSpeedMultiplier(
            ctx.state.projectileSpeedMultiplier
          );
          return "Weapon cores rerouted for overclocked output.";
        },
      },
      {
        id: "kinetic-servos",
        name: "Kinetic Servos",
        icon: "🦾",
        baseCost: 2200,
        waveScaling: 280,
        levelScaling: 620,
        maxStacks: 4,
        description: "Movement speed +12%.",
        detail: (ctx) => {
          const speedBonus = Math.round(
            (ctx.state.moveSpeedMultiplier - 1) * 100
          );
          return speedBonus > 0
            ? `Current bonus: +${speedBonus}% speed`
            : "Current bonus: none";
        },
        apply: (ctx) => {
          ctx.state.moveSpeedMultiplier *= 1.12;
          ctx.player.speed =
            ctx.baseStats.speed * ctx.state.moveSpeedMultiplier;
          ctx.player.sprintMultiplier =
            ctx.baseStats.sprintMultiplier * ctx.state.moveSpeedMultiplier;
          return "Servo arrays calibrated for faster traversal.";
        },
      },
      {
        id: "graviton-stabilizers",
        name: "Graviton Stabilizers",
        icon: "🛰️",
        baseCost: 2100,
        waveScaling: 260,
        levelScaling: 520,
        maxStacks: 3,
        description: "Jump power +25%. Improves step clearance.",
        detail: (ctx) => {
          const jumpBonus = Math.round((ctx.state.jumpMultiplier - 1) * 100);
          return jumpBonus > 0
            ? `Current bonus: +${jumpBonus}% jump power`
            : "Current bonus: none";
        },
        apply: (ctx) => {
          ctx.state.jumpMultiplier *= 1.25;
          ctx.player.jumpPower =
            ctx.baseStats.jumpPower * ctx.state.jumpMultiplier;
          ctx.player.maxStepHeight =
            ctx.baseStats.maxStepHeight *
            (1 + (ctx.state.jumpMultiplier - 1) * 0.4);
          return "Anti-grav stabilizers tuned for higher jumps.";
        },
      },
      {
        id: "emp-overcharger",
        name: "EMP Overcharger",
        icon: "💥",
        baseCost: 2600,
        waveScaling: 360,
        levelScaling: 850,
        maxStacks: 3,
        description:
          "EMP radius +20%, damage +30%, stun duration +0.6s, cooldown -10%.",
        detail: (ctx) => {
          const radius = Math.round(ctx.player.empRadius);
          const damage = Math.round(ctx.player.empDamage);
          const stunSeconds = ctx.player.empStunDuration
            ? ctx.player.empStunDuration.toFixed(1)
            : ctx.baseStats.empStunDuration.toFixed(1);
          return `Radius: ${radius} | Damage: ${damage} | Stun: ${stunSeconds}s`;
        },
        apply: (ctx) => {
          ctx.state.empDamageMultiplier *= 1.3;
          ctx.state.empStunDurationBonus += 0.6;
          ctx.state.empRadiusMultiplier *= 1.2;
          ctx.state.specialCooldownMultiplier *= 0.9;
          ctx.player.empDamage =
            ctx.baseStats.empDamage * ctx.state.empDamageMultiplier;
          ctx.player.empRadius =
            ctx.baseStats.empRadius * ctx.state.empRadiusMultiplier;
          ctx.player.empStunDuration =
            ctx.baseStats.empStunDuration + ctx.state.empStunDurationBonus;
          ctx.player.specialCooldownMax = Math.max(
            0.8,
            ctx.baseStats.specialCooldownMax *
              ctx.state.specialCooldownMultiplier
          );
          return "EMP capacitors overcharged for maximum destruction and repulsion.";
        },
      },
      {
        id: "nanite-infusion",
        name: "Nanite Infusion",
        icon: "🧬",
        baseCost: 2400,
        waveScaling: 400,
        levelScaling: 900,
        maxStacks: 4,
        description: "Max health +15%, restore 40% of the new maximum.",
        detail: (ctx) => {
          const maxHealth = ctx.player.maxHealth;
          return `Max health: ${maxHealth.toLocaleString()}`;
        },
        apply: (ctx) => {
          ctx.state.maxHealthMultiplier *= 1.15;
          const newMax =
            ctx.baseStats.maxHealth * ctx.state.maxHealthMultiplier;
          const healAmount = newMax * 0.4;
          ctx.player.maxHealth = newMax;
          ctx.player.health = Math.min(newMax, ctx.player.health + healAmount);
          return "Nanites reinforce host integrity.";
        },
      },
      {
        id: "adaptive-shielding",
        name: "Adaptive Shielding",
        icon: "🛡️",
        baseCost: 2100,
        waveScaling: 330,
        levelScaling: 720,
        maxStacks: 3,
        description: "Damage taken reduced by 8%. Heals 10% instantly.",
        detail: (ctx) => {
          const reduction = Math.round(ctx.player.damageReduction * 100);
          return `Damage reduction: ${reduction}%`;
        },
        apply: (ctx) => {
          ctx.state.damageReductionBonus = Math.min(
            0.6,
            ctx.state.damageReductionBonus + 0.08
          );
          ctx.player.damageReduction = Math.min(
            0.7,
            ctx.baseStats.damageReduction + ctx.state.damageReductionBonus
          );
          ctx.player.health = Math.min(
            ctx.player.maxHealth,
            ctx.player.health + ctx.player.maxHealth * 0.1
          );
          return "Reactive shielding absorbs incoming fire.";
        },
      },
      {
        id: "quantum-dividends",
        name: "Quantum Dividends",
        icon: "📈",
        baseCost: 2000,
        waveScaling: 260,
        levelScaling: 600,
        maxStacks: 4,
        description: "Score gains increased by 15%.",
        detail: (ctx) => {
          const bonus = Math.round((ctx.state.scoreMultiplier - 1) * 100);
          return bonus > 0
            ? `Current bonus: +${bonus}% score`
            : "Current bonus: none";
        },
        apply: (ctx) => {
          ctx.state.scoreMultiplier *= 1.15;
          return "Data siphons rerouted into the reward pool.";
        },
      },
      {
        id: "unlock-jetpack",
        name: "Apex Flight Systems",
        icon: "🚀",
        iconClass: "rarity-legendary",
        rarity: "legendary",
        weight: 0.6,
        baseCost: 4600,
        waveScaling: 420,
        levelScaling: 0,
        maxStacks: 1,
        description:
          "Install VX-9 thrusters. Hold jump to sustain 3s of flight.",
        detail: (ctx) =>
          ctx.state.jetpackUnlocked
            ? `Burn time: ${ctx.player.jetpackMaxFuel.toFixed(1)}s`
            : "Status: Offline",
        availability: (ctx) => !ctx.state.jetpackUnlocked,
        apply: (ctx) => {
          ctx.state.jetpackUnlocked = true;
          if (typeof ctx.player.unlockJetpack === "function") {
            ctx.player.unlockJetpack();
          } else {
            ctx.player.jetpackUnlocked = true;
            ctx.player.jetpackFuel = ctx.player.jetpackMaxFuel;
          }
          if (typeof ctx.player.setJetpackFuelBonus === "function") {
            ctx.player.setJetpackFuelBonus(ctx.state.jetpackFuelBonus);
            ctx.player.refillJetpack?.();
          }
          return "VX-9 jetpack online. Hold SPACE to ignite thrusters.";
        },
      },
      {
        id: "jetpack-reservoirs",
        name: "Cryo Fuel Reservoirs",
        icon: "🛢️",
        iconClass: "rarity-epic",
        rarity: "epic",
        weight: 1.1,
        baseCost: 3200,
        waveScaling: 360,
        levelScaling: 940,
        maxStacks: 5,
        description: "Extends jetpack fuel reserves by +3 seconds.",
        detail: (ctx) => {
          const burnTime =
            typeof ctx.player?.jetpackMaxFuel === "number"
              ? ctx.player.jetpackMaxFuel
              : ctx.baseStats.jetpackBaseFuel + ctx.state.jetpackFuelBonus;
          return `Burn time: ${burnTime.toFixed(1)}s`;
        },
        availability: (ctx) => ctx.state.jetpackUnlocked === true,
        apply: (ctx) => {
          ctx.state.jetpackFuelBonus += 3;
          if (typeof ctx.player.addJetpackFuelBonus === "function") {
            ctx.player.addJetpackFuelBonus(3);
          } else {
            const baseFuel =
              typeof ctx.player.jetpackMaxFuel === "number"
                ? ctx.player.jetpackMaxFuel
                : ctx.baseStats.jetpackBaseFuel;
            ctx.player.jetpackMaxFuel = baseFuel + 3;
            ctx.player.jetpackFuel = ctx.player.jetpackMaxFuel;
          }
          return "Fuel reservoirs expanded. +3s sustained thruster burn.";
        },
      },
      {
        id: "unlock-laser-rifle",
        name: "Integrate Laser Rifle",
        icon: "🔷",
        iconClass: "rarity-common",
        rarity: "common",
        weight: 3,
        baseCost: 3200,
        waveScaling: 260,
        levelScaling: 0,
        maxStacks: 1,
        description: "Unlocks the Laser Rifle for rapid, precise beam fire.",
        detail: (ctx) =>
          ctx.weaponManager?.hasWeapon?.("laserRifle")
            ? "Status: Already integrated."
            : "Status: Not yet acquired.",
        availability: (ctx) => !ctx.weaponManager?.hasWeapon?.("laserRifle"),
        apply: (ctx) => {
          const unlocked = ctx.weaponManager?.unlockWeapon?.("laserRifle", {
            autoEquip: true,
          });
          if (!unlocked) {
            return "Laser Rifle already integrated into the arsenal.";
          }
          return "Laser Rifle integrated into the arsenal.";
        },
      },
      {
        id: "unlock-shockwave-emitter",
        name: "Deploy Shockwave Emitter",
        icon: "🌀",
        iconClass: "rarity-uncommon",
        rarity: "uncommon",
        weight: 1.6,
        baseCost: 3600,
        waveScaling: 310,
        levelScaling: 0,
        maxStacks: 1,
        description:
          "Unlocks the Shockwave Emitter for area disruption blasts.",
        detail: (ctx) =>
          ctx.weaponManager?.hasWeapon?.("shockwaveEmitter")
            ? "Status: Already integrated."
            : "Status: Not yet acquired.",
        availability: (ctx) =>
          !ctx.weaponManager?.hasWeapon?.("shockwaveEmitter"),
        apply: (ctx) => {
          const unlocked = ctx.weaponManager?.unlockWeapon?.(
            "shockwaveEmitter",
            {
              autoEquip: true,
            }
          );
          if (!unlocked) {
            return "Shockwave Emitter already integrated into the arsenal.";
          }
          return "Shockwave Emitter added for area control.";
        },
      },
      {
        id: "unlock-plasma-launcher",
        name: "Authorize Plasma Launcher",
        icon: "💠",
        iconClass: "rarity-rare",
        rarity: "rare",
        weight: 0.7,
        baseCost: 4200,
        waveScaling: 360,
        levelScaling: 0,
        maxStacks: 1,
        description:
          "Unlocks the Plasma Launcher for high-impact volatile projectiles.",
        detail: (ctx) =>
          ctx.weaponManager?.hasWeapon?.("plasmaLauncher")
            ? "Status: Already integrated."
            : "Status: Not yet acquired.",
        availability: (ctx) =>
          !ctx.weaponManager?.hasWeapon?.("plasmaLauncher"),
        apply: (ctx) => {
          const unlocked = ctx.weaponManager?.unlockWeapon?.("plasmaLauncher", {
            autoEquip: true,
          });
          if (!unlocked) {
            return "Plasma Launcher already integrated into the arsenal.";
          }
          return "Plasma Launcher protocol unlocked.";
        },
      },
    ];
  }

  _getContext() {
    return {
      player: this.player,
      weaponManager: this.weaponManager,
      baseStats: this.baseStats,
      history: this.history,
      state: this.state,
    };
  }

  _isUpgradeAvailable(upgrade, context) {
    const taken = this.history[upgrade.id] || 0;
    if (upgrade.maxStacks && taken >= upgrade.maxStacks) {
      return false;
    }

    if (typeof upgrade.availability === "function") {
      try {
        if (!upgrade.availability(context)) {
          return false;
        }
      } catch (error) {
        console.warn("Upgrade availability check failed:", upgrade.id, error);
        return false;
      }
    }

    return true;
  }

  _drawWeightedUpgrade(pool) {
    if (!pool.length) {
      return null;
    }

    const totalWeight = pool.reduce(
      (sum, upgrade) =>
        sum + (typeof upgrade.weight === "number" ? upgrade.weight : 1),
      0
    );

    if (totalWeight <= 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    let roll = Math.random() * totalWeight;
    for (const upgrade of pool) {
      roll -= typeof upgrade.weight === "number" ? upgrade.weight : 1;
      if (roll <= 0) {
        return upgrade;
      }
    }

    return pool[pool.length - 1];
  }

  getUpgradeOptions(waveNumber = 1) {
    const context = this._getContext();
    const options = [];
    const available = this.upgrades.filter((upgrade) =>
      this._isUpgradeAvailable(upgrade, context)
    );

    const pool = available.length ? [...available] : [...this.upgrades];
    const workingPool = [...pool];

    while (options.length < 3 && workingPool.length) {
      const upgrade = this._drawWeightedUpgrade(workingPool);
      if (!upgrade) {
        break;
      }
      options.push(this._buildOption(upgrade, waveNumber, context));
      const removalIndex = workingPool.indexOf(upgrade);
      if (removalIndex >= 0) {
        workingPool.splice(removalIndex, 1);
      }
    }

    while (options.length < 3) {
      const fallback =
        this.upgrades[Math.floor(Math.random() * this.upgrades.length)];
      options.push(this._buildOption(fallback, waveNumber, context));
    }

    return options;
  }

  _buildOption(upgrade, waveNumber, context = this._getContext()) {
    const level = this.history[upgrade.id] || 0;
    const cost = this._calculateCost(upgrade, waveNumber, level);
    const detail =
      typeof upgrade.detail === "function" ? upgrade.detail(context) : "";
    const rarity = upgrade.rarity || null;
    const rarityLabel = rarity ? rarity.toUpperCase() : "";
    const iconClass = upgrade.iconClass || (rarity ? `rarity-${rarity}` : "");
    const rarityClass = rarity ? `rarity-${rarity}` : "";

    return {
      id: upgrade.id,
      name: upgrade.name,
      icon: upgrade.icon,
      iconClass,
      rarityLabel,
      rarityClass,
      description: upgrade.description,
      detail,
      cost,
      currentLevel: level,
      maxStacks: upgrade.maxStacks || null,
    };
  }

  _calculateCost(upgrade, waveNumber, level) {
    const base = upgrade.baseCost || 2000;
    const wave = upgrade.waveScaling || 0;
    const levelFactor = upgrade.levelScaling || 0;
    const computed = base + wave * waveNumber + levelFactor * level;
    return Math.round(computed / 10) * 10;
  }

  applyUpgrade(upgradeId) {
    const upgrade = this.upgrades.find((item) => item.id === upgradeId);
    if (!upgrade) {
      return { success: false, message: "Upgrade not found." };
    }

    const taken = this.history[upgrade.id] || 0;
    if (upgrade.maxStacks && taken >= upgrade.maxStacks) {
      return { success: false, message: "Upgrade already at max rank." };
    }

    const context = this._getContext();

    if (!this._isUpgradeAvailable(upgrade, context)) {
      return { success: false, message: "Upgrade not currently available." };
    }

    const resultMessage = upgrade.apply(context);

    this.history[upgrade.id] = taken + 1;

    return {
      success: true,
      message: resultMessage || `${upgrade.name} acquired.`,
    };
  }

  getScoreMultiplier() {
    return this.state.scoreMultiplier;
  }

  reset() {
    this.history = {};
    this.state = this._createDefaultState();

    if (this.weaponManager) {
      if (typeof this.weaponManager.resetLoadout === "function") {
        this.weaponManager.resetLoadout();
      }
      this.weaponManager.setDamageMultiplier(1);
      this.weaponManager.setProjectileSpeedMultiplier(1);
    }

    if (!this.player) {
      return;
    }

    this.player.speed = this.baseStats.speed;
    this.player.sprintMultiplier = this.baseStats.sprintMultiplier;
    this.player.jumpPower = this.baseStats.jumpPower;
    this.player.maxStepHeight = this.baseStats.maxStepHeight;
    this.player.empDamage = this.baseStats.empDamage;
    this.player.empRadius = this.baseStats.empRadius;
    this.player.empStunDuration = this.baseStats.empStunDuration;
    this.player.specialCooldownMax = this.baseStats.specialCooldownMax;
    this.player.specialEnergyCost = this.baseStats.specialEnergyCost;
    this.player.maxHealth = this.baseStats.maxHealth;
    this.player.health = Math.min(this.player.health, this.player.maxHealth);
    this.player.damageReduction = this.baseStats.damageReduction;

    if (typeof this.player.resetJetpackToBase === "function") {
      this.player.resetJetpackToBase();
    } else {
      this.player.jetpackUnlocked = false;
      this.player.jetpackFuel = 0;
      this.player.jetpackMaxFuel = this.baseStats.jetpackBaseFuel;
      this.player.jetpackFuelBonus = 0;
      this.player.jetpackRefuelTimer = 0;
      this.player.jetpackIsActive = false;
    }
  }

  /**
   * Get current upgrade state for saving
   * @returns {Object}
   */
  getSaveData() {
    return {
      history: { ...this.history },
      state: { ...this.state },
    };
  }

  /**
   * Restore upgrades from save data
   * @param {Object} saveData - Saved upgrade data
   */
  restoreFromSave(saveData) {
    if (!saveData || typeof saveData !== "object") {
      console.warn("Invalid save data for upgrades");
      return;
    }

    // Restore history and state
    this.history = saveData.history ? { ...saveData.history } : {};
    this.state = saveData.state
      ? { ...saveData.state }
      : this._createDefaultState();

    // Re-apply all stat modifications based on restored state
    const context = this._getContext();

    // Apply weapon multipliers
    if (this.weaponManager) {
      this.weaponManager.setDamageMultiplier(
        this.state.weaponDamageMultiplier || 1
      );
      this.weaponManager.setProjectileSpeedMultiplier(
        this.state.projectileSpeedMultiplier || 1
      );
    }

    if (!this.player) {
      return;
    }

    // Apply player stat multipliers
    this.player.speed =
      this.baseStats.speed * (this.state.moveSpeedMultiplier || 1);
    this.player.sprintMultiplier =
      this.baseStats.sprintMultiplier * (this.state.moveSpeedMultiplier || 1);
    this.player.jumpPower =
      this.baseStats.jumpPower * (this.state.jumpMultiplier || 1);
    this.player.maxStepHeight =
      this.baseStats.maxStepHeight *
      (1 + ((this.state.jumpMultiplier || 1) - 1) * 0.4);

    // Apply EMP stats
    this.player.empDamage =
      this.baseStats.empDamage * (this.state.empDamageMultiplier || 1);
    this.player.empRadius =
      this.baseStats.empRadius * (this.state.empRadiusMultiplier || 1);
    this.player.empStunDuration =
      this.baseStats.empStunDuration + (this.state.empStunDurationBonus || 0);
    this.player.specialCooldownMax = Math.max(
      0.8,
      this.baseStats.specialCooldownMax *
        (this.state.specialCooldownMultiplier || 1)
    );

    // Apply health stats
    this.player.maxHealth =
      this.baseStats.maxHealth * (this.state.maxHealthMultiplier || 1);
    this.player.health = Math.min(this.player.health, this.player.maxHealth);
    this.player.damageReduction = Math.min(
      0.7,
      this.baseStats.damageReduction + (this.state.damageReductionBonus || 0)
    );

    // Restore jetpack state
    if (this.state.jetpackUnlocked) {
      if (typeof this.player.unlockJetpack === "function") {
        this.player.unlockJetpack();
      } else {
        this.player.jetpackUnlocked = true;
      }

      if (typeof this.player.setJetpackFuelBonus === "function") {
        this.player.setJetpackFuelBonus(this.state.jetpackFuelBonus || 0);
      } else {
        const baseFuel =
          this.player.jetpackMaxFuel || this.baseStats.jetpackBaseFuel;
        this.player.jetpackMaxFuel =
          baseFuel + (this.state.jetpackFuelBonus || 0);
        this.player.jetpackFuel = this.player.jetpackMaxFuel;
      }
    }

    console.log("✅ Upgrades restored from save:", this.history);
  }
}

export default UpgradeManager;
