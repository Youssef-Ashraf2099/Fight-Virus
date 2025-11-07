# Weapon Blueprint System

## Overview

The weapon blueprint system allows procedural weapon generation from JSON configuration files instead of relying on external GLB 3D model assets. This provides better control over weapon appearance, positioning, and animations.

## Key Files

### 1. weapon-blueprints.json (src/weapons/)

Contains complete weapon definitions with:

- **accentColor**: Primary color theme for the weapon (hex)
- **components**: Array of geometric components that make up the weapon
- **muzzle**: Position where projectiles spawn
- **grip**: Position and rotation for hand attachment

### 2. DetailedWeaponModels.js (src/weapons/)

Handles:

- Blueprint loading via `init()` method
- Weapon model generation from blueprints
- Component building (box, cylinder, sphere, torus)
- Material application (PBR materials with metalness, roughness, emissive)
- Animation system (pulse, spin, glow, rotate, etc.)
- Fallback to procedural weapons if blueprints fail

### 3. GameMain.js (src/game/)

Initializes the blueprint system before creating the player

## Weapon Components

### Geometry Types

- **box**: Rectangular prisms with width, height, depth
- **cylinder**: Cylinders with radiusTop, radiusBottom, height, segments
- **sphere**: Spheres with radius, widthSegments, heightSegments
- **torus**: Torus (donut) shapes with radius, tube, radialSegments, tubularSegments

### Material Properties

- **color**: Base color (hex)
- **metalness**: 0-1, how metallic the surface appears
- **roughness**: 0-1, how rough/smooth the surface is
- **emissive**: Color emitted by the material (hex)
- **emissiveIntensity**: 0-infinity, brightness of emission
- **transparent**: boolean, whether material is transparent
- **opacity**: 0-1, transparency level

### Animation Types

- **pulse**: Scales object with sine wave
- **spin**: Continuous rotation on specified axis
- **glow**: Pulsing emissive intensity
- **rotate**: Rotation based on time
- **counterRotate**: Reverse rotation
- **wavePulse**: Position-dependent wave pulse
- **ripple**: Vertical ripple effect
- **sequentialPulse**: Sequential glow based on position

## Component Arrays

Components can be arrayed using:

- **count**: Number of instances
- **spacing**: Distance between instances
- **arrange**: Arrangement pattern (line-z, line-y, circle)

## Current Weapons

### Pulse Cannon (pulseCannon)

- Cyan accent (#00FFE5)
- Features: energy core, cooling fins, barrel rings, muzzle glow
- Animations: glowing core, spinning fins, pulsing barrel

### Laser Rifle (laserRifle)

- Red accent (#FF3355)
- Features: power cells, charging coils, focusing lens
- Animations: glowing cells, pulsing coils, emissive lens

### Plasma Launcher (plasmaLauncher)

- Blue accent (#4CA8FF)
- Features: charging chamber, vents, accelerator rings
- Animations: pulsing chamber, glowing vents, spinning rings

### Shockwave Emitter (shockwaveEmitter)

- Yellow accent (#FFD65C)
- Features: resonator, wave guides, emitter discs
- Animations: pulsing resonator, sequential guides, spinning discs

## Adding New Weapons

1. Add entry to `weapon-blueprints.json` with key matching weapon ID
2. Define accentColor, components array, muzzle position, and grip position
3. Use existing geometry types and material properties
4. Add animations to enhance visual appeal
5. Test positioning and alignment in-game

## Migration Notes

### Old System (GLB-based)

- Required external 3D model files
- Difficult to align with hands
- Texture loading issues
- Limited control over animations

### New System (Blueprint-based)

- Pure procedural generation
- JSON configuration for easy tweaking
- Precise control over positioning
- Built-in animation system
- Fallback support for missing blueprints

## Future Improvements

- [ ] Visual editor for weapon blueprints
- [ ] More geometry types (cone, plane, custom shapes)
- [ ] Advanced animation curves
- [ ] Particle effect integration
- [ ] Sound effect triggers
- [ ] Weapon variants/skins
- [ ] Import/export blueprint system
