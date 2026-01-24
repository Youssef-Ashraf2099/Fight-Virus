import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Mapping of enemy types to their instanced setup keys
const INSTANCED_TYPES = {
  trojan: "TrojanVirus",
  adware: "AdwareVirus"
};

const LOD_DISTANCES = {
    LOD0: 15 * 15, // Squared distance for High Detail
    LOD1: 40 * 40  // Squared distance for Medium Detail (beyond is Low/Cull)
};

export default class InstancedEnemyRenderer {
  constructor(scene) {
    this.scene = scene;
    this.meshes = {}; // Map<key, InstancedMesh>
    this.capacity = 1000;
    this.dummy = new THREE.Object3D();
    
    // Geometry/Material cache
    this.geometries = {};
    this.materials = {};
  }

  async init() {
    // 1. Build Trojan Assets (LOD0, LOD1)
    this._buildTrojanAssets();
    
    // 2. Build Adware Assets (LOD0)
    this._buildAdwareAssets();
    
    // Create instanced meshes for each LOD
    this._createInstancedMesh("TrojanVirus_LOD0", this.geometries.trojan_LOD0, this.materials.trojan);
    this._createInstancedMesh("TrojanVirus_LOD1", this.geometries.trojan_LOD1, this.materials.trojan_low);
    
    this._createInstancedMesh("AdwareVirus_LOD0", this.geometries.adware_LOD0, this.materials.adware);
    
    console.log("InstancedEnemyRenderer initialized with LOD support.");
  }

  _createInstancedMesh(key, geometry, material) {
    if (!geometry || !material) return;
    const mesh = new THREE.InstancedMesh(geometry, material, this.capacity);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.castShadow = false; // Optimization: Trash mobs don't cast shadows
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes[key] = mesh;
  }

  _buildTrojanAssets() {
    // LOD0: Full Detail (Merged)
    const geos = [];
    const coreGeo = new THREE.DodecahedronGeometry(1.5, 0);
    geos.push(coreGeo);
    
    const spikeGeo = new THREE.ConeGeometry(0.3, 2, 8);
    spikeGeo.rotateX(Math.PI); 
    
    for (let i = 0; i < 12; i++) {
        const phi = Math.acos(-1 + (2 * i) / 12);
        const theta = Math.sqrt(12 * Math.PI) * phi;
        const x = Math.cos(theta) * Math.sin(phi) * 2;
        const y = Math.cos(phi) * 2;
        const z = Math.sin(theta) * Math.sin(phi) * 2;
        
        const dummy = new THREE.Object3D();
        dummy.position.set(x, y, z);
        dummy.lookAt(0, 0, 0);
        dummy.rotateX(Math.PI); 
        dummy.updateMatrix();
        
        const clone = spikeGeo.clone();
        clone.applyMatrix4(dummy.matrix);
        geos.push(clone);
    }
    
    const innerGeo = new THREE.IcosahedronGeometry(0.8, 0);
    geos.push(innerGeo);
    
    this.geometries.trojan_LOD0 = BufferGeometryUtils.mergeGeometries(geos);
    
    // LOD1: Low Detail (Core + Inner only, simple shape)
    // Actually just Dodecahedron is enough for distance.
    const lod1Geo = new THREE.DodecahedronGeometry(1.5, 0);
    this.geometries.trojan_LOD1 = lod1Geo;
    
    // Materials
    this.materials.trojan = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.6
    });
    
    this.materials.trojan_low = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.8, // Cheaper shading?
        metalness: 0.1
    });
  }

  _buildAdwareAssets() {
      // LOD0
      const bodyGeo = new THREE.BoxGeometry(1.5, 1.5, 0.3);
      this.geometries.adware_LOD0 = bodyGeo;
      this.materials.adware = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          emissive: 0xff8800,
          emissiveIntensity: 0.4
      });
  }

  update(enemies, playerPosition) {
    if (!enemies || enemies.length === 0) {
        Object.values(this.meshes).forEach(m => m.count = 0);
        return;
    }

    const counts = {}; // key -> count

    // Initialize counts
    for (const key in this.meshes) counts[key] = 0;

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isInstanced) continue;
        
        const type = enemy.typeId;
        if (!type) continue;

        // Determine LOD
        let lodKey = `${type}_LOD0`;
        
        if (playerPosition && type === 'TrojanVirus') {
            const distSq = enemy.position.distanceToSquared(playerPosition);
            if (distSq > LOD_DISTANCES.LOD0) {
                lodKey = `${type}_LOD1`;
            }
        }
        // Adware only has LOD0 defined for now, so default works if we checked meshes[lodKey]
        
        if (!this.meshes[lodKey]) {
            // Fallback to LOD0 if LOD1 missing
            lodKey = `${type}_LOD0`;
        }
        
        if (this.meshes[lodKey]) {
            const idx = counts[lodKey]++;
            if (idx >= this.capacity) continue;
            
            this.dummy.position.copy(enemy.position);
            
            if (enemy.group) {
                 this.dummy.rotation.copy(enemy.group.rotation);
                 this.dummy.scale.copy(enemy.group.scale);
            } else {
                 this.dummy.rotation.set(0,0,0);
                 this.dummy.scale.set(1,1,1);
            }
            
            this.dummy.updateMatrix();
            this.meshes[lodKey].setMatrixAt(idx, this.dummy.matrix);
        }
    }

    // Update counts and flags
    for (const [key, mesh] of Object.entries(this.meshes)) {
        mesh.count = counts[key] || 0;
        if (mesh.count > 0) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
  }
}
