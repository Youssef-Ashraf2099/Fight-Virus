# Fight Virus - Unity Migration Package

## 🎮 What's Included

This export contains all the game logic data from the Three.js version of Fight Virus, ready to be imported into Unity.

### Exported Data

✅ **9 Enemy Types** - Complete stats, behaviors, and visuals
✅ **7 Weapon Types** - Damage, fire rates, projectile configs
✅ **5 Environments** - Map boundaries, color palettes, features

## 📦 Package Contents

```
unity-export/
├── data/
│   ├── game_export.json      (Combined export - all data in one file)
│   ├── enemy_types.json      (Enemy configurations)
│   ├── weapon_types.json     (Weapon configurations)
│   └── environments.json     (Map/level data)
├── UNITY_IMPORT_GUIDE.md    (Step-by-step Unity setup instructions)
└── README.md                (This file)
```

## 🚀 Quick Start

### 1. Export Game Data

Already done! The JSON files in `data/` folder contain all your game data.

### 2. Set Up Unity Project

Follow the complete instructions in **[UNITY_IMPORT_GUIDE.md](UNITY_IMPORT_GUIDE.md)**

Quick summary:

1. Create new Unity 3D project (Unity 2021.3 LTS or newer)
2. Install Newtonsoft.Json package
3. Copy `data/` folder to `Assets/ImportedData/`
4. Create C# importer scripts (templates provided in guide)
5. Run import

### 3. Create Visual Assets

The export contains **game logic** (stats, behaviors), but you'll need to create:

- 3D models for enemies (or use Unity primitives)
- 3D models for weapons
- Environment geometry (procedural or modeled)
- Visual effects (particles, trails)

## 📊 Exported Data Overview

### Enemy Types (9)

| Enemy               | Health | Speed | Damage | Attack Type      |
| ------------------- | ------ | ----- | ------ | ---------------- |
| **RansomwareVirus** | 220    | 2.0   | 28     | AOE              |
| **RootkitVirus**    | 250    | 1.5   | 30     | Melee (Tank)     |
| **BlasterVirus**    | 150    | 2.2   | 25     | Ranged           |
| **ShieldVirus**     | 180    | 1.8   | 18     | Melee (Shield)   |
| **TrojanVirus**     | 130    | 2.5   | 20     | Melee            |
| **SpywareVirus**    | 90     | 4.0   | 14     | Ranged (Stealth) |
| **WormVirus**       | 100    | 3.5   | 15     | Melee (Fast)     |
| **DroneVirus**      | 70     | 3.0   | 10     | Ranged (Flying)  |
| **AdwareVirus**     | 80     | 2.8   | 12     | Melee (Swarm)    |

### Weapon Types (7)

| Weapon                | Damage | Fire Rate | Magazine | Type       |
| --------------------- | ------ | --------- | -------- | ---------- |
| **Revolver**          | 25     | 2.5/s     | 6        | Projectile |
| **Plasma Launcher**   | 50     | 1.5/s     | 4        | Explosive  |
| **Laser Rifle**       | 20     | 10/s      | 30       | Projectile |
| **Pulse Cannon**      | 15     | 8/s       | 40       | Rapid Fire |
| **Shockwave Emitter** | 30     | 3/s       | 8        | AOE        |
| **Energy Sword**      | 45     | 3/s       | ∞        | Melee      |
| **Neon Knife**        | 35     | 5/s       | ∞        | Melee      |

### Environments (5)

| Environment      | Theme       | Color Scheme      |
| ---------------- | ----------- | ----------------- |
| **CPU Core**     | Processing  | Blue/Cyan/Magenta |
| **Kernel Space** | System Core | Red/Orange        |
| **Memory Banks** | RAM         | Green/Cyan        |
| **GPU Complex**  | Graphics    | Purple/Magenta    |
| **Motherboard**  | Main Board  | Blue/Cyan         |

## 🎨 What You Need to Do in Unity

### 1. Create Enemy Models

Each enemy needs:

- GameObject prefab
- 3D mesh (model or primitives)
- Material with appropriate colors (use exported color values)
- Collider component
- Enemy behavior script (attach stats from JSON)

**Example: RansomwareVirus**

```csharp
// Create a script: RansomwareEnemy.cs
public class RansomwareEnemy : BaseEnemy {
    void Start() {
        // Import from enemy_types.json
        maxHealth = 220;
        speed = 2.0f;
        damage = 28;
        attackType = AttackType.AOE;
        // Apply color: 0xff6600 (orange)
        GetComponent<Renderer>().material.color = new Color(1f, 0.4f, 0f);
    }
}
```

### 2. Create Weapon Systems

Each weapon needs:

- Weapon controller script
- Projectile prefab (for ranged weapons)
- Muzzle flash effect
- Impact effects
- Firing logic using exported stats

### 3. Build Environments

Each environment needs:

- Floor plane
- Boundary walls
- Procedural geometry (or modeled assets)
- Lighting setup (using exported palette colors)
- Fog settings
- Spawn points

## 🔄 Data Structure Examples

### Enemy Type JSON Structure

```json
{
  "className": "RansomwareVirus",
  "displayName": "Ransomware",
  "baseStats": {
    "maxHealth": 220,
    "speed": 2,
    "damage": 28,
    "scoreValue": 200
  },
  "behavior": {
    "movementType": "chase",
    "attackType": "aoe",
    "attackRange": 8
  },
  "visuals": {
    "color": 16737280, // 0xff6600 in decimal
    "emissive": 16724736
  }
}
```

### Weapon Type JSON Structure

```json
{
  "className": "Revolver",
  "displayName": "Revolver",
  "stats": {
    "damage": 25,
    "fireRate": 2.5,
    "magazineSize": 6,
    "reloadTime": 1.5,
    "projectileSpeed": 80
  },
  "visuals": {
    "projectileColor": 16776960, // 0xffff00 (yellow)
    "muzzleFlashColor": 16755200
  }
}
```

### Environment JSON Structure

```json
{
  "name": "cpu",
  "displayName": "CPU Core",
  "boundaries": {
    "minX": -60,
    "maxX": 60,
    "minZ": -60,
    "maxZ": 60
  },
  "palette": {
    "ambient": 1714270, // 0x1a1a3e
    "directional": 6710527, // 0x6666ff
    "fog": 657438, // 0x0a0a1e
    "fogDensity": 0.015
  }
}
```

## 🛠️ Unity Implementation Tips

### Converting Hex Colors to Unity

```csharp
// JSON color: 16737280 (decimal) or 0xff6600 (hex)
int colorValue = 16737280; // or 0xff6600
float r = ((colorValue >> 16) & 0xFF) / 255f;
float g = ((colorValue >> 8) & 0xFF) / 255f;
float b = (colorValue & 0xFF) / 255f;
Color unityColor = new Color(r, g, b);
```

### Setting Up Boundaries

```csharp
// Use exported boundaries for invisible walls
public void CreateBoundaries(BoundariesData bounds) {
    // Create invisible collision walls
    CreateWall(bounds.minX, bounds.minZ, bounds.maxX, bounds.minZ); // South
    CreateWall(bounds.minX, bounds.maxZ, bounds.maxX, bounds.maxZ); // North
    CreateWall(bounds.minX, bounds.minZ, bounds.minX, bounds.maxZ); // West
    CreateWall(bounds.maxX, bounds.minZ, bounds.maxX, bounds.maxZ); // East
}
```

### Applying Fog Settings

```csharp
// Use exported fog settings
RenderSettings.fog = true;
RenderSettings.fogColor = ConvertHexColor(envData.palette.fog);
RenderSettings.fogDensity = envData.palette.fogDensity;
RenderSettings.fogMode = FogMode.Exponential;
```

## 📝 Implementation Checklist

### Phase 1: Basic Setup

- [ ] Create Unity project
- [ ] Install Newtonsoft.Json
- [ ] Import JSON files
- [ ] Create data structure C# classes
- [ ] Test JSON parsing

### Phase 2: Enemy System

- [ ] Create BaseEnemy script
- [ ] Import enemy stats from JSON
- [ ] Create enemy prefabs with placeholder models
- [ ] Implement movement behaviors
- [ ] Implement attack systems
- [ ] Test enemy spawning

### Phase 3: Weapon System

- [ ] Create BaseWeapon script
- [ ] Import weapon stats from JSON
- [ ] Create projectile prefabs
- [ ] Implement firing mechanics
- [ ] Add visual effects
- [ ] Test weapon switching

### Phase 4: Environment System

- [ ] Create environment builder script
- [ ] Import environment data from JSON
- [ ] Generate floors and boundaries
- [ ] Apply lighting and fog
- [ ] Add procedural geometry
- [ ] Test level transitions

### Phase 5: Polish

- [ ] Replace placeholder models with proper 3D assets
- [ ] Add particle effects
- [ ] Implement UI
- [ ] Add sound effects
- [ ] Balance gameplay
- [ ] Test and iterate

## 🎯 Gameplay Flow

1. **Player spawns** in selected environment
2. **Enemies spawn** based on wave system (implement in Unity)
3. **Player uses weapons** to eliminate viruses
4. **Collect points** for kills (display in UI)
5. **Progress through waves** with increasing difficulty
6. **Transition between environments** (5 available)

## 📚 Additional Resources

- **Unity Manual**: https://docs.unity3d.com/Manual/
- **C# Programming Guide**: https://docs.microsoft.com/en-us/dotnet/csharp/
- **Unity Scripting Reference**: https://docs.unity3d.com/ScriptReference/
- **JSON.NET Documentation**: https://www.newtonsoft.com/json

## 💡 Pro Tips

1. **Start Simple**: Use Unity primitives (cubes, spheres) for enemies initially
2. **ScriptableObjects**: Convert JSON data to ScriptableObjects for easy editor access
3. **Prefab Variants**: Create prefab variants for different enemy types
4. **Object Pooling**: Implement pooling for projectiles and enemies
5. **Scene Management**: Use Unity's scene system for environments
6. **Testing**: Test each system individually before combining

## 🆘 Troubleshooting

### "JSON parsing fails"

- Check JSON syntax with online validator
- Ensure Newtonsoft.Json is installed
- Verify file paths are correct

### "Colors look wrong"

- Unity uses 0-1 range, not 0-255
- Remember to divide by 255f
- Check RGB order matches

### "Stats seem unbalanced"

- Exported stats are for Three.js (60 FPS)
- May need adjustment for Unity's physics
- Test and iterate

## 🎉 Success!

You now have all the game logic data from Fight Virus ready for Unity!

Follow the **UNITY_IMPORT_GUIDE.md** for step-by-step implementation instructions.

Good luck with your Unity migration! 🚀
