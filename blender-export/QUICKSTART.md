# Blender Export - Quick Start Guide 🎨

## ✅ Export Complete!

**Location**: `e:\Fight Virus\blender-export\`

**What's Included**:
- 9 Enemy Models (OBJ format)
- 9 Materials (MTL format with colors)
- Import instructions

---

## 🚀 Import to Blender (3 Methods)

### Method 1: Quick Import (One Model)
**Fastest way to test:**

1. Open Blender
2. `File` → `Import` → `Wavefront (.obj)`
3. Browse to: `e:\Fight Virus\blender-export\models\`
4. Select `RansomwareVirus.obj`
5. Click `Import OBJ`
6. Done! Model appears in viewport

---

### Method 2: Batch Import (All Models at Once)
**Best for importing everything:**

1. Open Blender
2. Click `Scripting` tab (top menu bar)
3. Click `+ New` to create new script
4. **Copy-paste this code**:

```python
import bpy
import os

# Models directory (change if needed)
models_dir = r"E:\Fight Virus\blender-export\models"

# Import all OBJ files
for filename in os.listdir(models_dir):
    if filename.endswith(".obj"):
        filepath = os.path.join(models_dir, filename)
        bpy.ops.import_scene.obj(filepath=filepath)
        print(f"Imported: {filename}")

# Arrange in 3x3 grid
objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
spacing = 3
cols = 3

for i, obj in enumerate(objects):
    row = i // cols
    col = i % cols
    obj.location = (col * spacing, row * spacing, 0)

print(f"✅ Imported {len(objects)} models!")
```

5. Click `▶ Run Script` button
6. All 9 models import in a grid!

---

### Method 3: Command Line (Advanced)
```bash
blender --python import_script.py
```

---

## 🎨 Make Models Look Better

### Step 1: Smooth Shading
**Makes models less blocky:**

1. Select all models: `A` (press A key)
2. Right-click → `Shade Smooth`
3. Done! Smoother appearance

### Step 2: Add Detail (Subdivision)
**Adds geometry for smoother curves:**

1. Select a model
2. Click `Modifiers` tab (wrench icon, right panel)
3. `Add Modifier` → `Subdivision Surface`
4. Set `Viewport` to 2-3
5. Model becomes smoother!

### Step 3: Enhance Materials
**Make glow effects stronger:**

1. Select model
2. Switch to `Shading` workspace (top)
3. Find `Emission` node in Shader Editor
4. Increase `Strength` value (try 2.0 or 3.0)
5. Model glows more!

---

## 📦 Export for Unity

### After Editing in Blender:

**FBX Export (Recommended)**:
1. `File` → `Export` → `FBX (.fbx)`
2. Settings:
   - ✅ Check `Selected Objects` (if specific models)
   - ✅ Check `Apply Modifiers`
   - Set `Path Mode` to `Copy`
   - Scale: 1.00
3. Save to: `e:\Fight Virus\unity-assets\Models\`
4. Import FBX into Unity's Assets folder

**GLB Export (Alternative)**:
1. `File` → `Export` → `glTF 2.0 (.glb/.gltf)`
2. Select `GLB` format
3. ✅ Apply Modifiers
4. Export and import to Unity

---

## 📊 Exported Models Reference

| Model | Shape | Size | Color | Use |
|-------|-------|------|-------|-----|
| **RansomwareVirus** | Cube (large) | 1.5x | Orange | AOE Boss |
| **RootkitVirus** | Cube (huge) | 2.0x | Dark Red | Tank |
| **TrojanVirus** | Pyramid | 1.0x | Purple | Standard |
| **WormVirus** | Cylinder | 1.0x | Green | Fast |
| **ShieldVirus** | Sphere | 1.4x | Blue | Shielded |
| **SpywareVirus** | Octahedron | 1.0x | Purple | Stealth |
| **DroneVirus** | Tetrahedron | 1.0x | Cyan | Flying |
| **BlasterVirus** | Cone | 1.0x | Red | Ranged |
| **AdwareVirus** | Icosahedron | 0.8x | Yellow | Swarm |

---

## 🔧 Useful Blender Shortcuts

| Action | Key |
|--------|-----|
| **Select All** | A |
| **Move** | G |
| **Rotate** | R |
| **Scale** | S |
| **Delete** | X |
| **Duplicate** | Shift + D |
| **Smooth Shade** | Right-click → Shade Smooth |
| **Frame View** | Numpad . (period) |
| **Toggle X-Ray** | Alt + Z |

---

## 💡 Quick Enhancement Ideas

### Idea 1: Add Glow Rings
```python
# Add torus around each model
import bpy

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        # Add torus
        bpy.ops.mesh.primitive_torus_add(
            location=obj.location,
            major_radius=2,
            minor_radius=0.1
        )
        torus = bpy.context.active_object
        torus.name = f"{obj.name}_Ring"
```

### Idea 2: Add Particle Effects
1. Select model
2. Go to `Particle Properties` tab
3. Click `+` to add particle system
4. Set Type: `Emitter`
5. Adjust settings (Lifetime, Velocity, etc.)

### Idea 3: Add Animation
1. Select model
2. Move timeline to frame 1
3. Press `I` → `Rotation`
4. Move timeline to frame 60
5. Rotate model (`R` key)
6. Press `I` → `Rotation` again
7. Play animation!

---

## 🐛 Troubleshooting

### "OBJ files won't import"
✅ Use `File → Import → Wavefront (.obj)`, NOT `File → Open`

### "Models are black"
✅ Add light: `Add` → `Light` → `Sun`

### "Materials missing"
✅ MTL files should auto-load from `materials/` folder
✅ Or manually apply in Material Properties

### "Models too small/big"
✅ Select model, press `S`, type scale factor (e.g., `2`), Enter

### "Script won't run"
✅ Make sure path is correct: `models_dir = r"E:\Fight Virus\blender-export\models"`
✅ Use raw string `r"..."` for Windows paths

---

## 📂 File Structure

```
e:\Fight Virus\blender-export\
├── models/
│   ├── RansomwareVirus.obj
│   ├── TrojanVirus.obj
│   ├── WormVirus.obj
│   └── ... (9 total)
├── materials/
│   ├── RansomwareVirus.mtl
│   └── ... (9 total)
├── README.md                    ← Full documentation
└── BLENDER_IMPORT_GUIDE.txt    ← Quick reference
```

---

## 🎯 Workflow Summary

```
1. Run Export → 2. Import to Blender → 3. Enhance Models → 4. Export FBX → 5. Use in Unity
```

**Step 1**: ✅ Already done! (OBJ files ready)
**Step 2**: Open Blender, import OBJ files
**Step 3**: Add smooth shading, subdivision, materials
**Step 4**: Export as FBX for Unity
**Step 5**: Drag FBX to Unity Assets folder

---

## 🔄 Re-run Export

If you modify enemy stats/colors in your game:

```bash
cd "e:\Fight Virus"
node scripts/export-to-blender.js
```

New OBJ files generated!

---

## 📚 Learn More

- **Blender Tutorials**: https://www.blender.org/support/tutorials/
- **OBJ Format**: Simple text format, human-readable
- **Blender Docs**: https://docs.blender.org/

---

## ✨ You're Ready!

1. ✅ Models exported (9 OBJ files)
2. ✅ Materials exported (9 MTL files)
3. ✅ Import guide ready
4. ⏭️ **Next**: Open Blender and import!

**Pro Tip**: Start with Method 2 (batch import script) to get all models at once, then experiment with enhancements!

Happy Modeling! 🎨🚀
