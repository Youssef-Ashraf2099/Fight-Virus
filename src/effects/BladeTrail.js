import * as THREE from "three";
import { vector3Pool } from "../utils/ObjectPool.js";

const MAX_TRAIL_POINTS = 60;

export default class BladeTrail {
  constructor(scene, color = 0x00ffff, maxAge = 0.5, width = 0.5) {
    this.scene = scene;
    this.color = new THREE.Color(color);
    this.maxAge = maxAge;
    this.width = width;

    // Ring buffer for trail points
    this.history = []; // { pointTop, pointBottom, time }
    
    // Geometry
    this.geometry = new THREE.BufferGeometry();
    
    // Attributes
    const vertices = new Float32Array(MAX_TRAIL_POINTS * 2 * 3); // 2 verts per segment (top/bottom) * 3 coords
    const colors = new Float32Array(MAX_TRAIL_POINTS * 2 * 3);
    const uvs = new Float32Array(MAX_TRAIL_POINTS * 2 * 2);
    
    this.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    
    // Shader Material for smooth fade
    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying float vAlpha;
        attribute float alpha;
        
        void main() {
          vUv = uv;
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;
        varying float vAlpha;
        
        void main() {
          // Fade alpha based on vUv.x (age along trail)
          float alpha = smoothstep(0.0, 1.0, vUv.x) * 0.8;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        color: { value: this.color },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    
    // Manual attribute management for custom shader fade
    // We'll actually pass alpha via UV x since we shift points
  }

  update(deltaTime, tipPos, basePos, isSwinging) {
    const now = performance.now() / 1000;

    // Add new point if swinging
    if (isSwinging) {
        // Use pool inside the history to avoid GC? 
        // For simplicity, we clone vectors here, or structured object.
        // To be strictly zero-allocation, history should be pre-allocated.
        // Let's settle for minimal allocation: simple objects.
      this.history.unshift({
        top: tipPos.clone(),
        bottom: basePos.clone(),
        time: now
      });
    }

    // Prune old points
    while (this.history.length > 0 && now - this.history[this.history.length - 1].time > this.maxAge) {
      this.history.pop();
    }
    
    // Limit length
    if (this.history.length > MAX_TRAIL_POINTS) {
      this.history.length = MAX_TRAIL_POINTS;
    }

    this._updateGeometry(now);
  }

  _updateGeometry(now) {
    if (this.history.length < 2) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    const positions = this.geometry.attributes.position.array;
    const uvs = this.geometry.attributes.uv.array;
    
    let index = 0;
    let uvIndex = 0;
    
    // Rebuild track
    for (let i = 0; i < this.history.length; i++) {
      const p = this.history[i];
      const age = now - p.time;
      const lifeRatio = 1.0 - (age / this.maxAge);
      
      if (lifeRatio < 0) continue;

      // Top vertex
      positions[index++] = p.top.x;
      positions[index++] = p.top.y;
      positions[index++] = p.top.z;
      
      uvs[uvIndex++] = lifeRatio; // Use U for fade
      uvs[uvIndex++] = 0;

      // Bottom vertex
      positions[index++] = p.bottom.x;
      positions[index++] = p.bottom.y;
      positions[index++] = p.bottom.z;
      
      uvs[uvIndex++] = lifeRatio;
      uvs[uvIndex++] = 1;
    }
    
    this.geometry.setDrawRange(0, this.history.length * 2);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
  }
}
