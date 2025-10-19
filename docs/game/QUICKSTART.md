# Quick Start Guide - Virus Hunter

## 🎮 Get Started in 3 Steps

### Step 1: Setup (Already Done! ✅)

The dependencies are installed and Three.js is downloaded.

### Step 2: Run the Game

**Option A: Development Mode** (Recommended for first run)

```bash
npm run dev
```

This opens the game with Developer Tools so you can see any messages or errors.

**Option B: Play Mode**

```bash
npm start
```

This runs the game in full production mode.

### Step 3: Play!

**Controls:**

- **W/A/S/D** - Move your character
- **Mouse** - Aim your weapon
- **Left Click** - Fire
- **1/2/3/4** - Switch weapons
- **Space** - EMP Special Ability (costs 50 energy)

## 🎯 Game Tips

### Survival Strategy

1. **Keep Moving** - Don't let enemies surround you
2. **Manage Energy** - Your EMP ability is powerful but costs energy
3. **Switch Weapons** - Different enemies require different tactics
4. **Use Distance** - Some enemies are dangerous up close

### Enemy Types & Tactics

**Trojan Virus** (Red)

- Heavy and slow but deals massive damage
- Strategy: Keep distance and strafe while shooting

**Worm Virus** (Green)

- Fast segmented enemy with erratic movement
- Strategy: Lead your shots, use rapid-fire weapons

**Spyware Virus** (Purple)

- Teleports and shoots projectiles
- Strategy: Dodge projectiles, attack when it's materializing

**Ransomware Virus** (Orange)

- Armored with shield, very tanky
- Strategy: Focus fire to break shield first, then damage core

**Adware Virus** (Yellow)

- Weak but annoying, comes in swarms
- Strategy: Use spread weapons or EMP to clear groups

**Rootkit Virus** (Black/Red - BOSS)

- Massive boss with multiple phases
- Strategy: Watch attack patterns, dodge projectiles, stay alive!

### Weapon Guide

**1. Pulse Cannon** (Green)

- Balanced weapon, infinite ammo
- Good for: General purpose, beginners
- Fire rate: Fast

**2. Laser Rifle** (Cyan)

- Very fast fire rate, lower damage
- Good for: Fast enemies, sustained damage
- Fire rate: Very Fast

**3. Plasma Launcher** (Magenta)

- Slow but extremely powerful explosive shots
- Good for: Clusters of enemies, bosses
- Fire rate: Slow

**4. Shockwave Emitter** (Yellow)

- Fires 3 projectiles in a spread pattern
- Good for: Close-range, swarms
- Fire rate: Medium

### Wave Progression

- **Waves 1-2**: Basic enemies (Trojan, Worm, Adware)
- **Waves 3-4**: Spyware joins the fight
- **Wave 5**: First boss wave! Rootkit appears
- **Waves 6+**: All enemy types, increasing numbers and difficulty
- **Every 5th wave**: Boss wave with enhanced enemies

## 🏆 Scoring

- Trojan: 150 points
- Worm: 80 points
- Spyware: 120 points
- Ransomware: 200 points
- Adware: 50 points
- Rootkit: 500 points
- Wave Complete Bonus: 1000 × Wave Number

## 🎨 Visual Guide

The game uses a cyberpunk/digital aesthetic:

- **Green** - Player, friendly systems
- **Red/Orange** - Dangerous viruses
- **Cyan/Purple** - Advanced/special enemies
- **Yellow** - Warnings, energy effects

## 🐛 Troubleshooting

**Game won't start:**

1. Make sure you ran `npm install`
2. Verify Three.js downloaded to `src/lib/three.module.js`
3. Run `npm run dev` to see error messages

**Performance issues:**

1. Close other applications
2. The game is designed for 60 FPS
3. Performance may vary based on hardware

**Black screen:**

1. Check the console for errors (press F12)
2. Verify all files are in correct locations
3. Try restarting the application

## 🚀 Next Steps

### Build Executable

When you're ready to share the game:

**Windows:**

```bash
npm run build:win
```

**macOS:**

```bash
npm run build:mac
```

**Linux:**

```bash
npm run build:linux
```

The built executable will be in the `dist/` folder!

### Customize the Game

Want to modify the game? Check out `DEVELOPMENT.md` for:

- Adding new enemies
- Creating new weapons
- Modifying difficulty
- Adding visual effects
- And much more!

## 🎮 Have Fun!

Remember: You're the last line of defense against digital threats. The computer's fate is in your hands!

**Good luck, Digital Guardian! 🛡️**

---

## Commands Reference

```bash
npm run dev          # Development mode with DevTools
npm start            # Production mode
npm run build:win    # Build Windows executable
npm run build:mac    # Build macOS executable
npm run build:linux  # Build Linux executable
```

## File Structure

```
Fight Virus/
├── src/              # Source code
├── dist/             # Built executables (after building)
├── node_modules/     # Dependencies
├── package.json      # Project configuration
└── README.md         # Documentation
```

## Support

For issues or questions:

1. Check DEVELOPMENT.md for technical details
2. Review code comments in source files
3. Inspect console output with `npm run dev`

**Now go hunt some viruses! 🎯**
