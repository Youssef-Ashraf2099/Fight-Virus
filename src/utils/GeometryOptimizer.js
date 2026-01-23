import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Geometry Optimizer - Merges static meshes to reduce draw calls and build time
 * Use this to batch hundreds of environment objects into a few merged meshes
 */
export default class GeometryOptimizer {
  constructor() {
    this.meshBatches = new Map(); // keyed by material.uuid
  }

  /**
   * Add a mesh to be batched by material
   * @param {THREE.Mesh} mesh - The mesh to add
   * @param {THREE.Group} targetGroup - Group to add merged mesh to
   */
  addMesh(mesh, targetGroup) {
    if (!mesh.isMesh || !mesh.geometry || !mesh.material) return;

    // Update world matrix to get correct position/rotation/scale
    mesh.updateWorldMatrix(true, false);

    const materialKey = mesh.material.uuid;

    if (!this.meshBatches.has(materialKey)) {
      this.meshBatches.set(materialKey, {
        material: mesh.material,
        geometries: [],
        targetGroup: targetGroup,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
      });
    }

    const batch = this.meshBatches.get(materialKey);

    // Clone geometry and apply mesh transforms
    const clonedGeometry = mesh.geometry.clone();
    clonedGeometry.applyMatrix4(mesh.matrixWorld);

    batch.geometries.push(clonedGeometry);
  }

  /**
   * Create merged meshes from batched geometries
   * Call this after adding all meshes
   * @returns {number} Number of merged meshes created
   */
  merge() {
    let mergedCount = 0;

    for (const [materialKey, batch] of this.meshBatches) {
      if (batch.geometries.length === 0) continue;

      try {
        // Merge all geometries with same material
        const mergedGeometry = mergeGeometries(batch.geometries, false);

        if (mergedGeometry) {
          const mergedMesh = new THREE.Mesh(mergedGeometry, batch.material);
          mergedMesh.castShadow = batch.castShadow;
          mergedMesh.receiveShadow = batch.receiveShadow;

          batch.targetGroup.add(mergedMesh);
          mergedCount++;

          console.log(
            `   ✅ Merged ${batch.geometries.length} geometries into 1 mesh (material: ${batch.material.type})`,
          );
        }
      } catch (error) {
        console.warn(
          `   ⚠️ Failed to merge geometries for material ${materialKey}:`,
          error,
        );
      }

      // Dispose cloned geometries
      batch.geometries.forEach((geo) => geo.dispose());
    }

    this.meshBatches.clear();
    return mergedCount;
  }

  /**
   * Helper: Create instanced mesh for repeated identical objects
   * @param {THREE.BufferGeometry} geometry - Base geometry
   * @param {THREE.Material} material - Material to use
   * @param {Array<{position, rotation, scale}>} transforms - Array of transforms
   * @returns {THREE.InstancedMesh}
   */
  static createInstancedMesh(geometry, material, transforms) {
    const count = transforms.length;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    transforms.forEach((transform, i) => {
      position.set(
        transform.position?.x ?? 0,
        transform.position?.y ?? 0,
        transform.position?.z ?? 0,
      );

      if (transform.rotation) {
        rotation.set(
          transform.rotation.x ?? 0,
          transform.rotation.y ?? 0,
          transform.rotation.z ?? 0,
        );
        quaternion.setFromEuler(rotation);
      } else {
        quaternion.set(0, 0, 0, 1);
      }

      scale.set(
        transform.scale?.x ?? 1,
        transform.scale?.y ?? 1,
        transform.scale?.z ?? 1,
      );

      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;

    console.log(`   ✅ Created instanced mesh with ${count} instances`);

    return instancedMesh;
  }
}
