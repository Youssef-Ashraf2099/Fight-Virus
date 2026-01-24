import * as THREE from "three";
import * as fs from "fs";
import * as path from "path";

/**
 * Unity Export System
 * Exports Three.js game data to Unity-compatible JSON format
 * 
 * Extracts:
 * - Mesh data (vertices, triangles, UVs, normals)
 * - Transform data (position, rotation, scale)
 * - Material data (colors, emissive, metalness, etc.)
 * - Game logic data (enemy stats, weapon configs, etc.)
 */

export class UnityExporter {
  constructor(outputDir = "./unity-export/data") {
    this.outputDir = outputDir;
    this.exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      meshes: [],
      materials: [],
      gameObjects: [],
      enemyTypes: [],
      weaponTypes: [],
      environments: [],
      metadata: {}
    };
    
    // Track exported meshes and materials to avoid duplicates
    this.meshCache = new Map();
    this.materialCache = new Map();
    this.meshIdCounter = 0;
    this.materialIdCounter = 0;
  }

  /**
   * Export a Three.js mesh to Unity format
   */
  exportMesh(geometry) {
    if (!geometry || !geometry.isBufferGeometry) {
      console.warn("Invalid geometry provided");
      return null;
    }

    // Check cache
    const geometryId = geometry.uuid;
    if (this.meshCache.has(geometryId)) {
      return this.meshCache.get(geometryId);
    }

    const meshId = `mesh_${this.meshIdCounter++}`;
    
    // Extract vertex data
    const positions = geometry.attributes.position;
    const vertices = [];
    for (let i = 0; i < positions.count; i++) {
      vertices.push({
        x: positions.getX(i),
        y: positions.getY(i),
        z: positions.getZ(i)
      });
    }

    // Extract triangle indices
    const triangles = [];
    if (geometry.index) {
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i++) {
        triangles.push(indices[i]);
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < positions.count; i++) {
        triangles.push(i);
      }
    }

    // Extract UVs if present
    const uvs = [];
    if (geometry.attributes.uv) {
      const uvAttr = geometry.attributes.uv;
      for (let i = 0; i < uvAttr.count; i++) {
        uvs.push({
          x: uvAttr.getX(i),
          y: uvAttr.getY(i)
        });
      }
    }

    // Extract normals if present
    const normals = [];
    if (geometry.attributes.normal) {
      const normalAttr = geometry.attributes.normal;
      for (let i = 0; i < normalAttr.count; i++) {
        normals.push({
          x: normalAttr.getX(i),
          y: normalAttr.getY(i),
          z: normalAttr.getZ(i)
        });
      }
    }

    const meshData = {
      id: meshId,
      name: geometry.name || meshId,
      vertexCount: vertices.length,
      triangleCount: triangles.length / 3,
      vertices: vertices,
      triangles: triangles,
      uvs: uvs.length > 0 ? uvs : null,
      normals: normals.length > 0 ? normals : null,
      bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      }
    };

    // Calculate bounds
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      meshData.bounds.min = {
        x: geometry.boundingBox.min.x,
        y: geometry.boundingBox.min.y,
        z: geometry.boundingBox.min.z
      };
      meshData.bounds.max = {
        x: geometry.boundingBox.max.x,
        y: geometry.boundingBox.max.y,
        z: geometry.boundingBox.max.z
      };
    }

    this.exportData.meshes.push(meshData);
    this.meshCache.set(geometryId, meshId);
    
    return meshId;
  }

  /**
   * Export a Three.js material to Unity format
   */
  exportMaterial(material) {
    if (!material || !material.isMaterial) {
      return null;
    }

    // Check cache
    const materialId = material.uuid;
    if (this.materialCache.has(materialId)) {
      return this.materialCache.get(materialId);
    }

    const matId = `mat_${this.materialIdCounter++}`;
    
    const materialData = {
      id: matId,
      name: material.name || matId,
      type: material.type,
      color: material.color ? {
        r: material.color.r,
        g: material.color.g,
        b: material.color.b
      } : { r: 1, g: 1, b: 1 },
      emissive: material.emissive ? {
        r: material.emissive.r,
        g: material.emissive.g,
        b: material.emissive.b,
        intensity: material.emissiveIntensity || 0
      } : null,
      metalness: material.metalness || 0,
      roughness: material.roughness || 1,
      opacity: material.opacity !== undefined ? material.opacity : 1,
      transparent: material.transparent || false,
      side: material.side === THREE.DoubleSide ? "DoubleSide" : (material.side === THREE.BackSide ? "BackSide" : "FrontSide")
    };

    this.exportData.materials.push(materialData);
    this.materialCache.set(materialId, matId);
    
    return matId;
  }

  /**
   * Export a Three.js Object3D (GameObject equivalent)
   */
  exportObject3D(object, parentId = null) {
    if (!object) return null;

    const gameObjectData = {
      id: object.uuid,
      name: object.name || `GameObject_${object.uuid}`,
      type: object.type,
      parent: parentId,
      transform: {
        position: {
          x: object.position.x,
          y: object.position.y,
          z: object.position.z
        },
        rotation: {
          x: object.rotation.x,
          y: object.rotation.y,
          z: object.rotation.z
        },
        scale: {
          x: object.scale.x,
          y: object.scale.y,
          z: object.scale.z
        }
      },
      visible: object.visible,
      castShadow: object.castShadow || false,
      receiveShadow: object.receiveShadow || false
    };

    // Export mesh if it's a Mesh object
    if (object.isMesh && object.geometry && object.material) {
      gameObjectData.meshId = this.exportMesh(object.geometry);
      gameObjectData.materialId = this.exportMaterial(object.material);
    }

    // Add custom user data if present
    if (object.userData && Object.keys(object.userData).length > 0) {
      gameObjectData.userData = object.userData;
    }

    this.exportData.gameObjects.push(gameObjectData);

    // Recursively export children
    if (object.children && object.children.length > 0) {
      object.children.forEach(child => {
        this.exportObject3D(child, object.uuid);
      });
    }

    return gameObjectData.id;
  }

  /**
   * Export enemy type definitions
   */
  exportEnemyType(enemyClass) {
    const enemyData = {
      className: enemyClass.name,
      baseStats: {
        health: enemyClass.prototype.maxHealth || 100,
        speed: enemyClass.prototype.speed || 1,
        damage: enemyClass.prototype.damage || 10,
        scoreValue: enemyClass.prototype.scoreValue || 100,
        size: enemyClass.prototype.size || 1
      },
      behavior: {
        movementType: enemyClass.prototype.movementType || "chase",
        attackRange: enemyClass.prototype.attackRange || 2,
        detectionRange: enemyClass.prototype.detectionRange || 50
      },
      visuals: {
        color: enemyClass.prototype.color || 0xff0000,
        emissive: enemyClass.prototype.emissive || 0x000000
      }
    };

    this.exportData.enemyTypes.push(enemyData);
  }

  /**
   * Export weapon type definitions
   */
  exportWeaponType(weaponClass) {
    const weaponData = {
      className: weaponClass.name,
      displayName: weaponClass.prototype.displayName || weaponClass.name,
      stats: {
        damage: weaponClass.prototype.damage || 10,
        fireRate: weaponClass.prototype.fireRate || 1,
        magazineSize: weaponClass.prototype.magazineSize || 30,
        reloadTime: weaponClass.prototype.reloadTime || 2,
        projectileSpeed: weaponClass.prototype.projectileSpeed || 50,
        projectileLifetime: weaponClass.prototype.projectileLifetime || 3
      },
      visuals: {
        projectileColor: weaponClass.prototype.projectileColor || 0x00ff00,
        muzzleFlashColor: weaponClass.prototype.muzzleFlashColor || 0xffff00
      }
    };

    this.exportData.weaponTypes.push(weaponData);
  }

  /**
   * Export environment/map data
   */
  exportEnvironment(environment, envName) {
    const envData = {
      name: envName,
      displayName: environment.displayName || envName,
      baseFloorHeight: environment.baseFloorHeight || 0,
      boundaries: environment.mapBoundaries || {
        minX: -60, maxX: 60,
        minZ: -60, maxZ: 60
      },
      palette: environment.getPalette ? environment.getPalette() : null,
      objects: []
    };

    // Export environment group if it exists
    if (environment.group) {
      this.exportObject3D(environment.group);
      envData.rootObjectId = environment.group.uuid;
    }

    this.exportData.environments.push(envData);
  }

  /**
   * Save all export data to JSON files
   */
  async saveToFiles() {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Save main export file
    const mainFile = path.join(this.outputDir, "game_export.json");
    fs.writeFileSync(mainFile, JSON.stringify(this.exportData, null, 2));
    console.log(`✅ Saved main export to: ${mainFile}`);

    // Save meshes separately (can be large)
    if (this.exportData.meshes.length > 0) {
      const meshFile = path.join(this.outputDir, "meshes.json");
      fs.writeFileSync(meshFile, JSON.stringify(this.exportData.meshes, null, 2));
      console.log(`✅ Saved ${this.exportData.meshes.length} meshes to: ${meshFile}`);
    }

    // Save materials separately
    if (this.exportData.materials.length > 0) {
      const matFile = path.join(this.outputDir, "materials.json");
      fs.writeFileSync(matFile, JSON.stringify(this.exportData.materials, null, 2));
      console.log(`✅ Saved ${this.exportData.materials.length} materials to: ${matFile}`);
    }

    // Save game objects hierarchy
    if (this.exportData.gameObjects.length > 0) {
      const objFile = path.join(this.outputDir, "gameobjects.json");
      fs.writeFileSync(objFile, JSON.stringify(this.exportData.gameObjects, null, 2));
      console.log(`✅ Saved ${this.exportData.gameObjects.length} game objects to: ${objFile}`);
    }

    // Save enemy types
    if (this.exportData.enemyTypes.length > 0) {
      const enemyFile = path.join(this.outputDir, "enemy_types.json");
      fs.writeFileSync(enemyFile, JSON.stringify(this.exportData.enemyTypes, null, 2));
      console.log(`✅ Saved ${this.exportData.enemyTypes.length} enemy types to: ${enemyFile}`);
    }

    // Save weapon types
    if (this.exportData.weaponTypes.length > 0) {
      const weaponFile = path.join(this.outputDir, "weapon_types.json");
      fs.writeFileSync(weaponFile, JSON.stringify(this.exportData.weaponTypes, null, 2));
      console.log(`✅ Saved ${this.exportData.weaponTypes.length} weapon types to: ${weaponFile}`);
    }

    // Save environments
    if (this.exportData.environments.length > 0) {
      const envFile = path.join(this.outputDir, "environments.json");
      fs.writeFileSync(envFile, JSON.stringify(this.exportData.environments, null, 2));
      console.log(`✅ Saved ${this.exportData.environments.length} environments to: ${envFile}`);
    }

    console.log("\n🎉 Export complete! Files saved to:", this.outputDir);
    
    return {
      mainFile,
      meshCount: this.exportData.meshes.length,
      materialCount: this.exportData.materials.length,
      gameObjectCount: this.exportData.gameObjects.length,
      enemyTypeCount: this.exportData.enemyTypes.length,
      weaponTypeCount: this.exportData.weaponTypes.length,
      environmentCount: this.exportData.environments.length
    };
  }

  /**
   * Add metadata about the export
   */
  setMetadata(key, value) {
    this.exportData.metadata[key] = value;
  }
}

export default UnityExporter;
