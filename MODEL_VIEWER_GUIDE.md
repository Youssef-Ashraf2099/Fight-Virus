# Model Viewer - Quick Guide

## Overview
A comprehensive model viewer has been added to the game that allows you to view all weapons, enemies, and bosses without grinding through levels.

## How to Access
1. Launch the game
2. From the main menu, click the **🎨 MODEL VIEWER** button
3. The model viewer will open in a new page

## Features

### Model Categories
- **🔫 WEAPONS** - All 6 weapons in the game
- **👾 ENEMIES** - All 9 enemy types
- **💀 BOSSES** - All 7 boss models

### Controls
- **Left Mouse Button** - Rotate model
- **Right Mouse Button** - Pan camera
- **Mouse Wheel** - Zoom in/out
- **R Key** - Reset camera view
- **Space Bar** - Toggle auto-rotation

### Information Panel
Each model displays:
- Name and type
- Description
- Statistics (damage, health, speed, etc.)

## Models Included

### Weapons
1. Pulse Cannon - Starting weapon
2. Revolver - High-damage pistol (6 shots)
3. Laser Rifle - Rapid fire beam weapon
4. Plasma Blade - Melee sword with combos
5. Shockwave Emitter - Area effect weapon
6. Plasma Launcher - Heavy explosive weapon

### Enemies
1. Basic Virus - Standard enemy
2. Fast Virus - Quick moving threat
3. Tank Virus - Heavy armor
4. Sniper Virus - Long range attacker
5. Exploder Virus - Suicide bomber
6. Shielder Virus - Shield generator
7. Drone Virus - Flying enemy
8. Shield Virus - Regenerating shield tank
9. Blaster Virus - Burst fire specialist

### Bosses
1. Pixel Reaper - First boss
2. Packet Hydra - Multi-headed threat
3. Circuit Overlord - Electric boss
4. Data Wyrm - Segmented serpent
5. Firewall Archon - Shield master
6. Neural Overmind - Minion spawner
7. Corruption Core - Final boss

## Technical Details

### Files Created
- `src/modelViewer.html` - Viewer interface
- `src/modelViewer.js` - Viewer logic and controls
- Updated `vite.config.js` - Multi-page build config
- Updated `src/index.html` - Added Model Viewer button
- Updated `src/game/GameMain.js` - Button event handler

### Navigation
- Click **← BACK TO GAME** button to return to main menu
- Or navigate to `index.html` directly

## Tips
- Use auto-rotate (Space) to see models from all angles
- Each model is lit with professional 3-point lighting
- Stats are displayed for reference during gameplay planning
- Perfect for studying enemy patterns before encounters
