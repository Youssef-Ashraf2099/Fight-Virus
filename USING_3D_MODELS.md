# Using 3D Models in Fight Virus

## Supported Formats

### ✅ Recommended: glTF/GLB (.gltf, .glb)

- **Best for**: Everything - enemies, bosses, player, environment objects
- **Advantages**:
  - Industry standard for web 3D
  - Compact file size with GLB (binary)
  - Supports animations, textures, PBR materials
  - Easy to export from Blender, Maya, 3DS Max
  - Great performance

### ✅ Alternative: FBX (.fbx)

- **Best for**: Complex animated models from professional 3D software
- **Advantages**: Rich animation support, industry standard

### ✅ Simple: OBJ (.obj)

- **Best for**: Static models without animations
- **Advantages**: Simple, widely supported, easy to create

## How to Add 3D Models

### Step 1: Add the GLTFLoader to your project

Download the GLTFLoader from Three.js examples or add it to your lib folder:

```
src/lib/GLTFLoader.js
```

### Step 2: Load it in your HTML (index.html)

```html
<!-- Add after three.js -->
<script src="./lib/three.min.js"></script>
<script src="./lib/GLTFLoader.js"></script>
```

### Step 3: Create a models folder

```
src/models/
  enemies/
    virus1.glb
    boss1.glb
  player/
    player_model.glb
  environment/
    computer_part.glb
```

### Step 4: Load and use models in your code

#### Example: Replace Enemy Mesh with 3D Model

```javascript
class WormVirus extends BaseEnemy {
  createMesh() {
    // Load 3D model instead of creating geometry
    const loader = new THREE.GLTFLoader();

    loader.load(
      "./models/enemies/worm.glb",
      (gltf) => {
        // Model loaded successfully
        this.model = gltf.scene;

        // Scale the model if needed
        this.model.scale.set(2, 2, 2);

        // Add to group
        this.group.add(this.model);

        // If model has animations
        if (gltf.animations && gltf.animations.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.animations = {};

          gltf.animations.forEach((clip) => {
            this.animations[clip.name] = this.mixer.clipAction(clip);
          });

          // Play idle animation
          if (this.animations["Idle"]) {
            this.animations["Idle"].play();
          }
        }

        // Add shadows
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Add glow if needed
            if (child.material) {
              child.material.emissive = new THREE.Color(this.color);
              child.material.emissiveIntensity = 0.5;
            }
          }
        });
      },
      (xhr) => {
        // Loading progress
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        // Error loading
        console.error("Error loading model:", error);
        // Fallback to geometric shape
        this.createFallbackMesh();
      }
    );

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  animate(deltaTime) {
    // Update animations if mixer exists
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Your other animations
    if (this.model) {
      this.model.rotation.y += deltaTime;
    }
  }

  createFallbackMesh() {
    // Original geometric mesh as fallback
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = this.createGlowMaterial(this.color, 1);
    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);
  }
}
```

#### Example: Boss with Animated Model

```javascript
class CircuitOverlord extends BaseBoss {
  createMesh() {
    const loader = new THREE.GLTFLoader();

    loader.load("./models/bosses/circuit_overlord.glb", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(5, 5, 5); // Make it BIG!
      this.group.add(this.model);

      // Setup animations
      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);

        this.animations = {
          idle: this.mixer.clipAction(
            gltf.animations.find((a) => a.name === "Idle")
          ),
          attack: this.mixer.clipAction(
            gltf.animations.find((a) => a.name === "Attack")
          ),
          damaged: this.mixer.clipAction(
            gltf.animations.find((a) => a.name === "Damaged")
          ),
          death: this.mixer.clipAction(
            gltf.animations.find((a) => a.name === "Death")
          ),
        };

        // Play idle by default
        this.animations.idle?.play();
      }

      // Add glow and effects
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.material.emissive = new THREE.Color(0xff0000);
          child.material.emissiveIntensity = 0.8;
        }
      });
    });
  }

  playAnimation(name, loop = true) {
    if (!this.animations || !this.animations[name]) return;

    // Stop all animations
    Object.values(this.animations).forEach((anim) => anim.stop());

    // Play requested animation
    this.animations[name].reset();
    this.animations[name].setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    this.animations[name].play();
  }
}
```

## Where to Get 3D Models

### Free Resources:

- **Sketchfab** (sketchfab.com) - Huge library, many free models
- **Poly Pizza** (poly.pizza) - Google Poly archive, all free
- **CGTrader** (cgtrader.com) - Mix of free and paid
- **TurboSquid** (turbosquid.com) - Professional models
- **Free3D** (free3d.com) - Free models

### Create Your Own:

- **Blender** (free, powerful) - blender.org
- Export as glTF/GLB format for best results

## Tips for Best Performance

1. **Optimize polygon count**: Keep models under 10k triangles for enemies, 50k for bosses
2. **Use compressed textures**: Compress textures before importing
3. **Combine meshes**: Merge static parts into single mesh
4. **Level of Detail (LOD)**: Use simpler models when far from camera
5. **Reuse materials**: Share materials between similar enemies

## Example File Structure

```
Fight Virus/
  src/
    models/
      enemies/
        worm.glb          (animated crawling worm)
        trojan.glb        (heavy armored virus)
        spyware.glb       (stealthy quick enemy)
      bosses/
        circuit_overlord.glb   (CPU boss with tentacles)
        corruption_core.glb    (massive corrupted sphere)
      player/
        antivirus_hero.glb
      environment/
        cpu_core.glb
        memory_chip.glb
        circuit_board.glb
    lib/
      three.min.js
      GLTFLoader.js  ← Add this!
```

## Converting Models to glTF/GLB

If you have models in other formats (.fbx, .obj, .blend):

1. **Online Converter**:

   - Visit: https://products.aspose.app/3d/conversion
   - Upload your model
   - Convert to GLB

2. **Blender** (recommended for control):
   - Open your model in Blender
   - File → Export → glTF 2.0 (.glb)
   - Choose "GLB Binary" format
   - Export

## Ready to Use?

Replace your current geometric enemies with 3D models by:

1. Adding GLTFLoader.js to your lib folder
2. Creating a models folder
3. Downloading or creating your models
4. Updating enemy classes to load models instead of creating geometry

The game will automatically fall back to geometric shapes if models fail to load!
