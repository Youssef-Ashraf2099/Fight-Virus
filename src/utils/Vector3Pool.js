import * as THREE from "three";

export class Vector3Pool {
  constructor(initialSize = 100) {
    this.pool = [];
    this.count = 0;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new THREE.Vector3());
    }
  }

  get(x = 0, y = 0, z = 0) {
    let v;
    if (this.count < this.pool.length) {
      v = this.pool[this.count++];
      v.set(x, y, z);
    } else {
      // Expand pool if needed (warning: allocation during frame)
      // console.warn("Vector3Pool expanded!");
      v = new THREE.Vector3(x, y, z);
      this.pool.push(v);
      this.count++;
    }
    return v;
  }

  // Release doesn't actually need to do anything if we reset frame-based
  // But for manual release:
  release(v) {
      // In a linear allocator model, we just reset 'count' at start of frame
      // This is safer for Game Loops than manual release which risks leaks
  }
  
  reset() {
      this.count = 0;
  }
}

export const vec3Pool = new Vector3Pool(1000);
