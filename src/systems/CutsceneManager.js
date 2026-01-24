import * as THREE from "three";

export default class CutsceneManager {
  constructor(scene, camera, uiManager, inputManager) {
    this.scene = scene;
    this.camera = camera;
    this.uiManager = uiManager;
    this.inputManager = inputManager;
    
    this.isActive = false;
    this.queue = [];
    this.currentStep = null;
    this.timer = 0;
    
    this.overlay = document.createElement("div");
    this.overlay.className = "cutscene-overlay";
    Object.assign(this.overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "none",
        zIndex: "100000"
    });
    
    // Letterbox bars
    this.topBar = document.createElement("div");
    Object.assign(this.topBar.style, {
        position: "absolute", top: "0", width: "100%", height: "0%", background: "black", transition: "height 0.5s"
    });
    this.bottomBar = document.createElement("div");
    Object.assign(this.bottomBar.style, {
        position: "absolute", bottom: "0", width: "100%", height: "0%", background: "black", transition: "height 0.5s"
    });
    
    this.subtitle = document.createElement("div");
    Object.assign(this.subtitle.style, {
        position: "absolute", bottom: "15%", width: "100%", textAlign: "center",
        color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "24px",
        textShadow: "0 0 10px #00ff00", opacity: "0", transition: "opacity 0.5s"
    });
    
    this.skipHint = document.createElement("div");
    this.skipHint.innerText = "HOLD SPACE TO SKIP";
    Object.assign(this.skipHint.style, {
        position: "absolute", bottom: "5%", right: "5%",
        color: "#888", fontFamily: "monospace", fontSize: "14px", opacity: "0", transition: "opacity 0.5s"
    });
    
    this.overlay.appendChild(this.topBar);
    this.overlay.appendChild(this.bottomBar);
    this.overlay.appendChild(this.subtitle);
    this.overlay.appendChild(this.skipHint);
    document.body.appendChild(this.overlay);
    
    // Skip logic
    this.skipTimer = 0;
    this.skipDuration = 1.5;
  }
  
  startSequence(sequence) {
      if (this.isActive) return;
      this.isActive = true;
      this.queue = sequence; // Array of { duration, text, cameraPos, cameraLookAt }
      this.overlay.style.display = "block";
      
      // Animate In
      setTimeout(() => {
          this.topBar.style.height = "12%";
          this.bottomBar.style.height = "12%";
          this.skipHint.style.opacity = "1";
      }, 10);
      
      this.nextStep();
  }
  
  nextStep() {
      if (this.queue.length === 0) {
          this.endSequence();
          return;
      }
      
      this.currentStep = this.queue.shift();
      this.timer = 0;
      
      // Show Text
      if (this.currentStep.text) {
          this.subtitle.innerText = this.currentStep.text;
          this.subtitle.style.opacity = "1";
      } else {
          this.subtitle.style.opacity = "0";
      }
      
      // Camera Move (Instant for now, lerp in update)
      if (this.currentStep.cameraPos) {
          // Store start pos for lerp
          this.cameraStartPos = this.camera.position.clone();
          this.cameraStartRot = this.camera.quaternion.clone();
          
          this.targetPos = this.currentStep.cameraPos;
          this.targetLookAt = this.currentStep.cameraLookAt;
      }
  }
  
  update(deltaTime) {
      if (!this.isActive) return;
      
      // Skip Check
      if (this.inputManager.isJumpPressed()) { // Spacebar usually
          this.skipTimer += deltaTime;
          this.skipHint.style.color = "white";
          this.skipHint.innerText = `SKIPPING... ${Math.ceil((this.skipDuration - this.skipTimer)*10)/10}`;
          if (this.skipTimer > this.skipDuration) {
              this.endSequence();
              return;
          }
      } else {
          this.skipTimer = 0;
          this.skipHint.style.color = "#888";
          this.skipHint.innerText = "HOLD SPACE TO SKIP";
      }
      
      if (!this.currentStep) return;
      
      this.timer += deltaTime;
      const progress = Math.min(this.timer / this.currentStep.duration, 1.0);
      
      // Camera Animation (Simple Lerp)
      if (this.targetPos) {
          this.camera.position.lerpVectors(this.cameraStartPos, this.targetPos, progress * 0.1); // Smooth follow
          if (this.targetLookAt) {
              const dummy = new THREE.Object3D();
              dummy.position.copy(this.camera.position);
              dummy.lookAt(this.targetLookAt);
              this.camera.quaternion.slerp(dummy.quaternion, deltaTime * 2);
          }
      }
      
      if (this.timer >= this.currentStep.duration) {
          this.nextStep();
      }
  }
  
  endSequence() {
      this.isActive = false;
      this.queue = [];
      this.topBar.style.height = "0%";
      this.bottomBar.style.height = "0%";
      this.subtitle.style.opacity = "0";
      this.skipHint.style.opacity = "0";
      
      setTimeout(() => {
          this.overlay.style.display = "none";
      }, 500);
      
      if (this.onComplete) this.onComplete();
  }
}
