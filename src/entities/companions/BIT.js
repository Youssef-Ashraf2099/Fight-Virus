import * as THREE from "three";

export default class BIT {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    this.group = new THREE.Group();
    this.scene.add(this.group);
    
    this.isSafe = true;
    this.lightColor = new THREE.Color(0x00ff00);
    this.targetColor = new THREE.Color(0x00ff00);
    
    // Jokes / Dialogue
    this.jokes = [
        "I've seen 404 errors with better aim than you.",
        "Checking your 'Style' folder... Error: Folder is empty.",
        "Optimizing... deleting user skill... done.",
        "Warning: Player reaction time exceeds acceptable latency.",
        " buffering... buffering... just kidding.",
        "Defragmenting your ego...",
        "If I had a GPU, I'd render a better player."
    ];
    this.jokeTimer = 0;
    this.jokeInterval = 20; // Seconds between potential jokes
    
    this.buildMesh();
  }
  
  buildMesh() {
      // Core (Octahedron)
      // Core (Octahedron) - Techy look with emissive glow
      const coreGeo = new THREE.OctahedronGeometry(0.3, 0);
      const coreMat = new THREE.MeshPhongMaterial({
          color: 0x222222,
          emissive: 0x00ff00,
          emissiveIntensity: 0.2,
          shininess: 100,
          specular: 0xffffff
      });
      this.core = new THREE.Mesh(coreGeo, coreMat);
      this.group.add(this.core);
      
      // Eye (Glowing ring)
      const eyeGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
      this.eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      this.eye = new THREE.Mesh(eyeGeo, this.eyeMat);
      this.eye.rotation.x = Math.PI / 2;
      this.group.add(this.eye);
      
      // Wings / Floating bits
      const wingGeo = new THREE.BoxGeometry(0.5, 0.05, 0.2);
      const wing1 = new THREE.Mesh(wingGeo, coreMat);
      wing1.position.set(0.4, 0, 0);
      this.group.add(wing1);
      
      const wing2 = new THREE.Mesh(wingGeo, coreMat);
      wing2.position.set(-0.4, 0, 0);
      this.group.add(wing2);
      
      // Light
      this.light = new THREE.PointLight(0x00ff00, 1, 10);
      this.light.position.set(0, 0, 0);
      this.light.castShadow = false; // Perf opt
      this.group.add(this.light);
  }
  
  setSafe(safe) {
      if (this.isSafe === safe) return;
      this.isSafe = safe;
      
      if (this.isSafe) {
          this.targetColor.setHex(0x00ff00); // Green
      } else {
          this.targetColor.setHex(0xff0000); // Red
      }
  }
  
  update(deltaTime) {
      // Color transition
      this.lightColor.lerp(this.targetColor, deltaTime * 5);
      this.light.color.copy(this.lightColor);
      this.eyeMat.color.copy(this.lightColor);
      
      // Pulse light if unsafe
      if (!this.isSafe) {
          const pulse = 1 + Math.sin(performance.now() / 200) * 0.5;
          this.light.intensity = pulse;
      } else {
          this.light.intensity = 1;
      }
      
      // Follow Logic (Float over shoulder)
      if (this.player && this.player.camera) {
          const targetPos = this.player.camera.position.clone();
          // Offset: Up and Left
          // Need camera direction
          const dir = new THREE.Vector3();
          this.player.camera.getWorldDirection(dir);
          const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0));
          
          targetPos.add(new THREE.Vector3(0, 0.5, 0)); // Up
          targetPos.add(right.multiplyScalar(-0.8)); // Left
          targetPos.add(dir.multiplyScalar(-0.5)); // Back slightly
          
          // Smooth Lerp
          this.group.position.lerp(targetPos, deltaTime * 3);
          
          // Face player or look forward?
          // Look at player for interaction, look forward for flashlight mode
          // Let's look 'at' where player is looking
          const lookTarget = this.player.camera.position.clone().add(dir.multiplyScalar(5));
          this.group.lookAt(lookTarget);
      }
      
      // Bobbing
      const time = performance.now() / 1000;
      this.group.position.y += Math.sin(time * 2) * 0.002;
      
      // Jokes
      this.jokeTimer += deltaTime;
      if (this.jokeTimer > this.jokeInterval) {
          if (Math.random() < 0.3) {
              this.sayLine();
          }
          this.jokeTimer = 0;
      }
  }
  
  sayLine() {
      const line = this.jokes[Math.floor(Math.random() * this.jokes.length)];
      console.log(`[BIT]: ${line}`);
      
      // TODO: Display in UI via UIManager
      if (window.uiManager && window.uiManager.showMessage) {
          window.uiManager.showMessage(`[BIT] ${line}`, 3000);
      }
  }
}
