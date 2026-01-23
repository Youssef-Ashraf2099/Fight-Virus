import * as THREE from "three";
import GeometryOptimizer from "../../utils/GeometryOptimizer.js";

/**
 * Optimized Environment Builder
 * Provides helpers for creating detailed environments with automatic batching
 */
export default class OptimizedEnvironmentBuilder {
  constructor(scene, group) {
    this.scene = scene;
    this.group = group;
    this.optimizer = new GeometryOptimizer();
    this.tempObjects = []; // Store objects before merging
  }

  /**
   * Add a static mesh that will be merged
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Material} material
   * @param {Object} options - {position, rotation, scale, castShadow, receiveShadow}
   */
  addStatic(geometry, material, options = {}) {
    const mesh = new THREE.Mesh(geometry, material);

    if (options.position) {
      mesh.position.set(
        options.position.x ?? 0,
        options.position.y ?? 0,
        options.position.z ?? 0,
      );
    }

    if (options.rotation) {
      mesh.rotation.set(
        options.rotation.x ?? 0,
        options.rotation.y ?? 0,
        options.rotation.z ?? 0,
      );
    }

    if (options.scale) {
      if (typeof options.scale === "number") {
        mesh.scale.setScalar(options.scale);
      } else {
        mesh.scale.set(
          options.scale.x ?? 1,
          options.scale.y ?? 1,
          options.scale.z ?? 1,
        );
      }
    }

    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? true;

    this.optimizer.addMesh(mesh, this.group);
    this.tempObjects.push(mesh);
  }

  /**
   * Add multiple static objects in a grid
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Material} material
   * @param {Object} gridOptions - {rows, cols, spacingX, spacingZ, startX, startZ, height}
   */
  addGrid(geometry, material, gridOptions) {
    const {
      rows = 10,
      cols = 10,
      spacingX = 5,
      spacingZ = 5,
      startX = 0,
      startZ = 0,
      height = 0,
      randomOffset = 0,
      randomRotation = false,
    } = gridOptions;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x =
          startX + col * spacingX + (Math.random() - 0.5) * randomOffset;
        const z =
          startZ + row * spacingZ + (Math.random() - 0.5) * randomOffset;

        this.addStatic(geometry, material, {
          position: { x, y: height, z },
          rotation: randomRotation
            ? {
                x: 0,
                y: Math.random() * Math.PI * 2,
                z: 0,
              }
            : undefined,
        });
      }
    }
  }

  /**
   * Add instanced objects (for many identical objects)
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Material} material
   * @param {Array} transforms - Array of {position, rotation, scale}
   * @param {Object} options - {castShadow, receiveShadow}
   */
  addInstanced(geometry, material, transforms, options = {}) {
    const instancedMesh = GeometryOptimizer.createInstancedMesh(
      geometry,
      material,
      transforms,
    );

    instancedMesh.castShadow = options.castShadow ?? false;
    instancedMesh.receiveShadow = options.receiveShadow ?? true;

    this.group.add(instancedMesh);
    return instancedMesh;
  }

  /**
   * Add a circle of objects
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Material} material
   * @param {Object} circleOptions - {count, radius, height, randomScale}
   */
  addCircle(geometry, material, circleOptions) {
    const {
      count = 12,
      radius = 10,
      height = 0,
      randomScale = false,
    } = circleOptions;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      this.addStatic(geometry, material, {
        position: { x, y: height, z },
        rotation: { x: 0, y: angle + Math.PI / 2, z: 0 },
        scale: randomScale ? 0.8 + Math.random() * 0.4 : 1,
      });
    }
  }

  /**
   * Finalize - merge all static objects
   * Call this after adding all objects
   */
  finalize() {
    console.log(
      `   🔨 Finalizing environment - merging ${this.tempObjects.length} objects...`,
    );
    const mergedCount = this.optimizer.merge();

    // Clean up temp objects (they're now merged)
    this.tempObjects.forEach((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    this.tempObjects = [];

    console.log(
      `   ✅ Created ${mergedCount} merged meshes from batched geometries`,
    );
    return mergedCount;
  }

  /**
   * Create shared geometry pool
   */
  static createGeometryPool() {
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
      sphere: new THREE.SphereGeometry(0.5, 16, 16),
      plane: new THREE.PlaneGeometry(1, 1),
      cone: new THREE.ConeGeometry(0.5, 1, 16),
      torus: new THREE.TorusGeometry(0.5, 0.2, 16, 32),
    };
  }

  /**
   * Create shared material pool
   */
  static createMaterialPool() {
    return {
      basic: (color) =>
        new THREE.MeshPhongMaterial({
          color: color,
          shininess: 30,
        }),
      emissive: (color, intensity = 0.5) =>
        new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: intensity,
          shininess: 60,
        }),
      metallic: (color) =>
        new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.2,
        }),
    };
  }
}
