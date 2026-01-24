/**
 * Blender Export Script - OBJ Format
 * 
 * Exports game geometry to Wavefront OBJ files that can be directly imported into Blender.
 * OBJ is a simple text-based format that Blender supports natively.
 * 
 * Run with: node scripts/export-to-blender.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const OUTPUT_DIR = path.join(__dirname, "..", "blender-export");

/**
 * OBJ Exporter Class
 * Generates Wavefront OBJ files from geometry data
 */
class OBJExporter {
  constructor() {
    this.vertexOffset = 1; // OBJ indices start at 1
  }

  /**
   * Export a simple mesh to OBJ format
   */
  exportMesh(name, vertices, faces, normals = null) {
    let obj = `# Blender OBJ Export - ${name}\n`;
    obj += `# Fight Virus Game Assets\n\n`;
    obj += `o ${name}\n\n`;

    // Write vertices
    obj += `# Vertices (${vertices.length})\n`;
    for (const v of vertices) {
      obj += `v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`;
    }
    obj += '\n';

    // Write normals if provided
    if (normals && normals.length > 0) {
      obj += `# Normals (${normals.length})\n`;
      for (const n of normals) {
        obj += `vn ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n`;
      }
      obj += '\n';
    }

    // Write faces
    obj += `# Faces (${faces.length})\n`;
    for (const face of faces) {
      if (normals) {
        obj += `f ${face.a}//${face.a} ${face.b}//${face.b} ${face.c}//${face.c}\n`;
      } else {
        obj += `f ${face.a} ${face.b} ${face.c}\n`;
      }
    }

    return obj;
  }

  /**
   * Export material file (MTL)
   */
  exportMaterial(name, color, emissive = null) {
    let mtl = `# Blender MTL Export - ${name}\n\n`;
    mtl += `newmtl ${name}\n`;
    mtl += `Ka 1.0 1.0 1.0\n`; // Ambient
    mtl += `Kd ${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)}\n`; // Diffuse
    mtl += `Ks 0.5 0.5 0.5\n`; // Specular
    mtl += `Ns 32.0\n`; // Shininess
    
    if (emissive && (emissive.r > 0 || emissive.g > 0 || emissive.b > 0)) {
      mtl += `Ke ${emissive.r.toFixed(3)} ${emissive.g.toFixed(3)} ${emissive.b.toFixed(3)}\n`; // Emission
    }
    
    mtl += `d 1.0\n`; // Opacity
    mtl += `illum 2\n`; // Illumination model
    
    return mtl;
  }
}

/**
 * Generate procedural geometry for enemies
 * These are simple placeholder geometries - you can enhance them
 */
function generateEnemyGeometry(enemyType) {
  const size = enemyType.baseStats.collisionRadius || 1;
  
  switch(enemyType.displayName) {
    case "Ransomware":
      return generateCube(size * 1.5);
    case "Trojan":
      return generatePyramid(size);
    case "Worm":
      return generateCylinder(size * 0.5, size * 2, 8);
    case "Shield Virus":
      return generateSphere(size, 16);
    case "Rootkit":
      return generateCube(size * 2);
    case "Spyware":
      return generateOctahedron(size);
    case "Drone":
      return generateTetrahedron(size);
    case "Blaster":
      return generateCone(size, size * 2, 12);
    case "Adware":
      return generateIcosahedron(size * 0.8);
    default:
      return generateCube(size);
  }
}

function generateBossGeometry(bossType) {
  const size = bossType.baseStats.collisionRadius || 5;

  switch (bossType.displayName) {
    case "Circuit Overlord":
      return generateCylinder(size * 0.8, size * 1.6, 6);
    case "Corruption Core":
      return generateIcosahedron(size * 1.2);
    case "Data Wyrm":
      return generateCylinder(size * 0.8, size * 3, 12);
    case "Firewall Archon":
      return generateCylinder(size * 0.7, size * 1.4, 16);
    case "Ladybug Sentinel":
      return generateSphere(size * 0.9, 18);
    case "Neural Overmind":
      return generateOctahedron(size * 0.9);
    case "Noise":
      return generateIcosahedron(size * 0.85);
    case "Packet Hydra":
      return generateCylinder(size * 0.7, size * 2.2, 14);
    case "Pixel Reaper":
      return generateCone(size * 0.9, size * 2.2, 10);
    case "Trojan Warhorse":
      return generateBox(size * 1.6, size * 0.9, size * 2.4);
    default:
      return generateBox(size, size, size * 1.5);
  }
}

function generateWeaponGeometry(weaponType) {
  const name = weaponType.displayName || weaponType.className;
  switch (name) {
    case "Revolver":
      return generateBox(1.2, 0.6, 2.0);
    case "Pulse Cannon":
      return generateCylinder(0.9, 2.4, 16);
    case "Laser Rifle":
      return generateBox(1.0, 0.5, 3.2);
    case "Plasma Launcher":
      return generateCylinder(1.2, 2.6, 14);
    case "Shockwave Emitter":
      return generateCylinder(1.5, 0.8, 20);
    case "Energy Sword":
    case "SciFiSword":
      return generateBox(0.35, 0.15, 3.5);
    case "Neon Knife":
      return generateBox(0.28, 0.12, 1.6);
    default:
      return generateBox(0.8, 0.4, 1.6);
  }
}

function generateEnvironmentGeometry(env) {
  // Simple floor plane representing environment footprint
  const size = (env.boundaries?.maxX || 60) * 2;
  return generatePlane(size, size);
}

/**
 * Procedural geometry generators
 */
function generateBox(width, height, depth) {
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;

  const vertices = [
    { x: -hx, y: -hy, z: -hz }, { x: hx, y: -hy, z: -hz },
    { x: hx, y: hy, z: -hz }, { x: -hx, y: hy, z: -hz },
    { x: -hx, y: -hy, z: hz }, { x: hx, y: -hy, z: hz },
    { x: hx, y: hy, z: hz }, { x: -hx, y: hy, z: hz },
  ];

  const faces = [
    { a: 1, b: 2, c: 3 }, { a: 1, b: 3, c: 4 },
    { a: 5, b: 8, c: 7 }, { a: 5, b: 7, c: 6 },
    { a: 1, b: 5, c: 6 }, { a: 1, b: 6, c: 2 },
    { a: 3, b: 7, c: 8 }, { a: 3, b: 8, c: 4 },
    { a: 2, b: 6, c: 7 }, { a: 2, b: 7, c: 3 },
    { a: 1, b: 4, c: 8 }, { a: 1, b: 8, c: 5 },
  ];

  return { vertices, faces };
}

function generatePlane(width, depth) {
  const hw = width / 2;
  const hd = depth / 2;
  const vertices = [
    { x: -hw, y: 0, z: -hd },
    { x: hw, y: 0, z: -hd },
    { x: hw, y: 0, z: hd },
    { x: -hw, y: 0, z: hd },
  ];

  const faces = [
    { a: 1, b: 2, c: 3 },
    { a: 1, b: 3, c: 4 },
  ];

  return { vertices, faces };
}
function generateCube(size) {
  const s = size / 2;
  const vertices = [
    { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
    { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
    { x: -s, y: -s, z: s }, { x: s, y: -s, z: s },
    { x: s, y: s, z: s }, { x: -s, y: s, z: s }
  ];
  
  const faces = [
    { a: 1, b: 2, c: 3 }, { a: 1, b: 3, c: 4 }, // Front
    { a: 5, b: 8, c: 7 }, { a: 5, b: 7, c: 6 }, // Back
    { a: 1, b: 5, c: 6 }, { a: 1, b: 6, c: 2 }, // Bottom
    { a: 3, b: 7, c: 8 }, { a: 3, b: 8, c: 4 }, // Top
    { a: 2, b: 6, c: 7 }, { a: 2, b: 7, c: 3 }, // Right
    { a: 1, b: 4, c: 8 }, { a: 1, b: 8, c: 5 }  // Left
  ];
  
  return { vertices, faces };
}

function generateSphere(radius, segments) {
  const vertices = [];
  const faces = [];
  
  for (let lat = 0; lat <= segments; lat++) {
    const theta = lat * Math.PI / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segments; lon++) {
      const phi = lon * 2 * Math.PI / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      
      vertices.push({ x: radius * x, y: radius * y, z: radius * z });
    }
  }
  
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = (lat * (segments + 1)) + lon + 1;
      const second = first + segments + 1;
      
      faces.push({ a: first, b: second, c: first + 1 });
      faces.push({ a: second, b: second + 1, c: first + 1 });
    }
  }
  
  return { vertices, faces };
}

function generatePyramid(size) {
  const s = size;
  const vertices = [
    { x: 0, y: s, z: 0 },      // Apex
    { x: -s, y: 0, z: -s },    // Base corners
    { x: s, y: 0, z: -s },
    { x: s, y: 0, z: s },
    { x: -s, y: 0, z: s }
  ];
  
  const faces = [
    { a: 1, b: 2, c: 3 }, // Side 1
    { a: 1, b: 3, c: 4 }, // Side 2
    { a: 1, b: 4, c: 5 }, // Side 3
    { a: 1, b: 5, c: 2 }, // Side 4
    { a: 2, b: 4, c: 3 }, // Base 1
    { a: 2, b: 5, c: 4 }  // Base 2
  ];
  
  return { vertices, faces };
}

function generateCylinder(radius, height, segments) {
  const vertices = [];
  const faces = [];
  const halfHeight = height / 2;
  
  // Bottom center
  vertices.push({ x: 0, y: -halfHeight, z: 0 });
  // Top center
  vertices.push({ x: 0, y: halfHeight, z: 0 });
  
  // Bottom and top circles
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    vertices.push({ x, y: -halfHeight, z }); // Bottom
    vertices.push({ x, y: halfHeight, z });  // Top
  }
  
  // Faces
  for (let i = 0; i < segments; i++) {
    const current = i * 2 + 3;
    const next = ((i + 1) % segments) * 2 + 3;
    
    // Bottom cap
    faces.push({ a: 1, b: next, c: current });
    // Top cap
    faces.push({ a: 2, b: current + 1, c: next + 1 });
    // Side faces
    faces.push({ a: current, b: next, c: next + 1 });
    faces.push({ a: current, b: next + 1, c: current + 1 });
  }
  
  return { vertices, faces };
}

function generateCone(radius, height, segments) {
  const vertices = [];
  const faces = [];
  
  // Apex
  vertices.push({ x: 0, y: height, z: 0 });
  // Base center
  vertices.push({ x: 0, y: 0, z: 0 });
  
  // Base circle
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    vertices.push({ x, y: 0, z });
  }
  
  // Faces
  for (let i = 0; i < segments; i++) {
    const current = i + 3;
    const next = ((i + 1) % segments) + 3;
    
    // Side
    faces.push({ a: 1, b: current, c: next });
    // Base
    faces.push({ a: 2, b: next, c: current });
  }
  
  return { vertices, faces };
}

function generateTetrahedron(size) {
  const s = size;
  const vertices = [
    { x: s, y: s, z: s },
    { x: -s, y: -s, z: s },
    { x: -s, y: s, z: -s },
    { x: s, y: -s, z: -s }
  ];
  
  const faces = [
    { a: 1, b: 2, c: 3 },
    { a: 1, b: 3, c: 4 },
    { a: 1, b: 4, c: 2 },
    { a: 2, b: 4, c: 3 }
  ];
  
  return { vertices, faces };
}

function generateOctahedron(size) {
  const s = size;
  const vertices = [
    { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
    { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
    { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
  ];
  
  const faces = [
    { a: 1, b: 3, c: 5 }, { a: 1, b: 5, c: 4 },
    { a: 1, b: 4, c: 6 }, { a: 1, b: 6, c: 3 },
    { a: 2, b: 5, c: 3 }, { a: 2, b: 4, c: 5 },
    { a: 2, b: 6, c: 4 }, { a: 2, b: 3, c: 6 }
  ];
  
  return { vertices, faces };
}

function generateIcosahedron(size) {
  const t = (1 + Math.sqrt(5)) / 2;
  const s = size;
  
  const vertices = [
    { x: -s, y: t*s, z: 0 }, { x: s, y: t*s, z: 0 },
    { x: -s, y: -t*s, z: 0 }, { x: s, y: -t*s, z: 0 },
    { x: 0, y: -s, z: t*s }, { x: 0, y: s, z: t*s },
    { x: 0, y: -s, z: -t*s }, { x: 0, y: s, z: -t*s },
    { x: t*s, y: 0, z: -s }, { x: t*s, y: 0, z: s },
    { x: -t*s, y: 0, z: -s }, { x: -t*s, y: 0, z: s }
  ];
  
  const faces = [
    { a: 1, b: 12, c: 6 }, { a: 1, b: 6, c: 2 }, { a: 1, b: 2, c: 8 },
    { a: 1, b: 8, c: 11 }, { a: 1, b: 11, c: 12 }, { a: 2, b: 6, c: 10 },
    { a: 6, b: 12, c: 5 }, { a: 12, b: 11, c: 3 }, { a: 11, b: 8, c: 7 },
    { a: 8, b: 2, c: 9 }, { a: 4, b: 10, c: 5 }, { a: 4, b: 5, c: 3 },
    { a: 4, b: 3, c: 7 }, { a: 4, b: 7, c: 9 }, { a: 4, b: 9, c: 10 },
    { a: 5, b: 10, c: 6 }, { a: 3, b: 5, c: 12 }, { a: 7, b: 3, c: 11 },
    { a: 9, b: 7, c: 8 }, { a: 10, b: 9, c: 2 }
  ];
  
  return { vertices, faces };
}

/**
 * Convert hex color to RGB (0-1 range)
 */
function hexToRGB(hex) {
  const r = ((hex >> 16) & 0xFF) / 255;
  const g = ((hex >> 8) & 0xFF) / 255;
  const b = (hex & 0xFF) / 255;
  return { r, g, b };
}

/**
 * Main export function
 */
async function exportToBlender() {
  console.log("🎨 Starting Blender Export...\n");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const modelsDir = path.join(OUTPUT_DIR, "models");
  const materialsDir = path.join(OUTPUT_DIR, "materials");
  const enemyDir = path.join(modelsDir, "enemies");
  const weaponDir = path.join(modelsDir, "weapons");
  const bossDir = path.join(modelsDir, "bosses");
  const envDir = path.join(modelsDir, "environments");
  
  [modelsDir, materialsDir, enemyDir, weaponDir, bossDir, envDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  const exporter = new OBJExporter();

  try {
    // Read exported data
    const dataRoot = path.join(__dirname, "..", "unity-export", "data");
    const enemyTypes = JSON.parse(fs.readFileSync(path.join(dataRoot, "enemy_types.json"), "utf8"));
    const bossTypes = JSON.parse(fs.readFileSync(path.join(dataRoot, "boss_types.json"), "utf8"));
    const weaponTypes = JSON.parse(fs.readFileSync(path.join(dataRoot, "weapon_types.json"), "utf8"));
    const environments = JSON.parse(fs.readFileSync(path.join(dataRoot, "environments.json"), "utf8"));

    console.log("📦 Exporting enemy models...\n");

    for (const enemy of enemyTypes) {
      try {
        // Generate geometry
        const geometry = generateEnemyGeometry(enemy);
        
        // Export OBJ
        const objContent = exporter.exportMesh(
          enemy.className,
          geometry.vertices,
          geometry.faces
        );
        
        const objPath = path.join(enemyDir, `${enemy.className}.obj`);
        fs.writeFileSync(objPath, objContent);
        
        // Export MTL
        const color = hexToRGB(enemy.visuals.color);
        const emissive = hexToRGB(enemy.visuals.emissive);
        const mtlContent = exporter.exportMaterial(
          enemy.className,
          color,
          emissive
        );
        
        const mtlPath = path.join(materialsDir, `${enemy.className}.mtl`);
        fs.writeFileSync(mtlPath, mtlContent);
        
        console.log(`  ✅ ${enemy.displayName.padEnd(20)} → ${enemy.className}.obj`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to export ${enemy.displayName}:`, err.message);
      }
    }

    console.log("\n👑 Exporting boss models...\n");
    for (const boss of bossTypes) {
      try {
        const geometry = generateBossGeometry(boss);
        const objContent = exporter.exportMesh(
          boss.className,
          geometry.vertices,
          geometry.faces
        );

        const objPath = path.join(bossDir, `${boss.className}.obj`);
        fs.writeFileSync(objPath, objContent);

        const color = hexToRGB(boss.visuals.color || 0xffffff);
        const emissive = hexToRGB(boss.visuals.secondaryColor || boss.visuals.color || 0x000000);
        const mtlContent = exporter.exportMaterial(boss.className, color, emissive);
        const mtlPath = path.join(materialsDir, `${boss.className}.mtl`);
        fs.writeFileSync(mtlPath, mtlContent);

        console.log(`  ✅ ${String(boss.displayName).padEnd(20)} → ${boss.className}.obj`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to export ${boss.displayName}:`, err.message);
      }
    }

    console.log("\n🔫 Exporting weapon models...\n");
    for (const weapon of weaponTypes) {
      try {
        const geometry = generateWeaponGeometry(weapon);
        const objContent = exporter.exportMesh(
          weapon.className,
          geometry.vertices,
          geometry.faces
        );

        const objPath = path.join(weaponDir, `${weapon.className}.obj`);
        fs.writeFileSync(objPath, objContent);

        const color = hexToRGB(weapon.visuals.projectileColor || 0xffffff);
        const emissive = hexToRGB(weapon.visuals.muzzleFlashColor || weapon.visuals.projectileColor || 0x000000);
        const mtlContent = exporter.exportMaterial(weapon.className, color, emissive);
        const mtlPath = path.join(materialsDir, `${weapon.className}.mtl`);
        fs.writeFileSync(mtlPath, mtlContent);

        console.log(`  ✅ ${String(weapon.displayName).padEnd(20)} → ${weapon.className}.obj`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to export ${weapon.displayName}:`, err.message);
      }
    }

    console.log("\n🗺️  Exporting environment placeholders...\n");
    for (const env of environments) {
      try {
        const geometry = generateEnvironmentGeometry(env);
        const meshName = env.name || env.displayName || "environment";
        const objContent = exporter.exportMesh(
          meshName,
          geometry.vertices,
          geometry.faces
        );

        const objPath = path.join(envDir, `${env.name}.obj`);
        fs.writeFileSync(objPath, objContent);

        const color = hexToRGB(env.palette?.accentA || 0x666666);
        const emissive = hexToRGB(env.palette?.ambient || env.palette?.background || 0x111111);
        const mtlContent = exporter.exportMaterial(meshName, color, emissive);
        const mtlPath = path.join(materialsDir, `${env.name}.mtl`);
        fs.writeFileSync(mtlPath, mtlContent);

        const label = String(env.displayName || env.name);
        console.log(`  ✅ ${label.padEnd(20)} → ${env.name}.obj`);
      } catch (err) {
        console.warn(`  ⚠️  Failed to export ${env.displayName || env.name}:`, err.message);
      }
    }

    // Create import info file
    const infoContent = `# Blender Import Guide

## How to Import These Models

### Directory Layout
- Enemies: ${enemyDir}
- Bosses: ${bossDir}
- Weapons: ${weaponDir}
- Environments: ${envDir}

### Method 1: Direct Import (Individual Files)
1. Open Blender
2. File → Import → Wavefront (.obj)
3. Navigate to a category folder above
4. Select a .obj file and click "Import OBJ"
5. The model will appear at the origin

### Method 2: Batch Import (All Files)
Use this Blender Python script:

```python
import bpy
import os

# Set this to your models directory (containing subfolders)
models_dir = r"${modelsDir.replace(/\\/g, '\\\\')}"

# Collect all OBJ files (recursively)
obj_files = []
for root, _, files in os.walk(models_dir):
  for filename in files:
    if filename.endswith('.obj'):
      obj_files.append(os.path.join(root, filename))

# Import all OBJ files
for filepath in sorted(obj_files):
  bpy.ops.import_scene.obj(filepath=filepath)
  print(f"Imported: {os.path.relpath(filepath, models_dir)}")

# Arrange models in a grid
objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
spacing = 4
cols = 5

for i, obj in enumerate(objects):
  row = i // cols
  col = i % cols
  obj.location = (col * spacing, row * spacing, 0)

print(f"Imported {len(objects)} models")
```

To run this script in Blender:
1. Switch to "Scripting" workspace
2. Click "New" to create a new script
3. Paste the code above
4. Update `models_dir` path if needed
5. Click "Run Script" (▶ button)

### Method 3: Use Blender Command Line
\`\`\`bash
blender --python import_all_models.py
\`\`\`

## Exported Models

### Enemies (${enemyTypes.length})
${enemyTypes.map((e, i) => `${i + 1}. **${e.displayName}** (${e.className}.obj)`).join('\n')}

### Bosses (${bossTypes.length})
${bossTypes.map((b, i) => `${i + 1}. **${b.displayName}** (${b.className}.obj)`).join('\n')}

### Weapons (${weaponTypes.length})
${weaponTypes.map((w, i) => `${i + 1}. **${w.displayName}** (${w.className}.obj)`).join('\n')}

### Environments (${environments.length})
${environments.map((env, i) => `${i + 1}. **${env.displayName}** (${env.name}.obj)`).join('\n')}

## Material Colors

Materials are stored in the `materials/` folder as .mtl files.
Each model has:
- Base color (per asset type: visuals.color, projectileColor, palette.accentA)
- Emissive color (secondaryColor, muzzleFlashColor, palette.ambient)

To apply materials in Blender:
1. Select an object
2. Go to Shading workspace
3. The material should be auto-imported
4. Adjust Emission strength in the Shader Editor if needed

## Next Steps

1. **Scale & Position**: Adjust sizes to match your scene scale
2. **Add Details**: Use Blender's modeling tools to add detail
3. **Texture**: Apply textures or procedural materials
4. **Export**: Export as .fbx or .gltf for Unity
5. **Animate**: Add animations if desired

## Tips

- Use "Shade Smooth" (right-click → Shade Smooth) for smoother appearance
- Add Subdivision Surface modifier for higher quality
- Use Array modifier to create multiple copies
- Enable "Auto Smooth" in Object Data Properties
`;

    const infoPath = path.join(OUTPUT_DIR, "BLENDER_IMPORT_GUIDE.txt");
    fs.writeFileSync(infoPath, infoContent);

    const totalModels = enemyTypes.length + bossTypes.length + weaponTypes.length + environments.length;

    console.log("\n" + "=".repeat(60));
    console.log("📊 EXPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Models:    ${totalModels} OBJ files (enemies ${enemyTypes.length}, bosses ${bossTypes.length}, weapons ${weaponTypes.length}, environments ${environments.length})`);
    console.log(`Materials: ${totalModels} MTL files`);
    console.log(`Location:  ${OUTPUT_DIR}`);
    console.log("=".repeat(60));
    console.log("\n✅ Blender export complete!");
    console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);
    console.log(`\n📖 Import instructions: BLENDER_IMPORT_GUIDE.txt`);
    console.log(`\n💡 Tip: Use File → Import → Wavefront (.obj) in Blender`);

  } catch (error) {
    console.error("\n❌ Export failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run export
exportToBlender();
