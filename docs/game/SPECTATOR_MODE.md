# Spectator Mode Documentation

## Overview

Spectator Mode allows you to explore all 8 environments without combat, perfect for educational purposes or level design review.

## How to Use

### Starting Spectator Mode

1. Launch the game
2. On the start screen, click **"SPECTATOR MODE"** button
3. The camera will be free-flying and you can explore

### Controls in Spectator Mode

#### Camera Movement

- **W/A/S/D** - Move camera forward/left/backward/right
- **Space** - Move camera up
- **Shift** - Move camera down
- **Mouse** - Look around
- **Hold Shift while moving** - Move faster (sprint)

#### Environment Switching

Press number keys **1-8** to instantly jump to different environments:

- **1** - CPU Core Chamber
- **2** - Memory Banks
- **3** - GPU Accelerator
- **4** - Motherboard Circuit
- **5** - Hard Drive Sector
- **6** - Retro Terminal
- **7** - Network Hub Nexus
- **8** - System Overview

#### Exit Spectator Mode

- **ESC** - Return to main menu

## UI Elements

- Top-left corner shows:
  - Current mode (SPECTATOR)
  - Current environment name
  - List of all environments with their numbers

## Technical Features

### Free Camera

- No collision detection - fly through walls and objects
- Adjustable speed (normal: 20 units/s, sprint: 40 units/s)
- Full 360° rotation with pitch limits

### Environment Loading

- Instant switching between environments
- Proper cleanup of previous environment
- All environment animations continue to run
- Dynamic lighting adjusts to each environment's palette

### Starting Positions

Each environment has an optimized starting position for best viewing:

- CPU: Above the central processing area
- Memory: Overlooking the RAM banks
- GPU: High view of parallel cores
- Motherboard: Bird's eye view of circuit traces
- Hard Drive: View of spinning platter
- Retro Terminal: Front view of CRT screen
- Network Hub: Central hub overview
- System Overview: High elevation to see all components

## Known Issues (Fixed)

✅ **Environment switching not working** - Fixed by properly clearing the mapGroup and allowing phase re-setting
✅ **Same CPU map appearing** - Fixed by forcing environment cleanup and rebuild
✅ **Minimap inversion** - Already fixed in previous update with coordinate flipping

## Use Cases

### Educational

- Study environment design and composition
- Learn about computer hardware components
- Understand spatial layout and scale
- Screenshot generation for documentation

### Level Design

- Test environment visibility and layout
- Check lighting and atmosphere
- Verify collision geometry placement
- Inspect animated elements

### Debugging

- Verify environment transitions work correctly
- Check for missing geometry or artifacts
- Test particle systems and effects
- Validate environment boundaries

## Implementation Details

### Files Modified

- `src/index.html` - Added SPECTATOR MODE button and UI
- `src/game/SpectatorCamera.js` - Free-flying camera controller (NEW)
- `src/game/SpectatorMode.js` - Spectator mode manager (NEW)
- `src/game/GameMain.js` - Integration with game loop
- `src/game/game-bundle.js` - Added new script loading
- `src/environment/Environment.js` - Added currentEnvironment tracking, fixed phase switching

### Key Classes

#### SpectatorCamera

- Handles free-flying camera movement
- WASD + Space/Shift for 6-axis movement
- Mouse look with pitch clamping
- Sprint mode for faster movement

#### SpectatorMode

- Manages spectator mode lifecycle
- Handles environment switching (1-8 keys)
- Updates UI with current environment
- Cleans up on exit

### Event Flow

1. User clicks SPECTATOR MODE button
2. GameMain.startSpectatorMode() called
3. SpectatorMode.start() initializes
4. SpectatorCamera.activate() enables free camera
5. Environment loaded with setPhase(0)
6. User can switch environments with number keys
7. ESC returns to main menu

## Future Enhancements

- Add slow-motion time control
- Include environment information overlays
- Add screenshot/camera position bookmarking
- Implement replay system
- Add measurement tools for distances
