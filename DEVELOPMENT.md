# Development Guide - Virus Hunter

## Project Structure

```
Fight Virus/
├── src/
│   ├── main.js                  # Electron main process
│   ├── index.html               # Game HTML template
│   ├── game/
│   │   └── Game.js             # Main game loop & initialization
│   ├── entities/
│   │   ├── player/
│   │   │   ├── Player.js       # Player character
│   │   │   └── PlayerGeometry.js
│   │   └── enemies/
│   │       ├── EnemyManager.js # Spawning & management
│   │       ├── BaseEnemy.js    # Base enemy class
│   │       └── types/
│   │           ├── TrojanVirus.js
│   │           ├── WormVirus.js
│   │           ├── SpywareVirus.js
│   │           ├── RansomwareVirus.js
│   │           ├── AdwareVirus.js
│   │           └── RootkitVirus.js
│   ├── weapons/
│   │   ├── WeaponManager.js    # Weapon switching & management
│   │   ├── BaseWeapon.js       # Base weapon class
│   │   ├── Projectile.js       # Standard projectile
│   │   └── types/
│   │       ├── PulseCannon.js
│   │       ├── LaserRifle.js
│   │       ├── PlasmaLauncher.js
│   │       └── ShockwaveEmitter.js
│   ├── environment/
│   │   └── Environment.js      # Level, lighting, background
│   ├── effects/
│   │   └── ParticleSystem.js   # Explosions, impacts, etc.
│   ├── systems/
│   │   ├── CollisionManager.js # Collision detection
│   │   ├── InputManager.js     # Keyboard & mouse input
│   │   ├── UIManager.js        # HUD updates
│   │   └── WaveManager.js      # Wave progression
│   └── lib/
│       └── three.module.js     # Three.js library
├── package.json
├── setup.bat / setup.sh
└── README.md
```

## Key Concepts

### 1. Game Loop

The main game loop is in `src/game/Game.js`:

```javascript
animate() {
    requestAnimationFrame(() => this.animate());
    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
}
```

### 2. Entity System

All game entities (player, enemies) follow this pattern:

- Have a `position` (Vector3)
- Have a `group` (Three.js Group) for meshes
- Implement `update(deltaTime, ...)`
- Implement `createMesh()` for visuals
- Implement `animate(deltaTime)` for animations

### 3. Manager Pattern

Managers handle collections of objects:

- **EnemyManager**: Spawns and updates all enemies
- **WeaponManager**: Handles weapon switching and projectiles
- **WaveManager**: Controls wave progression

### 4. Collision Detection

Simple sphere-based collision in `CollisionManager.js`:

```javascript
checkCollision(obj1, obj2) {
    const distance = obj1.position.distanceTo(obj2.position);
    return distance < (obj1.collisionRadius + obj2.collisionRadius);
}
```

## Adding New Content

### Adding a New Enemy

1. Create `src/entities/enemies/types/YourVirus.js`:

```javascript
import * as THREE from "../../../lib/three.module.js";
import { BaseEnemy } from "../BaseEnemy.js";

export class YourVirus extends BaseEnemy {
  constructor(scene, position, particleSystem, difficulty = 1) {
    super(scene, position, particleSystem, difficulty);

    // Set stats
    this.maxHealth = 100 * difficulty;
    this.health = this.maxHealth;
    this.speed = 8;
    this.damage = 15 * difficulty;
    this.color = 0xff00ff;

    this.createMesh();
  }

  createMesh() {
    // Create your unique visual design
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = this.createGlowMaterial(this.color, 1);
    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Animate your enemy
    this.mesh.rotation.y += deltaTime * 2;
  }

  updateBehavior(deltaTime, playerPosition) {
    // Define movement and attack patterns
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    this.position.add(direction.multiplyScalar(this.speed * deltaTime));
  }
}
```

2. Register in `src/entities/enemies/EnemyManager.js`:

```javascript
import { YourVirus } from "./types/YourVirus.js";

// In constructor
this.enemyClasses = {
  // ... existing enemies
  yourvirus: YourVirus,
};
```

### Adding a New Weapon

1. Create `src/weapons/types/YourWeapon.js`:

```javascript
import { BaseWeapon } from '../BaseWeapon.js';
import { Projectile } from '../Projectile.js';

export class YourWeapon extends BaseWeapon {
    constructor(scene, particleSystem) {
        super(scene, particleSystem);

        this.name = "YOUR WEAPON";
        this.damage = 25;
        this.fireRate = 0.3;
        this.projectileSpeed = 40;
        this.projectileColor = 0xff0000;
    }

    fire(origin, target, camera) {
        if (!this.canFire()) return null;
        super.fire(origin, target, camera);

        // Calculate direction and create projectile
        // ... (see existing weapons for examples)

        return new Projectile(...);
    }
}
```

2. Add to `src/weapons/WeaponManager.js`:

```javascript
import { YourWeapon } from "./types/YourWeapon.js";

this.weapons = [
  // ... existing weapons
  new YourWeapon(scene, particleSystem),
];
```

### Modifying Visual Effects

Edit `src/effects/ParticleSystem.js` to add new particle effects:

```javascript
createYourEffect(position, color, count) {
    for (let i = 0; i < count; i++) {
        // Create particles
        // Add to this.particles array
    }
}
```

### Adjusting Environment

Modify `src/environment/Environment.js`:

- `createLights()` - Lighting setup
- `createGround()` - Floor design
- `createDataStreams()` - Background particles
- `createFloatingPlatforms()` - Level geometry

## Performance Optimization Tips

1. **Geometry Reuse**: Share geometries between similar objects
2. **Object Pooling**: Reuse projectile objects instead of creating new ones
3. **Level of Detail**: Reduce polygon count for distant objects
4. **Particle Limits**: Cap maximum particle count
5. **Draw Call Reduction**: Merge static geometry when possible

## Debugging

Run in development mode for DevTools:

```bash
npm run dev
```

Useful debugging:

- Check console for errors
- Use `console.log()` in update loops (sparingly)
- Verify collision radii with visual helpers
- Monitor FPS (should target 60 FPS)

## Testing

Test these scenarios:

1. All weapons fire correctly
2. All enemy types spawn and behave properly
3. Collision detection works for projectiles and enemies
4. Wave progression increases difficulty
5. UI updates correctly
6. Game over state works
7. Performance remains stable with many enemies

## Building for Distribution

1. Test thoroughly in dev mode
2. Build for target platform:
   ```bash
   npm run build:win   # or mac, linux
   ```
3. Test the built executable
4. Distribute the installer from `dist/` folder

## Common Issues

**Issue**: Three.js not loading

- **Solution**: Download three.module.js manually to `src/lib/`

**Issue**: Blank screen on start

- **Solution**: Check browser console, verify Three.js loaded

**Issue**: Poor performance

- **Solution**: Reduce particle counts, enemy spawn rates

**Issue**: Collision not working

- **Solution**: Verify collisionRadius values are set correctly

## Contributing

When contributing code:

1. Follow existing code style
2. Add comments for complex logic
3. Test thoroughly
4. Update documentation if needed
5. Keep file structure organized

## Advanced Topics

### Custom Shaders

Add custom GLSL shaders for advanced effects:

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: `...`,
  fragmentShader: `...`,
  uniforms: { time: { value: 0 } },
});
```

### Post-Processing

Add bloom, glow, and other effects using Three.js post-processing.

### Audio

Integrate Web Audio API for sound effects and music.

### Save System

Implement localStorage for high scores and settings.

---

**Happy Developing!** 🚀
