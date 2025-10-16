# Virus Hunter - Fight Viruses Inside Your Computer!

![Game Logo](assets/banner.png)

An intense 2.5D action game where you play as a Digital Guardian fighting viruses inside a computer system. Features stunning procedural graphics, multiple enemy types, advanced weapons, and wave-based combat.

## 🎮 Features

### Enemies

- **Trojan Virus** - Heavy, slow, high damage tanks
- **Worm Virus** - Fast, segmented enemies with snake-like movement
- **Spyware Virus** - Stealthy enemies that teleport and shoot projectiles
- **Ransomware Virus** - Armored boss-type enemies with shields
- **Adware Virus** - Annoying swarm enemies
- **Rootkit Virus** - Massive boss with multiple phases and devastating attacks

### Weapons

1. **Pulse Cannon** - Standard rapid-fire energy weapon
2. **Laser Rifle** - High-speed, low-damage beam weapon
3. **Plasma Launcher** - Slow, powerful explosive projectiles
4. **Shockwave Emitter** - Spreads shots in multiple directions

### Gameplay

- Wave-based survival system
- Progressive difficulty
- Score tracking
- Special EMP ability (Space bar)
- Dynamic environment with data streams and floating platforms
- Advanced particle effects and lighting

## 🚀 Installation & Running

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Download Three.js:**

Since we're using Electron, download Three.js module and place it in the correct location:

```bash
# Download Three.js (r160)
curl -o src/lib/three.module.js https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
```

Or manually download from [Three.js GitHub](https://github.com/mrdoob/three.js/blob/master/build/three.module.js) and save to `src/lib/three.module.js`

### Running the Game

**Development Mode (with DevTools):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

### Building Executables

**Build for Windows:**

```bash
npm run build:win
```

**Build for macOS:**

```bash
npm run build:mac
```

**Build for Linux:**

```bash
npm run build:linux
```

The built executables will be in the `dist/` folder.

## 🎯 Controls

- **WASD** - Move your character
- **Mouse** - Aim
- **Left Click** - Fire weapon
- **1-4** - Switch weapons
- **Space** - EMP Special Ability (costs 50 energy)

## 🎨 Game Architecture

```
src/
├── game/               # Main game loop and initialization
├── entities/
│   ├── player/        # Player character and geometry
│   └── enemies/       # Enemy manager and all enemy types
├── weapons/           # Weapon system and all weapon types
├── environment/       # Level design and environmental effects
├── effects/           # Particle system and visual effects
├── systems/           # Core systems (input, collision, UI, waves)
└── lib/              # Three.js library
```

### Code Structure Highlights

- **Modular Design**: Each enemy, weapon, and system is in its own file
- **Inheritance**: Base classes for enemies and weapons allow easy extension
- **Manager Pattern**: Centralized managers for enemies, weapons, and waves
- **Event System**: Input manager with event emission for game actions
- **Separation of Concerns**: Clear separation between game logic, rendering, and UI

## 🎪 Customization

### Adding New Enemies

1. Create new enemy class in `src/entities/enemies/types/`
2. Extend `BaseEnemy` class
3. Implement `createMesh()`, `animate()`, and `updateBehavior()` methods
4. Register in `EnemyManager.js`

### Adding New Weapons

1. Create new weapon class in `src/weapons/types/`
2. Extend `BaseWeapon` class
3. Implement `fire()` method
4. Add to weapon array in `WeaponManager.js`

### Adjusting Difficulty

Edit values in enemy constructors or `WaveManager.js`:

- Enemy health: `this.maxHealth`
- Enemy speed: `this.speed`
- Enemy damage: `this.damage`
- Wave difficulty scaling: `WaveManager.difficulty` calculation

## 📦 Publishing

The game is built using Electron, making it easy to distribute:

1. Build for target platform using build scripts
2. The executable will be self-contained in `dist/`
3. Distribute the installer/package to players

No external dependencies needed for players - everything is bundled!

## 🛠 Technologies Used

- **Three.js** - 3D graphics rendering
- **Electron** - Cross-platform desktop application framework
- **JavaScript (ES6+)** - Modern JavaScript with modules
- **HTML5 & CSS3** - UI and styling

## 🎯 Game Design Philosophy

This game demonstrates advanced procedural geometry creation without relying on simple shapes. Every enemy and effect is carefully crafted with:

- Complex geometric structures
- Dynamic animations
- Unique behaviors
- Visual polish with lighting and particles

The code is structured for maintainability, allowing easy expansion and modification.

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions welcome! Feel free to:

- Add new enemy types
- Create new weapons
- Improve visual effects
- Optimize performance
- Fix bugs

## 🎮 Enjoy the Game!

Eliminate all viruses and protect the system. Good luck, Digital Guardian!

---

**Created with ❤️ and advanced procedural graphics**
