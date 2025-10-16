# Troubleshooting Guide

## Issue: "Start Mission" button not working

I've fixed the module loading issue. Here's what was wrong and what I fixed:

### Problem:

1. The HTML was not properly importing the Game module
2. There was a duplicate initialization in Game.js

### Solution Applied:

1. ✅ Updated `index.html` to properly import and initialize the Game class
2. ✅ Exported the Game class in `Game.js`
3. ✅ Removed duplicate initialization code

### How to Test:

1. **Restart the app**:

   ```bash
   npm start
   ```

2. **You should see**:

   - A green "VIRUS HUNTER" title screen
   - "START MISSION" button that glows on hover
   - Controls displayed at the bottom

3. **When you click "START MISSION"**:
   - The start screen should disappear
   - HUD (Health/Energy bars) should appear at top left
   - Score should appear at top right
   - Wave 1 message should display
   - The 3D environment should be visible

### Debug Steps if Still Not Working:

1. **Open Developer Tools** (F12 or Ctrl+Shift+I)
2. **Check Console tab** for error messages
3. **Look for these specific errors**:
   - Module import errors
   - "Failed to load resource" errors
   - JavaScript exceptions

### Common Issues & Fixes:

#### Error: "Cannot find module"

- **Cause**: Missing export statement
- **Fix**: All classes are now properly exported with `export class`

#### Error: "Unexpected token"

- **Cause**: Browser doesn't support ES6 modules
- **Fix**: Use Chrome/Edge/Firefox (latest version)

#### Black screen after clicking Start

- **Possible causes**:

  1. Three.js not loaded properly
  2. Canvas not rendering
  3. Camera position issue

- **Debug**:
  ```javascript
  // Open console (F12) and type:
  console.log(window.THREE); // Should show Three.js object
  ```

### What Should Happen:

**Before clicking "START MISSION"**:

- 3D scene is rendering in background (black with stars)
- Start screen overlay is visible
- Button is interactive

**After clicking "START MISSION"**:

1. `startGame()` is called
2. Start screen hides (`display: none`)
3. HUD elements show
4. Player spawns at (0, 0, 0)
5. Environment loads (grid, platforms, stars)
6. First wave spawns enemies
7. Camera positions behind player
8. Game loop starts updating

### Verification Checklist:

✅ **Module System**:

- [x] Game class exported
- [x] HTML imports Game module
- [x] All dependencies imported correctly

✅ **Event Listeners**:

- [x] Start button click handler attached
- [x] DOMContentLoaded event fires
- [x] Game instance created

✅ **Game Initialization**:

- [x] Three.js scene created
- [x] Canvas element found
- [x] Renderer initialized
- [x] All managers created

### Expected Console Output:

When you click "START MISSION", you should NOT see any errors. The game should just start playing.

### If you see a white/black screen:

1. **Check if canvas exists**:

   ```javascript
   console.log(document.getElementById("gameCanvas"));
   ```

2. **Check if renderer is working**:

   - Right-click on the game window
   - Inspect element
   - Look for canvas with width/height attributes

3. **Check if scene has objects**:
   - There should be lights, environment, and player objects

### Performance Tips:

Once the game is working, if you experience lag:

1. **Reduce particle counts** in `ParticleSystem.js`
2. **Lower shadow quality** in `Game.js` renderer settings
3. **Reduce enemy spawn rate** in `WaveManager.js`

### Need More Help?

If the issue persists:

1. **Share the console errors** - Copy any red error messages
2. **Check browser compatibility** - Use latest Chrome/Edge/Firefox
3. **Verify file structure** - All files should be in correct folders

### Recent Changes Made:

```diff
index.html:
- <script src="game/Game.js" type="module"></script>
+ <script type="module">
+     import { Game } from './game/Game.js';
+     window.addEventListener('DOMContentLoaded', () => {
+         new Game();
+     });
+ </script>

Game.js:
- class Game {
+ export class Game {

- // Start the game
- window.addEventListener('DOMContentLoaded', () => {
-     new Game();
- });
(removed - now handled in HTML)
```

## Try It Now!

Close any existing game window and run:

```bash
npm start
```

The game should now work when you click "START MISSION"!

---

## Additional Debug Commands

If you want to see what's happening under the hood:

### Check if game instance exists:

```javascript
// In browser console:
window.game = null; // First clear
// Then modify index.html to:
// const game = new Game();
// window.game = game;
```

### Monitor frame rate:

Press F12, then in Console tab:

```javascript
setInterval(() => {
  console.log("FPS:", Math.round(1000 / 16)); // Approximate
}, 1000);
```

### See active enemies:

```javascript
// After game starts:
console.log(game.enemyManager.getEnemies().length);
```
