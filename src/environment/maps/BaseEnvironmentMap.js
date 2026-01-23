import * as THREE from "three";
import OptimizedEnvironmentBuilder from "../utils/OptimizedEnvironmentBuilder.js";

export default class BaseEnvironmentMap {
  constructor(environment) {
    this.environment = environment;
    this.scene = environment.scene;
    this.group = new THREE.Group();
    this.animators = [];
    this.displayName = "System Sector";
    this.baseFloorHeight = 0;
    this.colliders = [];
    // OPTIMIZATION: Builder for auto-batching geometry
    this.builder = null;
    // Default map boundaries (can be overridden by subclasses)
    this.mapBoundaries = {
      minX: -60,
      maxX: 60,
      minZ: -60,
      maxZ: 60,
    };
  }

  build(parentGroup) {
    this.parentGroup = parentGroup;
    // OPTIMIZATION: Initialize builder before create()
    this.builder = new OptimizedEnvironmentBuilder(this.scene, this.group);
    this.create();
    // OPTIMIZATION: Finalize builder to merge geometries
    if (this.builder) {
      this.builder.finalize();
      this.builder = null; // Free memory
    }
    parentGroup.add(this.group);
    // OPTIMIZATION: Disable shadow casting for all environment meshes
    // Only player and bosses should cast shadows
    this._disableShadowCasting(this.group);
    this.onEnter();
  }

  create() {
    // Subclasses override to populate this.group
  }

  _disableShadowCasting(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        // Keep receiveShadow for floor/platforms
      }
    });
  }

  onEnter() {}

  onExit() {}

  addAnimator(fn) {
    if (typeof fn === "function") {
      this.animators.push(fn);
    }
  }

  setBaseFloorHeight(height) {
    this.baseFloorHeight = typeof height === "number" ? height : 0;
  }

  addCollider(bounds) {
    if (!bounds) return;
    const collider = {
      minX: bounds.minX ?? bounds.x ?? 0,
      maxX: bounds.maxX ?? bounds.x ?? 0,
      minZ: bounds.minZ ?? bounds.z ?? 0,
      maxZ: bounds.maxZ ?? bounds.z ?? 0,
      height: bounds.height ?? 0,
    };

    if (collider.minX > collider.maxX) {
      [collider.minX, collider.maxX] = [collider.maxX, collider.minX];
    }
    if (collider.minZ > collider.maxZ) {
      [collider.minZ, collider.maxZ] = [collider.maxZ, collider.minZ];
    }

    this.colliders.push(collider);
  }

  getBaseFloorHeight() {
    return this.baseFloorHeight;
  }

  getColliders() {
    return this.colliders.slice();
  }

  getMapBoundaries() {
    return this.mapBoundaries;
  }

  setMapBoundaries(boundaries) {
    this.mapBoundaries = {
      minX: boundaries.minX ?? this.mapBoundaries.minX,
      maxX: boundaries.maxX ?? this.mapBoundaries.maxX,
      minZ: boundaries.minZ ?? this.mapBoundaries.minZ,
      maxZ: boundaries.maxZ ?? this.mapBoundaries.maxZ,
    };
  }

  update(deltaTime, timeElapsed, playerPosition) {
    if (!this.animators.length) return;
    this.animators.forEach((animator) => {
      animator(deltaTime, timeElapsed, playerPosition);
    });
  }

  getPalette() {
    return null;
  }

  dispose() {
    this.onExit();

    if (this.parentGroup) {
      this.parentGroup.remove(this.group);
    }

    this.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.animators = [];
    this.group = null;
    this.colliders = [];
  }
}
