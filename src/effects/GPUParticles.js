import * as THREE from "three";

const MAX_PARTICLES = 10000;

export default class GPUParticles {
  constructor(scene) {
    this.scene = scene;
    this.particleCursor = 0;
    
    // Geometry
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const startTimes = new Float32Array(MAX_PARTICLES);
    const lifetimes = new Float32Array(MAX_PARTICLES);
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('startTime', new THREE.BufferAttribute(startTimes, 1));
    this.geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    // Material
    this.material = new THREE.ShaderMaterial({
        vertexShader: `
            uniform float uTime;
            attribute vec3 velocity;
            attribute vec3 color;
            attribute float startTime;
            attribute float lifetime;
            
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                vColor = color;
                
                float t = uTime - startTime;
                
                if (t < 0.0 || t > lifetime) {
                    // Hide particle (degenerate)
                    gl_Position = vec4(20000.0, 20000.0, 20000.0, 1.0); 
                    return;
                }
                
                // Physics: P = P0 + V*t + 0.5*G*t^2
                vec3 pos = position + velocity * t;
                pos.y -= 0.5 * 5.0 * t * t; // Gravity = 5
                
                vAlpha = 1.0 - (t / lifetime);
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (100.0 / -mvPosition.z); // Size attenuation
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                if (vAlpha <= 0.0) discard;
                
                // Circular particle
                vec2 coord = gl_PointCoord - vec2(0.5);
                if (length(coord) > 0.5) discard;
                
                gl_FragColor = vec4(vColor, vAlpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Always render
    this.scene.add(this.points);
  }
  
  update(deltaTime) {
      this.material.uniforms.uTime.value = performance.now() / 1000;
  }
  
  spawnExplosion(position, colorHex, count = 20) {
      const now = performance.now() / 1000;
      const color = new THREE.Color(colorHex);
      
      const positions = this.geometry.attributes.position.array;
      const velocities = this.geometry.attributes.velocity.array;
      const colors = this.geometry.attributes.color.array;
      const startTimes = this.geometry.attributes.startTime.array;
      const lifetimes = this.geometry.attributes.lifetime.array;
      
      let ptr = this.particleCursor;
      
      for (let i = 0; i < count; i++) {
          const idx = ptr;
          ptr = (ptr + 1) % MAX_PARTICLES;
          
          // Position
          positions[idx * 3] = position.x;
          positions[idx * 3 + 1] = position.y;
          positions[idx * 3 + 2] = position.z;
          
          // Velocity (Random sphere)
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = 5 + Math.random() * 10;
          
          velocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
          velocities[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
          velocities[idx * 3 + 2] = Math.cos(phi) * speed;
          
          // Color
          colors[idx * 3] = color.r;
          colors[idx * 3 + 1] = color.g;
          colors[idx * 3 + 2] = color.b;
          
          // Timing
          startTimes[idx] = now;
          lifetimes[idx] = 0.5 + Math.random() * 0.5;
      }
      
      this.particleCursor = ptr;
      
      // Mark updates
      // Optimized: Just mark needing update? Since ring buffer wraps, maybe update whole?
      // Updating 10k floats is fast.
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.velocity.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.startTime.needsUpdate = true;
      this.geometry.attributes.lifetime.needsUpdate = true;
      
      // Ideally use addUpdateRange, but it's tricky with wrapping.
      // Modern browsers handle full buffer upload OK if usage is DYNAMIC.
      // But we can optimize later.
  }
}
