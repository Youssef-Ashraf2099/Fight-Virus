# Checkpoint Auto-Save System

## Overview

The checkpoint auto-save system automatically saves your game progress after completing each boss fight (every 3rd wave). This allows players to continue their game from the last checkpoint instead of starting over from wave 1.

## Features

### 1. **Auto-Save After Boss Fights**

- Automatically saves progress after defeating a boss (waves 3, 6, 9, 12, etc.)
- Saves to browser's localStorage (persistent across sessions)
- Shows "💾 CHECKPOINT SAVED 💾" message on successful save

### 2. **Main Menu Options**

- **🆕 NEW GAME**: Start a fresh game from wave 1
- **▶️ CONTINUE**: Load your last checkpoint and continue from where you left off
- The Continue button only appears if a checkpoint exists
- Shows checkpoint info: Wave number, Score, and Time since last save

### 3. **Saved Data**

The checkpoint saves:

- Current wave number
- Total score
- Difficulty level
- Environment phase
- Player stats (health, energy, max values)
- All unlocked upgrades and their effects
- All unlocked weapons
- Currently equipped weapon

### 4. **Game Over Recovery**

When you die, you have two options:

- **Press R**: Restart from wave 1 (normal restart)
- **Press C**: Continue from last checkpoint (if one exists)

## How It Works

### Save Triggers

1. **After Boss Defeat**: Checkpoint is automatically saved when you complete a boss wave
2. The system saves to `localStorage` using the key: `virusHunter_checkpoint`

### Continue Game Flow

1. Click "CONTINUE" from main menu
2. Game loads checkpoint data
3. Restores all player stats, upgrades, and weapons
4. Sets you to the wave AFTER the last saved checkpoint
5. Environment phase matches your saved progress
6. All upgrades and weapons are restored exactly as they were

### New Game Flow

1. Click "NEW GAME" from main menu
2. Starts fresh from wave 1
3. Does NOT delete your checkpoint (can still continue later)
4. Resets all upgrades and weapons to defaults

## Technical Details

### SaveManager Class

Located at: `src/game/SaveManager.js`

Key methods:

- `saveCheckpoint(gameState)` - Saves current game state
- `loadCheckpoint()` - Loads saved checkpoint
- `hasCheckpoint()` - Checks if checkpoint exists
- `getCheckpointInfo()` - Gets formatted checkpoint info for display
- `deleteCheckpoint()` - Manually delete checkpoint

### Data Structure

```javascript
{
  version: "1.0",
  timestamp: Date.now(),
  wave: 6,
  score: 15000,
  difficulty: 2.0,
  phaseIndex: 1,

  player: {
    health: 100,
    maxHealth: 150,
    energy: 100,
    maxEnergy: 100
  },

  upgrades: {
    history: { /* upgrade IDs and levels */ },
    state: { /* multipliers and bonuses */ }
  },

  weapons: {
    unlockedWeapons: ["pulseCannon", "laserRifle"],
    currentWeaponIndex: 1
  }
}
```

## Player Experience

### First-Time Player

1. Plays through waves 1-3
2. Defeats first boss
3. Sees "💾 CHECKPOINT SAVED 💾"
4. If they die on wave 4, they can:
   - Restart from wave 1 (R key)
   - Continue from wave 4 (C key)
5. Next time they launch the game:
   - Main menu shows "CONTINUE" button
   - Shows "Wave 3 • 12,450 pts • 2 hours ago"

### Returning Player

1. Opens game
2. Sees "CONTINUE" button with checkpoint info
3. Can choose to continue or start fresh
4. Checkpoint persists until manually deleted or overwritten

## Benefits

1. **Reduced Frustration**: Don't lose hours of progress
2. **Session-Friendly**: Can close and resume later
3. **Encourages Experimentation**: Try different upgrades knowing you can continue
4. **Respects Player Time**: Checkpoints after significant milestones
5. **Persistent Progress**: Saves across game sessions

## Future Enhancements

Possible improvements:

- Multiple save slots
- Manual save option
- Cloud save sync
- Checkpoint rewards (bonus items for reaching checkpoints)
- Checkpoint replay (replay from any previous checkpoint)

## Notes

- Checkpoints are saved in browser localStorage
- Clearing browser data will delete checkpoints
- Maximum 1 checkpoint per game instance
- Checkpoints overwrite previous saves
- Works offline (local storage only)
