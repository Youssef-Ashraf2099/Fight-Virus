# Unity Import Guide - Fight Virus Migration

## Overview

This guide explains how to import your Three.js "Fight Virus" game data into Unity 3D.

## Prerequisites

- Unity 2021.3 LTS or newer
- Newtonsoft.Json package (for JSON parsing)
- Basic C# knowledge

---

## Step 1: Setup Unity Project

### 1.1 Create New Unity Project

```
1. Open Unity Hub
2. Click "New Project"
3. Select "3D (URP)" or "3D" template
4. Name it "FightVirusUnity"
5. Click "Create Project"
```

### 1.2 Install Required Packages

```
1. Window → Package Manager
2. Click "+" → "Add package by name"
3. Enter: com.unity.nuget.newtonsoft-json
4. Click "Add"
```

---

## Step 2: Import Export Data

### 2.1 Copy JSON Files

```
1. Locate your 'unity-export/data' folder
2. In Unity, create: Assets/ImportedData/
3. Copy all JSON files to Assets/ImportedData/
4. Unity will import them as TextAssets
```

Your Project structure should look like:

```
Assets/
  ImportedData/
    game_export.json
    meshes.json
    materials.json
    gameobjects.json
    enemy_types.json
    weapon_types.json
    environments.json
```

---

## Step 3: Create Data Classes

### 3.1 Create Scripts Folder

```
1. In Unity Project window: Assets → Create → Folder
2. Name it "Scripts"
3. Inside Scripts, create folder "ImportData"
```

### 3.2 Create C# Data Classes

Create **`Assets/Scripts/ImportData/GameDataStructures.cs`**:

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace FightVirus.Import
{
    [Serializable]
    public class Vector3Data
    {
        public float x, y, z;

        public Vector3 ToUnityVector3()
        {
            return new Vector3(x, y, z);
        }
    }

    [Serializable]
    public class Vector2Data
    {
        public float x, y;

        public Vector2 ToUnityVector2()
        {
            return new Vector2(x, y);
        }
    }

    [Serializable]
    public class ColorData
    {
        public float r, g, b;

        public Color ToUnityColor()
        {
            return new Color(r, g, b);
        }
    }

    [Serializable]
    public class BoundsData
    {
        public Vector3Data min;
        public Vector3Data max;

        public Bounds ToUnityBounds()
        {
            Vector3 minV = min.ToUnityVector3();
            Vector3 maxV = max.ToUnityVector3();
            Vector3 center = (minV + maxV) / 2f;
            Vector3 size = maxV - minV;
            return new Bounds(center, size);
        }
    }

    [Serializable]
    public class MeshData
    {
        public string id;
        public string name;
        public int vertexCount;
        public int triangleCount;
        public List<Vector3Data> vertices;
        public List<int> triangles;
        public List<Vector2Data> uvs;
        public List<Vector3Data> normals;
        public BoundsData bounds;
    }

    [Serializable]
    public class EmissiveData
    {
        public float r, g, b;
        public float intensity;
    }

    [Serializable]
    public class MaterialData
    {
        public string id;
        public string name;
        public string type;
        public ColorData color;
        public EmissiveData emissive;
        public float metalness;
        public float roughness;
        public float opacity;
        public bool transparent;
        public string side;
    }

    [Serializable]
    public class TransformData
    {
        public Vector3Data position;
        public Vector3Data rotation;
        public Vector3Data scale;
    }

    [Serializable]
    public class GameObjectData
    {
        public string id;
        public string name;
        public string type;
        public string parent;
        public TransformData transform;
        public bool visible;
        public bool castShadow;
        public bool receiveShadow;
        public string meshId;
        public string materialId;
        public Dictionary<string, object> userData;
    }

    [Serializable]
    public class EnemyStatsData
    {
        public float health;
        public float speed;
        public float damage;
        public int scoreValue;
        public float size;
    }

    [Serializable]
    public class EnemyBehaviorData
    {
        public string movementType;
        public float attackRange;
        public float detectionRange;
    }

    [Serializable]
    public class EnemyVisualsData
    {
        public int color;
        public int emissive;
    }

    [Serializable]
    public class EnemyTypeData
    {
        public string className;
        public EnemyStatsData baseStats;
        public EnemyBehaviorData behavior;
        public EnemyVisualsData visuals;
    }

    [Serializable]
    public class WeaponStatsData
    {
        public float damage;
        public float fireRate;
        public int magazineSize;
        public float reloadTime;
        public float projectileSpeed;
        public float projectileLifetime;
    }

    [Serializable]
    public class WeaponVisualsData
    {
        public int projectileColor;
        public int muzzleFlashColor;
    }

    [Serializable]
    public class WeaponTypeData
    {
        public string className;
        public string displayName;
        public WeaponStatsData stats;
        public WeaponVisualsData visuals;
    }

    [Serializable]
    public class BoundariesData
    {
        public float minX, maxX, minZ, maxZ;
    }

    [Serializable]
    public class PaletteData
    {
        public int ambient;
        public int directional;
        public int accentA;
        public int accentB;
        public int fog;
        public float fogDensity;
        public int background;
    }

    [Serializable]
    public class EnvironmentData
    {
        public string name;
        public string displayName;
        public float baseFloorHeight;
        public BoundariesData boundaries;
        public PaletteData palette;
        public string rootObjectId;
    }

    [Serializable]
    public class MetadataContainer
    {
        public Dictionary<string, string> metadata;
    }

    [Serializable]
    public class GameExportData
    {
        public string version;
        public string exportDate;
        public List<MeshData> meshes;
        public List<MaterialData> materials;
        public List<GameObjectData> gameObjects;
        public List<EnemyTypeData> enemyTypes;
        public List<WeaponTypeData> weaponTypes;
        public List<EnvironmentData> environments;
        public Dictionary<string, string> metadata;
    }
}
```

---

## Step 4: Create Importer Script

Create **`Assets/Scripts/ImportData/GameDataImporter.cs`**:

```csharp
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;

namespace FightVirus.Import
{
    public class GameDataImporter : MonoBehaviour
    {
        [Header("Import Files")]
        public TextAsset meshesJson;
        public TextAsset materialsJson;
        public TextAsset gameObjectsJson;
        public TextAsset enemyTypesJson;
        public TextAsset weaponTypesJson;
        public TextAsset environmentsJson;

        [Header("Output")]
        public Transform rootTransform;

        private Dictionary<string, Mesh> meshCache = new Dictionary<string, Mesh>();
        private Dictionary<string, Material> materialCache = new Dictionary<string, Material>();
        private Dictionary<string, GameObject> gameObjectCache = new Dictionary<string, GameObject>();

        [ContextMenu("Import All Data")]
        public void ImportAll()
        {
            Debug.Log("Starting import...");

            // Import meshes
            if (meshesJson != null)
            {
                ImportMeshes();
            }

            // Import materials
            if (materialsJson != null)
            {
                ImportMaterials();
            }

            // Import game objects
            if (gameObjectsJson != null)
            {
                ImportGameObjects();
            }

            // Import enemy types
            if (enemyTypesJson != null)
            {
                ImportEnemyTypes();
            }

            // Import weapon types
            if (weaponTypesJson != null)
            {
                ImportWeaponTypes();
            }

            // Import environments
            if (environmentsJson != null)
            {
                ImportEnvironments();
            }

            Debug.Log("Import complete!");
        }

        private void ImportMeshes()
        {
            List<MeshData> meshes = JsonConvert.DeserializeObject<List<MeshData>>(meshesJson.text);

            foreach (var meshData in meshes)
            {
                Mesh unityMesh = CreateMeshFromData(meshData);
                meshCache[meshData.id] = unityMesh;
            }

            Debug.Log($"Imported {meshes.Count} meshes");
        }

        private Mesh CreateMeshFromData(MeshData data)
        {
            Mesh mesh = new Mesh();
            mesh.name = data.name;

            // Set vertices
            Vector3[] vertices = new Vector3[data.vertices.Count];
            for (int i = 0; i < data.vertices.Count; i++)
            {
                vertices[i] = data.vertices[i].ToUnityVector3();
            }
            mesh.vertices = vertices;

            // Set triangles
            mesh.triangles = data.triangles.ToArray();

            // Set UVs if present
            if (data.uvs != null && data.uvs.Count > 0)
            {
                Vector2[] uvs = new Vector2[data.uvs.Count];
                for (int i = 0; i < data.uvs.Count; i++)
                {
                    uvs[i] = data.uvs[i].ToUnityVector2();
                }
                mesh.uv = uvs;
            }

            // Set normals if present, otherwise recalculate
            if (data.normals != null && data.normals.Count > 0)
            {
                Vector3[] normals = new Vector3[data.normals.Count];
                for (int i = 0; i < data.normals.Count; i++)
                {
                    normals[i] = data.normals[i].ToUnityVector3();
                }
                mesh.normals = normals;
            }
            else
            {
                mesh.RecalculateNormals();
            }

            mesh.RecalculateBounds();
            return mesh;
        }

        private void ImportMaterials()
        {
            List<MaterialData> materials = JsonConvert.DeserializeObject<List<MaterialData>>(materialsJson.text);

            foreach (var matData in materials)
            {
                Material unityMaterial = CreateMaterialFromData(matData);
                materialCache[matData.id] = unityMaterial;
            }

            Debug.Log($"Imported {materials.Count} materials");
        }

        private Material CreateMaterialFromData(MaterialData data)
        {
            // Use Standard shader or URP/Lit
            Material mat = new Material(Shader.Find("Standard"));
            mat.name = data.name;

            // Set color
            if (data.color != null)
            {
                mat.color = data.color.ToUnityColor();
            }

            // Set emission
            if (data.emissive != null && data.emissive.intensity > 0)
            {
                mat.EnableKeyword("_EMISSION");
                Color emissiveColor = new Color(data.emissive.r, data.emissive.g, data.emissive.b);
                mat.SetColor("_EmissionColor", emissiveColor * data.emissive.intensity);
            }

            // Set metallic and smoothness
            mat.SetFloat("_Metallic", data.metalness);
            mat.SetFloat("_Glossiness", 1f - data.roughness);

            // Set transparency
            if (data.transparent)
            {
                mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                mat.SetInt("_ZWrite", 0);
                mat.DisableKeyword("_ALPHATEST_ON");
                mat.EnableKeyword("_ALPHABLEND_ON");
                mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
                mat.renderQueue = 3000;

                Color c = mat.color;
                c.a = data.opacity;
                mat.color = c;
            }

            return mat;
        }

        private void ImportGameObjects()
        {
            List<GameObjectData> gameObjects = JsonConvert.DeserializeObject<List<GameObjectData>>(gameObjectsJson.text);

            // First pass: create all GameObjects
            foreach (var objData in gameObjects)
            {
                GameObject go = new GameObject(objData.name);
                go.SetActive(objData.visible);

                // Set transform
                go.transform.position = objData.transform.position.ToUnityVector3();
                go.transform.eulerAngles = objData.transform.rotation.ToUnityVector3() * Mathf.Rad2Deg;
                go.transform.localScale = objData.transform.scale.ToUnityVector3();

                // Add MeshFilter and MeshRenderer if it has a mesh
                if (!string.IsNullOrEmpty(objData.meshId) && meshCache.ContainsKey(objData.meshId))
                {
                    MeshFilter mf = go.AddComponent<MeshFilter>();
                    mf.mesh = meshCache[objData.meshId];

                    MeshRenderer mr = go.AddComponent<MeshRenderer>();
                    mr.shadowCastingMode = objData.castShadow ?
                        UnityEngine.Rendering.ShadowCastingMode.On :
                        UnityEngine.Rendering.ShadowCastingMode.Off;
                    mr.receiveShadows = objData.receiveShadow;

                    if (!string.IsNullOrEmpty(objData.materialId) && materialCache.ContainsKey(objData.materialId))
                    {
                        mr.material = materialCache[objData.materialId];
                    }
                }

                gameObjectCache[objData.id] = go;
            }

            // Second pass: set up hierarchy
            foreach (var objData in gameObjects)
            {
                if (!string.IsNullOrEmpty(objData.parent) && gameObjectCache.ContainsKey(objData.parent))
                {
                    GameObject child = gameObjectCache[objData.id];
                    GameObject parent = gameObjectCache[objData.parent];
                    child.transform.SetParent(parent.transform, false);
                }
                else if (rootTransform != null)
                {
                    gameObjectCache[objData.id].transform.SetParent(rootTransform, false);
                }
            }

            Debug.Log($"Imported {gameObjects.Count} game objects");
        }

        private void ImportEnemyTypes()
        {
            List<EnemyTypeData> enemies = JsonConvert.DeserializeObject<List<EnemyTypeData>>(enemyTypesJson.text);

            // TODO: Create ScriptableObjects or prefabs for each enemy type
            // For now, just log them
            foreach (var enemy in enemies)
            {
                Debug.Log($"Enemy Type: {enemy.className} - HP: {enemy.baseStats.health}, Speed: {enemy.baseStats.speed}");
            }

            Debug.Log($"Imported {enemies.Count} enemy types");
        }

        private void ImportWeaponTypes()
        {
            List<WeaponTypeData> weapons = JsonConvert.DeserializeObject<List<WeaponTypeData>>(weaponTypesJson.text);

            // TODO: Create ScriptableObjects or prefabs for each weapon type
            foreach (var weapon in weapons)
            {
                Debug.Log($"Weapon Type: {weapon.displayName} - Damage: {weapon.stats.damage}, Fire Rate: {weapon.stats.fireRate}");
            }

            Debug.Log($"Imported {weapons.Count} weapon types");
        }

        private void ImportEnvironments()
        {
            List<EnvironmentData> environments = JsonConvert.DeserializeObject<List<EnvironmentData>>(environmentsJson.text);

            foreach (var env in environments)
            {
                Debug.Log($"Environment: {env.displayName} - Floor Height: {env.baseFloorHeight}");

                // Find root object and create environment parent
                if (!string.IsNullOrEmpty(env.rootObjectId) && gameObjectCache.ContainsKey(env.rootObjectId))
                {
                    GameObject rootObj = gameObjectCache[env.rootObjectId];
                    rootObj.name = $"Environment_{env.name}";
                }
            }

            Debug.Log($"Imported {environments.Count} environments");
        }
    }
}
```

---

## Step 5: Use the Importer

### 5.1 Create Importer GameObject

```
1. In Hierarchy: Right-click → Create Empty
2. Name it "GameDataImporter"
3. Add Component → GameDataImporter script
```

### 5.2 Assign JSON Files

```
1. Select GameDataImporter in Hierarchy
2. In Inspector, drag JSON files from Assets/ImportedData/ to corresponding fields:
   - Meshes Json → meshes.json
   - Materials Json → materials.json
   - GameObjects Json → gameobjects.json
   - Enemy Types Json → enemy_types.json
   - Weapon Types Json → weapon_types.json
   - Environments Json → environments.json
```

### 5.3 Run Import

```
1. Select GameDataImporter
2. In Inspector, click the "..." menu
3. Select "Import All Data"
4. Check Console for progress
```

---

## Step 6: Verify Import

After import completes:

1. **Check Hierarchy**: You should see imported GameObjects
2. **Check Scene View**: Meshes should be visible
3. **Check Materials**: Objects should have colors/materials

---

## Troubleshooting

### "Newtonsoft.Json not found"

- Install via Package Manager (Step 1.2)

### "Meshes appear black"

- Check if materials imported correctly
- Try adding a light to the scene

### "Nothing appears"

- Check Console for errors
- Verify JSON files are assigned
- Try importing one file at a time

### "Rotations are wrong"

- Three.js uses radians, Unity uses degrees
- The script handles this conversion

---

## Next Steps

1. **Create Prefabs**: Convert imported objects to prefabs for reuse
2. **Add Scripts**: Port game logic to C# scripts
3. **Setup Physics**: Add colliders and rigidbodies
4. **Create ScriptableObjects**: For enemy/weapon data
5. **Build Levels**: Use imported environments as base

---

## Additional Resources

- [Unity C# Scripting Reference](https://docs.unity3d.com/ScriptReference/)
- [JSON.NET Documentation](https://www.newtonsoft.com/json/help/html/Introduction.htm)
- [Unity Mesh API](https://docs.unity3d.com/ScriptReference/Mesh.html)

---

## Support

If you encounter issues, check:

- Unity Console for errors
- JSON file structure matches expected format
- All required packages are installed

Good luck with your Unity migration! 🎮
