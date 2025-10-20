## Debugging notes - Enemy static mode

For quick testing you can make enemies static (they won't move or deal contact damage) and avoid spawning on the player:

- Press F6 during the running game to toggle "Static enemies" on/off. A small UI message appears when toggled.
- From the browser console you can also run:

  // Toggle static enemies
  window.game && window.game.enemyManager && window.game.enemyManager.setStaticMode(true);

Or disable static mode with setStaticMode(false).

If enemies appear to spawn on the player, ensure the game calls `enemyManager.lastPlayerPosition` before starting waves. The codebase now sets that in `GameMain.startGame()` automatically.

Notes:

- Static mode is intended for testing only — restore it to false for normal gameplay.
