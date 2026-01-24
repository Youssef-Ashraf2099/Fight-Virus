# Blender Export System - Fight Virus

## Overview

This system exports your game assets to **Wavefront OBJ format**, which Blender can import directly.

## What's Exported

✅ **Enemy Models** - 9 procedural 3D geometries
✅ **Materials** - Color and emissive data in MTL format
✅ **Import Scripts** - Python scripts for batch import

## Quick Start

### Step 1: Run Export Script

```bash
cd "e:\Fight Virus"
node scripts/export-to-blender.js
```

This creates:
```
blender-export/
├── models/              (OBJ files - 3D geometry)
│   ├── RansomwareVirus.obj
│   ├── TrojanVirus.obj
│   ├── WormVirus.obj
│   └── ... (9 total)
├── materials/           (MTL files - colors/materials)
│   ├── RansomwareVirus.mtl
│   └── ...
└── BLENDER_IMPORT_GUIDE.txt
```

### Step 2: Import into Blender

**Option A: Individual Import**
1. Open Blender
2. `File` → `Import` → `Wavefront (.obj)`
3. Navigate to `blender-export/models/`
4. Select an OBJ file → `Import OBJ`

**Option B: Batch Import (All at Once)**
1. Open Blender
2. Switch to `Scripting` workspace (top menu)
3. Click `New` (+ icon)
4. Paste this script:

```python
import bpy
import os

# CHANGE THIS PATH to your export folder
models_dir = r"E:\Fight Virus\blender-export\models"

# Import all OBJ files
for filename in os.listdir(models_dir):
    if filename.endswith(".obj"):
        filepath = os.path.join(models_dir, filename)
        bpy.ops.import_scene.obj(filepath=filepath)
        print(f"Imported: {filename}")

# Arrange in grid (optional)
objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
spacing = 3
cols = 3

for i, obj in enumerate(objects):
    row = i // cols
    col = i % cols
    obj.location = (col * spacing, row * spacing, 0)

print(f"✅ Imported {len(objects)} models")
```

5. Click `▶ Run Script`
6. All models appear in a grid!

## Exported Models

| Model | Shape | Health | Description |
|-------|-------|--------|-------------|
| **RansomwareVirus** | Cube (large) | 220 HP | AOE attacker |
| **RootkitVirus** | Cube (huge) | 250 HP | Tank |
| **TrojanVirus** | Pyramid | 130 HP | Standard enemy |
| **WormVirus** | Cylinder | 100 HP | Fast mover |
| **ShieldVirus** | Sphere | 180 HP | Shielded |
| **SpywareVirus** | Octahedron | 90 HP | Stealth |
| **DroneVirus** | Tetrahedron | 70 HP | Flying |
| **BlasterVirus** | Cone | 150 HP | Ranged |
| **AdwareVirus** | Icosahedron | 80 HP | Swarm |

## Working with Models in Blender

### Make Models Look Better

**1. Smooth Shading**
- Right-click model → `Shade Smooth`

**2. Add Detail**
- Select model
- Add Modifier → `Subdivision Surface`
- Set Levels to 2-3

**3. Adjust Materials**
- Switch to `Shading` workspace
- Materials are auto-imported with colors
- Increase `Emission` strength for glow effect

**4. Scale Models**
- Select model
- Press `S` (scale)
- Type number (e.g., `2` for 2x size)
- Press Enter

### Export Models for Unity

After editing in Blender:

**Option 1: FBX (Recommended)**
1. `File` → `Export` → `FBX (.fbx)`
2. Settings:
   - ✅ Selected Objects (if specific models)
   - ✅ Apply Modifiers
   - Scale: 1.0
3. Save to Unity project: `Assets/Models/`

**Option 2: GLTF/GLB (Modern)**
1. `File` → `Export` → `glTF 2.0 (.glb/.gltf)`
2. Settings:
   - Format: GLB (binary) or GLTF (separate)
   - ✅ Apply Modifiers
3. Import in Unity (supports materials)

## Blender Python Scripts

### Script 1: Import All Models
```python
import bpy
import os

models_dir = r"E:\Fight Virus\blender-export\models"

for filename in os.listdir(models_dir):
    if filename.endswith(".obj"):
        filepath = os.path.join(models_dir, filename)
        bpy.ops.import_scene.obj(filepath=filepath)
```

### Script 2: Apply Smooth Shading to All
```python
import bpy

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_smooth()
```

### Script 3: Add Subdivision to All
```python
import bpy

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_add(type='SUBSURF')
        obj.modifiers["Subdivision"].levels = 2
```

### Script 4: Scale All Models
```python
import bpy

scale_factor = 2.0  # Change this

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.scale = (scale_factor, scale_factor, scale_factor)
```

### Script 5: Export All as FBX
```python
import bpy
import os

output_dir = r"E:\Fight Virus\blender-export\fbx"
os.makedirs(output_dir, exist_ok=True)

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        # Deselect all
        bpy.ops.object.select_all(action='DESELECT')
        # Select current
        obj.select_set(True)
        # Export
        filepath = os.path.join(output_dir, f"{obj.name}.fbx")
        bpy.ops.export_scene.fbx(
            filepath=filepath,
            use_selection=True,
            apply_scale_options='FBX_SCALE_ALL'
        )
        print(f"Exported: {obj.name}.fbx")
```

## Workflow: Blender → Unity

1. **Export from game** → OBJ files
2. **Import to Blender** → Edit/enhance models
3. **Export from Blender** → FBX files
4. **Import to Unity** → Drag FBX to Assets/Models/
5. **Create prefabs** → Use in game

## Tips & Tricks

### Tip 1: Add Glow Effect
```python
# In Blender, after importing
import bpy

for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj.data.materials:
        mat = obj.data.materials[0]
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        
        # Increase emission strength
        if "Emission" in nodes:
            nodes["Emission"].inputs[1].default_value = 2.0  # Strength
```

### Tip 2: Add Wireframe Modifier
Makes models look "digital/cyber":
1. Select model
2. Add Modifier → `Wireframe`
3. Adjust thickness

### Tip 3: Create Variants
- Duplicate model: `Shift + D`
- Modify slightly (scale, shape)
- Export as new enemy variant

### Tip 4: Animate Models
1. Select model
2. Set keyframe: `I` → Location/Rotation/Scale
3. Move timeline
4. Move model
5. Set another keyframe
6. Export with animation to Unity

## Troubleshooting

**Models appear black in Blender**
- Solution: Add lights to scene (`Add` → `Light` → `Sun`)

**Materials don't import**
- Solution: Materials are in `materials/` folder
- Blender should auto-load them
- If not, manually apply: Material Properties → Browse material

**Models are too small/large**
- Solution: Scale in Blender (select, press `S`, type scale factor)

**OBJ files won't open**
- Solution: Make sure you're using `File → Import → Wavefront (.obj)`
- Not "Open" - use "Import"!

## Advanced: Export Environments

The script currently exports enemies. To export environment pieces:

1. Edit `export-to-blender.js`
2. Add environment geometry generators
3. Export floor tiles, walls, obstacles
4. Arrange in Blender to create levels

## Resources

- **Blender Manual**: https://docs.blender.org/manual/
- **OBJ Format Spec**: https://en.wikipedia.org/wiki/Wavefront_.obj_file
- **Blender Python API**: https://docs.blender.org/api/current/

## Next Steps

1. ✅ Run export script
2. ✅ Import OBJ files to Blender
3. 🎨 Enhance models with Blender tools
4. 📦 Export as FBX/GLTF
5. 🎮 Import to Unity
6. ⚡ Use in your game!

---

**Happy Modeling!** 🎨✨
