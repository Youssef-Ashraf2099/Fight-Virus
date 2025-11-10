# Checkpoint System - Player Guide

## 🎮 What is the Checkpoint System?

The checkpoint system automatically saves your game progress after you defeat each boss. This means you don't have to start from the very beginning if you die or need to take a break!

## 💾 When Does the Game Save?

Your progress is **automatically saved** after you complete these waves:
- Wave 3 (First Boss)
- Wave 6 (Second Boss)
- Wave 9 (Third Boss)
- Wave 12, 15, 18... and so on (every 3rd wave)

You'll see a message: **"💾 CHECKPOINT SAVED 💾"** when your progress is saved.

## ▶️ How to Continue Your Game

### From the Main Menu:
1. When you launch the game, look for the **"▶️ CONTINUE"** button
2. If you have a saved checkpoint, you'll also see info like:
   - `Wave 6 • 15,000 pts • 2 hours ago`
3. Click **"CONTINUE"** to resume from your last checkpoint

### After Game Over:
If you die and have a checkpoint saved:
- Press **R** to restart from Wave 1 (normal restart)
- Press **C** to continue from your last checkpoint

## 🆕 Starting a New Game

Don't worry! Starting a **"🆕 NEW GAME"** won't delete your checkpoint:
- You can start fresh from Wave 1
- Your checkpoint is still saved
- You can go back to the main menu and click "CONTINUE" anytime

## 📦 What Gets Saved?

When you reach a checkpoint, the game saves:
- ✅ Your current wave number
- ✅ Your total score
- ✅ Your health and energy
- ✅ All upgrades you've unlocked
- ✅ All weapons you've unlocked
- ✅ Which weapon you have equipped
- ✅ Which environment/map you're in

## 💡 Tips

### Smart Use of Checkpoints
- **Experiment safely**: Try different upgrades knowing you can always continue
- **Take breaks**: Close the game anytime and resume later from your checkpoint
- **Boss practice**: If you die to a boss, you can continue from just before that boss wave

### Understanding Continue vs New Game
- **Continue**: Resume exactly where you left off (after your last boss fight)
- **New Game**: Start fresh from Wave 1, but keeps your checkpoint for later

## ❓ Common Questions

### Q: Where is my saved game stored?
**A:** Your checkpoint is saved in your browser's local storage. It will persist even if you close the browser!

### Q: Can I have multiple saves?
**A:** Currently, there's only one checkpoint slot. Each time you beat a boss, it updates your checkpoint.

### Q: What happens if I clear my browser data?
**A:** Clearing browser data will delete your checkpoint. Make sure you don't accidentally clear local storage if you want to keep your progress!

### Q: Do I need to be online?
**A:** No! Checkpoints are saved locally on your computer. No internet required.

### Q: Can I save manually?
**A:** Not yet - saves happen automatically after boss fights. This is to ensure meaningful progress milestones.

### Q: What if I want to start completely fresh?
**A:** Just click "NEW GAME" and play through. Your old checkpoint stays saved if you change your mind.

## 🎯 Example Gameplay Session

### Session 1:
1. Start new game
2. Complete waves 1-3
3. Defeat first boss
4. See "💾 CHECKPOINT SAVED 💾"
5. Die on wave 5
6. Press **C** to continue from wave 4
7. Complete wave 4-6
8. Defeat second boss
9. Quit game

### Session 2 (Next Day):
1. Launch game
2. See "CONTINUE" button with "Wave 6 • 18,500 pts • 1 day ago"
3. Click "CONTINUE"
4. Resume at wave 7 with all your upgrades and weapons!

## 🚨 Troubleshooting

### "CONTINUE" button doesn't appear:
- You need to defeat at least one boss (Wave 3) first
- Check if you might have cleared browser data

### My stats seem wrong after continuing:
- This shouldn't happen, but try restarting the game
- Report the issue with details about which wave you saved at

### Game crashes when loading checkpoint:
- Try clearing the checkpoint and starting fresh
- Open browser console (F12) and look for error messages

### Want to delete your checkpoint manually:
1. Open browser console (F12)
2. Type: `localStorage.removeItem('virusHunter_checkpoint')`
3. Press Enter
4. Refresh the page

## 🎊 Enjoy Your Adventure!

With the checkpoint system, you can:
- ✨ Play at your own pace
- 🛡️ Not worry about losing hours of progress
- 🎮 Experiment with different strategies
- 💪 Challenge yourself knowing you can always continue
- 🎯 Focus on enjoying the game!

**Remember**: The game saves automatically after every boss. Just play, defeat bosses, and your progress is safe! 🚀
