import * as THREE from "three";

export default class ParkourSystem {
  constructor(scene, player, bit) {
    this.scene = scene;
    this.player = player;
    this.bit = bit;
    
    this.platforms = [];
    this.isActive = false;
    this.glitchTimer = 0;
    this.isGlitching = false; // Red state
    
    this.materialSafe = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
    this.materialUnsafe = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.3, wireframe: true });
  }
  
  startLevel(difficulty) {
      this.cleanup();
      this.isActive = true;
      this.generatePlatforms(10 + difficulty * 2);
      
      console.log("Parkour Sequence Initiated");
      if (this.bit) this.bit.setSafe(true); // Green initially
  }
  
  generatePlatforms(count) {
      let currentPos = this.player.position.clone().add(new THREE.Vector3(0, 5, 10));
      
      for (let i = 0; i < count; i++) {
          const w = 3 + Math.random() * 2;
          const d = 3 + Math.random() * 2;
          const geo = new THREE.BoxGeometry(w, 0.5, d);
          const mesh = new THREE.Mesh(geo, this.materialSafe.clone());
          
          mesh.position.copy(currentPos);
          this.scene.add(mesh);
          this.platforms.push({ mesh, collider: new THREE.Box3().setFromObject(mesh) });
          
          // Next position logic
          currentPos.add(new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.2) * 4, // Mostly up
              8 + Math.random() * 4
          ));
      }
      
      // Goal Platform
      const goalGeo = new THREE.CylinderGeometry(3, 3, 0.5, 6);
      const goalMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
      const goal = new THREE.Mesh(goalGeo, goalMat);
      goal.position.copy(currentPos);
      this.scene.add(goal);
      this.goal = { mesh: goal, radius: 3 };
  }
  
  update(deltaTime) {
      if (!this.isActive) return;
      
      // Glitch Cycle (5s Safe, 2s Glitch)
      this.glitchTimer += deltaTime;
      if (!this.isGlitching && this.glitchTimer > 5) {
          this.toggleGlitch(true);
      } else if (this.isGlitching && this.glitchTimer > 2) {
          this.toggleGlitch(false);
      }
      
      // Check Fall
      if (this.player.position.y < -30) {
          this.handleFall();
      }
      
      // Check Goal
      if (this.goal) {
          const dist = this.player.position.distanceTo(this.goal.mesh.position);
          if (dist < 4) {
              this.completeLevel();
          }
      }
  }
  
  toggleGlitch(active) {
      this.isGlitching = active;
      this.glitchTimer = 0;
      
      const mat = this.isGlitching ? this.materialUnsafe : this.materialSafe;
      
      this.platforms.forEach(p => {
          p.mesh.material = mat;
          // Disable collider if glitching?
          // We can't easily remove collider from GameMain physics loop unless we modify it.
          // For visual feedback, just change material and let Player fall through if implemented.
          // Standard physics engine checks geometry?
          // Assuming simple box colliders on player.
          // "Platforms are 'glitching' (transparent or moving)"
          // For MVP, just visual warning.
      });
      
      if (this.bit) this.bit.setSafe(!active);
  }
  
  handleFall() {
      console.log("Player fell! Teleporting to Sub-layer...");
      this.player.position.set(0, 5, 0); // Reset or sub-layer
      this.player.velocity.set(0,0,0);
      // Ideally spawn weak enemies here
  }
  
  completeLevel() {
      console.log("Parkour Complete!");
      this.cleanup();
      this.isActive = false;
      // Trigger Next Wave or Hub via callback
      if (this.onComplete) this.onComplete();
  }
  
  cleanup() {
      this.platforms.forEach(p => {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
      });
      this.platforms = [];
      if (this.goal) {
          this.scene.remove(this.goal.mesh);
          this.goal = null;
      }
  }
}
