/**
 * SaveManager - Handles checkpoint autosave and load functionality
 * Saves game state to localStorage after each boss fight
 */
export default class SaveManager {
  constructor() {
    this.SAVE_KEY = "virusHunter_checkpoint";
    this.AUTO_SAVE_KEY = "virusHunter_autosave";
  }

  /**
   * Save a checkpoint after boss completion
   * @param {Object} gameState - Current game state
   */
  saveCheckpoint(gameState) {
    try {
      const checkpoint = {
        version: "1.0",
        timestamp: Date.now(),
        wave: gameState.wave,
        score: gameState.score,
        difficulty: gameState.difficulty,
        phaseIndex: gameState.phaseIndex,

        // Player stats
        player: {
          health: gameState.player.health,
          maxHealth: gameState.player.maxHealth,
          energy: gameState.player.energy,
          maxEnergy: gameState.player.maxEnergy,
        },

        // Upgrade manager state
        upgrades: {
          history: gameState.upgradeManager?.history || {},
          state: gameState.upgradeManager?.state || {},
        },

        // Weapon manager state
        weapons: {
          unlockedWeapons:
            gameState.weaponManager?.getUnlockedWeapons?.() || [],
          currentWeaponIndex: gameState.weaponManager?.currentWeaponIndex || 0,
        },
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(checkpoint));
      console.log("✅ Checkpoint saved successfully:", checkpoint);
      return true;
    } catch (error) {
      console.error("❌ Failed to save checkpoint:", error);
      return false;
    }
  }

  /**
   * Load the last checkpoint
   * @returns {Object|null} - Saved checkpoint data or null if none exists
   */
  loadCheckpoint() {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) {
        console.log("ℹ️ No checkpoint found");
        return null;
      }

      const checkpoint = JSON.parse(savedData);
      console.log("✅ Checkpoint loaded successfully:", checkpoint);
      return checkpoint;
    } catch (error) {
      console.error("❌ Failed to load checkpoint:", error);
      return null;
    }
  }

  /**
   * Check if a checkpoint exists
   * @returns {boolean}
   */
  hasCheckpoint() {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      return savedData !== null;
    } catch (error) {
      console.error("❌ Failed to check for checkpoint:", error);
      return false;
    }
  }

  /**
   * Delete the current checkpoint
   */
  deleteCheckpoint() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log("✅ Checkpoint deleted");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete checkpoint:", error);
      return false;
    }
  }

  /**
   * Get checkpoint info for display
   * @returns {Object|null} - Formatted checkpoint info or null
   */
  getCheckpointInfo() {
    const checkpoint = this.loadCheckpoint();
    if (!checkpoint) return null;

    return {
      wave: checkpoint.wave,
      score: checkpoint.score,
      timestamp: checkpoint.timestamp,
      timeAgo: this._formatTimeAgo(checkpoint.timestamp),
    };
  }

  /**
   * Format timestamp as "time ago"
   * @private
   */
  _formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "just now";
  }

  /**
   * Auto-save current game state (for recovery from crashes)
   * @param {Object} gameState - Current game state
   */
  autoSave(gameState) {
    try {
      const autoSave = {
        version: "1.0",
        timestamp: Date.now(),
        wave: gameState.wave,
        score: gameState.score,
        difficulty: gameState.difficulty,
        phaseIndex: gameState.phaseIndex,

        player: {
          health: gameState.player.health,
          maxHealth: gameState.player.maxHealth,
          energy: gameState.player.energy,
          maxEnergy: gameState.player.maxEnergy,
          position: {
            x: gameState.player.position?.x || 0,
            y: gameState.player.position?.y || 0,
            z: gameState.player.position?.z || 0,
          },
        },

        upgrades: {
          history: gameState.upgradeManager?.history || {},
          state: gameState.upgradeManager?.state || {},
        },

        weapons: {
          unlockedWeapons:
            gameState.weaponManager?.getUnlockedWeapons?.() || [],
          currentWeaponIndex: gameState.weaponManager?.currentWeaponIndex || 0,
        },
      };

      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(autoSave));
      return true;
    } catch (error) {
      console.error("❌ Failed to auto-save:", error);
      return false;
    }
  }

  /**
   * Clear auto-save data
   */
  clearAutoSave() {
    try {
      localStorage.removeItem(this.AUTO_SAVE_KEY);
      return true;
    } catch (error) {
      console.error("❌ Failed to clear auto-save:", error);
      return false;
    }
  }
}
