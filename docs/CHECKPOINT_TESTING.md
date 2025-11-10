# Testing the Checkpoint System

## Quick Test Guide

### Test 1: Basic Save and Continue

1. Launch the game
2. Start a new game
3. Complete waves 1-3 (defeat the first boss)
4. Verify you see "💾 CHECKPOINT SAVED 💾" message
5. Press ESC to quit to main menu
6. Verify "CONTINUE" button appears on main menu
7. Verify checkpoint info shows: "Wave 3 • [score] pts • just now"
8. Click "CONTINUE"
9. Verify you start at wave 4 with all your upgrades and weapons intact

### Test 2: Game Over Recovery

1. Continue from test 1 or start fresh
2. Play until you have a checkpoint saved
3. Die intentionally (let enemies kill you)
4. Verify game over message shows: "Press R to Restart | Press C to Continue from Checkpoint"
5. Press C
6. Verify you resume from the last checkpoint

### Test 3: New Game with Existing Checkpoint

1. Have a checkpoint saved
2. On main menu, click "NEW GAME"
3. Verify game starts from wave 1 with no upgrades
4. Quit to main menu
5. Verify "CONTINUE" button still shows your previous checkpoint
6. Click "CONTINUE"
7. Verify you resume from the saved checkpoint (not the new game you just started)

### Test 4: Multiple Boss Completions

1. Start new game or continue
2. Complete multiple boss waves (waves 3, 6, 9, etc.)
3. Verify each boss completion saves a checkpoint (overwrites previous)
4. Quit and verify "CONTINUE" shows the LATEST checkpoint info

### Test 5: Upgrade Persistence

1. Start new game
2. Defeat boss at wave 3
3. Select an upgrade (e.g., "Overclocked Arsenal")
4. Note your weapon damage and other stats
5. Quit to main menu
6. Click "CONTINUE"
7. Verify your selected upgrade is still active
8. Verify weapon damage matches what you had

### Test 6: Weapon Unlock Persistence

1. Start new game
2. Progress and unlock new weapons via upgrades
3. Save checkpoint (defeat a boss)
4. Quit and continue
5. Verify unlocked weapons are still available
6. Verify currently equipped weapon is correct

### Test 7: Environment Phase Persistence

1. Play until you reach a different environment (wave 4+ for new phase)
2. Save checkpoint
3. Quit and continue
4. Verify you're in the correct environment phase
5. Verify environment matches the wave number

## Expected Behaviors

### On Checkpoint Save

- Message displays: "💾 CHECKPOINT SAVED 💾"
- Console logs: "✅ Checkpoint saved at wave [X]"
- No interruption to gameplay

### On Main Menu

- "CONTINUE" button visible only if checkpoint exists
- Checkpoint info shows: Wave number, Score, Time ago
- Both "NEW GAME" and "CONTINUE" work correctly

### On Continue

- Loading message: "RESTORING CHECKPOINT"
- Message displays: "CHECKPOINT RESTORED WAVE [X] - INCOMING!"
- Player spawns with correct stats
- All upgrades active and functional
- All weapons unlocked and available
- Environment phase matches saved wave

### On Game Over

- With checkpoint: Shows both restart (R) and continue (C) options
- Without checkpoint: Shows only restart (R) option
- Pressing C loads checkpoint immediately

## Debug Tips

### Check localStorage

```javascript
// Open browser console (F12)
// View saved checkpoint:
JSON.parse(localStorage.getItem("virusHunter_checkpoint"));

// Delete checkpoint:
localStorage.removeItem("virusHunter_checkpoint");

// Check if checkpoint exists:
!!localStorage.getItem("virusHunter_checkpoint");
```

### Console Messages to Look For

- "✅ Checkpoint saved successfully:"
- "✅ Checkpoint loaded successfully:"
- "✅ Game continued successfully from checkpoint!"
- "✅ Upgrades restored from save:"
- "ℹ️ No checkpoint found"

### Common Issues and Fixes

**Issue**: Continue button doesn't appear

- Check: `localStorage.getItem('virusHunter_checkpoint')`
- Fix: Ensure you defeated a boss (wave 3, 6, 9, etc.)

**Issue**: Stats not restored correctly

- Check console for "✅ Upgrades restored from save:"
- Verify upgrade history in checkpoint data

**Issue**: Wrong wave after continue

- Expected: Starts at wave AFTER last checkpoint
- Example: Saved at wave 3 → Continue starts at wave 4

**Issue**: Checkpoint not saving

- Check browser localStorage quota
- Check console for errors during save
- Verify boss was actually defeated

## Performance Notes

- Checkpoint save is instant (no noticeable delay)
- Load time same as regular game start
- localStorage has ~5-10MB limit (checkpoint is <10KB)
- Checkpoints persist across browser sessions
- Closing browser doesn't delete checkpoints

## Edge Cases to Test

1. **Quick succession saves**: Defeat multiple bosses rapidly
2. **Browser refresh**: Save checkpoint, refresh page, verify continue works
3. **Multiple browser tabs**: Each tab has independent game state but shares localStorage
4. **Clear browser data**: Clears checkpoints (expected behavior)
5. **Incognito mode**: Checkpoints work but are cleared when window closes
